import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import crypto from "crypto";
import { getCurrentUser } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const me = await getCurrentUser();
    if (!me || (me.role !== "promoter" && me.role !== "admin" && me.role !== "provider")) {
      return NextResponse.json({ error: "Accesso non autorizzato al caricamento file." }, { status: 403 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file || typeof file === "string") {
      return NextResponse.json({ error: "Nessun file selezionato per il caricamento." }, { status: 400 });
    }

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/avif",
      "image/gif",
      "image/jpg",
    ];

    if (!allowedTypes.includes(file.type.toLowerCase())) {
      return NextResponse.json(
        { error: "Formato file non supportato. Carica immagini in formato JPG, PNG, WEBP o GIF." },
        { status: 400 }
      );
    }

    // Limite dimensione: 8 MB
    if (file.size > 8 * 1024 * 1024) {
      return NextResponse.json(
        { error: "La dimensione della foto supera il limite massimo consentito (8 MB)." },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const origExt = file.name.split(".").pop() || "jpg";
    const cleanExt = origExt.toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
    const uniqueName = `struttura-${Date.now()}-${crypto.randomBytes(4).toString("hex")}.${cleanExt}`;

    const uploadDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadDir, { recursive: true });

    const filePath = path.join(uploadDir, uniqueName);
    await writeFile(filePath, buffer);

    const publicUrl = `/uploads/${uniqueName}`;

    return NextResponse.json({
      ok: true,
      url: publicUrl,
      filename: uniqueName,
    });
  } catch (error) {
    console.error("POST /api/upload error:", error);
    return NextResponse.json({ error: "Errore durante il salvataggio della foto sul server." }, { status: 500 });
  }
}
