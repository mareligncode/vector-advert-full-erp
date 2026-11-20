import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './en.json';
import am from './am.json';

const savedLang = localStorage.getItem('vector_lang') || 'en';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      am: { translation: am }
    },
    lng: savedLang,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

// Sync html lang attribute
document.documentElement.lang = savedLang;

i18n.on('languageChanged', (lng) => {
  localStorage.setItem('vector_lang', lng);
  document.documentElement.lang = lng;
});

export default i18n;
