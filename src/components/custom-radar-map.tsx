"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import Link from "next/link";
import {
  Compass,
  MapPin,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Sparkles,
  ExternalLink,
  Bed,
  Utensils,
  Theater,
  Wine,
  ShieldCheck,
  ChevronRight,
  Layers,
} from "lucide-react";
import { venueTypeLabel } from "@/lib/utils";

export type MapVenue = {
  id: number;
  name: string;
  slug: string;
  type: string;
  city: string;
  lat: number;
  lng: number;
  coverImage?: string;
  fromPriceCents?: number;
  localSupportPercent?: number;
};

// Coordinate geografiche di riferimento (WGS84) per la calibrazione cartografica dell'Italia
// [lat, lng]
const ITALY_OUTLINE_COORDS: [number, number][] = [
  // Arco Alpino & Nord
  [45.8, 6.8], [46.0, 7.5], [46.2, 8.4], [46.5, 9.8], [46.9, 11.5], [47.1, 12.1], [46.8, 12.8], [46.6, 13.7],
  // Confine orientale e Trieste
  [45.9, 13.6], [45.6, 13.8], [45.7, 13.2], [45.5, 12.5],
  // Costa Adriatica Nord & Delta Po
  [45.0, 12.4], [44.7, 12.3], [44.4, 12.3], [44.0, 12.6],
  // Marche (Colline Maceratesi & Conero)
  [43.6, 13.5], [43.4, 13.7], [43.0, 13.9],
  // Abruzzo e Molise
  [42.4, 14.3], [42.1, 14.8], [41.9, 15.1],
  // Gargano & Puglia
  [41.9, 15.9], [41.8, 16.2], [41.4, 16.0], [41.2, 16.8], [40.8, 17.4], [40.5, 18.0],
  // Salento (Otranto & Leuca)
  [40.2, 18.5], [39.8, 18.3], [40.0, 17.9], [40.4, 17.2],
  // Golfo di Taranto & Ionio
  [40.3, 16.8], [39.9, 16.6], [39.6, 16.7], [39.1, 17.1], [38.9, 16.6], [38.3, 16.2],
  // Calabria Sud (Stretto)
  [37.9, 15.7], [38.2, 15.6], [38.6, 15.9], [39.4, 16.0], [40.0, 15.3],
  // Campania & Golfo di Napoli
  [40.5, 15.0], [40.6, 14.4], [40.9, 14.1], [41.2, 13.6],
  // Lazio & Toscana Tirrenica
  [41.7, 12.9], [41.9, 12.1], [42.4, 11.2], [42.8, 10.8], [43.5, 10.3], [43.9, 10.1],
  // Liguria
  [44.1, 9.6], [44.4, 8.9], [44.1, 8.2], [43.8, 7.5],
  // Chiusura Arco Alpino
  [44.3, 7.1], [44.8, 6.9], [45.3, 7.0], [45.8, 6.8]
];

// Sicilia
const SICILY_COORDS: [number, number][] = [
  [38.2, 15.5], [38.0, 15.0], [38.2, 14.0], [38.1, 13.0], [37.9, 12.4], [37.6, 12.6],
  [37.3, 13.5], [36.7, 14.8], [36.6, 15.1], [37.1, 15.3], [37.5, 15.2], [38.2, 15.5]
];

// Sardegna
const SARDINIA_COORDS: [number, number][] = [
  [41.2, 9.3], [40.9, 9.7], [40.4, 9.7], [39.7, 9.7], [39.1, 9.5], [38.9, 9.0],
  [39.2, 8.4], [39.8, 8.5], [40.6, 8.2], [40.9, 8.3], [41.2, 9.3]
];

// Funzione di proiezione cartografica equirettangolare calibrata sul territorio italiano
function projectCoord(lat: number, lng: number, width = 800, height = 880) {
  const minLng = 6.2;
  const maxLng = 19.1;
  const minLat = 36.2;
  const maxLat = 47.2;

  const padX = 50;
  const padY = 50;
  const w = width - padX * 2;
  const h = height - padY * 2;

  const nx = (lng - minLng) / (maxLng - minLng);
  const ny = (maxLat - lat) / (maxLat - minLat);

  return {
    x: padX + nx * w,
    y: padY + ny * h,
  };
}

