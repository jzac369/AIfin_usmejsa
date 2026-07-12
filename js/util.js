// Spoločné pomocné funkcie

// Jednoduché obrysové SVG ikony pre verejnú zónu (registrácia, kvíz) - namiesto emoji.
export const ICONS = {
  location: '<svg class="icon-inline" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 21s7-6.3 7-11.5A7 7 0 105 9.5C5 14.7 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.4"/></svg>',
  calendar: '<svg class="icon-inline" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="4" y="5" width="16" height="16" rx="2"/><path d="M4 10h16M8 3v4M16 3v4"/></svg>',
  quiz: '<svg class="icon-inline" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 8h6M9 12h6M9 16h3"/></svg>',
  gear: '<svg class="icon-inline" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="3"/><path d="M12 3v2M12 19v2M21 12h-2M5 12H3M18.4 5.6l-1.4 1.4M7 15.6l-1.4 1.4M18.4 18.4l-1.4-1.4M7 8.4L5.6 7"/></svg>',
  chat: '<svg class="icon-inline" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 5h16v11H8l-4 4z"/></svg>',
  smartphone: '<svg class="icon-inline" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="7" y="3" width="10" height="18" rx="2"/><path d="M11 18h2"/></svg>',
  clipboard: '<svg class="icon-inline" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="6" y="4" width="12" height="17" rx="2"/><path d="M9 4V3a1 1 0 011-1h4a1 1 0 011 1v1"/></svg>',
  book: '<svg class="icon-inline" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 5.5A2.5 2.5 0 016.5 3H20v15.5a2.5 2.5 0 01-2.5 2.5H4z"/><path d="M4 18.5A2.5 2.5 0 016.5 16H20"/></svg>',
  trophy: '<svg class="icon-inline" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M8 4h8v5a4 4 0 01-8 0z"/><path d="M8 5H4v2a3 3 0 003 3M16 5h4v2a3 3 0 01-3 3"/><path d="M12 13v3M9 20h6M9.5 20c0-2 1-3 2.5-3s2.5 1 2.5 3"/></svg>',
  printer: '<svg class="icon-inline" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M6 9V3h12v6"/><rect x="6" y="13" width="12" height="8"/><path d="M4 9h16v7h-4"/></svg>',
  cycle: '<svg class="icon-inline" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 12a8 8 0 0113.66-5.66L20 8M20 4v4h-4"/><path d="M20 12a8 8 0 01-13.66 5.66L4 16M4 20v-4h4"/></svg>',
  ban: '<svg class="icon-inline" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="9"/><path d="M6 6l12 12"/></svg>',
  check: '<svg class="icon-inline" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="9"/><path d="M8 12.5l2.5 2.5L16 9.5"/></svg>',
  back: '<svg class="icon-inline" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M19 12H5M11 6l-6 6 6 6"/></svg>',
  shield: '<svg class="icon-inline" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z"/><path d="M9 12l2 2 4-4"/></svg>'
};

const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // bez 0/O/1/I - menej mätúce

export function generateCode(length = 5) {
  let out = "";
  for (let i = 0; i < length; i++) {
    out += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  }
  return out;
}

export function formatDateTime(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleString("sk-SK", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

export function downloadICS(term, details) {
  const durationHours = details?.durationHours || 2;
  const title = details?.title || "Ako sa nenechať oklamať – AI ako pomocník pri finančných rozhodnutiach";
  const start = new Date(term.datetime);
  const end = new Date(start.getTime() + durationHours * 60 * 60 * 1000);
  const fmt = (d) => d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  const escapeICS = (s) => String(s || "").replace(/([,;])/g, "\\$1").replace(/\n/g, "\\n");
  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "BEGIN:VEVENT",
    `UID:${term.id}-${Date.now()}@aifin-usmejsa`,
    `DTSTAMP:${fmt(new Date())}`,
    `DTSTART:${fmt(start)}`,
    `DTEND:${fmt(end)}`,
    `SUMMARY:Workshop: ${escapeICS(title)}`,
    `DESCRIPTION:${escapeICS(details?.description || "Tešíme sa na vás na workshope!")}`,
    details?.location ? `LOCATION:${escapeICS(details.location)}` : "",
    "END:VEVENT",
    "END:VCALENDAR"
  ].filter(Boolean).join("\r\n");
  const blob = new Blob([ics], { type: "text/calendar" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "workshop-AI-financie.ics";
  a.click();
  URL.revokeObjectURL(a.href);
}

export function exportRegistrationsCSV(registrations, terms) {
  const termMap = Object.fromEntries(terms.map((t) => [t.id, t]));
  const header = [
    "Kód", "Meno a priezvisko", "Mesto", "Email", "Telefón", "Termín",
    "Zdroj informácie", "Zariadenia", "Skúsenosti s AI", "Digitálne zručnosti", "Dôvod účasti", "Typ finančných rozhodnutí",
    "Vstupný kvíz (%)", "Výstupný kvíz (%)", "Registrované"
  ];
  const rows = registrations.map((r) => {
    const term = termMap[r.termId];
    return [
      r.code,
      r.fullName,
      r.city,
      r.email,
      r.phone,
      term ? formatDateTime(term.datetime) : r.termId,
      r.survey?.source ?? "",
      (r.survey?.devices ?? []).join("; "),
      r.survey?.aiExperience ?? "",
      r.survey?.digitalSkill ?? "",
      r.survey?.reason ?? "",
      r.survey?.financeTopic ?? "",
      r.entryScore != null ? Math.round((r.entryScore / 8) * 100) : "",
      r.exitScore != null ? Math.round((r.exitScore / 8) * 100) : "",
      r.createdAt ? new Date(r.createdAt).toLocaleString("sk-SK") : ""
    ];
  });
  const csv = [header, ...rows]
    .map((row) => row.map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`).join(","))
    .join("\r\n");
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "prihlasenia.csv";
  a.click();
  URL.revokeObjectURL(a.href);
}

function downloadCSV(filename, header, rows) {
  const csv = [header, ...rows]
    .map((row) => row.map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`).join(","))
    .join("\r\n");
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

export function exportResultsCSV(registrations) {
  const header = ["Kód", "Meno a priezvisko", "Vstupný kvíz (z 8)", "Vstupný kvíz (%)", "Výstupný kvíz (z 8)", "Výstupný kvíz (%)", "Zmena"];
  const rows = registrations
    .filter((r) => r.entryScore != null || r.exitScore != null)
    .map((r) => {
      const entry = r.entryScore != null ? r.entryScore : "";
      const exit = r.exitScore != null ? r.exitScore : "";
      const entryPct = r.entryScore != null ? Math.round((r.entryScore / 8) * 100) : "";
      const exitPct = r.exitScore != null ? Math.round((r.exitScore / 8) * 100) : "";
      const diff = r.entryScore != null && r.exitScore != null ? r.exitScore - r.entryScore : "";
      return [r.code, r.fullName, entry, entryPct, exit, exitPct, diff];
    });
  downloadCSV("vysledky_kvizov.csv", header, rows);
}

