// ============================================================
// OTÁZKY PRE VSTUPNÝ A VÝSTUPNÝ KVÍZ
// Téma: "Ako sa nenechať oklamať" (na základe brožúry pre seniorov -
// phishing, vishing, investičné podvody, AI halucinácie, deepfake
// fotografie, hoaxy, zlaté pravidlá bezpečnosti).
// Obe sady sa pýtajú na rovnakých 8 tém v rovnakom poradí, ale inak
// formulovane. Vstupný kvíz je zámerne náročnejší (dlhšie scenáre,
// jemnejšie rozdiely medzi možnosťami), výstupný kvíz je jednoduchší
// (kratšie a priamočiarejšie otázky) - aby sa nedalo len "odpísať".
// correct = index správnej odpovede (0-7)
// ============================================================

export const ENTRY_QUIZ = [
  {
    q: "Dostanete e-mail, ktorý vyzerá byť od vašej banky. Text vás vyzýva, aby ste klikli na odkaz a „overili“ svoje prihlasovacie údaje, inak vám banka do 24 hodín zablokuje účet. Čo je najsprávnejší postup?",
    options: [
      "Kliknúť na odkaz v e-maile a rýchlo zadať údaje, aby účet nezablokovali",
      "Odpovedať na e-mail so svojím menom a heslom, nech si to banka overí",
      "Preposlať e-mail rodine, aby vedeli, že sa niečo deje",
      "Zavolať na číslo uvedené priamo v podozrivom e-maile a overiť si to",
      "Neklikať na odkaz, e-mail zmazať a prípadne kontaktovať banku cez oficiálnu appku alebo web",
      "Otvoriť odkaz len v „súkromnom okne“ prehliadača, aby to bolo bezpečnejšie",
      "Poslať fotografiu občianskeho preukazu na potvrdenie totožnosti",
      "Počkať 24 hodín a sledovať, či sa účet naozaj zablokuje"
    ],
    correct: 4
  },
  {
    q: "Zavolá vám osoba, ktorá znie profesionálne, predstaví sa menom a priezviskom, tvrdí, že je z vašej banky, a pýta si od vás overovací kód, ktorý vám práve prišiel SMS-kou, aby mohla „zablokovať podozrivú transakciu“. Čo urobíte?",
    options: [
      "Nadiktujem kód, veď mi ho poslala banka, tak to musí byť v poriadku",
      "Hovor ukončím a sám/sama zavolám banke na oficiálne číslo z karty alebo webu",
      "Kód nadiktujem, len ak volajúci vie moje meno a dátum narodenia",
      "Požiadam volajúceho, aby zavolal neskôr, keď budem mať viac času",
      "Kód napíšem do SMS správy naspäť, nie nahlas do telefónu",
      "Overím si volajúceho tak, že sa ho opýtam na číslo jeho zamestnaneckého preukazu",
      "Kód poviem, ale až po tom, čo mi sľúbi, že transakciu naozaj zablokuje",
      "Zavesím a počkám, či zavolá ešte raz – ak áno, uverím mu"
    ],
    correct: 1
  },
  {
    q: "Na sociálnej sieti vidíte reklamu: „Investujte 300 € a do mesiaca máte istých 6 000 €. Obmedzený počet miest, iba dnes!“ Čo o tejto ponuke platí najpravdepodobnejšie?",
    options: [
      "Je to výnimočná, no legitímna príležitosť, treba konať rýchlo",
      "Ide takmer isto o podvod – vysoký garantovaný zisk bez rizika v skutočnosti neexistuje",
      "Je to bežný bankový produkt, len s vyšším úrokom",
      "Dá sa tomu veriť, pretože to bolo na internete",
      "Ide o štátom podporovaný investičný program",
      "Je to legitímne, ak ponuku zdieľa aj niekoľko známych",
      "Časové obmedzenie „len dnes“ dokazuje, že ponuka je vzácna a výhodná",
      "Malá vstupná suma 300 € znamená, že riziko je zanedbateľné"
    ],
    correct: 1
  },
  {
    q: "Opýtate sa AI chatbota (napríklad ChatGPTu) na dôležitú informáciu. Odpovie rýchlo, sebavedomo a s presnými detailmi. Čo by ste mali vedieť?",
    options: [
      "AI sa v takýchto veciach nikdy nemýli, informácie sú vždy overené",
      "AI odpoveď je automaticky správna, pretože znie sebavedomo",
      "AI môže niekedy „halucinovať“ – vymyslieť si presvedčivo znejúcu, no nesprávnu odpoveď, preto je dobré si dôležité veci overiť",
      "Halucinácia sa týka len obrázkov, nie textových odpovedí",
      "Ak by sa AI mýlila, sama by na to upozornila",
      "Stačí sa AI opýtať znova a druhá odpoveď bude vždy správna",
      "AI čerpá informácie výhradne z aktuálnych úradných databáz",
      "Chyby sa môžu stať iba pri otázkach položených v cudzom jazyku"
    ],
    correct: 2
  },
  {
    q: "Na fotografii zdieľanej na internete si všimnete, že osoba má na ruke šesť prstov a pozadie za ňou vyzerá mierne rozmazané a nelogické. Čo to môže naznačovať?",
    options: [
      "Fotoaparát mal len nesprávne nastavenie",
      "Ide o bežnú chybu tlače",
      "Fotografia mohla byť vytvorená alebo upravená umelou inteligenciou",
      "Je to dôkaz, že fotografia je stopercentne pravá",
      "Také chyby sa na skutočných fotografiách nikdy nevyskytujú náhodou",
      "Je to len problém s rozlíšením obrazovky, na ktorej sa pozeráte",
      "Znamená to, že fotoaparát bol pokazený",
      "Ide o umelecký filter, ktorý si osoba sama pridala"
    ],
    correct: 2
  },
  {
    q: "Na sociálnej sieti sa šíri príspevok písaný VEĽKÝMI PÍSMENAMI s množstvom výkričníkov, bez uvedeného autora, s výzvou „Zdieľajte okamžite, kým to nezmažú!“. Čo je typickým znakom takéhoto hoaxu?",
    options: [
      "Pokojný a vecný štýl písania",
      "Uvedenie overiteľného zdroja a autora",
      "Snaha vyvolať strach alebo naliehavosť a čo najrýchlejšie zdieľanie bez overenia",
      "Odkaz na oficiálnu webovú stránku úradu",
      "Dátum a presné meno zodpovednej osoby",
      "Žiadosť o overenie informácie skôr, než ju niekto zdieľa",
      "Nízky počet zdieľaní a komentárov",
      "Podpis overenej spravodajskej agentúry"
    ],
    correct: 2
  },
  {
    q: "Zamestnanec banky vám telefonuje a žiada vás, aby ste mu nadiktovali PIN kód ku karte, pretože „to potrebuje na zablokovanie podozrivej platby“. Čo je pravda?",
    options: [
      "Skutočná banka môže o PIN požiadať, ak ide o núdzovú situáciu",
      "Skutočná banka nikdy nežiada PIN, heslo ani autorizačný kód telefonicky ani e-mailom",
      "PIN možno nadiktovať, ak volajúci pozná číslo karty",
      "Je to v poriadku, pokiaľ hovor prišiel z čísla banky",
      "Stačí nahlas povedať len polovicu PIN kódu",
      "Je to bezpečné, ak si to volajúci nahráva pre „kontrolu kvality“",
      "PIN sa dá bezpečne nadiktovať, ak ide o rýchlu záležitosť",
      "Banka môže o PIN požiadať cez SMS správu"
    ],
    correct: 1
  },
  {
    q: "Umelá inteligencia vám na základe opísanej situácie odporučí konkrétny finančný krok (napríklad zrušiť poistku alebo investovať úspory). Ako by ste mali k takejto rade pristupovať?",
    options: [
      "Odporúčanie AI vždy okamžite vykonať bez ďalšieho overenia",
      "Radu úplne ignorovať, pretože pochádza od počítača",
      "Brať ju ako podnet na zamyslenie, informácie si overiť a dôležité rozhodnutie urobiť sám/sama, prípadne po konzultácii s odborníkom",
      "Rozhodnúť sa hodením mincou, keďže AI aj človek sa môžu mýliť",
      "Riadiť sa radou len vtedy, ak to AI odporučí aspoň trikrát za sebou",
      "Nechať rozhodnutie úplne na AI, aby sa ušetril čas",
      "Použiť radu iba vtedy, ak ju AI naformuluje veľmi sebavedomo",
      "Rozhodnutie odložiť navždy, aby sa predišlo akémukoľvek riziku"
    ],
    correct: 2
  }
];

