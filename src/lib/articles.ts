/**
 * Articolele site-ului.
 *
 * Ținute în cod, nu într-un sistem de conținut: sunt puține, se schimbă rar și
 * așa rămân sub control de versiune, alături de restul produsului. Textul e
 * structurat în blocuri, nu în HTML liber, ca tipografia să fie aceeași peste
 * tot și să nu se strecoare marcaje ciudate din copiat.
 */

export type Block =
  | { type: "p"; text: string }
  | { type: "h2"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "quote"; text: string };

export interface Article {
  slug: string;
  title: string;
  /** Titlul din rezultatele căutării. Mai scurt și mai direct decât cel de pe pagină. */
  metaTitle: string;
  description: string;
  keywords: string[];
  published: string;
  updated: string;
  readingMinutes: number;
  lede: string;
  body: Block[];
}

export const ARTICLES: Article[] = [
  {
    slug: "convingeri-limitative",
    title: "Convingeri limitative: cum le recunoști în propriile tale cuvinte",
    metaTitle: "Convingeri limitative: cum le recunoști și cum le schimbi",
    description:
      "Convingerile limitative nu sună a convingeri. Sună a adevăruri despre " +
      "lume. Cum le identifici în felul în care vorbești și ce le schimbă cu adevărat.",
    keywords: [
      "convingeri limitative",
      "credinte limitative",
      "cum scap de convingeri limitative",
      "tipare de gandire",
      "convingeri despre sine",
    ],
    published: "2026-08-14",
    updated: "2026-09-07",
    readingMinutes: 7,
    lede:
      "O convingere limitativă nu se simte ca o părere. Se simte ca felul în " +
      "care stau lucrurile. De aceea e greu de văzut din interior — și de aceea " +
      "se schimbă altfel decât crede toată lumea.",
    body: [
      {
        type: "p",
        text: "Dacă ai încercat vreodată să-ți „schimbi mentalitatea” și n-a ținut mai mult de trei zile, nu e din lipsă de voință. E pentru că ai atacat lucrul greșit. Convingerile care ne conduc nu stau la nivelul afirmațiilor pe care ni le spunem dimineața în oglindă. Stau mai jos, în presupuneri pe care nici măcar nu le formulăm, pentru că ni se par evidente.",
      },
      { type: "h2", text: "De ce nu le vezi" },
      {
        type: "p",
        text: "O convingere limitativă nu se prezintă niciodată ca opinie. Nimeni nu gândește „am convingerea că nu merit lucruri bune”. Gândește „nu are rost să cer, oricum nu se dă”. Prima e o părere despre tine, a doua pare o observație despre lume. Asta e capcana: mintea nu-ți arată regula, îți arată doar concluzia, iar concluzia pare rezonabilă.",
      },
      {
        type: "p",
        text: "Ele au și un alt avantaj nedrept: se autoconfirmă. Dacă crezi că cererea de ajutor te face să pari incapabil, nu ceri. Nefiind ajutat, te descurci mai greu și mai obosit. La final ai dovada că e greu — dar nu vezi că greutatea vine din regula însăși, nu din realitate.",
      },
      { type: "h2", text: "Semnele după care le prinzi" },
      {
        type: "p",
        text: "Nu te uita la ce crezi. Uită-te la cum vorbești. Convingerile ies la suprafață în cuvinte mici, pe care le rostim fără să le auzim:",
      },
      {
        type: "ul",
        items: [
          "„Întotdeauna” și „niciodată”. O regulă absolută despre o lume care nu e absolută aproape sigur ascunde o convingere, nu o statistică.",
          "„Trebuie” fără agent. „Trebuie să fiu disponibil” — cine cere asta? Dacă nu poți numi persoana, regula e a ta, moștenită de undeva.",
          "„Ce fel de om ar…”. Judecata rapidă despre alții spune ce ai voie și ce nu ai voie să fii tu.",
          "Justificarea nesolicitată. Când explici de ce ai făcut ceva firesc, undeva există o regulă care spune că nu aveai voie.",
          "Iritarea disproporționată. Cineva face relaxat exact lucrul pe care tu ți-l interzici, și te enervează fără motiv proporțional.",
        ],
      },
      {
        type: "p",
        text: "Ultimul semn e cel mai util și cel mai puțin folosit. Iritarea gratuită e aproape întotdeauna o graniță internă atinsă. Colegul care pleacă la fix, prietena care refuză fără să explice, cineva care își spune părerea fără să se scuze — dacă te deranjează mai mult decât ar merita, întreabă-te ce anume îți interzici tu acolo.",
      },
      { type: "h2", text: "De unde vin" },
      {
        type: "p",
        text: "Aproape toate au fost, cândva, soluții bune. Un copil care învață că e mai în siguranță dacă nu cere nimic a învățat ceva adevărat despre casa lui de atunci. Regula l-a protejat. Problema e că regulile nu au dată de expirare: rămân active decenii după ce contextul care le-a produs a dispărut.",
      },
      {
        type: "quote",
        text: "O convingere limitativă nu e un defect de caracter. E o soluție veche care a rămas pornită.",
      },
      {
        type: "p",
        text: "Asta contează practic, nu doar emoțional. Dacă tratezi convingerea ca pe o prostie de care trebuie să scapi, o parte din tine o va apăra — fiindcă acea parte își amintește la ce a folosit. Dacă o tratezi ca pe o soluție care și-a făcut treaba și acum costă mai mult decât aduce, nu mai ai cu cine să te lupți.",
      },
      { type: "h2", text: "De ce nu funcționează afirmațiile pozitive" },
      {
        type: "p",
        text: "„Merit lucruri bune” nu înlocuiește „nu are rost să cer”, pentru că nu contrazice nimic din experiența ta. Creierul compară afirmația cu ce știe și o respinge ca fiind falsă. Rezultatul e adesea invers: repetând ceva ce nu crezi, întărești sentimentul că adevărul e opusul.",
      },
      {
        type: "p",
        text: "Ce mută o convingere nu e o propoziție mai frumoasă, ci o dovadă nouă. Nu argumentată — trăită. Ceri ajutorul o dată, în ceva mic, și observi ce s-a întâmplat de fapt. Predai ceva la nouăzeci la sută și te uiți dacă s-a prăbușit ceva. Convingerile s-au format din experiențe repetate; se dizolvă tot din experiențe, nu din raționamente.",
      },
      { type: "h2", text: "Ce faci practic" },
      {
        type: "ul",
        items: [
          "Notează, o săptămână, propozițiile cu „trebuie”, „întotdeauna” și „niciodată” pe care le spui sau le gândești. Nu le comenta, doar adună-le.",
          "Pentru fiecare, întreabă: cine a spus asta prima dată? Dacă apare un chip, ai găsit sursa.",
          "Alege una singură. Cea mai mică, nu cea mai dureroasă.",
          "Formulează convingerea nouă ca pe ceva ce ai putea crede mâine, nu ca pe opusul ei. Nu „nu trebuie să fiu perfect”, ci „pot preda ceva bun fără să fie impecabil, și tot rămân în picioare”.",
          "Fă un experiment mic care o testează, și notează ce s-a întâmplat concret — cine ce a spus, ce consecință reală a fost.",
        ],
      },
      {
        type: "p",
        text: "Ultimul pas e cel care contează. Fără notat, mintea rescrie ce s-a întâmplat ca să se potrivească cu regula veche. Cu notat, ai dovezi pe care nu le poate reinterpreta.",
      },
      { type: "h2", text: "Când merită ajutor" },
      {
        type: "p",
        text: "Auto-observația e utilă și suficientă pentru majoritatea tiparelor care ne încurcă în viața de zi cu zi. Nu e suficientă când în joc sunt traume, depresie, anxietate care îți limitează funcționarea, sau gânduri de a-ți face rău. Acolo e nevoie de un psihoterapeut, iar asta nu e un eșec — e diferența dintre a-ți aranja singur bucătăria și a-ți repara singur instalația electrică.",
      },
    ],
  },

  {
    slug: "perfectionism",
    title: "Perfecționismul nu e despre standarde înalte",
    metaTitle: "Perfecționismul: de unde vine și cum se schimbă",
    description:
      "Perfecționismul nu e ambiție dusă la extrem. E o strategie de evitare a " +
      "rușinii. Cum se recunoaște, ce îl întreține și ce îl slăbește cu adevărat.",
    keywords: [
      "perfectionism",
      "cum scap de perfectionism",
      "perfectionist",
      "frica de esec",
      "sindromul impostorului",
    ],
    published: "2026-08-21",
    updated: "2026-09-07",
    readingMinutes: 6,
    lede:
      "Oamenii cu standarde înalte termină lucruri. Perfecționiștii amână, " +
      "rescriu și se epuizează. Diferența nu e cât de sus e ștacheta, ci ce se " +
      "întâmplă dacă n-o atingi.",
    body: [
      {
        type: "p",
        text: "Perfecționismul e singurul defect pe care oamenii îl declară la interviuri de angajare, pentru că sună a calitate deghizată. Nu e. Cineva cu standarde înalte livrează des și bine, iar când greșește ajustează. Perfecționistul livrează rar, târziu, și trăiește între două stări: „încă nu e gata” și ușurarea scurtă de după, urmată imediat de următoarea nemulțumire.",
      },
      { type: "h2", text: "Testul care le desparte" },
      {
        type: "p",
        text: "Întrebarea nu e „cât de bine vrei să iasă”, ci „ce se întâmplă cu tine dacă nu iese”. Omul cu standarde înalte e dezamăgit de rezultat. Perfecționistul se simte demascat. Prima e o reacție la muncă, a doua e o reacție la propria valoare — și de aceea perfecționismul doare disproporționat față de miza reală.",
      },
      {
        type: "quote",
        text: "Perfecționismul nu e căutarea excelenței. E o armură împotriva rușinii de a fi văzut greșind.",
      },
      { type: "h2", text: "Cum se întreține singur" },
      {
        type: "p",
        text: "Mecanismul e simplu și de aceea e greu de spart. Amâni un lucru pentru că nu ai timp să-l faci „cum trebuie”. Amânarea creează presiune. Presiunea face rezultatul mai slab decât ar fi fost. Rezultatul slab confirmă că trebuia să-i acorzi mai mult timp și mai multă grijă. Concluzia întărește regula care a produs amânarea.",
      },
      {
        type: "p",
        text: "La asta se adaugă un detaliu perfid: perfecționismul chiar funcționează uneori. Ai livrat lucruri foarte bune și ai fost lăudat pentru ele. Deci ai dovezi că regula ajută. Ce nu se vede în dovezi sunt lucrurile pe care nu le-ai început niciodată, orele de somn pierdute și proiectele abandonate în versiunea a șaptea.",
      },
      { type: "h2", text: "De unde vine" },
      {
        type: "p",
        text: "Cel mai des, dintr-o casă în care aprecierea era condiționată de rezultat. Nu neapărat dintr-o casă rea — uneori dintr-una foarte iubitoare, în care se întâmpla însă ca atenția să vină mai vizibil la note bune decât la restul. Copilul nu deduce „părinților le plac notele”. Deduce „sunt în siguranță când sunt impecabil”.",
      },
      {
        type: "p",
        text: "Mai există o sursă, mai rar recunoscută: un frate sau o soră cu probleme. Copilul care a decis să nu mai adauge greutăți casei devine adultul care nu-și permite să greșească, pentru că rolul lui a fost, de la început, să fie cel care nu face probleme.",
      },
      { type: "h2", text: "Ce nu ajută" },
      {
        type: "ul",
        items: [
          "„Fii mai blând cu tine.” E o instrucțiune fără procedură. Nimeni nu știe ce butoane să apese.",
          "Scăderea standardelor ca decizie. Perfecționismul nu e o setare, e o protecție. Coborâtă prin decizie, revine cu dobândă.",
          "Comparația cu alții. Perfecționistul o folosește ca dovadă suplimentară, în ambele direcții.",
        ],
      },
      { type: "h2", text: "Ce slăbește tiparul" },
      {
        type: "p",
        text: "Experimente mici, cu observație scrisă. Nu „relaxează-te”, ci: predă un lucru la nouăzeci la sută și notează seara, în trei rânduri, ce s-a întâmplat concret. Cine a comentat. Ce anume. Ce consecință reală a avut.",
      },
      {
        type: "p",
        text: "Aproape întotdeauna, răspunsul e „nimic”. Nu se prăbușește nimic. Iar „nimic” repetat de zece ori e singura formă de dovadă pe care mintea o acceptă împotriva unei reguli vechi. Nu argumentul, ci experiența înregistrată.",
      },
      {
        type: "p",
        text: "Al doilea exercițiu care mută ceva: numește vocea. Când apare gândul „n-are rost dacă nu iese perfect”, spune-ți în minte a cui e propoziția și din ce an. Nu o contrazice — doar etichetează. Asta o transformă dintr-un adevăr despre tine într-o amintire despre altcineva, iar amintirile au mult mai puțină autoritate.",
      },
    ],
  },

  {
    slug: "convingeri-despre-bani",
    title: "Convingerile despre bani se moștenesc, nu se calculează",
    metaTitle: "Convingeri despre bani: de unde vin și cum le schimbi",
    description:
      "Relația cu banii nu e o chestiune de educație financiară. E un set de " +
      "reguli învățate în copilărie, care funcționează indiferent cât ai în cont.",
    keywords: [
      "convingeri despre bani",
      "relatia cu banii",
      "mentalitate saracie",
      "anxietate financiara",
      "blocaje financiare",
    ],
    published: "2026-08-28",
    updated: "2026-09-07",
    readingMinutes: 6,
    lede:
      "Oamenii cu bani pot trăi cu frica de a-i pierde. Oamenii fără bani pot " +
      "cheltui liniștiți. Suma din cont explică surprinzător de puțin din felul " +
      "în care ne purtăm cu banii.",
    body: [
      {
        type: "p",
        text: "Dacă relația cu banii ar fi o chestiune de informație, educația financiară ar rezolva-o. Nu o rezolvă. Oameni care știu perfect ce e un fond de urgență nu reușesc să-l constituie; oameni cu economii solide se trezesc noaptea calculând. Ceea ce operează acolo nu e aritmetică, ci un set de reguli învățate înainte de a ști să calculezi.",
      },
      { type: "h2", text: "Regulile obișnuite" },
      {
        type: "p",
        text: "Aproape toate se învață acasă, din atmosferă mai mult decât din vorbe. Câteva dintre cele mai frecvente:",
      },
      {
        type: "ul",
        items: [
          "„Banii se pot termina oricând.” Produce economisire anxioasă și imposibilitatea de a te bucura de ce ai. Nu se vindecă prin sume mai mari — pragul se mută odată cu ele.",
          "„Banii se fac greu și cinstit.” Face ca orice câștig ușor sau plăcut să pară suspect, inclusiv o mărire meritată.",
          "„Dacă cer, deranjez.” Blochează negocierea salariului, urmărirea unei facturi neplătite, ridicarea prețului la propriile servicii.",
          "„Cheltuiala pe mine e egoism.” Cumperi fără probleme pentru copil, pentru casă, pentru alții — dar nu pentru tine, sau numai cu justificare.",
          "„Cine are bani s-a aranjat.” Face succesul propriu incompatibil cu imaginea de om corect, deci autosabotat.",
        ],
      },
      { type: "h2", text: "De ce nu se schimbă cu suma" },
      {
        type: "p",
        text: "Pentru că regula nu e despre bani, e despre siguranță. Cineva care a crescut într-o casă în care s-a numărat fiecare leu nu a învățat o cifră, a învățat o stare: vigilența. Vigilența nu se oprește când cifra crește, pentru că nu de cifră ținea.",
      },
      {
        type: "quote",
        text: "Nu suma din cont decide dacă te simți în siguranță. Decide regula pe care ai învățat-o despre ce înseamnă siguranța.",
      },
      { type: "h2", text: "Cum le găsești pe ale tale" },
      {
        type: "p",
        text: "Trei întrebări care scot mai mult decât par:",
      },
      {
        type: "ul",
        items: [
          "Care e prima ta amintire legată de bani în casa în care ai crescut? Nu concluzia — scena. Ce se întâmpla, cine ce spunea, ce simțeai.",
          "Ce sumă ar trebui să ai ca să te simți liniștit? Și dacă ai avea-o mâine, chiar te-ai simți așa? Dacă răspunsul e nu, problema nu e suma.",
          "Când ai cheltuit ultima dată pe tine și te-ai simțit vinovat? Vinovăția arată regula mai clar decât orice raționament.",
        ],
      },
      { type: "h2", text: "Ce mută lucrurile" },
      {
        type: "p",
        text: "La fel ca la orice convingere: experiențe mici, observate. Ceri o dată ce ți se cuvine și notezi ce s-a întâmplat de fapt. Cheltui o sumă mică pe ceva strict pentru tine și observi cât durează disconfortul — de obicei sub zece minute, ceea ce e o informație utilă despre cât de mare e pericolul real.",
      },
      {
        type: "p",
        text: "Și un pas care se sare des: separă regula de persoana de la care ai luat-o. „Tata credea că banii se termină oricând, pentru că în anii lui chiar se terminau.” Propoziția asta face două lucruri deodată — îi dă dreptate lui în contextul lui, și te scoate pe tine din obligația de a trăi în contextul acela.",
      },
    ],
  },

  {
    slug: "tipare-care-se-repeta",
    title: "De ce se repetă aceleași tipare, cu oameni diferiți",
    metaTitle: "Tipare care se repetă în relații: de ce și ce le schimbă",
    description:
      "Aceeași ceartă, cu parteneri diferiți. Aceeași senzație, în echipe " +
      "diferite. Ce se repetă de fapt și de unde se poate rupe lanțul.",
    keywords: [
      "tipare relationale",
      "aceleasi greseli in relatii",
      "de ce aleg aceiasi oameni",
      "tipare care se repeta",
      "atasament",
    ],
    published: "2026-09-04",
    updated: "2026-09-07",
    readingMinutes: 6,
    lede:
      "Când o situație se repetă cu oameni complet diferiți, variabila comună " +
      "nu mai e celălalt. Asta nu înseamnă că e vina ta — înseamnă că ai acces la ea.",
    body: [
      {
        type: "p",
        text: "Există o observație incomodă și utilă: dacă ai avut aceeași ceartă, în esență, cu trei parteneri diferiți, sau te-ai simțit nedreptățit la fel în patru echipe diferite, explicația „am dat peste oameni nepotriviți” devine statistic slabă. Ceva din felul în care intri în relații produce, previzibil, același rezultat.",
      },
      {
        type: "p",
        text: "Asta nu e o acuzație. E singura veste bună posibilă: dacă variabila constantă ești tu, atunci ai acces la ea. Pe ceilalți nu-i poți schimba.",
      },
      { type: "h2", text: "Ce se repetă, de fapt" },
      {
        type: "p",
        text: "Rareori se repetă situația. Se repetă interpretarea. Cineva întârzie la o întâlnire — un om vede trafic, altul vede lipsă de respect. Al doilea nu e mai sensibil, ci are o regulă activă despre cât valorează timpul lui pentru ceilalți, iar întârzierea o confirmă.",
      },
      {
        type: "p",
        text: "De aici, restul se derulează singur. Interpretarea produce o reacție — retragere, reproș, ironie. Reacția produce un răspuns la celălalt. Răspunsul confirmă interpretarea inițială. Bucla se închide, iar la final ai încă o dovadă că lumea e cum credeai.",
      },
      { type: "h2", text: "Cele mai frecvente bucle" },
      {
        type: "ul",
        items: [
          "Retragerea preventivă. Simți că vine respingerea și te răcești primul. Celălalt simte răceala și se distanțează. Ai avut dreptate.",
          "Testarea. Nu ceri direct, ci verifici dacă celălalt își dă seama singur. Nu-și dă seama, pentru că nimeni nu ghicește. Concluzia: nu-i pasă.",
          "Suprafuncționarea. Preiei tot, ca să fii de neînlocuit. Celălalt se retrage din responsabilități. Ajungi epuizat și singur în efort, ceea ce știai de la început.",
          "Amânarea conflictului. Nu spui nimic până când nu mai poți, apoi spui tot deodată. Reacția disproporționată devine subiectul, iar problema reală se pierde.",
        ],
      },
      { type: "h2", text: "De unde vine" },
      {
        type: "p",
        text: "Din primele relații în care am învățat ce se întâmplă când ai nevoie de cineva. Un copil pentru care nevoia era uneori întâmpinată și uneori nu învață să fie vigilent. Unul pentru care nevoia deranja învață să nu aibă nevoi. Ambele sunt adaptări inteligente la mediul de atunci, și ambele produc, treizeci de ani mai târziu, rezultate care nu mai au legătură cu mediul de acum.",
      },
      { type: "h2", text: "De unde se rupe" },
      {
        type: "p",
        text: "Nu din a hotărî că de data asta vei fi altfel. Bucla e mai rapidă decât hotărârea. Se rupe din a o vedea în timp real, ceea ce se antrenează doar în trecut: reconstruiești o situație recentă, încet, și separi ce s-a întâmplat de ce ai crezut că înseamnă.",
      },
      {
        type: "ul",
        items: [
          "Ce s-a întâmplat, exact? Fapte pe care le-ar confirma o cameră de filmat.",
          "Ce am crezut că înseamnă? Aici e regula.",
          "Ce am făcut în urma acelei interpretări?",
          "Ce a făcut celălalt după?",
          "Ce altă explicație ar fi încăput peste aceleași fapte?",
        ],
      },
      {
        type: "p",
        text: "Ultima întrebare e cea care contează. Nu ca să te convingi că cealaltă explicație e adevărată, ci ca să exersezi faptul că mai există una. După suficiente repetiții, în momentul următor apare o pauză scurtă între ce se întâmplă și ce faci tu. În pauza aceea încape tot ce se poate schimba.",
      },
    ],
  },
  {
    slug: "sindromul-impostorului",
    title: "Sindromul impostorului: de ce reușita nu te convinge niciodată",
    metaTitle: "Sindromul impostorului: de ce apare și ce îl slăbește",
    description:
      "Cu cât ai mai multe realizări, cu atât frica de a fi descoperit e mai " +
      "mare. De ce dovezile nu ajută și ce funcționează în locul lor.",
    keywords: [
      "sindromul impostorului",
      "simt ca nu merit",
      "frica de a fi descoperit",
      "nesiguranta la job",
      "stima de sine scazuta",
    ],
    published: "2026-09-05",
    updated: "2026-09-07",
    readingMinutes: 6,
    lede:
      "Ciudățenia sindromului impostorului e că succesul nu îl vindecă. Îl " +
      "hrănește. Fiecare reușită devine încă un lucru pe care va trebui să-l " +
      "susții, și încă o ocazie de a fi demascat.",
    body: [
      {
        type: "p",
        text: "Sentimentul e specific: nu că ești slab, ci că ești descoperit. Că cei din jur au o părere despre tine construită pe o neînțelegere, pe care într-o zi o vor corecta. Apare cel mai des la oameni competenți, ceea ce pare paradoxal doar până înțelegi mecanismul.",
      },
      { type: "h2", text: "De ce dovezile nu ajută" },
      {
        type: "p",
        text: "Pentru că sunt reinterpretate în timp real. Ai fost promovat — a fost noroc, sau nu aveau pe altcineva. Ai fost lăudat — omul e politicos, sau nu știe cât de puțin ai muncit de fapt. Ai livrat un proiect bun — a fost mai ușor decât pare din afară.",
      },
      {
        type: "p",
        text: "Fiecare succes primește o explicație externă, fiecare eșec una internă. Regula nu se atinge niciodată de realitate, pentru că filtrează realitatea înainte să ajungă la ea. De aceea „uită-te la ce ai realizat” nu ajută pe nimeni: dovada intră deja pre-anulată.",
      },
      { type: "h2", text: "De unde vine" },
      {
        type: "p",
        text: "Cel mai des din case în care valoarea era legată de performanță, dar și din situația inversă: copilul căruia i se spunea constant că e deosebit, fără legătură cu ce făcea. Ambele produc același adult, din motive diferite — primul crede că trebuie să merite continuu, al doilea că nu are cum să se ridice la o etichetă pe care nu a câștigat-o.",
      },
      {
        type: "p",
        text: "Există și o sursă socială: să fii primul din familie care ajunge undeva, sau singurul de un anumit fel într-o încăpere. Când nu semeni cu nimeni din jur, mintea caută o explicație, iar cea mai la îndemână e că ai ajuns acolo dintr-o eroare.",
      },
      { type: "h2", text: "Costul ascuns" },
      {
        type: "ul",
        items: [
          "Suprapregătirea. Muncești de trei ori mai mult decât e nevoie, ceea ce confirmă că fără efortul acela ai fi fost descoperit.",
          "Evitarea. Nu aplici, nu ceri, nu propui — deci nu ai ocazia să afli că puteai.",
          "Imposibilitatea de a primi. Un compliment nu poate ateriza nicăieri, ceea ce, în timp, obosește oamenii din jur.",
          "Epuizarea tăcută. Nimeni nu știe cât te costă, pentru că din afară arată doar competență.",
        ],
      },
      { type: "h2", text: "Ce ajută" },
      {
        type: "p",
        text: "Nu convingerea, ci acumularea de date pe care mintea nu le poate rescrie. Un jurnal de fapte, nu de sentimente: ce ai făcut, ce s-a întâmplat, cine ce a spus, cuvânt cu cuvânt. Sentimentele se reinterpretează, citatele nu.",
      },
      {
        type: "p",
        text: "Al doilea lucru care mută ceva e să spui cuiva. Sindromul impostorului trăiește din izolare: fiecare crede că e singurul care simte asta, într-o cameră plină de oameni care simt același lucru. O singură conversație sinceră cu un coleg respectat scade mai mult decât zece liste de realizări.",
      },
      {
        type: "p",
        text: "Și un al treilea, mai puțin plăcut: fă ceva la care ești vizibil mediocru. Un sport nou, un instrument, o limbă. Nu ca metaforă — ca antrenament. Sindromul impostorului e teama de a fi văzut nepriceput; singurul lucru care o slăbește e să fii văzut nepriceput și să constați că nu s-a întâmplat nimic.",
      },
    ],
  },

  {
    slug: "amanarea",
    title: "Amânarea nu e lene. E de obicei frică",
    metaTitle: "De ce amân lucrurile importante și cum ies din amânare",
    description:
      "Amâni exact lucrurile care contează, nu pe cele plictisitoare. Ce spune " +
      "asta despre ce se întâmplă de fapt și ce sparge blocajul.",
    keywords: [
      "amanare",
      "procrastinare",
      "de ce aman",
      "nu ma pot apuca de treaba",
      "blocaj",
    ],
    published: "2026-09-06",
    updated: "2026-09-07",
    readingMinutes: 5,
    lede:
      "Dacă ar fi lene, ai amâna și lucrurile ușoare. Dar spălatul vaselor se " +
      "face. Se amână proiectul important, telefonul dificil, textul care " +
      "contează. Asta nu e lene, e altceva.",
    body: [
      {
        type: "p",
        text: "Un test rapid: uită-te la lista lucrurilor pe care le amâni de cel mai mult timp. Aproape sigur nu sunt cele mai plictisitoare, ci cele mai importante. Lenea nu face această selecție. Frica o face.",
      },
      { type: "h2", text: "Ce anume e amenințat" },
      {
        type: "p",
        text: "Atât timp cât nu ai început, ești cineva care ar putea. În clipa în care începi, devii cineva care face — și rezultatul poate fi mediocru. Amânarea protejează o imagine de sine, cu prețul vieții reale.",
      },
      {
        type: "quote",
        text: "Cât timp nu ai încercat, potențialul rămâne intact. Asta e ce apără amânarea.",
      },
      {
        type: "p",
        text: "De aici și ciudățenia că amânarea crește odată cu importanța. Un lucru care nu contează poate fi făcut prost fără consecințe pentru identitatea ta. Un lucru care contează nu.",
      },
      { type: "h2", text: "Celelalte două cauze frecvente" },
      {
        type: "p",
        text: "A doua: sarcina e prea mare pentru a fi vizualizată. Creierul nu amână „scrie primul paragraf”, amână „scrie cartea”. Când nu vezi primul pas concret, nu ai de ce să te apuci, iar vinovăția care urmează face totul și mai greu.",
      },
      {
        type: "p",
        text: "A treia, mai rar recunoscută: nu vrei, de fapt. Unele amânări sunt corecte. Amâni de doi ani un master pe care nu ți-l dorești, dar pe care crezi că ar trebui să-l vrei. Aici soluția nu e disciplina, ci sinceritatea.",
      },
      { type: "h2", text: "Ce funcționează" },
      {
        type: "ul",
        items: [
          "Douăzeci și cinci de minute, cu voie explicită să iasă prost. Scopul nu e progresul, ci dovada că „început și imperfect” e o stare care există și nu doare cât credeai.",
          "Coboară primul pas până devine ridicol de mic. Nu „scrie capitolul”, ci „deschide documentul și scrie titlul”. Dacă tot pare mult, coboară-l din nou.",
          "Spune cu voce tare de ce anume ți-e frică dacă iese prost. De obicei, formulată explicit, frica își pierde jumătate din greutate — pentru că sună mai mic decât se simțea.",
          "Separă „nu pot să mă apuc” de „nu vreau”. Sunt probleme diferite, cu soluții opuse.",
        ],
      },
      {
        type: "p",
        text: "Și un lucru de evitat: pedeapsa. Vinovăția pentru amânare nu produce acțiune, produce evitarea gândului la sarcină — adică mai multă amânare. Bucla se închide exact acolo unde crezi că te disciplinezi.",
      },
    ],
  },

  {
    slug: "sa-spui-nu",
    title: "De ce e atât de greu să spui nu",
    metaTitle: "Cum să spui nu fără vinovăție: de ce e greu și ce ajută",
    description:
      "Dacă un refuz te costă ore de vinovăție, problema nu e comunicarea. E o " +
      "regulă despre ce se întâmplă cu tine când dezamăgești pe cineva.",
    keywords: [
      "cum sa spun nu",
      "granite personale",
      "nu stiu sa refuz",
      "people pleasing",
      "vinovatie",
    ],
    published: "2026-09-06",
    updated: "2026-09-07",
    readingMinutes: 5,
    lede:
      "Mulți oameni știu perfect cum se formulează un refuz politicos. Tot nu " +
      "reușesc să-l dea. Semn că problema nu e la cuvinte.",
    body: [
      {
        type: "p",
        text: "Există o diferență între a nu ști să refuzi și a nu-ți permite să refuzi. Prima se rezolvă cu o formulare. A doua nu, pentru că sub ea stă o regulă: dacă dezamăgesc pe cineva, se întâmplă ceva rău cu mine.",
      },
      { type: "h2", text: "Ce anume te sperie" },
      {
        type: "p",
        text: "Rareori consecința reală. Aproape nimeni nu crede sincer că un coleg va desface o prietenie pentru un refuz. Frica e mai veche și mai difuză: că vei fi văzut ca dificil, egoist, nerecunoscător. Că vei pierde locul pe care îl ai în ochii cuiva.",
      },
      {
        type: "p",
        text: "De obicei, regula vine dintr-o casă în care afecțiunea era condiționată de docilitate, sau în care un părinte avea reacții imprevizibile și copilul a învățat că cea mai sigură poziție e să nu deranjeze. În ambele cazuri, „nu” a fost, la propriu, riscant.",
      },
      { type: "h2", text: "Costul lui da" },
      {
        type: "ul",
        items: [
          "Resentimentul. Acceptul dat împotriva ta se transformă, previzibil, în iritare față de omul care a cerut — deși el nu a făcut nimic rău.",
          "Retragerea bruscă. După luni de da, vine un refuz disproporționat, care pare celuilalt că vine din senin.",
          "Pierderea încrederii celorlalți. Când toate răspunsurile tale sunt da, niciunul nu mai are valoare informativă.",
          "Epuizarea. Cea mai puțin dramatică și cea mai costisitoare.",
        ],
      },
      { type: "h2", text: "Ce ajută" },
      {
        type: "p",
        text: "Începe cu refuzuri fără miză. Nu cu cel de la șef — cu chelnerul care întreabă dacă mai vrei ceva. Cu invitația la care oricum nu voiai să mergi. Sistemul nervos nu deosebește categoriile: învață că refuzul e supraviețuibil din orice refuz.",
      },
      {
        type: "p",
        text: "Apoi, cumpără-ți timp. „Îți spun mâine” nu e un refuz, dar rupe automatismul lui da. Majoritatea acceptărilor pe care le regretăm se dau în primele două secunde, din reflex.",
      },
      {
        type: "p",
        text: "Și, cel mai important, măsoară disconfortul. Când refuzi, observă cât durează starea neplăcută. De obicei sub zece minute. Regula spunea că urmează ceva grav; realitatea spune că urmează un sfert de oră inconfortabil. Diferența dintre cele două, notată de câteva ori, e ce schimbă regula.",
      },
    ],
  },

  {
    slug: "vocea-critica",
    title: "Vocea critică din cap: a cui e, de fapt",
    metaTitle: "Vocea critică interioară: de unde vine și cum se domolește",
    description:
      "Felul în care îți vorbești când greșești a fost învățat de undeva. " +
      "Cum identifici sursa și de ce asta schimbă totul.",
    keywords: [
      "vocea critica interioara",
      "critic interior",
      "autocritica",
      "cum imi vorbesc",
      "stima de sine",
    ],
    published: "2026-09-07",
    updated: "2026-09-07",
    readingMinutes: 5,
    lede:
      "Ascultă exact cuvintele pe care ți le spui după o greșeală. Nu ideea — " +
      "cuvintele. Aproape întotdeauna sunt ale altcuiva, memorate cu tot cu ton.",
    body: [
      {
        type: "p",
        text: "Un exercițiu scurt și incomod: adu-ți aminte ultima dată când ai greșit ceva. Ce ți-ai spus? Nu în rezumat — literal. „Ești praf.” „Bineînțeles.” „Tipic.” „Nu ești în stare de nimic.”",
      },
      {
        type: "p",
        text: "Acum întreabă-te cine vorbea așa. De cele mai multe ori apare un chip. Un părinte, un profesor, un antrenor. Vocea critică nu se naște din senin; e o înregistrare, păstrată cu tot cu vocabular și cu intonație.",
      },
      { type: "h2", text: "De ce a rămas pornită" },
      {
        type: "p",
        text: "Pentru că a avut o funcție. Un copil criticat des învață să se critice singur, înainte ca altcineva s-o facă. E o formă de anticipare: dacă îmi spun eu primul, lovitura din afară doare mai puțin. Strategia funcționează, într-un fel — și de aceea nu dispare doar pentru că ai crescut.",
      },
      {
        type: "quote",
        text: "Criticul interior nu te urăște. Încearcă, cu metode vechi, să te apere de o rușine care nu mai vine.",
      },
      { type: "h2", text: "De ce nu ajută să-l combați" },
      {
        type: "p",
        text: "Cearta cu vocea critică o întărește, pentru că îi confirmă statutul de interlocutor. La fel, încercarea de a o înlocui cu o voce artificial de blândă eșuează: nu o crezi, deci se activează imediat contra-argumentul.",
      },
      {
        type: "p",
        text: "Ce funcționează e mai simplu și mai ciudat: eticheteaz-o. Când apare, spune-ți în gând „asta e propoziția lui tata, din 1998”. Nu o contrazice. Doar numește-i sursa și data.",
      },
      {
        type: "p",
        text: "Efectul e imediat și verificabil: o propoziție care era un adevăr despre tine devine o amintire despre altcineva. Amintirile au mult mai puțină autoritate decât adevărurile, iar diferența se simte în corp în câteva secunde.",
      },
      { type: "h2", text: "Al doilea pas" },
      {
        type: "p",
        text: "După ce ai numit-o de câteva zeci de ori, întreabă-te de ce anume încearcă să te ferească. Aproape întotdeauna răspunsul e o rușine specifică: să nu fii văzut prost, leneș, neserios, prea mult. Convingerea de dedesubt e acolo, iar ea e lucrul care merită schimbat — nu volumul vocii.",
      },
    ],
  },

  {
    slug: "ce-mostenim-de-la-parinti",
    title: "Ce moștenim de la părinți fără să vrem",
    metaTitle: "Convingeri moștenite de la părinți: cum le recunoști",
    description:
      "Nu moștenim opiniile părinților, ci regulile lor de supraviețuire. Cum " +
      "le identifici și cum le poți lăsa în urmă fără să-i condamni.",
    keywords: [
      "convingeri mostenite",
      "traume transgenerationale",
      "relatia cu parintii",
      "tipare familiale",
      "ce am invatat acasa",
    ],
    published: "2026-09-07",
    updated: "2026-09-07",
    readingMinutes: 6,
    lede:
      "Cei mai mulți oameni și-au promis, la un moment dat, că nu vor fi ca " +
      "părinții lor într-o privință anume. Și cei mai mulți descoperă, mai " +
      "târziu, că au preluat altceva, pe care nu l-au observat niciodată.",
    body: [
      {
        type: "p",
        text: "Ce se transmite nu sunt convingerile declarate. Un părinte poate spune „important e să fii fericit” și poate transmite, prin tot ce face, că important e să nu deranjezi. Copiii nu învață din declarații, învață din atmosferă: din ce se sărbătorește, din ce se trece sub tăcere, din ce produce încordare în cameră.",
      },
      { type: "h2", text: "Cum arată o regulă moștenită" },
      {
        type: "ul",
        items: [
          "Se simte ca bun-simț, nu ca opinie. „Așa se face” — dar nu poți spune de ce.",
          "Nu ai amintirea de a fi învățat-o. Regulile explicite se rețin; cele preluate din atmosferă, nu.",
          "Se activează în situații de stres, nu în cele calme.",
          "O aperi mai tare decât ar merita, dacă cineva o pune la îndoială.",
        ],
      },
      { type: "h2", text: "De ce au existat" },
      {
        type: "p",
        text: "Contextul contează enorm și e cel mai des ignorat. Un părinte care a trăit lipsuri reale a învățat că banii se termină oricând — pentru că în anii lui chiar se terminau. Regula era corectă atunci. Ce se transmite mai departe nu e informația despre acei ani, ci starea de vigilență, decuplată de context.",
      },
      {
        type: "quote",
        text: "Regula a fost adevărată pentru viața lor. Ce moștenim e regula, nu viața care a produs-o.",
      },
      { type: "h2", text: "De ce nu ajută condamnarea" },
      {
        type: "p",
        text: "Există o etapă, de obicei pe la douăzeci și ceva de ani, în care oamenii descoperă influența părinților și devin furioși. E o etapă necesară, dar nu e destinația. Furia păstrează legătura la fel de strâns ca supunerea: în ambele cazuri, regula rămâne centrul.",
      },
      {
        type: "p",
        text: "Ce eliberează efectiv e altceva: să poți spune, fără contradicție, „a avut motivele lui, și eu nu mai am nevoie de asta”. Prima jumătate îl scoate pe părinte de pe banca acuzaților. A doua te scoate pe tine din obligație. Ambele sunt necesare; una singură nu ajunge.",
      },
      { type: "h2", text: "Un exercițiu concret" },
      {
        type: "p",
        text: "Scrie trei propoziții pe care le auzeai des în casa în care ai crescut. Nu cele mari și memorabile — cele banale, spuse în trecere. Lângă fiecare, notează: la ce îi folosea celui care o spunea, în viața lui?",
      },
      {
        type: "p",
        text: "Apoi, o singură întrebare: care dintre ele mai e adevărată în viața ta de acum? Nu în general — în viața ta, cu veniturile tale, cu oamenii tăi, în anul acesta. De obicei una sau două rezistă. Celelalte se dovedesc a fi bagaj cărat pentru altcineva.",
      },
    ],
  },

  {
    slug: "convingeri-si-copiii-nostri",
    title: "Ce le transmitem copiilor fără să spunem nimic",
    metaTitle: "Ce le transmitem copiilor fără să vrem: convingeri moștenite",
    description:
      "Copiii nu preiau ce le spunem, ci ce ne văd făcând sub presiune. Cum " +
      "observi ce transmiți și ce poți schimba realist.",
    keywords: [
      "ce transmit copilului meu",
      "parenting constient",
      "tipare familiale",
      "vinovatie de parinte",
      "educatia copiilor",
    ],
    published: "2026-09-07",
    updated: "2026-09-07",
    readingMinutes: 5,
    lede:
      "Copiii aud ce spunem, dar învață din ce facem când suntem obosiți, " +
      "grăbiți sau speriați. Acolo se transmit convingerile, nu în discuțiile " +
      "educative de duminică.",
    body: [
      {
        type: "p",
        text: "Un părinte poate explica foarte convingător că greșelile sunt normale. Dacă însă, când greșește el, își spune cu voce tare „ce prost sunt”, copilul învață a doua variantă. Nu din rea-credință — pur și simplu comportamentul sub presiune e mai informativ decât discursul calm.",
      },
      { type: "h2", text: "Momentele care contează" },
      {
        type: "ul",
        items: [
          "Cum reacționezi la propria greșeală, în fața lui.",
          "Ce faci când ești obosit și el cere ceva. Nu ce spui — ce faci.",
          "Cum vorbești despre bani când crezi că nu ascultă.",
          "Ce se întâmplă în casă când cineva plânge sau se enervează.",
          "Dacă ai voie să te odihnești fără să justifici.",
        ],
      },
      {
        type: "p",
        text: "Ultimul e mai important decât pare. Un copil care nu a văzut niciodată un adult odihnindu-se fără vinovăție va avea nevoie de douăzeci de ani ca să învețe singur că se poate.",
      },
      { type: "h2", text: "Ce nu ajută: vinovăția" },
      {
        type: "p",
        text: "Aproape orice părinte care citește un text ca acesta simte un val de vinovăție. E de înțeles și e inutil. Vinovăția consumă energia care ar trebui să meargă în schimbare, și are un efect secundar urât: părintele vinovat devine mai defensiv, nu mai atent.",
      },
      {
        type: "quote",
        text: "Nu contează să nu transmiți nimic — e imposibil. Contează să știi ce transmiți și să poți repara.",
      },
      { type: "h2", text: "Reparația contează mai mult decât perfecțiunea" },
      {
        type: "p",
        text: "Cercetarea din psihologia dezvoltării arată constant același lucru: nu absența rupturilor construiește siguranța, ci prezența reparațiilor. Un părinte care țipă și apoi revine — „am țipat, nu a fost în regulă, nu din cauza ta” — transmite ceva mult mai valoros decât unul care nu țipă niciodată: că relația suportă greșeala.",
      },
      {
        type: "p",
        text: "Practic, asta înseamnă că nu trebuie să devii alt om. Trebuie doar să observi tiparul, să-l numești când se întâmplă, și să repari după. Copilul învață exact procedura asta, și o va folosi toată viața.",
      },
      { type: "h2", text: "O întrebare de pus o dată pe lună" },
      {
        type: "p",
        text: "Ce crede copilul meu că trebuie să facă pentru ca eu să fiu mulțumit? Răspunsul, dacă ești sincer, spune mai mult despre ce transmiți decât orice intenție declarată.",
      },
    ],
  },
  {
    slug: "cum-imi-schimb-o-convingere",
    title: "Cum schimbi efectiv o convingere despre tine",
    metaTitle: "Cum îmi schimb o convingere: metoda în cinci pași",
    description:
      "Nu prin afirmații pozitive și nu prin voință. Procedura concretă, cu " +
      "exemple, pentru o singură convingere pe rând.",
    keywords: [
      "cum imi schimb o convingere",
      "cum scap de convingeri limitative",
      "restructurare cognitiva",
      "schimbare personala",
      "exercitii dezvoltare personala",
    ],
    published: "2026-09-07",
    updated: "2026-09-07",
    readingMinutes: 6,
    lede:
      "Convingerile nu se schimbă prin argumente, pentru că nu au fost făcute " +
      "din argumente. S-au format din experiențe repetate — și tot din " +
      "experiențe se desfac.",
    body: [
      {
        type: "p",
        text: "Metoda de mai jos funcționează pentru convingerile obișnuite care ne încurcă în viața de zi cu zi. Nu funcționează pentru traumă, iar dacă lucrul la o convingere anume deschide ceva ce nu poți ține, e semn că ai nevoie de un psihoterapeut, nu de un articol.",
      },
      { type: "h2", text: "1. Formulează exact regula" },
      {
        type: "p",
        text: "Nu tema, regula. Nu „am o problemă cu banii”, ci propoziția, la persoana întâi, în cuvintele tale: „dacă cheltui pe mine, o să rămân descoperit”. O convingere formulată vag nu poate fi testată, deci nu poate fi schimbată.",
      },
      { type: "h2", text: "2. Găsește-i sursa și dă-i dreptate" },
      {
        type: "p",
        text: "Când a fost prima dată adevărată? Cine ți-a arătat-o? Aproape întotdeauna a fost o soluție bună într-un context real. Spune asta explicit: „a fost adevărat în casa în care am crescut”. Fără pasul acesta, o parte din tine va apăra regula, fiindcă își amintește la ce a folosit.",
      },
      { type: "h2", text: "3. Scrie varianta pe care ai putea-o crede mâine" },
      {
        type: "p",
        text: "Nu opusul. „Banii nu se termină niciodată” e fals și mintea o respinge imediat. Ceva de genul: „pot cheltui o sumă mică pe mine și tot rămân în siguranță”. Testul e simplu: dacă citind-o simți că minți, e prea departe. Coboară până la propoziția care te face să spui „poate”.",
      },
      { type: "h2", text: "4. Fă un experiment mic, azi" },
      {
        type: "p",
        text: "Nu o schimbare de viață — un test. Cheltuie treizeci de lei pe ceva strict pentru tine. Cere ajutorul la ceva mărunt. Predă un lucru la nouăzeci la sută. Experimentul trebuie să fie suficient de mic încât să-l faci azi și suficient de real încât să activeze disconfortul.",
      },
      { type: "h2", text: "5. Notează ce s-a întâmplat de fapt" },
      {
        type: "p",
        text: "Pasul care se sare cel mai des și fără de care restul nu ține. Scrie, în trei rânduri: ce ai făcut, ce a spus cineva, ce consecință concretă a avut, cât a durat disconfortul.",
      },
      {
        type: "quote",
        text: "Fără notat, mintea rescrie ce s-a întâmplat ca să se potrivească cu regula veche. Cu notat, ai dovezi pe care nu le poate reinterpreta.",
      },
      {
        type: "p",
        text: "Repetă experimentul de cinci-șase ori, în variante ușor diferite. Nu urmări sentimentul că te-ai schimbat — urmărește lista de dovezi. Sentimentul vine ultimul, la câteva săptămâni după fapte, și vine singur.",
      },
      { type: "h2", text: "Greșeli frecvente" },
      {
        type: "ul",
        items: [
          "Lucrezi la trei convingeri deodată. Alege una, cea mai mică.",
          "Alegi cea mai dureroasă convingere ca să scapi mai repede. Începe cu cea periferică — vrei să antrenezi procedura, nu să dai un examen.",
          "Aștepți să simți altfel înainte să acționezi. Ordinea e inversă.",
          "Renunți după un experiment care a ieșit prost. Un rezultat prost e tot o dovadă: notează exact cât de rău a fost de fapt.",
        ],
      },
    ],
  },

  {
    slug: "nu-sunt-suficient",
    title: "Senzația că nu ești suficient",
    metaTitle: "Simt că nu sunt suficient de bun: de unde vine sentimentul",
    description:
      "Nu e legată de realizări și nu se rezolvă prin ele. Ce întreține " +
      "sentimentul de insuficiență și pe unde se poate ieși.",
    keywords: [
      "nu sunt suficient de bun",
      "sentiment de insuficienta",
      "stima de sine",
      "nu ma simt destul",
      "valoare personala",
    ],
    published: "2026-09-07",
    updated: "2026-09-07",
    readingMinutes: 5,
    lede:
      "E cea mai comună convingere din câte există și cea mai rar spusă cu voce " +
      "tare. Nu că ai greșit ceva — că, la bază, nu ajungi.",
    body: [
      {
        type: "p",
        text: "Se recunoaște după un detaliu: nu se referă la nimic anume. Nu „nu sunt suficient de bun la matematică”, ci un fond difuz care rămâne acolo indiferent ce se întâmplă. De aceea realizările nu o ating — ele răspund la întrebări specifice, iar aceasta nu e o întrebare specifică.",
      },
      { type: "h2", text: "Cum se autoîntreține" },
      {
        type: "p",
        text: "Prin mutarea ștachetei. Orice reușită e reclasificată instantaneu ca fiind minimul acceptabil, deci nu contează. Ce urmează devine noul prag. Bara se ridică exact cât ai crescut tu, ceea ce face imposibilă ajungerea la ea.",
      },
      {
        type: "p",
        text: "Și prin comparație selectivă. Te compari cu cineva mai bun exact în singura dimensiune în care ești mai slab, ignorând restul. Nu din masochism — pentru că regula caută confirmare, ca orice regulă.",
      },
      { type: "h2", text: "De unde vine" },
      {
        type: "ul",
        items: [
          "Aprecierea condiționată de rezultat, în copilărie. Copilul deduce că valoarea trebuie câștigată, nu că e implicită.",
          "Comparația explicită cu un frate, un văr, un coleg.",
          "Un părinte pe care nimic nu-l mulțumea complet — nu neapărat sever, doar mereu ușor nesatisfăcut.",
          "Perioade în care ai fost, obiectiv, în urmă: o schimbare de școală, o mutare, o boală.",
        ],
      },
      { type: "h2", text: "Ce nu funcționează" },
      {
        type: "p",
        text: "Lista realizărilor. Aproape toți cei cu acest tipar au încercat-o și au constatat că nu simt nimic citind-o. Motivul e că lista răspunde la „ce ai făcut”, iar convingerea e despre „ce ești”. Nu se întâlnesc.",
      },
      { type: "h2", text: "Ce mută ceva" },
      {
        type: "p",
        text: "Prima mișcare e să identifici pentru cine nu ești suficient. Sentimentul e difuz, dar aproape întotdeauna are un destinatar: un părinte, o versiune imaginată a lui, un grup. Formulează propoziția completă — „nu sunt suficient pentru…” — și numește destinatarul. Odată numit, regula devine mult mai mică decât părea.",
      },
      {
        type: "p",
        text: "A doua: observă ce faci ca să compensezi. Muncești mai mult, ajuți mai mult, taci mai mult. Compensarea e dovada practică a convingerii, și e mai ușor de schimbat decât sentimentul. Renunță o dată la compensare, într-un context mic, și notează ce s-a întâmplat.",
      },
      {
        type: "p",
        text: "A treia, cea mai greu de acceptat: nu urmări să te simți suficient. Urmărește să acționezi fără să te fi simțit. Majoritatea oamenilor care par siguri pe ei nu au așteptat sentimentul — au constatat, după ani, că nu mai apare întrebarea.",
      },
    ],
  },

  {
    slug: "nevoia-de-control",
    title: "Nevoia de control nu e despre control",
    metaTitle: "Nevoia de control: de unde vine și ce o domolește",
    description:
      "Oamenii care controlează tot nu vor putere, vor previzibilitate. Ce " +
      "produce tiparul și ce îl slăbește fără să pierzi ce e util în el.",
    keywords: [
      "nevoia de control",
      "control excesiv",
      "nu pot delega",
      "anxietate control",
      "micromanagement",
    ],
    published: "2026-09-07",
    updated: "2026-09-07",
    readingMinutes: 5,
    lede:
      "Din afară arată a dorință de putere. Din interior e altceva: senzația că, " +
      "dacă nu ții tu totul, se prăbușește.",
    body: [
      {
        type: "p",
        text: "Nevoia de control se confundă des cu autoritarismul, dar mecanismul e opus. Nu vine din încredere în sine, ci din neîncredere în stabilitatea lumii. Controlul e strategia prin care cineva încearcă să facă previzibil un mediu pe care l-a trăit, cândva, ca imprevizibil.",
      },
      { type: "h2", text: "Semne" },
      {
        type: "ul",
        items: [
          "Nu poți delega, iar când o faci, verifici de trei ori.",
          "Refaci lucrul altcuiva în loc să-i spui ce ai vrea altfel.",
          "Planifici excesiv, inclusiv lucruri care nu au nevoie de plan.",
          "Schimbările de ultim moment produc o reacție disproporționată.",
          "Te simți liniștit doar când toate variabilele sunt la tine.",
        ],
      },
      { type: "h2", text: "De unde vine" },
      {
        type: "p",
        text: "Cel mai des din case cu imprevizibilitate: un părinte cu reacții variabile, instabilitate financiară, boală, alcool, sau pur și simplu prea multe mutări. Copilul care nu putea prezice ce urmează a învățat să anticipeze totul. Anticiparea a fost, la vremea ei, o competență de supraviețuire.",
      },
      {
        type: "quote",
        text: "Controlul nu cere putere. Cere să nu mai fii luat prin surprindere.",
      },
      { type: "h2", text: "Costul" },
      {
        type: "p",
        text: "Epuizare, în primul rând: a ține totul e o muncă cu normă întreagă, invizibilă și neplătită. Apoi izolare — oamenii din jur încetează să mai propună, fiindcă orice propunere e corectată. Și, paradoxal, mai multă imprevizibilitate: cu cât controlezi mai strâns, cu atât surprizele inevitabile lovesc mai tare, pentru că sistemul nu are joc.",
      },
      { type: "h2", text: "Ce ajută" },
      {
        type: "p",
        text: "Nu renunțarea la control, care sperie și e resimțită ca pericol real. Ci experimente mici de imprevizibilitate voluntară: lasă pe altcineva să aleagă restaurantul, deleagă o sarcină fără să verifici, mergi undeva fără plan pentru două ore.",
      },
      {
        type: "p",
        text: "Și, ca la orice tipar, notează ce s-a întâmplat de fapt. Sistemul nervos nu învață din promisiuni, învață din repetare: de fiecare dată când nu ai controlat și nu s-a prăbușit nimic, marja de siguranță crește puțin. Asta nu se poate accelera, dar se poate începe azi.",
      },
    ],
  },

  {
    slug: "comparatia-cu-ceilalti",
    title: "De ce ne comparăm exact cu cine ne doare mai tare",
    metaTitle: "Comparația cu ceilalți: de ce doare și cum se oprește",
    description:
      "Nu ne comparăm cu oricine. Alegem, previzibil, exact persoana care " +
      "confirmă ce credem deja despre noi. Ce spune asta și ce se poate face.",
    keywords: [
      "compararea cu ceilalti",
      "invidie",
      "social media si stima de sine",
      "de ce ma compar",
      "nemultumire",
    ],
    published: "2026-09-07",
    updated: "2026-09-07",
    readingMinutes: 5,
    lede:
      "Comparația pare un accident produs de rețelele sociale. Nu e. Alegerea " +
      "persoanei cu care te compari e sistematică, și spune mai multe decât " +
      "comparația însăși.",
    body: [
      {
        type: "p",
        text: "Observă, data viitoare, cu cine te compari. Nu e cineva la întâmplare. E cineva care are exact lucrul despre care ai o regulă. Cine crede că valoarea vine din realizări se compară cu cei realizați; cine crede că vine din a fi plăcut se compară cu cei populari. Comparația nu produce convingerea — o servește.",
      },
      { type: "h2", text: "Mecanismul" },
      {
        type: "p",
        text: "Convingerea are nevoie de confirmare, ca orice regulă. Mintea caută, deci, cazul care o confirmă și îl găsește imediat, fiindcă în lume există oricând cineva mai bun într-o dimensiune anume. Rezultatul se simte ca o constatare obiectivă despre realitate, deși e o căutare țintită.",
      },
      { type: "h2", text: "De ce social media amplifică, dar nu cauzează" },
      {
        type: "p",
        text: "Rețelele oferă un flux nelimitat de material pentru confirmare, deci fac tiparul mai frecvent și mai ieftin. Dar oamenii se comparau și înainte, cu vecini și colegi. Ștergerea aplicațiilor reduce simptomul; nu atinge regula.",
      },
      { type: "h2", text: "Semnalul util din invidie" },
      {
        type: "p",
        text: "Invidia are o informație în ea, dacă o citești corect. Nu îți spune că celălalt are prea mult. Îți spune ce îți dorești și nu îți dai voie. Cineva care lucrează mai puțin și pare împăcat te irită exact în măsura în care tu nu îți permiți asta.",
      },
      {
        type: "quote",
        text: "Iritarea disproporționată față de libertatea altcuiva arată o graniță pe care ți-o impui singur.",
      },
      { type: "h2", text: "Ce ajută" },
      {
        type: "ul",
        items: [
          "Când apare comparația, întreabă-te: ce anume are omul acesta și îmi doresc? Răspunsul e mai util decât judecata.",
          "Compară-te cu tine, dar cu date, nu cu impresii: unde erai acum un an, la ce anume.",
          "Observă în ce dimensiune te compari mereu. Aceea e regula ta, iar ea se poate schimba.",
          "Redu materia primă: nu ca soluție, ci ca să ai liniște cât lucrezi la regulă.",
        ],
      },
    ],
  },

  {
    slug: "burnout-si-convingeri",
    title: "Burnout-ul nu vine doar din cât muncești",
    metaTitle: "Burnout: rolul convingerilor personale, nu doar al volumului",
    description:
      "Doi oameni cu aceeași încărcare ajung în locuri diferite. Diferența stă " +
      "în regulile după care muncesc, nu în orele lucrate.",
    keywords: [
      "burnout",
      "epuizare",
      "sindromul burnout",
      "oboseala cronica munca",
      "echilibru viata munca",
    ],
    published: "2026-09-07",
    updated: "2026-09-07",
    readingMinutes: 5,
    lede:
      "Volumul contează, evident. Dar explică surprinzător de puțin din cine " +
      "ajunge la epuizare și cine nu, la aceleași ore lucrate.",
    body: [
      {
        type: "p",
        text: "Cercetarea pe burnout arată constant că factorii cei mai puternici nu sunt orele, ci lipsa de control asupra muncii, lipsa recunoașterii și conflictul de valori. La acestea se adaugă ceva personal: regulile după care muncești.",
      },
      { type: "h2", text: "Regulile care ard" },
      {
        type: "ul",
        items: [
          "„Dacă nu iese impecabil, nu contează.” Elimină orice moment de finalizare, deci orice odihnă legitimă.",
          "„Dacă cer ajutor, se vede că nu mă descurc.” Blochează singura supapă reală.",
          "„Trebuie să fiu disponibil.” Șterge granița dintre muncă și restul vieții.",
          "„Valoarea mea e ce produc.” Face pauza să pară pierdere de valoare, nu refacere.",
        ],
      },
      {
        type: "p",
        text: "Observă că niciuna nu e despre volum. Toate sunt despre ce ai voie să faci în raport cu munca — și ele determină dacă cele opt ore se termină la sfârșitul zilei sau continuă în cap până la culcare.",
      },
      { type: "h2", text: "Semnele timpurii" },
      {
        type: "p",
        text: "Nu oboseala — cinismul. Prima etapă recunoscută e distanțarea emoțională: lucruri care contau încep să pară fără sens, colegii devin obositori, munca devine mecanică. Abia apoi vine epuizarea fizică, și abia la final scăderea performanței, care e de obicei momentul în care oamenii se alarmează. E prea târziu ca moment de intervenție.",
      },
      { type: "h2", text: "Ce ajută înainte de concediu" },
      {
        type: "p",
        text: "Concediul repară oboseala, nu regula. De aceea mulți se întorc odihniți și în trei săptămâni sunt la fel. Ce schimbă traiectoria e lucrul la regulă: un lucru predat la nouăzeci la sută, o cerere de ajutor, o seară în care telefonul de serviciu rămâne închis, și observarea a ce s-a întâmplat de fapt.",
      },
      {
        type: "p",
        text: "Dacă însă ai deja simptome fizice persistente, insomnie sau stări depresive, articolul acesta nu e suficient. Burnout-ul avansat cere ajutor specializat, nu ajustări de reguli.",
      },
    ],
  },

  {
    slug: "jurnal-de-convingeri",
    title: "Cum ții un jurnal care chiar arată ceva",
    metaTitle: "Jurnal de convingeri: cum îl ții ca să fie util",
    description:
      "Un jurnal de emoții arată cum a fost ziua. Un jurnal de convingeri arată " +
      "regulile din spatele reacțiilor. Diferența stă în ce anume notezi.",
    keywords: [
      "jurnal personal",
      "cum tin un jurnal",
      "jurnal de emotii",
      "autocunoastere exercitii",
      "reflectie personala",
    ],
    published: "2026-09-07",
    updated: "2026-09-07",
    readingMinutes: 5,
    lede:
      "Majoritatea jurnalelor se abandonează după trei săptămâni, pentru că " +
      "nu produc nimic. Notezi ce ai simțit, recitești peste o lună și afli " +
      "că ai simțit. Se poate altfel.",
    body: [
      {
        type: "p",
        text: "Problema jurnalului clasic e că înregistrează rezultatul, nu mecanismul. Ca să vezi tipare, îți trebuie patru câmpuri, nu unul.",
      },
      { type: "h2", text: "Cele patru câmpuri" },
      {
        type: "ul",
        items: [
          "Situația, în fapte pe care le-ar confirma o cameră de filmat. Fără interpretare: „a răspuns la mesaj după șase ore”, nu „m-a ignorat”.",
          "Ce am crezut că înseamnă. Aici e regula, și de obicei se scrie cel mai greu.",
          "Ce am făcut apoi.",
          "Ce s-a întâmplat de fapt după.",
        ],
      },
      {
        type: "p",
        text: "Al doilea câmp e cel care face jurnalul util. Diferența dintre „a răspuns după șase ore” și „nu-i pasă de mine” e exact locul unde trăiește convingerea.",
      },
      { type: "h2", text: "Cum îl citești" },
      {
        type: "p",
        text: "Nu zilnic. La două-trei săptămâni, recitește doar câmpul al doilea, pe toate intrările. Vei vedea că aceleași trei-patru propoziții revin, în situații complet diferite. Acelea sunt convingerile tale — nu ce crezi despre tine, ci ce se repetă.",
      },
      {
        type: "quote",
        text: "O convingere nu se recunoaște dintr-o intrare. Se recunoaște din repetiție, în situații care nu au nimic în comun.",
      },
      { type: "h2", text: "Reguli practice" },
      {
        type: "ul",
        items: [
          "Trei rânduri sunt destule. Un jurnal lung se abandonează.",
          "Scrie când ai o reacție disproporționată, nu la ore fixe. Acolo e material.",
          "Nu-l face frumos și nu-l scrie pentru cineva. Un jurnal cu public devine literatură.",
          "Nu comenta ce ai scris în aceeași zi. Comentariul de a doua zi e mai lucid.",
        ],
      },
      {
        type: "p",
        text: "Dacă ținutul unui jurnal ți se pare o corvoadă, există și varianta de a vorbi liber și de a lăsa altcineva să facă munca de structurare. Important e ca observațiile să fie păstrate cu citatul original — fără el, orice concluzie e o părere.",
      },
    ],
  },
];

export function getArticle(slug: string): Article | null {
  return ARTICLES.find((a) => a.slug === slug) ?? null;
}

/** Cele mai recente întâi. */
export function sortedArticles(): Article[] {
  return [...ARTICLES].sort((a, b) => b.published.localeCompare(a.published));
}
