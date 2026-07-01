import { firebaseConfig } from "./firebase-config.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  getFirestore, collection, getDocs, doc, setDoc, getDoc, updateDoc, deleteDoc, runTransaction, addDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { formatDateTime, exportRegistrationsCSV, exportResultsCSV, applyStoredTheme, toggleTheme } from "./util.js";
import { ENTRY_QUIZ, EXIT_QUIZ } from "./questions.js";

applyStoredTheme();
document.getElementById("themeBtn").addEventListener("click", toggleTheme);

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const TERM_COUNT = 5;
let terms = [];
let registrations = [];

function currentAdminEmail() {
  return auth.currentUser?.email || "neznámy admin";
}

async function logAudit(action, code, details) {
  try {
    await addDoc(collection(db, "auditLog"), {
      action,
      code,
      details,
      adminEmail: currentAdminEmail(),
      timestamp: Date.now()
    });
  } catch {
    // logovanie nesmie zhodiť samotnú akciu
  }
}

// ---------- AUTH ----------
document.getElementById("loginBtn").addEventListener("click", async () => {
  const errBox = document.getElementById("loginError");
  errBox.style.display = "none";
  const email = document.getElementById("adminEmail").value.trim();
  const pass = document.getElementById("adminPass").value;
  try {
    await signInWithEmailAndPassword(auth, email, pass);
  } catch (err) {
    errBox.textContent = "Nesprávny email alebo heslo.";
    errBox.style.display = "block";
  }
});

document.getElementById("logoutLink").addEventListener("click", (e) => {
  e.preventDefault();
  signOut(auth);
});

onAuthStateChanged(auth, (user) => {
  const loginCard = document.getElementById("loginCard");
  const dashboard = document.getElementById("dashboard");
  const logoutLink = document.getElementById("logoutLink");
  if (user) {
    loginCard.style.display = "none";
    dashboard.style.display = "block";
    logoutLink.style.display = "inline";
    loadAll();
  } else {
    loginCard.style.display = "block";
    dashboard.style.display = "none";
    logoutLink.style.display = "none";
  }
});

// ---------- TABS ----------
document.querySelectorAll("#mainTabs button").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll("#mainTabs button").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    document.querySelectorAll(".tab-panel").forEach((p) => (p.style.display = "none"));
    document.getElementById(`tab-${btn.dataset.tab}`).style.display = "block";
  });
});

// ---------- LOAD DATA ----------
async function loadAll() {
  const [termsSnap, regsSnap] = await Promise.all([
    getDocs(collection(db, "terms")),
    getDocs(collection(db, "registrations"))
  ]);
  terms = termsSnap.docs.map((d) => ({ id: d.id, ...d.data() })).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  registrations = regsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

  renderAlerts();
  renderTermsEditor();
  renderTermFilter();
  renderTable();
  renderStats();
  renderResultsTable();
  await loadQuestionsIntoEditor();
  await loadEmailTemplate();
  await loadLandingContent();
  await loadAuditLog();
}

// ---------- ALERTS ----------
function renderAlerts() {
  const panel = document.getElementById("alertsPanel");
  const now = Date.now();
  const alerts = [];

  terms.forEach((t) => {
    if (!t.datetime) return;
    const when = new Date(t.datetime).getTime();
    const daysAway = (when - now) / (1000 * 60 * 60 * 24);
    const capacity = t.capacity || 10;
    const booked = t.booked || 0;
    const pctFull = booked / capacity;

    if (daysAway > 0 && daysAway <= 5 && pctFull < 0.5) {
      alerts.push({
        urgent: true,
        text: `⚠️ Termín ${formatDateTime(t.datetime)} sa blíži (o menej ako 5 dní) a je obsadený len na ${Math.round(pctFull * 100)} % (${booked}/${capacity}). Zvážte dodatočnú propagáciu.`
      });
    } else if (daysAway > 0 && capacity - booked <= 2 && capacity - booked > 0) {
      alerts.push({
        urgent: false,
        text: `🔥 Termín ${formatDateTime(t.datetime)} je takmer plný – ostávajú posledné ${capacity - booked} miesta.`
      });
    }
  });

  const notDoneEntry = registrations.filter((r) => r.status !== "cancelled" && !r.entryQuizDone).length;
  if (notDoneEntry > 0) {
    alerts.push({ urgent: false, text: `📝 ${notDoneEntry} prihlásených účastníkov ešte nevyplnilo vstupný kvíz.` });
  }

  panel.innerHTML = alerts
    .map((a) => `<div class="alert-box${a.urgent ? " urgent" : ""}">${a.text}</div>`)
    .join("");
}

