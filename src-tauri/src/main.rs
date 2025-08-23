// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::{command, Manager};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

// 数据模型定义
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Video {
    pub id: String,
    pub title: String,
    pub description: Option<String>,
    pub thumbnail_url: Option<String>,
    pub duration: Option<i32>,
    pub channel_title: Option<String>,
    pub published_at: Option<String>,
    pub view_count: Option<i64>,
    pub like_count: Option<i64>,
    pub ai_score: Option<f64>,
    pub education_score: Option<f64>,
    pub safety_score: Option<f64>,
    pub age_appropriate: Option<bool>,
    pub tags: Option<String>,
    pub cached_at: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SearchRequest {
    pub query: String,
    pub platform: String,
    pub filter_mode: String,
    pub max_results: Option<i32>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SearchResponse {
    pub videos: Vec<Video>,
    pub total_found: i32,
    pub search_time: f64,
    pub ai_analysis_time: f64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct AIAnalysisRequest {
    pub video_id: String,
    pub title: String,
    pub description: Option<String>,
    pub channel_title: Option<String>,
    pub duration: Option<i32>,
    pub provider: String,
    pub api_key: String,
    pub filter_prompt: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct AIAnalysisResponse {
    pub education_score: f64,
    pub safety_score: f64,
    pub age_appropriate: bool,
    pub overall_score: f64,
    pub reasoning: String,
    pub recommended_age: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct FavoriteVideo {
    pub id: i32,
    pub video_id: String,
    pub user_notes: Option<String>,
    pub created_at: String,
    pub video: Option<Video>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct AppSettings {
    pub openai_api_key: Option<String>,
    pub anthropic_api_key: Option<String>,
    pub youtube_api_key: Option<String>,
    pub default_filter_mode: String,
    pub default_platform: String,
    pub cache_duration_hours: i32,
    pub max_video_duration_minutes: i32,
    pub ai_provider: String,
    pub custom_filter_prompt: Option<String>,
}

impl Default for AppSettings {
    fn default() -> Self {
        Self {
            openai_api_key: None,
            anthropic_api_key: None,
            youtube_api_key: None,
            default_filter_mode: "balanced".to_string(),
            default_platform: "youtube".to_string(),
            cache_duration_hours: 24,
            max_video_duration_minutes: 20,
            ai_provider: "openai".to_string(),
            custom_filter_prompt: None,
        }
    }
}

// Tauri命令实现
#[command]
async fn search_videos(request: SearchRequest) -> Result<SearchResponse, String> {
    println!("🔍 Rust: Searching for '{}'", request.query);
    
    // 返回模拟数据
    let mock_video = Video {
        id: format!("rust_mock_{}", chrono::Utc::now().timestamp()),
        title: format!("Rust后端: {} - 儿童教育视频", request.query),
        description: Some(format!("这是来自Rust后端的模拟视频，关键词：{}", request.query)),
        channel_title: Some("Rust测试频道".to_string()),
        duration: Some(300),
        view_count: Some(10000),
        published_at: Some(chrono::Utc::now().to_rfc3339()),
        thumbnail_url: Some("https://via.placeholder.com/320x180/52c41a/ffffff?text=Rust".to_string()),
        ai_score: Some(0.88),
        education_score: Some(0.92),
        safety_score: Some(0.95),
        age_appropriate: Some(true),
        cached_at: Some(chrono::Utc::now().to_rfc3339()),
        like_count: Some(500),
        tags: Some("rust,backend,mock".to_string()),
    };

    Ok(SearchResponse {
        videos: vec![mock_video],
        total_found: 1,
        search_time: 0.5,
        ai_analysis_time: 1.2,
    })
}

#[command]
async fn analyze_video(request: AIAnalysisRequest) -> Result<AIAnalysisResponse, String> {
    println!("🤖 Rust: Analyzing video '{}'", request.title);
    
    Ok(AIAnalysisResponse {
        education_score: 0.88,
        safety_score: 0.95,
        age_appropriate: true,
        overall_score: 0.90,
        reasoning: "Rust后端分析：视频内容安全，具有教育价值，适合儿童观看。".to_string(),
        recommended_age: "3-6岁".to_string(),
    })
}

#[command]
async fn save_video(video: Video) -> Result<String, String> {
    println!("💾 Rust: Saving video '{}'", video.title);
    Ok("Video saved successfully (Rust backend)".to_string())
}

#[command]
async fn delete_video(video_id: String) -> Result<String, String> {
    println!("🗑️ Rust: Deleting video '{}'", video_id);
    Ok("Video deleted successfully (Rust backend)".to_string())
}

#[command]
async fn get_favorites() -> Result<Vec<FavoriteVideo>, String> {
    println!("❤️ Rust: Loading favorites");
    Ok(vec![])
}

#[command]
async fn add_to_favorites(video_id: String, _notes: Option<String>) -> Result<String, String> {
    println!("❤️ Rust: Adding {} to favorites", video_id);
    Ok("Added to favorites (Rust backend)".to_string())
}

#[command]
async fn remove_from_favorites(favorite_id: i32) -> Result<String, String> {
    println!("🗑️ Rust: Removing favorite {}", favorite_id);
    Ok("Removed from favorites (Rust backend)".to_string())
}

#[command]
async fn get_settings() -> Result<AppSettings, String> {
    println!("⚙️ Rust: Loading settings");
    Ok(AppSettings::default())
}

#[command]
async fn save_settings(_settings: AppSettings) -> Result<String, String> {
    println!("⚙️ Rust: Saving settings");
    Ok("Settings saved (Rust backend)".to_string())
}

#[command]
async fn clear_cache() -> Result<String, String> {
    println!("🧹 Rust: Clearing cache");
    Ok("Cache cleared (Rust backend)".to_string())
}

#[command]
async fn get_search_history(_limit: Option<i32>) -> Result<Vec<HashMap<String, String>>, String> {
    println!("📚 Rust: Loading search history");
    Ok(vec![])
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            search_videos,
            analyze_video,
            save_video,
            delete_video,
            get_favorites,
            add_to_favorites,
            remove_from_favorites,
            get_settings,
            save_settings,
            clear_cache,
            get_search_history
        ])
        .setup(|app| {
            println!("🚀 Tauri app starting...");
            
            #[cfg(debug_assertions)]
            {
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.open_devtools();
                }
            }
            
            println!("✅ Tauri app setup completed");
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}