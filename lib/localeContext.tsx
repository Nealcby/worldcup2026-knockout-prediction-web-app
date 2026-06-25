"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { Locale, t, Translations } from "./i18n";

type LocaleCtx = {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: keyof Translations) => string;
};

const LocaleContext = createContext<LocaleCtx>({
  locale: "en",
  setLocale: () => {},
  t: (k) => k as string,
});

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");

  useEffect(() => {
    const saved = localStorage.getItem("wc2026_locale") as Locale | null;
    if (saved) setLocaleState(saved);
  }, []);

  function setLocale(l: Locale) {
    setLocaleState(l);
    localStorage.setItem("wc2026_locale", l);
  }

  return (
    <LocaleContext.Provider value={{ locale, setLocale, t: (k) => t(locale, k) }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  return useContext(LocaleContext);
}
