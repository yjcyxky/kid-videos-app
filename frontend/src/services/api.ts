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
    if (!this.instance) {
      this.instance = this.createApiService()
    }
    return this.instance
  }
  
  private static createApiService(): ApiService {
    // 检查是否在Tauri环境中
    if (this.isTauriEnvironment()) {
      // 动态导入Tauri API实现
      return this.createTauriApi()
    } else {
      // 动态导入Mock API实现
      return this.createMockApi()
    }
  }
  
  private static isTauriEnvironment(): boolean {
    return typeof window !== 'undefined' && 
           typeof (window as any).__TAURI__ !== 'undefined'
  }
  
  private static createTauriApi(): ApiService {
    // 实例化Tauri API服务
    return new TauriApiService()
  }
  
  private static createMockApi(): ApiService {
    // 实例化Mock API服务
    return new MockApiService()
  }
  
  // 用于测试或特殊情况下手动设置API实现
  static setInstance(apiService: ApiService): void {
    this.instance = apiService
  }
}

// 导出单例API实例
export const api = ApiFactory.getInstance()

// 导出环境检测函数，供其他组件使用
export const isTauriApp = () => {
  return typeof window !== 'undefined' && 
         typeof (window as any).__TAURI__ !== 'undefined'
}

// 导出模式信息
export const getApiMode = (): 'tauri' | 'mock' => {
  return isTauriApp() ? 'tauri' : 'mock'
}

export default api