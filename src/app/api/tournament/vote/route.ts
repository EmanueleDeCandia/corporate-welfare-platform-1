import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { castTrailerVote } from "@/lib/tournament";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "È necessario effettuare il login per votare al Torneo dei Trailer." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { trailerId } = body;

    if (!trailerId || typeof trailerId !== "number") {
      return NextResponse.json({ error: "Identificativo trailer non valido." }, { status: 400 });
    }

    const result = await castTrailerVote(user.id, trailerId);

    if (!result.ok) {
      return NextResponse.json({ error: result.error || "Impossibile registrare il voto." }, { status: 400 });
    }

    return NextResponse.json({ ok: true, vote: result.vote });
  } catch (error) {
    console.error("POST /api/tournament/vote error:", error);
    return NextResponse.json({ error: "Errore interno durante la votazione." }, { status: 500 });
  }
}
