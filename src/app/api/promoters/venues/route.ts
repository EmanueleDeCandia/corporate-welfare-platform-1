import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db, initDb } from "@/db";
import { destinations, users, venueOfferings, venues } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { hashPassword, randomCode, slugify } from "@/lib/utils";

export async function GET() {
  try {
    await initDb();
    const me = await getCurrentUser();
    if (!me || (me.role !== "promoter" && me.role !== "admin")) {
      return NextResponse.json({ error: "Accesso non autorizzato" }, { status: 403 });
    }

    const allVenues = await db.select().from(venues);
    return NextResponse.json({ venues: allVenues });
  } catch (error) {
    console.error("GET /api/promoters/venues error:", error);
    return NextResponse.json({ error: "Errore interno del server" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await initDb();
    const me = await getCurrentUser();
    if (!me || (me.role !== "promoter" && me.role !== "admin")) {
      return NextResponse.json({ error: "Accesso riservato alla Startup Promotrice RADICI" }, { status: 403 });
    }

    const body = await req.json();
    const {
      name,
      type,
      destinationId,
      city,
      province,
      region: inputRegion,
      description,
      longDescription,
      coverImage: inputCover,
      priceHotelCents = 0,
      priceAperitivoCents = 0,
      priceShowCents = 0,
      basketName,
      basketDescription,
      priceBasketCents = 0,
      dailyCapacity = 10,
      sponsorCompanyId = null,
      services = [],
      lat: inputLat,
      lng: inputLng,
      managerFirstName,
      managerLastName,
      managerEmail,
      managerPassword,
    } = body;

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json({ error: "Il nome della struttura è obbligatorio." }, { status: 400 });
    }

    if (!type || !["hotel", "agriturismo", "restaurant", "producer", "theater"].includes(type)) {
      return NextResponse.json({ error: "Tipologia di struttura non valida." }, { status: 400 });
    }

    if (!destinationId || typeof destinationId !== "number") {
      return NextResponse.json({ error: "Seleziona una destinazione valida del circuito." }, { status: 400 });
    }

    if (!city || typeof city !== "string" || !province || typeof province !== "string") {
      return NextResponse.json({ error: "Città e provincia sono obbligatorie." }, { status: 400 });
    }

    if (!description || typeof description !== "string") {
      return NextResponse.json({ error: "La descrizione della struttura è obbligatoria." }, { status: 400 });
    }

    // Validazione credenziali account se specificate
    if (managerEmail && typeof managerEmail === "string" && managerEmail.trim().length > 0) {
      const trimmedEmail = managerEmail.trim().toLowerCase();
      if (!trimmedEmail.includes("@")) {
        return NextResponse.json({ error: "L'indirizzo email del referente non è valido." }, { status: 400 });
      }
      if (!managerPassword || typeof managerPassword !== "string" || managerPassword.length < 6) {
        return NextResponse.json({ error: "La password del referente deve contenere almeno 6 caratteri." }, { status: 400 });
      }
      const [existingUser] = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.email, trimmedEmail))
        .limit(1);
      if (existingUser) {
        return NextResponse.json({ error: "Esiste già un account con questo indirizzo email." }, { status: 409 });
      }
    }

    // Verifica destinazione
    const [dest] = await db.select().from(destinations).where(eq(destinations.id, destinationId));
    if (!dest) {
      return NextResponse.json({ error: "Destinazione territoriale non trovata." }, { status: 404 });
    }

    const region = inputRegion && typeof inputRegion === "string" ? inputRegion.trim() : dest.region;
    const lat = typeof inputLat === "number" ? inputLat : dest.lat;
    const lng = typeof inputLng === "number" ? inputLng : dest.lng;

    // Generazione slug univoco
    let baseSlug = slugify(name);
    if (!baseSlug) baseSlug = `struttura-${Date.now()}`;
    let finalSlug = baseSlug;
    let slugExists = await db.select({ id: venues.id }).from(venues).where(eq(venues.slug, finalSlug));
    let counter = 1;
    while (slugExists.length > 0) {
      finalSlug = `${baseSlug}-${counter}`;
      slugExists = await db.select({ id: venues.id }).from(venues).where(eq(venues.slug, finalSlug));
      counter++;
    }

    // Generazione checkinCode univoco
    const prefix = type === "producer" ? "prod" : "venue";
    let checkinCode = `${prefix}-${finalSlug}`;
    let codeExists = await db.select({ id: venues.id }).from(venues).where(eq(venues.checkinCode, checkinCode));
    while (codeExists.length > 0) {
      checkinCode = `${prefix}-${finalSlug}-${Math.floor(100 + Math.random() * 900)}`;
      codeExists = await db.select({ id: venues.id }).from(venues).where(eq(venues.checkinCode, checkinCode));
    }

    // Default cover image in base alla tipologia se non fornita
    let coverImage = inputCover;
    if (!coverImage || typeof coverImage !== "string" || coverImage.trim().length === 0) {
      switch (type) {
        case "agriturismo":
          coverImage = "/images/agriturismo-valle.jpg";
          break;
        case "hotel":
          coverImage = "/images/langhe.jpg";
          break;
        case "restaurant":
          coverImage = "/images/val-dorcia.jpg";
          break;
        case "producer":
          coverImage = "/images/agriturismo-fontebella.jpg";
          break;
        case "theater":
          coverImage = "/images/lauro-rossi.jpg";
          break;
        default:
          coverImage = "/images/marche.jpg";
      }
    }

    // Setup menù e stanze per la pagina pubblica /strutture/[slug]
    const aperitivoMenu =
      priceAperitivoCents > 0
        ? [
            {
              name: "Degustazione Tipica Radici",
              description: `Aperitivo con prodotti a km 0 del territorio e calice locale selezionato da ${name}.`,
              priceCents: priceAperitivoCents,
            },
          ]
        : [];

    const rooms =
      priceHotelCents > 0
        ? [
            {
              name: "Camera Matrimoniale Comfort",
              description: "Vista sulle colline, bagno privato, colazione inclusa con dolci e prodotti del territorio.",
              capacity: 2,
              priceCents: priceHotelCents,
            },
          ]
        : [];

    const newVenueValues = {
      name: name.trim(),
      slug: finalSlug,
      type,
      destinationId,
      city: city.trim(),
      province: province.trim().toUpperCase(),
      region,
      description: description.trim(),
      longDescription: (longDescription && typeof longDescription === "string" ? longDescription.trim() : description.trim()),
      lat,
      lng,
      coverImage: coverImage.trim(),
      gallery: [coverImage.trim()],
      services: Array.isArray(services) && services.length > 0 ? services : ["Wi-Fi", "Parcheggio", "Prodotti Tipici KM 0"],
      aperitivoMenu,
      rooms,
      priceHotelCents: Math.max(0, Math.round(priceHotelCents)),
      priceAperitivoCents: Math.max(0, Math.round(priceAperitivoCents)),
      priceShowCents: Math.max(0, Math.round(priceShowCents)),
      basketName: basketName && typeof basketName === "string" ? basketName.trim() : null,
      basketDescription: basketDescription && typeof basketDescription === "string" ? basketDescription.trim() : null,
      priceBasketCents: Math.max(0, Math.round(priceBasketCents)),
      checkinCode,
      sponsorCompanyId: typeof sponsorCompanyId === "number" && sponsorCompanyId > 0 ? sponsorCompanyId : null,
      impactPointsGenerated: 1,
      localSupportPercent: 10,
    };

    const [insertedVenue] = await db.insert(venues).values(newVenueValues).returning();

    // Creazione offerte correlate nel catalogo offerte (per prenotazioni e welfare)
    if (type === "hotel" || type === "agriturismo") {
      if (newVenueValues.priceHotelCents > 0) {
        await db.insert(venueOfferings).values({
          venueId: insertedVenue.id,
          benefitType: "overnight",
          name: `Soggiorno e Pernottamento - ${insertedVenue.name}`,
          description: "Pernottamento in camera padronale con colazione a filiera corta inclusa.",
          listPriceCents: newVenueValues.priceHotelCents,
          acceptsWelfare: true,
          dailyCapacity: Number(dailyCapacity) || 10,
        });
      }
      if (newVenueValues.priceAperitivoCents > 0) {
        await db.insert(venueOfferings).values({
          venueId: insertedVenue.id,
          benefitType: "dinner",
          name: `Cena / Degustazione Territoriale - ${insertedVenue.name}`,
          description: "Degustazione tipica con prodotti biologici della cascina e vino locale.",
          listPriceCents: newVenueValues.priceAperitivoCents,
          acceptsWelfare: true,
          dailyCapacity: Number(dailyCapacity) || 15,
        });
      }
    } else if (type === "restaurant" && newVenueValues.priceAperitivoCents > 0) {
      await db.insert(venueOfferings).values({
        venueId: insertedVenue.id,
        benefitType: "dinner",
        name: `Degustazione Tipica d'Autore - ${insertedVenue.name}`,
        description: "Menù degustazione con materie prime della terra e ricette della tradizione.",
        listPriceCents: newVenueValues.priceAperitivoCents,
        acceptsWelfare: true,
        dailyCapacity: Number(dailyCapacity) || 20,
      });
    }

    // Creazione facoltativa dell'account referente (ruolo 'provider' o 'theater')
    let createdUser = null;
    if (managerEmail && managerPassword) {
      const trimmedEmail = managerEmail.trim().toLowerCase();
      const userRole = type === "theater" ? "theater" : "provider";
      const [u] = await db
        .insert(users)
        .values({
          email: trimmedEmail,
          passwordHash: hashPassword(managerPassword),
          firstName: managerFirstName && typeof managerFirstName === "string" && managerFirstName.trim() ? managerFirstName.trim() : name.trim(),
          lastName: managerLastName && typeof managerLastName === "string" && managerLastName.trim() ? managerLastName.trim() : "Gestore",
          role: userRole,
          venueId: insertedVenue.id,
          referralCode: randomCode(type === "theater" ? "teatro" : "struttura"),
        })
        .returning();

      createdUser = {
        id: u.id,
        email: u.email,
        firstName: u.firstName,
        lastName: u.lastName,
        role: u.role,
      };

      await db.update(venues).set({ providerUserId: u.id }).where(eq(venues.id, insertedVenue.id));
    }

    return NextResponse.json({ ok: true, venue: insertedVenue, user: createdUser }, { status: 201 });
  } catch (error) {
    console.error("POST /api/promoters/venues error:", error);
    return NextResponse.json({ error: "Errore durante la creazione della struttura." }, { status: 500 });
  }
}

