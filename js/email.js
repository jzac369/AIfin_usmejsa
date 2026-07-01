import { emailjsConfig, isEmailjsConfigured } from "./emailjs-config.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { formatDateTime } from "./util.js";

export const DEFAULT_EMAIL_TEMPLATE = {
  subject: "Potvrdenie registrácie – Workshop AI a financie",
  body: "<p>Dobrý deň {{meno}},</p><p>ďakujeme za registráciu na workshop „Ako sa nenechať oklamať: AI ako pomocník pri finančných rozhodnutiach“.</p><p>Váš termín: {{termin}}<br>Váš prihlasovací kód (uschovajte si ho): <strong>{{kod}}</strong></p><p>Tešíme sa na Vás!</p>"
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
