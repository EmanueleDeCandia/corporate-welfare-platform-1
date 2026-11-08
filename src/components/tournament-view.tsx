"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Trophy,
  Sparkles,
  Play,
  Pause,
  CheckCircle2,
  Share2,
  Users,
  Flame,
  Clock,
  Building,
  Vote,
  ExternalLink,
  MessageCircle,
  Award,
  ShieldCheck,
  Loader2,
  Ticket,
} from "lucide-react";
import type { TournamentData, TrailerWithStats } from "@/lib/tournament";

type Props = {
  data: TournamentData;
  currentUser: {
    id: number;
    firstName: string;
    lastName: string;
    role: string;
    companyId: number | null;
    companyName?: string | null;
    referralCode?: string | null;
  } | null;
};

export function TournamentView({ data, currentUser }: Props) {
  const router = useRouter();
  const [selectedTrailerId, setSelectedTrailerId] = useState<number>(
    data.winningTrailer?.id || data.trailers[0]?.id || 1
  );
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [videoProgress, setVideoProgress] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [voteError, setVoteError] = useState<string | null>(null);
  const [voteSuccess, setVoteSuccess] = useState<string | null>(null);

  const activeTrailer =
    data.trailers.find((t) => t.id === selectedTrailerId) || data.trailers[0];

  // Simula riproduzione timer 20 secondi
  function handleTogglePlay() {
    if (isPlaying) {
      setIsPlaying(false);
      return;
    }
    setIsPlaying(true);
    let p = 0;
    const interval = setInterval(() => {
      p += 5;
      if (p > 100) {
        clearInterval(interval);
        setIsPlaying(false);
        setVideoProgress(100);
      } else {
        setVideoProgress(p);
      }
    }, 1000); // 20s total = 20 * 1000ms, step of 5% each second
  }

  async function handleVote(trailerId: number) {
    if (!currentUser) {
      router.push(`/login?next=/torneo`);
      return;
    }

    setIsSubmitting(true);
    setVoteError(null);
    setVoteSuccess(null);

    try {
      const res = await fetch("/api/tournament/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trailerId }),
      });
      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.error || "Errore durante la registrazione del voto.");
      }
      setVoteSuccess("Voto registrato con successo! Grazie per aver supportato la tua organizzazione.");
      router.refresh();
    } catch (err: any) {
      setVoteError(err.message || "Errore durante la registrazione del voto.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const referralUrl = currentUser?.referralCode
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/r/${currentUser.referralCode}`
    : "";

  const waShareText = encodeURIComponent(
    `🎭 Vota con me al Torneo dei Trailer di Performing Art su RADICI!\n\n` +
      `Aiuta la nostra impresa a vincere 10 Biglietti Omaggio per il teatro nei borghi storici.\n` +
      `Iscriviti da questo link per unirti alla squadra e ottenere lo sconto del 10%:\n${referralUrl}`
  );

  return (
    <div className="space-y-10">
      {/* 1. HERO BANNER DEL TORNEO */}
      <section className="relative overflow-hidden rounded-[36px] bg-forest px-6 py-10 sm:px-10 sm:py-14 text-cream shadow-xl">
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-gold/25 px-3 py-1 font-mono text-xs font-bold text-gold border border-gold/40">
              <Trophy size={14} className="text-gold" /> {data.editionTitle}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 text-xs text-cream/80">
              <Clock size={12} /> {data.daysLeft} giorni alla chiusura dell&apos;Edizione
            </span>
          </div>

          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-medium tracking-tight text-cream">
            Torneo dei Trailer di Performing Art
          </h1>

          <p className="text-sm sm:text-base leading-relaxed text-cream/85">
            Guarda i trailer da 20 secondi degli spettacoli nei borghi storici e vota per far vincere alla tua impresa i{" "}
            <strong className="text-gold font-semibold">10 Biglietti Omaggio</strong> messi in palio dalla Startup RADICI.
            Ogni voto porta in sala nuovi spettatori e valorizza il teatro territoriale!
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-4 text-xs text-cream/70">
            <div className="flex items-center gap-1.5">
              <Vote size={14} className="text-gold" />
              <span>{data.totalVotes} voti registrati ad oggi</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Building size={14} className="text-gold" />
              <span>{data.companyStandings.length} organizzazioni in gara</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Award size={14} className="text-gold" />
              <span>28 Biglietti Omaggio complessivi erogati dalla Startup</span>
            </div>
          </div>
        </div>

        {/* Badge Premi in Evidenza a Destra */}
        <div className="mt-8 lg:mt-0 lg:absolute lg:top-12 lg:right-10 flex flex-col gap-3 max-w-xs">
          <div className="rounded-2xl border border-gold/40 bg-white/10 backdrop-blur-md p-4 text-cream space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-wider text-gold flex items-center gap-1">
                <Trophy size={14} /> 1ª Impresa Classificata
              </p>
              <span className="rounded-full bg-gold px-2 py-0.5 text-[10px] font-black text-forest">
                10 BIGLIETTI
              </span>
            </div>
            <p className="text-[11px] text-cream/80 leading-relaxed">
              Assegnati all&apos;organizzazione che ha raccolto più voti per lo Spettacolo vincitore del Torneo.
            </p>
          </div>

          <div className="rounded-2xl border border-white/15 bg-white/5 backdrop-blur-md p-3.5 text-cream space-y-1">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-cream/90">2ª - 10ª Classificata</p>
              <span className="rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-bold text-cream">
                2 BIGLIETTI CAD.
              </span>
            </div>
            <p className="text-[10px] text-cream/70">
              Premio di partecipazione diffusa per le successive 9 imprese.
            </p>
          </div>
        </div>
      </section>

      {/* 2. REGOLAMENTO DI BUSINESS (BOX DIDATTICO) */}
      <section className="rounded-3xl border border-mist bg-white p-6 shadow-sm">
        <h3 className="font-serif text-lg font-bold text-forest flex items-center gap-2">
          <Sparkles size={18} className="text-gold" /> Regole di Partecipazione & Meccanica di Gamification
        </h3>
        <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-olive leading-relaxed">
          <div className="rounded-2xl bg-cream/60 p-4 border border-forest/10 space-y-1">
            <p className="font-bold text-forest">1. Voto Aperto a Tutti gli Addetti</p>
            <p>
              Ciascun lavoratore esprime 1 preferenza. Anche gli addetti che hanno già utilizzato il proprio voucher di welfare
              possono votare per far vincere i biglietti omaggio alla propria azienda e riceverli!
            </p>
          </div>
          <div className="rounded-2xl bg-cream/60 p-4 border border-forest/10 space-y-1">
            <p className="font-bold text-forest">2. Amici Referral Attribuiti all&apos;Impresa</p>
            <p>
              Tutti gli amici invitati tramite il codice referral che si iscrivono al circuito votano e il loro voto è conteggiato
              a favore dell&apos;impresa o ente pubblico del dipendente invitante.
            </p>
          </div>
          <div className="rounded-2xl bg-cream/60 p-4 border border-forest/10 space-y-1">
            <p className="font-bold text-forest">3. Premi Erogati dalla Startup</p>
            <p>
              I 28 Biglietti Omaggio del Torneo sono un investimento diretto della Startup RADICI, distinto dal Matching Grant ordinario,
              per alimentare la diffusione virale pre-conversione.
            </p>
          </div>
        </div>
      </section>

      {/* 3. VETRINA TRAILER INTERATTIVA (VIDEO 20 SECONDI & VOTAZIONE) */}
      <section className="space-y-6">
        <div className="border-l-2 border-forest pl-4">
          <span className="font-mono text-xs uppercase tracking-wider text-olive font-semibold block">
            Performing Art in Gara
          </span>
          <h2 className="font-serif text-2xl sm:text-3xl text-forest mt-1">
            Trailer dei 3 Spettacoli Teatrali in Competizione
          </h2>
        </div>

        {/* Selettore Spettacolo */}
        <div className="flex flex-wrap gap-2.5">
          {data.trailers.map((t, idx) => {
            const isSelected = t.id === selectedTrailerId;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  setSelectedTrailerId(t.id);
                  setIsPlaying(false);
                  setVideoProgress(0);
                }}
                className={`rounded-2xl border px-4 py-3 text-left transition cursor-pointer flex items-center gap-3 ${
                  isSelected
                    ? "border-forest bg-forest text-cream shadow-md"
                    : "border-forest/15 bg-white text-forest hover:bg-cream"
                }`}
              >
                <span
                  className={`flex h-7 w-7 items-center justify-center rounded-xl text-xs font-bold ${
                    isSelected ? "bg-white/20 text-cream" : "bg-forest/10 text-forest"
                  }`}
                >
                  #{idx + 1}
                </span>
                <div>
                  <p className="font-serif text-xs font-bold leading-tight">{t.theaterName}</p>
                  <p className={`text-[10px] truncate max-w-[200px] ${isSelected ? "text-cream/80" : "text-olive"}`}>
                    {t.title}
                  </p>
                </div>
                <span
                  className={`ml-2 rounded-full px-2 py-0.5 text-[10px] font-mono font-bold ${
                    isSelected ? "bg-gold text-forest" : "bg-forest/10 text-forest"
                  }`}
                >
                  {t.votePercentage}% ({t.votesCount})
                </span>
              </button>
            );
          })}
        </div>

        {/* Video Player Simulato a 20 Secondi */}
        {activeTrailer && (
          <div className="rounded-[32px] border border-forest/10 bg-white p-6 sm:p-8 shadow-sm space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-8 items-center">
              {/* Finestra Video Mock */}
              <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-black shadow-lg border border-forest/10 flex items-center justify-center group">
                <Image
                  src={activeTrailer.posterUrl}
                  alt={activeTrailer.title}
                  fill
                  className="object-cover opacity-60 group-hover:scale-105 transition-transform duration-700"
                />

                {/* Overlay Grafico Teatrale */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/60 p-6 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-xs text-cream/80">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-forest/80 backdrop-blur-sm px-3 py-1 font-mono text-[10px] font-bold text-cream">
                      <Flame size={12} className="text-gold" /> TRAILER UFFICIALE · 20 SEC.
                    </span>
                    <span className="font-mono text-[11px] bg-black/60 px-2.5 py-1 rounded-full">
                      {Math.round((videoProgress / 100) * 20)}s / 20s
                    </span>
                  </div>

                  <div className="text-center space-y-2">
                    <button
                      type="button"
                      onClick={handleTogglePlay}
                      className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gold text-forest shadow-2xl hover:scale-110 transition-transform cursor-pointer"
                    >
                      {isPlaying ? <Pause size={28} /> : <Play size={28} className="ml-1" />}
                    </button>
                    <p className="text-xs text-cream font-medium">
                      {isPlaying ? "Riproduzione trailer in corso..." : "Clicca per avviare il trailer (20s)"}
                    </p>
                  </div>

                  {/* Barra di avanzamento video */}
                  <div className="w-full bg-white/20 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-gold h-full transition-all duration-300"
                      style={{ width: `${videoProgress}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Informazioni Spettacolo & Voto */}
              <div className="space-y-4">
                <div>
                  <span className="rounded-full bg-forest/10 px-3 py-1 text-[11px] font-semibold text-forest">
                    {activeTrailer.genre}
                  </span>
                  <h3 className="mt-2 font-serif text-2xl sm:text-3xl font-bold text-forest leading-snug">
                    {activeTrailer.title}
                  </h3>
                  <p className="text-xs text-olive font-medium mt-1">
                    {activeTrailer.theaterName} ({activeTrailer.city}) · Regia: {activeTrailer.director} · Compagnia: {activeTrailer.performingCompany}
                  </p>
                </div>

                <p className="text-xs sm:text-sm text-ink/80 leading-relaxed">
                  {activeTrailer.synopsis}
                </p>

                {/* Box Statistiche di Voto */}
                <div className="rounded-2xl bg-cream/70 p-4 border border-forest/10 flex items-center justify-between text-xs">
                  <div>
                    <p className="text-[10px] uppercase font-bold text-olive">Preferenze del Pubblico</p>
                    <p className="font-serif text-2xl font-bold text-forest">
                      {activeTrailer.votePercentage}%
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] uppercase font-bold text-olive">Voti Espressi</p>
                    <p className="font-serif text-2xl font-bold text-forest">
                      {activeTrailer.votesCount}
                    </p>
                  </div>
                </div>

                {/* Feedback Messaggi Voto */}
                {voteError && (
                  <p className="text-xs text-wine bg-wine/10 p-3 rounded-xl border border-wine/20">
                    {voteError}
                  </p>
                )}
                {voteSuccess && (
                  <p className="text-xs text-forest bg-forest/10 p-3 rounded-xl border border-forest/20 flex items-center gap-1.5">
                    <CheckCircle2 size={16} /> {voteSuccess}
                  </p>
                )}

                {/* Pulsante Voto */}
                <div>
                  {activeTrailer.userHasVoted ? (
                    <div className="flex items-center gap-2 rounded-2xl bg-forest/10 px-5 py-3.5 text-xs font-bold text-forest border border-forest/20">
                      <CheckCircle2 size={18} className="text-forest" />
                      Hai votato questo spettacolo! Grazie per aver supportato la tua organizzazione.
                    </div>
                  ) : data.userVotedTrailerId ? (
                    <div className="rounded-2xl bg-sand/30 p-3.5 text-xs text-olive border border-forest/10">
                      Hai già espresso il tuo voto per un altro trailer in questa edizione.
                    </div>
                  ) : (
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => handleVote(activeTrailer.id)}
                      className="w-full flex items-center justify-center gap-2 rounded-2xl bg-forest px-6 py-4 text-sm font-bold text-cream shadow-md hover:bg-forest/90 transition cursor-pointer disabled:opacity-50"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 size={16} className="animate-spin" /> Registrazione Voto in corso...
                        </>
                      ) : (
                        <>
                          <Vote size={18} /> Vota Questo Spettacolo per la Tua Impresa
                        </>
                      )}
                    </button>
                  )}
                  {!currentUser && (
                    <p className="text-[10px] text-olive text-center mt-2">
                      Non hai effettuato l&apos;accesso? Cliccando su vota verrai reindirizzato al login.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* 4. TABELLONE CLASSIFICA IMPRESE & PREMI BIGLIETTI OMAGGIO */}
      <section className="space-y-6">
        <div className="border-l-2 border-forest pl-4">
          <span className="font-mono text-xs uppercase tracking-wider text-olive font-semibold block">
            Classifica & Assegnazione Biglietti Omaggio
          </span>
          <h2 className="font-serif text-2xl sm:text-3xl text-forest mt-1">
            Tabellone Imprese CSR & Enti Pubblici
          </h2>
          <p className="text-xs text-olive mt-1 max-w-2xl leading-relaxed">
            La graduatoria si basa sul numero di voti attribuiti allo Spettacolo in prima posizione (&quot;{data.winningTrailer?.title}&quot;).
            I biglietti vinti vengono accreditati direttamente nell&apos;area riservata dell&apos;organizzazione per essere distribuiti agli addetti.
          </p>
        </div>

        <div className="overflow-hidden rounded-3xl border border-forest/10 bg-white shadow-sm">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-mist bg-cream/70 text-[10px] uppercase tracking-wider text-olive font-bold">
                <th className="px-5 py-3.5">Posizione</th>
                <th className="px-5 py-3.5">Organizzazione Aderente</th>
                <th className="px-5 py-3.5 text-center">Voti allo Spettacolo Vincitore</th>
                <th className="px-5 py-3.5 text-center">Voti Totali</th>
                <th className="px-5 py-3.5 text-right">Biglietti Omaggio Assegnati</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-mist">
              {data.companyStandings.map((comp) => {
                const isFirst = comp.rank === 1;
                return (
                  <tr
                    key={comp.companyId}
                    className={`transition-colors ${
                      isFirst ? "bg-gold/10 font-medium" : "hover:bg-cream/40"
                    }`}
                  >
                    <td className="px-5 py-4">
                      {isFirst ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-gold px-2.5 py-1 text-xs font-black text-forest shadow-sm">
                          <Trophy size={13} /> 1° Posto
                        </span>
                      ) : (
                        <span className="font-serif text-sm font-bold text-forest">
                          #{comp.rank}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <span className="font-serif text-sm font-bold text-forest">
                          {comp.companyName}
                        </span>
                        {comp.entityType === "public" ? (
                          <span className="rounded-full bg-forest/10 px-2 py-0.5 text-[10px] font-semibold text-forest">
                            Ente Pubblico
                          </span>
                        ) : (
                          <span className="rounded-full bg-gold/15 px-2 py-0.5 text-[10px] font-semibold text-terracotta">
                            Impresa CSR
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-center font-bold text-forest text-sm">
                      {comp.votesToWinner}
                    </td>
                    <td className="px-5 py-4 text-center text-olive">
                      {comp.totalVotes}
                    </td>
                    <td className="px-5 py-4 text-right">
                      {comp.prizeTickets > 0 ? (
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-mono text-xs font-bold ${
                            isFirst
                              ? "bg-forest text-cream shadow-sm"
                              : "bg-gold/20 text-terracotta border border-gold/40"
                          }`}
                        >
                          <Ticket size={13} /> {comp.prizeTickets} Biglietti Omaggio
                        </span>
                      ) : (
                        <span className="text-[11px] text-olive italic">Nessun biglietto</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* 5. INVITO COLLEGHI & AMICI (VIRALITÀ PRE-CONVERSIONE) */}
      <section className="rounded-[32px] border border-gold/30 bg-gradient-to-br from-cream via-sand/20 to-gold/15 p-6 sm:p-10 shadow-sm space-y-6">
        <div className="max-w-2xl space-y-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-forest/10 px-3 py-1 font-mono text-xs font-bold text-forest">
            <Users size={14} /> Leva di Diffusione
          </span>
          <h3 className="font-serif text-2xl sm:text-3xl text-forest font-bold">
            Invita Colleghi e Amici: Scala la Classifica
          </h3>
          <p className="text-xs sm:text-sm text-olive leading-relaxed">
            Ogni persona che inviti e si registra con il tuo codice referral vota nel Torneo: il suo voto viene attribuito
            direttamente alla tua organizzazione, aumentando le possibilità di vincere i 10 Biglietti Omaggio!
          </p>
        </div>

        {currentUser?.referralCode ? (
          <div className="flex flex-wrap items-center gap-3">
            <a
              href={`https://wa.me/?text=${waShareText}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-2xl bg-[#25D366] px-5 py-3 text-xs font-bold text-white shadow-sm hover:bg-[#20ba59] transition cursor-pointer"
            >
              <MessageCircle size={16} /> Condividi su WhatsApp
            </a>
            <Link
              href="/account/certificati"
              className="inline-flex items-center gap-2 rounded-2xl bg-forest px-5 py-3 text-xs font-bold text-cream shadow-sm hover:bg-forest/90 transition cursor-pointer"
            >
              <Award size={16} /> Apri Certificati d&apos;Impatto
            </Link>
          </div>
        ) : (
          <div>
            <Link
              href="/login?next=/torneo"
              className="inline-flex items-center gap-2 rounded-2xl bg-forest px-5 py-3 text-xs font-bold text-cream shadow-sm hover:bg-forest/90 transition cursor-pointer"
            >
              Accedi per Ottenere il Tuo Link Referral e Votare
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}
