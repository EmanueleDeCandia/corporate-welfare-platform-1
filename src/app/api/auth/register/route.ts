import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import {
  companies,
  destinations,
  invites,
  users,
  venueOfferings,
  venues,
  vouchers,
  welfarePlans,
} from "@/db/schema";
import { createSession } from "@/lib/auth";
import { ensureSeeded } from "@/db/seed";
import { badgeForPoints, hashPassword, randomCode } from "@/lib/utils";

function toSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  await ensureSeeded();
  const body = (await request.json()) as {
    role?: "friend" | "employee" | "provider" | "csr";
    firstName?: string;
    lastName?: string;
    email?: string;
    password?: string;
    inviteCode?: string;

    // Campi specifici per Dipendente
    companyId?: number;

    // Campi specifici per Fornitore Locale
    venueName?: string;
    venueType?: "agriturismo" | "hotel" | "restaurant" | "theater";
    venueCity?: string;
    venueProvince?: string;
    venueRegion?: string;
    destinationId?: number;

    // Campi specifici per Impresa CSR
    companyName?: string;
    companyVat?: string;
    companyCity?: string;
    companySector?: string;
    companyEmployeesCount?: string | number;
    companyFundedAmountEuro?: string | number;
    companyAddress?: string;
    companySdi?: string;
  };

  const role = body.role || "friend";
  const firstName = body.firstName?.trim();
  const lastName = body.lastName?.trim();
  const email = body.email?.trim().toLowerCase();
  const password = body.password ?? "";

  if (!firstName || !lastName || !email || password.length < 6) {
    return NextResponse.json(
      { error: "Compila nome, cognome ed email. La password deve avere almeno 6 caratteri." },
      { status: 400 }
    );
  }

  // Verifica unicità email
  const [existingUser] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (existingUser) {
    return NextResponse.json({ error: "Esiste già un account con questo indirizzo email." }, { status: 409 });
  }

  let finalCompanyId: number | null = null;
  let finalVenueId: number | null = null;
  let redirectTo = "/account";

  // 1. REGISTRAZIONE GESTORE STRUTTURA / FORNITORE
  if (role === "provider") {
    const venueName = body.venueName?.trim();
    const venueType = body.venueType || "agriturismo";
    const city = body.venueCity?.trim() || "Territorio";
    const province = (body.venueProvince?.trim() || "MC").toUpperCase().slice(0, 2);
    const region = body.venueRegion?.trim() || "Marche";

    if (!venueName) {
      return NextResponse.json({ error: "Specifica il nome della tua struttura convenzionata." }, { status: 400 });
    }

    // Trova o assegna la destinazione
    let destinationId = body.destinationId;
    if (!destinationId) {
      const [dest] = await db
        .select()
        .from(destinations)
        .where(eq(destinations.region, region))
        .limit(1);
      if (dest) {
        destinationId = dest.id;
      } else {
        const [firstDest] = await db.select().from(destinations).limit(1);
        destinationId = firstDest?.id || 1;
      }
    }

    const venueSlug = toSlug(venueName) + "-" + Math.floor(100 + Math.random() * 900);
    const checkinCode = randomCode("v");

    // Inserisce la venue
    const [newVenue] = await db
      .insert(venues)
      .values({
        name: venueName,
        slug: venueSlug,
        type: venueType,
        destinationId,
        city,
        province,
        region,
        description: `${venueName} a ${city}. Servizi convenzionati per il circuito welfare e community RADICI.`,
        longDescription: `${venueName} accoglie i dipendenti delle imprese clienti con fatturazione diretta per i buoni welfare e i membri della community con sconti convenzionati.`,
        lat: 43.3,
        lng: 13.4,
        coverImage: "/images/agriturismo-valle.jpg",
        checkinCode,
        impactPointsGenerated: 1,
        localSupportPercent: 15,
        priceHotelCents: venueType === "hotel" || venueType === "agriturismo" ? 5000 : 0,
        priceAperitivoCents: 2500,
        priceShowCents: venueType === "theater" ? 5000 : 0,
      })
      .returning();

    finalVenueId = newVenue.id;

    // Crea le offerte di servizio base
    if (venueType === "agriturismo" || venueType === "hotel") {
      await db.insert(venueOfferings).values([
        {
          venueId: newVenue.id,
          benefitType: "overnight",
          name: "Pernottamento in Camera Matrimoniale",
          description: "Soggiorno convenzionato welfare per il lavoratore.",
          listPriceCents: 5000,
          acceptsWelfare: true,
          dailyCapacity: 5,
        },
        {
          venueId: newVenue.id,
          benefitType: "dinner",
          name: "Cena & Degustazione Tipica KM 0",
          description: "Menu della tradizione con prodotti della filiera agricola locale.",
          listPriceCents: 2500,
          acceptsWelfare: true,
          dailyCapacity: 10,
        },
      ]);
    } else if (venueType === "restaurant") {
      await db.insert(venueOfferings).values({
        venueId: newVenue.id,
        benefitType: "dinner",
        name: "Cena Tradizionale KM 0",
        description: "Menu del territorio convenzionato per voucher cena.",
        listPriceCents: 2500,
        acceptsWelfare: true,
        dailyCapacity: 15,
      });
    }

    redirectTo = "/fornitore";
  }

  // 2. REGISTRAZIONE IMPRESA CLIENTE (CSR)
  else if (role === "csr") {
    const companyName = body.companyName?.trim();
    const vatNumber = body.companyVat?.trim() || "0" + Math.floor(1000000000 + Math.random() * 9000000000);
    const city = body.companyCity?.trim() || "Ancona";
    const sector = body.companySector?.trim() || "Servizi & Manifattura";

    if (!companyName) {
      return NextResponse.json({ error: "Specifica la ragione sociale della tua azienda." }, { status: 400 });
    }

    const employeesCount = body.companyEmployeesCount
      ? Math.max(1, parseInt(String(body.companyEmployeesCount), 10) || 50)
      : 50;

    const fundedAmountCents = body.companyFundedAmountEuro
      ? Math.max(10000, Math.round(parseFloat(String(body.companyFundedAmountEuro)) * 100))
      : employeesCount * 7500; // Default 75€ per addetto (50€ notte + 25€ cena)

    const companySlug = toSlug(companyName) + "-" + Math.floor(100 + Math.random() * 900);

    const [newCompany] = await db
      .insert(companies)
      .values({
        name: companyName,
        slug: companySlug,
        vatNumber,
        city,
        sector,
        employeesCount,
        fundedAmountCents,
        impactRating: 90,
        localRedistributionCents: Math.round(fundedAmountCents * 0.7),
        co2SavedKg: Math.round(employeesCount * 45),
        description: `${companyName} finanzia il benessere dei propri dipendenti e sostiene l'economia del territorio tramite il circuito RADICI.`,
        accent: "#1C3A2E",
      })
      .returning();

    finalCompanyId = newCompany.id;

    // Crea il piano welfare 2026 per la nuova impresa con il numero reale di addetti
    await db.insert(welfarePlans).values({
      companyId: newCompany.id,
      year: new Date().getFullYear(),
      validFrom: new Date(`${new Date().getFullYear()}-01-01T00:00:00Z`),
      validUntil: new Date(`${new Date().getFullYear()}-12-31T23:59:59Z`),
      eligibleEmployees: employeesCount,
      overnightAmountCents: 5000,
      dinnerAmountCents: 2500,
      status: "active",
    });

    redirectTo = "/azienda";
  }

  // 3. REGISTRAZIONE DIPENDENTE WELFARE AZIENDALE
  else if (role === "employee") {
    let companyId = body.companyId;

    // Se non specificato, tenta il riconoscimento automatico dal dominio email (es. mario@acme.it -> ACME)
    if (!companyId) {
      const emailDomain = email.split("@")[1];
      const allCompanies = await db.select().from(companies);
      const matched = allCompanies.find(
        (c) =>
          emailDomain.includes(c.slug) ||
          c.name.toLowerCase().includes(emailDomain.replace(/\..+$/, ""))
      );
      if (matched) {
        companyId = matched.id;
      } else {
        // Fallback sulla prima impresa se non specificata
        companyId = allCompanies[0]?.id || 1;
      }
    }

    finalCompanyId = companyId;
    redirectTo = "/account";
  }

  // 4. REGISTRAZIONE AMICO COMMUNITY
  else {
    redirectTo = "/account";
  }

  // Gestione eventuale codice invito amico
  let invite = body.inviteCode
    ? (await db.select().from(invites).where(eq(invites.code, body.inviteCode)).limit(1))[0]
    : undefined;
  if (!invite) {
    invite = (await db.select().from(invites).where(eq(invites.email, email)).limit(1))[0];
  }

  // Inserimento utente
  const [user] = await db
    .insert(users)
    .values({
      email,
      passwordHash: hashPassword(password),
      firstName,
      lastName,
      role,
      companyId: finalCompanyId,
      venueId: finalVenueId,
      impactPoints: 0,
      badgeLevel:
        role === "csr"
          ? "CSR Manager"
          : role === "provider"
            ? "Partner Locale"
            : role === "employee"
              ? "Esploratore"
              : badgeForPoints(0).label,
      referralCode: randomCode(role === "employee" ? "welfare" : role === "provider" ? "struttura" : "amico"),
      invitedByUserId: invite?.inviterId ?? null,
    })
    .returning();

  // Se è un fornitore, collega l'utente come titolare della venue
  if (role === "provider" && finalVenueId) {
    await db.update(venues).set({ providerUserId: user.id }).where(eq(venues.id, finalVenueId));
  }

  // Se è un dipendente, assegna i 2 voucher welfare standard (1 Notte + 1 Cena) previsti dal piano
  if (role === "employee" && finalCompanyId) {
    const [plan] = await db
      .select()
      .from(welfarePlans)
      .where(and(eq(welfarePlans.companyId, finalCompanyId), eq(welfarePlans.status, "active")))
      .limit(1);

    await db.insert(vouchers).values([
      {
        planId: plan?.id ?? null,
        userId: user.id,
        companyId: finalCompanyId,
        type: "hotel",
        status: "available",
        origin: "base",
        slotIndex: 1,
        amountCents: plan?.overnightAmountCents ?? 5000,
      },
      {
        planId: plan?.id ?? null,
        userId: user.id,
        companyId: finalCompanyId,
        type: "aperitivo",
        status: "available",
        origin: "base",
        slotIndex: 1,
        amountCents: plan?.dinnerAmountCents ?? 2500,
      },
    ]);
  }

  // Aggiorna stato eventuale invito
  if (invite && invite.status === "pending") {
    await db
      .update(invites)
      .set({ status: "registered", friendUserId: user.id })
      .where(eq(invites.id, invite.id));
  }

  // Crea sessione di autenticazione automatica
  await createSession(user.id);

  return NextResponse.json(
    {
      ok: true,
      redirectTo,
      message: "Registrazione completata con successo!",
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        companyId: user.companyId,
        venueId: user.venueId,
      },
    },
    { status: 201 }
  );
}