// ---------- TERMS EDITOR ----------
function renderTermsEditor() {
  const editor = document.getElementById("termsEditor");
  editor.innerHTML = "";
  for (let i = 0; i < TERM_COUNT; i++) {
    const id = `term${i + 1}`;
    const existing = terms.find((t) => t.id === id);
    const localValue = existing?.datetime ? toLocalInputValue(existing.datetime) : "";
    const wrap = document.createElement("div");
    wrap.style.marginBottom = "16px";
    wrap.style.paddingBottom = "12px";
    wrap.style.borderBottom = "1px solid var(--border)";
    wrap.innerHTML = `
      <label>Termín ${i + 1} (kapacita: 10 osôb${existing ? ", obsadené: " + (existing.booked || 0) : ""})</label>
      <input type="datetime-local" id="termInput${i}" value="${localValue}" />
      <label>Počet miest na čakacej listine (náhradníci)</label>
      <input type="number" min="0" id="waitlistInput${i}" value="${existing?.waitlistCapacity || 0}" style="max-width:140px;" />
      ${existing ? `<p style="color:var(--muted); font-size:.8rem; margin-top:4px;">Na čakacej listine momentálne: ${existing.waitlistCount || 0}/${existing.waitlistCapacity || 0}</p>` : ""}
    `;
    editor.appendChild(wrap);
  }
}

function toLocalInputValue(iso) {
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

document.getElementById("saveTermsBtn").addEventListener("click", async () => {
  for (let i = 0; i < TERM_COUNT; i++) {
    const id = `term${i + 1}`;
    const val = document.getElementById(`termInput${i}`).value;
    if (!val) continue;
    const existing = terms.find((t) => t.id === id);
    const waitlistCapacity = parseInt(document.getElementById(`waitlistInput${i}`).value, 10) || 0;
    await setDoc(
      doc(db, "terms", id),
      {
        datetime: new Date(val).toISOString(),
        capacity: 10,
        booked: existing?.booked || 0,
        waitlistCapacity,
        waitlistCount: existing?.waitlistCount || 0,
        order: i
      },
      { merge: true }
    );
  }
  document.getElementById("termsSaveMsg").style.display = "block";
  setTimeout(() => (document.getElementById("termsSaveMsg").style.display = "none"), 3000);
  await loadAll();
});

// ---------- REGISTRATIONS TABLE ----------
function renderTermFilter() {
  const sel = document.getElementById("termFilter");
  const prev = sel.value;
  sel.innerHTML = '<option value="">Všetky termíny</option>';
  terms.forEach((t) => {
    const opt = document.createElement("option");
    opt.value = t.id;
    opt.textContent = formatDateTime(t.datetime);
    sel.appendChild(opt);
  });
  sel.value = prev;
}

function rowClass(r) {
  if (r.status === "waitlist") return "row-waitlist";
  if (r.entryQuizDone && r.exitQuizDone) return "row-done";
  if (r.entryQuizDone) return "row-partial";
  return "";
}

function renderTable() {
  const container = document.getElementById("regGroupsContainer");
  const search = document.getElementById("searchInput").value.toLowerCase();
  const termFilter = document.getElementById("termFilter").value;
  const termMap = Object.fromEntries(terms.map((t) => [t.id, t]));

  const filtered = registrations
    .filter((r) => !termFilter || r.termId === termFilter)
    .filter((r) => {
      if (!search) return true;
      return [r.fullName, r.city, r.email, r.code].some((v) => (v || "").toLowerCase().includes(search));
    });

  const groups = {};
  filtered.forEach((r) => {
    const key = r.termId || "bez-terminu";
    if (!groups[key]) groups[key] = [];
    groups[key].push(r);
  });

  const groupKeys = Object.keys(groups).sort((a, b) => {
    const ta = termMap[a]?.order ?? 999;
    const tb = termMap[b]?.order ?? 999;
    return ta - tb;
  });

  container.innerHTML = "";

  if (groupKeys.length === 0) {
    container.innerHTML = "<p style='color:var(--muted)'>Žiadni prihlásení účastníci nezodpovedajú filtru.</p>";
    return;
  }

  groupKeys.forEach((key) => {
    const term = termMap[key];
    const rows = groups[key].sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));

    const groupWrap = document.createElement("div");
    groupWrap.style.marginBottom = "28px";
    groupWrap.innerHTML = `
      <div style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:8px; margin-bottom:8px; padding-bottom:8px; border-bottom:2px solid var(--primary);">
        <h3 style="margin:0;">
          📅 ${term ? formatDateTime(term.datetime) : "Bez priradeného termínu"}
          <span style="color:var(--muted); font-weight:400; font-size:.85rem;">(${rows.length} ${rows.length === 1 ? "účastník" : rows.length < 5 ? "účastníci" : "účastníkov"})</span>
        </h3>
        <button class="secondary print-attendance-btn" type="button">🖨️ Prezenčná listina</button>
      </div>
      <table>
        <thead>
          <tr>
            <th>Kód</th><th>Meno</th><th>Email</th><th>Telefón</th>
            <th>Vstup.</th><th>Výst.</th><th>Stav</th><th>Prišiel</th><th></th>
          </tr>
        </thead>
        <tbody></tbody>
      </table>
    `;

    groupWrap.querySelector(".print-attendance-btn").addEventListener("click", () => {
      printAttendanceSheet(term, rows);
    });

    const tbody = groupWrap.querySelector("tbody");
    rows.forEach((r) => {
      const tr = document.createElement("tr");
      tr.className = rowClass(r);
      const statusLabel = r.status === "cancelled" ? "zrušená" : r.status === "waitlist" ? "náhradník" : "potvrdená";
      tr.innerHTML = `
        <td><strong>${r.code}</strong></td>
        <td>${r.fullName}</td>
        <td>${r.email}</td>
        <td>${r.phone}</td>
        <td>${r.entryScore != null ? r.entryScore + "/8" : "–"}</td>
        <td>${r.exitScore != null ? r.exitScore + "/8" : "–"}</td>
        <td><span class="badge-pill ${r.status === "cancelled" ? "pending" : "ok"}">${statusLabel}</span></td>
        <td><input type="checkbox" class="attended-check" ${r.attended ? "checked" : ""} /></td>
        <td><button type="button" class="secondary detail-toggle-btn">🔍 Detaily</button></td>
      `;

      tr.querySelector(".attended-check").addEventListener("change", async (e) => {
        await updateDoc(doc(db, "registrations", r.code), { attended: e.target.checked });
        r.attended = e.target.checked;
        await logAudit("attendance", r.code, { attended: e.target.checked });
      });

      tr.querySelector(".detail-toggle-btn").addEventListener("click", () => openDetailPanel(tr, r));

      tbody.appendChild(tr);
    });

    container.appendChild(groupWrap);
  });
}

