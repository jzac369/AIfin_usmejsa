import { firebaseConfig } from "./firebase-config.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getFirestore, doc, getDoc, updateDoc, collection, getDocs, runTransaction
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { ENTRY_QUIZ, EXIT_QUIZ } from "./questions.js";
import { applyStoredTheme, toggleTheme, formatDateTime, downloadICS } from "./util.js";

applyStoredTheme();
document.getElementById("themeBtn").addEventListener("click", toggleTheme);

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

let quizSets = { entry: ENTRY_QUIZ, exit: EXIT_QUIZ };

async function loadQuestions() {
  const [entrySnap, exitSnap] = await Promise.all([
    getDoc(doc(db, "quizQuestions", "entry")),
    getDoc(doc(db, "quizQuestions", "exit"))
  ]);
  if (entrySnap.exists() && Array.isArray(entrySnap.data().questions)) {
    quizSets.entry = entrySnap.data().questions;
  }
  if (exitSnap.exists() && Array.isArray(exitSnap.data().questions)) {
    quizSets.exit = exitSnap.data().questions;
  }
}

let registration = null;
let code = null;
let currentTerm = null;
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

  if (registration.termId) {
    const termSnap = await getDoc(doc(db, "terms", registration.termId));
    currentTerm = termSnap.exists() ? { id: termSnap.id, ...termSnap.data() } : null;
  }

  showWelcome();
}

function showWelcome() {
  welcomeCard.style.display = "block";
  document.getElementById("welcomeTitle").textContent = `Vitajte, ${registration.fullName.split(" ")[0]}!`;
  document.getElementById("profileAvatar").textContent =
    `${(registration.firstName || registration.fullName || "?")[0] || "?"}${(registration.lastName || "")[0] || ""}`.toUpperCase();
  document.getElementById("welcomeTermInfo").textContent = currentTerm
    ? `📅 Váš termín: ${formatDateTime(currentTerm.datetime)}`
    : "";

  const badges = document.getElementById("statusBadges");
  const statusLabel = registration.status === "cancelled" ? "zrušená" : registration.status === "waitlist" ? "náhradník" : "potvrdená";
  badges.innerHTML = `
    <span class="badge-pill ${registration.status === "cancelled" ? "pending" : "ok"}">Registrácia: ${statusLabel}</span>
    &nbsp;
    <span class="badge-pill ${registration.entryQuizDone ? "ok" : "pending"}">Vstupný kvíz: ${registration.entryQuizDone ? "hotový" : "čaká"}</span>
    &nbsp;
    <span class="badge-pill ${registration.exitQuizDone ? "ok" : "pending"}">Výstupný kvíz: ${registration.exitQuizDone ? "hotový" : "čaká"}</span>
  `;

  const actions = document.getElementById("welcomeActions");
  actions.innerHTML = "";

  if (registration.status !== "cancelled") {
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
  } else {
    actions.innerHTML = "<p style='color:var(--muted); margin:0;'>Kvízy nie sú dostupné, registrácia je zrušená.</p>";
  }

  renderManageBox();
  document.getElementById("qrDisplayBox").style.display = "none";
}

function renderManageBox() {
  const box = document.getElementById("manageBox");
  const transferContainer = document.getElementById("transferOptionsBox");
  box.innerHTML = "";
  transferContainer.innerHTML = "";
  if (registration.status === "cancelled") {
    box.innerHTML = `<p style="color:var(--muted); margin:0;">Táto registrácia je zrušená. Ak sa chcete znova prihlásiť, vyplňte prosím nový registračný formulár.</p>`;
    return;
  }
  box.appendChild(button("🔁 Zmeniť termín", showTransferOptions, "secondary"));
  box.appendChild(button("🚫 Zrušiť registráciu", cancelMyRegistration, "danger"));
}

async function showTransferOptions() {
  const container = document.getElementById("transferOptionsBox");
  container.innerHTML = "<p style='color:var(--muted)'>Načítavam dostupné termíny…</p>";
  const snap = await getDocs(collection(db, "terms"));
  const allTerms = snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .filter((t) => t.id !== registration.termId)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  if (allTerms.length === 0) {
    container.innerHTML = "<p style='color:var(--muted)'>Nie sú dostupné žiadne iné termíny.</p>";
    return;
  }

  container.innerHTML = "<label>Vyberte nový termín</label>";
  const select = document.createElement("select");
  allTerms.forEach((t) => {
    const remaining = (t.capacity || 10) - (t.booked || 0);
    const opt = document.createElement("option");
    opt.value = t.id;
    opt.textContent = `${formatDateTime(t.datetime)} (${remaining > 0 ? `voľné: ${remaining}` : "plno, náhradná listina"})`;
    select.appendChild(opt);
  });
  container.appendChild(select);

  const confirmBtn = button("Potvrdiť presun", async () => {
    await transferMyRegistration(select.value);
  });
  confirmBtn.style.marginTop = "10px";
  container.appendChild(document.createElement("br"));
  container.appendChild(confirmBtn);
}

