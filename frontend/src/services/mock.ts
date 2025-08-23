// Mock API实现 - 用于前端独立开发
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

/**
 * Mock API服务实现
 * 提供高质量的模拟数据，支持前端独立开发和测试
 */
export class MockApiService implements ApiService {
  private favorites: FavoriteVideo[] = []
  private settings: AppSettings = this.getDefaultSettings()
  private searchHistory: Record<string, string>[] = []
  
  constructor() {
    console.info('🎭 Mock API Service initialized - Frontend development mode')
  }

  // 搜索视频
  async searchVideos(request: SearchRequest): Promise<SearchResponse> {
    console.info(`🔍 Mock: Searching for "${request.query}" with ${request.filter_mode} mode`)
    
    // 模拟网络延迟
    await this.delay(800 + Math.random() * 700)
    
    const videos = this.generateMockVideos(request.query, request.max_results || 10)
    
    // 根据筛选模式调整结果
    const filteredVideos = this.applyFilterMode(videos, request.filter_mode)
    
    // 记录搜索历史
    this.addToSearchHistory(request)
    
    return {
      videos: filteredVideos,
      total_found: filteredVideos.length,
      search_time: 0.5 + Math.random() * 0.8,
      ai_analysis_time: 1.2 + Math.random() * 1.5
    }
  }

  // AI分析视频
  async analyzeVideo(request: AIAnalysisRequest): Promise<AIAnalysisResponse> {
    console.info(`🤖 Mock: Analyzing video "${request.title}"`)
    
    // 模拟AI分析延迟
    await this.delay(1000 + Math.random() * 1500)
    
    // 基于标题生成智能评分
    const scores = this.generateIntelligentScores(request.title, request.description)
    
    return {
      education_score: scores.education,
      safety_score: scores.safety,
      age_appropriate: scores.ageAppropriate,
      overall_score: scores.overall,
      reasoning: this.generateReasoning(request.title, scores),
      recommended_age: this.getRecommendedAge(scores)
    }
  }

  // 保存视频
  async saveVideo(video: Video): Promise<string> {
    console.info(`💾 Mock: Saving video "${video.title}"`)
    await this.delay(200)
    return `Mock: Video ${video.id} saved successfully`
  }

  // 获取收藏列表
  async getFavorites(): Promise<FavoriteVideo[]> {
    console.info('❤️ Mock: Loading favorites')
    await this.delay(300)
    return [...this.favorites]
  }

  // 添加到收藏
  async addToFavorites(videoId: string, notes?: string): Promise<string> {
    console.info(`❤️ Mock: Adding video ${videoId} to favorites`)
    await this.delay(400)
    
    const newFavorite: FavoriteVideo = {
      id: Date.now(),
      video_id: videoId,
      user_notes: notes,
      created_at: new Date().toISOString(),
      video: this.findVideoById(videoId)
    }
    
    this.favorites.push(newFavorite)
    return 'Mock: Added to favorites successfully'
  }

  // 从收藏移除
  async removeFromFavorites(favoriteId: number): Promise<string> {
    console.info(`🗑️ Mock: Removing favorite ${favoriteId}`)
    await this.delay(300)
    
    this.favorites = this.favorites.filter(fav => fav.id !== favoriteId)
    return 'Mock: Removed from favorites successfully'
  }

  // 获取设置
  async getSettings(): Promise<AppSettings> {
    console.info('⚙️ Mock: Loading settings')
    await this.delay(200)
    return { ...this.settings }
  }

  // 保存设置
  async saveSettings(settings: AppSettings): Promise<string> {
    console.info('⚙️ Mock: Saving settings')
    await this.delay(500)
    
    this.settings = { ...settings }
    return 'Mock: Settings saved successfully'
  }

  // 清除缓存
  async clearCache(): Promise<string> {
    console.info('🧹 Mock: Clearing cache')
    await this.delay(300)
    return 'Mock: Cache cleared successfully'
  }

  // 获取搜索历史
  async getSearchHistory(limit?: number): Promise<Record<string, string>[]> {
    console.info('📚 Mock: Loading search history')
    await this.delay(200)
    
    const history = [...this.searchHistory]
    return limit ? history.slice(0, limit) : history
  }

