/**
 * Cele 18 scheme dezadaptative timpurii — sistemul de clasare al hărții.
 *
 * Sursa: Jeffrey Young, „Schema Therapy: A Practitioner's Guide” (Young,
 * Klosko, Weishaar, 2003) și „Reinventing Your Life” (Young & Klosko). Este
 * cea mai bine validată taxonomie a convingerilor formate în copilărie și
 * răspunde exact la întrebarea „ce fel de tipar e acesta?” — nu cu o etichetă
 * inventată, ci cu una pe care un psihoterapeut ar recunoaște-o.
 *
 * Numele de aici sunt cele folosite în literatura românească de terapia
 * schemelor, iar descrierile sunt rescrise în limbaj obișnuit: omul trebuie
 * să se recunoască în ele, nu să le studieze.
 *
 * O schemă nu este un diagnostic. Toată lumea are câteva, mai slabe sau mai
 * puternice. Clasarea spune „convingerea asta face parte din familia X”, ceea
 * ce leagă între ele lucruri care păreau fără legătură — și de acolo începe
 * înțelegerea.
 */

export type SchemaDomain =
  | "disconnection"
  | "autonomy"
  | "limits"
  | "other_directed"
  | "overvigilance";

export const SCHEMA_DOMAIN_LABELS: Record<SchemaDomain, string> = {
  disconnection: "Deconectare și respingere",
  autonomy: "Autonomie și competență",
  limits: "Limite",
  other_directed: "Orientare spre ceilalți",
  overvigilance: "Hipervigilență și inhibiție",
};

/** Ce nevoie a copilului a rămas neîmplinită, per domeniu. Formulat pentru om. */
export const SCHEMA_DOMAIN_NEED: Record<SchemaDomain, string> = {
  disconnection: "siguranță, atașament stabil, acceptare",
  autonomy: "încredere că te poți descurca singur",
  limits: "granițe realiste și autodisciplină",
  other_directed: "libertatea de a-ți exprima nevoile și de a fi tu",
  overvigilance: "spontaneitate, joacă, permisiunea de a greși",
};

export interface Schema {
  code: string;
  name: string;
  domain: SchemaDomain;
  /** O propoziție care spune ce simte omul, nu ce scrie în manual. */
  essence: string;
  /** Convingeri tipice, la persoana întâi. Ajută extracția să recunoască schema. */
  beliefs: string[];
  /** De unde vine, de regulă. Fără vină. */
  origin: string;
  /** Cum se vede în comportament. */
  signs: string[];
}