async function transferMyRegistration(newTermId) {
  await runTransaction(db, async (tx) => {
    const oldTermRef = doc(db, "terms", registration.termId);
    const newTermRef = doc(db, "terms", newTermId);
    const oldSnap = await tx.get(oldTermRef);
    const newSnap = await tx.get(newTermRef);
    const oldData = oldSnap.exists() ? oldSnap.data() : {};
    const newData = newSnap.exists() ? newSnap.data() : {};

    if (oldSnap.exists()) {
      if (registration.status === "waitlist") {
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

    tx.update(doc(db, "registrations", code), { termId: newTermId, status: newStatus });
    registration.termId = newTermId;
    registration.status = newStatus;
  });

  const termSnap = await getDoc(doc(db, "terms", newTermId));
  currentTerm = termSnap.exists() ? { id: termSnap.id, ...termSnap.data() } : null;
  showWelcome();
}

async function cancelMyRegistration() {
  if (!confirm("Naozaj chcete zrušiť svoju registráciu na workshop?")) return;

  await runTransaction(db, async (tx) => {
    const termRef = doc(db, "terms", registration.termId);
    const termSnap = await tx.get(termRef);
    if (termSnap.exists()) {
      const data = termSnap.data();
      if (registration.status === "waitlist") {
        tx.update(termRef, { waitlistCount: Math.max(0, (data.waitlistCount || 0) - 1) });
      } else {
        tx.update(termRef, { booked: Math.max(0, (data.booked || 0) - 1) });
      }
    }
    tx.update(doc(db, "registrations", code), { status: "cancelled" });
  });

  registration.status = "cancelled";
  showWelcome();
}

function showFeedbackForm() {
  welcomeCard.style.display = "none";
  const feedbackCard = document.getElementById("feedbackCard");
  feedbackCard.style.display = "block";

  let selectedStars = registration.feedback?.rating || 0;
  const starBox = document.getElementById("starRating");

  function renderStars() {
    starBox.innerHTML = "";
    for (let i = 1; i <= 5; i++) {
      const star = document.createElement("span");
      star.textContent = i <= selectedStars ? "★" : "☆";
      star.style.color = i <= selectedStars ? "#f5a623" : "var(--muted)";
      star.addEventListener("click", () => {
        selectedStars = i;
        renderStars();
      });
      starBox.appendChild(star);
    }
  }
  renderStars();

  document.getElementById("feedbackNps").value = registration.feedback?.nps ?? "";
  document.getElementById("feedbackComment").value = registration.feedback?.comment ?? "";
  document.getElementById("feedbackMsg").style.display = "none";

  document.getElementById("submitFeedbackBtn").onclick = async () => {
    const feedback = {
      rating: selectedStars,
      nps: document.getElementById("feedbackNps").value ? parseInt(document.getElementById("feedbackNps").value, 10) : null,
      comment: document.getElementById("feedbackComment").value.trim(),
      submittedAt: Date.now()
    };
    await updateDoc(doc(db, "registrations", code), { feedback });
    registration.feedback = feedback;
    document.getElementById("feedbackMsg").style.display = "block";
  };
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
  const set = quizSets[activeSet];
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
document.getElementById("feedbackBackBtn").addEventListener("click", () => {
  document.getElementById("feedbackCard").style.display = "none";
  showWelcome();
});

document.getElementById("feedbackNavBtn").addEventListener("click", () => {
  welcomeCard.style.display = "none";
  showFeedbackForm();
});

document.getElementById("copyCodeBtn").addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(code);
    const btn = document.getElementById("copyCodeBtn");
    const original = btn.textContent;
    btn.textContent = "✅ Skopírované!";
    setTimeout(() => (btn.textContent = original), 1800);
  } catch {
    alert(`Váš kód: ${code}`);
  }
});

document.getElementById("showQrBtn").addEventListener("click", () => {
  const box = document.getElementById("qrDisplayBox");
  const isVisible = box.style.display !== "none";
  if (isVisible) {
    box.style.display = "none";
    return;
  }
  box.innerHTML = "";
  box.style.display = "flex";
  new QRCode(box, { text: code, width: 140, height: 140 });
});

document.getElementById("icsDownloadBtn").addEventListener("click", () => {
  if (currentTerm) {
    downloadICS(currentTerm);
  } else {
    alert("Termín sa nepodarilo načítať.");
  }
});

loadQuestions();
