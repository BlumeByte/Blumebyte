import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

export interface Language {
  code: string;
  name: string;
  nativeName: string;
  region: string;
}

export const LANGUAGES: Language[] = [
  // Default
  { code: 'en', name: 'English', nativeName: 'English', region: 'Global' },

  // European
  { code: 'fr', name: 'French', nativeName: 'Français', region: 'European' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', region: 'European' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', region: 'European' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', region: 'European' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano', region: 'European' },
  { code: 'nl', name: 'Dutch', nativeName: 'Nederlands', region: 'European' },
  { code: 'pl', name: 'Polish', nativeName: 'Polski', region: 'European' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский', region: 'European' },
  { code: 'uk', name: 'Ukrainian', nativeName: 'Українська', region: 'European' },
  { code: 'sv', name: 'Swedish', nativeName: 'Svenska', region: 'European' },
  { code: 'da', name: 'Danish', nativeName: 'Dansk', region: 'European' },
  { code: 'no', name: 'Norwegian', nativeName: 'Norsk', region: 'European' },
  { code: 'fi', name: 'Finnish', nativeName: 'Suomi', region: 'European' },
  { code: 'cs', name: 'Czech', nativeName: 'Čeština', region: 'European' },
  { code: 'sk', name: 'Slovak', nativeName: 'Slovenčina', region: 'European' },
  { code: 'ro', name: 'Romanian', nativeName: 'Română', region: 'European' },
  { code: 'hu', name: 'Hungarian', nativeName: 'Magyar', region: 'European' },
  { code: 'el', name: 'Greek', nativeName: 'Ελληνικά', region: 'European' },
  { code: 'bg', name: 'Bulgarian', nativeName: 'Български', region: 'European' },
  { code: 'hr', name: 'Croatian', nativeName: 'Hrvatski', region: 'European' },
  { code: 'sr', name: 'Serbian', nativeName: 'Српски', region: 'European' },

  // Middle East & South Asia
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', region: 'Middle East' },
  { code: 'he', name: 'Hebrew', nativeName: 'עברית', region: 'Middle East' },
  { code: 'fa', name: 'Persian', nativeName: 'فارسی', region: 'Middle East' },
  { code: 'ur', name: 'Urdu', nativeName: 'اردو', region: 'South Asia' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', region: 'South Asia' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', region: 'South Asia' },
  { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ', region: 'South Asia' },
  { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી', region: 'South Asia' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', region: 'South Asia' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', region: 'South Asia' },

  // East & Southeast Asia
  { code: 'zh-CN', name: 'Chinese (Simplified)', nativeName: '中文 (简体)', region: 'East Asia' },
  { code: 'zh-TW', name: 'Chinese (Traditional)', nativeName: '中文 (繁體)', region: 'East Asia' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', region: 'East Asia' },
  { code: 'ko', name: 'Korean', nativeName: '한국어', region: 'East Asia' },
  { code: 'th', name: 'Thai', nativeName: 'ภาษาไทย', region: 'Southeast Asia' },
  { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt', region: 'Southeast Asia' },
  { code: 'id', name: 'Indonesian', nativeName: 'Bahasa Indonesia', region: 'Southeast Asia' },
  { code: 'ms', name: 'Malay', nativeName: 'Bahasa Melayu', region: 'Southeast Asia' },
  { code: 'tl', name: 'Filipino', nativeName: 'Filipino', region: 'Southeast Asia' },
  { code: 'tr', name: 'Turkish', nativeName: 'Türkçe', region: 'Central Asia' },

  // African Languages
  { code: 'af', name: 'Afrikaans', nativeName: 'Afrikaans', region: 'African' },
  { code: 'am', name: 'Amharic', nativeName: 'አማርኛ', region: 'African' },
  { code: 'ha', name: 'Hausa', nativeName: 'Hausa', region: 'African' },
  { code: 'ig', name: 'Igbo', nativeName: 'Igbo', region: 'African' },
  { code: 'lg', name: 'Luganda', nativeName: 'Luganda', region: 'African' },
  { code: 'mg', name: 'Malagasy', nativeName: 'Malagasy', region: 'African' },
  { code: 'ny', name: 'Chichewa', nativeName: 'Chichewa', region: 'African' },
  { code: 'rw', name: 'Kinyarwanda', nativeName: 'Kinyarwanda', region: 'African' },
  { code: 'sn', name: 'Shona', nativeName: 'chiShona', region: 'African' },
  { code: 'so', name: 'Somali', nativeName: 'Soomaali', region: 'African' },
  { code: 'st', name: 'Sesotho', nativeName: 'Sesotho', region: 'African' },
  { code: 'sw', name: 'Swahili', nativeName: 'Kiswahili', region: 'African' },
  { code: 'tn', name: 'Setswana', nativeName: 'Setswana', region: 'African' },
  { code: 'xh', name: 'Xhosa', nativeName: 'isiXhosa', region: 'African' },
  { code: 'yo', name: 'Yoruba', nativeName: 'Yorùbá', region: 'African' },
  { code: 'zu', name: 'Zulu', nativeName: 'isiZulu', region: 'African' },
];

const STORAGE_KEY = 'blumebyte_language';

/** Tags whose text content must not be translated. */
const SKIP_TAGS = new Set([
  'SCRIPT', 'STYLE', 'NOSCRIPT', 'TEXTAREA', 'IFRAME', 'OBJECT', 'CODE', 'PRE',
]);

/** Separator used when batching multiple strings into a single API call. */
const BATCH_SEP = '\n⚡\n';

/** Maximum characters per API request (conservative to stay within URL limits). */
const MAX_BATCH_CHARS = 1500;

/** Debounce delay (ms) before re-translating after DOM mutations from React renders. */
const OBSERVE_DEBOUNCE_MS = 400;

// ---------- module-level translation state ----------

/** Per-language translation cache: lang -> (original -> translated). */
const translationCache = new Map<string, Map<string, string>>();

/** Remembers the original English text of every node we have translated. */
const originalNodes = new Map<Text, string>();

let currentLang = 'en';
let mutationObserver: MutationObserver | null = null;
let debounceTimer: ReturnType<typeof setTimeout> | null = null;

// ---------- helpers ----------

/** Walk the DOM and collect all translatable text nodes. */
function getTextNodes(root: Node): Text[] {
  const nodes: Text[] = [];
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const parent = node.parentElement;
      if (!parent) return NodeFilter.FILTER_REJECT;
      if (SKIP_TAGS.has(parent.tagName)) return NodeFilter.FILTER_REJECT;
      if (parent.closest('[translate="no"], .notranslate')) return NodeFilter.FILTER_REJECT;
      const text = node.textContent?.trim();
      if (!text) return NodeFilter.FILTER_SKIP;
      return NodeFilter.FILTER_ACCEPT;
    },
  });
  let n: Node | null;
  while ((n = walker.nextNode())) nodes.push(n as Text);
  return nodes;
}

/** Translate an array of strings to the target language using the free GTX endpoint. */
async function translateTexts(texts: string[], targetLang: string): Promise<string[]> {
  if (!texts.length) return [];

  const langCache = translationCache.get(targetLang) ?? new Map<string, string>();
  translationCache.set(targetLang, langCache);

  const results: string[] = Array(texts.length).fill('');
  const todo: Array<{ idx: number; text: string }> = [];

  texts.forEach((t, i) => {
    const cached = langCache.get(t);
    if (cached !== undefined) {
      results[i] = cached;
    } else {
      todo.push({ idx: i, text: t });
    }
  });

  if (!todo.length) return results;

  // Partition into size-limited batches
  const batches: typeof todo[] = [];
  let cur: typeof todo = [];
  let size = 0;
  for (const item of todo) {
    if (size + item.text.length > MAX_BATCH_CHARS && cur.length > 0) {
      batches.push(cur);
      cur = [];
      size = 0;
    }
    cur.push(item);
    size += item.text.length;
  }
  if (cur.length) batches.push(cur);

  await Promise.all(
    batches.map(async batch => {
      const combined = batch.map(b => b.text).join(BATCH_SEP);
      try {
        const url =
          `https://translate.googleapis.com/translate_a/single` +
          `?client=gtx&sl=en&tl=${encodeURIComponent(targetLang)}&dt=t` +
          `&q=${encodeURIComponent(combined)}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json() as [[string, string][], ...unknown[]];
        const full = (data[0] as [string][]).map(p => p[0]).join('');
        const parts = full.split(BATCH_SEP);
        batch.forEach((item, i) => {
          const translated = (parts[i] ?? '').trim() || item.text;
          results[item.idx] = translated;
          langCache.set(item.text, translated);
        });
      } catch {
        // On error fall back to original text
        batch.forEach(item => {
          results[item.idx] = item.text;
        });
      }
    }),
  );

  return results;
}

/** Apply translation of `langCode` to all current text nodes in the document. */
async function applyTranslation(langCode: string) {
  if (langCode === 'en') {
    restoreOriginal();
    return;
  }

  // Disconnect observer while we mutate the DOM to avoid feedback loops
  stopObserver();

  const nodes = getTextNodes(document.body);
  const texts = nodes.map(n => n.textContent ?? '');

  // Record originals so we can restore English later
  nodes.forEach((node, i) => {
    if (!originalNodes.has(node)) originalNodes.set(node, texts[i]);
  });

  const translated = await translateTexts(texts, langCode);

  // Language may have changed while we awaited – abort if so
  if (currentLang !== langCode) {
    startObserver();
    return;
  }

  nodes.forEach((node, i) => {
    const t = translated[i];
    if (t && t !== node.textContent) node.textContent = t;
  });

  // Short delay before reconnecting so any microtask mutations from our own
  // writes have been processed by the observer's internal queue.
  setTimeout(startObserver, 100);
}

/** Restore all nodes to their original English text. */
function restoreOriginal() {
  originalNodes.forEach((original, node) => {
    if (node.isConnected) node.textContent = original;
  });
  originalNodes.clear();
}

/** Start a MutationObserver that schedules re-translation on DOM changes. */
function startObserver() {
  if (mutationObserver) return;
  mutationObserver = new MutationObserver(() => {
    if (currentLang === 'en') return;
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => applyTranslation(currentLang), OBSERVE_DEBOUNCE_MS);
  });
  mutationObserver.observe(document.body, { childList: true, subtree: true });
}

/** Stop the MutationObserver. */
function stopObserver() {
  if (debounceTimer) {
    clearTimeout(debounceTimer);
    debounceTimer = null;
  }
  if (mutationObserver) {
    mutationObserver.disconnect();
    mutationObserver = null;
  }
}

// ---------- React context ----------

interface LanguageContextType {
  selectedLanguage: Language;
  setLanguage: (code: string) => void;
  languages: Language[];
  /** Call this after new content is added to trigger immediate re-translation. */
  retranslate: () => void;
}

const LanguageContext = createContext<LanguageContextType>({
  selectedLanguage: LANGUAGES[0],
  setLanguage: () => {},
  languages: LANGUAGES,
  retranslate: () => {},
});

export function useLanguage() {
  return useContext(LanguageContext);
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [selectedLang, setSelectedLang] = useState<Language>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return LANGUAGES.find(l => l.code === saved) ?? LANGUAGES[0];
  });

  // Apply / remove translation whenever the selected language changes
  useEffect(() => {
    currentLang = selectedLang.code;

    if (selectedLang.code === 'en') {
      stopObserver();
      restoreOriginal();
    } else {
      // Translate after the current render cycle so React's DOM is fully committed
      const timer = setTimeout(() => {
        applyTranslation(selectedLang.code).then(() => {
          startObserver();
        });
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [selectedLang.code]);

  // Clean up observer on unmount
  useEffect(() => () => stopObserver(), []);

  const retranslate = useCallback(() => {
    if (currentLang !== 'en') {
      applyTranslation(currentLang);
    }
  }, []);

  const setLanguage = useCallback((code: string) => {
    const lang = LANGUAGES.find(l => l.code === code) ?? LANGUAGES[0];
    setSelectedLang(lang);
    localStorage.setItem(STORAGE_KEY, code);
  }, []);

  return (
    <LanguageContext.Provider value={{ selectedLanguage: selectedLang, setLanguage, languages: LANGUAGES, retranslate }}>
      {children}
    </LanguageContext.Provider>
  );
}

