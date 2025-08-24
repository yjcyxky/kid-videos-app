import React from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { 
  HomeOutlined,
  SettingOutlined, 
  HeartOutlined, 
  ExperimentOutlined,
  QuestionCircleOutlined,
  SunOutlined,
  MoonOutlined,
  TranslationOutlined
} from '@ant-design/icons'

import useI18n from '@/hooks/useI18n'
import useTheme from '@/hooks/useTheme'
import { useAppStore } from '@/stores/appStore'
import { getApiMode } from '@/services/api'

const Layout: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { t, changeLanguage, currentLanguage } = useI18n()
  const { theme, toggleTheme } = useTheme()
  const { searchResults } = useAppStore()
  
  const apiMode = getApiMode()
  const isConnected = apiMode === 'tauri'

  const handleLanguageToggle = () => {
    const newLang = currentLanguage.startsWith('zh') ? 'en-US' : 'zh-CN'
    changeLanguage(newLang)
  }

  const navigationButtons = [
    { key: 'home', path: '/', icon: <HomeOutlined />, label: t('nav.home') },
    { key: 'settings', path: '/settings', icon: <SettingOutlined />, label: t('nav.settings') },
    { key: 'favorites', path: '/favorites', icon: <HeartOutlined />, label: t('nav.favorites') },
    { key: 'test', path: '/test', icon: <ExperimentOutlined />, label: t('nav.test') },
    { key: 'help', path: '/help', icon: <QuestionCircleOutlined />, label: t('nav.help') }
  ]

  const currentPath = location.pathname

  return (
    <>
      {/* 苹果风格简洁头部 */}
      <header className="app-header">
        <div className="header-content">
          <h1 className="app-title">
             <img src="/logo.png" alt="Logo" style={{ height: '32px', marginRight: '0.5rem' }} />
             {t('common.appName')}
          </h1>
          
          <div className="header-actions">
            {navigationButtons.map(btn => (
              <button
                key={btn.key}
                className={`nav-btn ${currentPath === btn.path ? 'active' : ''}`}
                onClick={() => navigate(btn.path)}
                title={btn.label}
              >
                {btn.icon}
                <span style={{ marginLeft: '0.5rem' }}>{btn.label}</span>
              </button>
            ))}
            
            {/* 工具按钮 */}
            <button 
              className="tool-btn"
              onClick={toggleTheme}
              title={theme === 'light' ? t('settings.darkTheme') : t('settings.lightTheme')}
            >
              {theme === 'light' ? <MoonOutlined /> : <SunOutlined />}
            </button>
            
            <button 
              className="tool-btn"
              onClick={handleLanguageToggle}
              title={currentLanguage.startsWith('zh') ? 'English' : '中文'}
            >
              <TranslationOutlined />
            </button>
          </div>
        </div>
      </header>

      {/* 主要内容区域 */}
      <main className="main-content">
        <Outlet />
      </main>

      {/* 状态栏 */}
      <footer className="app-footer">
        <div className="status-info">
          <span className={`status-dot ${isConnected ? '' : 'disconnected'}`}></span>
          <span className="status-text">
            {isConnected ? 
              t('common.tauriMode') : 
              t('common.browserMode')
            }
          </span>
        </div>
        
        <div className="cache-info">
          <span>{t('search.results')}:</span>
          <span>{searchResults.length}</span>
          <span style={{ marginLeft: '0.5rem' }}>
            {isConnected ? t('common.productionData', '📊 生产数据') : t('common.demoData', '🎭 演示数据')}
          </span>
        </div>
      </footer>
    </>
  )
}

export default Layout