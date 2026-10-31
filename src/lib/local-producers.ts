import { eq } from "drizzle-orm";
import { db, initDb, sqlite } from "@/db";
import {
  destinations,
  localProducts,
  localProducers,
  notifications,
  transactions,
  venues,
  type LocalProduct,
  type LocalProducer,
  type Venue,
} from "@/db/schema";
import { randomCode } from "@/lib/utils";

/** Fattore di emissione evitata per la filiera corta: 0,300 kg CO2 per ogni km non percorso. */
export const CO2_KG_PER_KM = 0.3;
export const DEFAULT_BASKET_PRICE_CENTS = 4000; // 40 €
export const DEFAULT_KM_AVOIDED = 50;
export const DEFAULT_DISCOUNT_BPS = 1000; // 10%

export type LocalProducerStats = {
  producerId: number;
  venueId: number;
  discountBps: number;
  basketsSold: number;
  kmAvoidedTotal: number;
  co2AvoidedKg: number;
  volumeCents: number;
};

export type LocalProducerRow = {
  venue: Venue;
  producer: LocalProducer;
  products: LocalProduct[];
  stats: LocalProducerStats;
};

function statsFromRow(row: Record<string, unknown>): LocalProducerStats {
  return {
    producerId: Number(row.producer_id),
    venueId: Number(row.venue_id),
    discountBps: Number(row.discount_bps),
    basketsSold: Number(row.baskets_sold ?? 0),
    kmAvoidedTotal: Number(row.km_avoided_total ?? 0),
    co2AvoidedKg: Number(row.co2_avoided_kg ?? 0),
    volumeCents: Number(row.volume_cents ?? 0),
  };
}

/** Tutti i produttori locali con statistiche calcolate lato server dalla view v_local_producer_stats. */
export async function getLocalProducers(): Promise<LocalProducerRow[]> {
  await initDb();
  const rows = await db
    .select({ venue: venues, producer: localProducers })
    .from(localProducers)
    .innerJoin(venues, eq(localProducers.venueId, venues.id))
    .orderBy(venues.name);
  const products = await db.select().from(localProducts);
  const statsRows = sqlite.prepare(`SELECT * FROM v_local_producer_stats`).all() as Record<string, unknown>[];
  const statsByProducer = new Map(statsRows.map((row) => [Number(row.producer_id), statsFromRow(row)]));
  return rows.map((row) => ({
    venue: row.venue,
    producer: row.producer,
    products: products.filter((p) => p.producerId === row.producer.id),
    stats: statsByProducer.get(row.producer.id) ?? {
      producerId: row.producer.id,
      venueId: row.venue.id,
      discountBps: row.producer.discountBps,
      basketsSold: 0,
      kmAvoidedTotal: 0,
      co2AvoidedKg: 0,
      volumeCents: 0,
    },
  }));
}

export async function getLocalProducerByVenueId(venueId: number): Promise<LocalProducerRow | null> {
  await initDb();
  const [row] = await db
    .select({ venue: venues, producer: localProducers })
    .from(localProducers)
    .innerJoin(venues, eq(localProducers.venueId, venues.id))
    .where(eq(localProducers.venueId, venueId))
    .limit(1);
  if (!row) return null;
  const products = await db.select().from(localProducts).where(eq(localProducts.producerId, row.producer.id));
  const [statsRow] = sqlite
    .prepare(`SELECT * FROM v_local_producer_stats WHERE producer_id = ?`)
    .all(row.producer.id) as Record<string, unknown>[];
  return {
    venue: row.venue,
    producer: row.producer,
    products,
    stats: statsRow
      ? statsFromRow(statsRow)
      : { producerId: row.producer.id, venueId: row.venue.id, discountBps: row.producer.discountBps, basketsSold: 0, kmAvoidedTotal: 0, co2AvoidedKg: 0, volumeCents: 0 },
  };
}

export async function getLocalProducerBySlug(slug: string): Promise<LocalProducerRow | null> {
  await initDb();
  const [venue] = await db.select().from(venues).where(eq(venues.slug, slug)).limit(1);
  if (!venue || venue.type !== "producer") return null;
  return getLocalProducerByVenueId(venue.id);
}

export type BuyResult = {
  transaction: typeof transactions.$inferSelect;
  product: LocalProduct;
  discountCents: number;
  amountCents: number;
  kmAvoided: number;
  co2AvoidedKg: number;
  stats: LocalProducerStats;
};

/**
 * Acquisto di un cesto KM 0. Lo sconto dell'iniziativa "Welfare & KM 0" (discountBps del
 * produttore, default 10%) si applica a TUTTI: dipendenti, amici invitati e nuovi iscritti.
 * Aggiorna i cestini venduti e ricalcola km/CO2 lato server.
 */
