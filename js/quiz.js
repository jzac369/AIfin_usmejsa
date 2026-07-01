import { firebaseConfig } from "./firebase-config.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, doc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { ENTRY_QUIZ, EXIT_QUIZ } from "./questions.js";
import { applyStoredTheme, toggleTheme } from "./util.js";

applyStoredTheme();
document.getElementById("themeBtn").addEventListener("click", toggleTheme);

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

let registration = null;
let code = null;
let activeSet = null; // "entry" | "exit"
let currentIndex = 0;
let answers = [];

const loginCard = document.getElementById("loginCard");
const welcomeCard = document.getElementById("welcomeCard");
const quizCard = document.getElementById("quizCard");
const resultCard = document.getElementById("resultCard");
const certWrap = document.getElementById("certCardWrap");

document.getElementById("loginBtn").addEventListener("click", login);
document.getElementById("codeInput").addEventListener("keydown", (e) => {
  if (e.key === "Enter") login();
});

async function login() {
  const errBox = document.getElementById("loginError");
  errBox.style.display = "none";
  const input = document.getElementById("codeInput").value.trim().toUpperCase();
  if (input.length !== 5) {
    errBox.textContent = "Kód musí mať presne 5 znakov.";
    errBox.style.display = "block";
    return;
  }
  const ref = doc(db, "registrations", input);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    errBox.textContent = "Kód sa nenašiel. Skontrolujte prosím, či ste ho zadali správne.";
    errBox.style.display = "block";
    return;
  }
  code = input;
  registration = snap.data();
  loginCard.style.display = "none";
  showWelcome();
}

function showWelcome() {
  welcomeCard.style.display = "block";
  document.getElementById("welcomeTitle").textContent = `Vitajte, ${registration.fullName.split(" ")[0]}!`;

  const badges = document.getElementById("statusBadges");
  badges.innerHTML = `
    <span class="badge-pill ${registration.entryQuizDone ? "ok" : "pending"}">Vstupný kvíz: ${registration.entryQuizDone ? "hotový" : "čaká"}</span>
    &nbsp;
    <span class="badge-pill ${registration.exitQuizDone ? "ok" : "pending"}">Výstupný kvíz: ${registration.exitQuizDone ? "hotový" : "čaká"}</span>
  `;

  const actions = document.getElementById("welcomeActions");
  actions.innerHTML = "";

  if (!registration.entryQuizDone) {
    const b = button("Spustiť vstupný kvíz", () => startQuiz("entry"));
    actions.appendChild(b);
  } else if (!registration.exitQuizDone) {
    const b = button("Spustiť výstupný kvíz", () => startQuiz("exit"));
    actions.appendChild(b);
  } else {
    const b = button("Zobraziť môj výsledok a certifikát", showFinalResult);
    actions.appendChild(b);
  }
}

function button(label, onClick, cls = "") {
  const btn = document.createElement("button");
  btn.textContent = label;
  if (cls) btn.className = cls;
  btn.addEventListener("click", onClick);
  return btn;
}

function startQuiz(set) {
  activeSet = set;
  currentIndex = 0;
  answers = [];
  welcomeCard.style.display = "none";
  quizCard.style.display = "block";
  document.getElementById("quizTitle").textContent =
    set === "entry" ? "📝 Vstupný kvíz (8 otázok)" : "📝 Výstupný kvíz (8 otázok)";
  renderQuestion();
}

function renderQuestion() {
  const set = activeSet === "entry" ? ENTRY_QUIZ : EXIT_QUIZ;
  const q = set[currentIndex];
  document.getElementById("progressFill").style.width = `${(currentIndex / set.length) * 100}%`;

  const body = document.getElementById("quizBody");
  body.innerHTML = `
    <p style="color:var(--muted); font-size:.85rem;">Otázka ${currentIndex + 1} / ${set.length}</p>
    <div class="quiz-question">${q.q}</div>
    <div id="optionsBox"></div>
  `;
  const optionsBox = document.getElementById("optionsBox");
  q.options.forEach((opt, i) => {
    const div = document.createElement("button");
    div.type = "button";
    div.className = "quiz-option";
    div.textContent = opt;
    div.addEventListener("click", () => {
      answers[currentIndex] = i;
      currentIndex++;
      if (currentIndex >= set.length) {
        finishQuiz(set);
      } else {
        renderQuestion();
      }
    });
    optionsBox.appendChild(div);
  });
}

async function finishQuiz(set) {
  quizCard.style.display = "none";
  const score = answers.reduce((acc, a, i) => acc + (a === set[i].correct ? 1 : 0), 0);
  const pct = Math.round((score / set.length) * 100);

  const updates = {};
  if (activeSet === "entry") {
    updates.entryQuizDone = true;
    updates.entryScore = score;
    updates.entryAnswers = answers;
  } else {
    updates.exitQuizDone = true;
    updates.exitScore = score;
    updates.exitAnswers = answers;
  }
  await updateDoc(doc(db, "registrations", code), updates);
  Object.assign(registration, updates);

  resultCard.style.display = "block";
  document.getElementById("resultBadge").innerHTML =
    pct >= 75 ? "🎉" : pct >= 50 ? "👍" : "💪";
  document.getElementById("scoreOut").textContent = `${score} / ${set.length}`;
  document.getElementById("scoreLabel").textContent =
    (activeSet === "entry" ? "Výsledok vstupného kvízu" : "Výsledok výstupného kvízu") + ` (${pct} %)`;

  const compareBox = document.getElementById("compareBox");
  compareBox.innerHTML = "";
  if (activeSet === "exit" && registration.entryScore != null) {
    const diff = registration.exitScore - registration.entryScore;
    const diffText = diff > 0 ? `zlepšenie o ${diff} body 🎉` : diff === 0 ? "rovnaký výsledok" : `pokles o ${Math.abs(diff)} body`;
    compareBox.innerHTML = `<p>Vstupný kvíz: <strong>${registration.entryScore}/8</strong> → Výstupný kvíz: <strong>${registration.exitScore}/8</strong> (${diffText})</p>`;
  }

  const resultActions = document.getElementById("resultActions");
  resultActions.innerHTML = "";
  if (activeSet === "entry") {
    resultActions.appendChild(button("Pokračovať", () => {
      resultCard.style.display = "none";
      welcomeCard.style.display = "block";
      showWelcome();
    }));
  } else {
    resultActions.appendChild(button("Zobraziť certifikát 🏆", showFinalResult));
  }
}

function showFinalResult() {
  welcomeCard.style.display = "none";
  resultCard.style.display = "none";
  certWrap.style.display = "block";

  const entryPct = registration.entryScore != null ? Math.round((registration.entryScore / 8) * 100) : null;
  const exitPct = registration.exitScore != null ? Math.round((registration.exitScore / 8) * 100) : null;

  document.getElementById("certificate").innerHTML = `
    <h2>Certifikát o absolvovaní</h2>
    <p>Tento certifikát potvrdzuje, že</p>
    <div class="name">${registration.fullName}</div>
    <p>úspešne absolvoval/a workshop</p>
    <p style="font-weight:700;">„Ako sa nenechať oklamať: AI ako pomocník pri finančných rozhodnutiach“</p>
    ${entryPct != null && exitPct != null ? `<p>Vstupný kvíz: <strong>${entryPct}%</strong> &nbsp;→&nbsp; Výstupný kvíz: <strong>${exitPct}%</strong></p>` : ""}
    <p style="color:var(--muted); font-size:.85rem;">Kód účastníka: ${code}</p>
  `;
}

document.getElementById("printCertBtn").addEventListener("click", () => window.print());
