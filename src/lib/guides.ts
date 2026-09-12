import type { LifeDomain } from "./types";

/**
 * Ghidurile de ședință: conversații libere, dar cu o direcție.
 *
 * O discuție fără temă produce puțin: omul nu știe de unde să înceapă, iar
 * interlocutorul nu știe ce caută. Un chestionar produce mult, dar sec — nimeni
 * nu s-a înțeles pe sine bifând căsuțe. Ghidul stă între ele: un parcurs de
 * cinci-șase pași, fiecare cu o întrebare bună, uneori cu variante de răspuns,
 * și cu o listă a schemelor pe care le pândește. Modelul îl urmează ca pe o
 * busolă, nu ca pe un scenariu: întrebarea reală se scrie în conversație,
 * potrivită cu ce a spus omul.
 *
 * Variantele de răspuns urmează logica chestionarului Young (YSQ): fiecare
 * variantă indică spre o schemă diferită, deci alegerea spune ceva chiar și
 * fără cuvintele omului. Sunt mereu opționale — se poate scrie liber.
 *
 * Surse, per ghid, în câmpul `sources`. Cele care revin:
 *   - Young, Klosko, Weishaar — Schema Therapy (2003); Reinventing Your Life
 *   - Lindsay Gibson — Adult Children of Emotionally Immature Parents (2015)
 *   - Alice Miller — Drama copilului dotat (1979)
 *   - Gabor Maté — The Myth of Normal (2022); Scattered Minds
 *   - Bowlby / Ainsworth; Levine & Heller — Attached (2010)
 *   - Judith Beck — Cognitive Behavior Therapy (convingerile nucleu)
 *   - Brené Brown — Daring Greatly (2012); I Thought It Was Just Me
 *   - Pete Walker — Complex PTSD: From Surviving to Thriving (2013)
 *   - Murray Bowen — teoria sistemelor familiale (diferențiere, triangulare)
 */

export type GuideGoal = "origins" | "relationships" | "self" | "money_work" | "parenting";

export const GOAL_LABELS: Record<GuideGoal, string> = {
  origins: "De unde vin tiparele mele",
  relationships: "Relațiile mele",
  self: "Cum mă văd pe mine",
  money_work: "Bani și muncă",
  parenting: "Ca părinte",
};

export const GOAL_ORDER: GuideGoal[] = [
  "origins",
  "self",
  "relationships",
  "money_work",
  "parenting",
];

export interface GuideStep {
  id: string;
  /** Formularea implicită. Modelul o adaptează la conversație. */
  question: string;
  /** Variante rapide de răspuns. Fiecare indică spre altă schemă. */
  options?: string[];
  /** Ce caută pasul, pe înțelesul modelului. */
  lookingFor: string;
  /** Schemele care ies de obicei la suprafață aici. */
  schemas: string[];
}

export interface Guide {
  id: string;
  title: string;
  /** O propoziție care spune omului ce va explora, fără jargon. */
  summary: string;
  domain: LifeDomain;
  goal: GuideGoal;
  sources: string[];
  steps: GuideStep[];
  /**
   * Lecția introductivă: nu consumă ședință, se face o singură dată, merge
   * pe modelul ieftin și actualizează harta doar la final. Orice altceva
   * cere un pachet.
   */
  free?: boolean;
  /** Câte replici poate ține un pas, dacă nu e valoarea obișnuită. */
  turnsPerStep?: number;
  /** Câte replici are ședința pe această lecție, dacă nu e cea obișnuită. */
  maxTurns?: number;
  /** Ce trebuie să știe modelul pe tot parcursul lecției, la fiecare pas. */
  brief?: string;
  /** Cum se încheie lecția, dacă nu ca de obicei (bilanț, fără întrebare). */
  closing?: string;
}

/**
 * Câte replici ține un pas de ghid, de regulă. Serverul îl impune, modelul
 * îl primește ca reper. Patru, nu trei: o convingere apare pe hartă abia
 * după ce a fost spusă în mai multe momente, deci pasul trebuie să aibă loc
 * pentru „s-a mai întâmplat și altă dată?” înainte să treacă mai departe.
 */
export const DEFAULT_TURNS_PER_STEP = 4;

export const INTRO_GUIDE_ID = "regula-pe-care-o-porti";

