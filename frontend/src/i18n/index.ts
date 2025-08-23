import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

import zhCN from './locales/zh-CN.json'
import enUS from './locales/en-US.json'

// 语言资源
const resources = {
  'zh-CN': {
    translation: zhCN
  },
  'en-US': {
    translation: enUS
  }
}

i18n
  // 检测用户语言
  .use(LanguageDetector)
  // 传递i18n实例给react-i18next
  .use(initReactI18next)
  // 初始化i18next
  .init({
    resources,
    fallbackLng: 'zh-CN',
    debug: process.env.NODE_ENV === 'development',

    interpolation: {
      escapeValue: false, // React已经处理了XSS
    },

    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
      lookupLocalStorage: 'kid-videos-language',
    }
  })

export default i18n