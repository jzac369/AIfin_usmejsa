import { firebaseConfig } from "./firebase-config.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged,
  setPersistence, browserLocalPersistence, browserSessionPersistence
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  getFirestore, collection, getDocs, doc, setDoc, getDoc, updateDoc, deleteDoc, runTransaction, addDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { formatDateTime, exportRegistrationsCSV, exportResultsCSV, generateCode } from "./util.js";
import { ENTRY_QUIZ, EXIT_QUIZ } from "./questions.js";
import { initEmailjs, sendConfirmationEmail } from "./email.js";

initEmailjs();

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

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
  const remember = document.getElementById("rememberLoginCheck").checked;
  try {
    await setPersistence(auth, remember ? browserLocalPersistence : browserSessionPersistence);
    await signInWithEmailAndPassword(auth, email, pass);
    await logAudit("admin-login", "", { email });
  } catch (err) {
    errBox.textContent = "Nesprávny email alebo heslo.";
    errBox.style.display = "block";
  }
});

document.getElementById("logoutLink").addEventListener("click", async (e) => {
  e.preventDefault();
  await logAudit("admin-logout", "", { email: currentAdminEmail() });
  signOut(auth);
});

document.getElementById("reportBugLink").addEventListener("click", async (e) => {
  e.preventDefault();
  const description = prompt("Popíšte prosím chybu, ktorú ste našli:");
  if (!description || !description.trim()) return;
  await logAudit("bug-report", "", { description: description.trim() });
  alert("Ďakujeme, chyba bola zaznamenaná do logu.");
  if (document.getElementById("tab-log").style.display !== "none") await loadAuditLog();
});

onAuthStateChanged(auth, (user) => {
  const loginContainer = document.getElementById("loginContainer");
  const dashboard = document.getElementById("dashboard");
  const siteFooter = document.getElementById("siteFooter");
  if (user) {
    loginContainer.style.display = "none";
    siteFooter.style.display = "none";
    dashboard.style.display = "flex";
    loadAll();
  } else {
    loginContainer.style.display = "block";
    siteFooter.style.display = "block";
    dashboard.style.display = "none";
  }
});

// ---------- NAVIGATION (sidebar) ----------
document.querySelectorAll(".admin-nav-item").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".admin-nav-item").forEach((b) => b.classList.remove("active"));
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
  terms = termsSnap.docs.map((d) => ({ id: d.id, ...d.data() })).sort((a, b) => new Date(a.datetime || 0) - new Date(b.datetime || 0));
  registrations = regsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

  updateRegistrationStatusIndicator();
  await renderAlerts();
  renderTermsEditor();
  await loadQuizRestrictionSetting();
  renderTermFilter();
  renderTable();
  await renderStats();
  renderResultsTable();
  await loadQuestionsIntoEditor();
  await loadEmailTemplate();
  await loadLandingContent();
  await loadWorkshopDetails();
  await loadMaterials();
  await loadAuditLog();
}

// ---------- REGISTRATION STATUS INDICATOR ----------
function updateRegistrationStatusIndicator() {
  const anyOpen = terms.some((t) => t.visibleInCalendar !== false);
  const dot = document.getElementById("regStatusDot");
  const text = document.getElementById("regStatusText");
  dot.classList.toggle("active", anyOpen);
  dot.classList.toggle("inactive", !anyOpen);
  text.textContent = anyOpen ? "Registrácia aktívna" : "Registrácia uzavretá";
}

// ---------- ALERTS ----------
let alertRotationTimer = null;

async function renderAlerts() {
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

  const { todayViews, monthViews } = await loadPageViewStats();
  alerts.push({ urgent: false, text: `📊 Registračnú stránku si dnes pozrelo ${todayViews} ľudí (tento mesiac ${monthViews}).` });

  clearInterval(alertRotationTimer);
  alertRotationTimer = null;

  if (alerts.length === 0) {
    panel.innerHTML = "";
    return;
  }

  panel.innerHTML = `<div class="alert-box alert-rotator"></div>`;
  const box = panel.querySelector(".alert-rotator");
  let idx = 0;
  const showAlert = (i) => {
    box.classList.toggle("urgent", alerts[i].urgent);
    box.textContent = alerts[i].text;
  };
  showAlert(idx);

  if (alerts.length > 1) {
    alertRotationTimer = setInterval(() => {
      box.style.opacity = "0";
      setTimeout(() => {
        idx = (idx + 1) % alerts.length;
        showAlert(idx);
        box.style.opacity = "1";
      }, 350);
    }, 10000);
  }
}

// ---------- TERMS EDITOR ----------
let editableTerms = [];

function renderTermsEditor() {
  editableTerms = terms.map((t) => ({ id: t.id, booked: t.booked || 0, waitlistCount: t.waitlistCount || 0 }));
  renderTermsEditorList();
}

