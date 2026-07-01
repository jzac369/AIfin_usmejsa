import { firebaseConfig } from "./firebase-config.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getFirestore, collection, getDocs, doc, runTransaction, setDoc, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { generateCode, formatDateTime, downloadICS, applyStoredTheme, toggleTheme } from "./util.js";

applyStoredTheme();
document.getElementById("themeBtn").addEventListener("click", toggleTheme);

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

let terms = [];
let selectedTermId = null;

async function loadTerms() {
  const snap = await getDocs(collection(db, "terms"));
  terms = snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  document.getElementById("loadingCard").style.display = "none";

  if (terms.length === 0) {
    document.getElementById("loadingCard").style.display = "block";
    document.getElementById("loadingCard").innerHTML =
      "<p>Termíny workshopu momentálne nie sú nastavené. Skúste to prosím neskôr.</p>";
    return;
  }

  document.getElementById("regForm").style.display = "block";
  renderTerms();
}

function renderTerms() {
  const grid = document.getElementById("termsGrid");
  grid.innerHTML = "";
  terms.forEach((term) => {
    const booked = term.booked || 0;
    const capacity = term.capacity || 10;
    const pct = Math.min(100, Math.round((booked / capacity) * 100));
    const full = booked >= capacity;
    const div = document.createElement("div");
    div.className = "term-option" + (full ? " full" : "") + (selectedTermId === term.id ? " selected" : "");
    div.innerHTML = `
      <h3>${formatDateTime(term.datetime)}</h3>
      <div class="capacity">${full ? "Obsadené" : `Voľné miesta: ${capacity - booked} / ${capacity}`}</div>
      <div class="capacity-bar ${pct >= 100 ? "full" : pct >= 70 ? "warn" : ""}"><div style="width:${pct}%"></div></div>
    `;
    if (!full) {
      div.addEventListener("click", () => {
        selectedTermId = term.id;
        renderTerms();
      });
    }
    grid.appendChild(div);
  });
}

document.getElementById("regForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const errBox = document.getElementById("formError");
  const termErrBox = document.getElementById("termError");
  errBox.style.display = "none";
  termErrBox.style.display = "none";

  if (!selectedTermId) {
    termErrBox.style.display = "block";
    window.scrollTo({ top: 0, behavior: "smooth" });
    return;
  }

  const fullName = document.getElementById("fullName").value.trim();
  const city = document.getElementById("city").value.trim();
  const email = document.getElementById("email").value.trim();
  const phone = document.getElementById("phone").value.trim();
  const source = document.querySelector('input[name="source"]:checked')?.value;
  const devices = [...document.querySelectorAll('input[name="devices"]:checked')].map((el) => el.value);
  const aiExperience = document.querySelector('input[name="aiExperience"]:checked')?.value;
  const digitalSkill = document.querySelector('input[name="digitalSkill"]:checked')?.value;
  const reason = document.querySelector('input[name="reason"]:checked')?.value;

  if (!fullName || !city || !email || !phone || !source || !aiExperience || !digitalSkill || !reason) {
    errBox.textContent = "Prosím vyplňte všetky povinné polia a dotazník.";
    errBox.style.display = "block";
    return;
  }

  const submitBtn = document.getElementById("submitBtn");
  submitBtn.disabled = true;
  submitBtn.textContent = "Odosielam…";

  try {
    const termRef = doc(db, "terms", selectedTermId);
    let finalCode = null;

    await runTransaction(db, async (tx) => {
      const termSnap = await tx.get(termRef);
      if (!termSnap.exists()) throw new Error("Termín už neexistuje.");
      const data = termSnap.data();
      const booked = data.booked || 0;
      const capacity = data.capacity || 10;
      if (booked >= capacity) throw new Error("Tento termín je už, žiaľ, plne obsadený. Vyberte iný.");

      // vygeneruj unikátny kód (skús pár krát, ak by kolidoval)
      let code, codeRef, codeSnap;
      for (let attempt = 0; attempt < 8; attempt++) {
        code = generateCode(5);
        codeRef = doc(db, "registrations", code);
        codeSnap = await tx.get(codeRef);
        if (!codeSnap.exists()) break;
        code = null;
      }
      if (!code) throw new Error("Nepodarilo sa vygenerovať kód, skúste to prosím znova.");

      tx.update(termRef, { booked: booked + 1 });
      tx.set(codeRef, {
        code,
        fullName, city, email, phone,
        termId: selectedTermId,
        survey: { source, devices, aiExperience, digitalSkill, reason },
        entryQuizDone: false,
        exitQuizDone: false,
        entryScore: null,
        exitScore: null,
        entryAnswers: null,
        exitAnswers: null,
        createdAt: Date.now()
      });
      finalCode = code;
    });

    showSuccess(finalCode);
  } catch (err) {
    errBox.textContent = err.message || "Nastala chyba pri registrácii. Skúste to prosím znova.";
    errBox.style.display = "block";
    window.scrollTo({ top: 0, behavior: "smooth" });
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Záväzne sa prihlásiť";
  }
});

function showSuccess(code) {
  document.getElementById("regForm").style.display = "none";
  const successCard = document.getElementById("successCard");
  successCard.style.display = "block";
  document.getElementById("codeOut").textContent = code;

  const term = terms.find((t) => t.id === selectedTermId);
  document.getElementById("successTermInfo").textContent = term
    ? `Váš termín: ${formatDateTime(term.datetime)}`
    : "";

  new QRCode(document.getElementById("qrBox"), {
    text: code,
    width: 140,
    height: 140
  });

  document.getElementById("icsBtn").addEventListener("click", () => {
    if (term) downloadICS(term);
  });

  window.scrollTo({ top: 0, behavior: "smooth" });
}

loadTerms();
