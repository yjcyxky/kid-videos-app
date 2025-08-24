// 视频相关类型定义
export interface Video {
  id: string;
  title: string;
  description?: string;
  thumbnail_url?: string;
  duration?: number; // 秒
  channel_title?: string;
  published_at?: string;
  view_count?: number;
  like_count?: number;
  ai_score?: number; // 0-1
  education_score?: number; // 0-1
  safety_score?: number; // 0-1
  age_appropriate?: boolean;
  tags?: string;
  cached_at?: string;
  subtitles?: string;
}

// 搜索相关类型
export interface SearchRequest {
  query: string;
  platform: 'youtube' | 'youtube_kids';
  filter_mode: 'strict' | 'balanced' | 'educational';
  max_results?: number;
}

export interface SearchResponse {
  videos: Video[];
  total_found: number;
  search_time: number;
  ai_analysis_time: number;
}

// AI分析相关类型
export interface AIAnalysisRequest {
  video_id: string;
  title: string;
  description?: string;
  channel_title?: string;
  duration?: number;
  provider: 'openai' | 'anthropic';
  api_key: string;
  filter_prompt?: string;
  subtitles?: string;
}

export interface AIAnalysisResponse {
  education_score: number;
  safety_score: number;
  age_appropriate: boolean;
  overall_score: number;
  reasoning: string;
  recommended_age: string;
}

// 收藏相关类型
export interface FavoriteVideo {
  id: number;
  video_id: string;
  user_notes?: string;
  created_at: string;
  video?: Video;
}

// 应用设置类型 - 与后端保持一致
export interface AppSettings {
  // API配置
  openai_api_key?: string;
  anthropic_api_key?: string;
  youtube_api_key?: string;
  ai_provider: 'openai' | 'anthropic';
  
  // 过滤条件配置
  child_age: '2-4' | '3-6' | '4-8' | '6-10' | '8-12';
  custom_filter_prompt?: string;
  video_count: number; // 每次筛选视频数量
  cache_duration_hours: number; // 缓存有效期（小时）
  
  // 搜索配置
  default_platforms: string[]; // ["youtube", "youtube_kids"]
  search_language: 'zh' | 'en' | 'both';
  min_duration: number; // 最短时长（分钟）
  max_duration: number; // 最长时长（分钟）
  
  // 闹钟配置
  enable_alarm: boolean;
  default_alarm_time: number; // 默认闹钟时间（秒）
  countdown_seconds: number; // 倒计时秒数
  alarm_interval: number; // 闹钟间隔时间（分钟）
  enable_alarm_sound: boolean;
  enable_visual_alarm: boolean;
  enable_vibration_alarm: boolean;
  alarm_message: string; // 自定义闹钟消息
  
  // 高级设置
  enable_notifications: boolean;
  enable_debug_mode: boolean;
  enable_usage_stats: boolean;
  enable_filter_stats: boolean;
  theme: 'auto' | 'light' | 'dark';
  language: 'zh-CN' | 'en-US';
  
  // 兼容性字段
  default_filter_mode: 'strict' | 'balanced' | 'educational';
  default_platform: 'youtube' | 'youtube_kids';
  max_video_duration_minutes: number;
}

// 预设配置类型
export interface FilterPreset {
  key: string;
  name: string;
  description: string;
  emoji: string;
  age_range: string;
  prompt: string;
  video_count: number;
  filter_mode: 'strict' | 'balanced' | 'educational';
}

// 搜索历史类型
export interface SearchHistory {
  id: number;
  query: string;
  platform: string;
  filter_mode: string;
  results_count: number;
  created_at: string;
}

// UI状态类型
export interface LoadingState {
  searching: boolean;
  analyzing: boolean;
  saving: boolean;
}

export interface AppState {
  currentSearch: string;
  searchResults: Video[];
  favorites: FavoriteVideo[];
  settings: AppSettings;
  loading: LoadingState;
  searchHistory: SearchHistory[];
}

// 组件Props类型
export interface VideoCardProps {
  video: Video;
  showFavoriteButton?: boolean;
  onFavorite?: (videoId: string) => void;
  onPlay?: (videoId: string) => void;
  className?: string;
}

export interface SearchFormProps {
  onSearch: (request: SearchRequest) => void;
  loading: boolean;
  initialValues?: Partial<SearchRequest>;
}

export interface SettingsFormProps {
  settings: AppSettings;
  onSave: (settings: AppSettings) => void;
  loading: boolean;
}

// 筛选模式配置
export interface FilterModeConfig {
  key: 'strict' | 'balanced' | 'educational';
  name: string;
  description: string;
  color: string;
  icon: string;
  ageRange: string;
  features: string[];
}

// API错误类型
export interface APIError {
  code: string;
  message: string;
  details?: any;
}

// Tauri相关类型
export interface TauriCommand<T = any> {
  command: string;
  args?: T;
}

// 主题配置类型
export interface ThemeConfig {
  primaryColor: string;
  backgroundColor: string;
  textColor: string;
  borderRadius: number;
  fontSize: number;
  fontFamily: string;
}

// 导出所有类型的联合类型
export type FilterMode = 'strict' | 'balanced' | 'educational';
export type Platform = 'youtube' | 'youtube_kids';
export type AIProvider = 'openai' | 'anthropic';