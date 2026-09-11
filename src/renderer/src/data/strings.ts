export type Locale = "en" | "es";

export interface StringsShape {
  refPlaceholder: string;
  compare: string;
  panel: string;
  theme: string;
  apiKey: string;
  aiApiKey: string;
  translation: string;
  findBook: string;
  prev: string;
  next: string;
  assistant: string;
  concordance: string;
  search: string;
  aiIntro: string;
  aiPlaceholder: string;
  ask: string;
  thinking: string;
  concPlaceholder: string;
  look: string;
  more: string;
  searchPlaceholder: string;
  go: string;
  aiKeyHelp: string;
  cancel: string;
  save: string;
  noKey: string;
  keySet: string;
  loading: string;
  concIdle: string;
  searchIdle: string;
  occ: string;
  versesN: string;
  old: string;
  nw: string;
  sample: string;
  s1: string;
  s2: string;
  s3: string;
  oldTestament: string;
  newTestament: string;
  pickTranslation: string;
  concUnsupported: string;
  listen: string;
  stop: string;
  listenVerse: string;
}

export const STR: Record<Locale, StringsShape> = {
  en: {
    refPlaceholder: "Go to reference — John 3:16",
    compare: "Compare",
    panel: "Study",
    theme: "Theme",
    apiKey: "BibleQL API key",
    aiApiKey: "Anthropic API key",
    translation: "Translation",
    findBook: "Filter books",
    prev: "Previous chapter",
    next: "Next chapter",
    assistant: "Assistant",
    concordance: "Concordance",
    search: "Search",
    aiIntro: "Ask a question about Scripture and get an answer with references you can open.",
    aiPlaceholder: "What does the Bible say about forgiving someone repeatedly?",
    ask: "Ask",
    thinking: "Thinking…",
    concPlaceholder: "Word to study",
    look: "Look up",
    more: "Load more",
    searchPlaceholder: "Words or phrase",
    go: "Search",
    aiKeyHelp: "Used only for the Assistant tab. Sent straight to Anthropic from this machine, never stored elsewhere.",
    cancel: "Cancel",
    save: "Save",
    noKey: "No API key — showing a bundled sample chapter.",
    keySet: "Key saved",
    loading: "Loading…",
    concIdle: "Every occurrence of a word, in canonical order, with context.",
    searchIdle: "Substring search across the current translation.",
    occ: "occurrences",
    versesN: "verses",
    old: "OT",
    nw: "NT",
    sample: "Sample text — World English Bible, public domain",
    s1: "Where does the Bible talk about rest?",
    s2: "Verses on hospitality to strangers",
    s3: "What is the difference between grace and mercy?",
    oldTestament: "Old Testament",
    newTestament: "New Testament",
    pickTranslation: "Type to filter translations",
    concUnsupported: "BibleQL has no concordance index for %s. Indexed: %l.",
    listen: "Listen to chapter",
    stop: "Stop",
    listenVerse: "Listen to verse"
  },
  es: {
    refPlaceholder: "Ir a la referencia — Juan 3:16",
    compare: "Comparar",
    panel: "Estudio",
    theme: "Tema",
    apiKey: "Clave de API de BibleQL",
    aiApiKey: "Clave de API de Anthropic",
    translation: "Traducción",
    findBook: "Filtrar libros",
    prev: "Capítulo anterior",
    next: "Capítulo siguiente",
    assistant: "Asistente",
    concordance: "Concordancia",
    search: "Buscar",
    aiIntro: "Haz una pregunta sobre las Escrituras y recibe una respuesta con referencias que puedes abrir.",
    aiPlaceholder: "¿Qué dice la Biblia sobre perdonar muchas veces?",
    ask: "Preguntar",
    thinking: "Pensando…",
    concPlaceholder: "Palabra a estudiar",
    look: "Buscar",
    more: "Cargar más",
    searchPlaceholder: "Palabras o frase",
    go: "Buscar",
    aiKeyHelp: "Se usa solo en la pestaña Asistente. Se envía directo a Anthropic desde este equipo, nunca se guarda en otro lugar.",
    cancel: "Cancelar",
    save: "Guardar",
    noKey: "Sin clave de API — mostrando un capítulo de muestra.",
    keySet: "Clave guardada",
    loading: "Cargando…",
    concIdle: "Cada aparición de una palabra, en orden canónico, con su contexto.",
    searchIdle: "Búsqueda de texto en la traducción actual.",
    occ: "apariciones",
    versesN: "versículos",
    old: "AT",
    nw: "NT",
    sample: "Texto de muestra — Reina Valera 1909, dominio público",
    s1: "¿Dónde habla la Biblia del descanso?",
    s2: "Versículos sobre hospitalidad al extranjero",
    s3: "¿Cuál es la diferencia entre gracia y misericordia?",
    oldTestament: "Antiguo Testamento",
    newTestament: "Nuevo Testamento",
    pickTranslation: "Escribe para filtrar traducciones",
    concUnsupported: "BibleQL no tiene índice de concordancia para %s. Con índice: %l.",
    listen: "Escuchar capítulo",
    stop: "Detener",
    listenVerse: "Escuchar versículo"
  }
};
