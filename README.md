# AI & Financie – workshop registrácia + kvízy + admin zóna

Stránka pre workshop **„Ako sa nenechať oklamať: AI ako pomocník pri finančných rozhodnutiach“**.

Čisto statická stránka (HTML/CSS/JS, žiadny build krok), dáta beží cez **Firebase**
(Firestore = databáza, Authentication = ochrana admin zóny). Dá sa hostovať
zadarmo na **GitHub Pages**.

## Čo stránka obsahuje

- `index.html` – verejná registrácia na workshop, výber z 5 termínov (kapacita 10/termín),
  registračný formulár (meno, mesto, email, telefón) + 5-otázkový dotazník, po odoslaní
  pridelí účastníkovi náhodný **5-miestny kód** (písmená + čísla), QR kód kódu a možnosť
  stiahnuť pozvánku do kalendára (.ics)
- `kviz.html` – prihlásenie cez 5-miestny kód, vstupný a výstupný kvíz (8 otázok, iné
  formulácie otázok/odpovedí v každom kvíze), porovnanie výsledkov a **certifikát na vytlačenie/PDF**
- `admin.html` – admin zóna chránená Firebase Authentication (email + heslo):
  - nastavenie 5 termínov workshopu (dátum, čas, kapacita 10, počet miest na čakacej listine)
  - zoznam prihlásených zoskupený podľa termínu, s vyhľadávaním, filtrom, farebným zvýraznením
    (zelená = oba kvízy hotové, žltá = len vstupný, modrá = náhradník) a **exportom do CSV**
  - úprava, presun na iný termín, zrušenie a natrvalé vymazanie registrácie (s interným logom zmien)
  - prezencia na mieste (checkbox) a interná poznámka ku každému účastníkovi
  - editor otázok kvízu, editor textu potvrdzovacieho emailu, editor obsahu úvodnej stránky
  - samostatný farebný prehľad a export výsledkov kvízov, tlač prezenčnej listiny
  - panel upozornení (blížiaci sa termín s nízkou obsadenosťou, plné termíny, nevyplnené kvízy)
  - štatistiky: obsadenosť termínov, priemerné skóre vstup/výstup, koláčové grafy pre všetky otázky dotazníka
- Bonus funkcie: prepínanie svetlý/tmavý režim, progress bar v kvíze, QR kód, .ics export, tlačiteľný certifikát,
  čakacia listina (waitlist) s automatickým posunom náhradníka pri zrušení, zdieľanie na Facebooku,
  automatické potvrdenie registrácie emailom (EmailJS), zrušenie/presun registrácie a spätná väzba
  po workshope cez prihlasovací kód

## 1. Nastavenie Firebase (nutné pred prvým použitím)

1. Choď na [Firebase Console](https://console.firebase.google.com) a klikni **"Add project"**.
   Zadaj názov (napr. `aifin-usmejsa`) a dokonči vytvorenie projektu.
2. V projekte choď na **Build → Firestore Database → Create database**.
   Zvoľ produkčný režim (production mode) a najbližší región (napr. `eur3`).
3. Choď do **Firestore Database → Rules**, zmaž pôvodný obsah a vlož obsah súboru
   [`firestore.rules`](firestore.rules) z tohto repozitára. Klikni **Publish**.
4. Choď na **Build → Authentication → Get started → Sign-in method** a zapni
   **Email/Password**.
5. V **Authentication → Users → Add user** vytvor jeden účet (email + heslo) –
   to bude tvoje prihlásenie do `admin.html`.
6. Choď na ⚙️ **Project settings → General**, zjeď dole na "Your apps" a klikni
   na ikonu `</>` (Web app). Zaregistruj appku (názov nie je dôležitý,
   Firebase Hosting nemusíš zapínať).
7. Skopíruj vygenerovaný `firebaseConfig` objekt a vlož jeho hodnoty do
   [`js/firebase-config.js`](js/firebase-config.js) namiesto zástupných textov `VLOZ_SEM_...`.
8. V **Firestore Database → Data** ručne vytvor 5 dokumentov v kolekcii `terms`
   (alebo to jednoducho urob cez admin zónu po nasadení – pozri nižšie),
   s ID `term1` až `term5`.

Po tomto kroku je appka plne funkčná – registrácia aj admin zóna.

### Nastavenie termínov workshopu

Najjednoduchšie: otvor `admin.html`, prihlás sa svojim admin účtom a v záložke
**"📅 Termíny"** nastav 5 dátumov a časov → **Uložiť termíny**. Kapacita je vždy 10,
počet miest na čakacej listine (náhradníkov) si zvolíš pre každý termín samostatne.

## 1b. Nastavenie automatických potvrdzovacích emailov (voliteľné, zadarmo)

Ak chceš, aby účastníci po registrácii dostali automatický email s kódom, nastav
bezplatnú službu [EmailJS](https://www.emailjs.com) (free plán = 200 emailov/mesiac):

1. Zaregistruj sa na emailjs.com.
2. **Email Services → Add new service** → prepoj svoju emailovú schránku (napr. Gmail) → skopíruj **Service ID**.
3. **Email Templates → Create new template** → do šablóny vlož premenné `{{to_email}}`,
   `{{subject}}` a `{{message}}` (napr. predmet = `{{subject}}`, telo = `{{message}}`) → skopíruj **Template ID**.
4. **Account → General** → skopíruj **Public Key**.
5. Vlož všetky 3 hodnoty do [`js/emailjs-config.js`](js/emailjs-config.js).
6. Samotný text emailu (predmet aj správu) potom upravuješ priamo v admin zóne, v záložke **"✉️ Email"**.

Pokiaľ tento krok vynecháš, appka bude fungovať úplne normálne, len sa nebudú
odosielať potvrdzovacie emaily.

## 2. Spustenie GitHub repozitára a nasadenie na GitHub Pages

Na tomto počítači nie je nainštalovaný GitHub CLI (`gh`), takže repozitár
a push musíš urobiť ty – tu je presný postup (skopíruj a spusti v termináli
v priečinku `AIfin_usmejsa`):

```bash
git init
git add .
git commit -m "Initial commit: AI & financie workshop stranka"
git branch -M main
```

Potom si na [github.com/new](https://github.com/new) vytvor **nový prázdny repozitár**
s názvom `AIfin_usmejsa` (bez README, bez .gitignore – ten už máme).

```bash
git remote add origin https://github.com/<TVOJ_GITHUB_USER>/AIfin_usmejsa.git
git push -u origin main
```

### Zapnutie GitHub Pages

1. V repozitári na GitHub choď do **Settings → Pages**.
2. Pri **"Build and deployment"** zvoľ **Source: Deploy from a branch**.
3. Branch: `main`, priečinok: `/ (root)`. Klikni **Save**.
4. O pár minút bude stránka dostupná na
   `https://<TVOJ_GITHUB_USER>.github.io/AIfin_usmejsa/`.

## Poznámky k bezpečnosti

- Kód účastníka (5 znakov) funguje ako "heslo" k jeho záznamu – kto kód pozná,
  vie si dopísať výsledky kvízu. Zoznam *všetkých* účastníkov (list) je ale
  chránený a viditeľný iba po prihlásení do admin zóny.
- Formulárové aj kvízové dáta idú priamo z prehliadača do Firestore podľa
  pravidiel v `firestore.rules` – nie je potrebný žiadny vlastný server.
- Pre produkčné nasadenie s veľkým počtom účastníkov odporúčame do budúcna
  pridať Firebase App Check (ochrana proti botom pri registrácii).
