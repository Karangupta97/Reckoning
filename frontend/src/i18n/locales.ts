/**
 * Shared locale metadata for the BIMSTEC + English landing experience.
 * Used by the routing config, the language switcher and SEO helpers.
 */

export const locales = ["en", "hi", "bn", "ne", "si", "th", "my", "dz"] as const;

export type AppLocale = (typeof locales)[number];

export const defaultLocale: AppLocale = "en";

export type LocaleMeta = {
  /** BCP-47 / next-intl locale code */
  code: AppLocale;
  /** Native language name, shown in its own script */
  nativeName: string;
  /** English language name */
  englishName: string;
  /** Country the language is associated with (for the switcher) */
  country: string;
  /** Flag emoji */
  flag: string;
  /** Text direction */
  dir: "ltr" | "rtl";
};

export const localeMeta: Record<AppLocale, LocaleMeta> = {
  en: {
    code: "en",
    nativeName: "English",
    englishName: "English",
    country: "Global",
    flag: "🇬🇧",
    dir: "ltr",
  },
  hi: {
    code: "hi",
    nativeName: "हिन्दी",
    englishName: "Hindi",
    country: "India",
    flag: "🇮🇳",
    dir: "ltr",
  },
  bn: {
    code: "bn",
    nativeName: "বাংলা",
    englishName: "Bengali",
    country: "Bangladesh",
    flag: "🇧🇩",
    dir: "ltr",
  },
  ne: {
    code: "ne",
    nativeName: "नेपाली",
    englishName: "Nepali",
    country: "Nepal",
    flag: "🇳🇵",
    dir: "ltr",
  },
  si: {
    code: "si",
    nativeName: "සිංහල",
    englishName: "Sinhala",
    country: "Sri Lanka",
    flag: "🇱🇰",
    dir: "ltr",
  },
  th: {
    code: "th",
    nativeName: "ไทย",
    englishName: "Thai",
    country: "Thailand",
    flag: "🇹🇭",
    dir: "ltr",
  },
  my: {
    code: "my",
    nativeName: "မြန်မာ",
    englishName: "Burmese",
    country: "Myanmar",
    flag: "🇲🇲",
    dir: "ltr",
  },
  dz: {
    code: "dz",
    nativeName: "རྫོང་ཁ",
    englishName: "Dzongkha",
    country: "Bhutan",
    flag: "🇧🇹",
    dir: "ltr",
  },
};

export const localeList: LocaleMeta[] = locales.map((code) => localeMeta[code]);
