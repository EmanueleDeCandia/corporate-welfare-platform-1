import { NextResponse } from "next/server";
import { db } from "@/db";
import { auditLog } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { createLocalProducer } from "@/lib/local-producers";

export const dynamic = "force-dynamic";

/**
 * Control Room "Gruppo Illiria & Startup RADICI": aggiunge un Produttore Locale KM 0.
 * Solo promoter/admin (il Gruppo Illiria condivide l'account dei Promotori/Startup).
 */
export async function POST(request: Request) {
  const me = await getCurrentUser();
  if (!me || (me.role !== "promoter" && me.role !== "admin")) {
    return NextResponse.json({ error: "Area riservata al Control Room Gruppo Illiria & Startup RADICI." }, { status: 403 });
  }

  const body = (await request.json()) as {
    name?: string;
    city?: string;
    destinationId?: number | string;
    productName?: string;
    priceCents?: number | string;
    kmAvoided?: number | string;
    discountBps?: number | string;
  };

  const name = body.name?.trim();
  const destinationId = Number(body.destinationId);
  if (!name || !Number.isFinite(destinationId) || destinationId <= 0) {
    return NextResponse.json({ error: "Indica nome del produttore e destinazione." }, { status: 400 });
  }

  try {
    const { venue, producer, product } = await createLocalProducer({
      name,
      city: body.city,
      destinationId,
      productName: body.productName,
      priceCents: body.priceCents ? Number(body.priceCents) : undefined,
      kmAvoided: body.kmAvoided ? Number(body.kmAvoided) : undefined,
      discountBps: body.discountBps ? Number(body.discountBps) : undefined,
    });

    await db.insert(auditLog).values({
      actorUserId: me.id,
      action: "local_producer_create",
      entity: "local_producer",
      entityId: String(producer.id),
      dataJson: {
        venueId: venue.id,
        venueSlug: venue.slug,
        name: venue.name,
        product: product.name,
        priceCents: product.priceCents,
        kmAvoided: product.kmAvoided,
        discountBps: producer.discountBps,
      },
    });

    return NextResponse.json({
      ok: true,
      message: `${venue.name} è ora un Produttore Locale KM 0 (cesto "${product.name}", ${product.priceCents / 100} €, ${product.kmAvoided} km evitati, sconto ${producer.discountBps / 100}%).`,
      venueSlug: venue.slug,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Creazione non riuscita." },
      { status: 400 },
    );
  }
}
