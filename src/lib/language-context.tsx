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

/** Max concurrent translation requests sent to the GTX API at one time. */
const TRANSLATION_CONCURRENCY = 20;

/** Debounce delay (ms) before re-translating after DOM mutations from React renders. */
const OBSERVE_DEBOUNCE_MS = 400;

/**
 * Delay before restarting the MutationObserver after we finish applying translations.
 * One macrotask is enough to flush any synchronously-queued mutation records created
 * by our own text-node writes before the observer reconnects.
 */
const OBSERVER_RESTART_DELAY_MS = 0;

// ---------- module-level translation state ----------

/** Per-language translation cache: lang -> (original English text -> translated text). */
const translationCache = new Map<string, Map<string, string>>();

/**
 * Stores the original English text for every text node we have translated.
 * Used to restore the page to English and to correctly source text for
 * re-translation (rather than accidentally re-translating already-translated content).
 */
const originalNodes = new Map<Text, string>();

/**
 * Stores the last translated value written to each node.
 * When a node's current textContent differs from this value, React has
 * updated it with new English text and we must refresh the stored original.
 */
const translatedNodes = new Map<Text, string>();

let currentLang = 'en';
let mutationObserver: MutationObserver | null = null;
let debounceTimer: ReturnType<typeof setTimeout> | null = null;
/** Set to false when LanguageProvider unmounts to prevent post-unmount side-effects. */
let isProviderMounted = false;

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

/**
 * For a given text node, return the English source string to translate.
 *
 * Logic:
 * - New node (not yet seen) → current content is English; store it.
 * - Previously translated AND current content matches the stored translation
 *   → node still shows our translation; use the stored English original.
 * - Previously translated BUT current content differs from the stored translation
 *   → React updated the node with new English text; refresh stored original.
 * - Previously seen but not yet translated → use stored original.
 */
function getSourceText(node: Text): string {
  const currentText = node.textContent ?? '';
  const storedOriginal = originalNodes.get(node);
  const storedTranslation = translatedNodes.get(node);

  if (storedOriginal === undefined) {
    // First time seeing this node — current content is English.
    originalNodes.set(node, currentText);
    return currentText;
  }

  if (storedTranslation !== undefined && currentText !== storedTranslation) {
    // Node was previously translated, but now its content differs from what we
    // wrote — React updated it with new English text.
    originalNodes.set(node, currentText);
    translatedNodes.delete(node);
    return currentText;
  }

  // Either the node is still showing our translation, or it was never translated.
  // Either way, the stored original is the correct English source.
  return storedOriginal;
}

/**
 * Translate an array of English strings to `targetLang` using the free GTX endpoint.
 * Each string is translated with an individual request (no batch-separator heuristics)
 * to ensure reliable results. Requests for the same language are deduplicated and
 * cached across calls.
 */
async function translateTexts(texts: string[], targetLang: string): Promise<string[]> {
  if (!texts.length) return [];

  const langCache = translationCache.get(targetLang) ?? new Map<string, string>();
  translationCache.set(targetLang, langCache);

  // Deduplicate — only fetch each unique, non-empty string once per language.
  const unique = [...new Set(texts.filter(t => t.trim()))];
  const uncached = unique.filter(t => !langCache.has(t));

  // Translate uncached strings in parallel batches.
  for (let i = 0; i < uncached.length; i += TRANSLATION_CONCURRENCY) {
    const batch = uncached.slice(i, i + TRANSLATION_CONCURRENCY);
    await Promise.allSettled(
      batch.map(async text => {
        try {
          const url =
            `https://translate.googleapis.com/translate_a/single` +
            `?client=gtx&sl=en&tl=${encodeURIComponent(targetLang)}&dt=t` +
            `&q=${encodeURIComponent(text)}`;
          const res = await fetch(url);
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const data = await res.json() as [Array<[string, ...unknown[]]>, ...unknown[]];
          const translated = data[0].map(p => p[0]).join('');
          if (translated) langCache.set(text, translated);
        } catch (err) {
          // Log so developers can diagnose failures; leave text untranslated so it
          // will be retried on the next translation pass.
          console.warn(`[translation] Failed to translate "${text.slice(0, 40)}…" → ${targetLang}:`, err);
        }
      }),
    );
  }

  return texts.map(t => (t.trim() ? (langCache.get(t) ?? t) : t));
}

/** Apply translation of `langCode` to all current text nodes in the document. */
async function applyTranslation(langCode: string) {
  if (langCode === 'en') {
    restoreOriginal();
    return;
  }

  // Disconnect observer while we mutate the DOM to avoid feedback loops.
  stopObserver();

  const nodes = getTextNodes(document.body);
  // Determine the correct English source text for each node (handles React updates).
  const texts = nodes.map(node => getSourceText(node));

  const translated = await translateTexts(texts, langCode);

  // Language may have changed while we were awaiting — abort if so.
  if (currentLang !== langCode) {
    if (isProviderMounted) startObserver();
    return;
  }

  nodes.forEach((node, i) => {
    const t = translated[i];
    if (t && t !== node.textContent) {
      node.textContent = t;
      translatedNodes.set(node, t);
    }
  });

  if (!isProviderMounted) return;

  // Reconnect observer after one macrotask so any synchronously queued microtask
  // mutation records from our own writes are flushed before the observer starts.
  setTimeout(startObserver, OBSERVER_RESTART_DELAY_MS);

  // Schedule one follow-up pass after the debounce window to catch content that
  // loaded asynchronously (e.g. data fetches) during the initial translation,
  // but only if there are actually untranslated nodes in the DOM.
  setTimeout(() => {
    if (currentLang !== langCode || !isProviderMounted) return;
    const hasUntranslated = getTextNodes(document.body).some(
      n => !translatedNodes.has(n),
    );
    if (hasUntranslated) applyTranslation(langCode);
  }, OBSERVE_DEBOUNCE_MS);
}

/** Restore all nodes to their original English text and clear translation state. */
function restoreOriginal() {
  originalNodes.forEach((original, node) => {
    if (node.isConnected) {
      node.textContent = original;
    }
    // Always remove from both maps — disconnected nodes are stale and should not
    // accumulate, which would cause unbounded memory growth in long-running SPAs.
    originalNodes.delete(node);
    translatedNodes.delete(node);
  });
}

/** Start a MutationObserver that schedules re-translation on DOM changes. */
function startObserver() {
  if (mutationObserver) return;
  mutationObserver = new MutationObserver(() => {
    if (currentLang === 'en') return;
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => applyTranslation(currentLang), OBSERVE_DEBOUNCE_MS);
  });
  mutationObserver.observe(document.body, {
    childList: true,
    subtree: true,
    // Also observe text-node value changes so React's in-place text updates
    // (e.g. dynamic counters, updated labels) are caught and re-translated.
    characterData: true,
  });
}

/** Stop the MutationObserver and cancel any pending debounce. */
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

  // Apply / remove translation whenever the selected language changes.
  useEffect(() => {
    currentLang = selectedLang.code;

    if (selectedLang.code === 'en') {
      stopObserver();
      restoreOriginal();
    } else {
      // Translate after the current render cycle so React's DOM is fully committed.
      const timer = setTimeout(() => {
        applyTranslation(selectedLang.code);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [selectedLang.code]);

  // Set the mounted flag and clean up observer on unmount.
  useEffect(() => {
    isProviderMounted = true;
    return () => {
      isProviderMounted = false;
      stopObserver();
    };
  }, []);

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


