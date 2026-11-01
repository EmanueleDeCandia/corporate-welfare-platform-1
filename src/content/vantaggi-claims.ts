/**
 * Claim dichiarati del modello RADICI.
 *
 * Questi numeri NON sono misurati dal database: sono assunzioni di modello
 * approvate dal committente e servono solo alla narrazione della pagina
 * /vantaggi. I numeri misurati (strutture, welfare stanziato, CO₂) si leggono
 * invece da src/lib/data.ts e da CO2_KG_PER_KM.
 *
 * Se cambia un'assunzione di business, si cambia SOLO qui.
 */

/** Deducibilità fiscale dei voucher welfare ex Art. 51 TUIR. */
export const DEDUCIBILITA_PERCENT = 100;

/** Riduzione del churn dichiarata dal modello di retention. */
export const CHURN_REDUCTION_PERCENT = 80;

/** Moltiplicatore di indotto economico sul territorio. */
export const INDOTTO_MULTIPLIER = 2.5;

/** Valore nominale del voucher pernottamento. */
export const VOUCHER_NOTTE_CENTS = 5000;

/** Valore nominale del voucher cena / aperitivo KM 0. */
export const VOUCHER_CENA_CENTS = 2500;

/** Valore complessivo del Matching Grant culturale (2 posti). */
export const MATCHING_GRANT_CENTS = 5000;

/** Percentuale di residuo che sblocca gli extra di fine scadenza. */
export const RESIDUO_EXTRA_PERCENT = 20;

/** Etichetta di trasparenza da affiancare ai claim di modello. */
export const CLAIM_NOTE = "Dato di modello";
