import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ConfigProvider } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import enUS from 'antd/locale/en_US'
import 'dayjs/locale/zh-cn'
import 'dayjs/locale/en'
import dayjs from 'dayjs'

import App from './App'
import '@/styles/index.css'
import '@/i18n'

// 主题提供者组件
function AppWithProviders() {
  const [theme, setTheme] = React.useState<'light' | 'dark'>('light')
  const [language, setLanguage] = React.useState<'zh-CN' | 'en-US'>('zh-CN')

  React.useEffect(() => {
    // 从localStorage恢复主题和语言设置
    const savedTheme = localStorage.getItem('kid-videos-theme')
    const savedLang = localStorage.getItem('kid-videos-language')
    
    if (savedTheme === 'dark') setTheme('dark')
    if (savedLang === 'en-US') setLanguage('en-US')
    
    // 设置dayjs语言
    dayjs.locale(language === 'zh-CN' ? 'zh-cn' : 'en')
  }, [language])

  const antdLocale = language === 'zh-CN' ? zhCN : enUS

  // 动态主题配置
  const antdTheme = {
    token: {
      colorPrimary: '#007aff',
      colorSuccess: '#34c759',
      colorWarning: '#ff9500',
      colorError: '#ff3b30',
      colorInfo: '#007aff',
      borderRadius: 8,
      fontSize: 16,
      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Helvetica Neue", Arial, sans-serif',
      boxShadow: 'none',
      colorBgContainer: theme === 'light' ? '#ffffff' : '#2c2c2e',
      colorBgLayout: theme === 'light' ? '#f5f7fa' : '#1c1c1e',
      colorText: theme === 'light' ? '#1a1a1a' : '#ffffff',
      colorTextSecondary: theme === 'light' ? '#666666' : '#aeaeb2',
      colorTextTertiary: theme === 'light' ? '#999999' : '#8e8e93',
      colorBorder: theme === 'light' ? '#d2d2d7' : '#48484a',
      colorBorderSecondary: theme === 'light' ? '#e5e5e7' : '#38383a',
    },
    components: {
      Button: {
        borderRadius: 8,
        fontSize: 16,
        fontWeight: 500,
      },
      Card: {
        borderRadius: 12,
        fontSize: 16,
        boxShadow: 'none',
      },
      Input: {
        borderRadius: 8,
        fontSize: 16,
      },
      Select: {
        borderRadius: 8,
        fontSize: 16,
      },
      Alert: {
        borderRadius: 8,
      },
    },
  }

  return (
    <ConfigProvider
      locale={antdLocale}
      theme={antdTheme}
      componentSize="large"
    >
      <App />
    </ConfigProvider>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AppWithProviders />
    </BrowserRouter>
  </React.StrictMode>,
)