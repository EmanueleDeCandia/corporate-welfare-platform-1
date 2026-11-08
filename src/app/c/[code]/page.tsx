import { notFound, redirect } from "next/navigation";
import { db, initDb } from "@/db";
import { impactShortlinks } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { encodeCompact } from "@/lib/certificati-impatto/doc";
import type { Doc } from "@/lib/certificati-impatto/types";

interface PageProps {
  params: Promise<{
    code: string;
  }>;
}

export default async function ShortlinkPage({ params }: PageProps) {
  await initDb();
  const { code } = await params;
  const decodedCode = decodeURIComponent(code);

  const shortlink = await db
    .select()
    .from(impactShortlinks)
    .where(eq(impactShortlinks.code, decodedCode))
    .get();

  if (!shortlink) {
    notFound();
  }

  // Incrementa contatore visualizzazioni in modo atomico
  try {
    await db
      .update(impactShortlinks)
      .set({ viewsCount: sql`${impactShortlinks.viewsCount} + 1` })
      .where(eq(impactShortlinks.code, decodedCode))
      .run();
  } catch (err) {
    console.error("Errore aggiornamento viewsCount shortlink:", err);
  }

  // Deserializza il doc per generare la rotta di verifica sicura
  try {
    const doc = JSON.parse(shortlink.docPayload) as Doc;
    const compactDoc = encodeCompact(doc);
    redirect(`/account/certificati#/v/${compactDoc}`);
  } catch {
    redirect(`/account/certificati`);
  }
}
