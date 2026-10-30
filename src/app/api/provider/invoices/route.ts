import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { transactions, venues } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const me = await getCurrentUser();
  if (!me) {
    return NextResponse.json({ error: "Accesso non autorizzato." }, { status: 401 });
  }

  // Possono aggiornare lo stato: il fornitore titolare della venue, l'azienda committente, o promoter/admin
  const body = (await request.json()) as {
    transactionId?: number;
    invoiceNumber?: string;
    invoiceDate?: string;
    paymentStatus?: "pending" | "settled";
    paymentNotes?: string;
  };

  if (!body.transactionId) {
    return NextResponse.json({ error: "ID transazione obbligatorio." }, { status: 400 });
  }

  const [tx] = await db
    .select()
    .from(transactions)
    .where(eq(transactions.id, body.transactionId))
    .limit(1);

  if (!tx) {
    return NextResponse.json({ error: "Transazione non trovata." }, { status: 404 });
  }

  // Verifica permessi
  const isProviderOwner = me.role === "provider" && me.venueId === tx.venueId;
  const isCompanyOwner = me.role === "csr" && me.companyId === tx.companyId;
  const isPromoterOrAdmin = me.role === "promoter" || me.role === "admin";

  if (!isProviderOwner && !isCompanyOwner && !isPromoterOrAdmin) {
    return NextResponse.json(
      { error: "Non sei autorizzato a gestire gli estremi di pagamento per questa transazione." },
      { status: 403 }
    );
  }

  const updates: Partial<typeof transactions.$inferInsert> = {};

  if (body.invoiceNumber !== undefined) {
    updates.invoiceNumber = body.invoiceNumber.trim() || null;
  }
  if (body.invoiceDate !== undefined) {
    updates.invoiceDate = body.invoiceDate.trim() || null;
  }
  if (body.paymentNotes !== undefined) {
    updates.paymentNotes = body.paymentNotes.trim() || null;
  }
  if (body.paymentStatus !== undefined) {
    updates.paymentStatus = body.paymentStatus;
    updates.settledAt = body.paymentStatus === "settled" ? new Date() : null;
  }

  const [updated] = await db
    .update(transactions)
    .set(updates)
    .where(eq(transactions.id, tx.id))
    .returning();

  return NextResponse.json({
    ok: true,
    message: body.paymentStatus === "settled" 
      ? "Stato aggiornato: pagamento registrato come SALDATO." 
      : "Estremi fattura e stato pagamento aggiornati con successo.",
    transaction: updated,
  });
}
