"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Sparkles,
  Ticket,
  Building,
  TrendingUp,
  ShieldCheck,
  Calendar,
  Layers,
  HeartHandshake,
  Users,
  Coins,
  Receipt,
  CheckCircle2,
  Clock,
  MapPin,
  Store,
  UserCheck,
  UserX,
  FileText,
  BadgeEuro,
  AlertTriangle,
  Plus,
  Trash2,
  Pencil,
  UploadCloud,
  X,
  ExternalLink,
  Check,
  Loader2,
  Utensils,
  Bed,
  ShoppingBag,
  Info,
  Lock,
} from "lucide-react";
import type { PromoterDashboardData } from "@/lib/promoters";
import { formatDate, formatDateTime, formatEuro } from "@/lib/utils";

type Props = {
  data: PromoterDashboardData;
};

const COVER_PRESETS = [
  { label: "🌿 Agriturismo KM 0", url: "/images/agriturismo-valle.jpg" },
  { label: "🍷 Relais Tra i Filari", url: "/images/langhe.jpg" },
  { label: "🍽️ Osteria & Borgo", url: "/images/val-dorcia.jpg" },
  { label: "🧺 Frantoio & Cesto KM 0", url: "/images/agriturismo-fontebella.jpg" },
  { label: "🎭 Teatro Storico", url: "/images/lauro-rossi.jpg" },
  { label: "☀️ Masseria Bianca", url: "/images/masseria-salento.jpg" },
];

const AVAILABLE_SERVICES = [
  "Wi-Fi Gratuito",
  "Parcheggio Riservato",
  "Degustazione Tipica KM 0",
  "Colazione Padronale",
  "Piscina Panoramica",
  "Visita Guidata Vigna / Frantoio",
  "Animali Ammessi",
  "Accessibilità Disabili",
];

