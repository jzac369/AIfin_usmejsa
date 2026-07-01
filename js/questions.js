// ============================================================
// OTÁZKY PRE VSTUPNÝ A VÝSTUPNÝ KVÍZ
// Téma: "AI ako pomocník pri finančných rozhodnutiach"
// Obe sady majú rovnaké témy, ale inak formulované otázky
// aj odpovede (aby sa nedalo len "odpísať" z prvého kvízu).
// correct = index správnej odpovede (0-3)
// ============================================================

export const ENTRY_QUIZ = [
  {
    q: "Môže vám AI chatbot (napr. ChatGPT) dať finančné odporúčanie, ktoré znie presvedčivo, no v skutočnosti je nesprávne?",
    options: [
      "Nie, AI sa nikdy nemýli",
      "Áno, AI môže tvrdiť nesprávne veci s veľkou istotou (tzv. „halucinácia“)",
      "Len ak sa jej to prikáže",
      "Len pri otázkach o počasí"
    ],
    correct: 1
  },
  {
    q: "Videli ste video, kde slávna osobnosť odporúča „zaručene výnosnú“ investíciu. Čo je najbezpečnejší prvý krok?",
    options: [
      "Hneď investovať, kým akcia trvá",
      "Poslať peniaze na uvedený účet",
      "Overiť si osobnosť a ponuku z nezávislých zdrojov, video môže byť deepfake",
      "Zdieľať video ďalej priateľom"
    ],
    correct: 2
  },
  {
    q: "Zavolá vám hlas, ktorý znie presne ako váš príbuzný a žiada urgentne peniaze. Čo to môže byť?",
    options: [
      "Určite je to naozaj on/ona",
      "Technická porucha telefónu",
      "Možné klonovanie hlasu pomocou AI – treba si to overiť iným kanálom",
      "Bežný spam email"
    ],
    correct: 2
  },
  {
    q: "Ste ochotný/á zadať AI nástroju (chatbotu) svoje rodné číslo alebo číslo bankového účtu, aby vám „poradil“ s financiami?",
    options: [
      "Áno, AI to potrebuje na presnú radu",
      "Nie, citlivé osobné a bankové údaje AI nástrojom nezdieľam",
      "Iba ak to AI o to pekne požiada",
      "Áno, ak je to zadarmo"
    ],
    correct: 1
  },
  {
    q: "Ako by ste mali pristupovať k finančnej rade, ktorú vám dá AI nástroj?",
    options: [
      "Slepo ju nasledovať, AI vie viac ako ja",
      "Ignorovať ju úplne, AI je nanič",
      "Brať ju ako podnet na zamyslenie a overiť si ju u dôveryhodného zdroja/odborníka",
      "Rozhodnúť sa hodením mincou"
    ],
    correct: 2
  },
  {
    q: "Na e-shope vidíte desiatky nadšených AI-generovaných recenzií o investičnom produkte. Čo to znamená?",
    options: [
      "Produkt je určite dôveryhodný",
      "Recenzie môžu byť falošné a umelo vytvorené, treba byť opatrný",
      "Recenzie píšu vždy len skutoční ľudia",
      "Nič to neznamená, recenzie sa nedajú generovať"
    ],
    correct: 1
  },
  {
    q: "Na čo môže byť AI užitočným pomocníkom pri financiách, ak sa používa rozumne?",
    options: [
      "Na automatické okradnutie účtu",
      "Napríklad na prehľad výdavkov, vysvetlenie pojmov alebo prípravu na rozhodnutie (nie ako jediný zdroj pravdy)",
      "Na nahradenie bankového dozoru úplne",
      "AI nie je na financie vôbec vhodná"
    ],
    correct: 1
  },
  {
    q: "Dostanete e-mail, ktorý vyzerá, že je od vašej banky a AI-nástroj v ňom „potvrdzuje“ výhodnú investičnú ponuku. Čo je najsprávnejší postup?",
    options: [
      "Kliknúť na odkaz v e-maile a rovno zadať prihlasovacie údaje",
      "Overiť si ponuku priamo cez oficiálnu appku/web banky alebo telefonicky, nie cez odkaz z e-mailu",
      "Odpovedať na e-mail so svojimi údajmi",
      "Preposlať e-mail všetkým kontaktom"
    ],
    correct: 1
  }
];

