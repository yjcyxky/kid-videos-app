import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { 
  Video, 
  FavoriteVideo, 
  AppSettings, 
  SearchHistory, 
  LoadingState,
  SearchRequest,
  SearchResponse 
} from '@/types';
import api from '@/services/api';

interface AppStore {
  // 状态
  currentSearch: string;
  searchResults: Video[];
  favorites: FavoriteVideo[];
  settings: AppSettings;
  loading: LoadingState;
  searchHistory: SearchHistory[];

  // Actions
  setCurrentSearch: (query: string) => void;
  searchVideos: (request: SearchRequest) => Promise<SearchResponse>;
  deleteVideo: (videoId: string) => Promise<void>;
  loadCachedVideos: () => Promise<void>; // 新增：从数据库加载缓存视频
  loadFavorites: () => Promise<void>;
  addToFavorites: (videoId: string, notes?: string) => Promise<void>;
  removeFromFavorites: (favoriteId: number) => Promise<void>;
  loadSettings: () => Promise<void>;
  saveSettings: (settings: AppSettings) => Promise<void>;
  clearCache: () => Promise<void>; // 清空数据库缓存和搜索结果
  loadSearchHistory: () => Promise<void>;
  setLoading: (key: keyof LoadingState, value: boolean) => void;
}

const defaultSettings: AppSettings = {
  default_filter_mode: 'balanced',
  default_platform: 'youtube',
  cache_duration_hours: -1, // 默认无限缓存
  max_video_duration_minutes: 20,
  ai_provider: 'openai',
  language: 'zh-CN',
  theme: 'light',
  child_age: '3-6',
  video_count: 10,
  default_platforms: ['youtube'],
  search_language: 'en',
  min_duration: 0,
  max_duration: 0,
  enable_alarm: false,
  default_alarm_time: 600,
  countdown_seconds: 10,
  alarm_interval: 10,
  enable_alarm_sound: false,
  enable_visual_alarm: false,
  enable_vibration_alarm: false,
  alarm_message: 'Time to close the app!',
  enable_notifications: true,
  enable_debug_mode: false,
  enable_usage_stats: true,
  enable_filter_stats: true,
};

const defaultLoading: LoadingState = {
  searching: false,
  analyzing: false,
  saving: false,
};

export const useAppStore = create<AppStore>()(
  devtools(
    persist(
      (set, get) => ({
        // 初始状态
        currentSearch: '',
        searchResults: [],
        favorites: [],
        settings: defaultSettings,
        loading: defaultLoading,
        searchHistory: [],

        // Actions
        setCurrentSearch: (query: string) => {
          set({ currentSearch: query });
        },

        searchVideos: async (request: SearchRequest): Promise<SearchResponse> => {
          set(state => ({
            loading: { ...state.loading, searching: true }
          }));

          try {
            const response = await api.searchVideos(request);

            // 累加搜索结果，并去重
            const existingResults = get().searchResults;
            const existingIds = new Set(existingResults.map(v => v.id));
            const newVideos = response.videos.filter(v => !existingIds.has(v.id));

            console.log(`📊 Search completed: ${response.videos.length} returned, ${newVideos.length} new videos`);

            set({
              searchResults: [...existingResults, ...newVideos], // 累加新结果
              loading: { ...get().loading, searching: false }
            });

            // 保存搜索历史
            await get().loadSearchHistory();

            // 返回带有新增数量的响应
            return {
              ...response,
              videos: newVideos, // 返回新增的视频用于提示
              total_found: newVideos.length
            };
          } catch (error) {
            set(state => ({
              loading: { ...state.loading, searching: false }
            }));
            throw error;
          }
        },

        deleteVideo: async (videoId: string) => {
          try {
            await api.deleteVideo(videoId);

            // 从搜索结果中移除
            set(state => ({
              searchResults: state.searchResults.filter(video => video.id !== videoId)
            }));
          } catch (error) {
            console.error('Failed to delete video:', error);
            throw error;
          }
        },

        loadCachedVideos: async () => {
          try {
            console.log('📚 Loading cached videos from database...');
            const videos = await api.getCachedVideos();
            console.log(`✅ Loaded ${videos.length} videos from database`);
            set({ searchResults: videos });
          } catch (error) {
            console.error('Failed to load cached videos:', error);
          }
        },

        loadFavorites: async () => {
          try {
            const favorites = await api.getFavorites();
            set({ favorites });
          } catch (error) {
            console.error('Failed to load favorites:', error);
          }
        },

        addToFavorites: async (videoId: string, notes?: string) => {
          set(state => ({ 
            loading: { ...state.loading, saving: true }
          }));

          try {
            await api.addToFavorites(videoId, notes);
            await get().loadFavorites();
          } catch (error) {
            console.error('Failed to add to favorites:', error);
            throw error;
          } finally {
            set(state => ({ 
              loading: { ...state.loading, saving: false }
            }));
          }
        },

        removeFromFavorites: async (favoriteId: number) => {
          try {
            await api.removeFromFavorites(favoriteId);
            await get().loadFavorites();
          } catch (error) {
            console.error('Failed to remove from favorites:', error);
            throw error;
          }
        },

        loadSettings: async () => {
          try {
            const settings = await api.getSettings();
            set({ settings });
          } catch (error) {
            console.error('Failed to load settings:', error);
            // 使用默认设置
            set({ settings: defaultSettings });
          }
        },

        saveSettings: async (settings: AppSettings) => {
          set(state => ({ 
            loading: { ...state.loading, saving: true }
          }));

          try {
            await api.saveSettings(settings);
            set({ settings });
          } catch (error) {
            console.error('Failed to save settings:', error);
            throw error;
          } finally {
            set(state => ({ 
              loading: { ...state.loading, saving: false }
            }));
          }
        },

        clearCache: async () => {
          try {
            console.log('🗑️ Clearing database cache and search results...');
            await api.clearCache();
            // 同时清空前端显示的搜索结果
            set({ searchResults: [] });
            console.log('✅ Cache and results cleared');
          } catch (error) {
            console.error('Failed to clear cache:', error);
            throw error;
          }
        },

        loadSearchHistory: async () => {
          try {
            const history = await api.getSearchHistory(20);
            set({ searchHistory: history.map(item => ({
              id: parseInt(item.id || '0'),
              query: item.query || '',
              platform: item.platform || 'youtube',
              filter_mode: item.filter_mode || 'balanced',
              results_count: parseInt(item.results_count || '0'),
              created_at: item.created_at || new Date().toISOString(),
            })) });
          } catch (error) {
            console.error('Failed to load search history:', error);
          }
        },

        setLoading: (key: keyof LoadingState, value: boolean) => {
          set(state => ({
            loading: { ...state.loading, [key]: value }
          }));
        },
      }),
      {
        name: 'kid-videos-store',
        partialize: (state) => ({
          settings: state.settings,
          favorites: state.favorites,
          searchHistory: state.searchHistory,
          // 不再持久化 searchResults 到 localStorage，改为从数据库加载
        }),
      }
    ),
    {
      name: 'kid-videos-store',
    }
  )
);