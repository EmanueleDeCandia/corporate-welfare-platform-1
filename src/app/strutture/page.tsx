import Link from "next/link";
import { Sparkles, Landmark, Building, UtensilsCrossed, Leaf, Layers } from "lucide-react";
import { PublicShell } from "@/components/public-shell";
import { VenueCard } from "@/components/venue-card";
import { getVenues } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function VenuesPage({
  searchParams,
}: {
  searchParams?: Promise<{ cat?: string }>;
}) {
  const resolvedParams = searchParams ? await searchParams : {};
  const currentCat = resolvedParams.cat || "all";
  const rows = await getVenues();

  // Counts
  const counts = {
    all: rows.length,
    stay: rows.filter((r) => r.venue.type === "hotel" || r.venue.type === "agriturismo").length,
    theater: rows.filter((r) => r.venue.type === "theater").length,
    producer: rows.filter((r) => r.venue.type === "producer").length,
    restaurant: rows.filter((r) => r.venue.type === "restaurant").length,
  };

  // Filtered rows
  const filteredRows = rows.filter((r) => {
    if (currentCat === "stay") return r.venue.type === "hotel" || r.venue.type === "agriturismo";
    if (currentCat === "theater") return r.venue.type === "theater";
    if (currentCat === "producer") return r.venue.type === "producer";
    if (currentCat === "restaurant") return r.venue.type === "restaurant";
    return true;
  });

  const categories = [
    { id: "all", label: "Tutte le strutture", count: counts.all, icon: Layers },
    { id: "stay", label: "Soggiorni & Casali", count: counts.stay, icon: Building },
    { id: "theater", label: "Teatri & Spazi Culturali", count: counts.theater, icon: Landmark },
    { id: "producer", label: "Produttori KM 0", count: counts.producer, icon: Leaf },
    { id: "restaurant", label: "Ristorazione tipica", count: counts.restaurant, icon: UtensilsCrossed },
  ];

  return (
    <PublicShell>
      <main className="mx-auto max-w-7xl px-4 py-10 md:px-6">
        <p className="text-xs uppercase tracking-[0.18em] text-olive">Circuito Territoriale</p>
        <h1 className="mt-2 font-serif text-4xl sm:text-5xl text-forest">
          Strutture, Teatri e Produttori Partner
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-ink/75">
          Esplora la rete del welfare territoriale RADICI: agriturismi nei borghi storici, i grandi teatri delle Marche
          con il Matching Grant e i produttori della filiera corta a chilometro zero.
        </p>

        {/* CATEGORY FILTER TABS */}
        <div className="mt-8 flex flex-wrap items-center gap-2 border-b border-forest/10 pb-5">
          {categories.map((c) => {
            const Icon = c.icon;
            const isActive = currentCat === c.id;
            return (
              <Link
                key={c.id}
                href={c.id === "all" ? "/strutture" : `/strutture?cat=${c.id}`}
                className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold tracking-wide transition-all ${
                  isActive
                    ? "bg-forest text-cream shadow-sm"
                    : "bg-white text-forest hover:bg-cream border border-forest/10"
                }`}
              >
                <Icon size={14} className={isActive ? "text-gold" : "text-olive"} />
                <span>{c.label}</span>
                <span
                  className={`ml-1 rounded-full px-1.5 py-0.2 text-[10px] ${
                    isActive ? "bg-white/20 text-cream" : "bg-forest/5 text-forest/70"
                  }`}
                >
                  {c.count}
                </span>
              </Link>
            );
          })}
        </div>

        {/* BANNER SPECIFICO PER TEATRI */}
        {currentCat === "theater" && (
          <div className="mt-6 rounded-2xl bg-forest/5 border border-forest/15 p-5 md:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-forest text-gold">
                <Landmark size={20} />
              </div>
              <div>
                <h3 className="font-serif text-lg text-forest font-semibold">
                  Matching Grant Culturale dei Promotori RADICI
                </h3>
                <p className="mt-1 text-xs text-forest/80 leading-relaxed max-w-3xl">
                  Per ogni notte trascorsa o aperitivo consumato nei borghi del circuito, i <strong>Promotori della startup</strong> erogano
                  un <strong>omaggio culturale di 2 ingressi riservati in platea (valore 50 €)</strong> per gli spettacoli storici, la lirica e la prosa nei teatri convenzionati delle Marche.
                </p>
              </div>
            </div>
            <Link
              href="/come-funziona"
              className="shrink-0 text-xs font-semibold text-terracotta hover:underline whitespace-nowrap"
            >
              Scopri il moltiplicatore 5,1x &rarr;
            </Link>
          </div>
        )}

        {/* BANNER SPECIFICO PER PRODUTTORI KM 0 */}
        {currentCat === "producer" && (
          <div className="mt-6 rounded-2xl bg-emerald-50 border border-emerald-200 p-5 md:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-700 text-cream">
                <Leaf size={20} />
              </div>
              <div>
                <h3 className="font-serif text-lg text-emerald-900 font-semibold">
                  Filiera Corta KM 0 · Trasparenza & Reciprocità 10:1
                </h3>
                <p className="mt-1 text-xs text-emerald-800 leading-relaxed max-w-3xl">
                  La startup trattiene <strong>0% di commissioni</strong> sui produttori locali (100% dell&apos;incasso va al produttore).
                  I tragitti dedicati su gomma sono azzerati tramite ritiro in loco o percorsi ordinari preesistenti. Inoltre, <strong>ogni 10 cesti acquistati, 1 cesto viene offerto in omaggio agli addetti delle imprese CSR</strong>.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* GRIGLIA STRUTTURE */}
        <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {filteredRows.map((row) => (
            <VenueCard
              key={row.venue.id}
              venue={row.venue}
              destination={row.destination}
              sponsor={row.sponsor}
            />
          ))}
        </div>
      </main>
    </PublicShell>
  );
}