export const EXIT_QUIZ = [
  {
    q: "Dokáže sa umelá inteligencia „pomýliť“ a s plnou istotou vám povedať nepravdivú finančnú informáciu?",
    options: [
      "Nie, počítač nikdy neluže",
      "Áno – tento jav sa nazýva halucinácia a treba si informácie overovať",
      "Iba pri prekladoch textu",
      "Iba v noci, keď je nižšia prevádzka serverov"
    ],
    correct: 1
  },
  {
    q: "Na sociálnej sieti sa šíri klip, kde známy podnikateľ sľubuje isté zbohatnutie z novej platformy. Ako zareagujete?",
    options: [
      "Okamžite pošlem peniaze, kým je ponuka platná",
      "Skontrolujem cez viacero nezávislých zdrojov, či ide o reálnu osobu a ponuku, keďže videá sa dajú sfalšovať (deepfake)",
      "Prepošlem to rodine, nech tiež investujú",
      "Uverím, lebo tvár aj hlas vyzerajú úplne reálne"
    ],
    correct: 1
  },
  {
    q: "Príbuzný vám telefonicky, hlasom, ktorý znie úplne autenticky, žiada okamžite poslať peniaze. Čo je rozumné urobiť?",
    options: [
      "Poslať peniaze ihneď, je to predsa jeho/jej hlas",
      "Zavesiť a overiť si to priamo s danou osobou iným spôsobom (napr. spätné volanie na známe číslo)",
      "Nič nerobiť a hovor ignorovať bez overenia",
      "Nahlásiť to len na sociálnej sieti"
    ],
    correct: 1
  },
  {
    q: "AI aplikácia vás žiada o číslo účtu, PIN alebo rodné číslo výmenou za „presnejšiu“ finančnú radu. Čo spravíte?",
    options: [
      "Údaje poskytnem, veď je to len program",
      "Takéto citlivé údaje AI nástroju neposkytnem",
      "Poskytnem ich, len ak appka vyzerá profesionálne",
      "Poskytnem ich výmenou za zľavu"
    ],
    correct: 1
  },
  {
    q: "Aký je najrozumnejší spôsob, ako pracovať s odporúčaním od AI nástroja v oblasti financií?",
    options: [
      "Vždy ho poslúchnuť bez rozmýšľania",
      "Úplne ho zavrhnúť, lebo pochádza od stroja",
      "Použiť ho ako jeden z podkladov a overiť si ho u odborníka alebo v spoľahlivom zdroji",
      "Rozhodnúť sa podľa toho, ako pekne to AI naformulovala"
    ],
    correct: 2
  },
  {
    q: "Pri investičnom produkte nájdete množstvo takmer identických nadšených recenzií napísaných v rovnakom štýle. Čo to naznačuje?",
    options: [
      "Ide o jednoznačný dôkaz kvality produktu",
      "Mohlo by ísť o umelo (AI) vygenerované recenzie, treba byť obozretný",
      "Recenzie nikdy nemôžu byť napísané strojom",
      "Je to úplne bežné a nič to neznamená"
    ],
    correct: 1
  },
  {
    q: "V čom môže byť AI reálne prínosná pri vašich osobných financiách?",
    options: [
      "V úplnom nahradení vlastného úsudku",
      "Napríklad pri zhrnutí výdavkov, vysvetlení pojmov či príprave otázok pre poradcu – no nie ako jediný rozhodujúci zdroj",
      "V garantovanom zbohatnutí do týždňa",
      "AI nemá vo financiách žiadne využitie"
    ],
    correct: 1
  },
  {
    q: "Príde vám e-mail, ktorý pôsobí ako od banky, a AI chatbot v ňom „potvrdzuje“ výhodnú investíciu. Aký je najbezpečnejší postup?",
    options: [
      "Kliknúť na priložený odkaz a prihlásiť sa cez neho",
      "Odpísať s vlastnými prihlasovacími údajmi pre kontrolu",
      "Overiť ponuku priamo cez oficiálnu appku alebo linku banky, nie cez odkaz z e-mailu",
      "Preposlať e-mail ďalej rodine, nech si to tiež pozrú"
    ],
    correct: 2
  }
];
