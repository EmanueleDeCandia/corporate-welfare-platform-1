import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { jsPDF } from "jspdf";
import { db } from "@/db";
import { certificates, companies, users } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

function sanitizePdfText(text: string): string {
  return text
    .replace(/₂/g, "2")
    .replace(/₁/g, "1")
    .replace(/₃/g, "3")
    .replace(/’/g, "'")
    .replace(/‘/g, "'")
    .replace(/“/g, '"')
    .replace(/”/g, '"')
    .replace(/—/g, "-")
    .replace(/–/g, "-");
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const me = await getCurrentUser();
  if (!me) {
    return NextResponse.json({ error: "Non autorizzato." }, { status: 401 });
  }

  const { id } = await context.params;
  const [cert] = await db
    .select()
    .from(certificates)
    .where(and(eq(certificates.id, Number(id)), eq(certificates.userId, me.id)))
    .limit(1);

  if (!cert) {
    return NextResponse.json({ error: "Certificato non trovato." }, { status: 404 });
  }

  const [user] = await db.select().from(users).where(eq(users.id, me.id)).limit(1);
  const company = me.companyId
    ? (await db.select().from(companies).where(eq(companies.id, me.companyId)).limit(1))[0]
    : null;

  // Initialize A4 Portrait (210mm x 297mm)
  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
  const pageWidth = doc.internal.pageSize.getWidth(); // 210
  const pageHeight = doc.internal.pageSize.getHeight(); // 297

  // 1. VINTAGE PARCHMENT / AGED PAPER EFFECT
  doc.setFillColor(243, 235, 220); // #F3EBDC outer vintage rim
  doc.rect(0, 0, pageWidth, pageHeight, "F");

  doc.setFillColor(252, 248, 240); // #FCF8F0 intermediate parchment layer
  doc.rect(5, 5, pageWidth - 10, pageHeight - 10, "F");

  doc.setFillColor(255, 253, 248); // #FFFCF8 core parchment body
  doc.rect(9, 9, pageWidth - 18, pageHeight - 18, "F");

  // 2. LUXURY DIPLOMATIC TRIPLE BORDER
  // Outer Forest Green Border
  doc.setDrawColor(28, 58, 46);
  doc.setLineWidth(1.4);
  doc.rect(12, 12, pageWidth - 24, pageHeight - 24);

  // Middle Gold Hairline
  doc.setDrawColor(197, 160, 89);
  doc.setLineWidth(0.4);
  doc.rect(14.5, 14.5, pageWidth - 29, pageHeight - 29);

  // Inner Gold Frame
  doc.setDrawColor(184, 134, 11);
  doc.setLineWidth(0.7);
  doc.rect(17, 17, pageWidth - 34, pageHeight - 34);

  // Decorative Corner Rosettes
  function drawCorner(x: number, y: number) {
    doc.setFillColor(197, 160, 89);
    doc.rect(x - 2, y - 2, 4, 4, "F");
    doc.setDrawColor(28, 58, 46);
    doc.setLineWidth(0.5);
    doc.rect(x - 3.5, y - 3.5, 7, 7, "S");
  }
  drawCorner(17, 17);
  drawCorner(pageWidth - 17, 17);
  drawCorner(17, pageHeight - 17);
  drawCorner(pageWidth - 17, pageHeight - 17);

  // 3. SUBTLE WATERMARK LOGO
  doc.setTextColor(244, 237, 226);
  doc.setFont("times", "bold");
  doc.setFontSize(54);
  doc.text("RADICI", pageWidth / 2, 150, { align: "center" });

  // 4. HEADER
  doc.setTextColor(74, 93, 78);
  doc.setFont("times", "bold");
  doc.setFontSize(9.5);
  doc.text("REPUBBLICA ITALIANA  -  CIRCUITO NAZIONALE RADICI", pageWidth / 2, 29, {
    align: "center",
  });

  doc.setTextColor(197, 160, 89);
  doc.setFontSize(8.5);
  doc.text("REGISTRO UFFICIALE DI SOSTENIBILITA ED IMPATTO ESG", pageWidth / 2, 34, {
    align: "center",
  });

  // Certificate Title
  doc.setTextColor(28, 58, 46);
  doc.setFont("times", "bold");
  doc.setFontSize(18);
  const certHeader =
    cert.type === "co2"
      ? "ATTESTATO DI SOSTENIBILITA AMBIENTALE"
      : "ATTESTATO DI IMPATTO TERRITORIALE ESG";
  doc.text(certHeader, pageWidth / 2, 45, { align: "center" });

  // Gold Divider Line with Center Diamond
  doc.setDrawColor(197, 160, 89);
  doc.setLineWidth(0.5);
  doc.line(36, 50, pageWidth - 36, 50);
  doc.setFillColor(197, 160, 89);
  doc.circle(pageWidth / 2, 50, 1.4, "F");

  // 5. RECIPIENT IDENTIFICATION
  doc.setTextColor(75, 85, 80);
  doc.setFont("times", "italic");
  doc.setFontSize(11);
  doc.text("Si rilascia la presente attestazione di merito a favore di", pageWidth / 2, 60, {
    align: "center",
  });

  const recipientName = `${user?.firstName ?? me.firstName} ${user?.lastName ?? me.lastName}`;
  doc.setTextColor(28, 58, 46);
  doc.setFont("times", "bold");
  doc.setFontSize(22);
  doc.text(sanitizePdfText(recipientName), pageWidth / 2, 71, { align: "center" });

  if (company) {
    doc.setTextColor(90, 100, 95);
    doc.setFont("times", "normal");
    doc.setFontSize(10.5);
    const companyText = `Dipendente di ${company.name}  -  P.IVA ${company.vatNumber}`;
    const companyLines = doc.splitTextToSize(sanitizePdfText(companyText), 140);
    doc.text(companyLines, pageWidth / 2, 79, { align: "center" });
  }

  // 6. HERO METRIC CARTOUCHE (Riquadro d'onore)
  const boxY = 89;
  const boxW = 152;
  const boxH = 46;
  const boxX = (pageWidth - boxW) / 2;

  doc.setFillColor(248, 243, 233);
  doc.roundedRect(boxX, boxY, boxW, boxH, 4, 4, "F");
  doc.setDrawColor(197, 160, 89);
  doc.setLineWidth(0.6);
  doc.roundedRect(boxX, boxY, boxW, boxH, 4, 4, "S");

  doc.setTextColor(139, 101, 8);
  doc.setFont("times", "bold");
  doc.setFontSize(9.5);
  doc.text("VALORE UFFICIALMENTE CERTIFICATO", pageWidth / 2, boxY + 8.5, { align: "center" });

  // Big Impact Number
  doc.setTextColor(196, 92, 38); // Terracotta
  doc.setFont("times", "bold");
  doc.setFontSize(30);
  const rawImpact = cert.type === "economic" ? `€ ${cert.impactValue}` : cert.impactValue;
  doc.text(sanitizePdfText(rawImpact), pageWidth / 2, boxY + 22.5, { align: "center" });

  // Unit Label
  doc.setTextColor(28, 58, 46);
  doc.setFont("times", "bold");
  doc.setFontSize(11);
  const unitLines = doc.splitTextToSize(sanitizePdfText(cert.unitLabel), 136);
  doc.text(unitLines, pageWidth / 2, boxY + 31.5, { align: "center" });

  doc.setTextColor(110, 120, 115);
  doc.setFont("times", "italic");
  doc.setFontSize(8);
  const calcNote =
    cert.type === "co2"
      ? "Calcolo accreditato su filiera a chilometro zero vs canali industriali standard."
      : "Capitale monetario netto trasferito ai produttori e custodi locali.";
  doc.text(calcNote, pageWidth / 2, boxY + 39.5, { align: "center" });

  // 7. SPECIFIC CERTIFICATE DESCRIPTION (SPOSTATA CHIARAMENTE SOTTO IL LOGO/WATERMARK RADICI)
  doc.setTextColor(35, 52, 43);
  doc.setFont("times", "normal");
  doc.setFontSize(10);
  const cleanDescription = sanitizePdfText(cert.description);
  const splitDesc = doc.splitTextToSize(cleanDescription, 138);
  doc.text(splitDesc, pageWidth / 2, 166, { align: "center", lineHeightFactor: 1.4 });

  // 8. OFFICIAL DIPLOMATIC SEAL (Timbro di convalida)
  const sealX = pageWidth / 2;
  const sealY = 199;

  doc.setDrawColor(197, 160, 89);
  doc.setLineWidth(1);
  doc.circle(sealX, sealY, 15, "S");
  doc.setLineWidth(0.4);
  doc.circle(sealX, sealY, 13.2, "S");
  doc.setFillColor(250, 245, 235);
  doc.circle(sealX, sealY, 12.8, "F");

  doc.setTextColor(139, 101, 8);
  doc.setFont("times", "bold");
  doc.setFontSize(6.5);
  doc.text("CIRCUITO NAZIONALE", sealX, sealY - 6.5, { align: "center" });
  doc.setFontSize(9.5);
  doc.text("RADICI", sealX, sealY - 0.8, { align: "center" });
  doc.setFontSize(6);
  doc.text("ESG VALIDATED", sealX, sealY + 3.8, { align: "center" });
  doc.text("* * *", sealX, sealY + 7.5, { align: "center" });

  // 9. FOOTER REGISTRATION & SIGNATURE BLOCK
  doc.setTextColor(80, 95, 88);
  doc.setFont("times", "bold");
  doc.setFontSize(8.5);
  doc.text("DATI DI REGISTRAZIONE", 25, 233);
  doc.setFont("times", "normal");
  doc.setFontSize(8);
  doc.text(`Protocollo Univoco: ${cert.protocolNumber}`, 25, 239);
  doc.text(`Data di Emissione: ${formatDate(cert.createdAt)}`, 25, 244);
  doc.text(`Livello Comunitario: ${user?.badgeLevel ?? me.badgeLevel}`, 25, 249);
  doc.text(`Punti Impatto Conseguiti: ${user?.impactPoints ?? me.impactPoints}`, 25, 254);

  doc.setFont("times", "bold");
  doc.setFontSize(8.5);
  doc.text("COMITATO DI VALUTAZIONE ESG", pageWidth - 25, 233, { align: "right" });
  doc.setDrawColor(197, 160, 89);
  doc.setLineWidth(0.4);
  doc.line(pageWidth - 75, 247, pageWidth - 25, 247);
  doc.setFont("times", "italic");
  doc.setFontSize(8);
  doc.text("Firma Digitale / Circuito RADICI", pageWidth - 25, 252, { align: "right" });

  // Legal / Public Verification Disclaimer
  doc.setFont("times", "normal");
  doc.setFontSize(7.2);
  doc.setTextColor(130, 140, 135);
  doc.text(
    "Attestato rilasciato in conformita con gli standard di rendicontazione territoriale RADICI - Convalida verificabile sul registro pubblico ESG",
    pageWidth / 2,
    272,
    { align: "center" },
  );

  const buffer = Buffer.from(doc.output("arraybuffer"));
  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="certificato-radici-${cert.id}.pdf"`,
    },
  });
}
