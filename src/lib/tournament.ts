import { desc, eq, sql } from "drizzle-orm";
import { db, initDb } from "@/db";
import {
  trailers,
  trailerVotes,
  users,
  companies,
  type Trailer,
} from "@/db/schema";
import { ensureTrailers } from "@/db/seed";

export type TrailerWithStats = Trailer & {
  votesCount: number;
  votePercentage: number;
  userHasVoted: boolean;
};

export type CompanyTournamentStanding = {
  companyId: number;
  companyName: string;
  entityType: string;
  votesToWinner: number;
  totalVotes: number;
  rank: number;
  prizeTickets: number; // 10 per la 1a, 2 per le altre nella top 10
  isWinner: boolean;
};

export type TournamentData = {
  editionNumber: number;
  editionTitle: string;
  status: "active" | "completed";
  daysLeft: number;
  trailers: TrailerWithStats[];
  totalVotes: number;
  winningTrailer: TrailerWithStats | null;
  companyStandings: CompanyTournamentStanding[];
  userVotedTrailerId: number | null;
  prizes: {
    firstPlaceTickets: number;
    topTenTickets: number;
    totalTicketsAwarded: number;
    maxCashBudgetEuros: number;
  };
};

export async function getTournamentData(currentUserId?: number): Promise<TournamentData> {
  await initDb();
  await ensureTrailers();

  const allTrailers = await db
    .select()
    .from(trailers)
    .where(eq(trailers.active, true))
    .orderBy(trailers.orderIndex);

  const allVotes = await db.select().from(trailerVotes);
  const allCompanies = await db.select().from(companies);
  const companyMap = new Map(allCompanies.map((c) => [c.id, c]));

  const totalVotes = allVotes.length;

  // Calcola voti per trailer e se l'utente ha votato
  const userVote = currentUserId
    ? allVotes.find((v) => v.userId === currentUserId)
    : null;
  const userVotedTrailerId = userVote ? userVote.trailerId : null;

  const trailerStats: TrailerWithStats[] = allTrailers.map((t) => {
    const tVotes = allVotes.filter((v) => v.trailerId === t.id);
    const count = tVotes.length;
    const pct = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
    return {
      ...t,
      votesCount: count,
      votePercentage: pct,
      userHasVoted: userVotedTrailerId === t.id,
    };
  });

  // Ordina trailer per voti decrescenti per individuare il trailer vincitore attuale
  const sortedTrailers = [...trailerStats].sort((a, b) => b.votesCount - a.votesCount);
  const winningTrailer = sortedTrailers[0] || null;

  // Calcolo classifica imprese CSR / Enti Pubblici per voti dati al trailer in testa
  // (Regola di Business: "L'impresa che ha contribuito con più voti allo Spettacolo vincitore riceve 10 Biglietti Omaggio.
  // Le prime 10 imprese che hanno dato più voti allo Spettacolo vincitore ottengono 2 Biglietti omaggio ognuna.")
  const winningTrailerId = winningTrailer?.id ?? null;

  const companyVoteCounts = new Map<
    number,
    { votesToWinner: number; totalVotes: number }
  >();

  for (const v of allVotes) {
    if (!v.companyId) continue;
    const current = companyVoteCounts.get(v.companyId) || { votesToWinner: 0, totalVotes: 0 };
    current.totalVotes += 1;
    if (winningTrailerId && v.trailerId === winningTrailerId) {
      current.votesToWinner += 1;
    }
    companyVoteCounts.set(v.companyId, current);
  }

  // Costruisci lista ordinata
  const standingsRaw: Array<{
    companyId: number;
    companyName: string;
    entityType: string;
    votesToWinner: number;
    totalVotes: number;
  }> = [];

  for (const [compId, stats] of companyVoteCounts.entries()) {
    const comp = companyMap.get(compId);
    if (!comp) continue;
    standingsRaw.push({
      companyId: comp.id,
      companyName: comp.name,
      entityType: comp.entityType || "private",
      votesToWinner: stats.votesToWinner,
      totalVotes: stats.totalVotes,
    });
  }

  // Ordina per voti dati al trailer vincitore, poi per voti totali
  standingsRaw.sort((a, b) => {
    if (b.votesToWinner !== a.votesToWinner) {
      return b.votesToWinner - a.votesToWinner;
    }
    return b.totalVotes - a.totalVotes;
  });

  const companyStandings: CompanyTournamentStanding[] = standingsRaw.map((s, idx) => {
    const rank = idx + 1;
    let prizeTickets = 0;
    if (rank === 1) {
      prizeTickets = 10;
    } else if (rank <= 10) {
      prizeTickets = 2;
    }
    return {
      ...s,
      rank,
      prizeTickets,
      isWinner: rank === 1,
    };
  });

  // Calcolo premi complessivi
  const totalTicketsAwarded = companyStandings.reduce(
    (sum, c) => sum + c.prizeTickets,
    0
  );
  // Costo massimo stimato (15€ a biglietto a carico Startup)
  const maxCashBudgetEuros = totalTicketsAwarded * 15;

  return {
    editionNumber: 1,
    editionTitle: "Edizione Primavera 2026 · Performing Art dei Borghi",
    status: "active",
    daysLeft: 12,
    trailers: trailerStats,
    totalVotes,
    winningTrailer,
    companyStandings,
    userVotedTrailerId,
    prizes: {
      firstPlaceTickets: 10,
      topTenTickets: 2,
      totalTicketsAwarded,
      maxCashBudgetEuros,
    },
  };
}

export async function castTrailerVote(
  userId: number,
  trailerId: number
): Promise<{ ok: boolean; error?: string; vote?: typeof trailerVotes.$inferSelect }> {
  await initDb();
  await ensureTrailers();

  // Verifica che l'utente esista
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user) {
    return { ok: false, error: "Utente non trovato." };
  }

  // Verifica se l'utente ha già votato in questa edizione
  const [existingVote] = await db
    .select()
    .from(trailerVotes)
    .where(eq(trailerVotes.userId, userId))
    .limit(1);

  if (existingVote) {
    return {
      ok: false,
      error: "Hai già espresso il tuo voto per questa edizione del Torneo dei Trailer.",
    };
  }

  // Determina a quale azienda attribuire il voto:
  // 1. Se l'utente è un dipendente o referente, usa il suo companyId
  // 2. Se l'utente è un amico invitato (role: 'friend'), cerca l'utente invitante (invitedByUserId)
  //    e assegna il voto all'azienda dell'invitante! (Regola di Business R8)
  let targetCompanyId: number | null = user.companyId ?? null;
  let inviterUserId: number | null = user.invitedByUserId ?? null;

  if (!targetCompanyId && inviterUserId) {
    const [inviter] = await db
      .select({ companyId: users.companyId })
      .from(users)
      .where(eq(users.id, inviterUserId))
      .limit(1);
    if (inviter?.companyId) {
      targetCompanyId = inviter.companyId;
    }
  }

  // Inserisci il voto
  const [newVote] = await db
    .insert(trailerVotes)
    .values({
      trailerId,
      userId,
      companyId: targetCompanyId,
      invitedByUserId: inviterUserId,
    })
    .returning();

  return { ok: true, vote: newVote };
}
