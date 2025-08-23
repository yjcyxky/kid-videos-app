import { useTranslation } from 'react-i18next'

export const useI18n = () => {
  const { t, i18n } = useTranslation()
  
  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng)
  }
  
  const currentLanguage = i18n.language
  
  const isEnglish = currentLanguage.startsWith('en')
  const isChinese = currentLanguage.startsWith('zh')
  
  return {
    t,
    changeLanguage,
    currentLanguage,
    isEnglish,
    isChinese
  }
}

export default useI18n