export const GUIDES: Guide[] = [
  // ======================================================= introducere
  /**
   * Demonstrația. Universală — oricine are un lucru pe care îl face mereu
   * deși îl costă — și construită ca să scoată o singură convingere din trei
   * unghiuri (scena de acum, consecința temută, originea), adică exact cât
   * îi trebuie unui nod ca să se formeze. Se încheie cu o întrebare lăsată
   * deschisă; vânzarea o face ecranul, nu modelul.
   */
  {
    id: INTRO_GUIDE_ID,
    title: "Regula pe care o porți",
    summary:
      "Un singur lucru pe care îl faci mereu, deși te costă. De unde vine, ce " +
      "păzește și cât te-a costat anul ăsta. Zece minute, gratuit.",
    domain: "self",
    goal: "self",
    free: true,
    turnsPerStep: 2,
    maxTurns: 12,
    sources: ["Young — Schema Therapy", "Beck — Cognitive Behavior Therapy", "Gibson — Adult Children of Emotionally Immature Parents"],
    brief:
      "Lecția introductivă: omul e la prima lui conversație aici, gratuită și " +
      "scurtă. Nu te cunoaște și te judecă din prima replică. Un singur fir: " +
      "regula lui — lucrul pe care îl face mereu deși îl costă. Toate " +
      "întrebările sapă în același lucru, din unghiuri diferite: scena de acum, " +
      "ce crede că s-ar întâmpla dacă n-ar respecta-o, de unde a învățat-o, cât " +
      "l-a costat. Nu lărgi spre alte teme, oricât de interesante — sunt pentru " +
      "drumul de după. Fiecare replică arată că ai auzit exact ce a spus, cu " +
      "cuvintele lui. Când a răspuns pe fond, treci mai departe: pașii sunt " +
      "scurți și numărați.",
    closing:
      "**Aceasta este ultima replică a lecției introductive.** Pune advance_step " +
      "pe adevărat. Încheie în trei-patru propoziții: regula lui, cu cuvintele " +
      "lui, așa cum a apărut în cele trei momente — scena de acum, ce crede că " +
      "s-ar întâmpla dacă n-ar respecta-o, de unde a învățat-o — și prețul pe " +
      "care l-a numit. Apoi o singură întrebare, pe care nu o pui ca să primești " +
      "răspuns acum, ci ca să rămână cu el: ce ar face mâine altfel, dacă regula " +
      "n-ar mai fi a lui? Fără sfat, fără concluzie liniștitoare, fără să anunți " +
      "vreo ofertă sau vreun pas următor — de asta se ocupă ecranul. options goală.",
    steps: [
      {
        id: "lucrul",
        question:
          "Ce lucru faci aproape de fiecare dată, deși știi că te costă? Nu un defect — un obicei mic, de zi cu zi.",
        options: [
          "Spun da când vreau să spun nu",
          "Amân exact ce contează",
          "Fac totul singur",
          "Verific de trei ori",
          "Tac, ca să nu stric atmosfera",
        ],
        lookingFor:
          "Comportamentul repetat, numit precis. Fiecare variantă indică spre altă familie de scheme; ce scrie el liber e și mai bun. Nu interpreta încă — cere-i doar să-l numească exact, în termenii lui.",
        schemas: ["subjugation", "self_sacrifice", "failure", "unrelenting_standards", "emotional_inhibition", "mistrust"],
      },
      {
        id: "ultima-data",
        question:
          "Când s-a întâmplat ultima dată? Spune-mi scena: cine era de față, ce ai făcut, ce ai spus.",
        lookingFor:
          "Scena concretă, recentă, cu detalii. Regula în acțiune — de aici vine primul moment adevărat. Dacă răspunde general, cere „ultima dată” încă o dată.",
        schemas: [],
      },
      {
        id: "daca-nu",
        question:
          "Și dacă n-ai fi făcut-o? Nu ce ar fi fost rațional — ce simți că s-ar fi întâmplat.",
        options: [
          "Aș fi dezamăgit pe cineva",
          "Aș fi părut slab sau incapabil",
          "S-ar fi stricat ceva între noi",
          "Aș fi fost dat la o parte",
          "Nu știu, dar nu risc",
        ],
        lookingFor:
          "Consecința temută. Aceasta este convingerea, în forma ei brută: „dacă nu fac X, se întâmplă Y”. Cere-i s-o spună cu cuvintele lui — al doilea moment.",
        schemas: ["abandonment", "defectiveness", "approval_seeking", "subjugation", "vulnerability"],
      },
      {
        id: "de-unde",
        question:
          "Cine, în casa în care ai crescut, făcea la fel? Sau: cine avea nevoie ca tu să faci așa?",
        lookingFor:
          "Originea. Regula a fost învățată de la cineva sau pentru cineva. O scenă de atunci, cu aceeași regulă, e al treilea moment — cel care o formează pe hartă.",
        schemas: ["self_sacrifice", "enmeshment", "emotional_deprivation", "unrelenting_standards"],
      },
      {
        id: "pretul",
        question:
          "Ce te-a costat regula asta în ultimul an? Ceva concret: o relație, o ocazie, ore, bani, somn.",
        lookingFor:
          "Costul, numit de el. Nu ca să-l sperii — ca să vadă că regula nu e gratuită. De aici pleacă motivul de a lucra pe ea.",
        schemas: [],
      },
    ],
  },
  // =========================================================== origini
  {
    id: "casa-in-care-ai-crescut",
    title: "Casa în care ai crescut",
    summary:
      "Nu evenimentele mari — atmosfera. Ce se sărbătorea, ce se trecea sub " +
      "tăcere, ce producea încordare în cameră.",
    domain: "family",
    goal: "origins",
    sources: ["Gibson — Adult Children of Emotionally Immature Parents", "Maté — The Myth of Normal", "Young — Schema Therapy"],
    steps: [
      {
        id: "atmosfera",
        question:
          "Dacă ar trebui să descrii atmosfera din casa în care ai crescut într-un singur cuvânt, care ar fi?",
        options: ["Tensionată", "Rece", "Haotică", "Caldă, dar cu condiții", "Liniștită"],
        lookingFor:
          "Tonul general. Cuvântul ales și ce urmează după el spun mai mult decât orice eveniment.",
        schemas: ["emotional_deprivation", "mistrust", "vulnerability"],
      },
      {
        id: "ce-se-laudă",
        question: "Pentru ce erai lăudat acasă? Nu în general — ce anume aducea laude?",
        options: ["Note și rezultate", "Că nu deranjam", "Că ajutam", "Cum arătam", "Nu-mi amintesc laude"],
        lookingFor:
          "Ce era condiția aprecierii. Copilul deduce de aici ce trebuie să fie ca să fie iubit.",
        schemas: ["unrelenting_standards", "approval_seeking", "self_sacrifice", "emotional_deprivation"],
      },
      {
        id: "ce-nu-se-spunea",
        question: "Despre ce nu se vorbea niciodată în casă, deși toată lumea știa?",
        lookingFor:
          "Tabuurile familiei. Ce nu se numește devine regulă nescrisă și se transmite ca atmosferă.",
        schemas: ["emotional_inhibition", "mistrust", "defectiveness"],
      },
      {
        id: "rolul-tău",
        question: "Ce rol aveai tu în familie? Cel care…",
        options: ["Nu făcea probleme", "Avea grijă de ceilalți", "Reușea", "Era problema", "Era invizibil"],
        lookingFor:
          "Rolul copilului în sistemul familial (Bowen, Miller). Rolul devine identitate și se joacă apoi în toate relațiile.",
        schemas: ["self_sacrifice", "unrelenting_standards", "defectiveness", "social_isolation", "enmeshment"],
      },
      {
        id: "propoziția",
        question:
          "Ce propoziție se auzea des în casă — spusă în trecere, nu la ocazii? Ceva de genul „nu ne permitem” sau „ce zice lumea”.",
        lookingFor:
          "Regula moștenită în forma ei brută. Aceasta este, adesea, direct o convingere de pe hartă.",
        schemas: [],
      },
      {
        id: "ce-porți",
        question:
          "Din tot ce ai descris, ce crezi că mai porți cu tine și acum, chiar dacă nu mai ai nevoie?",
        lookingFor:
          "Legătura cu prezentul. Omul formulează singur convingerea, în cuvintele lui — cea mai bună sursă posibilă.",
        schemas: [],
      },
    ],
  },

  {
    id: "relatia-cu-tata",
    title: "Relația cu tata",
    summary:
      "Nu dacă a fost bun sau rău. Ce ai învățat de la el despre cum se câștigă " +
      "respectul, cum se arată slăbiciunea și ce înseamnă să fii în siguranță.",
    domain: "family",
    goal: "origins",
    sources: ["Bowlby — atașamentul", "Gibson — cele patru tipuri de părinți imaturi", "Young — Schema Therapy"],
    steps: [
      {
        id: "prezența",
        question: "Când te gândești la tata în copilărie, prima imagine care îți vine — unde e el și unde ești tu?",
        options: ["Aproape, dar tăcut", "Absent, la muncă", "Prezent și cald", "Imprevizibil", "Nu-mi vine nicio imagine"],
        lookingFor:
          "Disponibilitatea emoțională, nu prezența fizică. Imaginea spontană e mai onestă decât evaluarea.",
        schemas: ["emotional_deprivation", "abandonment", "vulnerability"],
      },
      {
        id: "supărarea-lui",
        question: "Ce se întâmpla când tata se supăra? Descrie ultima dată de care îți amintești.",
        options: ["Se făcea liniște", "Țipa", "Dispărea", "Explica", "Nu-l vedeam supărat"],
        lookingFor:
          "Cum a învățat copilul să trateze furia unui bărbat — și, prin ea, propria furie.",
        schemas: ["subjugation", "emotional_inhibition", "mistrust", "punitiveness"],
      },
      {
        id: "mândria-lui",
        question: "Ce trebuia să faci ca tata să fie mândru de tine? Și a fost vreodată, clar, fără condiții?",
        lookingFor:
          "Condiția valorii. Diferența dintre mândrie condiționată și necondiționată e diferența dintre standarde nerealiste și siguranță.",
        schemas: ["unrelenting_standards", "approval_seeking", "failure", "defectiveness"],
      },
      {
        id: "slăbiciunea",
        question: "L-ai văzut vreodată pe tata plângând, speriat sau nesigur? Ce s-a întâmplat atunci?",
        lookingFor:
          "Ce a învățat copilul despre vulnerabilitatea masculină. Absența ei totală e la fel de informativă ca prezența.",
        schemas: ["emotional_inhibition", "vulnerability"],
      },
      {
        id: "propoziția-lui",
        question: "Ce propoziție a lui o mai auzi și acum, în capul tău, cu vocea lui?",
        lookingFor:
          "Vocea internalizată. Adesea e chiar criticul interior, cuvânt cu cuvânt.",
        schemas: ["punitiveness", "unrelenting_standards", "defectiveness"],
      },
      {
        id: "acum",
        question: "Cum arată relația cu el acum — sau cum ar arăta, dacă ar fi posibilă? Ce ai vrea să-i spui și nu spui?",
        lookingFor:
          "Ce a rămas nerezolvat. Ce nu se spune e adesea exact convingerea care încă lucrează.",
        schemas: ["enmeshment", "subjugation", "emotional_deprivation"],
      },
    ],
  },

  {
    id: "relatia-cu-mama",
    title: "Relația cu mama",
    summary:
      "Prima relație din viață. De aici vine felul în care aștepți să fii " +
      "văzut, liniștit și acceptat — sau nu.",
    domain: "family",
    goal: "origins",
    sources: ["Bowlby / Ainsworth — atașamentul", "Gibson — Adult Children of Emotionally Immature Parents", "Miller — Drama copilului dotat"],
    steps: [
      {
        id: "când-plângeai",
        question: "Când erai mic și plângeai, ce făcea mama de cele mai multe ori?",
        options: ["Venea și mă liniștea", "Îmi spunea să încetez", "Se enerva", "Nu observa", "Depindea de ziua ei"],
        lookingFor:
          "Răspunsul la nevoie — baza tiparului de atașament. „Depindea de ziua ei” e semnătura atașamentului anxios.",
        schemas: ["emotional_deprivation", "abandonment", "emotional_inhibition", "subjugation"],
      },
      {
        id: "ea-avea-nevoie",
        question: "Simțeai vreodată că tu trebuie să ai grijă de mama — de starea ei, de supărările ei?",
        options: ["Des, era treaba mea", "Uneori", "Rar", "Niciodată, ea avea grijă de mine"],
        lookingFor:
          "Inversarea rolurilor (parentificare). Copilul care liniștește părintele devine adultul care se sacrifică.",
        schemas: ["self_sacrifice", "enmeshment", "subjugation"],
      },
      {
        id: "ce-vedea",
        question: "Te simțeai văzut de ea — așa cum erai, nu cum ar fi vrut să fii?",
        lookingFor:
          "Miller: copilul care învață să fie ce are nevoie părintele își pierde accesul la propriile nevoi.",
        schemas: ["defectiveness", "approval_seeking", "enmeshment", "emotional_deprivation"],
      },
      {
        id: "dezamăgirea",
        question: "Ce însemna să o dezamăgești pe mama? Cum aflai că ai dezamăgit-o?",
        options: ["Tăcere și răceală", "Reproșuri", "Lacrimi și vinovăție", "Nu se întâmpla", "Furie"],
        lookingFor:
          "Mecanismul de control. Tăcerea produce subjugare; vinovăția, fuziune; furia, neîncredere.",
        schemas: ["subjugation", "enmeshment", "punitiveness", "mistrust"],
      },
      {
        id: "distanța",
        question: "Cât de aproape e prea aproape, cu ea? Și cât de departe e prea departe?",
        lookingFor:
          "Granițele. Răspunsul arată dacă omul a putut deveni separat sau încă negociază separarea.",
        schemas: ["enmeshment", "abandonment"],
      },
      {
        id: "ce-porți",
        question: "Ce ai luat de la ea și încă porți — bun sau greu — fără să fi ales?",
        lookingFor: "Formularea proprie a moștenirii.",
        schemas: [],
      },
    ],
  },

  {
    id: "cand-greseai",
    title: "Ce se întâmpla când greșeai",
    summary:
      "Felul în care îți vorbești acum după o greșeală a fost învățat de undeva. " +
      "Aici aflăm de unde.",
    domain: "self",
    goal: "self",
    sources: ["Young — schemele Pedepsire și Standarde nerealiste", "Beck — convingerile nucleu", "Brown — rușinea"],
    steps: [
      {
        id: "reacția",
        question: "Când greșeai ceva acasă — spărgeai, uitai, luai o notă proastă — ce se întâmpla de obicei?",
        options: ["Pedeapsă", "Tăcere grea", "„Nu-i nimic” și gata", "Explicație calmă", "Nu se observa"],
        lookingFor:
          "Răspunsul la greșeală e sursa directă a schemei de pedepsire și a criticului interior.",
        schemas: ["punitiveness", "unrelenting_standards", "emotional_deprivation"],
      },
      {
        id: "cuvintele",
        question: "Ce cuvinte se spuneau? Exact, dacă poți.",
        lookingFor:
          "Vocea critică, literal. Adesea aceleași cuvinte pe care omul și le spune azi.",
        schemas: ["defectiveness", "punitiveness"],
      },
      {
        id: "greșeala-vs-tu",
        question: "Se critica ce ai făcut, sau cine ești? „Ai greșit” sau „ești un…”?",
        options: ["Ce am făcut", "Cine sunt", "Amândouă", "Nu se spunea nimic"],
        lookingFor:
          "Distincția dintre vinovăție (am făcut ceva rău) și rușine (sunt rău). Rușinea produce schema Defect.",
        schemas: ["defectiveness", "punitiveness"],
      },
      {
        id: "cum-repar",
        question: "Cum se repara? Cât dura până totul revenea la normal?",
        options: ["Repede, cu o îmbrățișare", "Trebuia să dovedesc că-mi pare rău", "Zile de răceală", "Nu se repara, se uita"],
        lookingFor:
          "Reparația. Absența ei învață copilul că greșeala e permanentă și trebuie ascunsă.",
        schemas: ["punitiveness", "abandonment", "defectiveness"],
      },
      {
        id: "acum",
        question: "Când greșești acum, ce îți spui tu în cap, în primele trei secunde?",
        lookingFor:
          "Continuitatea. Legătura directă între răspunsul părintelui și autocritica de azi.",
        schemas: ["punitiveness", "unrelenting_standards", "defectiveness"],
      },
    ],
  },

  {
    id: "emotiile-acasa",
    title: "Ce aveai voie să simți",
    summary:
      "În fiecare casă există emoții permise și emoții interzise. Cele " +
      "interzise nu dispar — se mută în corp sau în tăcere.",
    domain: "self",
    goal: "self",
    sources: ["Young — Inhibiție emoțională, Deprivare emoțională", "Walker — CPTSD", "Maté — Scattered Minds"],
    steps: [
      {
        id: "furia",
        question: "Ce se întâmpla când erai furios, copil fiind? Aveai voie?",
        options: ["Se pedepsea", "Se ignora", "Era permisă, dar nu la părinți", "Era normală", "Nu-mi amintesc să fiu furios"],
        lookingFor:
          "Furia interzisă devine subjugare sau se întoarce spre sine. „Nu-mi amintesc” e adesea inhibiție profundă.",
        schemas: ["emotional_inhibition", "subjugation", "punitiveness"],
      },
      {
        id: "tristețea",
        question: "Și tristețea? Ce se spunea când plângeai — la orice vârstă?",
        options: ["„Nu mai plânge”", "„Ce ai, ce s-a întâmplat?”", "Eram luat în râs", "Nimic, plângeam singur", "Eram consolat"],
        lookingFor: "Legitimitatea tristeții. Sursa directă a deprivării emoționale.",
        schemas: ["emotional_deprivation", "emotional_inhibition", "defectiveness"],
      },
      {
        id: "bucuria",
        question: "Bucuria zgomotoasă — să te entuziasmezi, să sari, să râzi tare — era în regulă?",
        lookingFor:
          "Inhibiția nu ține doar de emoțiile negative. Bucuria pedepsită produce schema de negativism: „nu te bucura, că se strică”.",
        schemas: ["negativity", "emotional_inhibition"],
      },
      {
        id: "frica",
        question: "Când te temeai de ceva, la cine te duceai? Sau nu te duceai la nimeni?",
        options: ["La mama", "La tata", "La un frate sau bunic", "La nimeni", "Nu-mi amintesc frică"],
        lookingFor:
          "Figura de atașament sigură, dacă a existat. „La nimeni” e semnificativ.",
        schemas: ["emotional_deprivation", "abandonment", "vulnerability"],
      },
      {
        id: "corpul",
        question: "Ce face corpul tău acum cu emoțiile pe care nu le arăți? Unde le simți?",
        lookingFor:
          "Maté: emoția neexprimată se exprimă somatic. Legătura sănătate–inhibiție.",
        schemas: ["emotional_inhibition"],
      },
    ],
  },

  {
    id: "rusinea",
    title: "Rușinea și cine te-a văzut",
    summary:
      "Rușinea nu e „am greșit”, ci „sunt greșit”. Se instalează într-un moment " +
      "anume, cu cineva anume care se uita.",
    domain: "self",
    goal: "self",
    sources: ["Brown — Daring Greatly; I Thought It Was Just Me", "Young — Defect / Rușine", "Miller — Drama copilului dotat"],
    steps: [
      {
        id: "prima",
        question: "Care e prima amintire în care ți-a fost rușine — nu jenă, rușine? Cine se uita?",
        lookingFor:
          "Scena originară. Brown: rușinea are întotdeauna un martor, real sau imaginat.",
        schemas: ["defectiveness", "social_isolation"],
      },
      {
        id: "ce-ascunzi",
        question: "Ce parte din tine crezi că i-ar face pe ceilalți să se îndepărteze, dacă ar vedea-o?",
        options: ["Cât de nesigur sunt", "Cât de mult am nevoie", "Furia mea", "Că nu sunt așa capabil", "Corpul meu", "Trecutul meu"],
        lookingFor:
          "Conținutul schemei Defect: ce anume e considerat inacceptabil. Fiecare variantă indică o rușine diferită.",
        schemas: ["defectiveness", "emotional_deprivation", "failure", "emotional_inhibition"],
      },
      {
        id: "cum-te-aperi",
        question: "Când simți rușine acum, ce faci în primele secunde?",
        options: ["Mă retrag și tac", "Atac sau ironizez", "Mă justific mult", "Fac pe placul celuilalt", "Îngheț"],
        lookingFor:
          "Walker: cele patru răspunsuri la amenințare — fugă, luptă, îngheț, supunere. Fiecare e o strategie învățată.",
        schemas: ["social_isolation", "mistrust", "approval_seeking", "subjugation"],
      },
      {
        id: "cine-știe",
        question: "Există cineva care știe lucrul de care ți-e cel mai rușine? Ce s-a întâmplat când a aflat?",
        lookingFor:
          "Brown: rușinea se dizolvă în empatie și crește în secret. Absența oricui e diagnostic.",
        schemas: ["defectiveness", "social_isolation", "mistrust"],
      },
      {
        id: "vocea",
        question: "Când îți vorbești cu rușine, a cui e vocea? Cine a spus prima dată acele cuvinte?",
        lookingFor: "Sursa vocii critice. Adesea un părinte, un profesor, un frate.",
        schemas: ["punitiveness", "defectiveness"],
      },
    ],
  },

  // =========================================================== relații
  {
    id: "apropiere-si-retragere",
    title: "Cum te apropii și cum te retragi",
    summary:
      "Fiecare om are un tipar de apropiere învățat devreme: cât de aproape e " +
      "sigur, când e momentul să fugi, ce înseamnă când celălalt tace.",
    domain: "relationships",
    goal: "relationships",
    sources: ["Levine & Heller — Attached", "Bowlby — atașamentul", "Young — Abandon, Subjugare, Neîncredere"],
    steps: [
      {
        id: "tăcerea",
        question: "Când persoana apropiată nu răspunde la mesaj câteva ore, ce se întâmplă în tine?",
        options: ["Nimic, e ocupată", "Neliniște crescândă", "Mă răcesc eu primul", "Verific dacă am greșit ceva", "Iritare"],
        lookingFor:
          "Stilul de atașament în acțiune. Anxios: neliniște, verificare. Evitant: răcire. Sigur: nimic.",
        schemas: ["abandonment", "mistrust", "defectiveness"],
      },
      {
        id: "cearta",
        question: "Ce faci în timpul unei certe? Nu ce ai vrea — ce faci de fapt.",
        options: ["Plec sau tac", "Insist până se rezolvă", "Cedez repede", "Ridic tonul", "Îngheț"],
        lookingFor: "Strategia de conflict, învățată acasă și rejucată.",
        schemas: ["subjugation", "emotional_inhibition", "abandonment", "entitlement"],
      },
      {
        id: "nevoia",
        question: "Când ai nevoie de ceva de la partener — atenție, ajutor, timp — cum ceri?",
        options: ["Direct", "Dau semne și aștept să observe", "Nu cer, mă descurc", "Cer, apoi mă simt vinovat"],
        lookingFor:
          "Capacitatea de a avea nevoi. „Dau semne” e testare; „nu cer” e deprivare acceptată.",
        schemas: ["emotional_deprivation", "subjugation", "self_sacrifice", "dependence"],
      },
      {
        id: "repetiția",
        question: "Ce s-a repetat în relațiile tale, cu oameni diferiți? Aceeași ceartă, același final, același rol?",
        lookingFor:
          "Tiparul relațional. Ce se repetă cu parteneri diferiți nu e despre parteneri.",
        schemas: [],
      },
      {
        id: "primul-pas",
        question: "După o ceartă, cine se apropie primul? Și ce simți în timpul care trece până atunci?",
        lookingFor: "Toleranța la ruptură și capacitatea de reparație.",
        schemas: ["abandonment", "entitlement", "subjugation"],
      },
      {
        id: "acasă",
        question: "Cu ce seamănă asta din casa în care ai crescut? Cine făcea primul pas acolo?",
        lookingFor: "Legătura explicită cu originea. Omul face conexiunea singur.",
        schemas: [],
      },
    ],
  },

  {
    id: "siguranta",
    title: "Cum ai învățat să te simți în siguranță",
    summary:
      "Fiecare a găsit, copil fiind, o strategie ca să fie în siguranță: să fie " +
      "perfect, invizibil, util sau vigilent. Strategia a rămas.",
    domain: "self",
    goal: "origins",
    sources: ["Walker — Complex PTSD", "Young — Vulnerabilitate, Neîncredere", "Maté — The Myth of Normal"],
    steps: [
      {
        id: "pericolul",
        question: "Ce era periculos în casa în care ai crescut? Nu neapărat fizic — ce trebuia evitat?",
        options: ["Supărarea unui părinte", "Să fii observat", "Să fii o povară", "Să greșești", "Nimic, era sigur"],
        lookingFor: "Sursa hipervigilenței. Ce a fost periculos definește ce e evitat azi.",
        schemas: ["vulnerability", "mistrust", "subjugation", "unrelenting_standards"],
      },
      {
        id: "strategia",
        question: "Și ce făceai ca să fii în siguranță? Care era trucul tău?",
        options: ["Eram perfect", "Eram invizibil", "Eram util", "Eram amuzant", "Eram vigilent, anticipam"],
        lookingFor:
          "Strategia de supraviețuire. Devine, la adult, perfecționism, izolare, autosacrificiu, mască sau control.",
        schemas: ["unrelenting_standards", "social_isolation", "self_sacrifice", "approval_seeking", "vulnerability"],
      },
      {
        id: "a-mers",
        question: "A funcționat? Ce ai obținut prin strategia asta — și ce a costat?",
        lookingFor:
          "Recunoașterea că strategia a fost bună. Fără asta, omul o apără. Cu asta, poate s-o lase.",
        schemas: [],
      },
      {
        id: "azi",
        question: "În ce situații de acum se pornește aceeași strategie, deși nu mai e niciun pericol?",
        lookingFor: "Transferul în prezent. Situații concrete.",
        schemas: [],
      },
      {
        id: "relaxarea",
        question: "Când te-ai simțit ultima dată complet în siguranță — fără să fii vigilent? Unde erai, cu cine?",
        lookingFor:
          "Dacă răspunsul e „nu-mi amintesc”, vigilența e cronică. Dacă există, arată ce condiții o opresc.",
        schemas: ["vulnerability", "mistrust"],
      },
    ],
  },

  // =========================================================== bani și muncă
  {
    id: "banii-in-copilarie",
    title: "Banii în casa în care ai crescut",
    summary:
      "Relația cu banii nu se calculează, se moștenește. Din atmosferă, nu din " +
      "sfaturi.",
    domain: "money",
    goal: "money_work",
    sources: ["Young — Vulnerabilitate, Autocontrol, Standarde", "Klontz — Money Scripts", "Beck — convingerile nucleu"],
    steps: [
      {
        id: "prima",
        question: "Prima amintire legată de bani, în casa în care ai crescut. Scena, nu concluzia.",
        lookingFor: "Scena originară a scriptului financiar.",
        schemas: ["vulnerability", "emotional_deprivation"],
      },
      {
        id: "cum-se-vorbea",
        question: "Cum se vorbea despre bani acasă?",
        options: ["Cu grijă și frică", "Nu se vorbea, era tabu", "Cu ceartă", "Relaxat", "Cu mândrie sau rușine față de alții"],
        lookingFor:
          "Klontz: cele patru scripturi — evitare, venerare, statut, vigilență. Fiecare variantă indică unul.",
        schemas: ["vulnerability", "emotional_inhibition", "approval_seeking", "negativity"],
      },
      {
        id: "cererea",
        question: "Când aveai nevoie de bani de la părinți — pentru ceva pentru tine — ce se întâmpla?",
        options: ["Primeam fără probleme", "Trebuia să justific", "Primeam cu reproș", "Nu cerem, știam că nu e", "Depindea de dispoziție"],
        lookingFor:
          "Legătura bani–valoare personală. „Cu reproș” produce vinovăție la cheltuială; „nu cerem” produce deprivare acceptată.",
        schemas: ["subjugation", "emotional_deprivation", "self_sacrifice", "vulnerability"],
      },
      {
        id: "cine-avea",
        question: "Ce se spunea despre oamenii cu bani? Și despre cei fără?",
        lookingFor:
          "Judecata morală despre bani. „Cine are s-a aranjat” face succesul propriu incompatibil cu a fi om bun.",
        schemas: ["approval_seeking", "defectiveness", "entitlement"],
      },
      {
        id: "destul",
        question: "Ce sumă ai avea nevoie ca să te simți liniștit? Și dacă ai avea-o mâine, crezi că te-ai simți așa?",
        lookingFor:
          "Testul crucial: dacă răspunsul e nu, problema nu e suma, e regula despre siguranță.",
        schemas: ["vulnerability", "negativity"],
      },
      {
        id: "acum",
        question: "Când ai cheltuit ultima dată pe tine și te-ai simțit vinovat? Ce ai cumpărat?",
        lookingFor: "Regula în acțiune, azi.",
        schemas: ["self_sacrifice", "subjugation", "punitiveness"],
      },
    ],
  },

  {
    id: "munca-si-valoarea",
    title: "Munca și cât valorezi",
    summary:
      "Pentru mulți, valoarea personală și performanța sunt același lucru. Aici " +
      "aflăm când s-au lipit.",
    domain: "work",
    goal: "money_work",
    sources: ["Young — Standarde nerealiste, Eșec, Căutarea aprobării", "Beck — convingerile nucleu", "Brown — Daring Greatly"],
    steps: [
      {
        id: "notele",
        question: "Ce se întâmpla acasă când veneai cu o notă bună? Și cu una proastă?",
        options: ["Diferență mare între ele", "Nota bună era normalul, cea proastă o problemă", "Nu conta prea mult", "Se compara cu alții"],
        lookingFor:
          "Asimetria e cheia: dacă nota bună nu aducea nimic și cea proastă aducea pedeapsă, performanța devine evitare, nu aspirație.",
        schemas: ["unrelenting_standards", "failure", "approval_seeking"],
      },
      {
        id: "odihna",
        question: "Ce se spunea despre odihnă, lene, timp liber?",
        options: ["Odihna se merită", "Nu se odihnea nimeni", "Era normală", "„Lenea e păcat”"],
        lookingFor: "Legitimitatea pauzei. Sursa epuizării de mai târziu.",
        schemas: ["unrelenting_standards", "punitiveness", "self_sacrifice"],
      },
      {
        id: "impostor",
        question: "Ai avut senzația că cineva o să-și dea seama că nu meriți locul în care ești? Când, ultima dată?",
        lookingFor: "Schema Eșec în forma ei modernă. Situație concretă.",
        schemas: ["failure", "defectiveness"],
      },
      {
        id: "gratis",
        question: "Ce parte din munca ta ai face-o și dacă nu te-ar plăti nimeni?",
        lookingFor:
          "Valorile, separate de convingeri. Dacă răspunsul e „nimic”, munca e în întregime strategie, nu alegere.",
        schemas: [],
      },
      {
        id: "nu",
        question: "Când ai spus ultima dată „nu” la muncă? Ce te-a costat — sau ce ți-a fost frică să te coste?",
        lookingFor: "Subjugarea în context profesional.",
        schemas: ["subjugation", "approval_seeking", "vulnerability"],
      },
    ],
  },

  // =========================================================== ca părinte
  {
    id: "ca-parinte",
    title: "Ce le transmiți copiilor tăi",
    summary:
      "Copiii nu învață din ce le spui, ci din ce faci când ești obosit. " +
      "Aici te uiți la ce transmiți fără să vrei.",
    domain: "children",
    goal: "parenting",
    sources: ["Gibson — Adult Children of Emotionally Immature Parents", "Siegel & Hartzell — Parenting from the Inside Out", "Young — Schema Therapy"],
    steps: [
      {
        id: "ecoul",
        question: "A fost vreun moment în care te-ai auzit vorbind exact ca părintele tău? Ce se întâmplase?",
        lookingFor: "Transmiterea intergenerațională, recunoscută de om.",
        schemas: ["punitiveness", "unrelenting_standards", "emotional_inhibition"],
      },
      {
        id: "greșeala-lui",
        question: "Când copilul tău greșește ceva, ce faci în primele trei secunde? Nu după — în primele trei secunde.",
        options: ["Respir și explic", "Mă enervez", "Mă îngrijorez", "Râd", "Depinde cât sunt de obosit"],
        lookingFor:
          "Reflexul, nu intenția. Reflexul e ce a învățat el acasă și ce transmite acum.",
        schemas: ["punitiveness", "vulnerability", "unrelenting_standards"],
      },
      {
        id: "ce-speri",
        question: "Ce speri că nu va simți niciodată copilul tău?",
        lookingFor:
          "Oglinda perfectă: ce vrea să evite la copil e ce a simțit el.",
        schemas: [],
      },
      {
        id: "mulțumirea",
        question: "Ce crede copilul tău că trebuie să facă pentru ca tu să fii mulțumit? Sincer.",
        lookingFor: "Condiția valorii, transmisă. Cel mai greu pas al ghidului.",
        schemas: ["unrelenting_standards", "approval_seeking", "self_sacrifice"],
      },
      {
        id: "reparația",
        question: "Când greșești tu față de el — țipi, ești nedrept — ce faci după?",
        options: ["Îmi cer scuze și explic", "Trec peste, nu mai vorbim", "Justific de ce am reacționat", "Mă simt groaznic în tăcere"],
        lookingFor:
          "Reparația, nu perfecțiunea, construiește siguranța (Siegel). Absența ei e ce se transmite.",
        schemas: ["punitiveness", "emotional_inhibition", "defectiveness"],
      },
    ],
  },
  {
    id: "tiparul-care-tine-firma-pe-loc",
    title: "Tiparul care îți ține firma pe loc",
    summary:
      "Dezordinea fondatorului se vede în firmă. Nu strategia, nu piața — " +
      "regula personală care decide ce nu delegi, ce nu ceri și ce nu livrezi.",
    domain: "work",
    goal: "money_work",
    sources: [
      "Young — Standarde nerealiste, Dependență, Autocontrol, Îndreptățire, Subjugare",
      "Petre Nicolae — PRP: evaluarea tiparelor fondatorului înaintea structurii",
      "Gerber — The E-Myth (tehnicianul care deschide o firmă)",
    ],
    steps: [
      {
        id: "blocajul",
        question: "Unde simți că firma sau munca ta bate pasul pe loc? Nu cifra — locul.",
        options: [
          "Nu pot delega, fac eu tot",
          "Nu îmi cresc prețurile",
          "Amân deciziile mari",
          "Nu vând, aștept să vină clienții",
          "Încep multe, termin puține",
        ],
        lookingFor:
          "Fiecare variantă e un tipar personal deghizat în problemă de business: control, subjugare, evitare, aprobare, autocontrol.",
        schemas: ["unrelenting_standards", "subjugation", "vulnerability", "approval_seeking", "insufficient_self_control"],
      },
      {
        id: "delegarea",
        question: "Ultima dată când ai dat cuiva o sarcină importantă — ce ai făcut după? Sincer.",
        options: ["Am verificat de trei ori", "Am refăcut-o eu", "Am lăsat-o și a mers", "N-am dat-o, am făcut-o eu"],
        lookingFor:
          "Controlul ca protecție. Refacerea în locul feedback-ului e standard nerealist; nedelegarea e neîncredere sau dependență inversată.",
        schemas: ["unrelenting_standards", "mistrust", "dependence"],
      },
      {
        id: "pretul",
        question: "Când ai spus ultima dată un preț și ai simțit că e prea mare — deși știai că nu e? Ce ai făcut?",
        options: ["L-am scăzut înainte să răspundă", "L-am spus și am justificat mult", "L-am spus și am tăcut", "Nu-mi amintesc să fi simțit asta"],
        lookingFor:
          "Banii ca valoare personală. Scăderea preventivă e subjugare; justificarea excesivă e căutare de aprobare.",
        schemas: ["subjugation", "approval_seeking", "defectiveness"],
      },
      {
        id: "decizia",
        question: "Care e decizia pe care o amâni de cel mai mult timp în firmă? Ce s-ar întâmpla dacă ai lua-o mâine?",
        lookingFor:
          "Amânarea ca evitare a expunerii. Răspunsul la „ce s-ar întâmpla” arată frica reală, nu cea declarată.",
        schemas: ["vulnerability", "failure", "negativity"],
      },
      {
        id: "acasa",
        question: "Cine, din casa în care ai crescut, avea aceeași problemă — cu banii, cu controlul, cu „fac eu tot”?",
        lookingFor:
          "Originea. Tiparul de business e aproape întotdeauna un tipar de familie cu costum.",
        schemas: [],
      },
      {
        id: "costul",
        question: "Ce te-a costat tiparul ăsta în ultimul an — în bani, în ore, în oameni? Pune o cifră, chiar aproximativă.",
        lookingFor:
          "Cuantificarea. Nicolae: se reconstruiește cu structură, nu cu motivație — iar structura începe cu costul măsurat, nu simțit.",
        schemas: [],
      },
    ],
  },
];

export const GUIDE_BY_ID = new Map(GUIDES.map((g) => [g.id, g]));

export function getGuide(id: string): Guide | null {
  return GUIDE_BY_ID.get(id) ?? null;
}

export function guidesByGoal(goal: GuideGoal): Guide[] {
  return GUIDES.filter((g) => g.goal === goal);
}