function openDetailPanel(tr, r) {
  const existing = tr.nextElementSibling;
  if (existing && existing.classList.contains("detail-panel-row")) {
    existing.remove();
    return;
  }
  const panelRow = document.createElement("tr");
  panelRow.className = "detail-panel-row";
  const td = document.createElement("td");
  td.colSpan = 9;
  td.innerHTML = `
    <div class="card" style="margin:8px 0;">
      <p style="color:var(--muted); font-size:.85rem; margin-top:0;">
        <strong>Zdroj:</strong> ${r.survey?.source ?? "–"} &nbsp;·&nbsp;
        <strong>Zariadenia:</strong> ${(r.survey?.devices ?? []).join(", ") || "–"} &nbsp;·&nbsp;
        <strong>Skúsenosti AI:</strong> ${r.survey?.aiExperience ?? "–"} &nbsp;·&nbsp;
        <strong>Dôvod:</strong> ${r.survey?.reason ?? "–"}
      </p>
      <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(180px,1fr)); gap:0 16px;">
        <div><label>Meno</label><input type="text" id="edit-firstName" value="${r.firstName || ""}" /></div>
        <div><label>Priezvisko</label><input type="text" id="edit-lastName" value="${r.lastName || ""}" /></div>
        <div><label>Mesto</label><input type="text" id="edit-city" value="${r.city || ""}" /></div>
        <div><label>Email</label><input type="email" id="edit-email" value="${r.email || ""}" /></div>
        <div><label>Telefón</label><input type="text" id="edit-phone" value="${r.phone || ""}" /></div>
      </div>
      <label>Poznámka (viditeľná len v admin zóne)</label>
      <textarea class="admin-notes" placeholder="Interná poznámka...">${r.adminNotes || ""}</textarea>
      <div class="actions">
        <button type="button" id="edit-save-btn">💾 Uložiť zmeny</button>
        <button type="button" class="secondary transfer-btn">🔁 Presunúť na iný termín</button>
        <button type="button" class="secondary cancel-btn">🚫 Zrušiť registráciu</button>
        <button type="button" class="danger delete-btn">🗑️ Natrvalo vymazať</button>
      </div>
    </div>
  `;
  panelRow.appendChild(td);
  tr.after(panelRow);

  let notesTimer;
  panelRow.querySelector(".admin-notes").addEventListener("input", (e) => {
    clearTimeout(notesTimer);
    const value = e.target.value;
    notesTimer = setTimeout(async () => {
      await updateDoc(doc(db, "registrations", r.code), { adminNotes: value });
      r.adminNotes = value;
      await logAudit("notes", r.code, { adminNotes: value });
    }, 600);
  });

  panelRow.querySelector("#edit-save-btn").addEventListener("click", async () => {
    const updated = {
      firstName: panelRow.querySelector("#edit-firstName").value.trim(),
      lastName: panelRow.querySelector("#edit-lastName").value.trim(),
      city: panelRow.querySelector("#edit-city").value.trim(),
      email: panelRow.querySelector("#edit-email").value.trim(),
      phone: panelRow.querySelector("#edit-phone").value.trim()
    };
    updated.fullName = `${updated.firstName} ${updated.lastName}`.trim();

    const diff = {};
    Object.keys(updated).forEach((k) => {
      if (updated[k] !== r[k]) diff[k] = { from: r[k], to: updated[k] };
    });

    await updateDoc(doc(db, "registrations", r.code), updated);
    Object.assign(r, updated);
    await logAudit("edit", r.code, diff);
    renderTable();
  });

  panelRow.querySelector(".transfer-btn").addEventListener("click", () => transferRegistration(r));
  panelRow.querySelector(".cancel-btn").addEventListener("click", () => cancelRegistration(r));
  panelRow.querySelector(".delete-btn").addEventListener("click", () => deleteRegistration(r));
}

