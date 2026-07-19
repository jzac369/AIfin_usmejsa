# Stav projektu – AI & Financie (workshop stránka)

Tento súbor slúži na nadviazanie práce v novom chate. Zhŕňa čo projekt je,
čo už funguje, čo sa riešilo naposledy a na čo si dať pozor.
Posledná aktualizácia: 2026-07-15.

## Čo to je

Statická stránka (HTML/CSS/vanilla JS, žiadny build krok) pre bezplatný
workshop **„Ako sa nenechať oklamať: AI ako pomocník pri finančných
rozhodnutiach"** pre seniorov. Organizuje **Akadémia digitálneho vzdelávania
DigiStart**, v spolupráci s **Centrum Usmejsa** a **o.z. Úsmev pre druhých**,
finančne podporené **Nadáciou Národnej banky Slovenska** (Grantová výzva
GV-2026-15). Workshop trvá cca 2,5 hod., koná sa v Centrum Usmejsa,
Kláštorská 471/44, 921 01 Piešťany.

- **Repo:** https://github.com/jzac369/AIfin_usmejsa (vlastník: `jzac369`)
- **Live URL:** https://bezpecneonline.digistart.sk (custom doména, `CNAME` v repe)
- Backend: Firebase Firestore + Firebase Authentication (len admin login).
  Firebase aj EmailJS sú reálne nastavené a funkčné (nie placeholder hodnoty).
- **Ja (Claude) nemám prístup na priamy zápis do Firestore ani na Firebase
  Console, ani na dashboard EmailJS.** Zmeny `firestore.rules` a opravy
  nesprávnych dát vo Firestore musí užívateľ vždy sám vložiť/upraviť cez
  Firebase Console. Nikdy nezadávam admin heslo ani netriggerujem žiadny
  reálny deploy sám (okrem `git push` na vyžiadanie).
- **Obrázky/logá vložené priamo do chatu si musí užívateľ sám uložiť na
  disk** (Claude nevie ukladať prílohy) – vždy poviem presnú cestu, kam ich
  uložiť, aby ich kód rovno našiel.

## Súbory

| Súbor | Účel |
|---|---|
| `index.html` + `js/booking.js` | Landing stránka, hero, partner logá, grant note, registračný formulár |
| `kviz.html` + `js/quiz.js` | Prihlásenie 5-miestnym kódom, vstupný/výstupný kvíz, certifikát, **guest kvíz bez registrácie** |
| `admin.html` + `js/admin.js` | Admin zóna (Firebase Auth) – všetka správa, live-update cez `onSnapshot` |
| `privacy.html` | GDPR (DigiStart ako prevádzkovateľ), teraz tiež `warm-theme` |
| `js/util.js` | Zdieľané funkcie (kód, dátum, .ics export, `ICONS` sada SVG) |
| `js/email.js` + `js/emailjs-config.js` | Odosielanie potvrdzovacích emailov cez EmailJS |
| `js/firebase-config.js` | Reálny Firebase config projektu |
| `js/questions.js` | Kvízové otázky (ENTRY_QUIZ/EXIT_QUIZ, 8 tém, 4 možnosti) – fallback |
| `firestore.rules` | Bezpečnostné pravidlá – **musí byť ručne publikovaná** |
| `css/style.css` | Celý dizajn – admin paleta v `:root`, verejné stránky cez `body.warm-theme` |
| `img/partners/*`, `img/hero-illustration.png` | Logá partnerov (Nadácia NBS, Centrum Usmejsa, Úsmev pre druhých, DigiStart), portrétová hero ilustrácia |

## Kompletný zoznam funkcií (stav k tomuto commitu)

**Landing page (index.html):**
Hlavička s DigiStart logom (bez rámčeka) + páska s celým názvom workshopu
pod ňou, hero sekcia (nadpis, hook text, 5 bodov výhod, miesto konania),
partner logá (Nadácia NBS / Centrum Usmejsa / Úsmev pre druhých / DigiStart,
orezané na rovnaké okraje, 40px medzery), grant-note text o financovaní,
sekcia "Získate istotu..." (4 karty bez ikon, iba text), registračný
formulár s termínmi (kapacita + čakacia listina), 5-otázkový dotazník,
náhodný 5-miestny kód, QR kód, .ics export, zdieľanie na Facebooku. Po
úspešnej registrácii sa celá `#registrationSection` presunie hneď pod
hlavičku a stránka sa scrollne na `top:0` (instant, nie smooth) – potvrdenie
je vidieť okamžite bez scrollovania.