export function PromotersDashboardView({ data }: Props) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<
    "economics" | "companies" | "venues" | "vouchers" | "grants" | "bookings"
  >("economics");

  // CMS Modals State
  const [isAddCompanyOpen, setIsAddCompanyOpen] = useState(false);
  const [isAddVenueOpen, setIsAddVenueOpen] = useState(false);
  const [isAddEventOpen, setIsAddEventOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingCompanyId, setDeletingCompanyId] = useState<number | null>(null);
  const [deletingVenueId, setDeletingVenueId] = useState<number | null>(null);
  const [deletingEventId, setDeletingEventId] = useState<number | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // File Upload State
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  async function handleFileUpload(file: File, target: "newVenue" | "editVenue") {
    setIsUploadingImage(true);
    setUploadError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.error || "Errore durante il caricamento della foto.");
      }
      if (target === "newVenue") {
        setVenueForm((prev) => ({ ...prev, coverImage: resData.url }));
      } else {
        setEditVenueForm((prev) => ({ ...prev, coverImage: resData.url }));
      }
    } catch (err: any) {
      setUploadError(err.message || "Impossibile caricare la foto.");
    } finally {
      setIsUploadingImage(false);
    }
  }

  // Modifica Impresa CSR State
  const [isEditCompanyOpen, setIsEditCompanyOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<any | null>(null);
  const [editCompanyForm, setEditCompanyForm] = useState({
    name: "",
    vatNumber: "",
    city: "",
    sector: "Manifattura & Meccanica",
    employeesCount: "50",
    fundedAmountEuros: "3750",
    description: "",
    localImpactDescription: "",
    reportUrl: "",
    sponsoredVenueId: "",
  });

  function openEditCompany(comp: any) {
    const sponsored = data.venuesList.find((v) => v.sponsorCompanyId === comp.id);
    setEditingCompany(comp);
    setEditCompanyForm({
      name: comp.name,
      vatNumber: comp.vatNumber,
      city: comp.city,
      sector: comp.sector,
      employeesCount: String(comp.employeesCount),
      fundedAmountEuros: String(Math.round(comp.fundedAmountCents / 100)),
      description: comp.description || "",
      localImpactDescription: comp.localImpactDescription || "",
      reportUrl: comp.reportUrl || "",
      sponsoredVenueId: sponsored ? String(sponsored.id) : "",
    });
    setIsEditCompanyOpen(true);
  }

  async function handleUpdateCompany(e: React.FormEvent) {
    e.preventDefault();
    if (!editingCompany) return;
    setIsSubmitting(true);
    setActionError(null);
    setActionSuccess(null);

    try {
      const res = await fetch(`/api/promoters/companies/${editingCompany.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editCompanyForm.name,
          vatNumber: editCompanyForm.vatNumber,
          city: editCompanyForm.city,
          sector: editCompanyForm.sector,
          employeesCount: Number(editCompanyForm.employeesCount) || 50,
          fundedAmountCents: Math.round(parseFloat(editCompanyForm.fundedAmountEuros || "0") * 100),
          description: editCompanyForm.description,
          localImpactDescription: editCompanyForm.localImpactDescription,
          reportUrl: editCompanyForm.reportUrl,
          sponsoredVenueId: editCompanyForm.sponsoredVenueId ? Number(editCompanyForm.sponsoredVenueId) : null,
        }),
      });

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.error || "Errore durante l'aggiornamento dell'impresa.");
      }

      setActionSuccess(`Impresa "${editCompanyForm.name}" modificata con successo!`);
      setIsEditCompanyOpen(false);
      setEditingCompany(null);
      router.refresh();
    } catch (err: any) {
      setActionError(err.message || "Errore durante l'aggiornamento dell'impresa.");
    } finally {
      setIsSubmitting(false);
    }
  }

  // Modifica Fornitore State
  const [isEditVenueOpen, setIsEditVenueOpen] = useState(false);
  const [editingVenue, setEditingVenue] = useState<any | null>(null);
  const [editVenueForm, setEditVenueForm] = useState({
    name: "",
    type: "agriturismo",
    destinationId: 1,
    city: "",
    province: "",
    region: "",
    description: "",
    longDescription: "",
    coverImage: "/images/agriturismo-valle.jpg",
    priceHotelEuros: "85",
    priceAperitivoEuros: "25",
    priceShowEuros: "0",
    basketName: "Cesto Prodotti Tipici",
    basketDescription: "",
    priceBasketEuros: "42",
    dailyCapacity: "10",
    sponsorCompanyId: "",
    services: ["Wi-Fi Gratuito", "Degustazione Tipica KM 0"],
  });

  function openEditVenue(venue: any) {
    setEditingVenue(venue);
    setEditVenueForm({
      name: venue.name,
      type: venue.type,
      destinationId: venue.destinationId,
      city: venue.city,
      province: venue.province,
      region: venue.region,
      description: venue.description,
      longDescription: venue.longDescription || venue.description,
      coverImage: venue.coverImage,
      priceHotelEuros: String(Math.round(venue.priceHotelCents / 100)),
      priceAperitivoEuros: String(Math.round(venue.priceAperitivoCents / 100)),
      priceShowEuros: String(Math.round(venue.priceShowCents / 100)),
      basketName: venue.basketName || "Cesto Prodotti Tipici del Territorio",
      basketDescription: venue.basketDescription || "",
      priceBasketEuros: String(Math.round(venue.priceBasketCents / 100)),
      dailyCapacity: "10",
      sponsorCompanyId: venue.sponsorCompanyId ? String(venue.sponsorCompanyId) : "",
      services: venue.services && venue.services.length > 0 ? venue.services : ["Wi-Fi Gratuito", "Degustazione Tipica KM 0"],
    });
    setIsEditVenueOpen(true);
  }

  function toggleEditVenueService(service: string) {
    setEditVenueForm((prev) => {
      const exists = prev.services.includes(service);
      return {
        ...prev,
        services: exists ? prev.services.filter((s) => s !== service) : [...prev.services, service],
      };
    });
  }

  async function handleUpdateVenue(e: React.FormEvent) {
    e.preventDefault();
    if (!editingVenue) return;
    setIsSubmitting(true);
    setActionError(null);
    setActionSuccess(null);

    try {
      const res = await fetch(`/api/promoters/venues/${editingVenue.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editVenueForm.name,
          type: editVenueForm.type,
          destinationId: Number(editVenueForm.destinationId),
          city: editVenueForm.city,
          province: editVenueForm.province,
          region: editVenueForm.region || undefined,
          description: editVenueForm.description,
          longDescription: editVenueForm.longDescription || editVenueForm.description,
          coverImage: editVenueForm.coverImage,
          priceHotelCents: Math.round(parseFloat(editVenueForm.priceHotelEuros || "0") * 100),
          priceAperitivoCents: Math.round(parseFloat(editVenueForm.priceAperitivoEuros || "0") * 100),
          priceShowCents: Math.round(parseFloat(editVenueForm.priceShowEuros || "0") * 100),
          basketName: editVenueForm.type === "producer" ? editVenueForm.basketName : null,
          basketDescription: editVenueForm.type === "producer" ? editVenueForm.basketDescription : null,
          priceBasketCents:
            editVenueForm.type === "producer"
              ? Math.round(parseFloat(editVenueForm.priceBasketEuros || "0") * 100)
              : 0,
          dailyCapacity: Number(editVenueForm.dailyCapacity) || 10,
          sponsorCompanyId: editVenueForm.sponsorCompanyId ? Number(editVenueForm.sponsorCompanyId) : null,
          services: editVenueForm.services,
        }),
      });

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.error || "Errore durante l'aggiornamento della struttura.");
      }

      setActionSuccess(`Struttura "${editVenueForm.name}" modificata con successo!`);
      setIsEditVenueOpen(false);
      setEditingVenue(null);
      router.refresh();
    } catch (err: any) {
      setActionError(err.message || "Errore durante l'aggiornamento della struttura.");
    } finally {
      setIsSubmitting(false);
    }
  }

  // Form State Impresa CSR
  const [companyForm, setCompanyForm] = useState({
    name: "",
    vatNumber: "",
    city: "",
    sector: "Manifattura & Meccanica",
    employeesCount: "50",
    fundedAmountEuros: "3750", // 50 * 75€ = 3.750€
    description: "",
    localImpactDescription: "",
    reportUrl: "",
    sponsoredVenueId: "",
    managerFirstName: "Elena",
    managerLastName: "Martini",
    managerEmail: "",
    managerPassword: "",
  });

  // Form State Fornitore
  const [venueForm, setVenueForm] = useState({
    name: "",
    type: "agriturismo",
    destinationId: data.destinationsList[0]?.id || 1,
    city: "",
    province: "",
    region: "",
    description: "",
    longDescription: "",
    coverImage: "/images/agriturismo-valle.jpg",
    priceHotelEuros: "85",
    priceAperitivoEuros: "25",
    priceShowEuros: "0",
    basketName: "Cesto Prodotti Tipici del Territorio",
    basketDescription: "Tris di confetture extra artigianali, Olio EVO monocultivar e bottiglia di vino DOC a filiera corta.",
    priceBasketEuros: "42",
    dailyCapacity: "10",
    sponsorCompanyId: "",
    services: ["Wi-Fi Gratuito", "Parcheggio Riservato", "Degustazione Tipica KM 0"],
    managerFirstName: "Paolo",
    managerLastName: "Luzi",
    managerEmail: "",
    managerPassword: "",
  });

  // Form State Evento / Spettacolo
  const [eventForm, setEventForm] = useState({
    title: "",
    category: "teatro",
    venueId: data.theatersList[0]?.id ? String(data.theatersList[0].id) : "",
    venueName: data.theatersList[0]?.name || "Teatro Lauro Rossi",
    city: data.theatersList[0]?.city || "Macerata",
    region: data.theatersList[0]?.region || "Marche",
    description: "",
    startsAt: "",
    capacity: "45",
    grantAmountEuros: "50",
    artistMeetupIncluded: true,
  });

  function toggleService(service: string) {
    setVenueForm((prev) => {
      const exists = prev.services.includes(service);
      return {
        ...prev,
        services: exists
          ? prev.services.filter((s) => s !== service)
          : [...prev.services, service],
      };
    });
  }

  // Creazione Nuova Impresa CSR
  async function handleCreateCompany(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setActionError(null);
    setActionSuccess(null);

    try {
      const res = await fetch("/api/promoters/companies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: companyForm.name,
          vatNumber: companyForm.vatNumber,
          city: companyForm.city,
          sector: companyForm.sector,
          employeesCount: Number(companyForm.employeesCount) || 50,
          fundedAmountCents: Math.round(parseFloat(companyForm.fundedAmountEuros || "0") * 100),
          description: companyForm.description,
          localImpactDescription: companyForm.localImpactDescription || undefined,
          reportUrl: companyForm.reportUrl || undefined,
          sponsoredVenueId: companyForm.sponsoredVenueId ? Number(companyForm.sponsoredVenueId) : undefined,
          managerFirstName: companyForm.managerFirstName,
          managerLastName: companyForm.managerLastName,
          managerEmail: companyForm.managerEmail,
          managerPassword: companyForm.managerPassword,
        }),
      });

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.error || "Errore nella registrazione dell'impresa CSR.");
      }

      setActionSuccess(
        `Impresa "${companyForm.name}" registrata con successo! Account HR creato per ${companyForm.managerEmail}.`
      );
      setIsAddCompanyOpen(false);
      setCompanyForm({
        name: "",
        vatNumber: "",
        city: "",
        sector: "Manifattura & Meccanica",
        employeesCount: "50",
        fundedAmountEuros: "3750",
        description: "",
        localImpactDescription: "",
        reportUrl: "",
        sponsoredVenueId: "",
        managerFirstName: "Elena",
        managerLastName: "Martini",
        managerEmail: "",
        managerPassword: "",
      });
      router.refresh();
    } catch (err: any) {
      setActionError(err.message || "Errore durante la creazione dell'impresa.");
    } finally {
      setIsSubmitting(false);
    }
  }

  // Eliminazione Impresa CSR
  async function handleDeleteCompany(companyId: number, companyName: string) {
    if (
      !window.confirm(
        `Sei sicuro di voler eliminare l'azienda "${companyName}" dal circuito? Verranno rimossi anche i piani welfare e l'account HR collegato, se non vi sono operazioni storiche.`
      )
    ) {
      return;
    }

    setDeletingCompanyId(companyId);
    setActionError(null);
    setActionSuccess(null);

    try {
      const res = await fetch(`/api/promoters/companies/${companyId}`, {
        method: "DELETE",
      });
      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.error || "Impossibile eliminare l'impresa.");
      }
      setActionSuccess(`Impresa "${companyName}" eliminata con successo dal circuito.`);
      router.refresh();
    } catch (err: any) {
      setActionError(err.message || "Errore durante l'eliminazione dell'impresa.");
    } finally {
      setDeletingCompanyId(null);
    }
  }

  // Creazione Nuovo Fornitore
  async function handleCreateVenue(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setActionError(null);
    setActionSuccess(null);

    try {
      const res = await fetch("/api/promoters/venues", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: venueForm.name,
          type: venueForm.type,
          destinationId: Number(venueForm.destinationId),
          city: venueForm.city,
          province: venueForm.province,
          region: venueForm.region || undefined,
          description: venueForm.description,
          longDescription: venueForm.longDescription || venueForm.description,
          coverImage: venueForm.coverImage,
          priceHotelCents: Math.round(parseFloat(venueForm.priceHotelEuros || "0") * 100),
          priceAperitivoCents: Math.round(parseFloat(venueForm.priceAperitivoEuros || "0") * 100),
          priceShowCents: Math.round(parseFloat(venueForm.priceShowEuros || "0") * 100),
          basketName: venueForm.type === "producer" ? venueForm.basketName : null,
          basketDescription: venueForm.type === "producer" ? venueForm.basketDescription : null,
          priceBasketCents:
            venueForm.type === "producer"
              ? Math.round(parseFloat(venueForm.priceBasketEuros || "0") * 100)
              : 0,
          dailyCapacity: Number(venueForm.dailyCapacity) || 10,
          sponsorCompanyId: venueForm.sponsorCompanyId ? Number(venueForm.sponsorCompanyId) : null,
          services: venueForm.services,
          managerFirstName: venueForm.managerFirstName,
          managerLastName: venueForm.managerLastName,
          managerEmail: venueForm.managerEmail || undefined,
          managerPassword: venueForm.managerPassword || undefined,
        }),
      });

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.error || "Errore nella creazione della struttura.");
      }

      const msg = resData.user
        ? `Fornitore "${venueForm.name}" inserito con successo! Account di accesso creato per ${resData.user.email}.`
        : `Fornitore "${venueForm.name}" inserito con successo nel circuito!`;

      setActionSuccess(msg);
      setIsAddVenueOpen(false);
      setVenueForm({
        name: "",
        type: "agriturismo",
        destinationId: data.destinationsList[0]?.id || 1,
        city: "",
        province: "",
        region: "",
        description: "",
        longDescription: "",
        coverImage: "/images/agriturismo-valle.jpg",
        priceHotelEuros: "85",
        priceAperitivoEuros: "25",
        priceShowEuros: "0",
        basketName: "Cesto Prodotti Tipici del Territorio",
        basketDescription: "Tris di confetture extra artigianali, Olio EVO monocultivar e bottiglia di vino DOC a filiera corta.",
        priceBasketEuros: "42",
        dailyCapacity: "10",
        sponsorCompanyId: "",
        services: ["Wi-Fi Gratuito", "Parcheggio Riservato", "Degustazione Tipica KM 0"],
        managerFirstName: "Paolo",
        managerLastName: "Luzi",
        managerEmail: "",
        managerPassword: "",
      });
      router.refresh();
    } catch (err: any) {
      setActionError(err.message || "Errore durante la creazione del fornitore.");
    } finally {
      setIsSubmitting(false);
    }
  }

  // Eliminazione Fornitore
  async function handleDeleteVenue(venueId: number, venueName: string) {
    if (
      !window.confirm(
        `Sei sicuro di voler eliminare "${venueName}" dal circuito? Questa operazione cancellerà la struttura dal catalogo.`
      )
    ) {
      return;
    }

    setDeletingVenueId(venueId);
    setActionError(null);
    setActionSuccess(null);

    try {
      const res = await fetch(`/api/promoters/venues/${venueId}`, {
        method: "DELETE",
      });
      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.error || "Impossibile eliminare la struttura.");
      }
      setActionSuccess(`Fornitore "${venueName}" eliminato con successo dal circuito.`);
      router.refresh();
    } catch (err: any) {
      setActionError(err.message || "Errore durante l'eliminazione.");
    } finally {
      setDeletingVenueId(null);
    }
  }

  // Creazione Nuovo Evento
  async function handleCreateEvent(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setActionError(null);
    setActionSuccess(null);

    try {
      const res = await fetch("/api/promoters/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: eventForm.title,
          category: eventForm.category,
          venueId: eventForm.venueId ? Number(eventForm.venueId) : null,
          venueName: eventForm.venueName,
          city: eventForm.city,
          region: eventForm.region,
          description: eventForm.description,
          startsAt: eventForm.startsAt || undefined,
          capacity: Number(eventForm.capacity) || 50,
          grantAmountCents: Math.round(parseFloat(eventForm.grantAmountEuros || "50") * 100),
          artistMeetupIncluded: eventForm.artistMeetupIncluded,
        }),
      });

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.error || "Errore nella creazione dello spettacolo.");
      }

      setActionSuccess(`Spettacolo "${eventForm.title}" inserito nel Cartellone RADICI!`);
      setIsAddEventOpen(false);
      setEventForm({
        title: "",
        category: "teatro",
        venueId: data.theatersList[0]?.id ? String(data.theatersList[0].id) : "",
        venueName: data.theatersList[0]?.name || "Teatro Lauro Rossi",
        city: data.theatersList[0]?.city || "Macerata",
        region: data.theatersList[0]?.region || "Marche",
        description: "",
        startsAt: "",
        capacity: "45",
        grantAmountEuros: "50",
        artistMeetupIncluded: true,
      });
      router.refresh();
    } catch (err: any) {
      setActionError(err.message || "Errore durante la creazione dello spettacolo.");
    } finally {
      setIsSubmitting(false);
    }
  }

  // Eliminazione Evento
  async function handleDeleteEvent(eventId: number, eventTitle: string) {
    if (
      !window.confirm(
        `Sei sicuro di voler eliminare lo spettacolo "${eventTitle}"? Verificare che non vi siano prenotazioni attive.`
      )
    ) {
      return;
    }

    setDeletingEventId(eventId);
    setActionError(null);
    setActionSuccess(null);

    try {
      const res = await fetch(`/api/promoters/events/${eventId}`, {
        method: "DELETE",
      });
      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.error || "Impossibile eliminare l'evento.");
      }
      setActionSuccess(`Spettacolo "${eventTitle}" eliminato con successo dal cartellone.`);
      router.refresh();
    } catch (err: any) {
      setActionError(err.message || "Errore durante l'eliminazione.");
    } finally {
      setDeletingEventId(null);
    }
  }

  return (
    <div className="space-y-8">
      {/* NOTIFICHE OPERATIVE DI SISTEMA */}
      {actionSuccess && (
        <div className="rounded-2xl border border-emerald-300 bg-emerald-50 p-4 text-emerald-900 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={18} className="text-emerald-700 shrink-0" />
            <p className="text-sm font-medium">{actionSuccess}</p>
          </div>
          <button
            type="button"
            onClick={() => setActionSuccess(null)}
            className="text-emerald-700 hover:text-emerald-900 cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {actionError && (
        <div className="rounded-2xl border border-rose-300 bg-rose-50 p-4 text-rose-900 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle size={18} className="text-rose-700 shrink-0" />
            <p className="text-sm font-medium">{actionError}</p>
          </div>
          <button
            type="button"
            onClick={() => setActionError(null)}
            className="text-rose-700 hover:text-rose-900 cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* HEADER: CABINA DI REGIA RADICI STARTUP */}
      <section className="rounded-[32px] bg-forest p-6 text-cream shadow-sm md:p-8">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-gold/20 px-3.5 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-gold">
              <Sparkles size={14} /> Startup RADICI · Platform Management & Backoffice
            </div>
            <h1 className="mt-3 font-serif text-3xl md:text-5xl">
              Control Room Piattaforma & Promotori
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-cream/80">
              Regia completa dell&apos;ecosistema: CMS integrato per l&apos;inserimento ed eliminazione di imprese CSR, fornitori convenzionati e spettacoli teatrali, con generazione istantanea degli account di accesso per il collaudo operativo.
            </p>
          </div>
          <div className="rounded-2xl border border-cream/15 bg-white/5 p-4 backdrop-blur-sm">
            <p className="text-xs text-cream/70">Gestore Piattaforma</p>
            <p className="font-medium text-cream">
              {data.promoterUser.firstName} {data.promoterUser.lastName}
            </p>
            <p className="text-xs text-gold">{data.promoterUser.email}</p>
          </div>
        </div>

        {/* KPI CHIAVE DELLA STARTUP */}
        <div className="mt-8 grid grid-cols-2 gap-4 border-t border-cream/15 pt-6 lg:grid-cols-4">
          <div className="rounded-2xl bg-white/5 p-4">
            <p className="text-xs uppercase tracking-wider text-cream/70">Volume Transato (GMV)</p>
            <p className="mt-2 font-serif text-2xl text-cream md:text-3xl">
              {formatEuro(data.totalGmvCents)}
            </p>
            <span className="mt-1 block text-[11px] text-cream/60">Flussi economici complessivi</span>
          </div>

          <div className="rounded-2xl bg-white/5 p-4 border border-gold/30 bg-gold/5">
            <p className="text-xs uppercase tracking-wider text-gold font-bold">Commissioni Radici (10%)</p>
            <p className="mt-2 font-serif text-2xl text-gold md:text-3xl">
              {formatEuro(data.totalCommissionsCents)}
            </p>
            <span className="mt-1 block text-[11px] text-gold/80">
              Ricavo della Startup Promotrice
            </span>
          </div>

          <div className="rounded-2xl bg-white/5 p-4">
            <p className="text-xs uppercase tracking-wider text-cream/70">Pagamenti Fornitori</p>
            <p className="mt-2 font-serif text-2xl text-cream md:text-3xl">
              {formatEuro(data.totalSettledCents)}
            </p>
            <span className="mt-1 block text-[11px] text-cream/60">
              Saldati ({formatEuro(data.totalPendingCents)} in attesa)
            </span>
          </div>

          <div className="rounded-2xl bg-white/5 p-4">
            <p className="text-xs uppercase tracking-wider text-cream/70">Ecosistema Attivo</p>
            <p className="mt-2 font-serif text-2xl text-cream md:text-3xl">
              {data.companiesCount} CSR · {data.venuesCount} Fornitori
            </p>
            <span className="mt-1 block text-[11px] text-cream/60">
              {data.employeesCount} dipendenti nel circuito
            </span>
          </div>
        </div>
      </section>

      {/* NAVIGAZIONE TAB */}
      <div className="flex flex-wrap gap-2 border-b border-mist">
        <button
          type="button"
          onClick={() => setActiveTab("economics")}
          className={`px-4 py-3 text-sm font-medium transition cursor-pointer ${
            activeTab === "economics"
              ? "border-b-2 border-forest font-semibold text-forest"
              : "text-olive hover:text-forest"
          }`}
        >
          Transazioni & Commissioni ({data.platformTransactions.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("companies")}
          className={`px-4 py-3 text-sm font-medium transition cursor-pointer ${
            activeTab === "companies"
              ? "border-b-2 border-forest font-semibold text-forest"
              : "text-olive hover:text-forest"
          }`}
        >
          Imprese CSR & Contratti ({data.companiesCount})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("venues")}
          className={`px-4 py-3 text-sm font-medium transition cursor-pointer ${
            activeTab === "venues"
              ? "border-b-2 border-forest font-semibold text-forest"
              : "text-olive hover:text-forest"
          }`}
        >
          Fornitori del Territorio ({data.venuesCount})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("vouchers")}
          className={`px-4 py-3 text-sm font-medium transition cursor-pointer ${
            activeTab === "vouchers"
              ? "border-b-2 border-forest font-semibold text-forest"
              : "text-olive hover:text-forest"
          }`}
        >
          Flussi Voucher ({data.totalVouchersIssued})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("grants")}
          className={`px-4 py-3 text-sm font-medium transition cursor-pointer ${
            activeTab === "grants"
              ? "border-b-2 border-forest font-semibold text-forest"
              : "text-olive hover:text-forest"
          }`}
        >
          Matching Grant Culturale ({data.totalGrantsAssigned})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("bookings")}
          className={`inline-flex items-center gap-1.5 px-4 py-3 text-sm font-medium transition cursor-pointer ${
            activeTab === "bookings"
              ? "border-b-2 border-forest font-semibold text-forest"
              : "text-olive hover:text-forest"
          }`}
        >
          <span>Prenotazioni & Overbooking Teatri ({data.totalCommunityBookingsCount})</span>
          {data.overbookingAlertsCount > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-rose-500 px-2 py-0.5 text-[10px] font-bold text-white shadow-xs animate-pulse">
              <AlertTriangle size={10} /> {data.overbookingAlertsCount} a rischio
            </span>
          )}
        </button>
      </div>

      {/* TAB 1: ECONOMICS & COMMISSIONI RADICI */}
      {activeTab === "economics" && (
        <section className="rounded-[28px] border border-forest/10 bg-white p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-mist">
            <div>
              <h2 className="font-serif text-2xl text-forest">Registro Transazioni & Commissioni</h2>
              <p className="text-xs text-olive">
                Supervisione delle transazioni intermediate, calcolo automatico della commissione Radici (10%) e stato dei saldi aziende-fornitori.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="rounded-full bg-forest/5 px-3 py-1 text-xs font-mono text-forest">
                Totale record: {data.platformTransactions.length}
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="text-[11px] uppercase tracking-wider text-olive border-b border-mist">
                <tr>
                  <th className="py-3">Data & ID</th>
                  <th className="py-3">Beneficiario / Dipendente</th>
                  <th className="py-3">Impresa Finanziatrice</th>
                  <th className="py-3">Fornitore / Struttura</th>
                  <th className="py-3">Servizio</th>
                  <th className="py-3 text-right">Lordo</th>
                  <th className="py-3 text-right text-gold">Fee Radici (10%)</th>
                  <th className="py-3 text-right">Netto Fornitore</th>
                  <th className="py-3 text-center">Stato Saldo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-mist">
                {data.platformTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-cream/40 transition">
                    <td className="py-3 font-mono text-xs text-olive">
                      {formatDate(tx.createdAt)}
                      <span className="block text-[10px] text-ink/40">#{tx.id}</span>
                    </td>
                    <td className="py-3 font-medium text-forest">
                      {tx.userName}
                      <span className="block text-[11px] text-olive">{tx.userEmail}</span>
                    </td>
                    <td className="py-3 text-forest">
                      {tx.companyName || "Acquisto Diretto"}
                      {tx.companyVat ? (
                        <span className="block text-[10px] text-olive font-mono">P.IVA {tx.companyVat}</span>
                      ) : null}
                    </td>
                    <td className="py-3 text-forest">
                      {tx.venueName}
                      <span className="block text-[11px] text-olive">{tx.venueCity} ({tx.venueType})</span>
                    </td>
                    <td className="py-3 text-xs capitalize text-forest">
                      {tx.serviceLabel}
                    </td>
                    <td className="py-3 text-right font-medium text-forest">
                      {formatEuro(tx.amountCents)}
                    </td>
                    <td className="py-3 text-right font-semibold text-gold bg-gold/5">
                      +{formatEuro(tx.commissionCents)}
                    </td>
                    <td className="py-3 text-right font-medium text-forest">
                      {formatEuro(tx.providerNetCents)}
                    </td>
                    <td className="py-3 text-center">
                      {tx.paymentStatus === "settled" ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-800">
                          <CheckCircle2 size={12} /> Saldato
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-semibold text-amber-800">
                          <Clock size={12} /> In attesa
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* TAB 2: IMPRESE CSR & CONTRATTI (CON CMS INSERISCI ED ELIMINA) */}
      {activeTab === "companies" && (
        <section className="rounded-[28px] border border-forest/10 bg-white p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-mist">
            <div>
              <div className="flex items-center gap-2">
                <Building size={22} className="text-forest" />
                <h2 className="font-serif text-2xl text-forest">Rete Imprese Finanziatrici CSR</h2>
              </div>
              <p className="text-xs text-olive mt-1">
                Gestione anagrafiche imprese, piani welfare territoriali, plafond stanziati e account HR aziendali per il collaudo immediato.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsAddCompanyOpen(true)}
              className="inline-flex items-center gap-2 rounded-2xl bg-forest px-4 py-2.5 text-xs font-semibold text-cream shadow-sm hover:bg-forest/90 transition-all shrink-0 cursor-pointer"
            >
              <Plus size={16} /> Registra Nuova Impresa CSR
            </button>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {data.companiesList.map((comp) => (
              <div
                key={comp.id}
                className="rounded-[28px] border border-forest/10 bg-white p-6 shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-olive">
                        {comp.sector} · {comp.city}
                      </span>
                      <h3 className="font-serif text-2xl font-bold text-forest">{comp.name}</h3>
                      <p className="text-xs text-olive font-mono mt-0.5">P.IVA: {comp.vatNumber}</p>
                    </div>
                    <span className="rounded-full bg-forest/5 px-2.5 py-1 text-xs font-semibold text-forest">
                      {comp.employeesCount} dipendenti
                    </span>
                  </div>

                  {/* Informazioni Account HR / Collaudo */}
                  <div className="mt-3 flex items-center justify-between text-xs bg-cream/70 rounded-xl p-2.5 border border-forest/10">
                    <div>
                      <p className="text-[10px] uppercase font-bold text-olive">Account Referente HR</p>
                      <p className="font-medium text-forest truncate max-w-[190px]">
                        {comp.managerName || "Referente HR"}
                      </p>
                      <p className="text-[11px] text-olive font-mono truncate max-w-[190px]">
                        {comp.managerEmail || "Nessun account HR"}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => openEditCompany(comp)}
                        title="Modifica dati impresa"
                        className="rounded-lg p-1.5 text-forest hover:bg-forest/10 transition cursor-pointer"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteCompany(comp.id, comp.name)}
                        disabled={deletingCompanyId === comp.id}
                        title="Elimina impresa"
                        className="rounded-lg p-1.5 text-terracotta hover:bg-rose-50 transition cursor-pointer disabled:opacity-50"
                      >
                        {deletingCompanyId === comp.id ? (
                          <Loader2 size={15} className="animate-spin" />
                        ) : (
                          <Trash2 size={15} />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2 border-t border-mist pt-4 text-xs">
                    <div className="flex justify-between">
                      <span className="text-olive">Plafond Welfare Finanziato:</span>
                      <span className="font-semibold text-forest">{formatEuro(comp.fundedAmountCents)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-olive">Voucher Emessi / Riscattati:</span>
                      <span className="font-semibold text-forest">
                        {comp.totalVouchersIssued} emessi · {comp.totalVouchersRedeemed} riscattati
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-olive">Debito Verso Strutture:</span>
                      <span className="font-semibold text-forest">{formatEuro(comp.totalDebtToProvidersCents)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-olive">Già Saldato ai Fornitori:</span>
                      <span className="font-semibold text-emerald-700">{formatEuro(comp.totalSettledToProvidersCents)}</span>
                    </div>
                  </div>
                </div>

                {comp.sponsoredVenuesNames && comp.sponsoredVenuesNames.length > 0 && (
                  <div className="mt-3 text-xs bg-gold/15 text-forest rounded-xl p-2.5 border border-gold/30 flex items-center justify-between gap-1.5">
                    <span className="font-medium text-[11px] truncate">🏆 Sponsor: <strong>{comp.sponsoredVenuesNames.join(", ")}</strong></span>
                  </div>
                )}

                <div className="mt-4 border-t border-mist pt-4 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-olive">Saldo Aperto:</span>
                    <span className="font-serif text-base font-bold text-terracotta">
                      {formatEuro(comp.totalPendingToProvidersCents)}
                    </span>
                  </div>
                  <div className="flex justify-end pt-1">
                    <a
                      href={`/imprese/${comp.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] font-semibold text-forest hover:text-gold hover:underline inline-flex items-center gap-1"
                    >
                      Scheda Pubblica Impresa &rarr;
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* TAB 3: FORNITORI DEL TERRITORIO (CON CMS INSERISCI ED ELIMINA) */}
      {activeTab === "venues" && (
        <section className="rounded-[28px] border border-forest/10 bg-white p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-mist">
            <div>
              <div className="flex items-center gap-2">
                <Store size={22} className="text-forest" />
                <h2 className="font-serif text-2xl text-forest">Catalogo Fornitori & Strutture Convenzionate</h2>
              </div>
              <p className="text-xs text-olive mt-1">
                Backoffice completo: visualizza, inserisci nuove strutture con credenziali d&apos;accesso per il collaudo ed elimina in sicurezza.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsAddVenueOpen(true)}
              className="inline-flex items-center gap-2 rounded-2xl bg-forest px-4 py-2.5 text-xs font-semibold text-cream shadow-sm hover:bg-forest/90 transition-all shrink-0 cursor-pointer"
            >
              <Plus size={16} /> Aggiungi Nuovo Fornitore
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[950px] text-left text-sm">
              <thead className="text-[11px] uppercase tracking-wider text-olive border-b border-mist">
                <tr>
                  <th className="py-3">Fornitore / Struttura</th>
                  <th className="py-3">Tipologia</th>
                  <th className="py-3">Destinazione & Sede</th>
                  <th className="py-3">Offerta & Prezzi</th>
                  <th className="py-3">Sponsor CSR</th>
                  <th className="py-3">Riscatti</th>
                  <th className="py-3">Volume Lordo</th>
                  <th className="py-3 text-gold">Fee Radici</th>
                  <th className="py-3 text-right">Netto</th>
                  <th className="py-3 text-center">Azioni</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-mist">
                {data.venuesList.map((v) => (
                  <tr key={v.id} className="hover:bg-cream/40 transition">
                    <td className="py-3 font-semibold text-forest">
                      <div className="flex items-center gap-3">
                        <img
                          src={v.coverImage}
                          alt={v.name}
                          className="h-10 w-10 rounded-xl object-cover border border-mist shadow-xs shrink-0"
                        />
                        <div>
                          <p className="font-bold text-forest">{v.name}</p>
                          <p className="text-[11px] text-olive font-mono">{v.checkinCode}</p>
                          {v.managerEmail && (
                            <p className="text-[10px] text-emerald-800 font-mono">👤 {v.managerEmail}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3">
                      <span className="rounded-full bg-forest/5 px-2.5 py-0.5 text-xs font-semibold text-forest capitalize border border-forest/10">
                        {v.type}
                      </span>
                    </td>
                    <td className="py-3 text-xs text-olive">
                      <p className="font-medium text-forest">{v.city} ({v.province})</p>
                      <p className="text-[10px] text-olive">{v.destinationName}</p>
                    </td>
                    <td className="py-3 text-xs text-forest">
                      {v.type === "hotel" || v.type === "agriturismo" ? (
                        <div>
                          <p>Notte: <strong>{formatEuro(v.priceHotelCents)}</strong></p>
                          {v.priceAperitivoCents > 0 && (
                            <p className="text-olive">Cena: {formatEuro(v.priceAperitivoCents)}</p>
                          )}
                        </div>
                      ) : v.type === "restaurant" ? (
                        <p>Menù: <strong>{formatEuro(v.priceAperitivoCents)}</strong></p>
                      ) : v.type === "producer" ? (
                        <div>
                          <p className="font-medium text-forest truncate max-w-[140px]">{v.basketName || "Cesto Tipico"}</p>
                          <p className="text-olive">Cesto: <strong>{formatEuro(v.priceBasketCents)}</strong></p>
                        </div>
                      ) : (
                        <p>Spettacolo: <strong>{formatEuro(v.priceShowCents)}</strong></p>
                      )}
                    </td>
                    <td className="py-3 text-xs">
                      {v.sponsorCompanyName ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-gold/15 px-2 py-0.5 text-[10px] font-bold text-gold border border-gold/30">
                          {v.sponsorCompanyName}
                        </span>
                      ) : (
                        <span className="text-olive text-[11px]">Nessuno</span>
                      )}
                    </td>
                    <td className="py-3 font-medium text-forest">
                      {v.redeemedCount}
                      <span className="block text-[10px] text-olive">{v.attendedCount} presenti</span>
                    </td>
                    <td className="py-3 font-semibold text-forest">{formatEuro(v.grossVolumeCents)}</td>
                    <td className="py-3 font-semibold text-forest bg-gold/5">+{formatEuro(v.commissionsPaidCents)}</td>
                    <td className="py-3 text-right font-medium text-forest">{formatEuro(v.netRevenueCents)}</td>
                    <td className="py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Link
                          href={`/strutture/${v.slug}`}
                          target="_blank"
                          title="Vedi scheda pubblica"
                          className="rounded-lg p-1.5 text-olive hover:bg-forest/10 hover:text-forest transition"
                        >
                          <ExternalLink size={15} />
                        </Link>
                        <button
                          type="button"
                          onClick={() => openEditVenue(v)}
                          title="Modifica struttura"
                          className="rounded-lg p-1.5 text-forest hover:bg-forest/10 transition cursor-pointer"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteVenue(v.id, v.name)}
                          disabled={deletingVenueId === v.id}
                          title="Elimina fornitore dal circuito"
                          className="rounded-lg p-1.5 text-terracotta hover:bg-rose-50 transition cursor-pointer disabled:opacity-50"
                        >
                          {deletingVenueId === v.id ? (
                            <Loader2 size={15} className="animate-spin" />
                          ) : (
                            <Trash2 size={15} />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* TAB 4: FLUSSI VOUCHER */}
      {activeTab === "vouchers" && (
        <section className="rounded-[28px] border border-forest/10 bg-white p-6 shadow-sm space-y-6">
          <div className="pb-4 border-b border-mist">
            <h2 className="font-serif text-2xl text-forest">Ciclo di Vita & Flusso Voucher Welfare</h2>
            <p className="text-xs text-olive">
              Ogni selezione/riscatto di un voucher attiva l&apos;obbligo di pagamento a carico dell&apos;azienda CSR. La presenza reale viene monitorata per l&apos;impatto ESG.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div className="rounded-2xl border border-forest/10 bg-cream/40 p-4">
              <p className="text-xs uppercase text-olive">Voucher Totali Emessi</p>
              <p className="mt-2 font-serif text-3xl text-forest">{data.totalVouchersIssued}</p>
              <span className="text-[11px] text-olive">Stanziati nei piani welfare</span>
            </div>
            <div className="rounded-2xl border border-forest/10 bg-cream/40 p-4">
              <p className="text-xs uppercase text-olive">Riscattati (Dovuti)</p>
              <p className="mt-2 font-serif text-3xl text-forest font-bold">{data.totalVouchersRedeemed}</p>
              <span className="text-[11px] text-forest">Onere certo per l&apos;azienda</span>
            </div>
            <div className="rounded-2xl border border-forest/10 bg-cream/40 p-4">
              <p className="text-xs uppercase text-forest">Presenze Effettive</p>
              <p className="mt-2 font-serif text-3xl text-forest">{data.totalVouchersAttended}</p>
              <span className="text-[11px] text-forest">Ospiti verificati sul territorio</span>
            </div>
            <div className="rounded-2xl border border-forest/10 bg-cream/40 p-4">
              <p className="text-xs uppercase text-terracotta">No-Show Segnalati</p>
              <p className="mt-2 font-serif text-3xl text-terracotta">{data.totalVouchersNoShow}</p>
              <span className="text-[11px] text-olive">Compenso comunque dovuto</span>
            </div>
          </div>
        </section>
      )}

      {/* TAB 5: MATCHING GRANT CULTURALE */}
      {activeTab === "grants" && (
        <section className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-[28px] border border-forest/10 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-2 text-forest">
                <ShieldCheck size={20} className="text-forest" />
                <h2 className="font-serif text-2xl">Natura del Matching Grant Culturale</h2>
              </div>
              <p className="mt-3 text-sm leading-6 text-ink/80">
                Il Matching Grant <strong>NON è un voucher welfare aziendale</strong>: è un beneficio culturale integrativo stanziato direttamente dalla <strong>Startup RADICI</strong> e dai partner culturali (valore 50€: 25€ + 25€ per lavoratore e accompagnatore).
              </p>
              <div className="mt-4 rounded-2xl bg-cream p-4 border border-gold/30 text-xs text-forest space-y-1">
                <p>• <strong>Capienza Fondo Promotori:</strong> {formatEuro(data.grantFundCapacityCents)}</p>
                <p>• <strong>Grant Erogati ad Oggi:</strong> {formatEuro(data.grantFundSpentCents)} ({data.totalGrantsAssigned} attivazioni)</p>
                <p>• <strong>Fondo Residuo Disponibile:</strong> {formatEuro(data.grantFundCapacityCents - data.grantFundSpentCents)}</p>
              </div>
            </div>

            <div className="rounded-[28px] border border-forest/10 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-2 text-forest">
                <Calendar size={20} className="text-terracotta" />
                <h2 className="font-serif text-2xl">Finestre di Conferma T-7 / T-3</h2>
              </div>
              <p className="mt-3 text-sm leading-6 text-ink/80">
                A differenza del voucher welfare (dovuto al riscatto), il Matching Grant richiede la conferma del posto a teatro a 7 giorni dall&apos;evento (T-7) con deadline a 3 giorni (T-3), per garantire la piena capienza ai teatri partner.
              </p>
              <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
                <div className="rounded-xl bg-forest/5 p-2">
                  <span className="block font-bold text-forest">{data.totalGrantsConfirmed}</span>
                  <span className="text-[10px] text-olive">Confermati</span>
                </div>
                <div className="rounded-xl bg-forest/5 p-2">
                  <span className="block font-bold text-forest">{data.totalGrantsAttended}</span>
                  <span className="text-[10px] text-olive">Presenti a Teatro</span>
                </div>
                <div className="rounded-xl bg-forest/5 p-2">
                  <span className="block font-bold text-terracotta">{data.totalGrantsExpired + data.totalGrantsNoShow}</span>
                  <span className="text-[10px] text-olive">Posti Rilasciati</span>
                </div>
              </div>
            </div>
          </div>

          {/* Registro Grant */}
          <div className="rounded-[28px] border border-forest/10 bg-white p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-mist">
              <h3 className="font-serif text-2xl text-forest">Registro Matching Grant Attivati</h3>
              <button
                type="button"
                onClick={() => setIsAddEventOpen(true)}
                className="inline-flex items-center gap-2 rounded-2xl bg-forest px-4 py-2 text-xs font-semibold text-cream shadow-sm hover:bg-forest/90 transition cursor-pointer"
              >
                <Plus size={16} /> Aggiungi Spettacolo
              </button>
            </div>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-[11px] uppercase tracking-wider text-olive border-b border-mist">
                  <tr>
                    <th className="py-3">Dipendente</th>
                    <th className="py-3">Azienda CSR</th>
                    <th className="py-3">Struttura Soggiorno</th>
                    <th className="py-3">Teatro Convenzionato</th>
                    <th className="py-3">Stato Grant</th>
                    <th className="py-3 text-right">Valore Promotori</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-mist">
                  {data.grants.map((grant) => (
                    <tr key={grant.voucherId} className="hover:bg-cream/40 transition">
                      <td className="py-3 font-medium text-forest">
                        {grant.employeeName}
                        <span className="block text-[11px] text-olive">{grant.employeeEmail}</span>
                      </td>
                      <td className="py-3 text-forest">{grant.companyName}</td>
                      <td className="py-3 text-forest">
                        {grant.venueName}
                        <span className="block text-[11px] text-olive">{grant.venueCity}</span>
                      </td>
                      <td className="py-3 text-xs text-forest">{grant.theaterName}</td>
                      <td className="py-3 text-xs">
                        <span className="rounded-full bg-forest/10 px-2 py-0.5 text-xs font-semibold text-forest capitalize">
                          {grant.status}
                        </span>
                      </td>
                      <td className="py-3 text-right font-serif text-base text-forest">
                        {formatEuro(grant.grantValueCents)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {/* TAB 6: PRENOTAZIONI COMMUNITY & CONTROLLO OVERBOOKING TEATRI */}
      {activeTab === "bookings" && (
        <section className="space-y-8">
          {/* KPI Prenotazioni Community */}
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div className="rounded-[24px] border border-forest/10 bg-white p-5 shadow-xs">
              <p className="text-xs font-semibold uppercase tracking-wider text-olive">Prenotazioni Totali</p>
              <p className="mt-2 font-serif text-3xl text-forest">{data.totalCommunityBookingsCount}</p>
              <p className="text-xs text-olive mt-1">Ospiti ed eventi convenzionati</p>
            </div>
            <div className="rounded-[24px] border border-forest/10 bg-white p-5 shadow-xs">
              <p className="text-xs font-semibold uppercase tracking-wider text-olive">Posti Riservati Community</p>
              <p className="mt-2 font-serif text-3xl text-forest">{data.totalCommunityBookingsSeats}</p>
              <p className="text-xs text-olive mt-1">Posti occupati in totale</p>
            </div>
            <div className="rounded-[24px] border border-forest/10 bg-white p-5 shadow-xs">
              <p className="text-xs font-semibold uppercase tracking-wider text-olive">Presenze Riconfermate</p>
              <p className="mt-2 font-serif text-3xl text-emerald-700">{data.totalCommunityConfirmedCount}</p>
              <p className="text-xs text-olive mt-1">Confermate da ospiti o strutture</p>
            </div>
            <div className="rounded-[24px] border border-rose-200 bg-rose-50/50 p-5 shadow-xs">
              <p className="text-xs font-semibold uppercase tracking-wider text-rose-800">Spettacoli a Rischio Overbooking</p>
              <p className="mt-2 font-serif text-3xl text-rose-700">{data.overbookingAlertsCount}</p>
              <p className="text-xs text-rose-800/80 mt-1">Capienza residua ≤ 15%</p>
            </div>
          </div>

          {/* Sezione Monitoraggio Capienza Spettacoli Culturali & Anti-Overbooking */}
          <div className="rounded-[28px] border border-forest/10 bg-white p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-mist pb-4">
              <div>
                <h3 className="font-serif text-2xl text-forest">Monitoraggio Capienza Spettacoli & Teatri</h3>
                <p className="text-xs text-olive">
                  Visione aggregata in tempo reale: posti assegnati al Welfare Matching Grant + posti prenotati dalla Community Amici.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddEventOpen(true)}
                  className="inline-flex items-center gap-2 rounded-2xl bg-forest px-4 py-2.5 text-xs font-semibold text-cream shadow-sm hover:bg-forest/90 transition-all cursor-pointer"
                >
                  <Plus size={16} /> Inserisci Nuovo Spettacolo
                </button>
                <span className="rounded-full bg-forest/5 px-3 py-1 text-xs font-mono text-forest">
                  {data.events.length} eventi programmati
                </span>
              </div>
            </div>

            <div className="mt-6 grid gap-6 md:grid-cols-2">
              {data.events.map((ev) => (
                <div
                  key={ev.id}
                  className={`rounded-2xl border p-5 transition-all flex flex-col justify-between ${
                    ev.isOverbookingRisk
                      ? "border-rose-300 bg-rose-50/30 shadow-sm"
                      : "border-forest/10 bg-cream/30"
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="inline-block rounded-full bg-forest/5 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-forest border border-forest/10">
                          {ev.category}
                        </span>
                        <h4 className="mt-1 font-serif text-xl font-bold text-forest">{ev.title}</h4>
                        <p className="text-xs text-olive">{ev.venueName} · {ev.city}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1.5">
                        {ev.isOverbookingRisk ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2.5 py-1 text-xs font-bold text-rose-800 animate-pulse">
                            <AlertTriangle size={12} /> Rischio Overbooking
                          </span>
                        ) : (
                          <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-800">
                            Capienza Regolare
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDeleteEvent(ev.id, ev.title)}
                          disabled={deletingEventId === ev.id}
                          title="Elimina spettacolo dal cartellone"
                          className="inline-flex items-center gap-1 text-[11px] text-terracotta hover:underline cursor-pointer disabled:opacity-50 mt-1"
                        >
                          {deletingEventId === ev.id ? (
                            <Loader2 size={12} className="animate-spin" />
                          ) : (
                            <Trash2 size={12} />
                          )}
                          <span>Elimina evento</span>
                        </button>
                      </div>
                    </div>

                    <p className="mt-2 text-xs text-ink/75 line-clamp-2">{ev.description}</p>

                    {/* Barra visuale occupazione capienza */}
                    <div className="mt-4">
                      <div className="flex justify-between text-xs text-ink/80 mb-1.5 font-medium">
                        <span>Occupati: {ev.seatsOccupied} / {ev.capacity} posti</span>
                        <span className="font-bold">{ev.occupancyPercent}%</span>
                      </div>
                      <div className="h-3 w-full overflow-hidden rounded-full bg-gray-200 flex">
                        {/* Porzione Welfare Grant */}
                        <div
                          style={{ width: `${Math.min(100, Math.round((ev.welfareSeats / ev.capacity) * 100))}%` }}
                          className="bg-gold h-full"
                          title={`Welfare Matching Grant: ${ev.welfareSeats} posti`}
                        />
                        {/* Porzione Community Bookings */}
                        <div
                          style={{
                            width: `${Math.min(
                              100 - Math.round((ev.welfareSeats / ev.capacity) * 100),
                              Math.round((ev.communitySeats / ev.capacity) * 100)
                            )}%`,
                          }}
                          className="bg-emerald-600 h-full"
                          title={`Community Bookings: ${ev.communitySeats} posti`}
                        />
                      </div>
                      <div className="mt-2 flex items-center justify-between text-[11px] text-olive">
                        <div className="flex items-center gap-3">
                          <span className="inline-flex items-center gap-1">
                            <span className="h-2 w-2 rounded-full bg-gold" /> Welfare Grant ({ev.welfareSeats})
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <span className="h-2 w-2 rounded-full bg-emerald-600" /> Community ({ev.communitySeats})
                          </span>
                        </div>
                        <span className="font-bold text-forest">
                          {ev.seatsAvailable} posti liberi
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-forest/10 flex items-center justify-between text-xs text-olive">
                    <span>Data: {ev.startsAt ? formatDateTime(ev.startsAt) : "Da programmare"}</span>
                    <span>Grant: {formatEuro(ev.grantAmountCents)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Registro Globale Territoriale delle Prenotazioni */}
          <div className="rounded-[28px] border border-forest/10 bg-white p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-mist pb-4">
              <div>
                <h3 className="font-serif text-2xl text-forest">Registro Territoriale delle Prenotazioni</h3>
                <p className="text-xs text-olive">
                  Tutte le prenotazioni effettuate dagli amici della community verso agriturismi, hotel, cene e teatri convenzionati.
                </p>
              </div>
            </div>

            {data.communityBookings.length === 0 ? (
              <div className="py-12 text-center text-olive text-sm">
                Nessuna prenotazione community registrata sul circuito al momento.
              </div>
            ) : (
              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[750px] text-left text-xs">
                  <thead>
                    <tr className="border-b border-mist text-olive uppercase tracking-wider text-[10px]">
                      <th className="pb-3">Data & Orario</th>
                      <th className="pb-3">Ospite</th>
                      <th className="pb-3">Struttura / Teatro</th>
                      <th className="pb-3">Evento / Servizio</th>
                      <th className="pb-3 text-center">Posti</th>
                      <th className="pb-3 text-right">Importo Netto</th>
                      <th className="pb-3 text-center">Stato</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-mist">
                    {data.communityBookings.map((b) => (
                      <tr key={b.id} className="hover:bg-cream/40 transition">
                        <td className="py-3 font-medium text-forest">
                          {formatDate(b.bookingDate)}
                          <span className="block text-[11px] text-olive">{b.timeSlot || "Standard"}</span>
                        </td>
                        <td className="py-3 text-forest">
                          <p className="font-semibold">{b.guestName}</p>
                          <p className="text-[11px] text-olive">{b.guestEmail}</p>
                          {b.guestPhone && <p className="text-[10px] text-ink/70">Tel: {b.guestPhone}</p>}
                        </td>
                        <td className="py-3 text-forest">
                          <p className="font-medium">{b.venueName}</p>
                          <p className="text-[11px] text-olive">{b.venueCity} ({b.venueType})</p>
                        </td>
                        <td className="py-3 text-forest">
                          {b.eventTitle ? (
                            <span className="font-bold text-forest">🎭 {b.eventTitle}</span>
                          ) : (
                            <span className="text-olive capitalize">{b.venueType}</span>
                          )}
                        </td>
                        <td className="py-3 text-center">
                          <span className="rounded-full bg-cream px-2.5 py-0.5 font-bold text-forest border border-forest/10">
                            {b.partySize} {b.partySize === 1 ? "posto" : "posti"}
                          </span>
                        </td>
                        <td className="py-3 text-right font-serif text-sm font-bold text-forest">
                          {formatEuro(b.finalPriceCents)}
                        </td>
                        <td className="py-3 text-center">
                          {b.status === "presence_confirmed" ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800">
                              ✓ Presenza Riconfermata
                            </span>
                          ) : b.status === "confirmed" ? (
                            <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-[11px] font-semibold text-blue-800">
                              Accettata dal gestore
                            </span>
                          ) : b.status === "pending" ? (
                            <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-semibold text-amber-800">
                              In attesa
                            </span>
                          ) : b.status === "attended" ? (
                            <span className="rounded-full bg-purple-100 px-2.5 py-0.5 text-[11px] font-semibold text-purple-800">
                              Completata
                            </span>
                          ) : (
                            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-700 capitalize">
                              {b.status}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ========================================================= */}
      {/* MODALE CMS 0: REGISTRA NUOVA IMPRESA CSR                  */}
      {/* ========================================================= */}
      {isAddCompanyOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl space-y-6 border border-forest/10 my-auto">
            <div className="flex items-start justify-between border-b border-mist pb-4">
              <div>
                <div className="inline-flex items-center gap-1.5 rounded-full bg-forest/5 px-2.5 py-0.5 text-xs font-semibold text-forest">
                  <Building size={14} /> Backoffice CMS Imprese CSR
                </div>
                <h3 className="font-serif text-2xl text-forest mt-1">Registra Nuova Impresa CSR</h3>
                <p className="text-xs text-olive">
                  Inserisci l&apos;azienda cliente, il plafond welfare finanziato e le credenziali del referente HR.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddCompanyOpen(false)}
                className="rounded-full p-1.5 text-olive hover:bg-mist transition cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateCompany} className="space-y-4">
              {/* Ragione Sociale e Partita IVA */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-forest mb-1">
                    Ragione Sociale Impresa *
                  </label>
                  <input
                    type="text"
                    required
                    value={companyForm.name}
                    onChange={(e) => setCompanyForm({ ...companyForm, name: e.target.value })}
                    placeholder="es. Manifatture Picene S.p.A."
                    className="w-full rounded-xl border border-forest/20 px-3.5 py-2 text-sm text-forest focus:border-forest focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-forest mb-1">
                    Partita IVA *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={16}
                    value={companyForm.vatNumber}
                    onChange={(e) => setCompanyForm({ ...companyForm, vatNumber: e.target.value.toUpperCase() })}
                    placeholder="01234567890"
                    className="w-full rounded-xl border border-forest/20 px-3.5 py-2 text-sm text-forest focus:border-forest focus:outline-none font-mono"
                  />
                </div>
              </div>

              {/* Sede Legale e Settore */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-forest mb-1">
                    Sede Legale / Città *
                  </label>
                  <input
                    type="text"
                    required
                    value={companyForm.city}
                    onChange={(e) => setCompanyForm({ ...companyForm, city: e.target.value })}
                    placeholder="es. Civitanova Marche, Ancona..."
                    className="w-full rounded-xl border border-forest/20 px-3.5 py-2 text-sm text-forest focus:border-forest focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-forest mb-1">
                    Settore Merceologico / Industriale *
                  </label>
                  <input
                    type="text"
                    required
                    value={companyForm.sector}
                    onChange={(e) => setCompanyForm({ ...companyForm, sector: e.target.value })}
                    placeholder="es. Meccanica, Moda, Agroalimentare..."
                    className="w-full rounded-xl border border-forest/20 px-3.5 py-2 text-sm text-forest focus:border-forest focus:outline-none"
                  />
                </div>
              </div>

              {/* Dipendenti e Plafond Welfare */}
              <div className="rounded-2xl bg-cream/50 p-4 border border-forest/10 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-forest mb-1 flex items-center gap-1">
                    <Users size={14} className="text-forest" />
                    Numero Dipendenti Coinvolti *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={companyForm.employeesCount}
                    onChange={(e) => {
                      const count = Number(e.target.value) || 0;
                      setCompanyForm({
                        ...companyForm,
                        employeesCount: e.target.value,
                        fundedAmountEuros: String(count * 75), // 75€ per dipendente (50 notte + 25 cena)
                      });
                    }}
                    className="w-full rounded-xl border border-forest/20 px-3.5 py-2 text-sm text-forest focus:border-forest focus:outline-none bg-white font-bold"
                  />
                  <p className="mt-1 text-[10px] text-olive">
                    Genera la capienza del piano welfare per l&apos;anno corrente.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-forest mb-1 flex items-center gap-1">
                    <Coins size={14} className="text-gold" />
                    Plafond Welfare Finanziato (€) *
                  </label>
                  <input
                    type="number"
                    min="100"
                    step="50"
                    required
                    value={companyForm.fundedAmountEuros}
                    onChange={(e) => setCompanyForm({ ...companyForm, fundedAmountEuros: e.target.value })}
                    className="w-full rounded-xl border border-forest/20 px-3.5 py-2 text-sm text-forest focus:border-forest focus:outline-none bg-white font-bold"
                  />
                  <p className="mt-1 text-[10px] text-olive">
                    Suggerito: 75€/dipendente (50€ soggiorno + 25€ cena).
                  </p>
                </div>
              </div>

              {/* Descrizione CSR */}
              <div>
                <label className="block text-xs font-semibold text-forest mb-1">
                  Descrizione Impegno CSR & Welfare Territoriale
                </label>
                <textarea
                  rows={2}
                  value={companyForm.description}
                  onChange={(e) => setCompanyForm({ ...companyForm, description: e.target.value })}
                  placeholder="Descrivi l'impegno di sostenibilità sociale e vicinanza al territorio dell'impresa..."
                  className="w-full rounded-xl border border-forest/20 px-3.5 py-2 text-sm text-forest focus:border-forest focus:outline-none"
                />
              </div>

              {/* Struttura Sponsorizzata */}
              <div>
                <label className="block text-xs font-semibold text-forest mb-1">
                  Struttura Sponsorizzata (Hotel, Agriturismo, Ristorante, Produttore, Teatro)
                </label>
                <select
                  value={companyForm.sponsoredVenueId}
                  onChange={(e) => setCompanyForm({ ...companyForm, sponsoredVenueId: e.target.value })}
                  className="w-full rounded-xl border border-forest/20 px-3.5 py-2 text-sm text-forest focus:border-forest focus:outline-none bg-white"
                >
                  <option value="">Nessuna struttura specifica (Finanziamento Trasversale)</option>
                  {data.venuesList.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name} ({v.type === "producer" ? "Produttore KM 0" : v.type === "theater" ? "Teatro" : v.type} · {v.city})
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-[10px] text-olive">
                  La struttura selezionata mostrerà l&apos;impresa come sponsor ufficiale e apparirà nella scheda pubblica dell&apos;azienda.
                </p>
              </div>

              {/* Descrizione Impatto Sviluppo Locale */}
              <div>
                <label className="block text-xs font-semibold text-forest mb-1">
                  Descrizione Impatto sullo Sviluppo Locale (Attestata dal Promotore RADICI)
                </label>
                <textarea
                  rows={2}
                  value={companyForm.localImpactDescription}
                  onChange={(e) => setCompanyForm({ ...companyForm, localImpactDescription: e.target.value })}
                  placeholder="Dettaglia la ricaduta diretta per gli operatori dei borghi, l'indotto turistico e la valorizzazione del patrimonio..."
                  className="w-full rounded-xl border border-forest/20 px-3.5 py-2 text-sm text-forest focus:border-forest focus:outline-none"
                />
              </div>

              {/* Link al Reporting Integrato CSR & ESG */}
              <div>
                <label className="block text-xs font-semibold text-forest mb-1">
                  Pulsante Link: Reporting Integrato CSR & ESG (Opzionale)
                </label>
                <input
                  type="url"
                  value={companyForm.reportUrl}
                  onChange={(e) => setCompanyForm({ ...companyForm, reportUrl: e.target.value })}
                  placeholder="https://azienda.it/bilancio-sostenibilita.pdf"
                  className="w-full rounded-xl border border-forest/20 px-3.5 py-2 text-sm text-forest focus:border-forest focus:outline-none"
                />
                <p className="mt-1 text-[10px] text-olive">
                  Link pubblico al bilancio di sostenibilità o rendiconto ESG dell&apos;impresa.
                </p>
              </div>

              {/* Sezione Credenziali Referente HR (Collaudo Operativo) */}
              <div className="rounded-2xl bg-forest/5 p-4 border border-forest/15 space-y-3">
                <div className="flex items-center gap-2">
                  <Lock size={16} className="text-forest" />
                  <p className="text-xs font-bold uppercase tracking-wider text-forest">
                    Credenziali Account Referente HR / Welfare (Accesso Diretto)
                  </p>
                </div>
                <p className="text-[11px] text-olive">
                  Queste credenziali consentono al referente HR dell&apos;azienda (o al team di test) di accedere subito a <span className="font-mono text-forest">/login</span> per verificare il cruscotto <span className="font-mono text-forest">/azienda</span>.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-forest mb-1">Nome Referente HR</label>
                    <input
                      type="text"
                      value={companyForm.managerFirstName}
                      onChange={(e) => setCompanyForm({ ...companyForm, managerFirstName: e.target.value })}
                      placeholder="es. Elena"
                      className="w-full rounded-xl border border-forest/20 px-3 py-2 text-sm text-forest bg-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-forest mb-1">Cognome Referente HR</label>
                    <input
                      type="text"
                      value={companyForm.managerLastName}
                      onChange={(e) => setCompanyForm({ ...companyForm, managerLastName: e.target.value })}
                      placeholder="es. Martini"
                      className="w-full rounded-xl border border-forest/20 px-3 py-2 text-sm text-forest bg-white focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-forest mb-1">Email di Accesso HR *</label>
                    <input
                      type="email"
                      required
                      value={companyForm.managerEmail}
                      onChange={(e) => setCompanyForm({ ...companyForm, managerEmail: e.target.value })}
                      placeholder="es. hr@manifatture.it"
                      className="w-full rounded-xl border border-forest/20 px-3 py-2 text-sm text-forest bg-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-forest mb-1">Password di Accesso * (min. 6 car.)</label>
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={companyForm.managerPassword}
                      onChange={(e) => setCompanyForm({ ...companyForm, managerPassword: e.target.value })}
                      placeholder="••••••••"
                      className="w-full rounded-xl border border-forest/20 px-3 py-2 text-sm text-forest bg-white focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Azioni Modale */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-mist">
                <button
                  type="button"
                  onClick={() => setIsAddCompanyOpen(false)}
                  className="rounded-xl px-4 py-2.5 text-xs font-semibold text-olive hover:text-forest transition cursor-pointer"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 rounded-xl bg-forest px-5 py-2.5 text-xs font-semibold text-cream shadow-sm hover:bg-forest/90 transition cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={14} className="animate-spin" /> Registrazione in corso...
                    </>
                  ) : (
                    <>
                      <Check size={14} /> Registra Impresa & Crea Account
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODALE CMS 1: AGGIUNGI NUOVO FORNITORE / STRUTTURA        */}
      {/* ========================================================= */}
      {isAddVenueOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl space-y-6 border border-forest/10 my-auto">
            <div className="flex items-start justify-between border-b border-mist pb-4">
              <div>
                <div className="inline-flex items-center gap-1.5 rounded-full bg-forest/5 px-2.5 py-0.5 text-xs font-semibold text-forest">
                  <Store size={14} /> Backoffice CMS Strutture
                </div>
                <h3 className="font-serif text-2xl text-forest mt-1">Aggiungi Fornitore Territoriale</h3>
                <p className="text-xs text-olive">
                  Inserisci una nuova struttura con prezzi esatti, capienza, offerte e credenziali di accesso per il titolare.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddVenueOpen(false)}
                className="rounded-full p-1.5 text-olive hover:bg-mist transition cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateVenue} className="space-y-5">
              {/* Selezione Tipologia Struttura */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-olive mb-2">
                  Tipologia Fornitore *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {[
                    { id: "agriturismo", label: "Agriturismo KM 0", icon: "🌿" },
                    { id: "hotel", label: "Hotel & Relais", icon: "🏨" },
                    { id: "restaurant", label: "Ristorante / Osteria", icon: "🍽️" },
                    { id: "producer", label: "Produttore Filiera", icon: "🧺" },
                    { id: "theater", label: "Teatro & Spettacolo", icon: "🎭" },
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setVenueForm((f) => ({ ...f, type: t.id }))}
                      className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-xs font-medium transition cursor-pointer ${
                        venueForm.type === t.id
                          ? "border-forest bg-forest text-cream shadow-xs font-semibold"
                          : "border-forest/15 bg-white text-forest hover:bg-forest/5"
                      }`}
                    >
                      <span className="text-lg mb-1">{t.icon}</span>
                      <span className="text-center">{t.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Informazioni Principali */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-forest mb-1">
                    Nome della Struttura / Azienda *
                  </label>
                  <input
                    type="text"
                    required
                    value={venueForm.name}
                    onChange={(e) => setVenueForm({ ...venueForm, name: e.target.value })}
                    placeholder="es. Casale Monte San Giusto"
                    className="w-full rounded-xl border border-forest/20 px-3.5 py-2 text-sm text-forest focus:border-forest focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-forest mb-1">
                    Destinazione Territoriale RADICI *
                  </label>
                  <select
                    value={venueForm.destinationId}
                    onChange={(e) => setVenueForm({ ...venueForm, destinationId: Number(e.target.value) })}
                    className="w-full rounded-xl border border-forest/20 px-3.5 py-2 text-sm text-forest focus:border-forest focus:outline-none bg-white"
                  >
                    {data.destinationsList.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.region})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Località */}
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-forest mb-1">Città *</label>
                  <input
                    type="text"
                    required
                    value={venueForm.city}
                    onChange={(e) => setVenueForm({ ...venueForm, city: e.target.value })}
                    placeholder="es. Macerata, Barolo, Pienza..."
                    className="w-full rounded-xl border border-forest/20 px-3.5 py-2 text-sm text-forest focus:border-forest focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-forest mb-1">Provincia (Sigla) *</label>
                  <input
                    type="text"
                    required
                    maxLength={3}
                    value={venueForm.province}
                    onChange={(e) => setVenueForm({ ...venueForm, province: e.target.value.toUpperCase() })}
                    placeholder="MC, CN, SI..."
                    className="w-full rounded-xl border border-forest/20 px-3.5 py-2 text-sm text-forest focus:border-forest focus:outline-none uppercase"
                  />
                </div>
              </div>

              {/* Foto di Copertina con Caricamento File e Preset */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-forest">
                    Foto di Copertina della Struttura *
                  </label>
                  <label className="cursor-pointer inline-flex items-center gap-1.5 rounded-full bg-forest text-cream px-3 py-1 text-[11px] font-semibold hover:bg-forest/90 transition shadow-xs">
                    <UploadCloud size={13} />
                    <span>Carica Foto dal Computer</span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/avif"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) handleFileUpload(f, "newVenue");
                      }}
                    />
                  </label>
                </div>

                {isUploadingImage && (
                  <div className="flex items-center gap-2 text-xs text-forest bg-forest/5 p-2.5 rounded-xl mb-2 border border-forest/15">
                    <Loader2 size={14} className="animate-spin text-forest" />
                    <span>Caricamento foto in corso sul server...</span>
                  </div>
                )}
                {uploadError && (
                  <p className="text-xs text-terracotta bg-rose-50 p-2 rounded-xl mb-2 font-medium">
                    {uploadError}
                  </p>
                )}
                <div className="flex flex-wrap gap-2 mb-2">
                  {COVER_PRESETS.map((p) => (
                    <button
                      key={p.url}
                      type="button"
                      onClick={() => setVenueForm({ ...venueForm, coverImage: p.url })}
                      className={`text-[11px] px-2.5 py-1 rounded-full border transition cursor-pointer ${
                        venueForm.coverImage === p.url
                          ? "bg-gold text-forest font-bold border-gold"
                          : "bg-cream text-olive border-forest/15 hover:border-forest/40"
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
                <div className="flex gap-3 items-center">
                  <input
                    type="text"
                    required
                    value={venueForm.coverImage}
                    onChange={(e) => setVenueForm({ ...venueForm, coverImage: e.target.value })}
                    placeholder="/images/... o https://..."
                    className="flex-1 rounded-xl border border-forest/20 px-3.5 py-2 text-sm text-forest focus:border-forest focus:outline-none font-mono text-xs"
                  />
                  {venueForm.coverImage && (
                    <img
                      src={venueForm.coverImage}
                      alt="Anteprima"
                      className="h-10 w-14 rounded-lg object-cover border border-mist shrink-0"
                    />
                  )}
                </div>
              </div>

              {/* Descrizioni */}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-forest mb-1">
                    Descrizione Breve (Card Vetrina) *
                  </label>
                  <input
                    type="text"
                    required
                    value={venueForm.description}
                    onChange={(e) => setVenueForm({ ...venueForm, description: e.target.value })}
                    placeholder="Pietra a vista, cucina contadina e colline marchigiane."
                    className="w-full rounded-xl border border-forest/20 px-3.5 py-2 text-sm text-forest focus:border-forest focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-forest mb-1">
                    Descrizione Estesa (Scheda Struttura)
                  </label>
                  <textarea
                    rows={2}
                    value={venueForm.longDescription}
                    onChange={(e) => setVenueForm({ ...venueForm, longDescription: e.target.value })}
                    placeholder="Dettagli sulle stanze, l'accoglienza, la storia e le materie prime coltivate..."
                    className="w-full rounded-xl border border-forest/20 px-3.5 py-2 text-sm text-forest focus:border-forest focus:outline-none"
                  />
                </div>
              </div>

              {/* Prezzi, Offerte e Capienza */}
              <div className="rounded-2xl bg-cream/50 p-4 border border-forest/10 space-y-4">
                <p className="text-xs font-bold uppercase tracking-wider text-forest flex items-center gap-1.5">
                  <Coins size={14} className="text-gold" />
                  Prezzi, Capienza & Offerta Dedicata
                </p>

                {venueForm.type === "producer" ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-semibold text-forest mb-1">
                          Nome del Cesto Tipico *
                        </label>
                        <input
                          type="text"
                          required
                          value={venueForm.basketName}
                          onChange={(e) => setVenueForm({ ...venueForm, basketName: e.target.value })}
                          placeholder="Cesto Conero Oro Verde"
                          className="w-full rounded-xl border border-forest/20 px-3.5 py-2 text-sm text-forest focus:border-forest focus:outline-none bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-forest mb-1">
                          Prezzo Cesto (€) *
                        </label>
                        <input
                          type="number"
                          step="0.50"
                          min="0"
                          required
                          value={venueForm.priceBasketEuros}
                          onChange={(e) => setVenueForm({ ...venueForm, priceBasketEuros: e.target.value })}
                          className="w-full rounded-xl border border-forest/20 px-3.5 py-2 text-sm text-forest focus:border-forest focus:outline-none bg-white font-semibold"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-forest mb-1">
                        Contenuto Dettagliato Cesto
                      </label>
                      <input
                        type="text"
                        value={venueForm.basketDescription}
                        onChange={(e) => setVenueForm({ ...venueForm, basketDescription: e.target.value })}
                        placeholder="3x Olio EVO Monocultivar, confettura di visciole, patè di olive..."
                        className="w-full rounded-xl border border-forest/20 px-3.5 py-2 text-sm text-forest focus:border-forest focus:outline-none bg-white"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {(venueForm.type === "hotel" || venueForm.type === "agriturismo") && (
                      <div>
                        <label className="block text-xs font-semibold text-forest mb-1">
                          Prezzo Pernottamento (€)
                        </label>
                        <input
                          type="number"
                          step="0.50"
                          min="0"
                          value={venueForm.priceHotelEuros}
                          onChange={(e) => setVenueForm({ ...venueForm, priceHotelEuros: e.target.value })}
                          className="w-full rounded-xl border border-forest/20 px-3.5 py-2 text-sm text-forest focus:border-forest focus:outline-none bg-white font-semibold"
                        />
                      </div>
                    )}

                    {(venueForm.type === "hotel" ||
                      venueForm.type === "agriturismo" ||
                      venueForm.type === "restaurant") && (
                      <div>
                        <label className="block text-xs font-semibold text-forest mb-1">
                          Prezzo Degustazione/Cena (€)
                        </label>
                        <input
                          type="number"
                          step="0.50"
                          min="0"
                          value={venueForm.priceAperitivoEuros}
                          onChange={(e) => setVenueForm({ ...venueForm, priceAperitivoEuros: e.target.value })}
                          className="w-full rounded-xl border border-forest/20 px-3.5 py-2 text-sm text-forest focus:border-forest focus:outline-none bg-white font-semibold"
                        />
                      </div>
                    )}

                    {venueForm.type === "theater" && (
                      <div>
                        <label className="block text-xs font-semibold text-forest mb-1">
                          Prezzo Spettacolo (€)
                        </label>
                        <input
                          type="number"
                          step="0.50"
                          min="0"
                          value={venueForm.priceShowEuros}
                          onChange={(e) => setVenueForm({ ...venueForm, priceShowEuros: e.target.value })}
                          className="w-full rounded-xl border border-forest/20 px-3.5 py-2 text-sm text-forest focus:border-forest focus:outline-none bg-white font-semibold"
                        />
                      </div>
                    )}

                    <div>
                      <label className="block text-xs font-semibold text-forest mb-1">
                        Capienza / Posti Giornalieri *
                      </label>
                      <input
                        type="number"
                        min="1"
                        required
                        value={venueForm.dailyCapacity}
                        onChange={(e) => setVenueForm({ ...venueForm, dailyCapacity: e.target.value })}
                        className="w-full rounded-xl border border-forest/20 px-3.5 py-2 text-sm text-forest focus:border-forest focus:outline-none bg-white font-semibold"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Sponsor Aziendale CSR (Facoltativo) */}
              <div>
                <label className="block text-xs font-semibold text-forest mb-1">
                  Sponsor Aziendale CSR Esclusivo (Facoltativo)
                </label>
                <select
                  value={venueForm.sponsorCompanyId}
                  onChange={(e) => setVenueForm({ ...venueForm, sponsorCompanyId: e.target.value })}
                  className="w-full rounded-xl border border-forest/20 px-3.5 py-2 text-sm text-forest focus:border-forest focus:outline-none bg-white"
                >
                  <option value="">Nessuno Sponsor (Aperto a tutti i dipendenti & community)</option>
                  {data.sponsorCompaniesList.map((c) => (
                    <option key={c.id} value={c.id}>
                      Sponsorizzato da {c.name}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-[11px] text-olive">
                  Se collegato, la struttura presenterà il badge di sponsorship CSR dell&apos;impresa partner.
                </p>
              </div>

              {/* Sezione Credenziali Account Fornitore (Collaudo Operativo) */}
              <div className="rounded-2xl bg-forest/5 p-4 border border-forest/15 space-y-3">
                <div className="flex items-center gap-2">
                  <Lock size={16} className="text-forest" />
                  <p className="text-xs font-bold uppercase tracking-wider text-forest">
                    Credenziali Account Titolare / Gestore Struttura (Collaudo Diretto)
                  </p>
                </div>
                <p className="text-[11px] text-olive">
                  Inserisci email e password per creare l&apos;account del fornitore (ruolo &quot;provider&quot; o &quot;theater&quot;). Potrai accedere subito su <span className="font-mono text-forest">/login</span> per testare il cruscotto fornitore o il botteghino teatrale.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-forest mb-1">Nome Referente</label>
                    <input
                      type="text"
                      value={venueForm.managerFirstName}
                      onChange={(e) => setVenueForm({ ...venueForm, managerFirstName: e.target.value })}
                      placeholder="es. Paolo"
                      className="w-full rounded-xl border border-forest/20 px-3 py-2 text-sm text-forest bg-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-forest mb-1">Cognome Referente</label>
                    <input
                      type="text"
                      value={venueForm.managerLastName}
                      onChange={(e) => setVenueForm({ ...venueForm, managerLastName: e.target.value })}
                      placeholder="es. Luzi"
                      className="w-full rounded-xl border border-forest/20 px-3 py-2 text-sm text-forest bg-white focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-forest mb-1">Email di Accesso Fornitore</label>
                    <input
                      type="email"
                      value={venueForm.managerEmail}
                      onChange={(e) => setVenueForm({ ...venueForm, managerEmail: e.target.value })}
                      placeholder="es. paolo@nuovocasale.it"
                      className="w-full rounded-xl border border-forest/20 px-3 py-2 text-sm text-forest bg-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-forest mb-1">Password Accesso (min. 6 car.)</label>
                    <input
                      type="password"
                      value={venueForm.managerPassword}
                      onChange={(e) => setVenueForm({ ...venueForm, managerPassword: e.target.value })}
                      placeholder="••••••••"
                      className="w-full rounded-xl border border-forest/20 px-3 py-2 text-sm text-forest bg-white focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Servizi Offerti */}
              <div>
                <label className="block text-xs font-semibold text-forest mb-2">
                  Servizi Inclusi nella Struttura
                </label>
                <div className="flex flex-wrap gap-2">
                  {AVAILABLE_SERVICES.map((s) => {
                    const active = venueForm.services.includes(s);
                    return (
                      <button
                        key={s}
                        type="button"
                        onClick={() => toggleService(s)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition cursor-pointer ${
                          active
                            ? "bg-forest text-cream font-semibold shadow-xs"
                            : "bg-cream text-olive hover:bg-forest/10"
                        }`}
                      >
                        {active && <Check size={12} />}
                        {s}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Azioni Modale */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-mist">
                <button
                  type="button"
                  onClick={() => setIsAddVenueOpen(false)}
                  className="rounded-xl px-4 py-2.5 text-xs font-semibold text-olive hover:text-forest transition cursor-pointer"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 rounded-xl bg-forest px-5 py-2.5 text-xs font-semibold text-cream shadow-sm hover:bg-forest/90 transition cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={14} className="animate-spin" /> Salvataggio in corso...
                    </>
                  ) : (
                    <>
                      <Check size={14} /> Salva & Pubblica nel Circuito
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODALE CMS 4: MODIFICA IMPRESA CSR                        */}
      {/* ========================================================= */}
      {isEditCompanyOpen && editingCompany && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl space-y-6 border border-forest/10 my-auto">
            <div className="flex items-start justify-between border-b border-mist pb-4">
              <div>
                <div className="inline-flex items-center gap-1.5 rounded-full bg-forest/5 px-2.5 py-0.5 text-xs font-semibold text-forest">
                  <Building size={14} /> Backoffice Modifica Impresa CSR
                </div>
                <h3 className="font-serif text-2xl text-forest mt-1">Modifica: {editingCompany.name}</h3>
                <p className="text-xs text-olive">
                  Aggiorna i dati anagrafici, il plafond welfare, la struttura sponsorizzata e il reporting ESG.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsEditCompanyOpen(false);
                  setEditingCompany(null);
                }}
                className="rounded-full p-1.5 text-olive hover:bg-mist transition cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleUpdateCompany} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-forest mb-1">
                    Ragione Sociale Azienda *
                  </label>
                  <input
                    type="text"
                    required
                    value={editCompanyForm.name}
                    onChange={(e) => setEditCompanyForm({ ...editCompanyForm, name: e.target.value })}
                    className="w-full rounded-xl border border-forest/20 px-3.5 py-2 text-sm text-forest focus:border-forest focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-forest mb-1">
                    Partita IVA *
                  </label>
                  <input
                    type="text"
                    required
                    value={editCompanyForm.vatNumber}
                    onChange={(e) => setEditCompanyForm({ ...editCompanyForm, vatNumber: e.target.value })}
                    className="w-full rounded-xl border border-forest/20 px-3.5 py-2 text-sm text-forest focus:border-forest focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-forest mb-1">Città Sede *</label>
                  <input
                    type="text"
                    required
                    value={editCompanyForm.city}
                    onChange={(e) => setEditCompanyForm({ ...editCompanyForm, city: e.target.value })}
                    className="w-full rounded-xl border border-forest/20 px-3.5 py-2 text-sm text-forest focus:border-forest focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-forest mb-1">
                    Settore Industriale *
                  </label>
                  <input
                    type="text"
                    required
                    value={editCompanyForm.sector}
                    onChange={(e) => setEditCompanyForm({ ...editCompanyForm, sector: e.target.value })}
                    className="w-full rounded-xl border border-forest/20 px-3.5 py-2 text-sm text-forest focus:border-forest focus:outline-none"
                  />
                </div>
              </div>

              <div className="rounded-2xl bg-cream/50 p-4 border border-forest/10 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-forest mb-1 flex items-center gap-1">
                    <Users size={14} className="text-forest" />
                    Numero Dipendenti Coinvolti *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={editCompanyForm.employeesCount}
                    onChange={(e) => {
                      const count = Number(e.target.value) || 0;
                      setEditCompanyForm({
                        ...editCompanyForm,
                        employeesCount: e.target.value,
                        fundedAmountEuros: String(count * 75),
                      });
                    }}
                    className="w-full rounded-xl border border-forest/20 px-3.5 py-2 text-sm text-forest focus:border-forest focus:outline-none bg-white font-bold"
                  />
                  <p className="mt-1 text-[10px] text-olive">
                    Ricalcola automaticamente la capienza del piano welfare per l&apos;anno in corso.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-forest mb-1 flex items-center gap-1">
                    <Coins size={14} className="text-gold" />
                    Plafond Welfare Finanziato (€) *
                  </label>
                  <input
                    type="number"
                    min="100"
                    step="50"
                    required
                    value={editCompanyForm.fundedAmountEuros}
                    onChange={(e) => setEditCompanyForm({ ...editCompanyForm, fundedAmountEuros: e.target.value })}
                    className="w-full rounded-xl border border-forest/20 px-3.5 py-2 text-sm text-forest focus:border-forest focus:outline-none bg-white font-bold"
                  />
                  <p className="mt-1 text-[10px] text-olive">
                    Ricalcola la ricaduta moltiplicatore 5,1x: € {(Number(editCompanyForm.fundedAmountEuros || 0) * 5.1).toLocaleString("it-IT", { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-forest mb-1">
                  Descrizione Impegno CSR
                </label>
                <textarea
                  rows={2}
                  value={editCompanyForm.description}
                  onChange={(e) => setEditCompanyForm({ ...editCompanyForm, description: e.target.value })}
                  className="w-full rounded-xl border border-forest/20 px-3.5 py-2 text-sm text-forest focus:border-forest focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-forest mb-1">
                  Struttura Sponsorizzata (Hotel, Agriturismo, Ristorante, Produttore, Teatro)
                </label>
                <select
                  value={editCompanyForm.sponsoredVenueId}
                  onChange={(e) => setEditCompanyForm({ ...editCompanyForm, sponsoredVenueId: e.target.value })}
                  className="w-full rounded-xl border border-forest/20 px-3.5 py-2 text-sm text-forest focus:border-forest focus:outline-none bg-white"
                >
                  <option value="">Nessuna struttura specifica (Finanziamento Trasversale)</option>
                  {data.venuesList.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name} ({v.type === "producer" ? "Produttore KM 0" : v.type === "theater" ? "Teatro" : v.type} · {v.city})
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-[10px] text-olive">
                  La struttura selezionata mostrerà l&apos;azienda come sponsor e apparirà nella scheda pubblica dell&apos;impresa.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-forest mb-1">
                  Descrizione Impatto sullo Sviluppo Locale (Attestata dal Promotore RADICI)
                </label>
                <textarea
                  rows={2}
                  value={editCompanyForm.localImpactDescription}
                  onChange={(e) => setEditCompanyForm({ ...editCompanyForm, localImpactDescription: e.target.value })}
                  className="w-full rounded-xl border border-forest/20 px-3.5 py-2 text-sm text-forest focus:border-forest focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-forest mb-1">
                  Link al Reporting Integrato CSR & ESG (Opzionale)
                </label>
                <input
                  type="url"
                  value={editCompanyForm.reportUrl}
                  onChange={(e) => setEditCompanyForm({ ...editCompanyForm, reportUrl: e.target.value })}
                  placeholder="https://azienda.it/bilancio-sostenibilita.pdf"
                  className="w-full rounded-xl border border-forest/20 px-3.5 py-2 text-sm text-forest focus:border-forest focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-mist">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditCompanyOpen(false);
                    setEditingCompany(null);
                  }}
                  className="rounded-xl px-4 py-2.5 text-xs font-semibold text-olive hover:text-forest transition cursor-pointer"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 rounded-xl bg-forest px-5 py-2.5 text-xs font-semibold text-cream shadow-sm hover:bg-forest/90 transition cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={14} className="animate-spin" /> Salvataggio...
                    </>
                  ) : (
                    <>
                      <Check size={14} /> Salva Modifiche Impresa
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODALE CMS 5: MODIFICA FORNITORE / STRUTTURA               */}
      {/* ========================================================= */}
      {isEditVenueOpen && editingVenue && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl space-y-6 border border-forest/10 my-auto">
            <div className="flex items-start justify-between border-b border-mist pb-4">
              <div>
                <div className="inline-flex items-center gap-1.5 rounded-full bg-forest/5 px-2.5 py-0.5 text-xs font-semibold text-forest">
                  <Store size={14} /> Backoffice Modifica Struttura
                </div>
                <h3 className="font-serif text-2xl text-forest mt-1">Modifica: {editingVenue.name}</h3>
                <p className="text-xs text-olive">
                  Aggiorna i dettagli, le foto di copertina, i prezzi esatti, la capienza e l&apos;offerta convenzionata.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsEditVenueOpen(false);
                  setEditingVenue(null);
                }}
                className="rounded-full p-1.5 text-olive hover:bg-mist transition cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleUpdateVenue} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-olive mb-2">
                  Tipologia Fornitore *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {[
                    { id: "agriturismo", label: "Agriturismo KM 0", icon: "🌿" },
                    { id: "hotel", label: "Hotel & Relais", icon: "🏨" },
                    { id: "restaurant", label: "Ristorante / Osteria", icon: "🍽️" },
                    { id: "producer", label: "Produttore Filiera", icon: "🧺" },
                    { id: "theater", label: "Teatro & Spettacolo", icon: "🎭" },
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setEditVenueForm((f) => ({ ...f, type: t.id }))}
                      className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-xs font-medium transition cursor-pointer ${
                        editVenueForm.type === t.id
                          ? "border-forest bg-forest text-cream shadow-xs font-semibold"
                          : "border-forest/15 bg-white text-forest hover:bg-forest/5"
                      }`}
                    >
                      <span className="text-lg mb-1">{t.icon}</span>
                      <span className="text-center">{t.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-forest mb-1">
                    Nome della Struttura / Azienda *
                  </label>
                  <input
                    type="text"
                    required
                    value={editVenueForm.name}
                    onChange={(e) => setEditVenueForm({ ...editVenueForm, name: e.target.value })}
                    className="w-full rounded-xl border border-forest/20 px-3.5 py-2 text-sm text-forest focus:border-forest focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-forest mb-1">
                    Destinazione Territoriale RADICI *
                  </label>
                  <select
                    value={editVenueForm.destinationId}
                    onChange={(e) => setEditVenueForm({ ...editVenueForm, destinationId: Number(e.target.value) })}
                    className="w-full rounded-xl border border-forest/20 px-3.5 py-2 text-sm text-forest focus:border-forest focus:outline-none bg-white"
                  >
                    {data.destinationsList.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.region})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-forest mb-1">Città *</label>
                  <input
                    type="text"
                    required
                    value={editVenueForm.city}
                    onChange={(e) => setEditVenueForm({ ...editVenueForm, city: e.target.value })}
                    className="w-full rounded-xl border border-forest/20 px-3.5 py-2 text-sm text-forest focus:border-forest focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-forest mb-1">Provincia (Sigla) *</label>
                  <input
                    type="text"
                    required
                    maxLength={3}
                    value={editVenueForm.province}
                    onChange={(e) => setEditVenueForm({ ...editVenueForm, province: e.target.value.toUpperCase() })}
                    className="w-full rounded-xl border border-forest/20 px-3.5 py-2 text-sm text-forest focus:border-forest focus:outline-none uppercase"
                  />
                </div>
              </div>

              {/* Foto di Copertina con Caricamento File e Preset */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-forest">
                    Foto di Copertina della Struttura *
                  </label>
                  <label className="cursor-pointer inline-flex items-center gap-1.5 rounded-full bg-forest text-cream px-3 py-1 text-[11px] font-semibold hover:bg-forest/90 transition shadow-xs">
                    <UploadCloud size={13} />
                    <span>Carica Nuova Foto dal Computer</span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/avif"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) handleFileUpload(f, "editVenue");
                      }}
                    />
                  </label>
                </div>

                {isUploadingImage && (
                  <div className="flex items-center gap-2 text-xs text-forest bg-forest/5 p-2.5 rounded-xl mb-2 border border-forest/15">
                    <Loader2 size={14} className="animate-spin text-forest" />
                    <span>Caricamento foto in corso sul server...</span>
                  </div>
                )}
                {uploadError && (
                  <p className="text-xs text-terracotta bg-rose-50 p-2 rounded-xl mb-2 font-medium">
                    {uploadError}
                  </p>
                )}

                <div className="flex flex-wrap gap-2 mb-2">
                  {COVER_PRESETS.map((p) => (
                    <button
                      key={p.url}
                      type="button"
                      onClick={() => setEditVenueForm({ ...editVenueForm, coverImage: p.url })}
                      className={`text-[11px] px-2.5 py-1 rounded-full border transition cursor-pointer ${
                        editVenueForm.coverImage === p.url
                          ? "bg-gold text-forest font-bold border-gold"
                          : "bg-cream text-olive border-forest/15 hover:border-forest/40"
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>

                <div className="flex gap-3 items-center">
                  <input
                    type="text"
                    required
                    value={editVenueForm.coverImage}
                    onChange={(e) => setEditVenueForm({ ...editVenueForm, coverImage: e.target.value })}
                    placeholder="/uploads/... oppure https://..."
                    className="flex-1 rounded-xl border border-forest/20 px-3.5 py-2 text-sm text-forest focus:border-forest focus:outline-none font-mono text-xs"
                  />
                  {editVenueForm.coverImage && (
                    <img
                      src={editVenueForm.coverImage}
                      alt="Anteprima Copertina"
                      className="h-12 w-16 rounded-xl object-cover border border-forest/20 shrink-0 shadow-xs"
                    />
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-forest mb-1">
                    Descrizione Breve (Card Vetrina) *
                  </label>
                  <input
                    type="text"
                    required
                    value={editVenueForm.description}
                    onChange={(e) => setEditVenueForm({ ...editVenueForm, description: e.target.value })}
                    className="w-full rounded-xl border border-forest/20 px-3.5 py-2 text-sm text-forest focus:border-forest focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-forest mb-1">
                    Descrizione Estesa (Scheda Struttura)
                  </label>
                  <textarea
                    rows={2}
                    value={editVenueForm.longDescription}
                    onChange={(e) => setEditVenueForm({ ...editVenueForm, longDescription: e.target.value })}
                    className="w-full rounded-xl border border-forest/20 px-3.5 py-2 text-sm text-forest focus:border-forest focus:outline-none"
                  />
                </div>
              </div>

              <div className="rounded-2xl bg-cream/50 p-4 border border-forest/10 space-y-4">
                <p className="text-xs font-bold uppercase tracking-wider text-forest flex items-center gap-1.5">
                  <Coins size={14} className="text-gold" />
                  Prezzi, Capienza & Offerta Dedicata
                </p>

                {editVenueForm.type === "producer" ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-semibold text-forest mb-1">
                          Nome del Cesto Tipico *
                        </label>
                        <input
                          type="text"
                          required
                          value={editVenueForm.basketName}
                          onChange={(e) => setEditVenueForm({ ...editVenueForm, basketName: e.target.value })}
                          className="w-full rounded-xl border border-forest/20 px-3.5 py-2 text-sm text-forest focus:border-forest focus:outline-none bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-forest mb-1">
                          Prezzo Cesto (€) *
                        </label>
                        <input
                          type="number"
                          step="0.50"
                          min="0"
                          required
                          value={editVenueForm.priceBasketEuros}
                          onChange={(e) => setEditVenueForm({ ...editVenueForm, priceBasketEuros: e.target.value })}
                          className="w-full rounded-xl border border-forest/20 px-3.5 py-2 text-sm text-forest focus:border-forest focus:outline-none bg-white font-semibold"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-forest mb-1">
                        Contenuto Dettagliato Cesto
                      </label>
                      <input
                        type="text"
                        value={editVenueForm.basketDescription}
                        onChange={(e) => setEditVenueForm({ ...editVenueForm, basketDescription: e.target.value })}
                        className="w-full rounded-xl border border-forest/20 px-3.5 py-2 text-sm text-forest focus:border-forest focus:outline-none bg-white"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {(editVenueForm.type === "hotel" || editVenueForm.type === "agriturismo") && (
                      <div>
                        <label className="block text-xs font-semibold text-forest mb-1">
                          Prezzo Pernottamento (€)
                        </label>
                        <input
                          type="number"
                          step="0.50"
                          min="0"
                          value={editVenueForm.priceHotelEuros}
                          onChange={(e) => setEditVenueForm({ ...editVenueForm, priceHotelEuros: e.target.value })}
                          className="w-full rounded-xl border border-forest/20 px-3.5 py-2 text-sm text-forest focus:border-forest focus:outline-none bg-white font-semibold"
                        />
                      </div>
                    )}

                    {(editVenueForm.type === "hotel" ||
                      editVenueForm.type === "agriturismo" ||
                      editVenueForm.type === "restaurant") && (
                      <div>
                        <label className="block text-xs font-semibold text-forest mb-1">
                          Prezzo Degustazione/Cena (€)
                        </label>
                        <input
                          type="number"
                          step="0.50"
                          min="0"
                          value={editVenueForm.priceAperitivoEuros}
                          onChange={(e) => setEditVenueForm({ ...editVenueForm, priceAperitivoEuros: e.target.value })}
                          className="w-full rounded-xl border border-forest/20 px-3.5 py-2 text-sm text-forest focus:border-forest focus:outline-none bg-white font-semibold"
                        />
                      </div>
                    )}

                    {editVenueForm.type === "theater" && (
                      <div>
                        <label className="block text-xs font-semibold text-forest mb-1">
                          Biglietto Spettacolo Base (€)
                        </label>
                        <input
                          type="number"
                          step="0.50"
                          min="0"
                          value={editVenueForm.priceShowEuros}
                          onChange={(e) => setEditVenueForm({ ...editVenueForm, priceShowEuros: e.target.value })}
                          className="w-full rounded-xl border border-forest/20 px-3.5 py-2 text-sm text-forest focus:border-forest focus:outline-none bg-white font-semibold"
                        />
                      </div>
                    )}

                    <div>
                      <label className="block text-xs font-semibold text-forest mb-1">
                        Capienza Giornaliera (Ospiti)
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={editVenueForm.dailyCapacity}
                        onChange={(e) => setEditVenueForm({ ...editVenueForm, dailyCapacity: e.target.value })}
                        className="w-full rounded-xl border border-forest/20 px-3.5 py-2 text-sm text-forest focus:border-forest focus:outline-none bg-white font-semibold"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-forest mb-1">
                    Azienda Finanziatrice Sponsor (Opzionale)
                  </label>
                  <select
                    value={editVenueForm.sponsorCompanyId}
                    onChange={(e) => setEditVenueForm({ ...editVenueForm, sponsorCompanyId: e.target.value })}
                    className="w-full rounded-xl border border-forest/20 px-3.5 py-2 text-sm text-forest focus:border-forest focus:outline-none bg-white"
                  >
                    <option value="">Nessun sponsor esclusivo (Partner Generale RADICI)</option>
                    {data.sponsorCompaniesList.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Servizi Offerti */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-olive mb-2">
                  Servizi & Dotazioni Incluse
                </label>
                <div className="flex flex-wrap gap-2">
                  {[
                    "Wi-Fi Gratuito",
                    "Parcheggio Riservato",
                    "Ristorante Tipico KM 0",
                    "Piscina Panoramica",
                    "Aria Condizionata",
                    "Degustazione Tipica KM 0",
                    "Biciclette Gratuite",
                    "Pet Friendly",
                    "Visita Guidata Cantina",
                    "Laboratorio del Gusto",
                  ].map((s) => {
                    const active = editVenueForm.services.includes(s);
                    return (
                      <button
                        key={s}
                        type="button"
                        onClick={() => toggleEditVenueService(s)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition cursor-pointer ${
                          active
                            ? "bg-forest text-cream font-semibold shadow-xs"
                            : "bg-cream text-olive hover:bg-forest/10"
                        }`}
                      >
                        {active && <Check size={12} />}
                        {s}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-mist">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditVenueOpen(false);
                    setEditingVenue(null);
                  }}
                  className="rounded-xl px-4 py-2.5 text-xs font-semibold text-olive hover:text-forest transition cursor-pointer"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 rounded-xl bg-forest px-5 py-2.5 text-xs font-semibold text-cream shadow-sm hover:bg-forest/90 transition cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={14} className="animate-spin" /> Salvataggio...
                    </>
                  ) : (
                    <>
                      <Check size={14} /> Salva Modifiche Struttura
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODALE CMS 2: AGGIUNGI SPETTACOLO / EVENTO CULTURALE       */}
      {/* ========================================================= */}
      {isAddEventOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl space-y-6 border border-forest/10 my-auto">
            <div className="flex items-start justify-between border-b border-mist pb-4">
              <div>
                <div className="inline-flex items-center gap-1.5 rounded-full bg-forest/5 px-2.5 py-0.5 text-xs font-semibold text-forest">
                  <Ticket size={14} /> Backoffice Cartellone Culturale
                </div>
                <h3 className="font-serif text-2xl text-forest mt-1">Nuovo Spettacolo Matching Grant</h3>
                <p className="text-xs text-olive">
                  Inserisci un evento nel circuito RADICI con controllo capienza rigoroso anti-overbooking.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddEventOpen(false)}
                className="rounded-full p-1.5 text-olive hover:bg-mist transition cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateEvent} className="space-y-4">
              {/* Titolo e Categoria */}
              <div>
                <label className="block text-xs font-semibold text-forest mb-1">
                  Titolo dello Spettacolo / Evento *
                </label>
                <input
                  type="text"
                  required
                  value={eventForm.title}
                  onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                  placeholder="es. Stagione di Prosa e Visita Esclusiva nel Ridotto"
                  className="w-full rounded-xl border border-forest/20 px-3.5 py-2 text-sm text-forest focus:border-forest focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-forest mb-1">
                    Categoria Culturale *
                  </label>
                  <select
                    value={eventForm.category}
                    onChange={(e) => setEventForm({ ...eventForm, category: e.target.value })}
                    className="w-full rounded-xl border border-forest/20 px-3.5 py-2 text-sm text-forest focus:border-forest focus:outline-none bg-white"
                  >
                    <option value="teatro">🎭 Teatro & Prosa</option>
                    <option value="musica">🎼 Musica Sinfonica & Opera</option>
                    <option value="arte_cultura">🏛️ Arte & Visita Rinascimentale</option>
                    <option value="natura_laboratorio">🌿 Trekking & Laboratorio Tipico</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-forest mb-1">
                    Teatro / Palcoscenico Ospitante *
                  </label>
                  <input
                    type="text"
                    required
                    value={eventForm.venueName}
                    onChange={(e) => setEventForm({ ...eventForm, venueName: e.target.value })}
                    placeholder="Teatro Lauro Rossi, Arena Sferisterio..."
                    className="w-full rounded-xl border border-forest/20 px-3.5 py-2 text-sm text-forest focus:border-forest focus:outline-none"
                  />
                </div>
              </div>

              {/* Città, Regione e Data */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-forest mb-1">Città *</label>
                  <input
                    type="text"
                    required
                    value={eventForm.city}
                    onChange={(e) => setEventForm({ ...eventForm, city: e.target.value })}
                    placeholder="Macerata, Urbino..."
                    className="w-full rounded-xl border border-forest/20 px-3.5 py-2 text-sm text-forest focus:border-forest focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-forest mb-1">Regione *</label>
                  <input
                    type="text"
                    required
                    value={eventForm.region}
                    onChange={(e) => setEventForm({ ...eventForm, region: e.target.value })}
                    placeholder="Marche, Toscana..."
                    className="w-full rounded-xl border border-forest/20 px-3.5 py-2 text-sm text-forest focus:border-forest focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-forest mb-1">Data & Ora Inizio</label>
                  <input
                    type="datetime-local"
                    value={eventForm.startsAt}
                    onChange={(e) => setEventForm({ ...eventForm, startsAt: e.target.value })}
                    className="w-full rounded-xl border border-forest/20 px-3.5 py-2 text-sm text-forest focus:border-forest focus:outline-none"
                  />
                </div>
              </div>

              {/* Capienza Anti-Overbooking e Valore Matching Grant */}
              <div className="rounded-2xl bg-cream/50 p-4 border border-forest/10 grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-forest mb-1 flex items-center gap-1">
                    <ShieldCheck size={14} className="text-emerald-700" />
                    Capienza Totale Posti *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={eventForm.capacity}
                    onChange={(e) => setEventForm({ ...eventForm, capacity: e.target.value })}
                    className="w-full rounded-xl border border-forest/20 px-3.5 py-2 text-sm text-forest focus:border-forest focus:outline-none bg-white font-bold"
                  />
                  <p className="mt-1 text-[10px] text-olive">
                    Tetto massimo contatore anti-overbooking per Welfare e Community.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-forest mb-1 flex items-center gap-1">
                    <Coins size={14} className="text-gold" />
                    Valore Matching Grant (€)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    required
                    value={eventForm.grantAmountEuros}
                    onChange={(e) => setEventForm({ ...eventForm, grantAmountEuros: e.target.value })}
                    className="w-full rounded-xl border border-forest/20 px-3.5 py-2 text-sm text-forest focus:border-forest focus:outline-none bg-white font-bold"
                  />
                  <p className="mt-1 text-[10px] text-olive">
                    Default 50€ (25€ dipendente + 25€ accompagnatore).
                  </p>
                </div>
              </div>

              {/* Descrizione Evento */}
              <div>
                <label className="block text-xs font-semibold text-forest mb-1">
                  Descrizione dello Spettacolo *
                </label>
                <textarea
                  rows={3}
                  required
                  value={eventForm.description}
                  onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                  placeholder="Descrizione dell'opera, programma musicale o percorso teatrale con accesso esclusivo..."
                  className="w-full rounded-xl border border-forest/20 px-3.5 py-2 text-sm text-forest focus:border-forest focus:outline-none"
                />
              </div>

              {/* Checkbox Incontro Artisti */}
              <label className="flex items-center gap-2 cursor-pointer text-xs text-forest">
                <input
                  type="checkbox"
                  checked={eventForm.artistMeetupIncluded}
                  onChange={(e) => setEventForm({ ...eventForm, artistMeetupIncluded: e.target.checked })}
                  className="rounded border-forest/30 text-forest focus:ring-forest"
                />
                <span>Incontro esclusivo con gli artisti o visita nel Ridotto inclusa</span>
              </label>

              {/* Azioni Modale */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-mist">
                <button
                  type="button"
                  onClick={() => setIsAddEventOpen(false)}
                  className="rounded-xl px-4 py-2.5 text-xs font-semibold text-olive hover:text-forest transition cursor-pointer"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 rounded-xl bg-forest px-5 py-2.5 text-xs font-semibold text-cream shadow-sm hover:bg-forest/90 transition cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={14} className="animate-spin" /> Inserimento in corso...
                    </>
                  ) : (
                    <>
                      <Check size={14} /> Inserisci nel Cartellone RADICI
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
