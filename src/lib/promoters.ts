import { desc, eq } from "drizzle-orm";
import { db, initDb } from "@/db";
import {
  companies,
  destinations,
  grantEvents,
  matchingGrants,
  grantSeats,
  grantConfirmations,
  users,
  venues,
  vouchers,
  voucherSelections,
  transactions,
  welfarePlans,
  bookings,
  venueOfferings,
} from "@/db/schema";

export type PromoterGrantRow = {
  voucherId: number;
  grantId: number;
  employeeName: string;
  employeeEmail: string;
  companyName: string;
  venueName: string;
  venueCity: string;
  eventTitle: string;
  eventCategory: string;
  eventLocation: string;
  theaterName: string;
  startsAt: Date | null;
  seatsRequested: number;
  status: string;
  confirmedAt: Date | null;
  attendedAt: Date | null;
  grantValueCents: number;
};

export type PlatformTransactionRow = {
  id: number;
  createdAt: Date;
  serviceLabel: string;
  type: string;
  status: string;
  amountCents: number;
  commissionCents: number;
  providerNetCents: number;
  paymentStatus: string;
  paymentNotes: string | null;
  settledAt: Date | null;
  invoiceNumber: string | null;
  invoiceDate: string | null;
  userName: string;
  userEmail: string;
  companyName: string | null;
  companyVat: string | null;
  venueName: string;
  venueType: string;
  venueCity: string;
  voucherId: number | null;
};

export type ProducerOrderRow = {
  id: number;
  createdAt: Date;
  orderDate: string;
  timeSlot: string | null;
  buyerName: string;
  buyerEmail: string;
  buyerRole: string;
  companyName: string | null;
  connectedViaEmployeeName: string | null;
  deliveryMode: string;
  producerId: number;
  producerName: string;
  producerCity: string;
  producerRegion: string;
  basketName: string;
  basketDescription: string | null;
  quantity: number;
  unitPriceCents: number;
  totalListPriceCents: number;
  discountPercent: number;
  discountCents: number;
  finalPriceCents: number;
  commissionCents: number;
  producerNetCents: number;
  isFreeGift: boolean;
  giftRecipientCompanyName: string | null;
  kmAvoided: number;
  co2SavedKg: number;
  status: string;
  notes: string | null;
};

export type CompanyOverview = {
  id: number;
  name: string;
  slug: string;
  vatNumber: string;
  city: string;
  sector: string;
  description: string;
  employeesCount: number;
  fundedAmountCents: number;
  localRedistributionCents: number;
  co2SavedKg: number;
  localImpactDescription: string | null;
  reportUrl: string | null;
  totalVouchersIssued: number;
  totalVouchersRedeemed: number;
  totalDebtToProvidersCents: number;
  totalSettledToProvidersCents: number;
  totalPendingToProvidersCents: number;
  managerEmail: string | null;
  managerName: string | null;
  sponsoredVenuesNames: string[];
};

export type VenueOverview = {
  id: number;
  name: string;
  slug: string;
  type: string;
  city: string;
  province: string;
  region: string;
  coverImage: string;
  destinationId: number;
  destinationName: string;
  description: string;
  longDescription: string;
  services: string[];
  priceHotelCents: number;
  priceAperitivoCents: number;
  priceShowCents: number;
  priceBasketCents: number;
  basketName: string | null;
  basketDescription: string | null;
  sponsorCompanyId: number | null;
  sponsorCompanyName: string | null;
  checkinCode: string;
  managerEmail: string | null;
  managerName: string | null;
  redeemedCount: number;
  attendedCount: number;
  noShowCount: number;
  grossVolumeCents: number;
  commissionsPaidCents: number;
  netRevenueCents: number;
  settledCents: number;
  pendingCents: number;
};

