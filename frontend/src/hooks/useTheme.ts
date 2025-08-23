import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type ThemeMode = 'light' | 'dark'

interface ThemeStore {
  theme: ThemeMode
  setTheme: (theme: ThemeMode) => void
  toggleTheme: () => void
}

export const useTheme = create<ThemeStore>()(
  persist(
    (set, get) => ({
      theme: 'light',
      setTheme: (theme: ThemeMode) => {
        set({ theme })
        document.documentElement.setAttribute('data-theme', theme)
      },
      toggleTheme: () => {
        const currentTheme = get().theme
        const newTheme = currentTheme === 'light' ? 'dark' : 'light'
        get().setTheme(newTheme)
      }
    }),
    {
      name: 'kid-videos-theme',
      onRehydrateStorage: () => (state) => {
        if (state?.theme) {
          document.documentElement.setAttribute('data-theme', state.theme)
        }
      }
    }
  )
)

// 主题配置
export const themeConfig = {
  light: {
    token: {
      colorPrimary: '#52c41a',
      colorSuccess: '#52c41a',
      colorWarning: '#faad14',
      colorError: '#ff4d4f',
      colorInfo: '#1890ff',
      colorBgContainer: '#ffffff',
      colorBgLayout: '#f5f5f5',
      colorText: '#333333',
      colorTextSecondary: '#666666',
      borderRadius: 12,
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
    },
    colors: {
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      headerBackground: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
      cardBackground: 'rgba(255, 255, 255, 0.95)',
      textPrimary: '#333333',
      textSecondary: '#666666',
      border: '#e0e0e0',
      shadow: '0 8px 30px rgba(0, 0, 0, 0.1)'
    }
  },
  dark: {
    token: {
      colorPrimary: '#52c41a',
      colorSuccess: '#52c41a', 
      colorWarning: '#faad14',
      colorError: '#ff4d4f',
      colorInfo: '#1890ff',
      colorBgContainer: '#1f1f1f',
      colorBgLayout: '#141414',
      colorText: '#ffffff',
      colorTextSecondary: '#cccccc',
      borderRadius: 12,
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
    },
    colors: {
      background: 'linear-gradient(135deg, #2c3e50 0%, #34495e 100%)',
      headerBackground: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      cardBackground: 'rgba(31, 31, 31, 0.95)',
      textPrimary: '#ffffff',
      textSecondary: '#cccccc',
      border: '#404040',
      shadow: '0 8px 30px rgba(0, 0, 0, 0.3)'
    }
  }
}

export default useTheme