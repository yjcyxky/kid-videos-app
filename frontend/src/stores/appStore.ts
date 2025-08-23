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
  deleteVideo: (videoId: string) => Promise<void>; // 新增删除视频功能
  loadFavorites: () => Promise<void>;
  addToFavorites: (videoId: string, notes?: string) => Promise<void>;
  removeFromFavorites: (favoriteId: number) => Promise<void>;
  loadSettings: () => Promise<void>;
  saveSettings: (settings: AppSettings) => Promise<void>;
  clearCache: () => Promise<void>;
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
  theme: 'light'
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
            set({ 
              searchResults: response.videos,
              loading: { ...get().loading, searching: false }
            });
            
            // 保存搜索历史
            await get().loadSearchHistory();
            
            return response;
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
            await api.clearCache();
            set({ searchResults: [] });
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
        }),
      }
    ),
    {
      name: 'kid-videos-store',
    }
  )
);