import { firebaseConfig } from "./firebase-config.js";
import { initEmailjs, sendConfirmationEmail } from "./email.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getFirestore, collection, getDocs, doc, getDoc, setDoc, runTransaction, increment
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { generateCode, formatDateTime, downloadICS, ICONS } from "./util.js";

function wireOtherToggle(radioOrCheckboxId, textId) {
  const el = document.getElementById(radioOrCheckboxId);
  const textEl = document.getElementById(textId);
  const update = () => { textEl.style.display = el.checked ? "block" : "none"; };
  el.addEventListener("change", update);
  document.querySelectorAll(`input[name="${el.name}"]`).forEach((other) => {
    if (other !== el) other.addEventListener("change", update);
  });
}
wireOtherToggle("sourceOther", "sourceOtherText");
wireOtherToggle("devicesOther", "devicesOtherText");
wireOtherToggle("reasonOther", "reasonOtherText");
wireOtherToggle("financeTopicOther", "financeTopicOtherText");

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

initEmailjs();

// Jednoduchý denný počítadlo návštev registračnej stránky (pre prehľad v admin zóne).
(async function logPageView() {
  try {
    const today = new Date().toISOString().slice(0, 10);
    await setDoc(doc(db, "pageViews", today), { views: increment(1) }, { merge: true });
  } catch {
    // sledovanie návštevnosti nesmie zhodiť samotnú stránku
  }
})();

let terms = [];
let selectedTermId = null;
let workshopDetails = null;

const DEFAULT_LOCATION = "Centrum Usmejsa, Kláštorská 471/44, 921 01 Piešťany";

async function loadWorkshopDetails() {
  const snap = await getDoc(doc(db, "settings", "workshopDetails"));
  workshopDetails = snap.exists() ? snap.data() : null;
  const el = document.getElementById("heroLocation");
  if (el) el.innerHTML = `${ICONS.location}${workshopDetails?.location || DEFAULT_LOCATION}`;
}

const DEFAULT_HERO = {
  title: "Ako sa nenechať oklamať: AI ako pomocník pri finančných rozhodnutiach",
  subtitle: "Workshop o bezpečnom používaní umelej inteligencie a rozpoznávaní podvodov"
};

function openRegistrationSection() {
  const section = document.getElementById("registrationSection");
  if (!section) return;
  section.style.display = "block";
  section.scrollIntoView({ behavior: "smooth", block: "start" });
}
document.getElementById("openRegBtn")?.addEventListener("click", openRegistrationSection);
document.querySelectorAll(".open-reg-trigger").forEach((btn) => btn.addEventListener("click", openRegistrationSection));

async function loadHero() {
  try {
    const snap = await getDoc(doc(db, "settings", "landingPage"));
    const data = snap.exists() ? snap.data() : {};
    document.getElementById("heroTitle").textContent = data.title || DEFAULT_HERO.title;
    document.getElementById("heroSubtitle").textContent = data.subtitle || DEFAULT_HERO.subtitle;
  } catch {
    document.getElementById("heroTitle").textContent = DEFAULT_HERO.title;
    document.getElementById("heroSubtitle").textContent = DEFAULT_HERO.subtitle;
  }
}