async function cancelRegistration(r) {
  if (r.status === "cancelled") return;
  if (!confirm(`Naozaj chcete zrušiť registráciu účastníka ${r.fullName} (${r.code})?`)) return;

  await runTransaction(db, async (tx) => {
    const termRef = doc(db, "terms", r.termId);
    const termSnap = await tx.get(termRef);
    const regRef = doc(db, "registrations", r.code);

    if (termSnap.exists()) {
      const data = termSnap.data();
      if (r.status === "waitlist") {
        tx.update(termRef, { waitlistCount: Math.max(0, (data.waitlistCount || 0) - 1) });
      } else {
        tx.update(termRef, { booked: Math.max(0, (data.booked || 0) - 1) });
      }
    }
    tx.update(regRef, { status: "cancelled" });
  });

  r.status = "cancelled";
  await logAudit("cancel", r.code, {});
  await promoteFromWaitlistIfPossible(r.termId);
  await loadAll();
}

async function promoteFromWaitlistIfPossible(termId) {
  const term = terms.find((t) => t.id === termId);
  if (!term) return;
  if ((term.booked || 0) >= (term.capacity || 10)) return;
  const waitlisted = registrations
    .filter((r) => r.termId === termId && r.status === "waitlist")
    .sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
  if (waitlisted.length === 0) return;
  const promote = waitlisted[0];

  await runTransaction(db, async (tx) => {
    const termRef = doc(db, "terms", termId);
    const termSnap = await tx.get(termRef);
    const data = termSnap.data();
    tx.update(termRef, {
      booked: (data.booked || 0) + 1,
      waitlistCount: Math.max(0, (data.waitlistCount || 0) - 1)
    });
    tx.update(doc(db, "registrations", promote.code), { status: "confirmed" });
  });
  await logAudit("waitlist-promoted", promote.code, { termId });
}