  // === 私有辅助方法 ===

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  // 删除视频（新增功能）
  async deleteVideo(videoId: string): Promise<string> {
    console.info(`🗑️ Mock: Deleting video ${videoId}`)
    await this.delay(300)
    
    // 从模拟的搜索结果中移除（实际应用中会从数据库删除）
    return 'Video deleted successfully (Mock mode)'
  }

  private getDefaultSettings(): AppSettings {
    return {
      default_filter_mode: 'balanced',
      default_platform: 'youtube',
      cache_duration_hours: -1, // 默认无限缓存
      max_video_duration_minutes: 20,
      ai_provider: 'openai',
      custom_filter_prompt: '',
      language: 'zh-CN',
      theme: 'light'
    }
  }

  private generateMockVideos(query: string, count: number): Video[] {
    const videoTemplates = [
      {
        titlePattern: '儿童数学启蒙 - {query}',
        channel: '儿童教育频道',
        description: '通过有趣的动画和游戏，帮助孩子学习{query}相关的数学知识',
        duration: [300, 600], // 5-10分钟
        color: '#52c41a'
      },
      {
        titlePattern: '英语学习 - {query} ABC',
        channel: '宝宝英语',
        description: '生动有趣的英语教学，让孩子轻松掌握{query}相关的英语知识',
        duration: [180, 480], // 3-8分钟
        color: '#1890ff'
      },
      {
        titlePattern: '科学实验 - {query}探索',
        channel: '科学启蒙',
        description: '简单安全的科学实验，探索{query}背后的科学原理',
        duration: [240, 720], // 4-12分钟
        color: '#faad14'
      },
      {
        titlePattern: '艺术创作 - {query}手工',
        channel: '创意工坊',
        description: '培养孩子创造力，通过{query}主题的手工制作学习艺术',
        duration: [360, 900], // 6-15分钟
        color: '#eb2f96'
      },
      {
        titlePattern: '音乐律动 - {query}儿歌',
        channel: '音乐小屋',
        description: '欢快的儿歌和律动，让孩子在{query}主题中感受音乐的魅力',
        duration: [120, 300], // 2-5分钟
        color: '#722ed1'
      }
    ]

    const videos: Video[] = []
    
    for (let i = 0; i < count; i++) {
      const template = videoTemplates[i % videoTemplates.length]
      const duration = template.duration[0] + Math.random() * (template.duration[1] - template.duration[0])
      
      const video: Video = {
        id: `mock_${Date.now()}_${i}`,
        title: template.titlePattern.replace('{query}', query),
        description: template.description.replace(/{query}/g, query),
        channel_title: template.channel,
        duration: Math.round(duration),
        view_count: Math.round(5000 + Math.random() * 50000),
        like_count: Math.round(100 + Math.random() * 2000),
        published_at: this.getRandomDate(),
        thumbnail_url: `https://via.placeholder.com/320x180/${template.color.slice(1)}/ffffff?text=${encodeURIComponent(query)}`,
        cached_at: new Date().toISOString(),
        // 会在AI分析后填入
        ai_score: undefined,
        education_score: undefined,
        safety_score: undefined,
        age_appropriate: undefined
      }
      
      videos.push(video)
    }

    return videos
  }

  private applyFilterMode(videos: Video[], filterMode: string): Video[] {
    // 对每个视频进行AI分析评分
    const scoredVideos = videos.map(video => {
      const scores = this.generateIntelligentScores(video.title, video.description)
      return {
        ...video,
        ai_score: scores.overall,
        education_score: scores.education,
        safety_score: scores.safety,
        age_appropriate: scores.ageAppropriate
      }
    })

    // 根据筛选模式过滤和排序
    let filtered = scoredVideos.filter(video => {
      switch (filterMode) {
        case 'strict':
          return video.safety_score! >= 0.9 && video.age_appropriate
        case 'educational':
          return video.education_score! >= 0.75
        case 'balanced':
        default:
          return video.ai_score! >= 0.6
      }
    })

    // 排序
    filtered.sort((a, b) => {
      switch (filterMode) {
        case 'strict':
          return (b.safety_score! - a.safety_score!) || (b.ai_score! - a.ai_score!)
        case 'educational':
          return (b.education_score! - a.education_score!) || (b.ai_score! - a.ai_score!)
        case 'balanced':
        default:
          return b.ai_score! - a.ai_score!
      }
    })

    return filtered
  }

