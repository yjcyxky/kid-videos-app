// API抽象层 - 统一的API接口定义
import type { ApiService } from './interfaces'
import { TauriApiService } from './tauri'
import { MockApiService } from './mock'

// 重新导出接口供其他模块使用
export type { ApiService }

/**
 * API工厂 - 根据环境返回对应的API实现
 */
export class ApiFactory {
  private static instance: ApiService | null = null
  
  static getInstance(): ApiService {
    // 检查是否在测试环境
    const isTestEnvironment = this.isTestEnvironment()
    
    // 每次都重新检查环境，确保在Tauri应用启动后能正确切换
    const shouldUseTauri = this.isTauriEnvironment()
    const shouldUseMock = isTestEnvironment // 只在测试环境使用Mock
    
    if (!this.instance || this.needsReinitialize(shouldUseTauri, shouldUseMock)) {
      const mode = shouldUseMock ? 'Mock (Test)' : (shouldUseTauri ? 'Tauri' : 'Browser')
      console.log(`🔄 (Re)initializing API service: ${mode}`)
      this.instance = this.createApiService()
    }
    
    return this.instance
  }
  
  private static needsReinitialize(shouldUseTauri: boolean, shouldUseMock: boolean): boolean {
    if (!this.instance) return true
    
    const isTauriInstance = this.instance instanceof TauriApiService
    const isMockInstance = this.instance instanceof MockApiService
    
    if (shouldUseMock) return !isMockInstance
    if (shouldUseTauri) return !isTauriInstance
    
    // Browser mode - should prompt for API configuration
    return isMockInstance || isTauriInstance
  }
  
  private static createApiService(): ApiService {
    // 优先检查是否在测试环境
    if (this.isTestEnvironment()) {
      console.log('🧪 Creating Mock API service for testing')
      return this.createMockApi()
    }
    
    console.log('🚀 Creating Tauri API service for production mode')
    return this.createTauriApi()
  }
  
  static isTestEnvironment(): boolean {
    // 检查是否在测试环境
    return (
      typeof process !== 'undefined' && 
      process.env.NODE_ENV === 'test'
    ) || (
      typeof window !== 'undefined' && 
      (window as any).__TEST_MODE__ === true
    ) || (
      typeof import.meta !== 'undefined' && 
      (import.meta as any).env?.MODE === 'test'
    ) || (
      typeof globalThis !== 'undefined' && 
      (globalThis as any).__vitest_worker__
    )
  }
  
  private static isTauriEnvironment(): boolean {
    // 更可靠的Tauri环境检测
    if (typeof window === 'undefined') return false
    
    // 首先检查是否已经明确设置为Tauri应用
    if ((window as any).__IS_TAURI_APP__) {
      console.log('✅ Tauri environment detected via global flag')
      return true
    }
    
    // 尝试检测Tauri API的存在
    try {
      // 检查是否能同步导入Tauri模块
      const isTauriAvailable = !!(window as any).__TAURI__ || 
                               !!(window as any).__TAURI_INVOKE__ ||
                               navigator.userAgent.includes('Tauri')
      
      console.log('🔍 Tauri Environment Check:', {
        hasTauriGlobal: !!(window as any).__TAURI__,
        hasTauriInvoke: !!(window as any).__TAURI_INVOKE__,
        userAgentCheck: navigator.userAgent.includes('Tauri'),
        finalResult: isTauriAvailable,
        userAgent: navigator.userAgent
      })
      
      return isTauriAvailable
    } catch (error) {
      console.log('❌ Tauri detection failed:', error)
      return false
    }
  }
  
  private static createTauriApi(): ApiService {
    // 实例化Tauri API服务
    return new TauriApiService()
  }
  
  private static createMockApi(): ApiService {
    // 实例化Mock API服务 - 仅用于测试
    return new MockApiService()
  }
  
  // 用于测试或特殊情况下手动设置API实现
  static setInstance(apiService: ApiService): void {
    this.instance = apiService
  }
}

// 添加API测试功能
const testAPIConnections = async (apiKeys: Record<string, string>): Promise<Record<string, any>> => {
  if (isTauriApp()) {
    // 在Tauri环境中调用Rust后端
    const { invoke } = await import('@tauri-apps/api/core')
    return await invoke('test_api_connections', { apiKeys })
  } else {
    // 在浏览器环境中进行真实的API测试
    const results: Record<string, any> = {}
    
    // 将API密钥名称映射到provider名称
    if (apiKeys.openai_api_key) {
      results.openai = {
        success: true,
        message: 'OpenAI API key configured (Browser mode - actual test requires backend)'
      }
    }
    
    if (apiKeys.anthropic_api_key) {
      results.anthropic = {
        success: true,
        message: 'Anthropic API key configured (Browser mode - actual test requires backend)'
      }
    }
    
    if (apiKeys.youtube_api_key) {
      // 在浏览器模式下可以尝试测试YouTube API
      try {
        const response = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&q=test&key=${apiKeys.youtube_api_key}&maxResults=1`)
        if (response.ok) {
          results.youtube = {
            success: true,
            message: 'YouTube API connection successful'
          }
        } else {
          const errorText = await response.text()
          results.youtube = {
            success: false,
            error: `YouTube API test failed: ${response.status} - ${errorText}`
          }
        }
      } catch (error) {
        results.youtube = {
          success: false,
          error: `YouTube API test failed: ${error}`
        }
      }
    }
    
    return results
  }
}

// 导出动态API对象 - 每次调用时重新获取实例
export const api = {
  // 视频相关方法
  searchVideos: (request: any) => ApiFactory.getInstance().searchVideos(request),
  analyzeVideo: (request: any) => ApiFactory.getInstance().analyzeVideo(request),
  saveVideo: (video: any) => ApiFactory.getInstance().saveVideo(video),
  deleteVideo: (videoId: string) => ApiFactory.getInstance().deleteVideo(videoId),
  getCachedVideos: () => ApiFactory.getInstance().getCachedVideos(),

  // 收藏相关方法
  getFavorites: () => ApiFactory.getInstance().getFavorites(),
  addToFavorites: (videoId: string, notes?: string) => ApiFactory.getInstance().addToFavorites(videoId, notes),
  removeFromFavorites: (favoriteId: number) => ApiFactory.getInstance().removeFromFavorites(favoriteId),

  // 设置相关方法
  getSettings: () => ApiFactory.getInstance().getSettings(),
  saveSettings: (settings: any) => ApiFactory.getInstance().saveSettings(settings),

  // 缓存相关方法
  clearCache: () => ApiFactory.getInstance().clearCache(),
  getSearchHistory: (limit?: number) => ApiFactory.getInstance().getSearchHistory(limit),

  // 测试方法
  testAPIConnections
}

// 导出环境检测函数，供其他组件使用
export const isTauriApp = () => {
  // 更可靠的Tauri环境检测
  if (typeof window === 'undefined') return false
  
  // 首先检查是否已经明确设置为Tauri应用
  if ((window as any).__IS_TAURI_APP__) return true
  
  // 检查Tauri API的存在
  const isTauriAvailable = !!(window as any).__TAURI__ || 
                           !!(window as any).__TAURI_INVOKE__ ||
                           navigator.userAgent.includes('Tauri')
  
  return isTauriAvailable
}

// 导出模式信息
export const getApiMode = (): 'tauri' | 'browser' | 'test' => {
  if (ApiFactory.isTestEnvironment()) {
    return 'test'
  }
  return isTauriApp() ? 'tauri' : 'browser'
}

export default api