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

// 强制环境检测和模式设置
async function detectEnvironmentAndSetMode() {
  console.log('🔍 Starting environment detection...');
  
  // 检测是否在Tauri环境中
  const checks = {
    hasTauriGlobal: !!(window as any).__TAURI__,
    hasTauriInvoke: !!(window as any).__TAURI_INVOKE__,
    hasTauriMeta: !!(window as any).__TAURI_METADATA__,
    userAgentCheck: navigator.userAgent.includes('Tauri'),
    userAgent: navigator.userAgent
  };
  
  console.log('🔍 Environment checks:', checks);
  
  const isTauriEnv = checks.hasTauriGlobal || checks.hasTauriInvoke || checks.hasTauriMeta || checks.userAgentCheck;
  
  if (isTauriEnv) {
    // 强制设置Tauri环境标识
    (window as any).__IS_TAURI_APP__ = true;
    (window as any).__API_MODE__ = 'production';
    console.log('🚀 FORCE: Setting Tauri Production Mode');
    console.log('✅ Production mode flags set');
  } else {
    (window as any).__IS_TAURI_APP__ = false;
    (window as any).__API_MODE__ = 'browser';
    console.log('🌐 Browser preview mode detected');
  }
  
  // 延迟确保标识生效
  await new Promise(resolve => setTimeout(resolve, 200));
  
  console.log('✅ Environment detection completed, mode:', (window as any).__API_MODE__);
}

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

// 启动应用
async function startApp() {
  // 首先检测环境并设置模式
  await detectEnvironmentAndSetMode();
  
  // 然后渲染应用
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <BrowserRouter>
        <AppWithProviders />
      </BrowserRouter>
    </React.StrictMode>,
  );
}

// 启动应用
startApp();