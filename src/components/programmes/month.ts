/** Monatsüberschrift im Format de-DE, z. B. "Oktober 2026" (feste Zeitzone wie in labels.ts) */
const monthFormat = new Intl.DateTimeFormat("de-DE", { month: "long", year: "numeric", timeZone: "Europe/Berlin" });

export const monthHeading = (isoDate: string): string => monthFormat.format(new Date(isoDate));

/** Schlüssel "2026-10" zum Gruppieren nach Monat */
export const monthKey = (isoDate: string): string => isoDate.slice(0, 7);
