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

// 动态导入Tauri API以避免在浏览器环境中出错
const getTauriInvoke = async () => {
  if (typeof window !== 'undefined' && (window as any).__TAURI__) {
    const { invoke } = await import('@tauri-apps/api/core')
    return invoke
  }
  throw new Error('Tauri API not available')
}

/**
 * Tauri API服务实现
 * 通过Tauri调用Rust后端代码
 */
export class TauriApiService implements ApiService {
  
  constructor() {
    console.info('🦀 Tauri API Service initialized - Desktop app mode')
  }

  // 搜索视频
  async searchVideos(request: SearchRequest): Promise<SearchResponse> {
    try {
      console.info(`🔍 Tauri: Searching for "${request.query}" with ${request.filter_mode} mode`)
      const invoke = await getTauriInvoke()
      return await invoke<SearchResponse>('search_videos', { request })
    } catch (error) {
      console.error('Tauri search videos failed:', error)
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
      console.info('❤️ Tauri: Loading favorites')
      const invoke = await getTauriInvoke()
      return await invoke<FavoriteVideo[]>('get_favorites')
    } catch (error) {
      console.error('Tauri get favorites failed:', error)
      throw new Error(`获取收藏列表失败: ${this.formatError(error)}`)
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
      console.info('⚙️ Tauri: Loading settings')
      const invoke = await getTauriInvoke()
      return await invoke<AppSettings>('get_settings')
    } catch (error) {
      console.error('Tauri get settings failed:', error)
      throw new Error(`获取设置失败: ${this.formatError(error)}`)
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