export type PromoterDashboardData = {
  promoterUser: typeof users.$inferSelect;
  
  // KPI Globali della Piattaforma Radici
  totalGmvCents: number;
  totalCommissionsCents: number;
  totalProviderNetCents: number;
  totalSettledCents: number;
  totalPendingCents: number;
  
  // Statistiche Voucher Welfare
  totalVouchersIssued: number;
  totalVouchersRedeemed: number;
  totalVouchersAvailable: number;
  totalVouchersAttended: number;
  totalVouchersNoShow: number;
  
  // Ecosistema
  companiesCount: number;
  venuesCount: number;
  employeesCount: number;

  // Dettagli Operativi
  platformTransactions: PlatformTransactionRow[];
  companiesList: CompanyOverview[];
  venuesList: VenueOverview[];
  destinationsList: Array<{ id: number; name: string; region: string }>;
  sponsorCompaniesList: Array<{ id: number; name: string }>;
  theatersList: Array<{ id: number; name: string; city: string; region: string }>;

  // Matching Grant Culturale (governato direttamente da Radici)
  totalGrantsAssigned: number;
  totalGrantsConfirmed: number;
  totalGrantsAttended: number;
  totalGrantsNoShow: number;
  totalGrantsExpired: number;
  grantFundCapacityCents: number;
  grantFundSpentCents: number;
  eventsCount: number;
  theatersCount: number;
  promotedDestinationsCount: number;
  grants: PromoterGrantRow[];
  events: Array<{
    id: number;
    title: string;
    category: string;
    venueId: number | null;
    venueName: string;
    city: string;
    region: string;
    description: string;
    startsAt: Date | null;
    capacity: number;
    grantAmountCents: number;
    artistMeetupIncluded: boolean | null;
    welfareSeats: number;
    communitySeats: number;
    seatsOccupied: number;
    seatsAvailable: number;
    occupancyPercent: number;
    isOverbookingRisk: boolean;
    grantsGeneratedCount: number;
  }>;
  theaters: Array<{
    id: number;
    name: string;
    city: string;
    region: string;
    grantsGeneratedCount: number;
  }>;

  // Regia Globale Prenotazioni Community & Monitoraggio Overbooking
  communityBookings: Array<{
    id: number;
    createdAt: Date;
    bookingDate: string;
    timeSlot: string | null;
    partySize: number;
    status: string;
    guestName: string;
    guestEmail: string;
    guestPhone: string | null;
    venueName: string;
    venueCity: string;
    venueType: string;
    bookingType: string;
    serviceLabel: string;
    eventTitle: string | null;
    finalPriceCents: number;
    notes: string | null;
  }>;
  totalCommunityBookingsCount: number;
  totalCommunityBookingsSeats: number;
  totalCommunityConfirmedCount: number;
  totalCommunityPendingCount: number;
  overbookingAlertsCount: number;

  // Filiera Corta & Produttori KM 0
  producerOrders: ProducerOrderRow[];
  totalProducerBasketsSold: number;
  totalProducerRevenueCents: number;
  totalKmAvoided: number;
  totalCo2SavedKg: number;
  producersCount: number;

  // Business Rule: 1 Cesto Omaggio ogni 10 acquisti per addetti Imprese CSR
  freeBasketsEarnedTotal: number;
  basketsProgressToNextGift: number;
  freeBasketThreshold: number;
};

