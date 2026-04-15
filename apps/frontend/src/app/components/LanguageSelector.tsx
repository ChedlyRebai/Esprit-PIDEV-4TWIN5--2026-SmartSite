import React, { useState, useRef, useEffect } from "react";
import { useLanguage } from "@/app/context/LanguageContext";
import { ChevronDown } from "lucide-react";
import { useTranslation } from "@/app/hooks/useTranslation";

export const LanguageSelector: React.FC = () => {
  const { language, setLanguage, direction } = useLanguage();
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const languages = [
    { code: "en", label: "English", flag: "🇬🇧" },
    { code: "fr", label: "Français", flag: "🇫🇷" },
    { code: "ar", label: "العربية", flag: "🇹🇳" },
  ] as const;

  const currentLang = languages.find((l) => l.code === language);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={dropdownRef} className="relative inline-block">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 transition text-sm font-medium text-gray-700"
        aria-label={t("language.changeAria", "Change language (current: {lang})").replace(
          "{lang}",
          currentLang?.label || "",
        )}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span>{currentLang?.flag}</span>
        <span>{currentLang?.label}</span>
        <ChevronDown
          size={16}
          className={`transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <div
          className={`absolute mt-2 w-48 rounded-lg shadow-xl bg-white border border-gray-200 py-1 z-50 ${
            direction === "rtl" ? "right-0" : "left-0"
          }`}
        >
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => {
                setLanguage(lang.code as "en" | "fr" | "ar");
                setIsOpen(false);
              }}
              className={`w-full text-left px-4 py-2 flex items-center gap-2 hover:bg-blue-50 transition ${
                language === lang.code ? "bg-blue-100 text-blue-900" : ""
              }`}
            >
              <span className="text-lg">{lang.flag}</span>
              <span className="flex-1">{lang.label}</span>
              {language === lang.code && (
                <span className="text-blue-600">✓</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
