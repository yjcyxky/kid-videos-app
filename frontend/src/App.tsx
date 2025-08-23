import { useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import { App as AntdApp } from 'antd'

import Layout from '@/components/Layout'
import Home from '@/pages/Home'
import Settings from '@/pages/Settings'
import Favorites from '@/pages/Favorites'
import Player from '@/pages/Player'
import Test from '@/pages/Test'
import Help from '@/pages/Help'
import useTheme from '@/hooks/useTheme'

function App() {
  const { theme } = useTheme()

  useEffect(() => {
    // 设置主题数据属性
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  return (
    <AntdApp style={{ width: '100vw', height: '100vh' }}>
      <div className="kid-videos-app">
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="settings" element={<Settings />} />
            <Route path="favorites" element={<Favorites />} />
            <Route path="test" element={<Test />} />
            <Route path="help" element={<Help />} />
            <Route path="player/:videoId" element={<Player />} />
          </Route>
        </Routes>
      </div>
    </AntdApp>
  )
}

export default App