document.getElementById("fbShareBtn").addEventListener("click", () => {
  const url = encodeURIComponent(window.location.origin + window.location.pathname);
  const quote = encodeURIComponent("Pozrite si bezplatný workshop „Ako sa nenechať oklamať: AI ako pomocník pri finančných rozhodnutiach“ – naučte sa rozpoznať AI podvody a využívať AI rozumne pri financiách!");
  window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}&quote=${quote}`, "_blank", "width=600,height=500");
});

async function loadTerms() {
  const snap = await getDocs(collection(db, "terms"));
  terms = snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .filter((t) => t.visibleInCalendar !== false)
    .sort((a, b) => new Date(a.datetime || 0) - new Date(b.datetime || 0));

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
    const waitlistCap = term.waitlistCapacity || 0;
    const waitlistCount = term.waitlistCount || 0;
    const pct = Math.min(100, Math.round((booked / capacity) * 100));
    const mainFull = booked >= capacity;
    const waitlistFull = waitlistCount >= waitlistCap;
    const totallyFull = mainFull && (waitlistCap === 0 || waitlistFull);
    const remaining = capacity - booked;

    const div = document.createElement("div");
    div.className = "term-option" + (totallyFull ? " full" : "") + (selectedTermId === term.id ? " selected" : "");

    let capacityLine = `Voľné miesta: ${remaining} / ${capacity}`;
    let urgencyBadge = "";
    if (mainFull && waitlistCap > 0 && !waitlistFull) {
      capacityLine = `Plno – voľné miesta na čakacej listine: ${waitlistCap - waitlistCount} / ${waitlistCap}`;
    } else if (totallyFull) {
      capacityLine = "Obsadené";
    } else if (remaining <= 2) {
      urgencyBadge = `<span class="badge-pill pending" style="margin-left:6px;">Posledné ${remaining} ${remaining === 1 ? "miesto" : "miesta"}!</span>`;
    }

    div.innerHTML = `
      <h3>${formatDateTime(term.datetime)} ${urgencyBadge}</h3>
      <div class="capacity">${capacityLine}</div>
      <div class="capacity-bar ${pct >= 100 ? "full" : pct >= 70 ? "warn" : ""}"><div style="width:${pct}%"></div></div>
    `;
    if (!totallyFull) {
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
    termErrBox.scrollIntoView({ behavior: "smooth", block: "center" });
    return;
  }

  const firstName = document.getElementById("firstName").value.trim();
  const lastName = document.getElementById("lastName").value.trim();
  const city = document.getElementById("city").value.trim();
  const email = document.getElementById("email").value.trim();
  const phone = document.getElementById("phone").value.trim();
  let source = document.querySelector('input[name="source"]:checked')?.value;
  if (source === "Iné" && document.getElementById("sourceOtherText").value.trim()) {
    source = `Iné: ${document.getElementById("sourceOtherText").value.trim()}`;
  }
  const devices = [...document.querySelectorAll('input[name="devices"]:checked')].map((el) => {
    if (el.value === "Iné" && document.getElementById("devicesOtherText").value.trim()) {
      return `Iné: ${document.getElementById("devicesOtherText").value.trim()}`;
    }
    return el.value;
  });
  const aiExperience = document.querySelector('input[name="aiExperience"]:checked')?.value;
  const digitalSkill = document.querySelector('input[name="digitalSkill"]:checked')?.value;
  let reason = document.querySelector('input[name="reason"]:checked')?.value;
  if (reason === "Iné" && document.getElementById("reasonOtherText").value.trim()) {
    reason = `Iné: ${document.getElementById("reasonOtherText").value.trim()}`;
  }
  let financeTopic = document.querySelector('input[name="financeTopic"]:checked')?.value;
  if (financeTopic === "Iné" && document.getElementById("financeTopicOtherText").value.trim()) {
    financeTopic = `Iné: ${document.getElementById("financeTopicOtherText").value.trim()}`;
  }

  if (!firstName || !lastName || !city || !email || !phone || !source || !aiExperience || !digitalSkill || !reason || !financeTopic) {
    errBox.textContent = "Prosím vyplňte všetky povinné polia a dotazník.";
    errBox.style.display = "block";
    return;
  }

  const fullName = `${firstName} ${lastName}`;
  const submitBtn = document.getElementById("submitBtn");
  submitBtn.disabled = true;
  submitBtn.textContent = "Odosielam…";

  try {
    const termRef = doc(db, "terms", selectedTermId);
    let finalCode = null;
    let finalStatus = "confirmed";

    await runTransaction(db, async (tx) => {
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
        throw new Error("Tento termín je už, žiaľ, plne obsadený (aj náhradná listina). Vyberte iný.");
      }

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

      if (status === "confirmed") {
        tx.update(termRef, { booked: booked + 1 });
      } else {
        tx.update(termRef, { waitlistCount: waitlistCount + 1 });
      }

      tx.set(codeRef, {
        code,
        firstName, lastName,
        fullName, city, email, phone,
        termId: selectedTermId,
        status,
        attended: false,
        adminNotes: "",
        survey: { source, devices, aiExperience, digitalSkill, reason, financeTopic },
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
      finalStatus = status;
    });

    const registeredTerm = terms.find((t) => t.id === selectedTermId);
    sendConfirmationEmail(db, { firstName, lastName, email, code: finalCode, status: finalStatus }, registeredTerm).catch((emailErr) => {
      console.error("Odoslanie potvrdzovacieho emailu zlyhalo:", emailErr);
    });
    showSuccess(finalCode, finalStatus);
  } catch (err) {
    errBox.textContent = err.message || "Nastala chyba pri registrácii. Skúste to prosím znova.";
    errBox.style.display = "block";
    errBox.scrollIntoView({ behavior: "smooth", block: "center" });
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Záväzne sa prihlásiť";
  }
});

function showSuccess(code, status) {
  document.getElementById("regForm").style.display = "none";
  const successCard = document.getElementById("successCard");
  successCard.style.display = "block";
  document.getElementById("codeOut").textContent = code;

  const term = terms.find((t) => t.id === selectedTermId);
  document.getElementById("successTermInfo").textContent = term
    ? `Váš termín: ${formatDateTime(term.datetime)}${status === "waitlist" ? " (náhradná listina)" : ""}`
    : "";

  new QRCode(document.getElementById("qrBox"), {
    text: code,
    width: 140,
    height: 140
  });

  document.getElementById("icsBtn").addEventListener("click", () => {
    if (term) downloadICS(term, workshopDetails);
  });

  // Registrácia je väčšinou ďaleko dole (za hero/partnermi/dôvodmi/CTA) - namiesto
  // scrollovania NA ňu presunieme celú sekciu s potvrdením hneď pod hlavičku,
  // takže je vidieť úplne navrchu stránky bez akéhokoľvek scrollovania.
  const ribbon = document.querySelector(".title-ribbon");
  const section = document.getElementById("registrationSection");
  if (ribbon && section) ribbon.insertAdjacentElement("afterend", section);
  window.scrollTo({ top: 0, behavior: "instant" });
}

loadHero();
loadWorkshopDetails();
loadTerms();
