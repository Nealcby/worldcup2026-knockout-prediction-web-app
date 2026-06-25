"use client";

import { Locale, LOCALE_LABELS } from "@/lib/i18n";
import { useLocale } from "@/lib/localeContext";

export default function LanguageSwitcher() {
  const { locale, setLocale } = useLocale();
  return (
    <select
      value={locale}
      onChange={e => setLocale(e.target.value as Locale)}
      className="text-[11px] bg-white/[0.05] border border-white/[0.10] text-white/60 rounded-lg px-2.5 py-1.5 outline-none hover:border-white/20 hover:bg-white/[0.08] focus:border-blue-400/40 transition-all duration-150 cursor-pointer"
    >
      {(Object.entries(LOCALE_LABELS) as [Locale, string][]).map(([code, label]) => (
        <option key={code} value={code} className="bg-slate-900 text-white">
          {label}
        </option>
      ))}
    </select>
  );
}
