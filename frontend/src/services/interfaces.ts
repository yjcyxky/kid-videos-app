// API服务接口定义
import type { 
  SearchRequest, 
  SearchResponse, 
  FavoriteVideo, 
  AppSettings,
  AIAnalysisRequest,
  AIAnalysisResponse,
  Video 
} from '@/types'

/**
 * API服务接口定义
 * 这个接口可以有多种实现：Tauri实现、Mock实现等
 */
export interface ApiService {
  // 视频相关
  searchVideos(request: SearchRequest): Promise<SearchResponse>
  analyzeVideo(request: AIAnalysisRequest): Promise<AIAnalysisResponse>
  saveVideo(video: Video): Promise<string>
  deleteVideo(videoId: string): Promise<string>
  getCachedVideos(): Promise<Video[]> // 新增：获取所有缓存视频

  // 收藏相关
  getFavorites(): Promise<FavoriteVideo[]>
  addToFavorites(videoId: string, notes?: string): Promise<string>
  removeFromFavorites(favoriteId: number): Promise<string>

  // 设置相关
  getSettings(): Promise<AppSettings>
  saveSettings(settings: AppSettings): Promise<string>

  // 缓存相关
  clearCache(): Promise<string>
  getSearchHistory(limit?: number): Promise<Record<string, string>[]>
}