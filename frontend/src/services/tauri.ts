// Tauri API实现 - 调用后端Rust代码
import type { 
  SearchRequest, 
  SearchResponse, 
  FavoriteVideo, 
  AppSettings,
  AIAnalysisRequest,
  AIAnalysisResponse,
  Video 
} from '@/types'
import type { ApiService } from './interfaces'

// 动态导入Tauri API - 简化版本
const getTauriInvoke = async () => {
  try {
    console.log('🔄 Attempting to import Tauri API...')
    
    // 直接尝试导入，如果失败说明不在Tauri环境中
    const { invoke } = await import('@tauri-apps/api/core')
    
    console.log('✅ Tauri API imported successfully, invoke type:', typeof invoke)
    
    if (typeof invoke !== 'function') {
      throw new Error('Tauri invoke is not a function')
    }
    
    return invoke
  } catch (importError) {
    console.error('❌ Tauri API import failed:', importError)
    
    // 如果在Tauri环境中导入失败，这是严重错误
    if (typeof window !== 'undefined' && (window as any).__IS_TAURI_APP__) {
      console.error('🚨 Critical: In Tauri app but cannot access Tauri API!')
    }
    
    throw new Error(`Tauri API not available: ${importError}`)
  }
}

/**
 * Tauri API服务实现
 * 通过Tauri调用Rust后端代码
 */
export class TauriApiService implements ApiService {
  
  constructor() {
    console.info('🚀 Production Tauri API Service initialized - Desktop app mode')
    
    // 在Tauri环境中设置全局标识
    if (typeof window !== 'undefined') {
      ;(window as any).__IS_TAURI_APP__ = true
      ;(window as any).__API_MODE__ = 'production'
    }
  }

  // 搜索视频
  async searchVideos(request: SearchRequest): Promise<SearchResponse> {
    try {
      console.info(`🔍 Production: Searching for "${request.query}" with ${request.filter_mode} mode`)
      const invoke = await getTauriInvoke()
      const response = await invoke<SearchResponse>('search_videos', { request })
      
      // 记录生产模式搜索成功
      console.info(`✅ Production search completed: ${response.videos.length} videos found`)
      
      return response
    } catch (error) {
      console.error('Production search failed:', error)
      throw new Error(`搜索失败: ${this.formatError(error)}`)
    }
  }

  // AI分析视频
  async analyzeVideo(request: AIAnalysisRequest): Promise<AIAnalysisResponse> {
    try {
      console.info(`🤖 Tauri: Analyzing video "${request.title}"`)
      const invoke = await getTauriInvoke()
      return await invoke<AIAnalysisResponse>('analyze_video', { request })
    } catch (error) {
      console.error('Tauri analyze video failed:', error)
      throw new Error(`视频分析失败: ${this.formatError(error)}`)
    }
  }

  // 保存视频到数据库
  async saveVideo(video: Video): Promise<string> {
    try {
      console.info(`💾 Tauri: Saving video "${video.title}"`)
      const invoke = await getTauriInvoke()
      return await invoke<string>('save_video', { video })
    } catch (error) {
      console.error('Tauri save video failed:', error)
      throw new Error(`保存视频失败: ${this.formatError(error)}`)
    }
  }

  // 删除视频
  async deleteVideo(videoId: string): Promise<string> {
    try {
      console.info(`🗑️ Tauri: Deleting video ${videoId}`)
      const invoke = await getTauriInvoke()
      return await invoke<string>('delete_video', { videoId })
    } catch (error) {
      console.error('Tauri delete video failed:', error)
      throw new Error(`删除视频失败: ${this.formatError(error)}`)
    }
  }

  // 获取收藏列表
  async getFavorites(): Promise<FavoriteVideo[]> {
    try {
      console.info('❤️ Production: Loading favorites...')
      
      const invoke = await getTauriInvoke()
      console.info('✅ Tauri invoke obtained, calling get_favorites command...')
      
      const favorites = await invoke<FavoriteVideo[]>('get_favorites')
      console.info(`✅ Loaded ${favorites.length} favorites from backend`)
      
      return favorites
    } catch (error) {
      console.error('❌ Production get favorites failed:', error)
      console.warn('🔄 Using empty favorites list as fallback')
      
      // 返回空列表作为fallback
      return []
    }
  }

