# Stav projektu – AI & Financie (workshop stránka)

Tento súbor slúži na nadviazanie práce v novom chate. Zhŕňa čo projekt je,
čo už funguje, čo sa riešilo naposledy a na čo si dať pozor.
Posledná aktualizácia: 2026-07-15.

## Čo to je

Statická stránka (HTML/CSS/vanilla JS, žiadny build krok) pre bezplatný
workshop **„Ako sa nenechať oklamať: AI ako pomocník pri finančných
rozhodnutiach"** pre seniorov. Organizuje **Akadémia digitálneho vzdelávania
DigiStart**, v spolupráci s **Centrum Usmejsa**, finančne podporené
**Nadáciou Národnej banky Slovenska**. Workshop trvá cca 2,5 hod.

- **Repo:** https://github.com/jzac369/AIfin_usmejsa (vlastník: `jzac369`)
- **Live URL:** https://bezpecneonline.digistart.sk (custom doména, `CNAME` v repe)
- Backend: Firebase Firestore + Firebase Authentication (len admin login).
  Firebase aj EmailJS sú reálne nastavené a funkčné (nie placeholder hodnoty).
- **Ja (Claude) nemám prístup na priamy zápis do Firestore ani na Firebase
  Console.** Zmeny `firestore.rules` musí užívateľ vždy sám vložiť do
  Firebase Console → Firestore → Rules → Publish. Nikdy nezadávam admin
  heslo ani netriggerujem žiadny reálny deploy sám.

## Súbory

| Súbor | Účel |
|---|---|
| `index.html` + `js/booking.js` | Landing/teaser stránka, hero, partner logá, skrytý registračný formulár (odkrytý CTA tlačidlom), počítadlo návštev |
| `kviz.html` + `js/quiz.js` | Prihlásenie 5-miestnym kódom, vstupný/výstupný kvíz, certifikát |
| `admin.html` + `js/admin.js` | Admin zóna (chránená Firebase Auth) – všetka správa, live-update cez `onSnapshot` |
| `privacy.html` | GDPR/ochrana osobných údajov (DigiStart ako prevádzkovateľ) |
| `js/util.js` | Zdieľané funkcie (kód, dátum, .ics export, CSV export, `ICONS` sada SVG namiesto emoji) |
| `js/email.js` + `js/emailjs-config.js` | Odosielanie potvrdzovacích emailov cez EmailJS |
| `js/firebase-config.js` | Reálny Firebase config projektu |
| `js/questions.js` | Aktuálne kvízové otázky (ENTRY_QUIZ/EXIT_QUIZ, 8 tém, 4 možnosti/otázka) – fallback pri prvom nastavení |
| `firestore.rules` | Bezpečnostné pravidlá – jediná vrstva prístupovej kontroly, **musí byť ručne publikovaná** |
| `css/style.css` | Celý dizajn – admin paleta v `:root`, verejné stránky cez `body.warm-theme` |
| `img/partners/*`, `img/hero-illustration.png` | Logá partnerov, ilustrácia na landing page |

## Kompletný zoznam funkcií (stav k tomuto commitu)

**Landing page (index.html):**
Krátky "teaser" (hook, 5 bodov, 4-kartová sekcia "prečo", partner logá, CTA
tlačidlo), za ktorým sa odkryje plný registračný formulár s termínmi
(kapacita + čakacia listina), 5-otázkový dotazník, náhodný 5-miestny kód,
QR kód, .ics export, zdieľanie na Facebooku, urgency banner pri malom počte
voľných miest, počítadlo dennej/mesačnej návštevnosti (`pageViews` kolekcia).

**Kvíz (kviz.html):**
Prihlásenie kódom, vstupný a výstupný kvíz (8 otázok × 4 možnosti,
editovateľné z admina), porovnanie skóre, tlačiteľný certifikát,
presun/zrušenie registrácie (self-service, zablokované 48h pred
workshopom), feedback formulár po workshope.

**Admin zóna (admin.html):**
- Zoznam prihlásených – zoskupené podľa termínu, live-update bez refreshu,
  vyhľadávanie, filter, farebné zvýraznenie podľa stavu kvízov, ručné
  pridanie/úprava/vymazanie účastníka, audit log, export CSV
- Presun na iný termín – výber z dostupných termínov s voľnou kapacitou,
  upozornenie pri presúvaní už zrušenej registrácie
- Prezencia (checkbox "Prišiel"), interná poznámka k účastníkovi, tlačiteľná
  prezenčná listina
- Termíny – ľubovoľný počet, pridávanie/mazanie, prepínač viditeľnosti v
  kalendári, čakacia listina per termín, prepínač "kvíz len v deň workshopu"
- Editor otázok kvízu + JSON-import okno na rýchle vloženie vygenerovaných
  otázok (`#questionsImportInput` / "Uložiť otázky")
- Editor emailovej šablóny (rich text), editor obsahu landing page
- Materiály na stiahnutie (base64 vo Firestore – bez Firebase Storage)
- Štatistiky – obsadenosť, priemerné skóre, koláčové aj stĺpcové grafy
  (click-to-zoom modal), návštevnosť stránky
- Rotujúci žltý panel upozornení (min. 5 správ, 10s interval)
- Sidebar branding, indikátor "Registrácia aktívna/uzavretá", uvítanie s
  emailom prihláseného admina, footer "Powered by Code w/Digistart" +
  "Nahlásiť chybu"
- Mobilný hamburger toggle (≤480px) – sidebar sa mení na slide-in drawer,
  desktop/tablet nedotknuté
