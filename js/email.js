import { emailjsConfig, isEmailjsConfigured } from "./emailjs-config.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { formatDateTime } from "./util.js";

export const DEFAULT_EMAIL_TEMPLATE = {
  subject: "Potvrdenie registrácie – Workshop AI a financie",
  body: "<p>Dobrý deň, {{meno}},</p><p>ďakujeme za Vašu registráciu na workshop „Ako sa nenechať oklamať: AI ako pomocník pri finančných rozhodnutiach“.</p><p>Veľmi nás teší, že ste sa rozhodli zúčastniť nášho workshopu. Veríme, že si z neho odnesiete množstvo praktických rád, ktoré Vám pomôžu bezpečnejšie sa pohybovať na internete, lepšie využívať umelú inteligenciu a s väčšou istotou sa rozhodovať pri každodenných finančných situáciách.</p><p><strong>Vaša registrácia je potvrdená.</strong></p><p><strong>Termín workshopu:</strong><br>{{termin}}</p><p><strong>Váš prihlasovací kód:</strong><br>{{kod}}</p><p>Prosíme, uschovajte si tento kód. Budete ho potrebovať, ak si budete chcieť neskôr zobraziť svoju registráciu, zmeniť termín alebo svoju účasť zrušiť. Tieto zmeny môžete jednoducho vykonať na stránke <a href=\"https://bezpecneonline.digistart.sk\">bezpecneonline.digistart.sk</a> po zadaní Vášho prihlasovacieho kódu {{kod}}.</p><p><strong>Potrebujem si priniesť mobil alebo tablet?</strong></p><p>Nie, nie je to potrebné. Počas workshopu Vám radi zapožičiame tablet, na ktorom si budete môcť všetko prakticky vyskúšať. Ak však máte vlastný mobilný telefón alebo tablet, odporúčame priniesť si ho so sebou. Budete si môcť jednotlivé postupy vyskúšať priamo na zariadení, ktoré používate každý deň, čo Vám uľahčí ich neskoršie používanie aj doma.</p><p>Zároveň pripomíname, že workshop je určený aj pre úplných začiatočníkov. Nemusíte mať žiadne predchádzajúce skúsenosti s umelou inteligenciou ani s modernými technológiami. Všetko si vysvetlíme pokojne, zrozumiteľne a krok za krokom. Predpokladaná dĺžka workshopu: približne 2,5 hodiny.</p><p><strong>Miesto konania workshopu:</strong><br>Centrum Usmejsa<br>Kláštorská 471/44<br>921 01 Piešťany</p><p>Ak by ste mali akékoľvek otázky alebo potrebovali s niečím poradiť ešte pred workshopom, neváhajte nás kontaktovať. Radi Vám pomôžeme. Tešíme sa na osobné stretnutie s Vami a veríme, že spolu strávime príjemné, zaujímavé a užitočné dopoludnie.</p><p>S prianím pekného dňa,<br>Tím DigiStart<br>Akadémia digitálneho vzdelávania<br><a href=\"https://www.digistart.sk\">www.digistart.sk</a> / info@digistart.sk</p>"
};

export function initEmailjs() {
  if (isEmailjsConfigured() && window.emailjs) {
    window.emailjs.init({ publicKey: emailjsConfig.publicKey });
  }
}

// registration potrebuje: firstName, lastName, email, code, status. term je voliteľný (objekt s .datetime).
export async function sendConfirmationEmail(db, registration, term) {
  if (!isEmailjsConfigured() || !window.emailjs) {
    throw new Error("EmailJS nie je nakonfigurovaný (vyplň js/emailjs-config.js).");
  }
  const templateSnap = await getDoc(doc(db, "settings", "emailTemplate"));
  const tpl = templateSnap.exists() ? templateSnap.data() : DEFAULT_EMAIL_TEMPLATE;
  const replacements = {
    "{{meno}}": registration.firstName || "",
    "{{priezvisko}}": registration.lastName || "",
    "{{termin}}": term ? formatDateTime(term.datetime) : "",
    "{{kod}}": registration.code
  };
  const fill = (text) => Object.entries(replacements).reduce((acc, [k, v]) => acc.split(k).join(v), text || "");

  let subject = fill(tpl.subject || DEFAULT_EMAIL_TEMPLATE.subject);
  let body = fill(tpl.body || DEFAULT_EMAIL_TEMPLATE.body);
  if (registration.status === "waitlist") {
    body += "<p><em>(Momentálne ste zaradený/á na náhradnú listinu, budeme Vás kontaktovať, ak sa uvoľní miesto.)</em></p>";
  }

  await window.emailjs.send(emailjsConfig.serviceId, emailjsConfig.templateId, {
    to_email: registration.email,
    subject,
    message: body
  });
}
