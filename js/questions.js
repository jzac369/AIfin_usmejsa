// ============================================================
// OTÁZKY PRE VSTUPNÝ A VÝSTUPNÝ KVÍZ
// Téma: "Ako sa nenechať oklamať" (na základe brožúry pre seniorov -
// phishing, vishing, investičné podvody, AI halucinácie, deepfake
// fotografie, hoaxy, zlaté pravidlá bezpečnosti).
// Obe sady sa pýtajú na rovnakých 8 tém v rovnakom poradí, ale inak
// formulovane. Vstupný kvíz je zámerne náročnejší (dlhšie scenáre,
// jemnejšie rozdiely medzi možnosťami), výstupný kvíz je jednoduchší
// (kratšie a priamočiarejšie otázky) - aby sa nedalo len "odpísať".
// correct = index správnej odpovede (0-3)
// ============================================================

export const ENTRY_QUIZ = [
  {
    q: "Dostanete e-mail, ktorý vyzerá byť od vašej banky. Text vás vyzýva, aby ste klikli na odkaz a „overili“ svoje prihlasovacie údaje, inak vám banka do 24 hodín zablokuje účet. Čo je najsprávnejší postup?",
    options: [
      "Kliknúť na odkaz v e-maile a rýchlo zadať údaje, aby účet nezablokovali",
      "Zavolať na číslo uvedené priamo v podozrivom e-maile a overiť si to",
      "Neklikať na odkaz, e-mail zmazať a prípadne kontaktovať banku cez oficiálnu appku alebo web",
      "Preposlať e-mail rodine, aby vedeli, že sa niečo deje"
    ],
    correct: 2
  },
  {
    q: "Zavolá vám osoba, ktorá znie profesionálne, predstaví sa menom a priezviskom, tvrdí, že je z vašej banky, a pýta si od vás overovací kód, ktorý vám práve prišiel SMS-kou, aby mohla „zablokovať podozrivú transakciu“. Čo urobíte?",
    options: [
      "Nadiktujem kód, veď mi ho poslala banka, tak to musí byť v poriadku",
      "Hovor ukončím a sám/sama zavolám banke na oficiálne číslo z karty alebo webu",
      "Kód nadiktujem, len ak volajúci vie moje meno a dátum narodenia",
      "Overím si volajúceho tak, že sa ho opýtam na číslo jeho zamestnaneckého preukazu"
    ],
    correct: 1
  },
  {
    q: "Na sociálnej sieti vidíte reklamu: „Investujte 300 € a do mesiaca máte istých 6 000 €. Obmedzený počet miest, iba dnes!“ Čo o tejto ponuke platí najpravdepodobnejšie?",
    options: [
      "Je to výnimočná, no legitímna príležitosť, treba konať rýchlo",
      "Ide takmer isto o podvod – vysoký garantovaný zisk bez rizika v skutočnosti neexistuje",
      "Je to bežný bankový produkt, len s vyšším úrokom",
      "Časové obmedzenie „len dnes“ dokazuje, že ponuka je vzácna a výhodná"
    ],
    correct: 1
  },
  {
    q: "Opýtate sa AI chatbota (napríklad ChatGPTu) na dôležitú informáciu. Odpovie rýchlo, sebavedomo a s presnými detailmi. Čo by ste mali vedieť?",
    options: [
      "AI sa v takýchto veciach nikdy nemýli, informácie sú vždy overené",
      "AI môže niekedy „halucinovať“ – vymyslieť si presvedčivo znejúcu, no nesprávnu odpoveď, preto je dobré si dôležité veci overiť",
      "Halucinácia sa týka len obrázkov, nie textových odpovedí",
      "Stačí sa AI opýtať znova a druhá odpoveď bude vždy správna"
    ],
    correct: 1
  },
  {
    q: "Na fotografii zdieľanej na internete si všimnete, že osoba má na ruke šesť prstov a pozadie za ňou vyzerá mierne rozmazané a nelogické. Čo to môže naznačovať?",
    options: [
      "Fotoaparát mal len nesprávne nastavenie",
      "Fotografia mohla byť vytvorená alebo upravená umelou inteligenciou",
      "Je to dôkaz, že fotografia je stopercentne pravá",
      "Je to len problém s rozlíšením obrazovky, na ktorej sa pozeráte"
    ],
    correct: 1
  },
  {
    q: "Na sociálnej sieti sa šíri príspevok písaný VEĽKÝMI PÍSMENAMI s množstvom výkričníkov, bez uvedeného autora, s výzvou „Zdieľajte okamžite, kým to nezmažú!“. Čo je typickým znakom takéhoto hoaxu?",
    options: [
      "Pokojný a vecný štýl písania",
      "Snaha vyvolať strach alebo naliehavosť a čo najrýchlejšie zdieľanie bez overenia",
      "Odkaz na oficiálnu webovú stránku úradu",
      "Nízky počet zdieľaní a komentárov"
    ],
    correct: 1
  },
  {
    q: "Zamestnanec banky vám telefonuje a žiada vás, aby ste mu nadiktovali PIN kód ku karte, pretože „to potrebuje na zablokovanie podozrivej platby“. Čo je pravda?",
    options: [
      "Skutočná banka môže o PIN požiadať, ak ide o núdzovú situáciu",
      "Skutočná banka nikdy nežiada PIN, heslo ani autorizačný kód telefonicky ani e-mailom",
      "PIN možno nadiktovať, ak volajúci pozná číslo karty",
      "Je to bezpečné, ak si to volajúci nahráva pre „kontrolu kvality“"
    ],
    correct: 1
  },
  {
    q: "Umelá inteligencia vám na základe opísanej situácie odporučí konkrétny finančný krok (napríklad zrušiť poistku alebo investovať úspory). Ako by ste mali k takejto rade pristupovať?",
    options: [
      "Odporúčanie AI vždy okamžite vykonať bez ďalšieho overenia",
      "Radu úplne ignorovať, pretože pochádza od počítača",
      "Brať ju ako podnet na zamyslenie, informácie si overiť a dôležité rozhodnutie urobiť sám/sama, prípadne po konzultácii s odborníkom",
      "Nechať rozhodnutie úplne na AI, aby sa ušetril čas"
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
      "Preposlať e-mail susedovi"
    ],
    correct: 1
  },
  {
    q: "Niekto vám zatelefonuje, predstaví sa ako pracovník banky a pýta si kód, ktorý vám prišiel SMS-kou. Čo urobíte?",
    options: [
      "Kód mu nadiktujem, veď je z banky",
      "Hovor ukončím a sám/sama zavolám banke na známe číslo",
      "Kód pošlem SMS-kou naspäť",
      "Počkám, kým zavolá znova"
    ],
    correct: 1
  },
  {
    q: "Niekto vám sľubuje: „Vlož 300 € a do mesiaca máš 6 000 €, na 100 %.“ Čo si o tom myslíte?",
    options: [
      "Znie to výborne, treba konať rýchlo",
      "Takmer isto ide o podvod – nikto nemôže garantovať takýto zisk",
      "Je to úplne bežná ponuka od banky",
      "Keďže to písali na internete, musí to byť pravda"
    ],
    correct: 1
  },
  {
    q: "Opýtate sa ChatGPTu na niečo dôležité a odpovie veľmi sebavedomo. Môže sa AI aj tak mýliť?",
    options: [
      "Nie, AI sa nikdy nemýli",
      "Áno, AI sa môže mýliť, aj keď znie sebavedomo – dôležité veci si treba overiť",
      "Len keď sa jej to povie",
      "Len pri otázkach o počasí"
    ],
    correct: 1
  },
  {
    q: "Na fotografii má osoba nezvyčajne veľa prstov na ruke a pozadie vyzerá čudne. Čo si môžete pomyslieť?",
    options: [
      "Fotoaparát bol pokazený",
      "Fotografiu mohla vytvoriť umelá inteligencia",
      "Je to úplne bežné na fotografiách",
      "Fotka je určite pravá"
    ],
    correct: 1
  },
  {
    q: "Príspevok na Facebooku je celý VEĽKÝMI PÍSMENAMI, plný výkričníkov, a píše: „Zdieľaj HNEĎ, kým to nezmažú!“ Čo to väčšinou znamená?",
    options: [
      "Je to určite overená a pravdivá správa",
      "Ide často o poplašnú správu (hoax) – najprv si to treba overiť",
      "Treba to hneď zdieľať ďalej",
      "Výkričníky dokazujú, že je to dôležité a pravdivé"
    ],
    correct: 1
  },
  {
    q: "Niekto po telefóne tvrdí, že je z banky, a pýta si váš PIN kód. Čo je pravda?",
    options: [
      "Banka si môže PIN vypýtať, ak je to naliehavé",
      "Banka nikdy nežiada PIN ani heslo telefonicky",
      "PIN sa dá povedať, ak volajúci pozná vaše meno",
      "Je to v poriadku, ak volá z čísla banky"
    ],
    correct: 1
  },
  {
    q: "AI vám poradí, aby ste zrušili poistku alebo investovali úspory. Čo je najlepší prístup?",
    options: [
      "Urobiť to hneď, veď to AI poradila",
      "Radu si overiť a rozhodnúť sa sám/sama, prípadne s odborníkom",
      "Radu úplne ignorovať",
      "Nechať rozhodnutie úplne na AI"
    ],
    correct: 1
  }
];