- Prihlásenie: email/heslo, prihlasovanie sa loguje do audit logu

**Dizajn:**
Len svetlý režim (tmavý/prepínač bol odstránený). Verejné stránky majú teplú
senior-friendly tému (`body.warm-theme`, fonty Fraunces + Atkinson
Hyperlegible, SVG ikony namiesto emoji). Admin zóna má vlastnú modrú
gradientovú paletu. Responzívne pre mobil/tablet (tabuľky sa menia na karty).

## Aktuálny stav Firestore Rules (over, že je publikované v Firebase Console)

Kompletný obsah je v `firestore.rules` v repe. Tri zmeny za poslednú session:
1. `registrations` update whitelist doplnená o `entryTotal`, `exitTotal`
   (fix hlavného bugu s neukladaním kvízu – toto bol root cause).
2. `auditLog` create whitelist doplnená o akciu `'quiz-completed'`.
3. Nový blok `pageViews/{dateId}` – verejnosť smie len zapisovať `views`,
   čítať smie len admin.

Ak nie je publikované, kvíz/audit log/page views môžu zlyhávať s
permission-denied chybami.

## Posledná session – čo sa riešilo (chronologicky, zhrnuté)

1. Admin UI polish – len svetlý režim, badge farby, zoskupenie termínov,
   mazanie logov podľa dátumu, tablet layout fix.
2. **Kľúčový bugfix**: kvíz sa neukladal – chýbajúce `entryTotal`/`exitTotal`
   v Firestore Rules whiteliste. Opravené a publikované.
3. Nový vizuálny štýl pre verejné stránky, landing page prerobená na krátky
   teaser s partner logami a skrytým registračným formulárom.
4. Admin zóna: live-update cez `onSnapshot`, rotujúci banner, sidebar
   branding, indikátor stavu registrácie, štatistika návštevnosti.
5. Fix zamrznutej tabuľky registrácií po transfer/delete a fix duplicitnej
   dekrementácie kapacity pri presune zrušenej registrácie; pridaný výber
   dostupných termínov s kapacitou pri presune.
6. Nové kvízové otázky z brožúry (8 tém, 4 možnosti/otázka, vstupný
   náročnejší než výstupný) v `js/questions.js` + JSON-import UI v admin
   "Otázky" editore (ja nemám priamy zápis do ich Firestore – užívateľ musí
   sám vložiť JSON a kliknúť "Uložiť otázky").
7. Fix grafov – oválne koláčové grafy (chýbal `responsive:true`), pridaný
   click-to-zoom modal, opravené zošpúlené stĺpcové grafy
   (`.chart-frame-bar{aspect-ratio:16/9}`).
8. Mobilné opravy tabuľky registrácií (zalamovanie textu, zvyškové
   horizontálne skrolovanie) – **užívateľ potvrdil funkčnosť**.
9. Mobilný hamburger drawer pre sidebar nav (len ≤480px). Prvý pokus bol
   nefunkčný – root cause: `transform` animácia sa v testovacom prostredí
   neaplikovala (nahradené `left` property animáciou) a `.mobile-nav-backdrop`
   je v DOM súrodenec `.admin-sidebar`, nie potomok (selector opravený z
   descendant na `+` adjacent-sibling combinator). Tlačidlo zmenšené na
   26×26px. Overené priamou JS inšpekciou DOM/CSS stavu na všetkých troch
   breakpointoch. **Posledný commit: `2e6a216`, pushnutý do `origin main`.**

## Neoverené / na kontrolu v ďalšej session

- **Overiť, či bol finálny JSON so 4 možnosťami reálne vložený do živého
  admin "Otázky" editora a uložený tlačidlom "Uložiť otázky".** Bol poslaný
  dvakrát (najprv 8 možností, potom opravené na 4), no niet potvrdenia, že
  posledná verzia je live vo Firestore.
- Skontrolovať, že `firestore.rules` (viď vyššie) je publikované v Firebase
  Console – nebolo to v tejto session explicitne re-potvrdené po poslednej
  zmene.

## Na čo si dať pozor

- **GitHub Pages deployment vie byť nespoľahlivý** – ak po pushi zmeny
  nevidno ani po pár minútach, skontroluj repo → **Actions** tab.
- **GitHub token** (`ghp_...`) bol počas vývoja viackrát prevkladaný priamo
  v chate – odporúčam ho zrevokovať/vygenerovať nový, ak sa to ešte
  neurobilo.
- **Firebase Storage/Blaze plán** vedome nie je zapnutý – súbory na
  stiahnutie (Materiály) idú ako base64 priamo do Firestore, limit
  ~700KB/súbor.
- Nástroj na screenshoty preview servera je v tomto prostredí často
  nespoľahlivý (timeouty) – overovanie zmien radšej robiť cez
  `javascript_tool` (computed CSS/DOM stav) než cez vizuálny screenshot.
  Fungovalo to spoľahlivo pri debugovaní mobilného menu.
- Obrázky/logá, ktoré užívateľ vloží do chatu, si musí sám uložiť do
  repozitára (Claude nevie ukladať prílohy priamo na disk) – dajú sa potom
  premenovať/zapojiť do kódu.

## Čo nie je rozrobené / na čo sa nič nečaká

Žiadna funkcia nie je rozpracovaná uprostred. Jediné otvorené body sú tie
dve položky v sekcii "Neoverené" vyššie (over si ich pri návrate do
Firebase Console / admin Otázky editora). Tento súbor je snímka stavu pre
pokračovanie, nie zoznam TODO.