export const EXIT_QUIZ = [
  {
    q: "Príde vám e-mail, ktorý vyzerá byť od banky, s odkazom, na ktorý máte kliknúť a zadať heslo. Čo je najlepšie urobiť?",
    options: [
      "Kliknúť na odkaz a rýchlo zadať heslo",
      "Odkaz nekliknúť, radšej si to overiť priamo na webe alebo v appke banky",
      "Poslať heslo e-mailom naspäť",
      "Preposlať e-mail susedovi",
      "Vytlačiť si e-mail pre istotu",
      "Odpovedať na e-mail otázkou „kto ste?“",
      "Nechať e-mail bez povšimnutia v priečinku navždy",
      "Kliknúť na odkaz, ale heslo zadať až o hodinu"
    ],
    correct: 1
  },
  {
    q: "Niekto vám zatelefonuje, predstaví sa ako pracovník banky a pýta si kód, ktorý vám prišiel SMS-kou. Čo urobíte?",
    options: [
      "Kód mu nadiktujem, veď je z banky",
      "Hovor ukončím a sám/sama zavolám banke na známe číslo",
      "Kód pošlem SMS-kou naspäť",
      "Opýtam sa ho na priezvisko a potom kód poviem",
      "Kód poviem len z polovice",
      "Počkám, kým zavolá znova",
      "Poviem mu kód, ak sa poponáhľa",
      "Požiadam ho, nech zavolá zajtra"
    ],
    correct: 1
  },
  {
    q: "Niekto vám sľubuje: „Vlož 300 € a do mesiaca máš 6 000 €, na 100 %.“ Čo si o tom myslíte?",
    options: [
      "Znie to výborne, treba konať rýchlo",
      "Takmer isto ide o podvod – nikto nemôže garantovať takýto zisk",
      "Je to úplne bežná ponuka od banky",
      "Keďže to písali na internete, musí to byť pravda",
      "Malá suma znamená, že sa nemôže nič stať",
      "Je to štátna dotácia pre dôchodcov",
      "Treba sa poponáhľať, kým akcia trvá",
      "Ak to zdieľa viac ľudí, je to určite pravda"
    ],
    correct: 1
  },
  {
    q: "Opýtate sa ChatGPTu na niečo dôležité a odpovie veľmi sebavedomo. Môže sa AI aj tak mýliť?",
    options: [
      "Nie, AI sa nikdy nemýli",
      "Áno, AI sa môže mýliť, aj keď znie sebavedomo – dôležité veci si treba overiť",
      "Len keď sa jej to povie",
      "Len pri otázkach o počasí",
      "Len v noci",
      "Len ak sa jej niekto opýta po anglicky",
      "Nie, lebo je to počítač",
      "Len raz za rok"
    ],
    correct: 1
  },
  {
    q: "Na fotografii má osoba nezvyčajne veľa prstov na ruke a pozadie vyzerá čudne. Čo si môžete pomyslieť?",
    options: [
      "Fotoaparát bol pokazený",
      "Fotografiu mohla vytvoriť umelá inteligencia",
      "Je to úplne bežné na fotografiách",
      "Fotka je určite pravá",
      "Bol to len zlý uhol fotenia",
      "Ide o starú fotografiu",
      "Fotoaparát mal nesprávny čas",
      "Obrázok bol vytlačený na starej tlačiarni"
    ],
    correct: 1
  },
  {
    q: "Príspevok na Facebooku je celý VEĽKÝMI PÍSMENAMI, plný výkričníkov, a píše: „Zdieľaj HNEĎ, kým to nezmažú!“ Čo to väčšinou znamená?",
    options: [
      "Je to určite overená a pravdivá správa",
      "Ide často o poplašnú správu (hoax) – najprv si to treba overiť",
      "Treba to hneď zdieľať ďalej",
      "Je to oficiálna správa od úradu",
      "Výkričníky dokazujú, že je to dôležité a pravdivé",
      "Čím viac zdieľaní, tým je to pravdivejšie",
      "Je to vždy vtip a netreba to riešiť",
      "Znamená to, že správu napísal novinár"
    ],
    correct: 1
  },
  {
    q: "Niekto po telefóne tvrdí, že je z banky, a pýta si váš PIN kód. Čo je pravda?",
    options: [
      "Banka si môže PIN vypýtať, ak je to naliehavé",
      "Banka nikdy nežiada PIN ani heslo telefonicky",
      "PIN sa dá povedať, ak volajúci pozná vaše meno",
      "Stačí povedať polovicu PIN kódu",
      "Je to v poriadku, ak volá z čísla banky",
      "PIN možno poslať v SMS",
      "Banka môže o PIN požiadať e-mailom",
      "Je to bezpečné, ak si hovor nahráva"
    ],
    correct: 1
  },
  {
    q: "AI vám poradí, aby ste zrušili poistku alebo investovali úspory. Čo je najlepší prístup?",
    options: [
      "Urobiť to hneď, veď to AI poradila",
      "Radu si overiť a rozhodnúť sa sám/sama, prípadne s odborníkom",
      "Radu úplne ignorovať",
      "Rozhodnúť sa podľa hodu mincou",
      "Počkať, kým to AI povie trikrát",
      "Nechať rozhodnutie úplne na AI",
      "Urobiť to, len ak to znie sebavedomo",
      "Rozhodnutie odkladať navždy"
    ],
    correct: 1
  }
];