  private generateIntelligentScores(title: string, description?: string) {
    const content = (title + ' ' + (description || '')).toLowerCase()
    
    // 教育价值评分
    let educationScore = 0.5
    if (content.includes('数学') || content.includes('math')) educationScore += 0.3
    if (content.includes('科学') || content.includes('science')) educationScore += 0.25
    if (content.includes('英语') || content.includes('english')) educationScore += 0.2
    if (content.includes('学习') || content.includes('learn')) educationScore += 0.1
    if (content.includes('启蒙') || content.includes('教育')) educationScore += 0.15
    
    // 安全性评分
    let safetyScore = 0.85
    if (content.includes('暴力') || content.includes('恐怖')) safetyScore -= 0.4
    if (content.includes('儿童') || content.includes('孩子')) safetyScore += 0.1
    if (content.includes('安全') || content.includes('healthy')) safetyScore += 0.05
    
    // 年龄适宜性
    const ageAppropriate = safetyScore >= 0.7 && !content.includes('成人')
    
    // 添加随机变化
    educationScore = Math.min(1, educationScore + (Math.random() - 0.5) * 0.2)
    safetyScore = Math.min(1, safetyScore + (Math.random() - 0.5) * 0.1)
    
    // 综合评分
    const overallScore = (educationScore * 0.4 + safetyScore * 0.4 + (ageAppropriate ? 0.2 : 0))

    return {
      education: Math.max(0, educationScore),
      safety: Math.max(0, safetyScore),
      ageAppropriate,
      overall: Math.max(0, overallScore)
    }
  }

  private generateReasoning(_title: string, scores: any): string {
    const reasons = []
    
    if (scores.education >= 0.8) {
      reasons.push('教育价值很高，有助于儿童学习和认知发展')
    } else if (scores.education >= 0.6) {
      reasons.push('具有一定的教育价值')
    }
    
    if (scores.safety >= 0.9) {
      reasons.push('内容非常安全，适合儿童观看')
    } else if (scores.safety >= 0.7) {
      reasons.push('内容相对安全')
    }
    
    if (scores.ageAppropriate) {
      reasons.push('年龄适宜性良好')
    }
    
    const baseReason = reasons.length > 0 ? reasons.join('，') : '内容质量一般'
    return `${baseReason}。（Mock模式模拟分析）`
  }

  private getRecommendedAge(scores: any): string {
    if (scores.overall >= 0.8 && scores.safety >= 0.9) {
      return '3-6岁'
    } else if (scores.overall >= 0.6) {
      return '4-7岁'
    } else {
      return '需要家长判断'
    }
  }

  private getRandomDate(): string {
    const days = Math.floor(Math.random() * 365)
    const date = new Date()
    date.setDate(date.getDate() - days)
    return date.toISOString().split('T')[0]
  }

  private findVideoById(videoId: string): Video | undefined {
    // 在实际应用中，这里会从缓存中查找
    // Mock模式下返回一个简单的视频对象
    return {
      id: videoId,
      title: 'Mock视频标题',
      description: '模拟视频描述',
      channel_title: '模拟频道',
      duration: 300,
      view_count: 10000,
      published_at: new Date().toISOString().split('T')[0],
      cached_at: new Date().toISOString()
    }
  }

  private addToSearchHistory(request: SearchRequest): void {
    const historyItem = {
      id: Date.now().toString(),
      query: request.query,
      platform: request.platform,
      filter_mode: request.filter_mode,
      results_count: (request.max_results || 10).toString(),
      created_at: new Date().toISOString()
    }
    
    this.searchHistory.unshift(historyItem)
    
    // 保持历史记录在合理数量内
    if (this.searchHistory.length > 50) {
      this.searchHistory = this.searchHistory.slice(0, 50)
    }
  }
}