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
/** sessionStorage key set to the language code after a reload has been triggered.
 *  Prevents the infinite-reload loop that happens when Google Translate's widget
 *  is not yet available on the first render after a reload. */
const RELOAD_GUARD_KEY = 'blumebyte_lang_reloaded';
/** Time (ms) to wait before clearing the reload guard.
 *  Must be long enough for Google Translate to finish applying the translation
 *  from the cookie so that the guard doesn't block future language changes. */
const GUARD_CLEAR_DELAY_MS = 3000;

/** Time to wait (ms) before attempting to apply a saved language on first load.
 *  Google Translate's widget needs a moment to inject its select element into the DOM
 *  before we can programmatically trigger a translation. */
const GOOGLE_TRANSLATE_INIT_DELAY_MS = 1500;

interface LanguageContextType {
  selectedLanguage: Language;
  setLanguage: (code: string) => void;
  languages: Language[];
}

const LanguageContext = createContext<LanguageContextType>({
  selectedLanguage: LANGUAGES[0],
  setLanguage: () => {},
  languages: LANGUAGES,
});

export function useLanguage() {
  return useContext(LanguageContext);
}

// Programmatically trigger Google Translate to change language.
// Priority order:
//   1. window.doGTranslate  – Google Translate's own internal API (most reliable)
//   2. .goog-te-combo select – DOM manipulation fallback
//   3. cookie + page reload  – last resort; guarded to prevent infinite loops
function applyGoogleTranslate(langCode: string) {
  try {
    if (langCode === 'en') {
      // Reset to original English – clear all googtrans cookies and reload once.
      document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/';
      document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${window.location.hostname}`;
      document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; domain=.${window.location.hostname}; path=/`;
      sessionStorage.removeItem(RELOAD_GUARD_KEY);
      window.location.reload();
      return;
    }

    // Set cookie so Google Translate picks up the language on any future reload.
    const value = `/en/${langCode}`;
    document.cookie = `googtrans=${value}; path=/`;
    document.cookie = `googtrans=${value}; path=/; domain=${window.location.hostname}`;
    document.cookie = `googtrans=${value}; domain=.${window.location.hostname}; path=/`;

    // 1. Use Google Translate's own internal API if available (most reliable).
    const w = window as any;
    if (typeof w.doGTranslate === 'function') {
      w.doGTranslate(`en|${langCode}`);
      sessionStorage.removeItem(RELOAD_GUARD_KEY);
      return;
    }

    // 2. Fall back to manipulating the hidden select element.
    const select = document.querySelector<HTMLSelectElement>('.goog-te-combo');
    if (select) {
      select.value = langCode;
      select.dispatchEvent(new Event('change', { bubbles: true }));
      sessionStorage.removeItem(RELOAD_GUARD_KEY);
      return;
    }

    // 3. Last resort: reload so Google Translate picks up the cookie on next init.
    // Guard against an infinite reload loop: if we already reloaded once for this
    // language and the widget still isn't present, don't reload again – the next
    // useEffect retry (after GOOGLE_TRANSLATE_INIT_DELAY_MS) will try methods 1/2.
    const guardValue = sessionStorage.getItem(RELOAD_GUARD_KEY);
    if (guardValue === langCode) {
      return;
    }
    sessionStorage.setItem(RELOAD_GUARD_KEY, langCode);
    window.location.reload();
  } catch {
    // Silently fail - translation is an enhancement, not a requirement
  }
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [selectedLang, setSelectedLang] = useState<Language>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return LANGUAGES.find(l => l.code === saved) ?? LANGUAGES[0];
  });

  // Apply saved language after Google Translate widget initialises.
  // We always attempt to apply the translation; applyGoogleTranslate itself
  // prevents reload loops via RELOAD_GUARD_KEY.
  useEffect(() => {
    if (selectedLang.code !== 'en') {
      // Give the widget time to load, then apply.
      const timer = setTimeout(() => {
        applyGoogleTranslate(selectedLang.code);
        // Clear the reload guard after the widget has had time to settle,
        // so that future language changes can trigger a reload if needed.
        setTimeout(() => {
          sessionStorage.removeItem(RELOAD_GUARD_KEY);
        }, GUARD_CLEAR_DELAY_MS);
      }, GOOGLE_TRANSLATE_INIT_DELAY_MS);
      return () => clearTimeout(timer);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const setLanguage = useCallback((code: string) => {
    const lang = LANGUAGES.find(l => l.code === code) ?? LANGUAGES[0];
    setSelectedLang(lang);
    localStorage.setItem(STORAGE_KEY, code);
    // Clear any previous reload guard so the new language can trigger a reload if needed.
    sessionStorage.removeItem(RELOAD_GUARD_KEY);
    applyGoogleTranslate(code);
  }, []);

  return (
    <LanguageContext.Provider value={{ selectedLanguage: selectedLang, setLanguage, languages: LANGUAGES }}>
      {children}
    </LanguageContext.Provider>
  );
}