async function transferRegistration(r) {
  const options = terms.filter((t) => t.id !== r.termId);
  if (options.length === 0) {
    alert("Nie sú dostupné žiadne iné termíny.");
    return;
  }
  const list = options.map((t, i) => `${i + 1}) ${formatDateTime(t.datetime)} (voľné: ${(t.capacity || 10) - (t.booked || 0)})`).join("\n");
  const choice = prompt(`Na ktorý termín chcete účastníka ${r.fullName} presunúť?\n\n${list}\n\nZadajte číslo:`);
  const idx = parseInt(choice, 10) - 1;
  if (isNaN(idx) || !options[idx]) return;
  const newTerm = options[idx];

  await runTransaction(db, async (tx) => {
    const oldTermRef = doc(db, "terms", r.termId);
    const newTermRef = doc(db, "terms", newTerm.id);
    const oldSnap = await tx.get(oldTermRef);
    const newSnap = await tx.get(newTermRef);
    const oldData = oldSnap.exists() ? oldSnap.data() : {};
    const newData = newSnap.exists() ? newSnap.data() : {};

    if (oldSnap.exists()) {
      if (r.status === "waitlist") {
        tx.update(oldTermRef, { waitlistCount: Math.max(0, (oldData.waitlistCount || 0) - 1) });
      } else {
        tx.update(oldTermRef, { booked: Math.max(0, (oldData.booked || 0) - 1) });
      }
    }

    const newBooked = newData.booked || 0;
    const newCapacity = newData.capacity || 10;
    let newStatus;
    if (newBooked < newCapacity) {
      newStatus = "confirmed";
      tx.update(newTermRef, { booked: newBooked + 1 });
    } else {
      newStatus = "waitlist";
      tx.update(newTermRef, { waitlistCount: (newData.waitlistCount || 0) + 1 });
    }

    tx.update(doc(db, "registrations", r.code), { termId: newTerm.id, status: newStatus });
  });

  await logAudit("transfer", r.code, { from: r.termId, to: newTerm.id });
  await promoteFromWaitlistIfPossible(r.termId);
  await loadAll();
}

async function deleteRegistration(r) {
  if (!confirm(`Naozaj chcete NATRVALO vymazať registráciu ${r.fullName} (${r.code})? Táto akcia sa nedá vrátiť späť.`)) return;

  await runTransaction(db, async (tx) => {
    const termRef = doc(db, "terms", r.termId);
    const termSnap = await tx.get(termRef);
    if (termSnap.exists() && r.status !== "cancelled") {
      const data = termSnap.data();
      if (r.status === "waitlist") {
        tx.update(termRef, { waitlistCount: Math.max(0, (data.waitlistCount || 0) - 1) });
      } else {
        tx.update(termRef, { booked: Math.max(0, (data.booked || 0) - 1) });
      }
    }
    tx.delete(doc(db, "registrations", r.code));
  });

  await logAudit("delete", r.code, { snapshot: { fullName: r.fullName, email: r.email, termId: r.termId } });
  await promoteFromWaitlistIfPossible(r.termId);
  await loadAll();
}

function printAttendanceSheet(term, rows) {
  const title = term ? formatDateTime(term.datetime) : "Workshop";
  const area = document.getElementById("attendancePrintArea");
  area.innerHTML = `
    <h1>Prezenčná listina – Workshop „Ako sa nenechať oklamať: AI ako pomocník pri finančných rozhodnutiach“</h1>
    <p>Termín: ${title}</p>
    <table>
      <thead><tr><th>#</th><th>Meno a priezvisko</th><th>Mesto</th><th>Kód</th><th>Podpis</th></tr></thead>
      <tbody>
        ${rows.map((r, i) => `<tr><td>${i + 1}</td><td>${r.fullName}</td><td>${r.city}</td><td>${r.code}</td><td></td></tr>`).join("")}
      </tbody>
    </table>
  `;

  const landscapeStyle = document.createElement("style");
  landscapeStyle.id = "landscapePrintStyle";
  landscapeStyle.textContent = "@page { size: landscape; }";
  document.head.appendChild(landscapeStyle);
  document.body.classList.add("printing-attendance");

  window.print();

  document.body.classList.remove("printing-attendance");
  landscapeStyle.remove();
}

document.getElementById("searchInput").addEventListener("input", renderTable);
document.getElementById("termFilter").addEventListener("change", renderTable);
document.getElementById("exportCsvBtn").addEventListener("click", () => exportRegistrationsCSV(registrations, terms));