  // 添加到收藏
  async addToFavorites(videoId: string, notes?: string): Promise<string> {
    try {
      console.info(`❤️ Tauri: Adding video ${videoId} to favorites`)
      const invoke = await getTauriInvoke()
      return await invoke<string>('add_to_favorites', { videoId, notes })
    } catch (error) {
      console.error('Tauri add to favorites failed:', error)
      throw new Error(`添加收藏失败: ${this.formatError(error)}`)
    }
  }

  // 从收藏中移除
  async removeFromFavorites(favoriteId: number): Promise<string> {
    try {
      console.info(`🗑️ Tauri: Removing favorite ${favoriteId}`)
      const invoke = await getTauriInvoke()
      return await invoke<string>('remove_from_favorites', { favoriteId })
    } catch (error) {
      console.error('Tauri remove from favorites failed:', error)
      throw new Error(`移除收藏失败: ${this.formatError(error)}`)
    }
  }

  // 获取设置
  async getSettings(): Promise<AppSettings> {
    try {
      console.info('⚙️ Production: Loading settings...')
      
      const invoke = await getTauriInvoke()
      console.info('✅ Tauri invoke obtained, calling get_settings command...')
      
      const settings = await invoke<AppSettings>('get_settings')
      console.info('✅ Settings loaded successfully from backend')
      
      return settings
    } catch (error) {
      console.error('❌ Production get settings failed:', error)
      
      // 提供默认设置作为fallback
      console.warn('🔄 Using default settings as fallback')
      return {
        // API配置
        openai_api_key: undefined,
        anthropic_api_key: undefined, 
        youtube_api_key: undefined,
        ai_provider: 'openai',
        
        // 过滤条件配置
        child_age: '3-6',
        custom_filter_prompt: undefined,
        video_count: 10,
        cache_duration_hours: 24,
        
        // 搜索配置
        default_platforms: ['youtube'],
        search_language: 'zh',
        min_duration: 2,
        max_duration: 30,
        
        // 闹钟配置
        enable_alarm: false,
        default_alarm_time: 600,
        countdown_seconds: 60,
        alarm_interval: 10,
        enable_alarm_sound: true,
        enable_visual_alarm: true,
        enable_vibration_alarm: false,
        alarm_message: '该休息了，小朋友！',
        
        // 高级设置
        enable_notifications: true,
        enable_debug_mode: false,
        enable_usage_stats: true,
        enable_filter_stats: true,
        theme: 'light',
        language: 'zh-CN',
        
        // 兼容性字段
        default_filter_mode: 'balanced',
        default_platform: 'youtube',
        max_video_duration_minutes: 30,
      }
    }
  }

  // 保存设置
  async saveSettings(settings: AppSettings): Promise<string> {
    try {
      console.info('⚙️ Tauri: Saving settings')
      const invoke = await getTauriInvoke()
      return await invoke<string>('save_settings', { settings })
    } catch (error) {
      console.error('Tauri save settings failed:', error)
      throw new Error(`保存设置失败: ${this.formatError(error)}`)
    }
  }

  // 清除缓存
  async clearCache(): Promise<string> {
    try {
      console.info('🧹 Tauri: Clearing cache')
      const invoke = await getTauriInvoke()
      return await invoke<string>('clear_cache')
    } catch (error) {
      console.error('Tauri clear cache failed:', error)
      throw new Error(`清除缓存失败: ${this.formatError(error)}`)
    }
  }

  // 获取搜索历史
  async getSearchHistory(limit?: number): Promise<Record<string, string>[]> {
    try {
      console.info('📚 Tauri: Loading search history')
      const invoke = await getTauriInvoke()
      return await invoke<Record<string, string>[]>('get_search_history', { limit })
    } catch (error) {
      console.error('Tauri get search history failed:', error)
      throw new Error(`获取搜索历史失败: ${this.formatError(error)}`)
    }
  }

  // 私有方法：格式化错误信息
  private formatError(error: unknown): string {
    if (typeof error === 'string') {
      return error
    }
    if (error instanceof Error) {
      return error.message
    }
    return String(error)
  }
}