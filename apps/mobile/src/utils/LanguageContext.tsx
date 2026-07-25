import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LANGUAGE_KEY = '@app_language';

export type AppLanguage = 'en' | 'hi';

interface LanguageContextValue {
  lang: AppLanguage;
  setLang: (lang: AppLanguage) => void;
}

// Hindi is the field-crew default (matches the boring-workflow screens
// before the language setting became global).
const LanguageContext = createContext<LanguageContextValue>({
  lang: 'hi',
  setLang: () => {},
});

/**
 * Single app-wide language setting, persisted in AsyncStorage. Every
 * screen must read the language from here — per-screen useState defaults
 * caused the language to flip between English and Hindi on navigation.
 */
export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<AppLanguage>('hi');

  useEffect(() => {
    AsyncStorage.getItem(LANGUAGE_KEY)
      .then((stored) => {
        if (stored === 'en' || stored === 'hi') {
          setLangState(stored);
        }
      })
      .catch(() => {});
  }, []);

  const setLang = useCallback((next: AppLanguage) => {
    setLangState(next);
    AsyncStorage.setItem(LANGUAGE_KEY, next).catch(() => {});
  }, []);

  return (
    <LanguageContext.Provider value={{ lang, setLang }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextValue {
  return useContext(LanguageContext);
}
