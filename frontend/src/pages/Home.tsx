import React, { useEffect, useState } from 'react'
import { 
  Button, 
  Space, 
  Spin,
  message,
  Alert,
  Modal
} from 'antd'
import { 
  HeartOutlined,
  HeartFilled
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'

import { useAppStore } from '@/stores/appStore'
import { SearchRequest, Video } from '@/types'
import { getApiMode } from '@/services/api'
import useI18n from '@/hooks/useI18n'


const Home: React.FC = () => {
  const navigate = useNavigate()
  const { t } = useI18n()
  
  const {
    searchResults,
    loading,
    searchVideos,
    deleteVideo,
    loadSettings,
    clearCache,
    setCurrentSearch,
    addToFavorites,
    loadFavorites,
    favorites
  } = useAppStore()

  const [searchQuery, setSearchQuery] = useState('')
  const [platform] = useState('youtube')
  const [videoCount, setVideoCount] = useState(10)
  const [filterMode, setFilterMode] = useState('balanced')
  const [apiMode] = useState(getApiMode())

  useEffect(() => {
    loadSettings()
    loadFavorites()
  }, [loadSettings, loadFavorites])

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      message.warning(t('search.inputPlaceholder'))
      return
    }

    try {
      setCurrentSearch(searchQuery)
      const request: SearchRequest = {
        query: searchQuery,
        platform: platform as 'youtube' | 'youtube_kids',
        filter_mode: filterMode as 'strict' | 'balanced' | 'educational',
        max_results: videoCount
      }
      
      const response = await searchVideos(request)
      message.success(t('messages.searchSuccess', { count: response.videos.length }))
    } catch (error) {
      message.error(t('messages.searchFailed'))
      console.error('Search error:', error)
    }
  }

  const handleVideoPlay = (videoId: string) => {
    navigate(`/player/${videoId}`)
  }

  const handleVideoFavorite = async (video: Video) => {
    try {
      await addToFavorites(video.id, t('favorites.fromSearch', { query: searchQuery }))
      message.success(t('messages.favoriteAdded'))
    } catch (error) {
      message.error(t('messages.favoriteAddFailed'))
    }
  }

  const handleVideoDelete = (video: Video) => {
    Modal.confirm({
      title: t('video.confirmDelete'),
      content: t('video.deleteConfirmText'),
      okText: t('common.confirm'),
      cancelText: t('common.cancel'),
      onOk: async () => {
        try {
          await deleteVideo(video.id)
          message.success(t('common.success'))
        } catch (error) {
          message.error(t('common.error'))
        }
      }
    })
  }

  const handleClearCache = async () => {
    try {
      await clearCache()
      message.success(t('messages.cacheClearSuccess'))
    } catch (error) {
      message.error(t('messages.cacheClearFailed'))
    }
  }

  const formatDuration = (seconds?: number) => {
    if (!seconds) return ''
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const formatViewCount = (count?: number) => {
    if (!count) return ''
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`
    }
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`
    }
    return count.toString()
  }

  const getScoreClass = (score?: number) => {
    if (!score) return ''
    if (score >= 0.8) return 'high'
    if (score >= 0.6) return 'medium'
    return 'low'
  }

  const getScoreText = (score?: number) => {
    if (!score) return '-'
    if (score >= 0.8) return t('video.excellent')
    if (score >= 0.6) return t('video.good')
    return t('video.average')
  }

  const isVideoFavorited = (videoId: string) => {
    return favorites.some(fav => fav.video_id === videoId)
  }

  const hotKeywords = t('search.hotKeywordsList', { returnObjects: true }) as string[]

  return (
    <>
      {/* API配置提示 - 在Tauri和Browser模式下显示，提示配置API */}
      {(apiMode === 'tauri' || apiMode === 'browser') && (
        <Alert
          message={apiMode === 'tauri' ? t('home.productionModeTitle') : t('home.browserModeTitle')}
          description={apiMode === 'tauri' ? t('home.productionModeDesc') : t('home.browserModeDesc')}
          type="warning"
          showIcon
          closable
          style={{ margin: '1rem 2rem', borderRadius: '15px' }}
          action={
            <Button 
              size="small" 
              type="primary"
              onClick={() => navigate('/settings')}
            >
              {t('home.configureNow')}
            </Button>
          }
        />
      )}
      
      {/* 测试模式提示 - 只在测试模式下显示 */}
      {apiMode === 'test' && (
        <Alert
          message={t('home.testModeTitle')}
          description={t('home.testModeDesc')}
          type="info"
          showIcon
          closable
          style={{ margin: '1rem 2rem', borderRadius: '15px' }}
        />
      )}

      {/* 搜索区域 - 完全复刻Chrome扩展风格 */}
      <section className="search-section">
        <div className="search-container">
          <div className="search-input-group">
            <input
              type="text"
              className="search-input"
              placeholder={t('search.inputPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              autoComplete="off"
            />
            <button 
              className="search-btn"
              onClick={handleSearch}
              disabled={loading.searching}
            >
              {loading.searching ? <Spin /> : t('search.searchButton')}
            </button>
          </div>
          
          <div className="search-options">
            <div className="option-group">
              <label className="option-label">{t('search.videoCount')}：</label>
              <select 
                className="select-input"
                value={videoCount}
                onChange={(e) => setVideoCount(Number(e.target.value))}
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={15}>15</option>
                <option value={20}>20</option>
              </select>
            </div>
            
            <div className="option-group">
              <label className="option-label">{t('search.filterMode')}：</label>
              <select 
                className="select-input"
                value={filterMode}
                onChange={(e) => setFilterMode(e.target.value)}
              >
                <option value="strict">{t('filterModes.strict.name')}</option>
                <option value="balanced">{t('filterModes.balanced.name')}</option>
                <option value="educational">{t('filterModes.educational.name')}</option>
              </select>
            </div>
          </div>
          
          {/* 快速搜索建议 */}
          <div style={{ marginTop: '1rem' }}>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginRight: '0.5rem' }}>
              {t('search.hotKeywords')}
            </span>
            <Space wrap>
              {hotKeywords.map(keyword => (
                <Button 
                  key={keyword}
                  size="small" 
                  type="link"
                  onClick={() => setSearchQuery(keyword)}
                  style={{ 
                    color: 'var(--text-primary)',
                    fontFamily: 'Comic Sans MS',
                    padding: '0.2rem 0.5rem',
                    borderRadius: '10px'
                  }}
                >
                  {keyword}
                </Button>
              ))}
            </Space>
          </div>
        </div>
      </section>

      {/* 视频列表区域 */}
      {loading.searching ? (
        <section className="loading-section">
          <div className="loading-content">
            <div className="spinner"></div>
            <p className="loading-text">{t('search.searching')}</p>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: '70%' }}></div>
            </div>
            <p className="progress-text">7/10</p>
          </div>
        </section>
      ) : searchResults.length > 0 ? (
        <section className="video-list-section">
          <div className="section-header" style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '1rem',
            padding: '0 2rem'
          }}>
            <h2 style={{ 
              margin: 0, 
              fontSize: '1.5rem', 
              color: 'var(--text-primary)',
              fontWeight: 'bold'
            }}>
              {t('search.results')} ({searchResults.length})
            </h2>
            <div className="list-actions">
              <Button
                className="btn btn-secondary"
                onClick={() => window.location.reload()}
                style={{ marginRight: '0.5rem' }}
              >
                🔄 {t('common.refresh')}
              </Button>
              <Button
                className="btn btn-secondary"
                onClick={handleClearCache}
              >
                🗑️ {t('nav.clearCache')}
              </Button>
            </div>
          </div>
          
          <div className="video-grid">
            {searchResults.map((video) => (
              <div key={video.id} className="video-item fade-in">
                <div className="video-thumbnail">
                  <img 
                    className="thumbnail-img"
                    src={video.thumbnail_url || '/placeholder-video.png'} 
                    alt={video.title}
                    loading="lazy"
                  />
                  <div className="video-duration">
                    {formatDuration(video.duration)}
                  </div>
                  <button 
                    className="play-btn"
                    onClick={() => handleVideoPlay(video.id)}
                    title={t('video.watch')}
                  >
                    ▶️
                  </button>
                </div>
                
                <div className="video-info">
                  <h3 className="video-title">{video.title}</h3>
                  
                  <div className="video-meta">
                    <span className="channel-name">{video.channel_title}</span>
                    <span className="view-count">{formatViewCount(video.view_count)}</span>
                    <span className="publish-date">
                      {video.published_at ? new Date(video.published_at).toLocaleDateString() : ''}
                    </span>
                  </div>
                  
                  <div className="ai-scores">
                    <div className="score-item">
                      <span className="score-label">{t('video.educationScore')}：</span>
                      <span className={`score-value ${getScoreClass(video.education_score)}`}>
                        {getScoreText(video.education_score)}
                      </span>
                    </div>
                    <div className="score-item">
                      <span className="score-label">{t('video.safetyScore')}：</span>
                      <span className={`score-value ${getScoreClass(video.safety_score)}`}>
                        {getScoreText(video.safety_score)}
                      </span>
                    </div>
                    <div className="score-item">
                      <span className="score-label">{t('video.overallScore')}：</span>
                      <span className={`score-value ${getScoreClass(video.ai_score)}`}>
                        {getScoreText(video.ai_score)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="video-actions">
                    <button 
                      className="action-btn watch-btn"
                      onClick={() => handleVideoPlay(video.id)}
                      title={t('video.watch')}
                    >
                      👁️ {t('video.watch')}
                    </button>
                    <button 
                      className={`action-btn favorite-btn ${isVideoFavorited(video.id) ? 'favorited' : ''}`}
                      onClick={() => handleVideoFavorite(video)}
                      title={t('video.favorite')}
                    >
                      {isVideoFavorited(video.id) ? <HeartFilled /> : <HeartOutlined />}
                    </button>
                    <button 
                      className="action-btn delete-btn"
                      onClick={() => handleVideoDelete(video)}
                      title={t('video.delete')}
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : (
        <section className="empty-state">
          <div className="empty-content">
            <div className="empty-icon">🎬</div>
            <h3>{t('search.emptyTitle')}</h3>
            <p>{t('search.emptyDescription')}</p>
          </div>
        </section>
      )}
    </>
  )
}

export default Home