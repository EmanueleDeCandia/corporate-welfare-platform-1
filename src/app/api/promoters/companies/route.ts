import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db, initDb } from "@/db";
import { companies, users, venues, welfarePlans } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { hashPassword, randomCode, slugify } from "@/lib/utils";

export async function GET() {
  try {
    await initDb();
    const me = await getCurrentUser();
    if (!me || (me.role !== "promoter" && me.role !== "admin")) {
      return NextResponse.json({ error: "Accesso non autorizzato" }, { status: 403 });
    }

    const allCompanies = await db.select().from(companies);
    return NextResponse.json({ companies: allCompanies });
  } catch (error) {
    console.error("GET /api/promoters/companies error:", error);
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
      vatNumber,
      city,
      sector = "Manifattura & Servizi",
      employeesCount = 50,
      fundedAmountCents,
      description,
      localImpactDescription,
      reportUrl,
      sponsoredVenueId = null,
      accent = "#1C3A2E",
      managerFirstName = "Referente",
      managerLastName = "Welfare",
      managerEmail,
      managerPassword,
    } = body;

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json({ error: "La ragione sociale dell'impresa è obbligatoria." }, { status: 400 });
    }

    if (!vatNumber || typeof vatNumber !== "string" || vatNumber.trim().length === 0) {
      return NextResponse.json({ error: "La Partita IVA dell'impresa è obbligatoria." }, { status: 400 });
    }

    if (!city || typeof city !== "string" || city.trim().length === 0) {
      return NextResponse.json({ error: "La città della sede legale è obbligatoria." }, { status: 400 });
    }

    if (!managerEmail || typeof managerEmail !== "string" || !managerEmail.includes("@")) {
      return NextResponse.json({ error: "L'indirizzo email del referente HR è obbligatorio." }, { status: 400 });
    }

    if (!managerPassword || typeof managerPassword !== "string" || managerPassword.length < 6) {
      return NextResponse.json({ error: "La password dell'account referente deve contenere almeno 6 caratteri." }, { status: 400 });
    }

    // Verifica se l'email referente è già registrata
    const [existingUser] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, managerEmail.trim().toLowerCase()))
      .limit(1);

    if (existingUser) {
      return NextResponse.json({ error: "Esiste già un account con questo indirizzo email." }, { status: 409 });
    }

    // Dati effettivi e formule non arbitrarie:
    // 1. Dipendenti nel piano: valore reale inserito
    const numEmployees = Math.max(1, Number(employeesCount) || 50);

    // 2. Welfare finanziato: valore reale inserito (default 75€/dipendente = 50€ soggiorno + 25€ cena)
    const numFundedAmountCents =
      fundedAmountCents && typeof fundedAmountCents === "number" && fundedAmountCents > 0
        ? fundedAmountCents
        : numEmployees * 7500;

    // 3. Ridistribuito: calcolo esatto = Welfare finanziato * 5,1 (moltiplicatore economico locale dei borghi)
    const localRedistributionCents = Math.round(numFundedAmountCents * 5.1);

    // 4. CO2 evitata:
    // NOTA PRODUZIONE: In una fase successiva per la produzione, il server è predisposto per calcolare
    // la CO2 evitata in tempo reale come: numero ordini dei dipendenti Filiera Corta * 15 Kg.
    // In fase di censimento/iscrizione iniziale dell'impresa viene fissata la stima di 15 Kg per quota dipendente.
    const initialCo2SavedKg = Math.round(numEmployees * 15);

    // Generazione slug univoco
    let baseSlug = slugify(name);
    if (!baseSlug) baseSlug = `impresa-${Date.now()}`;
    let finalSlug = baseSlug;
    let slugExists = await db.select({ id: companies.id }).from(companies).where(eq(companies.slug, finalSlug));
    let counter = 1;
    while (slugExists.length > 0) {
      finalSlug = `${baseSlug}-${counter}`;
      slugExists = await db.select({ id: companies.id }).from(companies).where(eq(companies.slug, finalSlug));
      counter++;
    }

    const companyDesc =
      description && typeof description === "string" && description.trim().length > 0
        ? description.trim()
        : `${name.trim()} finanzia il welfare territoriale dei propri dipendenti e sostiene i borghi e le filiere locali tramite il circuito RADICI.`;

    const impactDesc =
      localImpactDescription && typeof localImpactDescription === "string" && localImpactDescription.trim().length > 0
        ? localImpactDescription.trim()
        : `${name.trim()} ha destinato il proprio budget welfare per generare un indotto diretto a favore delle aziende agricole a conduzione familiare e dei teatri storici del territorio, promuovendo il turismo rigenerativo e la filiera corta.`;

    const report =
      reportUrl && typeof reportUrl === "string" && reportUrl.trim().length > 0
        ? reportUrl.trim()
        : null;

    // Inserimento Impresa CSR
    const [insertedCompany] = await db
      .insert(companies)
      .values({
        name: name.trim(),
        slug: finalSlug,
        vatNumber: vatNumber.trim().toUpperCase(),
        city: city.trim(),
        sector: sector.trim(),
        employeesCount: numEmployees,
        fundedAmountCents: numFundedAmountCents,
        impactRating: 94,
        localRedistributionCents,
        co2SavedKg: initialCo2SavedKg,
        description: companyDesc,
        localImpactDescription: impactDesc,
        reportUrl: report,
        accent: accent || "#1C3A2E",
      })
      .returning();

    // Collegamento opzionale struttura sponsorizzata (Hotel, Agriturismo, Ristorante, Teatro, ecc.)
    if (sponsoredVenueId && typeof sponsoredVenueId === "number" && sponsoredVenueId > 0) {
      await db
        .update(venues)
        .set({ sponsorCompanyId: insertedCompany.id })
        .where(eq(venues.id, sponsoredVenueId));
    }

    // Creazione Piano Welfare Attivo per l'anno in corso
    const currentYear = new Date().getFullYear();
    await db.insert(welfarePlans).values({
      companyId: insertedCompany.id,
      year: currentYear,
      validFrom: new Date(`${currentYear}-01-01T00:00:00Z`),
      validUntil: new Date(`${currentYear}-12-31T23:59:59Z`),
      eligibleEmployees: numEmployees,
      overnightAmountCents: 5000,
      dinnerAmountCents: 2500,
      status: "active",
    });

    // Creazione Account Referente HR (Ruolo 'csr')
    const [newUser] = await db
      .insert(users)
      .values({
        email: managerEmail.trim().toLowerCase(),
        passwordHash: hashPassword(managerPassword),
        firstName: managerFirstName.trim() || "Referente",
        lastName: managerLastName.trim() || "HR",
        role: "csr",
        companyId: insertedCompany.id,
        referralCode: randomCode("csr"),
      })
      .returning();

    return NextResponse.json(
      {
        ok: true,
        company: insertedCompany,
        user: {
          id: newUser.id,
          email: newUser.email,
          firstName: newUser.firstName,
          lastName: newUser.lastName,
          role: newUser.role,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/promoters/companies error:", error);
    return NextResponse.json({ error: "Errore durante la creazione dell'impresa CSR." }, { status: 500 });
  }
}