function coordsToSvgPath(coords: [number, number][], width = 800, height = 880) {
  return coords
    .map((c, i) => {
      const { x, y } = projectCoord(c[0], c[1], width, height);
      return `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ") + " Z";
}

const REGION_ZONES = [
  {
    id: "marche",
    name: "Colline Maceratesi",
    tagline: "Welfare KM 0 e Teatri Storici",
    region: "Marche",
    lat: 43.30,
    lng: 13.45,
    radius: 38,
    color: "#C45C26",
  },
  {
    id: "langhe",
    name: "Langhe & Roero",
    tagline: "Relais vinicoli e colline UNESCO",
    region: "Piemonte",
    lat: 44.64,
    lng: 7.99,
    radius: 34,
    color: "#B8860B",
  },
  {
    id: "val-dorcia",
    name: "Val d'Orcia",
    tagline: "Poderi, terme e crete senesi",
    region: "Toscana",
    lat: 43.06,
    lng: 11.62,
    radius: 32,
    color: "#3F6B4A",
  },
  {
    id: "salento",
    name: "Salento & Otranto",
    tagline: "Masserie fortificate e filiera olivicola",
    region: "Puglia",
    lat: 40.18,
    lng: 18.25,
    radius: 36,
    color: "#C5A059",
  },
];

export function CustomRadarMap({
  venues,
  initialCategory = "all",
}: {
  venues: MapVenue[];
  center?: [number, number];
  zoom?: number;
  initialCategory?: string;
}) {
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);
  const [activeVenue, setActiveVenue] = useState<MapVenue | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement | null>(null);

  const SVG_WIDTH = 800;
  const SVG_HEIGHT = 880;

  // Percorsi geografici pre-calcolati
  const mainlandPath = useMemo(() => coordsToSvgPath(ITALY_OUTLINE_COORDS, SVG_WIDTH, SVG_HEIGHT), []);
  const sicilyPath = useMemo(() => coordsToSvgPath(SICILY_COORDS, SVG_WIDTH, SVG_HEIGHT), []);
  const sardiniaPath = useMemo(() => coordsToSvgPath(SARDINIA_COORDS, SVG_WIDTH, SVG_HEIGHT), []);

  // Filtraggio delle strutture
  const filteredVenues = useMemo(() => {
    return venues.filter((v) => {
      const matchCat = selectedCategory === "all" || v.type === selectedCategory;
      const matchRegion = !selectedRegion || (
        selectedRegion === "marche" && (v.city.toLowerCase().includes("macerata") || v.lat > 43.1 && v.lat < 43.6 && v.lng > 13.0) ||
        selectedRegion === "langhe" && (v.city.toLowerCase().includes("alba") || v.city.toLowerCase().includes("barolo") || v.lng < 8.3 && v.lat > 44.3) ||
        selectedRegion === "val-dorcia" && (v.city.toLowerCase().includes("pienza") || v.lng > 11.2 && v.lng < 12.0 && v.lat < 43.3) ||
        selectedRegion === "salento" && (v.city.toLowerCase().includes("lecce") || v.city.toLowerCase().includes("otranto") || v.lng > 17.5 && v.lat < 40.5)
      );
      return matchCat && matchRegion;
    });
  }, [venues, selectedCategory, selectedRegion]);

  // Seleziona la prima struttura come attiva al cambio
  useEffect(() => {
    if (filteredVenues.length > 0 && !activeVenue) {
      setActiveVenue(filteredVenues[0]);
    }
  }, [filteredVenues, activeVenue]);

  // Gestione Zoom e Pan
  function handleZoomIn() {
    setZoomLevel((prev) => Math.min(prev + 0.35, 2.8));
  }

  function handleZoomOut() {
    setZoomLevel((prev) => Math.max(prev - 0.35, 0.8));
  }

  function handleReset() {
    setZoomLevel(1);
    setPan({ x: 0, y: 0 });
    setSelectedRegion(null);
    setSelectedCategory("all");
    if (venues[0]) setActiveVenue(venues[0]);
  }

  function handleFocusRegion(zone: (typeof REGION_ZONES)[0]) {
    setSelectedRegion(zone.id);
    const { x, y } = projectCoord(zone.lat, zone.lng, SVG_WIDTH, SVG_HEIGHT);
    // Centra l'area selezionata
    const targetX = (SVG_WIDTH / 2 - x) * 1.5;
    const targetY = (SVG_HEIGHT / 2 - y) * 1.5;
    setZoomLevel(1.6);
    setPan({ x: targetX, y: targetY });

    // Seleziona una struttura di quest'area se presente
    const regionVenue = venues.find(
      (v) => Math.abs(v.lat - zone.lat) < 0.6 && Math.abs(v.lng - zone.lng) < 0.8
    );
    if (regionVenue) setActiveVenue(regionVenue);
  }

  // Interazioni di Dragging sulla mappa
  function handleMouseDown(e: React.MouseEvent) {
    if (e.button !== 0) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  }

  function handleMouseMove(e: React.MouseEvent) {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  }

  function handleMouseUp() {
    setIsDragging(false);
  }

  const getVenueIcon = (type: string) => {
    switch (type) {
      case "hotel":
        return <Bed size={13} />;
      case "agriturismo":
        return <Wine size={13} />;
      case "theater":
        return <Theater size={13} />;
      default:
        return <Utensils size={13} />;
    }
  };

  const getVenueColor = (type: string) => {
    switch (type) {
      case "hotel":
        return "#1C3A2E"; // Forest Green
      case "agriturismo":
        return "#C45C26"; // Terracotta
      case "theater":
        return "#7A2E32"; // Bòrdeaux/Gold
      default:
        return "#B8860B"; // Gold
    }
  };

  return (
    <div className="relative flex flex-col overflow-hidden rounded-[32px] border-2 border-forest/15 bg-[#FAF6EE] shadow-2xl transition-all">
      {/* HEADER DELLA MAPPA PERSONALIZZATA */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-forest/10 bg-white/80 px-6 py-4 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-forest text-gold shadow-md">
            <Compass size={20} className="animate-spin-slow" />
          </div>
          <div>
            <h3 className="font-serif text-lg font-bold text-forest">
              Carta Topografica Circuito RADICI
            </h3>
            <p className="text-xs text-olive font-medium">
              Georeferenziazione filiere corte e presidi territoriali d&apos;eccellenza
            </p>
          </div>
        </div>

        {/* FILTRI DI CATEGORIA */}
        <div className="flex flex-wrap items-center gap-1.5 rounded-full border border-forest/10 bg-[#FAF6EE] p-1 shadow-inner">
          {[
            { id: "all", label: "Tutte le strutture" },
            { id: "agriturismo", label: "Agriturismi KM 0", icon: Wine },
            { id: "hotel", label: "Dimore & Relais", icon: Bed },
            { id: "theater", label: "Teatri Storici", icon: Theater },
          ].map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold tracking-wide transition-all ${
                selectedCategory === cat.id
                  ? "bg-forest text-cream shadow-sm"
                  : "text-forest/70 hover:text-forest hover:bg-white/60"
              }`}
            >
              {cat.icon && <cat.icon size={12} />}
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* AREA MAPPA VETTORIALE INTERATTIVA */}
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className={`relative h-[560px] w-full select-none overflow-hidden ${
          isDragging ? "cursor-grabbing" : "cursor-grab"
        }`}
        style={{
          background: "radial-gradient(ellipse at 50% 40%, #FFFDF9 0%, #F5EFE0 70%, #E9DECA 100%)",
        }}
      >
        {/* RETICOLO GEOGRAFICO DI SFONDO (GRATICULE VINTAGE) */}
        <div className="pointer-events-none absolute inset-0 opacity-25">
          <svg className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="gridPattern" width="60" height="60" patternUnits="userSpaceOnUse">
                <path d="M 60 0 L 0 0 0 60" fill="none" stroke="#C5A059" strokeWidth="0.5" strokeDasharray="3 3" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#gridPattern)" />
          </svg>
        </div>

        {/* CONTAINER ZOOM & PAN SVG */}
        <div
          className="absolute inset-0 transition-transform duration-150 ease-out"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoomLevel})`,
            transformOrigin: "center center",
          }}
        >
          <svg
            viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
            className="h-full w-full filter drop-shadow-md"
            style={{ overflow: "visible" }}
          >
            <defs>
              {/* Filtro Glow Dorato per le aree RADICI */}
              <filter id="goldGlow" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="7" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>

              {/* Sfumatura Terra d'Italia */}
              <linearGradient id="italyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#EDE5D4" />
                <stop offset="50%" stopColor="#E2D6C0" />
                <stop offset="100%" stopColor="#D5C4A6" />
              </linearGradient>

              {/* Linee d'acqua costiere */}
              <radialGradient id="waterRings" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="rgba(197, 160, 89, 0.25)" />
                <stop offset="100%" stopColor="rgba(197, 160, 89, 0)" />
              </radialGradient>
            </defs>

            {/* MARI D'ITALIA - ETICHETTE CARTOGRAFICHE IN CORSIVO */}
            <g className="font-serif italic font-medium tracking-[0.25em] text-[#B8A37E] select-none pointer-events-none text-xs opacity-60">
              <text x="140" y="380" fill="#9C8B6B">M A R   L I G U R E</text>
              <text x="210" y="550" fill="#9C8B6B">M A R   T I R R E N O</text>
              <text x="560" y="390" fill="#9C8B6B">M A R   A D R I A T I C O</text>
              <text x="540" y="730" fill="#9C8B6B">M A R   I O N I O</text>
            </g>

            {/* ONDE CARTOGRAFICHE INTORNO ALLA PENISOLA */}
            <path
              d={mainlandPath}
              fill="none"
              stroke="#D8CCA8"
              strokeWidth="10"
              strokeLinejoin="round"
              className="opacity-40"
            />
            <path
              d={sicilyPath}
              fill="none"
              stroke="#D8CCA8"
              strokeWidth="9"
              strokeLinejoin="round"
              className="opacity-40"
            />
            <path
              d={sardiniaPath}
              fill="none"
              stroke="#D8CCA8"
              strokeWidth="9"
              strokeLinejoin="round"
              className="opacity-40"
            />

            {/* CORPO GEOGRAFICO ITALIA (SVG ACCURATO) */}
            <g>
              <path
                d={mainlandPath}
                fill="url(#italyGrad)"
                stroke="#A89270"
                strokeWidth="1.8"
                strokeLinejoin="round"
              />
              <path
                d={sicilyPath}
                fill="url(#italyGrad)"
                stroke="#A89270"
                strokeWidth="1.6"
                strokeLinejoin="round"
              />
              <path
                d={sardiniaPath}
                fill="url(#italyGrad)"
                stroke="#A89270"
                strokeWidth="1.6"
                strokeLinejoin="round"
              />
            </g>

            {/* AREE RADICI EVIDENZIATE CON RAGGI E CERCHI PULSANTI */}
            {REGION_ZONES.map((zone) => {
              const { x, y } = projectCoord(zone.lat, zone.lng, SVG_WIDTH, SVG_HEIGHT);
              const isSelected = selectedRegion === zone.id;

              return (
                <g key={zone.id} className="cursor-pointer" onClick={() => handleFocusRegion(zone)}>
                  {/* Bagliore radiale */}
                  <circle
                    cx={x}
                    cy={y}
                    r={zone.radius * (isSelected ? 1.4 : 1)}
                    fill={zone.color}
                    fillOpacity={isSelected ? 0.28 : 0.14}
                    stroke={zone.color}
                    strokeWidth={isSelected ? 2 : 1}
                    strokeDasharray="4 2"
                    filter="url(#goldGlow)"
                  />
                  <circle
                    cx={x}
                    cy={y}
                    r={isSelected ? 7 : 5}
                    fill={zone.color}
                    stroke="#FFFDF9"
                    strokeWidth="2"
                    className="animate-pulse"
                  />
                  {/* Label cartografica della macro-regione */}
                  <g className="pointer-events-none">
                    <rect
                      x={x + 12}
                      y={y - 12}
                      width={zone.name.length * 7.5 + 16}
                      height="20"
                      rx="6"
                      fill="#FFFDF9"
                      fillOpacity="0.92"
                      stroke={zone.color}
                      strokeWidth="0.8"
                    />
                    <text
                      x={x + 20}
                      y={y + 2}
                      fill="#1C3A2E"
                      fontSize="9.5"
                      fontFamily="serif"
                      fontWeight="bold"
                    >
                      {zone.name}
                    </text>
                  </g>
                </g>
              );
            })}

            {/* LINEE DI COLLEGAMENTO FILIERA VIRTUOSA TRA LE AREE */}
            <g stroke="#C5A059" strokeWidth="1" strokeDasharray="3 5" fill="none" opacity="0.45">
              {/* Langhe -> Val d'Orcia */}
              <path d="M 180 270 Q 280 340 380 435" />
              {/* Val d'Orcia -> Marche */}
              <path d="M 380 435 Q 440 420 500 420" />
              {/* Marche -> Salento */}
              <path d="M 500 420 Q 620 580 735 680" />
            </g>

            {/* PIN INTERATTIVI DELLE STRUTTURE (VENUES) */}
            {filteredVenues.map((venue) => {
              const { x, y } = projectCoord(venue.lat, venue.lng, SVG_WIDTH, SVG_HEIGHT);
              const isActive = activeVenue?.id === venue.id;
              const color = getVenueColor(venue.type);

              return (
                <g
                  key={venue.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveVenue(venue);
                  }}
                  className="cursor-pointer transition-transform hover:scale-125"
                  style={{ transformOrigin: `${x}px ${y}px` }}
                >
                  {/* Alone pulsante per il pin attivo */}
                  {isActive && (
                    <circle
                      cx={x}
                      cy={y - 16}
                      r="22"
                      fill={color}
                      fillOpacity="0.25"
                      className="animate-ping"
                    />
                  )}

                  {/* Ombra del pin sul terreno */}
                  <ellipse cx={x} cy={y} rx="6" ry="2.5" fill="#10241C" fillOpacity="0.35" />

                  {/* Gambo / Asta del pin */}
                  <path
                    d={`M ${x} ${y} L ${x - 7} ${y - 18} A 8 8 0 1 1 ${x + 7} ${y - 18} Z`}
                    fill={color}
                    stroke="#FFFDF9"
                    strokeWidth="1.6"
                    className="filter drop-shadow-md"
                  />

                  {/* Centro del marker con cerchio bianco */}
                  <circle cx={x} cy={y - 18} r="5" fill="#FFFDF9" />
                  <circle cx={x} cy={y - 18} r="2.5" fill={color} />

                  {/* Nome in miniatura se attivo */}
                  {isActive && (
                    <g className="pointer-events-none">
                      <rect
                        x={x - (venue.name.length * 3.6 + 10)}
                        y={y - 45}
                        width={venue.name.length * 7.2 + 20}
                        height="20"
                        rx="10"
                        fill="#1C3A2E"
                        stroke="#C5A059"
                        strokeWidth="1"
                        className="filter drop-shadow-lg"
                      />
                      <text
                        x={x}
                        y={y - 32}
                        textAnchor="middle"
                        fill="#FFFDF9"
                        fontSize="9.5"
                        fontWeight="600"
                        fontFamily="serif"
                      >
                        {venue.name}
                      </text>
                    </g>
                  )}
                </g>
              );
            })}
          </svg>
        </div>

        {/* ROSA DEI VENTI CARTOGRAFICA RINASCIMENTALE (Basso Sinistra) */}
        <div className="pointer-events-none absolute bottom-5 left-6 select-none opacity-80">
          <div className="relative flex h-24 w-24 items-center justify-center rounded-full border border-gold/30 bg-[#FFFDF9]/60 backdrop-blur-sm shadow-md">
            <span className="absolute top-1 text-[10px] font-bold text-forest">N</span>
            <span className="absolute bottom-1 text-[10px] font-bold text-forest">S</span>
            <span className="absolute right-1.5 text-[10px] font-bold text-forest">E</span>
            <span className="absolute left-1.5 text-[10px] font-bold text-forest">O</span>
            <div className="h-14 w-14 rounded-full border border-dashed border-gold/40"></div>
            <div className="absolute h-10 w-10 rotate-45 border border-forest/20"></div>
            <Compass size={28} className="text-terracotta" />
          </div>
          <p className="mt-1 text-center font-serif text-[10px] uppercase tracking-[0.2em] text-olive font-semibold">
            Rete Nazionale
          </p>
        </div>

        {/* CONTROLLI DI NAVIGAZIONE ZOOM / PAN (In alto a destra) */}
        <div className="absolute top-5 right-5 flex flex-col gap-1.5 rounded-2xl border border-forest/10 bg-white/90 p-1.5 shadow-lg backdrop-blur-sm">
          <button
            type="button"
            onClick={handleZoomIn}
            title="Ingrandisci mappa"
            className="flex h-9 w-9 items-center justify-center rounded-xl text-forest hover:bg-forest hover:text-cream transition-all"
          >
            <ZoomIn size={18} />
          </button>
          <button
            type="button"
            onClick={handleZoomOut}
            title="Riduci mappa"
            className="flex h-9 w-9 items-center justify-center rounded-xl text-forest hover:bg-forest hover:text-cream transition-all"
          >
            <ZoomOut size={18} />
          </button>
          <div className="my-0.5 h-[1px] bg-forest/10"></div>
          <button
            type="button"
            onClick={handleReset}
            title="Centra intera penisola"
            className="flex h-9 w-9 items-center justify-center rounded-xl text-forest hover:bg-forest hover:text-cream transition-all"
          >
            <RotateCcw size={16} />
          </button>
        </div>

        {/* PULSANTI QUICK-FOCUS SULLE 4 MACRO-AREE */}
        <div className="absolute top-5 left-5 flex flex-wrap gap-2">
          {REGION_ZONES.map((zone) => (
            <button
              key={zone.id}
              type="button"
              onClick={() => handleFocusRegion(zone)}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-serif font-medium shadow-sm transition-all backdrop-blur-sm ${
                selectedRegion === zone.id
                  ? "border-forest bg-forest text-gold scale-105"
                  : "border-forest/20 bg-white/90 text-forest hover:border-gold hover:bg-white"
              }`}
            >
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: zone.color }}
              ></span>
              {zone.name}
            </button>
          ))}
        </div>

        {/* CARD ANTEPRIMA FLUTTUANTE DELLA STRUTTURA SELEZIONATA (In basso a destra) */}
        {activeVenue && (
          <div className="absolute bottom-5 right-5 max-w-sm rounded-[24px] border-2 border-gold/40 bg-white/95 p-4 shadow-2xl backdrop-blur-md transition-all animate-fadeIn">
            <div className="flex items-start justify-between gap-3 border-b border-forest/10 pb-2.5">
              <div>
                <span
                  className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-cream"
                  style={{ backgroundColor: getVenueColor(activeVenue.type) }}
                >
                  {getVenueIcon(activeVenue.type)}
                  {venueTypeLabel(activeVenue.type)}
                </span>
                <h4 className="mt-1 font-serif text-lg font-bold text-forest leading-snug">
                  {activeVenue.name}
                </h4>
                <p className="flex items-center gap-1 text-xs text-olive font-medium">
                  <MapPin size={12} className="text-terracotta" />
                  {activeVenue.city}
                </p>
              </div>

              {activeVenue.localSupportPercent && (
                <div className="text-right">
                  <span className="rounded-lg bg-forest/5 px-2 py-1 text-[11px] font-bold text-terracotta border border-forest/10">
                    +{activeVenue.localSupportPercent}% KM 0
                  </span>
                </div>
              )}
            </div>

            <div className="mt-3 flex items-center justify-between gap-3">
              <div className="text-xs text-forest/80">
                <span className="font-semibold text-terracotta">
                  {activeVenue.type === "theater"
                    ? "Buono Spettacolo da 15 €"
                    : activeVenue.type === "hotel"
                    ? "Welfare Hotel 110-150 €"
                    : "Welfare Aperitivo 20-35 €"}
                </span>
                <p className="text-[10px] text-olive">Valido con cassetto dedicato</p>
              </div>

              <Link
                href={`/strutture/${activeVenue.slug}`}
                className="inline-flex items-center gap-1 rounded-full bg-forest px-4 py-2 text-xs font-semibold text-cream shadow-sm hover:bg-forest/90 transition-all"
              >
                Vedi scheda <ChevronRight size={13} />
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* FOOTER BARRIERA ECONOMICA & TRASPARENZA ESG */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-forest/10 bg-white/70 px-6 py-3 text-xs text-forest/80">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[#1C3A2E]"></span>
            <span>Hotel & Relais</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[#C45C26]"></span>
            <span>Agriturismo Gusto</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[#7A2E32]"></span>
            <span>Teatri & Cultura</span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-olive">
          <ShieldCheck size={14} className="text-gold" />
          <span>Tutte le coordinate sono verificate e convenzionate con il circuito RADICI</span>
        </div>
      </div>
    </div>
  );
}
