
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import translationEN from './locales/en/translation.json';
import translationLV from './locales/lv/translation.json';

const resources = {
  en: {
    translation: translationEN,
  },
  lv: {
    translation: translationLV,
  },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en', 
    debug: true, 

    interpolation: {
      escapeValue: false, 
    },
  });

export default i18n;