**Kvíz (kviz.html):**
Prihlásenie kódom → vstupný a výstupný kvíz, porovnanie skóre, tlačiteľný
certifikát, presun/zrušenie registrácie (48h blokácia), feedback formulár.
**Nové:** pod prihlasovacím formulárom sú 2 malé nenápadné ikonky "Vstupný
kvíz" / "Výstupný kvíz" pre kohokoľvek BEZ registrácie – otázky sa berú z
rovnakého zdroja (Firestore `quizQuestions`), ale odpovede sa nikam
neukladajú (`finishGuestQuiz()` len spočíta a zobrazí skóre).

**Admin zóna (admin.html):**
- Sidebar branding "WORKSHOP MANAGEMENT" (bez rámčeka), nad Zoznamom
  prihlásených statický riadok "WORKSHOP: <celý názov>" + žltý panel
  upozornení vedľa neho
- Zoznam prihlásených – zoskupené podľa termínu, live-update, vyhľadávanie,
  filter, ručné pridanie/úprava/vymazanie účastníka, audit log, export CSV
- Prezenčná listina – **vždy tlačí presne 12 riadkov** (doplnené prázdnymi,
  ak je účastníkov menej), ale číslované sú len prvých 10; pod ňou tabuľka
  Lektor (meno + podpis), zmestí sa na 1 stranu
- Presun na iný termín, zrušenie, prezencia, poznámky
- Termíny – editor **už nikdy neprepisuje `booked`/`waitlistCount`** pre
  existujúce termíny (viď bugfix nižšie); pri vytváraní nového termínu sa
  nastavia na 0
- Editor otázok kvízu + JSON-import, editor emailovej šablóny (rich text,
  teraz so sanitizáciou HTML pri načítaní aj uložení), editor landing page
  (bez "Propagačný text" poľa – bolo odstránené)
- Materiály na stiahnutie, štatistiky, mobilný hamburger toggle

**Dizajn:**
Jednotná teplá téma (`body.warm-theme`, Fraunces + Atkinson Hyperlegible)
naprieč **všetkými** verejnými stránkami vrátane `privacy.html`. Admin zóna
má vlastnú modrú paletu. Responzívne pre mobil/tablet.

## Aktuálny stav Firestore Rules (over, že je publikované v Firebase Console)

Kompletný obsah je v `firestore.rules` v repe – v tejto session sa
nemenil, žiadna nová zmena na publikovanie.

## Posledná session (2026-07-15) – čo sa riešilo (chronologicky, zhrnuté)

Veľmi dlhá session, hlavné body:

1. **Web copy/SEO**: kompletný oficiálny názov workshopu všade na stránke +
   metadátach (title, description, OG tagy), "Centrum Usmejsa" konzistentne
   všade, pridané logo Úsmev pre druhých, grant-note text o Nadácii NBS.
2. **Header redizajn**: z pôvodného "AI a Financie" textu → kompaktné
   DigiStart logo (najprv v bielej karte, neskôr na žiadosť užívateľa **bez
   rámčeka**, priamo na gradiente), celý názov workshopu presunutý do
   samostatnej pásky pod hlavičkou. Logo sa menilo 3× (transparentné →
   glow verzia orezaná → finálna plochá tmavomodrá verzia).
3. **Typografia/spacing bugfix**: legacy CSS pravidlo `.hero p` (vyššia
   špecifickosť ako `.hero-hook`/`.hero-subtitle`) potichu rušilo medzery a
   farby – odstránené. Rovnaký vzorec (stará hodnota z pred-warm-theme éry)
   opravený aj v `.quiz-option.picked`.