export const SCHEMAS: Schema[] = [
  // ------------------------------------------------- deconectare și respingere
  {
    code: "abandonment",
    name: "Abandon / instabilitate",
    domain: "disconnection",
    essence: "Oamenii importanți pleacă, mor sau devin indisponibili. Legătura nu ține.",
    beliefs: [
      "Oricine mă iubește va pleca în cele din urmă.",
      "Nu pot conta pe nimeni să rămână.",
      "Dacă mă apropii prea mult, o să sufăr când se termină.",
    ],
    origin:
      "Un părinte absent, imprevizibil sau bolnav; divorț timpuriu; mutări repetate; " +
      "o figură de atașament care apărea și dispărea.",
    signs: [
      "Te agăți de relații sau, invers, pleci primul ca să nu fii părăsit.",
      "Gelozie și panică la semnale mici de distanță.",
      "Alegi parteneri indisponibili, care confirmă regula.",
    ],
  },
  {
    code: "mistrust",
    name: "Neîncredere / abuz",
    domain: "disconnection",
    essence: "Ceilalți te vor răni, minți sau folosi dacă le dai ocazia.",
    beliefs: [
      "Oamenii vor să profite de mine.",
      "Trebuie să fiu mereu cu garda sus.",
      "Nimeni nu face nimic fără interes.",
    ],
    origin:
      "Abuz fizic, emoțional sau sexual; un părinte care umilea; trădări repetate " +
      "din partea celor care trebuiau să protejeze.",
    signs: [
      "Cauți al doilea sens în gesturile bune.",
      "Testezi oamenii înainte să te deschizi, uneori la nesfârșit.",
      "Reacționezi disproporționat la orice pare nedreptate.",
    ],
  },
  {
    code: "emotional_deprivation",
    name: "Deprivare emoțională",
    domain: "disconnection",
    essence: "Nevoia ta de căldură, înțelegere și protecție nu va fi împlinită de nimeni.",
    beliefs: [
      "Nimeni nu e cu adevărat acolo pentru mine.",
      "Nu am pe cine să mă sprijin.",
      "Nu are rost să spun ce simt, oricum nu înțelege nimeni.",
    ],
    origin:
      "Părinți reci, distanți sau prea ocupați; casă în care nevoile fizice erau " +
      "acoperite, dar cele emoționale nu se numeau niciodată.",
    signs: [
      "Nu ceri afecțiune și te miri când nu o primești.",
      "Alegi oameni reci și te simți singur în relații.",
      "Simți un gol pe care nu-l poți numi.",
    ],
  },
  {
    code: "defectiveness",
    name: "Defect / rușine",
    domain: "disconnection",
    essence: "În adânc, ceva e greșit la tine. Dacă ar vedea, s-ar îndepărta.",
    beliefs: [
      "Dacă m-ar cunoaște cu adevărat, nu m-ar mai vrea.",
      "Nu merit să fiu iubit.",
      "Sunt fundamental defect, nu doar greșesc uneori.",
    ],
    origin:
      "Critică constantă, umilire, respingere de la părinți; un părinte care te " +
      "făcea să simți că ești o dezamăgire.",
    signs: [
      "Ascunzi părți din tine și trăiești cu frica de a fi descoperit.",
      "Nu poți primi complimente.",
      "Alegi parteneri critici, care confirmă ce crezi deja.",
    ],
  },
  {
    code: "social_isolation",
    name: "Izolare socială / înstrăinare",
    domain: "disconnection",
    essence: "Ești diferit de ceilalți și nu aparții niciunui grup.",
    beliefs: [
      "Nu mă potrivesc nicăieri.",
      "Ceilalți au ceva ce eu nu am.",
      "Sunt pe dinafară, chiar și când sunt înăuntru.",
    ],
    origin:
      "Familie diferită de comunitate; mutări; a fi singurul de un anumit fel — " +
      "prin origine, boală, situație materială.",
    signs: [
      "Rămâi la marginea grupurilor, chiar când ești invitat înăuntru.",
      "Observi în loc să participi.",
      "Te simți impostor în orice grup din care faci parte.",
    ],
  },

  // ------------------------------------------------- autonomie și competență
  {
    code: "dependence",
    name: "Dependență / incompetență",
    domain: "autonomy",
    essence: "Nu te poți descurca singur fără ajutor considerabil.",
    beliefs: [
      "Nu sunt în stare să iau decizii singur.",
      "Dacă nu mă ajută cineva, o să dau greș.",
      "Am nevoie de cineva mai capabil lângă mine.",
    ],
    origin:
      "Părinți supraprotectori, care făceau totul în locul copilului; sau, invers, " +
      "atât de absenți încât copilul nu a avut de la cine învăța.",
    signs: [
      "Amâni deciziile până ia altcineva.",
      "Ceri confirmare pentru lucruri mici.",
      "Te panichezi când ești lăsat singur cu o sarcină.",
    ],
  },
  {
    code: "vulnerability",
    name: "Vulnerabilitate la rău sau boală",
    domain: "autonomy",
    essence: "Catastrofa e aproape și nu o poți preveni.",
    beliefs: [
      "Ceva rău o să se întâmple oricând.",
      "Trebuie să fiu pregătit pentru cel mai rău caz.",
      "Nu sunt în siguranță nicăieri cu adevărat.",
    ],
    origin:
      "Un părinte anxios, care vedea pericol peste tot; o boală sau o pierdere " +
      "bruscă în familie; instabilitate materială trăită ca amenințare constantă.",
    signs: [
      "Verifici, planifici și asiguri excesiv.",
      "Simptome fizice mici devin scenarii grave.",
      "Nu te poți relaxa nici când totul e bine.",
    ],
  },
  {
    code: "enmeshment",
    name: "Sine nedezvoltat / fuziune",
    domain: "autonomy",
    essence: "Nu știi unde te termini tu și unde încep ceilalți, mai ales părinții.",
    beliefs: [
      "Nu pot fi fericit dacă mama nu e fericită.",
      "Nu știu ce vreau eu, separat de ce vor ei.",
      "Ar fi o trădare să trăiesc altfel decât familia mea.",
    ],
    origin:
      "Un părinte care trăia prin copil, împărtășea totul cu el, îl făcea " +
      "confident sau partener; granițe inexistente între generații.",
    signs: [
      "Vinovăție intensă la orice pas de independență.",
      "Vorbești cu părinții zilnic și te simți gol când nu.",
      "Nu ai preferințe clare — le iei pe ale celor din jur.",
    ],
  },
  {
    code: "failure",
    name: "Eșec",
    domain: "autonomy",
    essence: "Ai eșuat, eșuezi și vei eșua, față de ceilalți.",
    beliefs: [
      "Sunt mai puțin capabil decât toți cei din jur.",
      "Orice reușită e noroc sau o eroare care se va vedea.",
      "Nu am ce căuta la nivelul ăsta.",
    ],
    origin:
      "Comparație constantă cu un frate sau coleg; un părinte care minimaliza " +
      "reușitele; dificultăți școlare tratate ca defect de caracter.",
    signs: [
      "Nu aplici, nu propui, nu ceri — ca să nu confirmi.",
      "Muncești de trei ori mai mult ca să acoperi ce crezi că îți lipsește.",
      "Sindromul impostorului.",
    ],
  },

  // ------------------------------------------------- limite
  {
    code: "entitlement",
    name: "Îndreptățire",
    domain: "limits",
    essence: "Regulile care se aplică altora nu ți se aplică și ție.",
    beliefs: [
      "Eu merit un tratament special.",
      "Nu ar trebui să fiu limitat de ce li se cere celorlalți.",
      "Când vreau ceva, trebuie să-l am.",
    ],
    origin:
      "Răsfăț fără limite; sau, paradoxal, deprivare atât de mare încât adultul " +
      "compensează cerând totul.",
    signs: [
      "Te enervezi când nu ți se face pe plac.",
      "Concurezi și pentru lucruri care nu contează.",
      "Greu de acceptat critica sau un refuz.",
    ],
  },
  {
    code: "insufficient_self_control",
    name: "Autocontrol insuficient",
    domain: "limits",
    essence: "Nu poți tolera frustrarea sau disconfortul destul cât să duci lucrurile la capăt.",
    beliefs: [
      "Nu pot să mă forțez să fac ce nu-mi place.",
      "Dacă e greu, înseamnă că nu e pentru mine.",
      "Trebuie să simt bine acum, nu mai târziu.",
    ],
    origin:
      "Părinți care nu au impus rutine sau limite; copil lăsat să evite tot ce era " +
      "neplăcut; sau haos casnic în care disciplina n-a existat niciodată.",
    signs: [
      "Abandonezi proiecte la prima frustrare.",
      "Amâni cronic tot ce e neplăcut.",
      "Spui lucruri pe care le regreți imediat.",
    ],
  },

  // ------------------------------------------------- orientare spre ceilalți
  {
    code: "subjugation",
    name: "Subjugare",
    domain: "other_directed",
    essence: "Trebuie să cedezi controlul altora, altfel urmează furia sau abandonul lor.",
    beliefs: [
      "Dacă spun ce vreau, o să se supere.",
      "E mai sigur să fac ce mi se cere.",
      "Nevoile mele nu contează la fel de mult.",
    ],
    origin:
      "Un părinte dominator sau cu furie imprevizibilă; copil pedepsit pentru că " +
      "și-a exprimat dorințele sau supărarea.",
    signs: [
      "Nu poți spune nu, iar când spui te simți vinovat ore întregi.",
      "Acumulezi resentiment și explodezi rar, dar tare.",
      "Nu știi ce vrei tu până nu știi ce vor ceilalți.",
    ],
  },
  {
    code: "self_sacrifice",
    name: "Autosacrificiu",
    domain: "other_directed",
    essence: "Nevoile altora vin înaintea tale — din grijă, nu din frică.",
    beliefs: [
      "Dacă nu am eu grijă de ei, cine?",
      "Ar fi egoist să mă pun pe primul loc.",
      "Mă simt vinovat când mi-e bine și altcuiva nu.",
    ],
    origin:
      "Un părinte bolnav, depresiv sau copleșit, pe care copilul a învățat să-l " +
      "susțină; a fi „cel responsabil” din familie de mic.",
    signs: [
      "Dai mult mai mult decât primești și nu observi decât când te prăbușești.",
      "Te simți vinovat când te odihnești.",
      "Alegi oameni care au nevoie de salvat.",
    ],
  },
  {
    code: "approval_seeking",
    name: "Căutarea aprobării",
    domain: "other_directed",
    essence: "Valoarea ta depinde de cum te văd ceilalți.",
    beliefs: [
      "Trebuie să fiu plăcut de toată lumea.",
      "Ce cred ceilalți despre mine e ce sunt.",
      "Dacă nu impresionez, nu contez.",
    ],
    origin:
      "Iubire condiționată de performanță sau aspect; părinți preocupați de " +
      "imagine și de „ce zice lumea”.",
    signs: [
      "Îți schimbi părerea după cine e în cameră.",
      "Alegi carieră, haine, parteneri după ce arată bine.",
      "Un comentariu negativ te ține treaz noaptea.",
    ],
  },

  // ------------------------------------------------- hipervigilență și inhibiție
  {
    code: "negativity",
    name: "Negativism / pesimism",
    domain: "overvigilance",
    essence: "Ce poate merge prost va merge prost, iar binele e temporar.",
    beliefs: [
      "Nu te bucura, că se strică.",
      "Trebuie să mă gândesc la tot ce poate ieși rău.",
      "Optimismul e naivitate.",
    ],
    origin:
      "Un părinte pesimist, îngrijorat cronic; pierderi reale care au învățat " +
      "copilul că bucuria precede dezastrul.",
    signs: [
      "Cauți defectul în orice veste bună.",
      "Te pregătești mental pentru dezamăgire înainte să se întâmple ceva.",
      "Ceilalți te descriu ca „realist”; tu știi că e frică.",
    ],
  },
  {
    code: "emotional_inhibition",
    name: "Inhibiție emoțională",
    domain: "overvigilance",
    essence: "Emoțiile trebuie ținute în frâu, altfel pierzi controlul sau ești judecat.",
    beliefs: [
      "Nu e în regulă să arăt ce simt.",
      "Furia e periculoasă, în orice formă.",
      "Rațiunea e mereu mai bună decât emoția.",
    ],
    origin:
      "Casă în care emoțiile erau ridiculizate, pedepsite sau simplu absente; " +
      "„nu plânge”, „fii bărbat”, „nu face scene”.",
    signs: [
      "Ceilalți te percep rece sau distant, tu te simți doar controlat.",
      "Nu-ți amintești când ai plâns ultima dată.",
      "Te descarci în corp: tensiune, dureri, insomnie.",
    ],
  },
  {
    code: "unrelenting_standards",
    name: "Standarde nerealiste / hipercriticism",
    domain: "overvigilance",
    essence: "Trebuie să atingi standarde foarte înalte ca să eviți critica — și nu ajungi niciodată.",
    beliefs: [
      "Dacă nu e perfect, nu contează.",
      "Nu am voie să greșesc.",
      "Odihna trebuie meritată.",
    ],
    origin:
      "Părinți cu aprecierea condiționată de rezultat; iubire care venea vizibil " +
      "mai des la note bune; un părinte el însuși perfecționist.",
    signs: [
      "Nu termini lucruri — le rescrii.",
      "Nu te poți bucura de o reușită mai mult de câteva ore.",
      "Muncești până noaptea și tot nu e destul.",
    ],
  },
  {
    code: "punitiveness",
    name: "Pedepsire",
    domain: "overvigilance",
    essence: "Greșelile trebuie pedepsite aspru — la tine și la ceilalți.",
    beliefs: [
      "Nu există scuze pentru greșeli.",
      "Cine greșește trebuie să plătească.",
      "Nu merit iertare până nu repar tot.",
    ],
    origin:
      "Părinți punitivi, care nu iertau; casă în care greșeala se plătea cu " +
      "tăcere, umilire sau pedeapsă disproporționată.",
    signs: [
      "Îți vorbești brutal după orice greșeală.",
      "Ții supărarea mult timp, pe tine și pe alții.",
      "Nu poți ierta chiar când vrei.",
    ],
  },
];

export const SCHEMA_BY_CODE = new Map(SCHEMAS.map((s) => [s.code, s]));

export function schemaOf(code: string | null | undefined): Schema | null {
  return code ? (SCHEMA_BY_CODE.get(code) ?? null) : null;
}

/** Culorile domeniilor de schemă, pentru filtre și legende. */
export const SCHEMA_DOMAIN_COLORS: Record<SchemaDomain, string> = {
  disconnection: "#ffb4a2",
  autonomy: "#a2d6f9",
  limits: "#f6d186",
  other_directed: "#d8a0c4",
  overvigilance: "#c8b6ff",
};

/** Lista compactă pentru promptul de extracție: cod, nume, esență. */
export function schemaIndexForPrompt(): string {
  return SCHEMAS.map((s) => `- ${s.code}: ${s.name} — ${s.essence}`).join("\n");
}
