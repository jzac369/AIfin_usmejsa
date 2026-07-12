// Spoločné pomocné funkcie

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

