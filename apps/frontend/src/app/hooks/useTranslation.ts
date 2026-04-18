import { useLanguage } from "@/app/context/LanguageContext";
import { translations } from "@/app/context/translations";

export const useTranslation = () => {
  const { language } = useLanguage();

  const t = (key: string, defaultValue: string = key): string => {
    const keys = key.split(".");
    let value: any = translations[language];

    for (const k of keys) {
      value = value?.[k];
    }

    return value || defaultValue;
  };

  return { t, language };
};