export async function getPromotersDashboardData(promoterUserId: number): Promise<PromoterDashboardData | null> {
  await initDb();

  const [promoterUser] = await db
    .select()
    .from(users)
    .where(eq(users.id, promoterUserId))
    .limit(1);

  if (!promoterUser || (promoterUser.role !== "promoter" && promoterUser.role !== "admin")) {
    return null;
  }

  // 1. Carica tutte le tabelle fondamentali
  const allCompanies = await db.select().from(companies);
  const allVenues = await db.select().from(venues);
  const allDestinations = await db.select().from(destinations);
  const allVouchers = await db.select().from(vouchers);
  const allSelections = await db.select().from(voucherSelections);
  const allUsers = await db.select().from(users);
  const allGrantEvents = await db.select().from(grantEvents);

  const theaterVenues = allVenues.filter((v) => v.type === "theater");
  const theaterMap = new Map(theaterVenues.map((th) => [th.id, th]));
  const grantEventMap = new Map(allGrantEvents.map((ge) => [ge.id, ge]));
  const companyMap = new Map(allCompanies.map((c) => [c.id, c]));
  const venueMap = new Map(allVenues.map((v) => [v.id, v]));
  const userMap = new Map(allUsers.map((u) => [u.id, u]));

  // 2. Caricamento Prenotazioni di Circuito (Bookings: Filiera Corta, Teatri e Soggiorni Community)
  const allBookingsRows = await db
    .select({
      booking: bookings,
      user: users,
      venue: venues,
      grantEvent: grantEvents,
    })
    .from(bookings)
    .innerJoin(users, eq(bookings.userId, users.id))
    .innerJoin(venues, eq(bookings.venueId, venues.id))
    .leftJoin(grantEvents, eq(bookings.grantEventId, grantEvents.id))
    .orderBy(desc(bookings.createdAt));

  // 2a. Filiera Corta & Produttori KM 0
  const producerOrderRows = allBookingsRows.filter(
    (r) => r.booking.bookingType === "local_basket" || r.venue.type === "producer"
  );

  const producerOrders: ProducerOrderRow[] = producerOrderRows.map((r) => {
    let userCompany = r.user.companyId ? companyMap.get(r.user.companyId) : null;
    let connectedViaEmployeeName: string | null = null;

    if (!userCompany && r.user.invitedByUserId) {
      const inviter = userMap.get(r.user.invitedByUserId);
      if (inviter && inviter.companyId) {
        userCompany = companyMap.get(inviter.companyId) || null;
        connectedViaEmployeeName = `${inviter.firstName} ${inviter.lastName}`;
      }
    }

    const giftCompany = r.booking.giftRecipientCompanyId
      ? companyMap.get(r.booking.giftRecipientCompanyId)
      : null;
    const isFreeGift = Boolean(r.booking.isFreeGift);
    const effectiveCompany = isFreeGift ? (giftCompany || userCompany) : userCompany;

    const qty = Math.max(1, r.booking.partySize || 1);
    const unitPrice =
      r.venue.priceBasketCents || Math.round(r.booking.totalAmountCents / qty) || 3800;
    const finalPrice = isFreeGift
      ? 0
      : (r.booking.finalPriceCents || (r.booking.totalAmountCents - r.booking.discountCents));
    
    // BUSINESS RULE: Zero commissioni sui Produttori Locali per la Startup RADICI (100% al produttore)
    const commission = 0;
    const net = finalPrice;

    // Sinergie Flotta Aziendale: tratta espressa dedicata eliminata = 50 km a cesto
    const kmAvoided = qty * 50;
    const co2SavedKg = Number((kmAvoided * 0.265).toFixed(1));

    return {
      id: r.booking.id,
      createdAt: r.booking.createdAt,
      orderDate: r.booking.bookingDate,
      timeSlot: r.booking.timeSlot,
      buyerName: r.booking.guestName || `${r.user.firstName} ${r.user.lastName}`,
      buyerEmail: r.booking.guestEmail || r.user.email,
      buyerRole: r.user.role,
      companyName: effectiveCompany ? effectiveCompany.name : null,
      connectedViaEmployeeName,
      deliveryMode: "ritiro in sede aziendale",
      producerId: r.venue.id,
      producerName: r.venue.name,
      producerCity: r.venue.city,
      producerRegion: r.venue.region,
      basketName: r.venue.basketName || "Cesto Tipico KM 0",
      basketDescription: r.venue.basketDescription,
      quantity: qty,
      unitPriceCents: unitPrice,
      totalListPriceCents: isFreeGift ? 0 : r.booking.totalAmountCents,
      discountPercent: r.booking.discountPercent,
      discountCents: r.booking.discountCents,
      finalPriceCents: finalPrice,
      commissionCents: commission,
      producerNetCents: net,
      isFreeGift,
      giftRecipientCompanyName: giftCompany ? giftCompany.name : null,
      kmAvoided,
      co2SavedKg,
      status: r.booking.status,
      notes: "ritiro in sede aziendale",
    };
  });

  const activeProducerOrders = producerOrders.filter((o) => o.status !== "cancelled");
  const totalProducerBasketsSold = activeProducerOrders.reduce((sum, o) => sum + o.quantity, 0);
  const totalProducerRevenueCents = activeProducerOrders.reduce((sum, o) => sum + o.finalPriceCents, 0);
  const totalKmAvoided = activeProducerOrders.reduce((sum, o) => sum + o.kmAvoided, 0);
  const totalCo2SavedKg = Number(
    activeProducerOrders.reduce((sum, o) => sum + o.co2SavedKg, 0).toFixed(1)
  );
  const producersCount = allVenues.filter((v) => v.type === "producer").length;

  const freeBasketThreshold = 10;
  const freeBasketsEarnedTotal = Math.floor(totalProducerBasketsSold / freeBasketThreshold);
  const basketsProgressToNextGift = totalProducerBasketsSold % freeBasketThreshold;

  // 2b. Prenotazioni Community Turistico-Culturali (Soggiorni, Cene e Spettacoli Teatrali)
  const communityBookingsRows = allBookingsRows.filter(
    (r) => r.booking.bookingType !== "local_basket" && r.venue.type !== "producer"
  );

  const communityBookings = communityBookingsRows.map((r) => {
    const bType = r.booking.bookingType as string;
    let serviceLabel = "Soggiorno / Ospitalità";
    if (r.booking.grantEventId || r.venue.type === "theater" || bType === "theater_event") {
      serviceLabel = r.grantEvent?.title ? `Teatro: ${r.grantEvent.title}` : "Spettacolo Teatrale";
    } else if (bType === "dinner" || bType === "aperitivo" || r.venue.type === "restaurant") {
      serviceLabel = "Ristorazione / Cena";
    }

    return {
      id: r.booking.id,
      createdAt: r.booking.createdAt,
      bookingDate: r.booking.bookingDate,
      timeSlot: r.booking.timeSlot,
      partySize: r.booking.partySize,
      status: r.booking.status,
      guestName: r.booking.guestName,
      guestEmail: r.booking.guestEmail,
      guestPhone: r.booking.guestPhone,
      venueName: r.venue.name,
      venueCity: r.venue.city,
      venueType: r.venue.type,
      bookingType: bType,
      serviceLabel,
      eventTitle: r.grantEvent?.title ?? null,
      finalPriceCents: r.booking.finalPriceCents,
      notes: r.booking.notes,
    };
  });

  const totalCommunityBookingsCount = communityBookings.length;
  const totalCommunityBookingsSeats = communityBookings.reduce((sum, b) => sum + b.partySize, 0);
  const totalCommunityConfirmedCount = communityBookings.filter(
    (b) => b.status === "confirmed" || b.status === "presence_confirmed" || b.status === "attended"
  ).length;
  const totalCommunityPendingCount = communityBookings.filter((b) => b.status === "pending").length;

  // 3. Transazioni di Piattaforma Complete (Voucher Welfare B2B + Pagamenti Consumer + Teatri + Vendite Cesti KM 0)
  const rawTx = await db
    .select()
    .from(transactions)
    .orderBy(desc(transactions.createdAt));

  const basePlatformTransactions: PlatformTransactionRow[] = rawTx.map((tx) => {
    const user = userMap.get(tx.userId);
    const company = tx.companyId ? companyMap.get(tx.companyId) : null;
    const venue = venueMap.get(tx.venueId);

    const commission = tx.commissionAmountCents || Math.round(tx.amountCents * 0.1);
    const net = tx.providerNetCents || tx.amountCents - commission;

    return {
      id: tx.id,
      createdAt: tx.createdAt,
      serviceLabel: tx.serviceLabel,
      type: tx.type,
      status: tx.status,
      amountCents: tx.amountCents,
      commissionCents: commission,
      providerNetCents: net,
      paymentStatus: tx.paymentStatus || "pending",
      paymentNotes: tx.paymentNotes,
      settledAt: tx.settledAt,
      invoiceNumber: tx.invoiceNumber,
      invoiceDate: tx.invoiceDate,
      userName: user ? `${user.firstName} ${user.lastName}` : "Utente",
      userEmail: user?.email ?? "",
      companyName: company?.name ?? null,
      companyVat: company?.vatNumber ?? null,
      venueName: venue?.name ?? "Struttura",
      venueType: venue?.type ?? "Struttura",
      venueCity: venue?.city ?? "Territorio",
      voucherId: tx.voucherId,
    };
  });

  // Integrazione Transazioni Vendite Produttori a KM 0 (0% commissione Radici, 100% all'operatore)
  const producerTxRows: PlatformTransactionRow[] = producerOrders.map((po) => {
    const isCancelled = po.status === "cancelled";
    const isSettled = po.status === "attended" || po.status === "presence_confirmed";
    return {
      id: 200000 + po.id,
      createdAt: po.createdAt,
      serviceLabel: po.isFreeGift
        ? `Cesto KM 0 (Omaggio 10:1 Addetti CSR) · ${po.basketName}`
        : `Cesto KM 0 · ${po.basketName} (${po.quantity} ${po.quantity === 1 ? "cesto" : "cesti"})`,
      type: "producer_basket",
      status: isCancelled ? "cancelled" : "completed",
      amountCents: po.finalPriceCents,
      commissionCents: 0, // Zero fee startup
      providerNetCents: po.finalPriceCents, // 100% al produttore
      paymentStatus: isCancelled ? "cancelled" : isSettled ? "settled" : "pending",
      paymentNotes: po.isFreeGift
        ? "Omaggio 10:1 maturato · Sinergie flotta (ritiro in sede aziendale)"
        : "Vendita Filiera Corta KM 0 · Sinergie flotta (ritiro in sede aziendale)",
      settledAt: isSettled ? po.createdAt : null,
      invoiceNumber: null,
      invoiceDate: null,
      userName: po.buyerName,
      userEmail: po.buyerEmail,
      companyName: po.companyName,
      companyVat: null,
      venueName: po.producerName,
      venueType: "producer",
      venueCity: po.producerCity,
      voucherId: null,
    };
  });

  // Integrazione Biglietti Teatrali della Community a Pagamento
  const theaterTxRows: PlatformTransactionRow[] = communityBookings
    .filter((b) => (b.bookingType === "theater_event" || b.venueType === "theater") && b.finalPriceCents > 0)
    .map((b) => {
      const isCancelled = b.status === "cancelled";
      const isSettled = b.status === "attended" || b.status === "presence_confirmed";
      const comm = Math.round(b.finalPriceCents * 0.1);
      return {
        id: 300000 + b.id,
        createdAt: b.createdAt,
        serviceLabel: b.eventTitle ? `Teatro: ${b.eventTitle}` : `Biglietto Spettacolo Teatrale (${b.partySize} posti)`,
        type: "theater_ticket",
        status: isCancelled ? "cancelled" : "completed",
        amountCents: b.finalPriceCents,
        commissionCents: comm,
        providerNetCents: b.finalPriceCents - comm,
        paymentStatus: isCancelled ? "cancelled" : isSettled ? "settled" : "pending",
        paymentNotes: "Vendita Biglietto Botteghino Culturale (Community)",
        settledAt: isSettled ? b.createdAt : null,
        invoiceNumber: null,
        invoiceDate: null,
        userName: b.guestName,
        userEmail: b.guestEmail,
        companyName: null,
        companyVat: null,
        venueName: b.venueName,
        venueType: "theater",
        venueCity: b.venueCity,
        voucherId: null,
      };
    });

  // Unione e ordinamento cronologico decrescente di tutte le transazioni
  const platformTransactions: PlatformTransactionRow[] = [
    ...basePlatformTransactions,
    ...producerTxRows,
    ...theaterTxRows,
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // KPI Economici Globali (somma di tutto il transato attivo: voucher welfare, teatri, cesti KM 0 e pagamenti consumer)
  const activePlatformTransactions = platformTransactions.filter(
    (tx) => tx.paymentStatus !== "cancelled" && tx.status !== "cancelled"
  );
  const totalGmvCents = activePlatformTransactions.reduce((sum, tx) => sum + tx.amountCents, 0);
  const totalCommissionsCents = activePlatformTransactions.reduce((sum, tx) => sum + tx.commissionCents, 0);
  const totalProviderNetCents = activePlatformTransactions.reduce((sum, tx) => sum + tx.providerNetCents, 0);
  const totalSettledCents = activePlatformTransactions
    .filter((tx) => tx.paymentStatus === "settled")
    .reduce((sum, tx) => sum + tx.providerNetCents, 0);
  const totalPendingCents = activePlatformTransactions
    .filter((tx) => tx.paymentStatus === "pending")
    .reduce((sum, tx) => sum + tx.providerNetCents, 0);

  // Statistiche Voucher
  const totalVouchersIssued = allVouchers.length;
  const totalVouchersRedeemed = allVouchers.filter((v) => v.status !== "available").length;
  const totalVouchersAvailable = allVouchers.filter((v) => v.status === "available").length;
  const totalVouchersAttended = allVouchers.filter((v) => v.status === "attended").length;
  const totalVouchersNoShow = allVouchers.filter((v) => v.status === "no_show").length;

  // 4. Panoramica Imprese CSR
  const companiesList: CompanyOverview[] = allCompanies.map((c) => {
    const compVouchers = allVouchers.filter((v) => v.companyId === c.id);
    const compTx = platformTransactions.filter(
      (tx) =>
        tx.companyName === c.name &&
        tx.type === "welfare_redeem" &&
        tx.status !== "cancelled" &&
        tx.paymentStatus !== "cancelled"
    );

    const totalDebt = compTx.reduce((sum, tx) => sum + tx.amountCents, 0);
    const totalSettled = compTx
      .filter((tx) => tx.paymentStatus === "settled")
      .reduce((sum, tx) => sum + tx.amountCents, 0);

    const csrUser = allUsers.find((u) => u.companyId === c.id && u.role === "csr");
    const sponsoredVenues = allVenues.filter((v) => v.sponsorCompanyId === c.id).map((v) => v.name);

    return {
      id: c.id,
      name: c.name,
      slug: c.slug,
      vatNumber: c.vatNumber,
      city: c.city,
      sector: c.sector,
      description: c.description,
      employeesCount: c.employeesCount,
      fundedAmountCents: c.fundedAmountCents,
      localRedistributionCents: c.localRedistributionCents,
      co2SavedKg: c.co2SavedKg,
      localImpactDescription: c.localImpactDescription,
      reportUrl: c.reportUrl,
      totalVouchersIssued: compVouchers.length,
      totalVouchersRedeemed: compVouchers.filter((v) => v.status !== "available").length,
      totalDebtToProvidersCents: totalDebt,
      totalSettledToProvidersCents: totalSettled,
      totalPendingToProvidersCents: totalDebt - totalSettled,
      managerEmail: csrUser?.email ?? null,
      managerName: csrUser ? `${csrUser.firstName} ${csrUser.lastName}` : null,
      sponsoredVenuesNames: sponsoredVenues,
    };
  });

  // 4. Panoramica Fornitori del Territorio
  const destMap = new Map(allDestinations.map((d) => [d.id, d]));
  const compMap = new Map(allCompanies.map((c) => [c.id, c]));

  const venuesList: VenueOverview[] = allVenues.map((v) => {
    const venueTx = platformTransactions.filter(
      (tx) => tx.venueName === v.name && tx.status !== "cancelled" && tx.paymentStatus !== "cancelled"
    );
    const venueSelections = allSelections.filter((s) => s.venueId === v.id);

    const grossVolume = venueTx.reduce((sum, tx) => sum + tx.amountCents, 0);
    const commissions = venueTx.reduce((sum, tx) => sum + tx.commissionCents, 0);
    const netRev = venueTx.reduce((sum, tx) => sum + tx.providerNetCents, 0);
    const settled = venueTx
      .filter((tx) => tx.paymentStatus === "settled")
      .reduce((sum, tx) => sum + tx.providerNetCents, 0);

    const dest = destMap.get(v.destinationId);
    const sponsor = v.sponsorCompanyId ? compMap.get(v.sponsorCompanyId) : null;
    const providerUser = allUsers.find(
      (u) => u.venueId === v.id && (u.role === "provider" || u.role === "theater")
    );

    return {
      id: v.id,
      name: v.name,
      slug: v.slug,
      type: v.type,
      city: v.city,
      province: v.province,
      region: v.region,
      coverImage: v.coverImage,
      destinationId: v.destinationId,
      destinationName: dest?.name ?? v.city,
      description: v.description,
      longDescription: v.longDescription || v.description,
      services: (v.services as string[]) || [],
      priceHotelCents: v.priceHotelCents,
      priceAperitivoCents: v.priceAperitivoCents,
      priceShowCents: v.priceShowCents,
      priceBasketCents: v.priceBasketCents,
      basketName: v.basketName,
      basketDescription: v.basketDescription,
      sponsorCompanyId: v.sponsorCompanyId,
      sponsorCompanyName: sponsor?.name ?? null,
      checkinCode: v.checkinCode,
      managerEmail: providerUser?.email ?? null,
      managerName: providerUser ? `${providerUser.firstName} ${providerUser.lastName}` : null,
      redeemedCount: venueSelections.length,
      attendedCount: venueSelections.filter((s) => s.attendanceStatus === "attended").length,
      noShowCount: venueSelections.filter((s) => s.attendanceStatus === "no_show").length,
      grossVolumeCents: grossVolume,
      commissionsPaidCents: commissions,
      netRevenueCents: netRev,
      settledCents: settled,
      pendingCents: netRev - settled,
    };
  });

  // 5. Matching Grants & Fondo Culturale
  const grantRows = await db
    .select({
      grant: matchingGrants,
      voucher: vouchers,
      user: users,
      company: companies,
      venue: venues,
    })
    .from(matchingGrants)
    .innerJoin(vouchers, eq(matchingGrants.voucherId, vouchers.id))
    .innerJoin(users, eq(vouchers.userId, users.id))
    .innerJoin(companies, eq(vouchers.companyId, companies.id))
    .leftJoin(venues, eq(vouchers.venueId, venues.id))
    .orderBy(desc(matchingGrants.assignedAt));

  const grants: PromoterGrantRow[] = grantRows.map((row) => {
    const event = grantEventMap.get(row.grant.eventId);
    const theater = event?.venueId ? theaterMap.get(event.venueId) : null;

    return {
      voucherId: row.voucher.id,
      grantId: row.grant.id,
      employeeName: `${row.user.firstName} ${row.user.lastName}`,
      employeeEmail: row.user.email,
      companyName: row.company.name,
      venueName: row.venue?.name ?? "Struttura Ricettiva",
      venueCity: row.venue?.city ?? "Territorio",
      eventTitle: event?.title ?? "Evento Culturale del Territorio",
      eventCategory: event?.category ?? "teatro",
      eventLocation: event ? `${event.venueName} (${event.city})` : "Teatro del Circuito",
      theaterName: theater?.name ?? (event ? event.venueName : "Teatro Storico"),
      startsAt: event?.startsAt ?? null,
      seatsRequested: row.grant.seatsRequested,
      status: row.grant.status,
      confirmedAt: row.grant.confirmedAt,
      attendedAt: row.grant.attendedAt,
      grantValueCents: row.grant.amountCents,
    };
  });

  const totalGrantsAssigned = grants.length;
  const totalGrantsConfirmed = grants.filter((g) => g.status === "confirmed").length;
  const totalGrantsAttended = grants.filter((g) => g.status === "attended").length;
  const totalGrantsNoShow = grants.filter((g) => g.status === "no_show").length;
  const totalGrantsExpired = grants.filter((g) => g.status === "expired" || g.status === "declined").length;

  const grantFundCapacityCents = 2500000; // 25.000 € stanziati per il fondo matching grant iniziale
  const grantFundSpentCents = grants.reduce((sum, g) => sum + g.grantValueCents, 0);

  let overbookingAlertsCount = 0;

  const events = allGrantEvents.map((ge) => {
    // Posti occupati da Welfare Matching Grants
    const eventGrants = grants.filter(
      (g) =>
        grantRows.find((r) => r.grant.id === g.grantId)?.grant.eventId === ge.id &&
        g.status !== "declined" &&
        g.status !== "expired"
    );
    const welfareSeats = eventGrants.reduce((sum, g) => sum + g.seatsRequested, 0);

    // Posti occupati da Prenotazioni Community Amici allo spettacolo
    const eventCommunity = communityBookings.filter(
      (b) =>
        communityBookingsRows.find((r) => r.booking.id === b.id)?.booking.grantEventId === ge.id &&
        b.status !== "rejected" &&
        b.status !== "cancelled"
    );
    const communitySeats = eventCommunity.reduce((sum, b) => sum + b.partySize, 0);

    const capacity = ge.capacity || 50;
    const seatsOccupied = welfareSeats + communitySeats;
    const seatsAvailable = Math.max(0, capacity - seatsOccupied);
    const occupancyPercent = capacity > 0 ? Math.round((seatsOccupied / capacity) * 100) : 0;
    const isOverbookingRisk = seatsAvailable <= Math.max(2, Math.round(capacity * 0.15));

    if (isOverbookingRisk) {
      overbookingAlertsCount++;
    }

    return {
      id: ge.id,
      title: ge.title,
      category: ge.category,
      venueId: ge.venueId,
      venueName: ge.venueName,
      city: ge.city,
      region: ge.region,
      description: ge.description,
      startsAt: ge.startsAt,
      capacity,
      grantAmountCents: ge.grantAmountCents,
      artistMeetupIncluded: ge.artistMeetupIncluded,
      welfareSeats,
      communitySeats,
      seatsOccupied,
      seatsAvailable,
      occupancyPercent,
      isOverbookingRisk,
      grantsGeneratedCount: eventGrants.length,
    };
  });

  const theaters = theaterVenues.map((th) => {
    const count = grants.filter((g) => g.theaterName === th.name).length;
    return {
      id: th.id,
      name: th.name,
      city: th.city,
      region: th.region,
      grantsGeneratedCount: count,
    };
  });

  const destinationsList = allDestinations.map((d) => ({
    id: d.id,
    name: d.name,
    region: d.region,
  }));

  const sponsorCompaniesList = allCompanies.map((c) => ({
    id: c.id,
    name: c.name,
  }));

  const theatersList = theaterVenues.map((th) => ({
    id: th.id,
    name: th.name,
    city: th.city,
    region: th.region,
  }));

  return {
    promoterUser,
    totalGmvCents,
    totalCommissionsCents,
    totalProviderNetCents,
    totalSettledCents,
    totalPendingCents,
    totalVouchersIssued,
    totalVouchersRedeemed,
    totalVouchersAvailable,
    totalVouchersAttended,
    totalVouchersNoShow,
    companiesCount: allCompanies.length,
    venuesCount: allVenues.length,
    employeesCount: allUsers.filter((u) => u.role === "employee").length,
    platformTransactions,
    companiesList,
    venuesList,
    destinationsList,
    sponsorCompaniesList,
    theatersList,
    totalGrantsAssigned,
    totalGrantsConfirmed,
    totalGrantsAttended,
    totalGrantsNoShow,
    totalGrantsExpired,
    grantFundCapacityCents,
    grantFundSpentCents,
    eventsCount: allGrantEvents.length,
    theatersCount: theaterVenues.length,
    promotedDestinationsCount: allDestinations.length,
    grants,
    events,
    theaters,
    communityBookings,
    totalCommunityBookingsCount,
    totalCommunityBookingsSeats,
    totalCommunityConfirmedCount,
    totalCommunityPendingCount,
    overbookingAlertsCount,
    producerOrders,
    totalProducerBasketsSold,
    totalProducerRevenueCents,
    totalKmAvoided,
    totalCo2SavedKg,
    producersCount,
    freeBasketThreshold,
    freeBasketsEarnedTotal,
    basketsProgressToNextGift,
  };
}
