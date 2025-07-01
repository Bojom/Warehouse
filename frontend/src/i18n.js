import { createI18n } from 'vue-i18n';
import en from './locales/en.json';
import fr from './locales/fr.json';
import zh from './locales/zh.json';

const i18n = createI18n({
  legacy: false, // use composition API
  locale: 'en', // set default locale
  fallbackLocale: 'en', // fallback to English if translation not found
  messages: {
    en,
    fr,
    zh
  }
});

export default i18n;
