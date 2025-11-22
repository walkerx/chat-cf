import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import enTranslation from './locales/en.json';
import zhCNTranslation from './locales/zh-CN.json';

// Get language from localStorage or browser
const getDefaultLanguage = () => {
  const savedLanguage = localStorage.getItem('language');
  if (savedLanguage && ['en', 'zh-CN'].includes(savedLanguage)) {
    return savedLanguage;
  }

  // Detect browser language
  const browserLang = navigator.language;
  if (browserLang.startsWith('zh')) {
    return 'zh-CN';
  }
  return 'en';
};

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        translation: enTranslation,
      },
      'zh-CN': {
        translation: zhCNTranslation,
      },
    },
    lng: getDefaultLanguage(),
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
