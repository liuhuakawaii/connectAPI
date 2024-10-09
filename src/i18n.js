import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en_US.json'
import zh from './locales/zh_CN.json'
import de from './locales/de-DE.json'
import ja from './locales/ja_JP.json'
import ko from './locales/ko_KR.json'
import Backend from 'i18next-http-backend';

const resources = {
    "en": {
        translation: en
    },
    "zh": {
        translation: zh
    },
    "de": {
        translation: de
    },
    "ja": {
        translation: ja
    },
    "ko": {
        translation: ko
    }
}

const currentLocale = localStorage.getItem('defaultI18n')?localStorage.getItem('defaultI18n'):'en';


i18n
    .use(Backend)
    .use(initReactI18next)

    .init({
        resources,
        fallbackLng: 'en',
        lng: currentLocale,
        debug: false,
        interpolation: {
            escapeValue: false,
        }
    });

export default i18n;