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

/** Shorter delay used when re-applying translation after SPA navigation (widget already loaded). */
const ROUTE_RETRANSLATE_DELAY_MS = 600;

interface LanguageContextType {
  selectedLanguage: Language;
  setLanguage: (code: string) => void;
  languages: Language[];
  /** Call this after a route change to re-apply the current translation to new DOM nodes. */
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

/** Set the googtrans cookie on all relevant scopes for the current hostname. */
function setGoogTransCookie(value: string) {
  document.cookie = `googtrans=${value}; path=/`;
  document.cookie = `googtrans=${value}; path=/; domain=${window.location.hostname}`;
  document.cookie = `googtrans=${value}; domain=.${window.location.hostname}; path=/`;
}

/** Clear the googtrans cookie from all relevant scopes. */
function clearGoogTransCookie() {
  const expired = 'expires=Thu, 01 Jan 1970 00:00:00 UTC';
  document.cookie = `googtrans=; ${expired}; path=/`;
  document.cookie = `googtrans=; ${expired}; path=/; domain=${window.location.hostname}`;
  document.cookie = `googtrans=; ${expired}; domain=.${window.location.hostname}; path=/`;
}

/**
 * Attempt to call Google Translate's in-page API without reloading.
 * Used as a best-effort re-translation after SPA navigation — not relied on
 * for the initial language switch (which always goes through a full reload).
 */
function tryApplyGoogleTranslateInPage(langCode: string) {
  try {
    const w = window as Window & { doGTranslate?: (lang: string) => void };
    if (typeof w.doGTranslate === 'function') {
      w.doGTranslate(`en|${langCode}`);
      return;
    }
    const select = document.querySelector<HTMLSelectElement>('.goog-te-combo');
    if (select) {
      select.value = langCode;
      select.dispatchEvent(new Event('change', { bubbles: true }));
      select.dispatchEvent(new Event('input', { bubbles: true }));
    }
  } catch {
    // Silently fail - translation is an enhancement, not a requirement
  }
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [selectedLang, setSelectedLang] = useState<Language>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return LANGUAGES.find(l => l.code === saved) ?? LANGUAGES[0];
  });

  // Apply translation after React renders.
  // Strategy: always use cookie + full-page reload so that Google Translate can
  // initialise properly and apply its MutationObserver for dynamic SPA content.
  // A sessionStorage guard (RELOAD_GUARD_KEY) prevents infinite reload loops.
  useEffect(() => {
    if (selectedLang.code === 'en') {
      // Switching back to English: clear cookie and reload once.
      clearGoogTransCookie();
      const guard = sessionStorage.getItem(RELOAD_GUARD_KEY);
      if (guard !== 'en') {
        sessionStorage.setItem(RELOAD_GUARD_KEY, 'en');
        window.location.reload();
      } else {
        // Already reloaded for English – clear guard and stay.
        setTimeout(() => sessionStorage.removeItem(RELOAD_GUARD_KEY), GUARD_CLEAR_DELAY_MS);
      }
      return;
    }

    const langCode = selectedLang.code;
    const guard = sessionStorage.getItem(RELOAD_GUARD_KEY);

    if (guard === langCode) {
      // We are in the post-reload render for this language.
      // Google Translate is reading the cookie and will translate the page.
      // Clear the guard after a delay to allow future language switches.
      const timer = setTimeout(() => sessionStorage.removeItem(RELOAD_GUARD_KEY), GUARD_CLEAR_DELAY_MS);
      return () => clearTimeout(timer);
    }

    // First render for this language: set cookie and reload.
    setGoogTransCookie(`/en/${langCode}`);
    sessionStorage.setItem(RELOAD_GUARD_KEY, langCode);
    window.location.reload();
  }, [selectedLang.code]); // re-run whenever the selected language changes

  // Re-apply translation whenever the URL path changes (SPA navigation).
  // After a language reload, Google Translate's MutationObserver handles most
  // dynamic content automatically. This is a best-effort supplement for any
  // content that GT's observer might miss.
  useEffect(() => {
    if (selectedLang.code === 'en') return;

    const retranslateAfterDelay = () => {
      setTimeout(() => tryApplyGoogleTranslateInPage(selectedLang.code), ROUTE_RETRANSLATE_DELAY_MS);
    };

    // Listen to popstate (back/forward navigation)
    window.addEventListener('popstate', retranslateAfterDelay);

    // Patch history.pushState and replaceState to detect SPA route changes
    const origPush = history.pushState.bind(history);
    const origReplace = history.replaceState.bind(history);
    let pendingTimer: ReturnType<typeof setTimeout> | null = null;

    history.pushState = (...args) => {
      origPush(...args);
      if (pendingTimer) clearTimeout(pendingTimer);
      pendingTimer = setTimeout(() => tryApplyGoogleTranslateInPage(selectedLang.code), ROUTE_RETRANSLATE_DELAY_MS);
    };
    history.replaceState = (...args) => {
      origReplace(...args);
      if (pendingTimer) clearTimeout(pendingTimer);
      pendingTimer = setTimeout(() => tryApplyGoogleTranslateInPage(selectedLang.code), ROUTE_RETRANSLATE_DELAY_MS);
    };

    return () => {
      window.removeEventListener('popstate', retranslateAfterDelay);
      history.pushState = origPush;
      history.replaceState = origReplace;
      if (pendingTimer) clearTimeout(pendingTimer);
    };
  }, [selectedLang.code]);

  const retranslate = useCallback(() => {
    if (selectedLang.code !== 'en') {
      setTimeout(() => tryApplyGoogleTranslateInPage(selectedLang.code), ROUTE_RETRANSLATE_DELAY_MS);
    }
  }, [selectedLang.code]);

  const setLanguage = useCallback((code: string) => {
    const lang = LANGUAGES.find(l => l.code === code) ?? LANGUAGES[0];
    setSelectedLang(lang);
    localStorage.setItem(STORAGE_KEY, code);
    // Clear any existing reload guard so the useEffect below can decide whether
    // a new reload is needed for the newly selected language.
    sessionStorage.removeItem(RELOAD_GUARD_KEY);
    // Translation is applied by the useEffect above via cookie + page reload.
  }, []);

  return (
    <LanguageContext.Provider value={{ selectedLanguage: selectedLang, setLanguage, languages: LANGUAGES, retranslate }}>
      {children}
    </LanguageContext.Provider>
  );
}