function renderTermsEditorList() {
  const editor = document.getElementById("termsEditor");
  editor.innerHTML = "";
  editableTerms.forEach((t, i) => {
    const full = terms.find((x) => x.id === t.id);
    const localValue = full?.datetime ? toLocalInputValue(full.datetime) : "";
    const visible = full ? full.visibleInCalendar !== false : true;
    const wrap = document.createElement("div");
    wrap.className = "card";
    wrap.style.background = "rgba(255,255,255,.02)";
    wrap.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <label style="margin:0; font-size:.85rem;">${t.id ? `Termín (obsadené: ${t.booked}/10)` : "Nový termín"}</label>
        <button type="button" class="danger delete-term-btn" style="padding:3px 8px; font-size:.72rem;">Vymazať</button>
      </div>
      <input type="datetime-local" id="termInput${i}" value="${localValue}" />
      <div style="display:flex; gap:10px; align-items:flex-end; flex-wrap:wrap; margin-top:6px;">
        <div style="flex:1; min-width:120px;">
          <label style="margin:0 0 4px;">Náhradníci (čakacia listina)</label>
          <input type="number" min="0" id="waitlistInput${i}" value="${full?.waitlistCapacity || 0}" />
        </div>
        ${t.id ? `<p style="color:var(--muted); font-size:.74rem; margin:0 0 8px;">Na čak. listine: ${t.waitlistCount}/${full?.waitlistCapacity || 0}</p>` : ""}
      </div>
      <label class="switch-row" style="font-weight:400; margin-top:8px; font-size:.82rem;">
        <span class="switch"><input type="checkbox" id="visibleInput${i}" ${visible ? "checked" : ""} /><span class="slider"></span></span>
        Viditeľný v kalendári
      </label>
    `;
    wrap.querySelector(".delete-term-btn").addEventListener("click", () => deleteTerm(i));
    editor.appendChild(wrap);
  });
}

async function deleteTerm(index) {
  const t = editableTerms[index];
  if (t.id) {
    const hasActive = registrations.some((r) => r.termId === t.id && r.status !== "cancelled");
    if (hasActive) {
      alert("Tento termín nie je možné vymazať, pretože sú naň naviazaní účastníci. Najprv ich presuňte na iný termín alebo zrušte ich registráciu.");
      return;
    }
    if (!confirm("Naozaj chcete natrvalo vymazať tento termín?")) return;
    await deleteDoc(doc(db, "terms", t.id));
    await logAudit("term-delete", "", { termId: t.id });
    await loadAll();
    return;
  }
  editableTerms.splice(index, 1);
  renderTermsEditorList();
}

document.getElementById("addTermBtn").addEventListener("click", () => {
  editableTerms.push({ id: null, booked: 0, waitlistCount: 0 });
  renderTermsEditorList();
});

async function loadQuizRestrictionSetting() {
  const snap = await getDoc(doc(db, "settings", "quizRestriction"));
  const value = snap.exists() ? !!snap.data().restrictToWorkshopDay : false;
  const checkbox = document.getElementById("restrictQuizDayCheck");
  checkbox.checked = value;
  checkbox.dataset.prevValue = String(value);
}

function toLocalInputValue(iso) {
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

document.getElementById("saveTermsBtn").addEventListener("click", async () => {
  for (let i = 0; i < editableTerms.length; i++) {
    const t = editableTerms[i];
    const val = document.getElementById(`termInput${i}`).value;
    if (!val) continue;
    const waitlistCapacity = parseInt(document.getElementById(`waitlistInput${i}`).value, 10) || 0;
    const visibleInCalendar = document.getElementById(`visibleInput${i}`).checked;
    const payload = {
      datetime: new Date(val).toISOString(),
      capacity: 10,
      booked: t.booked,
      waitlistCapacity,
      waitlistCount: t.waitlistCount,
      visibleInCalendar
    };
    if (t.id) {
      await setDoc(doc(db, "terms", t.id), payload, { merge: true });
      await logAudit("term-update", "", { termId: t.id, datetime: payload.datetime, waitlistCapacity, visibleInCalendar });
    } else {
      const newTermRef = await addDoc(collection(db, "terms"), payload);
      await logAudit("term-create", "", { termId: newTermRef.id, datetime: payload.datetime, waitlistCapacity, visibleInCalendar });
    }
  }

  const prevRestriction = document.getElementById("restrictQuizDayCheck").dataset.prevValue === "true";
  const newRestriction = document.getElementById("restrictQuizDayCheck").checked;
  await setDoc(doc(db, "settings", "quizRestriction"), {
    restrictToWorkshopDay: newRestriction
  });
  if (prevRestriction !== newRestriction) {
    await logAudit("quiz-restriction-change", "", { restrictToWorkshopDay: newRestriction });
  }
  document.getElementById("restrictQuizDayCheck").dataset.prevValue = String(newRestriction);

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

  const newRegSel = document.getElementById("newRegTerm");
  newRegSel.innerHTML = "";
  terms.forEach((t) => {
    const remaining = (t.capacity || 10) - (t.booked || 0);
    const opt = document.createElement("option");
    opt.value = t.id;
    opt.textContent = `${formatDateTime(t.datetime)} (${remaining > 0 ? `voľné: ${remaining}` : "plno, náhradná listina"})`;
    newRegSel.appendChild(opt);
  });
}

// ---------- MANUAL REGISTRANT ----------
document.getElementById("addRegistrantBtn").addEventListener("click", () => {
  const form = document.getElementById("addRegistrantForm");
  form.style.display = form.style.display === "none" ? "block" : "none";
});
document.getElementById("cancelNewRegistrantBtn").addEventListener("click", () => {
  document.getElementById("addRegistrantForm").style.display = "none";
});

document.getElementById("submitNewRegistrantBtn").addEventListener("click", async () => {
  const errBox = document.getElementById("addRegistrantError");
  errBox.style.display = "none";

  const firstName = document.getElementById("newRegFirstName").value.trim();
  const lastName = document.getElementById("newRegLastName").value.trim();
  const city = document.getElementById("newRegCity").value.trim();
  const email = document.getElementById("newRegEmail").value.trim();
  const phone = document.getElementById("newRegPhone").value.trim();
  const termId = document.getElementById("newRegTerm").value;

  if (!firstName || !lastName || !city || !email || !phone || !termId) {
    errBox.textContent = "Prosím vyplňte všetky polia.";
    errBox.style.display = "block";
    return;
  }

  const fullName = `${firstName} ${lastName}`;
  const submitBtn = document.getElementById("submitNewRegistrantBtn");
  submitBtn.disabled = true;

  try {
    let finalCode = null;
    await runTransaction(db, async (tx) => {
      const termRef = doc(db, "terms", termId);
      const termSnap = await tx.get(termRef);
      if (!termSnap.exists()) throw new Error("Termín už neexistuje.");
      const data = termSnap.data();
      const booked = data.booked || 0;
      const capacity = data.capacity || 10;
      const waitlistCap = data.waitlistCapacity || 0;
      const waitlistCount = data.waitlistCount || 0;

      let status;
      if (booked < capacity) {
        status = "confirmed";
      } else if (waitlistCount < waitlistCap) {
        status = "waitlist";
      } else {
        throw new Error("Tento termín je plne obsadený aj s náhradnou listinou.");
      }

      let code, codeRef, codeSnap;
      for (let attempt = 0; attempt < 8; attempt++) {
        code = generateCode(5);
        codeRef = doc(db, "registrations", code);
        codeSnap = await tx.get(codeRef);
        if (!codeSnap.exists()) break;
        code = null;
      }
      if (!code) throw new Error("Nepodarilo sa vygenerovať kód, skúste to prosím znova.");

      if (status === "confirmed") {
        tx.update(termRef, { booked: booked + 1 });
      } else {
        tx.update(termRef, { waitlistCount: waitlistCount + 1 });
      }

      tx.set(codeRef, {
        code,
        firstName, lastName, fullName, city, email, phone,
        termId, status,
        attended: false,
        adminNotes: "Pridané ručne adminom.",
        survey: { source: "Pridané adminom", devices: [], aiExperience: "Pridané adminom", digitalSkill: "Pridané adminom", reason: "Pridané adminom" },
        entryQuizDone: false,
        exitQuizDone: false,
        entryScore: null,
        exitScore: null,
        entryAnswers: null,
        exitAnswers: null,
        feedback: null,
        createdAt: Date.now()
      });
      finalCode = code;
    });

    await logAudit("manual-add", finalCode, { fullName, email, termId });
    document.getElementById("addRegistrantForm").style.display = "none";
    ["newRegFirstName", "newRegLastName", "newRegCity", "newRegEmail", "newRegPhone"].forEach((id) => (document.getElementById(id).value = ""));
    alert(`Účastník bol pridaný. Jeho prihlasovací kód je: ${finalCode}`);
    await loadAll();
  } catch (err) {
    errBox.textContent = err.message || "Nastala chyba pri pridávaní účastníka.";
    errBox.style.display = "block";
  } finally {
    submitBtn.disabled = false;
  }
});

function quizBadgeHtml(r) {
  if (r.entryQuizDone && r.exitQuizDone) {
    return `<span class="badge-pill quiz-two">2 kvízy</span>`;
  }
  if (r.entryQuizDone || r.exitQuizDone) {
    return `<span class="badge-pill quiz-one">1 kvíz</span>`;
  }
  return "";
}

function renderTable() {
  const container = document.getElementById("regGroupsContainer");
  // Every full re-render rebuilds all rows from scratch, so any previously open
  // detail panel is gone - clear the dimming class or the whole table stays
  // dimmed/unclickable forever (it only gets set again once a panel reopens).
  container.classList.remove("has-open-detail");
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
    const ta = termMap[a]?.datetime ? new Date(termMap[a].datetime).getTime() : Infinity;
    const tb = termMap[b]?.datetime ? new Date(termMap[b].datetime).getTime() : Infinity;
    return ta - tb;
  });

  container.innerHTML = "";

  if (groupKeys.length === 0) {
    container.innerHTML = "<p style='color:var(--muted)'>Žiadni prihlásení účastníci nezodpovedajú filtru.</p>";
    return;
  }

  function fillRows(tbody, rowsList) {
    rowsList.forEach((r) => {
      const tr = document.createElement("tr");
      const statusLabel = r.status === "cancelled" ? "zrušená" : r.status === "waitlist" ? "náhradník" : "potvrdená";
      const statusBadgeClass = r.status === "cancelled" ? "status-cancelled" : r.status === "waitlist" ? "status-waitlist" : "status-confirmed";
      const warningIcon = r.blockedChangeAttempt
        ? ` <span title="Pokus o zmenu/zrušenie menej ako 48h pred workshopom bol zablokovaný">⚠️</span>`
        : "";
      tr.innerHTML = `
        <td data-label="Kód"><strong>${r.code}</strong></td>
        <td data-label="Meno">${r.fullName}</td>
        <td data-label="Email">${r.email}</td>
        <td data-label="Telefón">${r.phone}</td>
        <td data-label="Mesto">${r.city || ""}</td>
        <td data-label="Vstup.">${r.entryScore != null ? r.entryScore + "/" + (r.entryTotal || 8) : "–"}</td>
        <td data-label="Výst.">${r.exitScore != null ? r.exitScore + "/" + (r.exitTotal || 8) : "–"}</td>
        <td data-label="Stav"><div class="badge-row"><span class="badge-pill ${statusBadgeClass}">${statusLabel}</span>${quizBadgeHtml(r)}</div>${warningIcon}</td>
        <td data-label="Pozn." class="notes-cell" title="${(r.adminNotes || "").replace(/"/g, "&quot;")}">${r.adminNotes || ""}</td>
        <td data-label="Prišiel"><label class="switch"><input type="checkbox" class="attended-check" ${r.attended ? "checked" : ""} /><span class="slider"></span></label></td>
        <td data-label=""><button type="button" class="secondary detail-toggle-btn">Detaily</button></td>
      `;

      tr.querySelector(".attended-check").addEventListener("change", async (e) => {
        await updateDoc(doc(db, "registrations", r.code), { attended: e.target.checked });
        r.attended = e.target.checked;
        await logAudit("attendance", r.code, { attended: e.target.checked });
      });

      tr.querySelector(".detail-toggle-btn").addEventListener("click", () => openDetailPanel(tr, r));

      tbody.appendChild(tr);
    });
  }

  const tableHeadHtml = `
    <thead>
      <tr>
        <th>Kód</th><th>Meno</th><th>Email</th><th>Telefón</th><th>Mesto</th>
        <th>Vstup.</th><th>Výst.</th><th>Stav</th><th>Pozn.</th><th>Prišiel</th><th></th>
      </tr>
    </thead>
  `;

  groupKeys.forEach((key) => {
    const term = termMap[key];
    const allRows = groups[key].sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
    const mainRows = allRows.filter((r) => r.status !== "waitlist");
    const waitlistRows = allRows.filter((r) => r.status === "waitlist");

    const groupWrap = document.createElement("div");
    groupWrap.className = "term-group-box";
    groupWrap.innerHTML = `
      <div style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:8px; margin-bottom:12px;">
        <div class="term-date-chip">
          ${term ? formatDateTime(term.datetime) : "Bez priradeného termínu"}
          <span style="color:var(--muted); font-weight:400;">(${allRows.length} ${allRows.length === 1 ? "účastník" : allRows.length < 5 ? "účastníci" : "účastníkov"})</span>
        </div>
        <button class="btn-print print-attendance-btn" type="button">Prezenčná listina</button>
      </div>
      <table class="reg-table">${tableHeadHtml}<tbody class="main-rows-body"></tbody></table>
    `;

    groupWrap.querySelector(".print-attendance-btn").addEventListener("click", () => {
      printAttendanceSheet(term, allRows);
    });

    fillRows(groupWrap.querySelector(".main-rows-body"), mainRows);

    if (waitlistRows.length > 0) {
      const waitlistWrap = document.createElement("div");
      waitlistWrap.className = "waitlist-section";
      waitlistWrap.innerHTML = `
        <h4>🕒 Náhradníci – čakacia listina (${waitlistRows.length})</h4>
        <table class="reg-table">${tableHeadHtml}<tbody class="waitlist-rows-body"></tbody></table>
      `;
      fillRows(waitlistWrap.querySelector(".waitlist-rows-body"), waitlistRows);
      groupWrap.appendChild(waitlistWrap);
    }

    container.appendChild(groupWrap);
  });
}

function updateDetailDimming() {
  const container = document.getElementById("regGroupsContainer");
  const anyOpen = container.querySelector(".detail-panel-row") != null;
  container.classList.toggle("has-open-detail", anyOpen);
}

function openDetailPanel(tr, r) {
  const existing = tr.nextElementSibling;
  if (existing && existing.classList.contains("detail-panel-row")) {
    existing.remove();
    tr.classList.remove("detail-active");
    updateDetailDimming();
    return;
  }
  tr.classList.add("detail-active");
  const panelRow = document.createElement("tr");
  panelRow.className = "detail-panel-row";
  const td = document.createElement("td");
  td.colSpan = 11;
  td.innerHTML = `
    <div class="card" style="margin:8px 0;">
      <p style="color:var(--muted); font-size:.85rem; margin-top:0;">
        <strong>Zdroj:</strong> ${r.survey?.source ?? "–"} &nbsp;·&nbsp;
        <strong>Zariadenia:</strong> ${(r.survey?.devices ?? []).join(", ") || "–"} &nbsp;·&nbsp;
        <strong>Skúsenosti AI:</strong> ${r.survey?.aiExperience ?? "–"} &nbsp;·&nbsp;
        <strong>Dôvod:</strong> ${r.survey?.reason ?? "–"} &nbsp;·&nbsp;
        <strong>Finančná téma:</strong> ${r.survey?.financeTopic ?? "–"}
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
      <div id="resendEmailMsg" style="display:none; font-size:.82rem; margin-bottom:8px;"></div>
      <div class="actions">
        <button type="button" id="edit-save-btn">💾 Uložiť zmeny</button>
        <button type="button" class="secondary resend-email-btn">📧 Poslať potvrdzujúci email</button>
        <button type="button" class="secondary transfer-btn">🔁 Presunúť na iný termín</button>
        <button type="button" class="secondary cancel-btn">🚫 Zrušiť registráciu</button>
        <button type="button" class="danger delete-btn">🗑️ Natrvalo vymazať</button>
      </div>
      <div id="transferOptionsBox" style="display:none; margin-top:14px;"></div>
    </div>
  `;
  panelRow.appendChild(td);
  tr.after(panelRow);
  updateDetailDimming();

  panelRow.querySelector(".resend-email-btn").addEventListener("click", async (e) => {
    const btn = e.target;
    const msgBox = panelRow.querySelector("#resendEmailMsg");
    btn.disabled = true;
    const original = btn.textContent;
    btn.textContent = "Odosielam…";
    try {
      const term = terms.find((t) => t.id === r.termId);
      await sendConfirmationEmail(db, r, term);
      msgBox.textContent = `✅ Email bol odoslaný na ${r.email}.`;
      msgBox.style.color = "#106c53";
      msgBox.style.display = "block";
      await logAudit("email-resent", r.code, { email: r.email });
    } catch (err) {
      msgBox.textContent = `❌ ${err.message || "Odoslanie zlyhalo."}`;
      msgBox.style.color = "#9c1c1f";
      msgBox.style.display = "block";
    } finally {
      btn.disabled = false;
      btn.textContent = original;
    }
  });

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

  panelRow.querySelector(".transfer-btn").addEventListener("click", () => showTransferOptions(r, panelRow));
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

function showTransferOptions(r, panelRow) {
  const box = panelRow.querySelector("#transferOptionsBox");
  if (box.style.display !== "none") {
    box.style.display = "none";
    box.innerHTML = "";
    return;
  }

  const options = terms.filter((t) => t.id !== r.termId);
  if (options.length === 0) {
    box.innerHTML = `<p style="color:var(--muted); margin:0;">Nie sú dostupné žiadne iné termíny.</p>`;
    box.style.display = "block";
    return;
  }

  const sorted = [...options].sort((a, b) => new Date(a.datetime) - new Date(b.datetime));
  const cancelledWarning = r.status === "cancelled"
    ? `<p class="alert error">⚠️ Táto registrácia je zrušená. Presunutím na nový termín ju znova aktivujete (nastaví sa ako potvrdená alebo náhradník podľa voľnej kapacity).</p>`
    : "";
  box.innerHTML = `
    ${cancelledWarning}
    <label style="margin:0 0 8px;">Presunúť na termín</label>
    <div class="table-wrap"><table class="reg-table" style="min-width:0;">
      <thead><tr><th>Termín</th><th>Voľné miesta</th><th>Čakacia listina</th><th></th></tr></thead>
      <tbody>
        ${sorted.map((t) => {
          const freeConfirmed = (t.capacity || 10) - (t.booked || 0);
          const freeWaitlist = (t.waitlistCapacity || 0) - (t.waitlistCount || 0);
          const full = freeConfirmed <= 0 && freeWaitlist <= 0;
          return `
            <tr>
              <td data-label="Termín">${formatDateTime(t.datetime)}</td>
              <td data-label="Voľné miesta">${freeConfirmed > 0 ? freeConfirmed : "plno"}</td>
              <td data-label="Čakacia listina">${freeWaitlist > 0 ? `${freeWaitlist} voľných` : "plná"}</td>
              <td data-label=""><button type="button" class="secondary pick-term-btn" data-term-id="${t.id}" ${full ? "disabled" : ""}>${full ? "Plno" : "Presunúť sem"}</button></td>
            </tr>
          `;
        }).join("")}
      </tbody>
    </table></div>
  `;
  box.style.display = "block";

  box.querySelectorAll(".pick-term-btn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const newTerm = terms.find((t) => t.id === btn.dataset.termId);
      if (!newTerm) return;
      btn.disabled = true;
      btn.textContent = "Presúvam…";
      await performTransfer(r, newTerm);
    });
  });
}

async function performTransfer(r, newTerm) {
  await runTransaction(db, async (tx) => {
    const oldTermRef = doc(db, "terms", r.termId);
    const newTermRef = doc(db, "terms", newTerm.id);
    const oldSnap = await tx.get(oldTermRef);
    const newSnap = await tx.get(newTermRef);
    const oldData = oldSnap.exists() ? oldSnap.data() : {};
    const newData = newSnap.exists() ? newSnap.data() : {};

    // Zrušená registrácia už svoje miesto na starom termíne uvoľnila pri zrušení -
    // netreba (a nesmie sa) odpočítať znova, inak by kapacita termínu podišla.
    if (oldSnap.exists() && r.status !== "cancelled") {
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
    <table style="margin-top:32px; width:60%;">
      <thead><tr><th>Lektor – meno a priezvisko</th><th>Podpis lektora</th></tr></thead>
      <tbody>
        <tr><td style="height:40px;"></td><td style="height:40px;"></td></tr>
      </tbody>
    </table>
  `;

  const landscapeStyle = document.createElement("style");
  landscapeStyle.id = "landscapePrintStyle";
  landscapeStyle.textContent = `
    @page { size: landscape; margin: 12mm; }
    html, body.printing-attendance { height: auto !important; min-height: 0 !important; }
  `;
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
    const entryTotal = r.entryTotal || 8;
    const exitTotal = r.exitTotal || 8;
    const entry = r.entryScore != null ? r.entryScore : null;
    const exit = r.exitScore != null ? r.exitScore : null;
    const entryPct = entry != null ? Math.round((entry / entryTotal) * 100) : null;
    const exitPct = exit != null ? Math.round((exit / exitTotal) * 100) : null;
    let diffText = "–";
    let diffColor = "";
    if (entryPct != null && exitPct != null) {
      const diff = exitPct - entryPct;
      diffColor = diff > 0 ? "#106c53" : diff < 0 ? "#9c1c1f" : "#93650a";
      diffText = diff > 0 ? `+${diff} %` : `${diff} %`;
    }
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td data-label="Kód"><strong>${r.code}</strong></td>
      <td data-label="Meno">${r.fullName}</td>
      <td data-label="Vstupný kvíz">${entry != null ? `${entry}/${entryTotal} (${entryPct} %)` : "–"}</td>
      <td data-label="Výstupný kvíz">${exit != null ? `${exit}/${exitTotal} (${exitPct} %)` : "–"}</td>
      <td data-label="Zmena" style="font-weight:700; color:${diffColor || "inherit"};">${diffText}</td>
    `;
    tbody.appendChild(tr);
  });
  container.innerHTML = "";
  container.appendChild(table);
}

document.getElementById("exportResultsCsvBtn").addEventListener("click", () => exportResultsCSV(registrations));

// ---------- STATS ----------
let scoreChartInstance, capacityChartInstance, aiExpChartInstance, sourceChartInstance, digitalSkillChartInstance, reasonChartInstance, financeTopicChartInstance;

async function loadPageViewStats() {
  const snap = await getDocs(collection(db, "pageViews"));
  const today = new Date().toISOString().slice(0, 10);
  const thisMonth = today.slice(0, 7);
  let todayViews = 0;
  let monthViews = 0;
  snap.forEach((d) => {
    const views = d.data().views || 0;
    if (d.id === today) todayViews = views;
    if (d.id.startsWith(thisMonth)) monthViews += views;
  });
  return { todayViews, monthViews };
}

async function renderStats() {
  const total = registrations.length;
  const entryDone = registrations.filter((r) => r.entryQuizDone).length;
  const exitDone = registrations.filter((r) => r.exitQuizDone).length;
  const capacityTotal = terms.reduce((acc, t) => acc + (t.capacity || 10), 0);
  const capacityBooked = terms.reduce((acc, t) => acc + (t.booked || 0), 0);
  const { todayViews, monthViews } = await loadPageViewStats();

  document.getElementById("statBoxes").innerHTML = `
    <div class="stat-box"><div class="num">${total}</div><div class="lbl">Prihlásených</div></div>
    <div class="stat-box"><div class="num">${capacityBooked}/${capacityTotal || 50}</div><div class="lbl">Obsadenosť termínov</div></div>
    <div class="stat-box"><div class="num">${entryDone}</div><div class="lbl">Vstupný kvíz hotový</div></div>
    <div class="stat-box"><div class="num">${exitDone}</div><div class="lbl">Výstupný kvíz hotový</div></div>
    <div class="stat-box"><div class="num">${todayViews}</div><div class="lbl">Zobrazení stránky dnes</div></div>
    <div class="stat-box"><div class="num">${monthViews}</div><div class="lbl">Zobrazení stránky tento mesiac</div></div>
  `;

  const entryScores = registrations.filter((r) => r.entryScore != null).map((r) => r.entryScore);
  const exitScores = registrations.filter((r) => r.exitScore != null).map((r) => r.exitScore);
  const avg = (arr) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0);

  const pieOptions = { responsive: false, maintainAspectRatio: true, plugins: { legend: { position: "bottom", labels: { boxWidth: 10, font: { size: 9 } } } } };
  const pieColors = ["#3d5afe", "#00c2a8", "#f5a623", "#e5484d", "#8b9dff", "#6be7c4"];

  scoreChartInstance?.destroy();
  scoreChartInstance = new Chart(document.getElementById("scoreChart"), {
    type: "bar",
    data: {
      labels: ["Vstupný kvíz", "Výstupný kvíz"],
      datasets: [{ label: "Priemerné skóre (z 8)", data: [avg(entryScores), avg(exitScores)], backgroundColor: ["#3d5afe", "#00c2a8"] }]
    },
    options: { ...pieOptions, scales: { y: { beginAtZero: true, max: 8 } } }
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
    options: { ...pieOptions, scales: { x: { stacked: true, ticks: { font: { size: 8 } } }, y: { stacked: true, beginAtZero: true } } }
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

  const financeTopicMap = countBy("financeTopic");
  financeTopicChartInstance?.destroy();
  financeTopicChartInstance = new Chart(document.getElementById("financeTopicChart"), {
    type: "pie",
    data: { labels: Object.keys(financeTopicMap), datasets: [{ data: Object.values(financeTopicMap), backgroundColor: pieColors }] },
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
    const legend = document.createElement("legend");
    legend.textContent = `Otázka ${qi + 1}`;
    wrap.appendChild(legend);

    const deleteQBtn = document.createElement("button");
    deleteQBtn.type = "button";
    deleteQBtn.className = "danger";
    deleteQBtn.textContent = "🗑️ Vymazať túto otázku";
    deleteQBtn.style.marginBottom = "12px";
    deleteQBtn.addEventListener("click", () => {
      if (questionSets[activeQSet].length <= 1) {
        alert("Kvíz musí mať aspoň jednu otázku.");
        return;
      }
      if (!confirm(`Naozaj vymazať otázku ${qi + 1}?`)) return;
      questionSets[activeQSet].splice(qi, 1);
      renderQuestionsEditor();
    });
    wrap.appendChild(deleteQBtn);

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
      row.className = "option-edit-row";

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

  const addBtn = document.createElement("button");
  addBtn.type = "button";
  addBtn.className = "secondary";
  addBtn.textContent = "➕ Pridať novú otázku";
  addBtn.addEventListener("click", () => {
    questionSets[activeQSet].push({
      q: "Nová otázka – upravte znenie",
      options: ["Možnosť 1", "Možnosť 2", "Možnosť 3", "Možnosť 4"],
      correct: 0
    });
    renderQuestionsEditor();
  });
  editor.appendChild(addBtn);
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
  body: "<p>Dobrý deň {{meno}},</p><p>ďakujeme za registráciu na workshop „Ako sa nenechať oklamať: AI ako pomocník pri finančných rozhodnutiach“.</p><p>Váš termín: {{termin}}<br>Váš prihlasovací kód (uschovajte si ho): <strong>{{kod}}</strong></p><p>Tešíme sa na Vás!</p>"
};

async function loadEmailTemplate() {
  const snap = await getDoc(doc(db, "settings", "emailTemplate"));
  const data = snap.exists() ? snap.data() : DEFAULT_EMAIL_TEMPLATE;
  document.getElementById("emailSubjectInput").value = data.subject || DEFAULT_EMAIL_TEMPLATE.subject;
  document.getElementById("emailBodyInput").innerHTML = data.body || DEFAULT_EMAIL_TEMPLATE.body;
}

document.querySelectorAll(".rte-toolbar button").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.getElementById("emailBodyInput").focus();
    document.execCommand(btn.dataset.cmd, false, null);
  });
});

document.getElementById("saveEmailBtn").addEventListener("click", async () => {
  await setDoc(doc(db, "settings", "emailTemplate"), {
    subject: document.getElementById("emailSubjectInput").value,
    body: document.getElementById("emailBodyInput").innerHTML
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

// ---------- WORKSHOP DETAILS ----------
async function loadWorkshopDetails() {
  const snap = await getDoc(doc(db, "settings", "workshopDetails"));
  const data = snap.exists() ? snap.data() : {};
  document.getElementById("workshopTitleInput").value = data.title || "Ako sa nenechať oklamať: AI ako pomocník pri finančných rozhodnutiach";
  document.getElementById("workshopLocationInput").value = data.location || "";
  document.getElementById("workshopDurationInput").value = data.durationHours || 2.5;
  document.getElementById("workshopDescriptionInput").value = data.description || "";
}

document.getElementById("saveWorkshopDetailsBtn").addEventListener("click", async () => {
  await setDoc(doc(db, "settings", "workshopDetails"), {
    title: document.getElementById("workshopTitleInput").value,
    location: document.getElementById("workshopLocationInput").value,
    durationHours: parseFloat(document.getElementById("workshopDurationInput").value) || 2.5,
    description: document.getElementById("workshopDescriptionInput").value
  });
  document.getElementById("workshopDetailsSaveMsg").style.display = "block";
  setTimeout(() => (document.getElementById("workshopDetailsSaveMsg").style.display = "none"), 3000);
});

// ---------- MATERIALS ----------
const MAX_MATERIAL_BYTES = 700 * 1024;
let materials = [];

async function loadMaterials() {
  const snap = await getDocs(collection(db, "materials"));
  materials = snap.docs.map((d) => ({ id: d.id, ...d.data() })).sort((a, b) => (a.uploadedAt || 0) - (b.uploadedAt || 0));
  renderMaterialsList();
}

function renderMaterialsList() {
  const container = document.getElementById("materialsList");
  if (materials.length === 0) {
    container.innerHTML = "<p style='color:var(--muted)'>Zatiaľ žiadne nahraté materiály.</p>";
    return;
  }
  const table = document.createElement("table");
  table.innerHTML = `
    <thead><tr><th>Názov</th><th>Súbor</th><th>Veľkosť</th><th></th></tr></thead>
    <tbody>
      ${materials.map((m) => `
        <tr>
          <td data-label="Názov">${m.title}</td>
          <td data-label="Súbor">${m.filename || ""}</td>
          <td data-label="Veľkosť">${m.sizeBytes ? Math.round(m.sizeBytes / 1024) + " KB" : ""}</td>
          <td data-label=""><button type="button" class="danger remove-material-btn" data-id="${m.id}">🗑️ Vymazať</button></td>
        </tr>
      `).join("")}
    </tbody>
  `;
  table.querySelectorAll(".remove-material-btn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      if (!confirm("Naozaj vymazať tento materiál?")) return;
      await deleteDoc(doc(db, "materials", btn.dataset.id));
      await loadMaterials();
    });
  });
  container.innerHTML = "";
  container.appendChild(table);
}

document.getElementById("uploadMaterialBtn").addEventListener("click", async () => {
  const errBox = document.getElementById("materialsUploadError");
  errBox.style.display = "none";
  const title = document.getElementById("newMaterialTitle").value.trim();
  const fileInput = document.getElementById("newMaterialFile");
  const file = fileInput.files[0];

  if (!title || !file) {
    errBox.textContent = "Prosím vyplň názov a vyber súbor.";
    errBox.style.display = "block";
    return;
  }
  if (file.size > MAX_MATERIAL_BYTES) {
    errBox.textContent = `Súbor je príliš veľký (${Math.round(file.size / 1024)} KB). Maximálna veľkosť je cca ${Math.round(MAX_MATERIAL_BYTES / 1024)} KB kvôli bezplatnému plánu databázy.`;
    errBox.style.display = "block";
    return;
  }

  const uploadBtn = document.getElementById("uploadMaterialBtn");
  uploadBtn.disabled = true;
  try {
    const dataUrl = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    await addDoc(collection(db, "materials"), {
      title,
      filename: file.name,
      mimeType: file.type,
      sizeBytes: file.size,
      dataUrl,
      uploadedAt: Date.now()
    });

    document.getElementById("newMaterialTitle").value = "";
    fileInput.value = "";
    await loadMaterials();
  } catch {
    errBox.textContent = "Nahrávanie zlyhalo, skús to prosím znova.";
    errBox.style.display = "block";
  } finally {
    uploadBtn.disabled = false;
  }
});

// ---------- AUDIT LOG ----------
const FIELD_LABELS_SK = { firstName: "Meno", lastName: "Priezvisko", city: "Mesto", email: "Email", phone: "Telefón" };

function describeAuditEntry(e) {
  const d = e.details || {};
  const termMap = Object.fromEntries(terms.map((t) => [t.id, t]));
  const termLabel = (id) => (termMap[id] ? formatDateTime(termMap[id].datetime) : id || "–");

  switch (e.action) {
    case "edit": {
      const parts = Object.entries(d).map(([k, v]) => `${FIELD_LABELS_SK[k] || k}: „${v.from}“ → „${v.to}“`);
      return parts.length ? `Upravené údaje účastníka (${parts.join(", ")})` : "Upravené údaje účastníka (bez zmeny hodnôt)";
    }
    case "notes":
      return "Upravená interná poznámka o účastníkovi";
    case "attendance":
      return d.attended ? "Účastník označený ako prítomný na workshope" : "Zrušené označenie prítomnosti účastníka";
    case "cancel":
      return "Registrácia bola zrušená";
    case "transfer":
      return `Registrácia presunutá na iný termín: ${termLabel(d.from)} → ${termLabel(d.to)}`;
    case "delete":
      return `Registrácia natrvalo vymazaná (${d.snapshot?.fullName || "?"}, ${d.snapshot?.email || "?"})`;
    case "waitlist-promoted":
      return `Účastník presunutý z čakacej listiny na potvrdenú registráciu (termín ${termLabel(d.termId)})`;
    case "email-resent":
      return `Ručne odoslaný potvrdzujúci email na adresu ${d.email || "?"}`;
    case "term-delete":
      return `Termín workshopu bol natrvalo vymazaný`;
    case "term-create":
      return `Vytvorený nový termín workshopu (${formatDateTime(d.datetime)})`;
    case "term-update":
      return `Upravený termín workshopu (${formatDateTime(d.datetime)}, náhradníci: ${d.waitlistCapacity}, viditeľný: ${d.visibleInCalendar ? "áno" : "nie"})`;
    case "quiz-restriction-change":
      return `Zmenené nastavenie: kvíz ${d.restrictToWorkshopDay ? "obmedzený len na deň workshopu" : "dostupný kedykoľvek"}`;
    case "log-purge":
      return `Vymazané záznamy logu staršie ako ${d.beforeDate} (${d.count} záznamov)`;
    case "admin-login":
      return `Prihlásenie do admin zóny (${d.email || e.adminEmail || "?"})`;
    case "admin-logout":
      return `Odhlásenie z admin zóny (${d.email || e.adminEmail || "?"})`;
    case "bug-report":
      return `🐞 Nahlásená chyba: ${d.description || "?"}`;
    case "login":
      return "Účastník sa prihlásil do svojej zóny cez kód";
    case "quiz-completed":
      return `Účastník dokončil ${d.set === "entry" ? "vstupný" : "výstupný"} kvíz (${d.score}/${d.total})`;
    case "blocked-change-attempt":
      return `⚠️ Zablokovaný pokus o ${d.type === "cancel" ? "zrušenie" : "presun termínu"} menej ako 48 hodín pred workshopom`;
    default:
      return e.action || "Neznáma akcia";
  }
}

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
    <thead><tr><th>Kedy</th><th>Vykonal</th><th>Kód účastníka</th><th>Čo sa stalo</th></tr></thead>
    <tbody>
      ${entries.slice(0, 300).map((e) => `
        <tr${e.action === "blocked-change-attempt" ? ' style="background:rgba(229,72,77,.08);"' : ""}>
          <td data-label="Kedy">${e.timestamp ? new Date(e.timestamp).toLocaleString("sk-SK") : ""}</td>
          <td data-label="Vykonal">${e.adminEmail || "–"}</td>
          <td data-label="Kód">${e.code || "–"}</td>
          <td data-label="Čo sa stalo">${describeAuditEntry(e)}</td>
        </tr>
      `).join("")}
    </tbody>
  `;
  container.innerHTML = "";
  container.appendChild(table);
}

document.getElementById("refreshLogBtn").addEventListener("click", () => loadAuditLog());

document.getElementById("purgeLogBtn").addEventListener("click", async () => {
  const dateVal = document.getElementById("logPurgeDate").value;
  if (!dateVal) {
    alert("Najprv vyberte dátum.");
    return;
  }
  const cutoff = new Date(dateVal).getTime();
  const snap = await getDocs(collection(db, "auditLog"));
  const toDelete = snap.docs.filter((d) => (d.data().timestamp || 0) < cutoff);

  if (toDelete.length === 0) {
    alert("Žiadne záznamy staršie ako zvolený dátum sa nenašli.");
    return;
  }
  if (!confirm(`Naozaj natrvalo vymazať ${toDelete.length} záznamov logu starších ako ${dateVal}? Táto akcia sa nedá vrátiť späť.`)) return;

  const btn = document.getElementById("purgeLogBtn");
  btn.disabled = true;
  try {
    for (const d of toDelete) {
      await deleteDoc(doc(db, "auditLog", d.id));
    }
    await logAudit("log-purge", "", { beforeDate: dateVal, count: toDelete.length });
    await loadAuditLog();
  } finally {
    btn.disabled = false;
  }
});
