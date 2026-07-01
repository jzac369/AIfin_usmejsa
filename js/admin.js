import { firebaseConfig } from "./firebase-config.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  getFirestore, collection, getDocs, doc, setDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { formatDateTime, exportRegistrationsCSV, applyStoredTheme, toggleTheme } from "./util.js";

applyStoredTheme();
document.getElementById("themeBtn").addEventListener("click", toggleTheme);

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const TERM_COUNT = 5;
let terms = [];
let registrations = [];

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
document.querySelectorAll(".tabs button").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tabs button").forEach((b) => b.classList.remove("active"));
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

  renderTermsEditor();
  renderTermFilter();
  renderTable();
  renderStats();
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
    wrap.style.marginBottom = "12px";
    wrap.innerHTML = `
      <label>Termín ${i + 1} (kapacita: 10 osôb${existing ? ", obsadené: " + (existing.booked || 0) : ""})</label>
      <input type="datetime-local" id="termInput${i}" value="${localValue}" />
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
    await setDoc(
      doc(db, "terms", id),
      {
        datetime: new Date(val).toISOString(),
        capacity: 10,
        booked: existing?.booked || 0,
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
  sel.innerHTML = '<option value="">Všetky termíny</option>';
  terms.forEach((t) => {
    const opt = document.createElement("option");
    opt.value = t.id;
    opt.textContent = formatDateTime(t.datetime);
    sel.appendChild(opt);
  });
}

function renderTable() {
  const tbody = document.getElementById("regTableBody");
  const search = document.getElementById("searchInput").value.toLowerCase();
  const termFilter = document.getElementById("termFilter").value;
  const termMap = Object.fromEntries(terms.map((t) => [t.id, t]));

  tbody.innerHTML = "";
  registrations
    .filter((r) => !termFilter || r.termId === termFilter)
    .filter((r) => {
      if (!search) return true;
      return [r.fullName, r.city, r.email, r.code].some((v) => (v || "").toLowerCase().includes(search));
    })
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
    .forEach((r) => {
      const term = termMap[r.termId];
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td><strong>${r.code}</strong></td>
        <td>${r.fullName}</td>
        <td>${r.city}</td>
        <td>${r.email}</td>
        <td>${r.phone}</td>
        <td>${term ? formatDateTime(term.datetime) : r.termId}</td>
        <td>${r.survey?.source ?? ""}</td>
        <td>${(r.survey?.devices ?? []).join(", ")}</td>
        <td>${r.survey?.aiExperience ?? ""}</td>
        <td>${r.survey?.reason ?? ""}</td>
        <td>${r.entryScore != null ? r.entryScore + "/8" : "–"}</td>
        <td>${r.exitScore != null ? r.exitScore + "/8" : "–"}</td>
        <td><span class="badge-pill ${r.entryQuizDone && r.exitQuizDone ? "ok" : "pending"}">${r.entryQuizDone && r.exitQuizDone ? "dokončené" : "prebieha"}</span></td>
      `;
      tbody.appendChild(tr);
    });
}

document.getElementById("searchInput").addEventListener("input", renderTable);
document.getElementById("termFilter").addEventListener("change", renderTable);
document.getElementById("exportCsvBtn").addEventListener("click", () => exportRegistrationsCSV(registrations, terms));

// ---------- STATS ----------
let scoreChartInstance, capacityChartInstance, aiExpChartInstance, sourceChartInstance;

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

  const aiExpMap = countBy("aiExperience");
  aiExpChartInstance?.destroy();
  aiExpChartInstance = new Chart(document.getElementById("aiExpChart"), {
    type: "pie",
    data: {
      labels: Object.keys(aiExpMap),
      datasets: [{ data: Object.values(aiExpMap), backgroundColor: ["#3d5afe", "#00c2a8", "#f5a623", "#e5484d"] }]
    }
  });

  const sourceMap = countBy("source");
  sourceChartInstance?.destroy();
  sourceChartInstance = new Chart(document.getElementById("sourceChart"), {
    type: "pie",
    data: {
      labels: Object.keys(sourceMap),
      datasets: [{ data: Object.values(sourceMap), backgroundColor: ["#3d5afe", "#00c2a8", "#f5a623", "#e5484d", "#8b9dff", "#6be7c4"] }]
    }
  });
}
