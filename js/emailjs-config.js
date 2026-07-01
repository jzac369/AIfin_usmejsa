// ============================================================
// EMAILJS KONFIGURÁCIA (bezplatná služba na odosielanie emailov
// priamo z prehliadača, bez potreby vlastného servera)
// ------------------------------------------------------------
// 1. Choď na https://www.emailjs.com a zaregistruj sa (free plán,
//    200 emailov/mesiac zadarmo).
// 2. Email Services -> Add new service -> pripoj svoju emailovú
//    schránku (napr. Gmail) -> skopíruj "Service ID".
// 3. Email Templates -> Create new template. Do tela šablóny vlož
//    premenné {{to_email}}, {{subject}} a {{message}} (napr. ako
//    predmet použi {{subject}} a do tela vlož {{message}}).
//    Skopíruj "Template ID".
// 4. Account -> General -> skopíruj "Public Key".
// 5. Vlož všetky 3 hodnoty nižšie. Text samotného emailu (predmet
//    aj správu) potom upravuješ priamo v admin zóne, nie tu.
// ============================================================

export const emailjsConfig = {
  serviceId: "VLOZ_SEM_SERVICE_ID",
  templateId: "VLOZ_SEM_TEMPLATE_ID",
  publicKey: "VLOZ_SEM_PUBLIC_KEY"
};

export function isEmailjsConfigured() {
  return (
    emailjsConfig.serviceId !== "VLOZ_SEM_SERVICE_ID" &&
    emailjsConfig.templateId !== "VLOZ_SEM_TEMPLATE_ID" &&
    emailjsConfig.publicKey !== "VLOZ_SEM_PUBLIC_KEY"
  );
}
