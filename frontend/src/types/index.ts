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

// 应用设置类型
export interface AppSettings {
  openai_api_key?: string;
  anthropic_api_key?: string;
  youtube_api_key?: string;
  default_filter_mode: 'strict' | 'balanced' | 'educational';
  default_platform: 'youtube' | 'youtube_kids';
  cache_duration_hours: number; // -1表示无限缓存
  max_video_duration_minutes: number;
  ai_provider: 'openai' | 'anthropic';
  custom_filter_prompt?: string;
  // 新增界面设置
  language?: 'zh-CN' | 'en-US';
  theme?: 'light' | 'dark';
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