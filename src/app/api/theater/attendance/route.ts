import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { bookings, matchingGrants } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const me = await getCurrentUser();
  if (!me || (me.role !== "theater" && me.role !== "promoter" && me.role !== "admin")) {
    return NextResponse.json({ error: "Accesso non autorizzato." }, { status: 403 });
  }

  try {
    const body = (await request.json()) as {
      bookingId?: number;
      grantId?: number;
      attendanceStatus: "attended" | "no_show" | "pending";
    };

    if (!body.attendanceStatus) {
      return NextResponse.json({ error: "Stato presenza mancante." }, { status: 400 });
    }

    if (body.bookingId) {
      const now = new Date();
      await db
        .update(bookings)
        .set({
          status: body.attendanceStatus === "attended" ? "attended" : body.attendanceStatus === "no_show" ? "no_show" : "pending",
          attendedAt: body.attendanceStatus === "attended" ? now : null,
        })
        .where(eq(bookings.id, body.bookingId));
    }

    if (body.grantId) {
      const grantStatus =
        body.attendanceStatus === "attended"
          ? "attended"
          : body.attendanceStatus === "no_show"
          ? "no_show"
          : "assigned";

      await db
        .update(matchingGrants)
        .set({
          status: grantStatus,
          attendedAt: body.attendanceStatus === "attended" ? new Date() : null,
        })
        .where(eq(matchingGrants.id, body.grantId));
    }

    return NextResponse.json({
      success: true,
      attendanceStatus: body.attendanceStatus,
    });
  } catch (error) {
    console.error("Error updating theater attendance:", error);
    return NextResponse.json({ error: "Errore durante l'aggiornamento." }, { status: 500 });
  }
}