4. **Partner logá**: autocrop prebytočného okolia (Python/PIL) pre rovnaké
   opticky vnímané medzery, zväčšené o 30 %, preusporiadané, opravený
   `max-width`, ktorý orezával širšie logo.
5. **Hero obsah**: prepísaný hook text + 5 bodov výhod + 2 nové odseky
   (praktické cvičenia, certifikát) presne podľa zadania užívateľa.
   Odstránené ikony z kariet "Prečo práve tento workshop" (na žiadosť).
6. **Quiz hover bug**: `button:hover{background:var(--primary-dark)}`
   (globálne pravidlo) malo vyššiu špecifickosť pre `background` než
   `.quiz-option` v pokoji → tmavé pozadie + tmavý text = nečitateľné.
   Opravené explicitným re-assertom farby v `.quiz-option:hover`.
7. **Email šablóna** (väčší blok práce):
   - Kontenteditable RTE v Admin → Email vkladal pri paste/formátovaní
     nečisté HTML (`<span style="font-size:...">`, cudzie atribúty z
     ChatGPT-copy) → pridaná `sanitizeEmailHtml()` (whitelist tagov, `<a>`
     smie mať len `href`), beží pri načítaní (self-heal starých dát) aj
     pri uložení; paste handler vynucuje čistý text.
   - **Skutočný root cause zlého renderovania v mailboxe** bol ale inde:
     EmailJS šablóna (`template_c9lio3o`) mala `{{message}}` vloženú cez
     ich vizuálny editor, ktorý HTML automaticky escapuje na viditeľný
     text. Užívateľ vytvoril novú šablónu v Code Editor režime
     (`template_lax1z6f`), ja som upravil `js/emailjs-config.js`.
   - Nový, kompletnejší `DEFAULT_EMAIL_TEMPLATE.body` (v `js/email.js` aj
     `js/admin.js`) s tučnými nadpismi sekcií a funkčným odkazom.
8. **Scroll po registrácii** (viacero iterácií, dôležité pochopiť):
   - Pôvodne `window.scrollTo({top:0})` po úspechu – no karta úspechu bola
     fyzicky ďaleko dole v DOM, takže scroll na vrch stránky ju vôbec
     neukázal.
   - 2. pokus: `successCard.scrollIntoView({smooth})` – fungovalo, ale
     testoval som to v **zabackgroundovanom tabe** (zabudol som ho
     `tabs_select`), čo v tomto browser-tool prostredí scroll úplne
     potláča → falošne som nahlásil "funguje", keď v realite ešte nie.
   - 3. pokus: zistené, že stránka má globálne `scroll-behavior:smooth`,
     takže aj veľký skok (2000-3000px) trval sekundy a pôsobil "zaseknuto"
     → zmenené na `behavior:"instant"`.
   - **Finálne riešenie** (podľa toho, čo užívateľ naozaj chcel): na
     úspech sa `#registrationSection` fyzicky presunie
     (`insertAdjacentElement`) hneď za `.title-ribbon` a `window.scrollTo`
     na `top:0` – takže potvrdenie je doslova na úplnom vrchu stránky.
     Overené reálnym odoslaním formulára (nie simuláciou) na desktope,
     tablete aj mobile s fronted tabom – `scrollY === 0` vo všetkých troch.
9. **Dátová chyba kapacity termínov** (dôležitý bugfix, nesúvisiaci s
   pôvodnou požiadavkou, objavený pri debugovaní):
   Admin editor termínov (`editableTerms`) je jednorazový snapshot z
   prihlásenia do admina a nikdy sa živo neaktualizuje (zámerne, aby
   neprerušil rozrobené úpravy). Bug: tlačidlo "Uložiť termíny" ale VŽDY
   zapisovalo `booked`/`waitlistCount` z tejto starej kópie naspäť do
   Firestore – takže akékoľvek uloženie (aj len zmena viditeľnosti)
   potichu vrátilo počty obsadenosti na hodnotu spred prihlásenia admina,
   aj keď medzitým pribudli/ubudli reálne registrácie. **Opravené** – editor
   už `booked`/`waitlistCount` pre existujúce termíny vôbec nezapisuje.
   Užívateľ musí ešte ručne opraviť aktuálne nesprávnu hodnotu `booked` pre
   `term1` vo Firebase Console (mal by som k tomu dostať potvrdenie, či to
   urobil – pozri "Neoverené" nižšie).