export async function buyLocalProduct(input: {
  userId: number;
  venueId: number;
  productId: number;
  quantity?: number;
  inviteId?: number | null;
  idempotencyKey?: string;
}): Promise<BuyResult> {
  await initDb();
  const quantity = Math.max(1, Math.min(10, Math.floor(input.quantity ?? 1)));
  const producerRow = await getLocalProducerByVenueId(input.venueId);
  if (!producerRow) throw new Error("Produttore locale non trovato.");
  const product = producerRow.products.find((p) => p.id === input.productId && p.active);
  if (!product) throw new Error("Prodotto non disponibile.");

  const discountBps = producerRow.producer.discountBps || DEFAULT_DISCOUNT_BPS;
  const listPriceCents = product.priceCents * quantity;
  const discountCents = Math.round((listPriceCents * discountBps) / 10000);
  const amountCents = listPriceCents - discountCents;
  const kmAvoided = product.kmAvoided * quantity;
  const co2AvoidedKg = Math.round(CO2_KG_PER_KM * kmAvoided * 1000) / 1000;

  const key = input.idempotencyKey ?? `km0:${input.productId}:${input.userId}:${Date.now()}`;
  const [tx] = await db
    .insert(transactions)
    .values({
      kind: "consumer_payment",
      status: "receipted",
      userId: input.userId,
      venueId: input.venueId,
      inviteId: input.inviteId ?? null,
      offeringId: null,
      amountCents,
      discountCents,
      listPriceCents,
      serviceLabel: `Cesto KM 0 · ${product.name} × ${quantity} · initiative ${producerRow.producer.initiative}`,
      paymentStatus: "settled",
      commissionBps: 0,
      commissionCents: 0,
      providerNetCents: amountCents,
      paymentSettledAt: new Date(),
      idempotencyKey: key,
    })
    .returning();

  await db
    .update(localProducts)
    .set({ basketsSold: product.basketsSold + quantity })
    .where(eq(localProducts.id, product.id));

  await db.insert(notifications).values({
    venueId: input.venueId,
    type: "km0",
    title: "Nuova vendita Filiera Corta KM 0",
    body: `Cesto "${product.name}" × ${quantity} venduto con sconto initiative ${discountBps / 100}%. KM evitati: ${kmAvoided} · CO2 evitata: ${co2AvoidedKg.toFixed(3)} kg.`,
    payload: {
      productId: product.id,
      quantity,
      amountCents,
      discountCents,
      kmAvoided,
      co2AvoidedKg,
      transactionId: tx.id,
    },
    transactionId: tx.id,
  });

  const updated = await getLocalProducerByVenueId(input.venueId);
  return {
    transaction: tx,
    product: { ...product, basketsSold: product.basketsSold + quantity },
    discountCents,
    amountCents,
    kmAvoided,
    co2AvoidedKg,
    stats: updated!.stats,
  };
}

function slugify(name: string) {
  const base = name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  return `${base || "produttore"}-${randomCode("id").slice(-6)}`;
}

/** Crea un nuovo Produttore Locale KM 0 (usato dal Control Room Gruppo Illiria & Startup RADICI). */
export async function createLocalProducer(input: {
  name: string;
  city?: string;
  destinationId: number;
  productName?: string;
  priceCents?: number;
  kmAvoided?: number;
  discountBps?: number;
  description?: string;
}) {
  await initDb();
  const [dest] = await db.select().from(destinations).where(eq(destinations.id, input.destinationId)).limit(1);
  if (!dest) throw new Error("Destinazione non valida.");

  const priceCents = Math.max(3000, Math.min(6000, Math.round(input.priceCents ?? DEFAULT_BASKET_PRICE_CENTS)));
  const kmAvoided = Math.max(30, Math.min(70, Math.round(input.kmAvoided ?? DEFAULT_KM_AVOIDED)));
  const discountBps = Math.max(0, Math.min(10000, Math.round(input.discountBps ?? DEFAULT_DISCOUNT_BPS)));
  const city = input.city?.trim() || dest.name;

  const [venue] = await db
    .insert(venues)
    .values({
      name: input.name,
      slug: slugify(input.name),
      type: "producer",
      destinationId: dest.id,
      city,
      province: dest.region.slice(0, 2).toUpperCase(),
      region: dest.region,
      description:
        input.description?.trim() ||
        `Produttore locale della filiera corta KM 0 a ${city}: cestini agroalimentari con consegna diretta in azienda tramite la flotta del Gruppo Illiria.`,
      longDescription:
        `Iniziativa "Welfare & KM 0" promossa da Gruppo Illiria e Startup RADICI: ${input.name} porta prodotti freschi e locali direttamente nelle imprese CSR con la flotta del Gruppo Illiria, abbattendo le emissioni di CO2 (0,300 kg per ogni km non percorso) e valorizzando la filiera locale.`,
      lat: dest.lat + (Math.random() - 0.5) * 0.08,
      lng: dest.lng + (Math.random() - 0.5) * 0.08,
      coverImage: "/images/produttore-cesto.jpg?v=2",
      gallery: ["/images/produttore-cesto.jpg?v=2", "/images/produttore-orto.jpg?v=2", "/images/produttore-verdure.jpg?v=2"],
      services: ["Consegna in azienda con flotta Gruppo Illiria", `Sconto initiative Welfare & KM 0 del ${discountBps / 100}%`, `${kmAvoided} km evitati per cesto`],
      checkinCode: randomCode("chk"),
      impactPointsGenerated: 1,
      localSupportPercent: 100,
    })
    .returning();

  const [producer] = await db
    .insert(localProducers)
    .values({ venueId: venue.id, discountBps })
    .returning();

  const [product] = await db
    .insert(localProducts)
    .values({
      producerId: producer.id,
      name: input.productName?.trim() || "Cesto della Filiera Corta",
      description: `Cesto agroalimentare locale: ${kmAvoided} km di percorso evitati (0,300 kg CO2 × km) e consegna KM 0.`,
      priceCents,
      kmAvoided,
    })
    .returning();

  return { venue, producer, product };
}