// ---------- RESULTS TAB ----------
function renderResultsTable() {
  const container = document.getElementById("resultsTableContainer");
  const rows = registrations.filter((r) => r.entryScore != null || r.exitScore != null);

  if (rows.length === 0) {
    container.innerHTML = "<p style='color:var(--muted)'>Zatiaľ žiadne vyplnené kvízy.</p>";
    return;
  }

  const table = document.createElement("table");
  table.innerHTML = `
    <thead><tr><th>Kód</th><th>Meno</th><th>Vstupný kvíz</th><th>Výstupný kvíz</th><th>Zmena</th></tr></thead>
    <tbody></tbody>
  `;
  const tbody = table.querySelector("tbody");
  rows.forEach((r) => {
    const entry = r.entryScore != null ? r.entryScore : null;
    const exit = r.exitScore != null ? r.exitScore : null;
    const entryPct = entry != null ? Math.round((entry / 8) * 100) : null;
    const exitPct = exit != null ? Math.round((exit / 8) * 100) : null;
    let diffText = "–";
    let diffColor = "";
    if (entry != null && exit != null) {
      const diff = exit - entry;
      diffColor = diff > 0 ? "#106c53" : diff < 0 ? "#9c1c1f" : "#93650a";
      diffText = diff > 0 ? `+${diff}` : `${diff}`;
    }
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><strong>${r.code}</strong></td>
      <td>${r.fullName}</td>
      <td>${entry != null ? `${entry}/8 (${entryPct} %)` : "–"}</td>
      <td>${exit != null ? `${exit}/8 (${exitPct} %)` : "–"}</td>
      <td style="font-weight:700; color:${diffColor || "inherit"};">${diffText}</td>
    `;
    tbody.appendChild(tr);
  });
  container.innerHTML = "";
  container.appendChild(table);
}

document.getElementById("exportResultsCsvBtn").addEventListener("click", () => exportResultsCSV(registrations));

// ---------- STATS ----------
let scoreChartInstance, capacityChartInstance, aiExpChartInstance, sourceChartInstance, digitalSkillChartInstance, reasonChartInstance;

function renderStats() {
  const total = registrations.length;
  const entryDone = registrations.filter((r) => r.entryQuizDone).length;
  const exitDone = registrations.filter((r) => r.exitQuizDone).length;
  const capacityTotal = terms.reduce((acc, t) => acc + (t.capacity || 10), 0);
  const capacityBooked = terms.reduce((acc, t) => acc + (t.booked || 0), 0);

  document.getElementById("statBoxes").innerHTML = `
    <div class="stat-box"><div class="num">${total}</div><div class="lbl">Prihlásených</div></div>
    <div class="stat-box"><div class="num">${capacityBooked}/${capacityTotal || 50}</div><div class="lbl">Obsadenosť termínov</div></div>
    <div class="stat-box"><div class="num">${entryDone}</div><div class="lbl">Vstupný kvíz hotový</div></div>
    <div class="stat-box"><div class="num">${exitDone}</div><div class="lbl">Výstupný kvíz hotový</div></div>
  `;

  const entryScores = registrations.filter((r) => r.entryScore != null).map((r) => r.entryScore);
  const exitScores = registrations.filter((r) => r.exitScore != null).map((r) => r.exitScore);
  const avg = (arr) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0);

  scoreChartInstance?.destroy();
  scoreChartInstance = new Chart(document.getElementById("scoreChart"), {
    type: "bar",
    data: {
      labels: ["Vstupný kvíz", "Výstupný kvíz"],
      datasets: [{ label: "Priemerné skóre (z 8)", data: [avg(entryScores), avg(exitScores)], backgroundColor: ["#3d5afe", "#00c2a8"] }]
    },
    options: { scales: { y: { beginAtZero: true, max: 8 } } }
  });

  capacityChartInstance?.destroy();
  capacityChartInstance = new Chart(document.getElementById("capacityChart"), {
    type: "bar",
    data: {
      labels: terms.map((t) => formatDateTime(t.datetime)),
      datasets: [
        { label: "Obsadené", data: terms.map((t) => t.booked || 0), backgroundColor: "#3d5afe" },
        { label: "Voľné", data: terms.map((t) => Math.max(0, (t.capacity || 10) - (t.booked || 0))), backgroundColor: "#e3e7f0" }
      ]
    },
    options: { scales: { x: { stacked: true }, y: { stacked: true, beginAtZero: true } } }
  });

  const countBy = (key) => {
    const map = {};
    registrations.forEach((r) => {
      const v = r.survey?.[key];
      if (Array.isArray(v)) {
        v.forEach((x) => (map[x] = (map[x] || 0) + 1));
      } else if (v) {
        map[v] = (map[v] || 0) + 1;
      }
    });
    return map;
  };

  const pieOptions = { responsive: false, maintainAspectRatio: true, plugins: { legend: { position: "bottom", labels: { boxWidth: 10, font: { size: 9 } } } } };
  const pieColors = ["#3d5afe", "#00c2a8", "#f5a623", "#e5484d", "#8b9dff", "#6be7c4"];

  const aiExpMap = countBy("aiExperience");
  aiExpChartInstance?.destroy();
  aiExpChartInstance = new Chart(document.getElementById("aiExpChart"), {
    type: "pie",
    data: { labels: Object.keys(aiExpMap), datasets: [{ data: Object.values(aiExpMap), backgroundColor: pieColors }] },
    options: pieOptions
  });

  const sourceMap = countBy("source");
  sourceChartInstance?.destroy();
  sourceChartInstance = new Chart(document.getElementById("sourceChart"), {
    type: "pie",
    data: { labels: Object.keys(sourceMap), datasets: [{ data: Object.values(sourceMap), backgroundColor: pieColors }] },
    options: pieOptions
  });

  const digitalSkillMap = countBy("digitalSkill");
  digitalSkillChartInstance?.destroy();
  digitalSkillChartInstance = new Chart(document.getElementById("digitalSkillChart"), {
    type: "pie",
    data: { labels: Object.keys(digitalSkillMap), datasets: [{ data: Object.values(digitalSkillMap), backgroundColor: pieColors }] },
    options: pieOptions
  });

  const reasonMap = countBy("reason");
  reasonChartInstance?.destroy();
  reasonChartInstance = new Chart(document.getElementById("reasonChart"), {
    type: "pie",
    data: { labels: Object.keys(reasonMap), datasets: [{ data: Object.values(reasonMap), backgroundColor: pieColors }] },
    options: pieOptions
  });
}

// ---------- QUESTION EDITOR ----------
let questionSets = { entry: null, exit: null };
let activeQSet = "entry";

async function loadQuestionsIntoEditor() {
  const [entrySnap, exitSnap] = await Promise.all([
    getDoc(doc(db, "quizQuestions", "entry")),
    getDoc(doc(db, "quizQuestions", "exit"))
  ]);
  questionSets.entry = entrySnap.exists() && Array.isArray(entrySnap.data().questions)
    ? entrySnap.data().questions
    : JSON.parse(JSON.stringify(ENTRY_QUIZ));
  questionSets.exit = exitSnap.exists() && Array.isArray(exitSnap.data().questions)
    ? exitSnap.data().questions
    : JSON.parse(JSON.stringify(EXIT_QUIZ));
  renderQuestionsEditor();
}

document.querySelectorAll("[data-qset]").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll("[data-qset]").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    activeQSet = btn.dataset.qset;
    renderQuestionsEditor();
  });
});

function renderQuestionsEditor() {
  const editor = document.getElementById("questionsEditor");
  const questions = questionSets[activeQSet] || [];
  editor.innerHTML = "";

  questions.forEach((q, qi) => {
    const wrap = document.createElement("fieldset");
    wrap.innerHTML = `<legend>Otázka ${qi + 1}</legend>`;

    const qLabel = document.createElement("label");
    qLabel.textContent = "Znenie otázky";
    const qInput = document.createElement("textarea");
    qInput.rows = 2;
    qInput.value = q.q;
    qInput.addEventListener("input", () => (questionSets[activeQSet][qi].q = qInput.value));
    wrap.appendChild(qLabel);
    wrap.appendChild(qInput);

    q.options.forEach((opt, oi) => {
      const optLabel = document.createElement("label");
      optLabel.style.fontWeight = "400";
      optLabel.innerHTML = `Možnosť ${oi + 1} ${oi === q.correct ? '<span class="badge-pill ok">správna</span>' : ""}`;
      const row = document.createElement("div");
      row.style.display = "flex";
      row.style.gap = "8px";
      row.style.alignItems = "center";

      const optInput = document.createElement("input");
      optInput.type = "text";
      optInput.value = opt;
      optInput.addEventListener("input", () => (questionSets[activeQSet][qi].options[oi] = optInput.value));

      const correctBtn = document.createElement("button");
      correctBtn.type = "button";
      correctBtn.textContent = "Označiť ako správnu";
      correctBtn.className = "secondary";
      correctBtn.style.whiteSpace = "nowrap";
      correctBtn.addEventListener("click", () => {
        questionSets[activeQSet][qi].correct = oi;
        renderQuestionsEditor();
      });

      row.appendChild(optInput);
      row.appendChild(correctBtn);
      wrap.appendChild(optLabel);
      wrap.appendChild(row);
    });

    editor.appendChild(wrap);
  });
}

document.getElementById("saveQuestionsBtn").addEventListener("click", async () => {
  await setDoc(doc(db, "quizQuestions", "entry"), { questions: questionSets.entry });
  await setDoc(doc(db, "quizQuestions", "exit"), { questions: questionSets.exit });
  document.getElementById("questionsSaveMsg").style.display = "block";
  setTimeout(() => (document.getElementById("questionsSaveMsg").style.display = "none"), 3000);
});

// ---------- EMAIL TEMPLATE ----------
const DEFAULT_EMAIL_TEMPLATE = {
  subject: "Potvrdenie registrácie – Workshop AI a financie",
  body: "Dobrý deň {{meno}},\n\nďakujeme za registráciu na workshop „Ako sa nenechať oklamať: AI ako pomocník pri finančných rozhodnutiach“.\n\nVáš termín: {{termin}}\nVáš prihlasovací kód (uschovajte si ho): {{kod}}\n\nTešíme sa na Vás!"
};

async function loadEmailTemplate() {
  const snap = await getDoc(doc(db, "settings", "emailTemplate"));
  const data = snap.exists() ? snap.data() : DEFAULT_EMAIL_TEMPLATE;
  document.getElementById("emailSubjectInput").value = data.subject || DEFAULT_EMAIL_TEMPLATE.subject;
  document.getElementById("emailBodyInput").value = data.body || DEFAULT_EMAIL_TEMPLATE.body;
}

document.getElementById("saveEmailBtn").addEventListener("click", async () => {
  await setDoc(doc(db, "settings", "emailTemplate"), {
    subject: document.getElementById("emailSubjectInput").value,
    body: document.getElementById("emailBodyInput").value
  });
  document.getElementById("emailSaveMsg").style.display = "block";
  setTimeout(() => (document.getElementById("emailSaveMsg").style.display = "none"), 3000);
});

// ---------- LANDING PAGE CONTENT ----------
async function loadLandingContent() {
  const snap = await getDoc(doc(db, "settings", "landingPage"));
  const data = snap.exists() ? snap.data() : {};
  document.getElementById("heroTitleInput").value = data.title || "";
  document.getElementById("heroSubtitleInput").value = data.subtitle || "";
  document.getElementById("heroPromoInput").value = data.promo || "";
}

document.getElementById("saveLandingBtn").addEventListener("click", async () => {
  await setDoc(doc(db, "settings", "landingPage"), {
    title: document.getElementById("heroTitleInput").value,
    subtitle: document.getElementById("heroSubtitleInput").value,
    promo: document.getElementById("heroPromoInput").value
  });
  document.getElementById("landingSaveMsg").style.display = "block";
  setTimeout(() => (document.getElementById("landingSaveMsg").style.display = "none"), 3000);
});

// ---------- AUDIT LOG ----------
async function loadAuditLog() {
  const snap = await getDocs(collection(db, "auditLog"));
  const entries = snap.docs.map((d) => d.data()).sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
  const container = document.getElementById("auditLogContainer");

  if (entries.length === 0) {
    container.innerHTML = "<p style='color:var(--muted)'>Zatiaľ žiadne zaznamenané zmeny.</p>";
    return;
  }

  const table = document.createElement("table");
  table.innerHTML = `
    <thead><tr><th>Kedy</th><th>Admin</th><th>Akcia</th><th>Kód účastníka</th><th>Detail</th></tr></thead>
    <tbody>
      ${entries.slice(0, 300).map((e) => `
        <tr>
          <td>${e.timestamp ? new Date(e.timestamp).toLocaleString("sk-SK") : ""}</td>
          <td>${e.adminEmail || ""}</td>
          <td>${e.action || ""}</td>
          <td>${e.code || ""}</td>
          <td><code style="font-size:.75rem;">${JSON.stringify(e.details || {})}</code></td>
        </tr>
      `).join("")}
    </tbody>
  `;
  container.innerHTML = "";
  container.appendChild(table);
}