10. **Guest kvíz**: 2 malé ikony na `kviz.html` pod prihlasovacím
    formulárom umožňujú vyskúšať vstupný/výstupný kvíz bez registrácie;
    otázky z rovnakého zdroja, nič sa neukladá. Overené end-to-end.

## Neoverené / na kontrolu v ďalšej session

- **Firebase Console → terms → term1 → pole `booked`** – bolo nesprávne
  na `0` kvôli bugu č. 9 vyššie, malo by byť opravené na skutočný počet
  potvrdených (nezrušených) registrácií pre tento termín (pri poslednej
  kontrole to bol 1 účastník – VAAT3). Over, či je to už opravené; ak nie,
  over aj ostatné termíny pre istotu (term2 bol v poriadku, term3-5 mali
  booked:0 čo pravdepodobne sedí).
- **Testovacie registrácie**: počas tejto session som pri overovaní scroll
  fixu vytvoril ~13 reálnych testovacích registrácií (mená ako
  TestClaude, TestClaude2…9, ScrollCheck/InstantCheck/TopOfPage/…) najmä
  na termín 1. augusta 2026. Ak ešte nie sú zmazané, treba ich zmazať cez
  Admin → Registrácie (a to je pravdepodobne presne to, čo spôsobilo bug
  č. 9 vyššie – ich mazanie počas otvorenej Termíny záložky).
- **EmailJS nová šablóna `template_lax1z6f`** – over si, že skutočne
  vykresľuje HTML správne (odoslať si testovací email) po tom, čo si ju
  užívateľ nastavil v Code Editore.

## Na čo si dať pozor

- **GitHub Pages deployment** – po pushi trvá nasadenie pár minút; ak
  zmeny nie sú vidno, skontroluj repo → Actions tab.
- **Firebase Storage/Blaze plán** nie je zapnutý – Materiály idú ako
  base64 priamo do Firestore, limit ~700KB/súbor.
- **Screenshot nástroj v Browser pane vie byť nespoľahlivý**, ale v tejto
  session fungoval prekvapivo dobre pri opakovanom použití – ak zlyhá,
  over zmeny cez `javascript_tool` (computed CSS/DOM stav, `getComputedStyle`,
  `getBoundingClientRect()`) namiesto vizuálneho screenshotu.
- **KRITICKÉ: vždy skontroluj `tabs_context` a `tabs_select` na fronted
  tab pred testovaním čohokoľvek so scrollom/animáciami/timing-om** –
  scroll (aj `scrollTo`, aj `scrollIntoView`) je v backgroundovanom tabe
  v tomto nástroji úplne potlačený a testy budú falošne "fungovať", kým v
  skutočnosti scroll vôbec neprebehne. Toto ma stálo niekoľko zbytočných
  kôl debugovania.
- **Testovacie dáta**: pri end-to-end testovaní registračného formulára sa
  vytvárajú REÁLNE záznamy vo Firestore (nie mock/staging prostredie) –
  vždy na konci upozorniť užívateľa a navrhnúť zmazanie cez Admin.
- **Deštruktívne shell príkazy**: raz som v tejto session omylom spustil
  `taskkill /F /IM python.exe`, čo zabilo VŠETKY python procesy v systéme
  (nielen môj testovací server) – vždy cieliť na konkrétny PID
  (`Get-NetTCPConnection -LocalPort <port> | ...`), nikdy nie plošne podľa
  mena procesu.
- **Obrázky do chatu**: Claude ich nevie uložiť sám, vždy treba dať
  užívateľovi presnú cieľovú cestu a počkať na potvrdenie "je tam".

## Čo nie je rozrobené

Žiadna funkcia nie je rozpracovaná uprostred. Otvorené sú len položky v
sekcii "Neoverené" vyššie. Tento súbor je snímka stavu pre pokračovanie,
nie zoznam TODO.
