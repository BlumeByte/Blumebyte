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

// Programmatically trigger Google Translate to change language
function applyGoogleTranslate(langCode: string) {
  try {
    if (langCode === 'en') {
      // Reset to original English
      const iframe = document.querySelector<HTMLIFrameElement>('iframe.goog-te-menu-frame');
      if (iframe) {
        // Find the "Show original" option
        const innerDoc = iframe.contentDocument || iframe.contentWindow?.document;
        const showOriginal = innerDoc?.querySelector<HTMLAnchorElement>('.goog-te-menu2-item-selected');
        if (showOriginal) {
          showOriginal.click();
          return;
        }
      }
      // Fallback: clear cookie and reload
      document.cookie = 'googtrans=/en/en; path=/';
      document.cookie = `googtrans=/en/en; path=/; domain=${window.location.hostname}`;
      document.cookie = `googtrans=/en/en; domain=.${window.location.hostname}; path=/`;
    }

    // Set cookie to trigger Google Translate
    const value = `/en/${langCode}`;
    document.cookie = `googtrans=${value}; path=/`;
    document.cookie = `googtrans=${value}; path=/; domain=${window.location.hostname}`;
    document.cookie = `googtrans=${value}; domain=.${window.location.hostname}; path=/`;

    // Try to use Google Translate select element (no page reload)
    const select = document.querySelector<HTMLSelectElement>('.goog-te-combo');
    if (select) {
      select.value = langCode;
      select.dispatchEvent(new Event('change'));
      return;
    }

    // Fallback: reload so Google Translate picks up the cookie
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

  // Apply saved language after Google Translate widget initialises
  useEffect(() => {
    if (selectedLang.code !== 'en') {
      // Give the widget time to load
      const timer = setTimeout(() => {
        applyGoogleTranslate(selectedLang.code);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const setLanguage = useCallback((code: string) => {
    const lang = LANGUAGES.find(l => l.code === code) ?? LANGUAGES[0];
    setSelectedLang(lang);
    localStorage.setItem(STORAGE_KEY, code);
    applyGoogleTranslate(code);
  }, []);

  return (
    <LanguageContext.Provider value={{ selectedLanguage: selectedLang, setLanguage, languages: LANGUAGES }}>
      {children}
    </LanguageContext.Provider>
  );
}
