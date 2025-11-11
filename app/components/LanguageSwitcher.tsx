"use client";

import { useTranslation } from 'react-i18next';

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();

  return (
    <div className="flex items-center gap-2">
      <button 
        onClick={() => i18n.changeLanguage('en')}
        className={i18n.language === 'en' ? 'font-bold' : 'font-normal'}
      >
        EN
      </button>
      <span>/</span>
      <button 
        onClick={() => i18n.changeLanguage('lv')}
        className={i18n.language === 'lv' ? 'font-bold' : 'font-normal'}
      >
        LV
      </button>
    </div>
  );
}