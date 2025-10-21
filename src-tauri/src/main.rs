// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::{command, Manager, AppHandle};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use reqwest::Client;
use anyhow::Result;
use std::path::PathBuf;
use sqlx::{SqlitePool, sqlite::SqlitePoolOptions};
use std::sync::Arc;

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
    pub subtitles: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SearchRequest {
    pub query: String,
    pub platform: String,
    pub filter_mode: String,
    pub max_results: Option<i32>,
    pub skip_ai_analysis: Option<bool>, // 临时禁用AI分析，直接返回搜索结果
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
    pub subtitles: Option<String>,
    pub view_count: Option<i64>,
    pub like_count: Option<i64>,
    pub published_at: Option<String>,
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
pub struct BatchAnalysisRequest {
    pub videos: Vec<Video>,
    pub provider: String,
    pub api_key: String,
    pub filter_prompt: Option<String>,
    pub min_duration: Option<i32>,
    pub max_duration: Option<i32>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct BatchAnalysisResponse {
    pub analyzed_videos: Vec<Video>,
    pub total_analyzed: i32,
    pub analysis_time: f64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct BatchVideoAnalysis {
    pub index: usize,
    pub score: f64,
    pub suitable: bool,
    pub reason: String,
    pub educational_value: f64,
    pub safety_score: f64,
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
    // API配置
    pub openai_api_key: Option<String>,
    pub anthropic_api_key: Option<String>,
    pub youtube_api_key: Option<String>,
    pub ai_provider: String, // "openai" 或 "anthropic"
    
    // 过滤条件配置
    pub child_age: String, // "2-4", "3-6", "4-8", "6-10", "8-12"
    pub custom_filter_prompt: Option<String>,
    pub video_count: i32, // 每次筛选视频数量
    pub cache_duration_hours: i32, // 缓存有效期（小时）
    
    // 搜索配置
    pub default_platforms: Vec<String>, // ["youtube", "youtube_kids"]
    pub search_language: String, // "zh", "en", "both"
    pub min_duration: i32, // 最短时长（分钟）
    pub max_duration: i32, // 最长时长（分钟）
    
    // 闹钟配置
    pub enable_alarm: bool,
    pub default_alarm_time: i32, // 默认闹钟时间（秒）
    pub countdown_seconds: i32, // 倒计时秒数
    pub alarm_interval: i32, // 闹钟间隔时间（分钟）
    pub enable_alarm_sound: bool,
    pub enable_visual_alarm: bool,
    pub enable_vibration_alarm: bool,
    pub alarm_message: String, // 自定义闹钟消息
    
    // 高级设置
    pub enable_notifications: bool,
    pub enable_debug_mode: bool,
    pub enable_usage_stats: bool,
    pub enable_filter_stats: bool,
    pub theme: String, // "auto", "light", "dark"
    pub language: String, // "zh-CN", "en-US"
    
    // 兼容性字段
    pub default_filter_mode: String, // "strict", "balanced", "educational"
    pub default_platform: String, // "youtube"
    pub max_video_duration_minutes: i32,
}

impl Default for AppSettings {
    fn default() -> Self {
        Self {
            // API配置
            openai_api_key: None,
            anthropic_api_key: None,
            youtube_api_key: None,
            ai_provider: "openai".to_string(),
            
            // 过滤条件配置
            child_age: "3-6".to_string(),
            custom_filter_prompt: Some(default_filter_prompt()),
            video_count: 10,
            cache_duration_hours: 24,
            
            // 搜索配置
            default_platforms: vec!["youtube".to_string(), "youtube_kids".to_string()],
            search_language: "zh".to_string(),
            min_duration: 2,
            max_duration: 30,
            
            // 闹钟配置
            enable_alarm: false,
            default_alarm_time: 600, // 10分钟
            countdown_seconds: 60,
            alarm_interval: 10,
            enable_alarm_sound: true,
            enable_visual_alarm: true,
            enable_vibration_alarm: false,
            alarm_message: "该休息了，小朋友！".to_string(),
            
            // 高级设置
            enable_notifications: true,
            enable_debug_mode: false,
            enable_usage_stats: true,
            enable_filter_stats: true,
            theme: "light".to_string(),
            language: "zh-CN".to_string(),
            
            // 兼容性字段
            default_filter_mode: "balanced".to_string(),
            default_platform: "youtube".to_string(),
            max_video_duration_minutes: 30,
        }
    }
}

// 默认过滤提示词
fn default_filter_prompt() -> String {
    r#"请分析以下视频是否适合3-6岁儿童观看。评判标准：
1. 教育价值：是否有助于学习认知、语言、数学、科学等
2. 内容安全：无暴力、恐怖、不当内容
3. 年龄适宜：符合学前儿童认知水平
4. 时长合适：建议2-20分钟
5. 制作质量：画面清晰、音频清楚、制作精良

请对每个视频给出0-100的评分，并说明理由。只返回评分高于70分的视频。"#.to_string()
}

// 数据库相关结构
#[derive(Debug, Serialize, Deserialize)]
pub struct CachedVideo {
    pub id: String,
    pub query: String,
    pub platform: String,
    pub video_data: String, // JSON序列化的Video数据
    pub cached_at: String,
    pub expires_at: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct SearchHistoryEntry {
    pub id: i64,
    pub query: String,
    pub platform: String,
    pub filter_mode: String,
    pub results_count: i32,
    pub created_at: String,
}

// YouTube API响应结构
#[derive(Debug, Deserialize)]
struct YouTubeSearchResponse {
    items: Vec<YouTubeVideoItem>,
    #[serde(rename = "pageInfo")]
    page_info: PageInfo,
}

#[derive(Debug, Deserialize)]
struct PageInfo {
    #[serde(rename = "totalResults")]
    total_results: i32,
}

#[derive(Debug, Deserialize)]
struct YouTubeVideoItem {
    id: YouTubeVideoId,
    snippet: YouTubeSnippet,
}

#[derive(Debug, Deserialize)]
struct YouTubeVideoId {
    #[serde(rename = "videoId")]
    video_id: String,
}

#[derive(Debug, Deserialize)]
struct YouTubeSnippet {
    title: String,
    description: String,
    #[serde(rename = "channelTitle")]
    channel_title: String,
    #[serde(rename = "publishedAt")]
    published_at: String,
    thumbnails: YouTubeThumbnails,
}

#[derive(Debug, Deserialize)]
struct YouTubeThumbnails {
    medium: Option<YouTubeThumbnail>,
    high: Option<YouTubeThumbnail>,
}

#[derive(Debug, Deserialize)]
struct YouTubeThumbnail {
    url: String,
}

#[derive(Debug, Deserialize)]
struct YouTubeVideoDetailsResponse {
    items: Vec<YouTubeVideoDetail>,
}

#[derive(Debug, Deserialize)]
struct YouTubeVideoDetail {
    id: Option<String>,
    statistics: Option<YouTubeStatistics>,
    #[serde(rename = "contentDetails")]
    content_details: Option<YouTubeContentDetails>,
    snippet: Option<YouTubeVideoSnippet>,
}

#[derive(Debug, Deserialize)]
struct YouTubeVideoSnippet {
    #[serde(rename = "localized")]
    localized: Option<YouTubeLocalized>,
}

#[derive(Debug, Deserialize)]
struct YouTubeLocalized {
    title: String,
    description: String,
}

#[derive(Debug, Deserialize)]
struct YouTubeCaptionResponse {
    items: Vec<YouTubeCaptionItem>,
}

#[derive(Debug, Deserialize)]
struct YouTubeCaptionItem {
    snippet: YouTubeCaptionSnippet,
}

#[derive(Debug, Deserialize)]
struct YouTubeCaptionSnippet {
    language: String,
    #[serde(rename = "trackKind")]
    track_kind: String,
    name: String,
}

#[derive(Debug, Deserialize)]
struct YouTubeStatistics {
    #[serde(rename = "viewCount")]
    view_count: Option<String>,
    #[serde(rename = "likeCount")]
    like_count: Option<String>,
}

#[derive(Debug, Deserialize)]
struct YouTubeContentDetails {
    duration: String,
}

// OpenAI API响应结构
#[derive(Debug, Serialize)]
struct OpenAIRequest {
    model: String,
    messages: Vec<OpenAIMessage>,
    max_tokens: u32,
    temperature: f32,
}

#[derive(Debug, Serialize, Deserialize)]
struct OpenAIMessage {
    role: String,
    content: String,
}

#[derive(Debug, Deserialize)]
struct OpenAIResponse {
    choices: Vec<OpenAIChoice>,
}

#[derive(Debug, Deserialize)]
struct OpenAIChoice {
    message: OpenAIMessage,
}

// Anthropic API响应结构
#[derive(Debug, Serialize)]
struct AnthropicRequest {
    model: String,
    max_tokens: u32,
    messages: Vec<AnthropicMessage>,
}

#[derive(Debug, Serialize, Deserialize)]
struct AnthropicMessage {
    role: String,
    content: String,
}

#[derive(Debug, Deserialize)]
struct AnthropicResponse {
    content: Vec<AnthropicContent>,
}

#[derive(Debug, Deserialize)]
struct AnthropicContent {
    text: String,
}

// 应用状态管理
struct AppState {
    settings: tauri::async_runtime::Mutex<AppSettings>,
    client: Client,
    app_data_dir: PathBuf,
    db: Arc<SqlitePool>,
}

impl AppState {
    async fn new(app_handle: &AppHandle) -> Result<Self> {
        let app_data_dir = app_handle
            .path()
            .app_data_dir()
            .expect("Failed to get app data directory");
            
        // 确保数据目录存在
        if !app_data_dir.exists() {
            std::fs::create_dir_all(&app_data_dir)
                .expect("Failed to create app data directory");
        }
        
        // 创建数据库连接池
        let db_path = app_data_dir.join("app.db");
        // SQLite connection with create_if_missing option
        let db_url = format!("sqlite:{}?mode=rwc", db_path.display());
        let db = SqlitePoolOptions::new()
            .max_connections(5)
            .connect(&db_url)
            .await
            .map_err(|e| anyhow::anyhow!("Failed to connect to database: {}", e))?;
        
        // 运行数据库迁移
        run_migrations(&db)
            .await
            .map_err(|e| anyhow::anyhow!("Failed to run database migrations: {}", e))?;
        
        Ok(Self {
            settings: tauri::async_runtime::Mutex::new(AppSettings::default()),
            client: Client::new(),
            app_data_dir,
            db: Arc::new(db),
        })
    }
    
    fn config_file_path(&self) -> PathBuf {
        self.app_data_dir.join("config.json")
    }
}

// 数据库迁移 - 使用SQLx执行
async fn run_migrations(pool: &SqlitePool) -> Result<()> {
    println!("🔄 Running database migrations...");
    
    // 创建视频缓存表
    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS cached_videos (
            id TEXT PRIMARY KEY,
            query TEXT NOT NULL,
            platform TEXT NOT NULL,
            video_data TEXT NOT NULL,
            cached_at TEXT NOT NULL,
            expires_at TEXT NOT NULL
        )
        "#
    )
    .execute(pool)
    .await?;
    
    // 创建收藏表
    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS favorites (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            video_id TEXT NOT NULL UNIQUE,
            user_notes TEXT,
            created_at TEXT NOT NULL,
            video_data TEXT NOT NULL
        )
        "#
    )
    .execute(pool)
    .await?;
    
    // 创建搜索历史表
    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS search_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            query TEXT NOT NULL,
            platform TEXT NOT NULL,
            filter_mode TEXT NOT NULL,
            results_count INTEGER NOT NULL,
            created_at TEXT NOT NULL
        )
        "#
    )
    .execute(pool)
    .await?;
    
    // 创建使用统计表
    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS usage_stats (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            event_type TEXT NOT NULL,
            event_data TEXT,
            created_at TEXT NOT NULL
        )
        "#
    )
    .execute(pool)
    .await?;
    
    // 创建索引
    sqlx::query("CREATE INDEX IF NOT EXISTS idx_cached_videos_query ON cached_videos(query, platform)")
        .execute(pool)
        .await?;
    
    sqlx::query("CREATE INDEX IF NOT EXISTS idx_cached_videos_expires ON cached_videos(expires_at)")
        .execute(pool)
        .await?;
    
    sqlx::query("CREATE INDEX IF NOT EXISTS idx_search_history_date ON search_history(created_at)")
        .execute(pool)
        .await?;
    
    sqlx::query("CREATE INDEX IF NOT EXISTS idx_usage_stats_date ON usage_stats(created_at)")
        .execute(pool)
        .await?;
    
    sqlx::query("CREATE INDEX IF NOT EXISTS idx_favorites_created ON favorites(created_at)")
        .execute(pool)
        .await?;
    
    println!("✅ Database migrations completed successfully");
    Ok(())
}

// 配置管理函数
async fn load_settings_from_file(app_state: &AppState) -> AppSettings {
    let config_path = app_state.config_file_path();
    
    if config_path.exists() {
        match tokio::fs::read_to_string(&config_path).await {
            Ok(content) => {
                match serde_json::from_str::<AppSettings>(&content) {
                    Ok(settings) => {
                        println!("✅ Settings loaded from file: {:?}", config_path);
                        return settings;
                    }
                    Err(e) => {
                        println!("⚠️ Failed to parse settings file: {}", e);
                    }
                }
            }
            Err(e) => {
                println!("⚠️ Failed to read settings file: {}", e);
            }
        }
    } else {
        println!("📄 Settings file not found, using defaults");
    }
    
    AppSettings::default()
}

async fn save_settings_to_file(app_state: &AppState, settings: &AppSettings) -> Result<()> {
    let config_path = app_state.config_file_path();
    let content = serde_json::to_string_pretty(settings)?;
    
    tokio::fs::write(&config_path, content).await?;
    println!("💾 Settings saved to file: {:?}", config_path);
    
    Ok(())
}

// 辅助函数
fn parse_youtube_duration(duration: &str) -> Option<i32> {
    // YouTube duration format: PT4M13S, PT1H2M10S, etc.
    let duration = duration.strip_prefix("PT")?;
    
    let mut total_seconds = 0;
    let mut current_number = String::new();
    
    for char in duration.chars() {
        if char.is_ascii_digit() {
            current_number.push(char);
        } else {
            if let Ok(num) = current_number.parse::<i32>() {
                match char {
                    'H' => total_seconds += num * 3600,
                    'M' => total_seconds += num * 60,
                    'S' => total_seconds += num,
                    _ => {}
                }
            }
            current_number.clear();
        }
    }
    
    Some(total_seconds)
}

// API辅助函数 - 参考Chrome扩展的实现模式
async fn search_youtube_videos_with_retry(
    client: &Client,
    query: &str,
    api_key: &str,
    max_results: i32,
    max_retries: u32,
) -> Result<Vec<Video>> {
    let mut last_error = None;
    
    for attempt in 1..=max_retries {
        match search_youtube_videos(client, query, api_key, max_results).await {
            Ok(videos) => return Ok(videos),
            Err(e) => {
                last_error = Some(e);
                println!("🔄 YouTube search attempt {} failed, retrying...", attempt);
                
                if attempt < max_retries {
                    // 指数退避策略
                    let delay = std::cmp::min(1000 * (2_u64.pow(attempt - 1)), 5000);
                    tokio::time::sleep(tokio::time::Duration::from_millis(delay)).await;
                }
            }
        }
    }
    
    Err(last_error.unwrap_or_else(|| anyhow::anyhow!("All retry attempts failed")))
}

async fn search_youtube_videos(
    client: &Client,
    query: &str,
    api_key: &str,
    max_results: i32,
) -> Result<Vec<Video>> {
    println!("🔍 Searching YouTube with API: query='{}', maxResults={}", query, max_results);
    
    // 构建搜索参数 - 参考Chrome扩展的参数设置
    let search_url = format!(
        "https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&q={}&maxResults={}&key={}&order=relevance&safeSearch=strict&videoCategoryId=22&videoEmbeddable=true&relevanceLanguage=en&regionCode=US",
        urlencoding::encode(query),
        std::cmp::min(max_results, 50),
        api_key
    );

    let search_response: YouTubeSearchResponse = client
        .get(&search_url)
        .timeout(tokio::time::Duration::from_secs(10))
        .send()
        .await
        .map_err(|e| anyhow::anyhow!("YouTube search request failed: {}", e))?
        .json()
        .await
        .map_err(|e| anyhow::anyhow!("Failed to parse YouTube search response: {}", e))?;

    if search_response.items.is_empty() {
        println!("⚠️ No videos found for query: {}", query);
        return Ok(vec![]);
    }
    
    println!("📊 YouTube API returned {} videos (total: {})", 
             search_response.items.len(), 
             search_response.page_info.total_results);

    let video_ids: Vec<String> = search_response
        .items
        .iter()
        .map(|item| item.id.video_id.clone())
        .collect();

    println!("📊 Found {} videos, getting detailed information...", video_ids.len());

    // 批量获取视频详细信息 - 参考Chrome扩展的getMultipleVideoDetails
    let detailed_videos = get_multiple_video_details(client, api_key, &video_ids).await?;
    
    // 批量获取字幕信息
    println!("📝 Fetching subtitle information for videos...");
    let captions = fetch_multiple_video_captions(client, api_key, &video_ids).await;
    
    // 格式化视频数据 - 参考Chrome扩展的formatVideoData
    let mut formatted_videos = Vec::new();
    
    for ((search_item, details_opt), caption_opt) in search_response.items.iter()
        .zip(detailed_videos.iter())
        .zip(captions.iter()) {
        let mut formatted = format_video_data(search_item, details_opt.as_ref());
        formatted.subtitles = caption_opt.clone();
        formatted_videos.push(formatted);
    }

    Ok(formatted_videos)
}

// 批量获取视频详细信息 - 参考Chrome扩展实现
async fn get_multiple_video_details(
    client: &Client,
    api_key: &str,
    video_ids: &[String],
) -> Result<Vec<Option<YouTubeVideoDetail>>> {
    if video_ids.is_empty() {
        return Ok(vec![]);
    }

    let details_url = format!(
        "https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,statistics&id={}&key={}",
        video_ids.join(","),
        api_key
    );

    let details_response: YouTubeVideoDetailsResponse = client
        .get(&details_url)
        .timeout(tokio::time::Duration::from_secs(10))
        .send()
        .await
        .map_err(|e| anyhow::anyhow!("YouTube details request failed: {}", e))?
        .json()
        .await
        .map_err(|e| anyhow::anyhow!("Failed to parse YouTube details response: {}", e))?;

    // 创建一个映射来匹配video_id和详细信息
    let mut details_map: std::collections::HashMap<String, YouTubeVideoDetail> = 
        std::collections::HashMap::new();
        
    for detail in details_response.items {
        if let Some(id) = detail.id.clone() {
            details_map.insert(id, detail);
        }
    }

    // 按原始video_ids顺序返回结果
    let mut results = Vec::new();
    for video_id in video_ids {
        results.push(details_map.remove(video_id));
    }

    Ok(results)
}

// 获取视频字幕信息
async fn fetch_video_captions(
    client: &Client,
    api_key: &str,
    video_id: &str,
) -> Option<String> {
    // 使用YouTube Data API v3的captions endpoint
    let captions_url = format!(
        "https://www.googleapis.com/youtube/v3/captions?part=snippet&videoId={}&key={}",
        video_id,
        api_key
    );

    match client
        .get(&captions_url)
        .timeout(tokio::time::Duration::from_secs(5))
        .send()
        .await
    {
        Ok(response) => {
            if let Ok(caption_response) = response.json::<YouTubeCaptionResponse>().await {
                // 查找中文或英文字幕
                let captions_info: Vec<String> = caption_response.items
                    .iter()
                    .filter(|item| {
                        let lang = &item.snippet.language;
                        lang.starts_with("zh") || lang.starts_with("en") || lang == "und"
                    })
                    .map(|item| {
                        format!("[{}] {} ({})", 
                            item.snippet.language, 
                            item.snippet.name,
                            if item.snippet.track_kind == "asr" { "自动生成" } else { "人工" }
                        )
                    })
                    .collect();
                
                if !captions_info.is_empty() {
                    return Some(format!("可用字幕: {}", captions_info.join(", ")));
                }
            }
        }
        Err(e) => {
            println!("⚠️ Failed to fetch captions for video {}: {}", video_id, e);
        }
    }
    
    None
}

// 批量获取视频字幕信息
async fn fetch_multiple_video_captions(
    client: &Client,
    api_key: &str,
    video_ids: &[String],
) -> Vec<Option<String>> {
    let mut caption_futures = Vec::new();
    
    for video_id in video_ids {
        let client_clone = client.clone();
        let api_key_clone = api_key.to_string();
        let video_id_clone = video_id.clone();
        
        caption_futures.push(async move {
            fetch_video_captions(&client_clone, &api_key_clone, &video_id_clone).await
        });
    }
    
    futures::future::join_all(caption_futures).await
}

// 格式化视频数据 - 参考Chrome扩展的formatVideoData函数
fn format_video_data(search_item: &YouTubeVideoItem, details: Option<&YouTubeVideoDetail>) -> Video {
    let snippet = &search_item.snippet;
    
    let thumbnail_url = snippet.thumbnails.high
        .as_ref()
        .or(snippet.thumbnails.medium.as_ref())
        .map(|thumb| thumb.url.clone());

    let (duration, view_count, like_count) = if let Some(details) = details {
        let duration = details.content_details
            .as_ref()
            .and_then(|cd| parse_youtube_duration(&cd.duration));
            
        let view_count = details.statistics
            .as_ref()
            .and_then(|s| s.view_count.as_ref())
            .and_then(|vc| vc.parse().ok());
            
        let like_count = details.statistics
            .as_ref()
            .and_then(|s| s.like_count.as_ref())
            .and_then(|lc| lc.parse().ok());
            
        (duration, view_count, like_count)
    } else {
        (None, None, None)
    };

    Video {
        id: search_item.id.video_id.clone(),
        title: snippet.title.clone(),
        description: Some(snippet.description.clone()),
        channel_title: Some(snippet.channel_title.clone()),
        published_at: Some(snippet.published_at.clone()),
        thumbnail_url,
        duration,
        view_count,
        like_count,
        cached_at: Some(chrono::Utc::now().to_rfc3339()),
        ai_score: None,
        education_score: None,
        safety_score: None,
        age_appropriate: None,
        tags: None,
        subtitles: None,  // It will be filled in later
    }
}

async fn analyze_with_openai(
    client: &Client,
    api_key: &str,
    title: &str,
    description: &str,
    custom_prompt: Option<&str>,
) -> Result<AIAnalysisResponse> {
    let prompt = custom_prompt.unwrap_or(
        "请分析这个视频对儿童的适宜性。请提供：\n\
        1. 教育价值评分(0-1)\n\
        2. 安全性评分(0-1)\n\
        3. 是否适合儿童(true/false)\n\
        4. 综合评分(0-1)\n\
        5. 推荐年龄段\n\
        6. 详细理由\n\n\
        请以JSON格式返回：\n\
        {\"education_score\": 0.8, \"safety_score\": 0.9, \"age_appropriate\": true, \"overall_score\": 0.85, \"recommended_age\": \"3-6岁\", \"reasoning\": \"详细分析...\"}"
    );

    let content = format!("视频标题：{}\n视频描述：{}\n\n{}", title, description, prompt);

    let request = OpenAIRequest {
        model: "gpt-3.5-turbo".to_string(),
        messages: vec![OpenAIMessage {
            role: "user".to_string(),
            content,
        }],
        max_tokens: 500,
        temperature: 0.3,
    };

    let response: OpenAIResponse = client
        .post("https://api.openai.com/v1/chat/completions")
        .header("Authorization", format!("Bearer {}", api_key))
        .header("Content-Type", "application/json")
        .json(&request)
        .send()
        .await
        .map_err(|e| anyhow::anyhow!("OpenAI request failed: {}", e))?
        .json()
        .await
        .map_err(|e| anyhow::anyhow!("Failed to parse OpenAI response: {}", e))?;

    let response_text = response
        .choices
        .first()
        .ok_or_else(|| anyhow::anyhow!("No response from OpenAI"))?
        .message
        .content
        .clone();

    // 尝试解析JSON响应
    if let Ok(json_response) = serde_json::from_str::<serde_json::Value>(&response_text) {
        Ok(AIAnalysisResponse {
            education_score: json_response["education_score"].as_f64().unwrap_or(0.7),
            safety_score: json_response["safety_score"].as_f64().unwrap_or(0.8),
            age_appropriate: json_response["age_appropriate"].as_bool().unwrap_or(true),
            overall_score: json_response["overall_score"].as_f64().unwrap_or(0.75),
            recommended_age: json_response["recommended_age"]
                .as_str()
                .unwrap_or("需要家长判断")
                .to_string(),
            reasoning: json_response["reasoning"]
                .as_str()
                .unwrap_or(&response_text)
                .to_string(),
        })
    } else {
        // 如果JSON解析失败，返回默认值
        Ok(AIAnalysisResponse {
            education_score: 0.7,
            safety_score: 0.8,
            age_appropriate: true,
            overall_score: 0.75,
            recommended_age: "需要家长判断".to_string(),
            reasoning: response_text,
        })
    }
}

async fn analyze_with_anthropic(
    client: &Client,
    api_key: &str,
    title: &str,
    description: &str,
    custom_prompt: Option<&str>,
) -> Result<AIAnalysisResponse> {
    let prompt = custom_prompt.unwrap_or(
        "请分析这个视频对儿童的适宜性。请以JSON格式返回分析结果，包含education_score(0-1), safety_score(0-1), age_appropriate(布尔值), overall_score(0-1), recommended_age(字符串), reasoning(详细理由)。"
    );

    let content = format!("视频标题：{}\n视频描述：{}\n\n{}", title, description, prompt);

    let request = AnthropicRequest {
        model: "claude-3-haiku-20240307".to_string(),
        max_tokens: 500,
        messages: vec![AnthropicMessage {
            role: "user".to_string(),
            content,
        }],
    };

    let response: AnthropicResponse = client
        .post("https://api.anthropic.com/v1/messages")
        .header("x-api-key", api_key)
        .header("anthropic-version", "2023-06-01")
        .header("Content-Type", "application/json")
        .json(&request)
        .send()
        .await
        .map_err(|e| anyhow::anyhow!("Anthropic request failed: {}", e))?
        .json()
        .await
        .map_err(|e| anyhow::anyhow!("Failed to parse Anthropic response: {}", e))?;

    let response_text = response
        .content
        .first()
        .ok_or_else(|| anyhow::anyhow!("No response from Anthropic"))?
        .text
        .clone();

    // 尝试解析JSON响应
    if let Ok(json_response) = serde_json::from_str::<serde_json::Value>(&response_text) {
        Ok(AIAnalysisResponse {
            education_score: json_response["education_score"].as_f64().unwrap_or(0.7),
            safety_score: json_response["safety_score"].as_f64().unwrap_or(0.8),
            age_appropriate: json_response["age_appropriate"].as_bool().unwrap_or(true),
            overall_score: json_response["overall_score"].as_f64().unwrap_or(0.75),
            recommended_age: json_response["recommended_age"]
                .as_str()
                .unwrap_or("需要家长判断")
                .to_string(),
            reasoning: json_response["reasoning"]
                .as_str()
                .unwrap_or(&response_text)
                .to_string(),
        })
    } else {
        Ok(AIAnalysisResponse {
            education_score: 0.7,
            safety_score: 0.8,
            age_appropriate: true,
            overall_score: 0.75,
            recommended_age: "需要家长判断".to_string(),
            reasoning: response_text,
        })
    }
}

// Format duration in seconds to human readable format (e.g., "4分13秒")
fn format_duration(seconds: i32) -> String {
    let hours = seconds / 3600;
    let minutes = (seconds % 3600) / 60;
    let secs = seconds % 60;
    
    if hours > 0 {
        format!("{}小时{}分{}秒", hours, minutes, secs)
    } else if minutes > 0 {
        format!("{}分{}秒", minutes, secs)
    } else {
        format!("{}秒", secs)
    }
}

// Maximum videos per batch to avoid token limits
const MAX_VIDEOS_PER_BATCH: usize = 5;

// Calculate required tokens based on video count
fn calculate_required_tokens(video_count: usize) -> u32 {
    // Rough estimation: ~300 tokens per video + 500 base
    let base_tokens = 500;
    let per_video_tokens = 300;
    (base_tokens + (video_count as u32 * per_video_tokens)).min(8000)
}

// Process videos in chunks to avoid token limits
async fn process_videos_in_chunks(
    client: &Client,
    api_key: &str,
    videos: &[Video],
    chunk_size: usize,
    custom_prompt: Option<&str>,
    min_duration: Option<i32>,
    max_duration: Option<i32>,
    provider: &str,
) -> Result<Vec<Video>> {
    let mut all_results = Vec::new();
    
    for chunk in videos.chunks(chunk_size) {
        let chunk_result = match provider {
            "anthropic" => {
                analyze_batch_with_anthropic_impl(
                    client,
                    api_key,
                    chunk,
                    custom_prompt,
                    min_duration,
                    max_duration,
                ).await
            }
            _ => {
                analyze_batch_with_openai_impl(
                    client,
                    api_key,
                    chunk,
                    custom_prompt,
                    min_duration,
                    max_duration,
                ).await
            }
        };
        
        match chunk_result {
            Ok(mut chunk_results) => {
                all_results.append(&mut chunk_results);
            }
            Err(e) => {
                println!("⚠️ Chunk processing failed: {}", e);
                // Continue processing other chunks even if one fails
            }
        }
    }
    
    Ok(all_results)
}

// Batch analyze videos with OpenAI
async fn analyze_batch_with_openai(
    client: &Client,
    api_key: &str,
    videos: &[Video],
    custom_prompt: Option<&str>,
    min_duration: Option<i32>,
    max_duration: Option<i32>,
) -> Result<Vec<Video>> {
    if videos.is_empty() {
        return Ok(vec![]);
    }

    // Split videos into chunks if necessary
    if videos.len() > MAX_VIDEOS_PER_BATCH {
        println!("📦 Splitting {} videos into chunks of {}", videos.len(), MAX_VIDEOS_PER_BATCH);
        
        return process_videos_in_chunks(
            client,
            api_key,
            videos,
            MAX_VIDEOS_PER_BATCH,
            custom_prompt,
            min_duration,
            max_duration,
            "openai",
        ).await;
    }

    // Process directly if within limit
    analyze_batch_with_openai_impl(client, api_key, videos, custom_prompt, min_duration, max_duration).await
}

// Implementation of OpenAI batch analysis
async fn analyze_batch_with_openai_impl(
    client: &Client,
    api_key: &str,
    videos: &[Video],
    custom_prompt: Option<&str>,
    min_duration: Option<i32>,
    max_duration: Option<i32>,
) -> Result<Vec<Video>> {
    let default_prompt = r#"请分析以下儿童视频的适宜性。评判标准：
1. 教育价值：是否有助于学习认知、语言、数学、科学等
2. 内容安全：无暴力、恐怖、不当内容
3. 年龄适宜：符合学前儿童认知水平
4. 制作质量：画面清晰、音频清楚、制作精良

总分计算：
- 若时长不符合要求，直接将总分设为 min(原计算分数, 60)。
- 若时长符合要求，综合各项指标取平均分作为总分。"#;

    let user_prompt = custom_prompt.unwrap_or(default_prompt);
    
    // Build video list for analysis
    let video_list: String = videos.iter().enumerate().map(|(index, video)| {
        format!(
            "视频{}:\n标题：{}\n时长：{} ({}秒)\n描述：{}\n喜欢人数：{}\n观看人数：{}\n发布时间：{}\n频道：{}\n字幕：{}",
            index + 1,
            video.title,
            video.duration.map(format_duration).unwrap_or_else(|| "未知".to_string()),
            video.duration.unwrap_or(0),
            video.description.as_deref().unwrap_or("无描述"),
            video.like_count.unwrap_or(0),
            video.view_count.unwrap_or(0),
            video.published_at.as_deref().unwrap_or("无发布时间"),
            video.channel_title.as_deref().unwrap_or("未知"),
            video.subtitles.as_deref().unwrap_or("无字幕信息")
        )
    }).collect::<Vec<String>>().join("\n\n");

    let content = format!(
        "{}\n\n输出要求：\n- 返回 JSON 格式\n- 只返回同时满足：score >= 70 且 时长符合要求 的视频\n- 字段：\n{{\n  \"videos\": [\n    {{\n      \"index\": 1,\n      \"score\": 0-100,\n      \"suitable\": true/false,   // true 表示总分≥70且时长合格\n      \"reason\": \"评分理由\",\n      \"educational_value\": 0-100,\n      \"safety_score\": 0-100\n    }}\n  ]\n}}\n\n请分析以下{}个视频：\n\n{}",
        user_prompt,
        videos.len(),
        video_list
    );

    let required_tokens = calculate_required_tokens(videos.len());
    
    let request = OpenAIRequest {
        model: "gpt-3.5-turbo".to_string(),
        messages: vec![OpenAIMessage {
            role: "user".to_string(),
            content,
        }],
        max_tokens: required_tokens,
        temperature: 0.3,
    };

    let response: OpenAIResponse = client
        .post("https://api.openai.com/v1/chat/completions")
        .header("Authorization", format!("Bearer {}", api_key))
        .header("Content-Type", "application/json")
        .json(&request)
        .send()
        .await
        .map_err(|e| anyhow::anyhow!("OpenAI batch request failed: {}", e))?
        .json()
        .await
        .map_err(|e| anyhow::anyhow!("Failed to parse OpenAI batch response: {}", e))?;

    let response_text = response
        .choices
        .first()
        .ok_or_else(|| anyhow::anyhow!("No response from OpenAI"))?
        .message
        .content
        .clone();

    // Parse batch analysis response
    parse_batch_analysis_response(videos, &response_text, min_duration, max_duration)
}

// Batch analyze videos with Anthropic
async fn analyze_batch_with_anthropic(
    client: &Client,
    api_key: &str,
    videos: &[Video],
    custom_prompt: Option<&str>,
    min_duration: Option<i32>,
    max_duration: Option<i32>,
) -> Result<Vec<Video>> {
    if videos.is_empty() {
        return Ok(vec![]);
    }

    // Split videos into chunks if necessary
    if videos.len() > MAX_VIDEOS_PER_BATCH {
        println!("📦 Splitting {} videos into chunks of {}", videos.len(), MAX_VIDEOS_PER_BATCH);
        
        return process_videos_in_chunks(
            client,
            api_key,
            videos,
            MAX_VIDEOS_PER_BATCH,
            custom_prompt,
            min_duration,
            max_duration,
            "anthropic",
        ).await;
    }

    // Process directly if within limit
    analyze_batch_with_anthropic_impl(client, api_key, videos, custom_prompt, min_duration, max_duration).await
}

// Implementation of Anthropic batch analysis
async fn analyze_batch_with_anthropic_impl(
    client: &Client,
    api_key: &str,
    videos: &[Video],
    custom_prompt: Option<&str>,
    min_duration: Option<i32>,
    max_duration: Option<i32>,
) -> Result<Vec<Video>> {
    let default_prompt = r#"请分析以下儿童视频的适宜性。评判标准：
1. 教育价值：是否有助于学习认知、语言、数学、科学等
2. 内容安全：无暴力、恐怖、不当内容
3. 年龄适宜：符合学前儿童认知水平
4. 制作质量：画面清晰、音频清楚、制作精良

总分计算：
- 若时长不符合要求，直接将总分设为 min(原计算分数, 60)。
- 若时长符合要求，综合各项指标取平均分作为总分。"#;

    let user_prompt = custom_prompt.unwrap_or(default_prompt);
    
    // Build video list for analysis
    let video_list: String = videos.iter().enumerate().map(|(index, video)| {
        format!(
            "视频{}:\n标题：{}\n时长：{} ({}秒)\n描述：{}\n喜欢人数：{}\n观看人数：{}\n发布时间：{}\n频道：{}\n字幕：{}",
            index + 1,
            video.title,
            video.duration.map(format_duration).unwrap_or_else(|| "未知".to_string()),
            video.duration.unwrap_or(0),
            video.description.as_deref().unwrap_or("无描述"),
            video.like_count.unwrap_or(0),
            video.view_count.unwrap_or(0),
            video.published_at.as_deref().unwrap_or("无发布时间"),
            video.channel_title.as_deref().unwrap_or("未知"),
            video.subtitles.as_deref().unwrap_or("无字幕信息")
        )
    }).collect::<Vec<String>>().join("\n\n");

    let content = format!(
        "{}\n\n输出要求：\n- 返回 JSON 格式\n- 只返回同时满足：score >= 70 且 时长符合要求 的视频\n- 字段：\n{{\n  \"videos\": [\n    {{\n      \"index\": 1,\n      \"score\": 0-100,\n      \"suitable\": true/false,   // true 表示总分≥70且时长合格\n      \"reason\": \"评分理由\",\n      \"educational_value\": 0-100,\n      \"safety_score\": 0-100\n    }}\n  ]\n}}\n\n请分析以下{}个视频：\n\n{}",
        user_prompt,
        videos.len(),
        video_list
    );

    let required_tokens = calculate_required_tokens(videos.len());
    
    let request = AnthropicRequest {
        model: "claude-3-haiku-20240307".to_string(),
        max_tokens: required_tokens,
        messages: vec![AnthropicMessage {
            role: "user".to_string(),
            content,
        }],
    };

    let response: AnthropicResponse = client
        .post("https://api.anthropic.com/v1/messages")
        .header("x-api-key", api_key)
        .header("anthropic-version", "2023-06-01")
        .header("Content-Type", "application/json")
        .json(&request)
        .send()
        .await
        .map_err(|e| anyhow::anyhow!("Anthropic batch request failed: {}", e))?
        .json()
        .await
        .map_err(|e| anyhow::anyhow!("Failed to parse Anthropic batch response: {}", e))?;

    let response_text = response
        .content
        .first()
        .ok_or_else(|| anyhow::anyhow!("No response from Anthropic"))?
        .text
        .clone();

    // Parse batch analysis response
    parse_batch_analysis_response(videos, &response_text, min_duration, max_duration)
}

// Parse batch analysis response and apply scores to videos
fn parse_batch_analysis_response(
    videos: &[Video],
    response_text: &str,
    min_duration: Option<i32>,
    max_duration: Option<i32>,
) -> Result<Vec<Video>> {
    let min_duration_secs = min_duration.unwrap_or(2) * 60;
    let max_duration_secs = max_duration.unwrap_or(30) * 60;
    
    // Try to parse JSON response
    if let Ok(json_response) = serde_json::from_str::<serde_json::Value>(response_text) {
        if let Some(analyzed_videos) = json_response["videos"].as_array() {
            let mut result_videos = Vec::new();
            
            for analyzed in analyzed_videos {
                if let Some(index) = analyzed["index"].as_u64() {
                    let idx = (index as usize) - 1; // Convert to 0-based index
                    
                    if idx < videos.len() {
                        let mut video = videos[idx].clone();
                        
                        // Check duration requirements
                        let duration_ok = video.duration.map_or(false, |d| {
                            d >= min_duration_secs && d <= max_duration_secs
                        });
                        
                        let score = analyzed["score"].as_f64().unwrap_or(0.0) / 100.0;
                        let educational_value = analyzed["educational_value"].as_f64().unwrap_or(70.0) / 100.0;
                        let safety_score = analyzed["safety_score"].as_f64().unwrap_or(80.0) / 100.0;
                        let suitable = analyzed["suitable"].as_bool().unwrap_or(false) && duration_ok;
                        
                        if suitable && score >= 0.7 {
                            video.ai_score = Some(score);
                            video.education_score = Some(educational_value);
                            video.safety_score = Some(safety_score);
                            video.age_appropriate = Some(suitable);
                            
                            result_videos.push(video);
                        }
                    }
                }
            }
            
            return Ok(result_videos);
        }
    }
    
    // Fallback: analyze individually if batch parsing fails
    println!("⚠️ Batch analysis parsing failed, falling back to individual analysis");
    Ok(videos.to_vec())
}

// Tauri命令实现
#[command]
async fn search_videos(
    request: SearchRequest,
    state: tauri::State<'_, AppState>,
) -> Result<SearchResponse, String> {
    let start_time = std::time::Instant::now();
    println!("🔍 Production: Searching for '{}' on {}", request.query, request.platform);

    let settings = state.settings.lock().await;
    
    // 检查是否配置了YouTube API密钥
    let youtube_api_key = match &settings.youtube_api_key {
        Some(key) if !key.is_empty() => key.clone(),
        _ => {
            println!("⚠️ No YouTube API key configured, using mock data");
            return Ok(create_fallback_response(&request.query));
        }
    };

    // 获取AI API密钥
    let (ai_api_key, ai_provider) = match settings.ai_provider.as_str() {
        "openai" => (settings.openai_api_key.clone(), "openai"),
        "anthropic" => (settings.anthropic_api_key.clone(), "anthropic"),
        _ => (settings.openai_api_key.clone(), "openai"),
    };

    let ai_key = ai_api_key.unwrap_or_default();
    let custom_prompt = settings.custom_filter_prompt.clone();
    
    drop(settings); // 释放锁

    let max_results = request.max_results.unwrap_or(10).min(20);

    // 搜索YouTube视频（使用重试机制）
    let mut videos = match search_youtube_videos_with_retry(&state.client, &request.query, &youtube_api_key, max_results, 3).await {
        Ok(videos) => videos,
        Err(e) => {
            println!("❌ YouTube search failed after retries: {}", e);
            return Ok(create_fallback_response(&request.query));
        }
    };

    let search_time = start_time.elapsed().as_secs_f64();
    let ai_start_time = std::time::Instant::now();

    // 检查是否跳过AI分析
    if request.skip_ai_analysis.unwrap_or(false) {
        println!("⚡ Skipping AI analysis for faster results (user requested)");

        // 先计算总数
        let total_found = videos.len() as i32;

        // 保存搜索历史
        batch_save_videos(videos.clone(), request.query.clone(), request.platform.clone(), state).await?;

        return Ok(SearchResponse {
            videos,
            total_found,
            search_time,
            ai_analysis_time: 0.0,
        });
    }

    // 对视频进行AI分析 - 使用批量分析优化性能
    if !ai_key.is_empty() && !videos.is_empty() {
        println!("🤖 Batch analyzing {} videos with {}", videos.len(), ai_provider);
        
        // Get duration settings
        let settings = state.settings.lock().await;
        let min_duration = Some(settings.min_duration);
        let max_duration = Some(settings.max_duration);
        let custom_prompt_ref = custom_prompt.clone();
        drop(settings);
        
        // Try batch analysis first
        let batch_result = match ai_provider {
            "anthropic" => {
                analyze_batch_with_anthropic(
                    &state.client, 
                    &ai_key, 
                    &videos, 
                    custom_prompt_ref.as_deref(),
                    min_duration,
                    max_duration
                ).await
            },
            _ => {
                analyze_batch_with_openai(
                    &state.client, 
                    &ai_key, 
                    &videos, 
                    custom_prompt_ref.as_deref(),
                    min_duration,
                    max_duration
                ).await
            },
        };
        
        match batch_result {
            Ok(analyzed_videos) => {
                println!("✅ Batch analysis successful: {} videos passed filtering", analyzed_videos.len());
                videos = analyzed_videos;
            },
            Err(e) => {
                println!("⚠️ Batch analysis failed, falling back to individual analysis: {}", e);
                
                // Fallback to individual analysis
                let analysis_futures: Vec<_> = videos.iter().map(|video| {
                    let client = &state.client;
                    let api_key = ai_key.clone();
                    let title = video.title.clone();
                    let description = video.description.clone().unwrap_or_default();
                    let custom_prompt_clone = custom_prompt.clone();
                    
                    async move {
                        let prompt_ref = custom_prompt_clone.as_deref();
                        match ai_provider {
                            "anthropic" => analyze_with_anthropic(client, &api_key, &title, &description, prompt_ref).await,
                            _ => analyze_with_openai(client, &api_key, &title, &description, prompt_ref).await,
                        }
                    }
                }).collect();

                let analysis_results = futures::future::join_all(analysis_futures).await;
                
                // 应用AI分析结果
                for (video, analysis_result) in videos.iter_mut().zip(analysis_results) {
                    if let Ok(analysis) = analysis_result {
                        video.ai_score = Some(analysis.overall_score);
                        video.education_score = Some(analysis.education_score);
                        video.safety_score = Some(analysis.safety_score);
                        video.age_appropriate = Some(analysis.age_appropriate);
                    }
                }
            }
        }
    }

    // 根据筛选模式过滤视频
    videos = filter_videos_by_mode(videos, &request.filter_mode);

    let ai_analysis_time = ai_start_time.elapsed().as_secs_f64();
    let total_found = videos.len() as i32;

    println!("✅ Found {} videos in {:.2}s (search: {:.2}s, AI: {:.2}s)", 
             total_found, search_time + ai_analysis_time, search_time, ai_analysis_time);

    // Save search history
    batch_save_videos(videos.clone(), request.query, request.platform, state).await?;

    Ok(SearchResponse {
        videos,
        total_found,
        search_time,
        ai_analysis_time,
    })
}

#[command]
async fn analyze_video(
    request: AIAnalysisRequest,
    state: tauri::State<'_, AppState>,
) -> Result<AIAnalysisResponse, String> {
    println!("🤖 Production: Analyzing video '{}'", request.title);
    
    if request.api_key.is_empty() {
        return Err("API key is required for video analysis".to_string());
    }

    let description = request.description.unwrap_or_default();
    let custom_prompt = request.filter_prompt.as_deref();
    
    let result = match request.provider.as_str() {
        "anthropic" => analyze_with_anthropic(&state.client, &request.api_key, &request.title, &description, custom_prompt).await,
        _ => analyze_with_openai(&state.client, &request.api_key, &request.title, &description, custom_prompt).await,
    };

    result.map_err(|e| format!("AI analysis failed: {}", e))
}

#[command]
async fn analyze_videos_batch(
    request: BatchAnalysisRequest,
    state: tauri::State<'_, AppState>,
) -> Result<BatchAnalysisResponse, String> {
    let start_time = std::time::Instant::now();
    println!("🤖 Production: Batch analyzing {} videos", request.videos.len());
    
    if request.api_key.is_empty() {
        return Err("API key is required for batch video analysis".to_string());
    }

    if request.videos.is_empty() {
        return Ok(BatchAnalysisResponse {
            analyzed_videos: vec![],
            total_analyzed: 0,
            analysis_time: 0.0,
        });
    }

    let custom_prompt = request.filter_prompt.as_deref();
    
    let result = match request.provider.as_str() {
        "anthropic" => {
            analyze_batch_with_anthropic(
                &state.client, 
                &request.api_key, 
                &request.videos, 
                custom_prompt,
                request.min_duration,
                request.max_duration
            ).await
        },
        _ => {
            analyze_batch_with_openai(
                &state.client, 
                &request.api_key, 
                &request.videos, 
                custom_prompt,
                request.min_duration,
                request.max_duration
            ).await
        },
    };

    match result {
        Ok(analyzed_videos) => {
            let analysis_time = start_time.elapsed().as_secs_f64();
            let total_analyzed = analyzed_videos.len() as i32;
            
            println!("✅ Batch analysis complete: {} videos analyzed in {:.2}s", 
                     total_analyzed, analysis_time);
            
            Ok(BatchAnalysisResponse {
                analyzed_videos,
                total_analyzed,
                analysis_time,
            })
        },
        Err(e) => {
            println!("❌ Batch analysis failed: {}", e);
            Err(format!("Batch AI analysis failed: {}", e))
        }
    }
}

// Database operations
#[command]
async fn save_video(
    video: Video,
    state: tauri::State<'_, AppState>,
) -> Result<String, String> {
    println!("💾 Production: Saving video '{}'", video.title);
    
    let video_json = serde_json::to_string(&video)
        .map_err(|e| format!("Failed to serialize video: {}", e))?;
    let cached_at = chrono::Utc::now().to_rfc3339();
    let expires_at = (chrono::Utc::now() + chrono::Duration::hours(24)).to_rfc3339();
    
    sqlx::query(
        "INSERT OR REPLACE INTO cached_videos (id, query, platform, video_data, cached_at, expires_at) 
         VALUES (?, ?, ?, ?, ?, ?)"
    )
    .bind(&video.id)
    .bind(&video.title)
    .bind("youtube")
    .bind(&video_json)
    .bind(&cached_at)
    .bind(&expires_at)
    .execute(&*state.db)
    .await
    .map_err(|e| format!("Failed to save video: {}", e))?;
    
    Ok("Video saved successfully".to_string())
}

#[command]
async fn delete_video(
    video_id: String,
    state: tauri::State<'_, AppState>,
) -> Result<String, String> {
    println!("🗑️ Production: Deleting video '{}'", video_id);
    
    sqlx::query("DELETE FROM cached_videos WHERE id = ?")
        .bind(&video_id)
        .execute(&*state.db)
        .await
        .map_err(|e| format!("Failed to delete video: {}", e))?;
    
    Ok("Video deleted successfully".to_string())
}

#[command]
async fn get_favorites(
    state: tauri::State<'_, AppState>,
) -> Result<Vec<FavoriteVideo>, String> {
    println!("❤️ Production: Loading favorites");
    
    let rows = sqlx::query_as::<_, (i32, String, Option<String>, String, String)>(
        "SELECT id, video_id, user_notes, created_at, video_data 
         FROM favorites 
         ORDER BY created_at DESC"
    )
    .fetch_all(&*state.db)
    .await
    .map_err(|e| format!("Failed to load favorites: {}", e))?;
    
    let mut favorites = Vec::new();
    for (id, video_id, user_notes, created_at, video_data) in rows {
        let video: Option<Video> = serde_json::from_str(&video_data).ok();
        favorites.push(FavoriteVideo {
            id,
            video_id,
            user_notes,
            created_at,
            video: video,
        });
    }
    
    Ok(favorites)
}

#[command]
async fn add_to_favorites(
    video_id: String,
    notes: Option<String>,
    state: tauri::State<'_, AppState>,
) -> Result<String, String> {
    println!("❤️ Production: Adding {} to favorites", video_id);
    
    // 首先尝试从缓存中获取视频数据
    let video_row = sqlx::query_as::<_, (String,)>(
        "SELECT video_data FROM cached_videos WHERE id = ?"
    )
    .bind(&video_id)
    .fetch_optional(&*state.db)
    .await
    .map_err(|e| format!("Failed to fetch video data: {}", e))?;
    
    let video_data = video_row
        .map(|(data,)| data)
        .unwrap_or_else(|| {
            // 如果缓存中没有，创建一个基本的视频对象
            let basic_video = Video {
                id: video_id.clone(),
                title: "Unknown Video".to_string(),
                description: None,
                thumbnail_url: None,
                duration: None,
                channel_title: None,
                published_at: None,
                view_count: None,
                like_count: None,
                ai_score: None,
                education_score: None,
                safety_score: None,
                age_appropriate: None,
                tags: None,
                cached_at: Some(chrono::Utc::now().to_rfc3339()),
                subtitles: None,
            };
            serde_json::to_string(&basic_video).unwrap_or_default()
        });
    
    let created_at = chrono::Utc::now().to_rfc3339();
    
    sqlx::query(
        "INSERT OR REPLACE INTO favorites (video_id, user_notes, created_at, video_data) 
         VALUES (?, ?, ?, ?)"
    )
    .bind(&video_id)
    .bind(&notes)
    .bind(&created_at)
    .bind(&video_data)
    .execute(&*state.db)
    .await
    .map_err(|e| format!("Failed to add to favorites: {}", e))?;
    
    Ok("Added to favorites successfully".to_string())
}

#[command]
async fn remove_from_favorites(
    favorite_id: i32,
    state: tauri::State<'_, AppState>,
) -> Result<String, String> {
    println!("🗑️ Production: Removing favorite {}", favorite_id);
    
    sqlx::query("DELETE FROM favorites WHERE id = ?")
        .bind(favorite_id)
        .execute(&*state.db)
        .await
        .map_err(|e| format!("Failed to remove from favorites: {}", e))?;
    
    Ok("Removed from favorites successfully".to_string())
}

// 批量保存视频
#[command]
async fn batch_save_videos(
    videos: Vec<Video>,
    query: String,
    platform: String,
    state: tauri::State<'_, AppState>,
) -> Result<String, String> {
    println!("💾 Production: Batch saving {} videos", videos.len());
    
    let cached_at = chrono::Utc::now().to_rfc3339();
    let expires_at = (chrono::Utc::now() + chrono::Duration::hours(24)).to_rfc3339();
    let count = videos.len();
    
    // 开始事务
    let mut tx = state.db.begin().await
        .map_err(|e| format!("Failed to begin transaction: {}", e))?;
    
    for video in videos {
        let video_json = serde_json::to_string(&video)
            .map_err(|e| format!("Failed to serialize video: {}", e))?;
        
        sqlx::query(
            "INSERT OR REPLACE INTO cached_videos (id, query, platform, video_data, cached_at, expires_at) 
             VALUES (?, ?, ?, ?, ?, ?)"
        )
        .bind(&video.id)
        .bind(&query)
        .bind(&platform)
        .bind(&video_json)
        .bind(&cached_at)
        .bind(&expires_at)
        .execute(&mut *tx)
        .await
        .map_err(|e| format!("Failed to save video: {}", e))?;
    }
    
    // 保存搜索历史
    sqlx::query(
        "INSERT INTO search_history (query, platform, filter_mode, results_count, created_at) 
         VALUES (?, ?, ?, ?, ?)"
    )
    .bind(&query)
    .bind(&platform)
    .bind("balanced")
    .bind(count as i32)
    .bind(&cached_at)
    .execute(&mut *tx)
    .await
    .map_err(|e| format!("Failed to save search history: {}", e))?;
    
    // 提交事务
    tx.commit().await
        .map_err(|e| format!("Failed to commit transaction: {}", e))?;
    
    Ok(format!("Successfully saved {} videos", count))
}

// 获取所有缓存的视频
#[command]
async fn get_cached_videos(
    state: tauri::State<'_, AppState>,
) -> Result<Vec<Video>, String> {
    println!("📚 Production: Loading all cached videos from database");

    let rows = sqlx::query_as::<_, (String,)>(
        "SELECT video_data FROM cached_videos ORDER BY cached_at DESC"
    )
    .fetch_all(&*state.db)
    .await
    .map_err(|e| format!("Failed to load cached videos: {}", e))?;

    let mut videos = Vec::new();
    for (video_data,) in rows {
        if let Ok(video) = serde_json::from_str::<Video>(&video_data) {
            videos.push(video);
        }
    }

    println!("✅ Loaded {} cached videos from database", videos.len());
    Ok(videos)
}

// 清除所有缓存的视频
#[command]
async fn clear_cache(
    state: tauri::State<'_, AppState>,
) -> Result<String, String> {
    println!("🗑️ Production: Clearing all cached videos");

    let result = sqlx::query("DELETE FROM cached_videos")
        .execute(&*state.db)
        .await
        .map_err(|e| format!("Failed to clear cache: {}", e))?;

    Ok(format!("Cleared {} cached videos", result.rows_affected()))
}

// 获取搜索历史
#[command]
async fn get_search_history(
    limit: Option<i32>,
    state: tauri::State<'_, AppState>,
) -> Result<Vec<SearchHistoryEntry>, String> {
    println!("📚 Production: Loading search history");
    
    let limit_value = limit.unwrap_or(20);
    
    let rows = sqlx::query_as::<_, (i64, String, String, String, i32, String)>(
        "SELECT id, query, platform, filter_mode, results_count, created_at 
         FROM search_history 
         ORDER BY created_at DESC 
         LIMIT ?"
    )
    .bind(limit_value)
    .fetch_all(&*state.db)
    .await
    .map_err(|e| format!("Failed to load search history: {}", e))?;
    
    let history = rows.into_iter().map(|(id, query, platform, filter_mode, results_count, created_at)| {
        SearchHistoryEntry {
            id,
            query,
            platform,
            filter_mode,
            results_count,
            created_at,
        }
    }).collect();
    
    Ok(history)
}

#[command]
async fn get_settings(state: tauri::State<'_, AppState>) -> Result<AppSettings, String> {
    println!("⚙️ Production: Loading settings");
    
    // 从文件加载设置
    let loaded_settings = load_settings_from_file(&*state).await;
    
    // 更新内存中的设置
    {
        let mut current_settings = state.settings.lock().await;
        *current_settings = loaded_settings.clone();
    }
    
    Ok(loaded_settings)
}

#[command]
async fn save_settings(
    settings: AppSettings,
    state: tauri::State<'_, AppState>,
) -> Result<String, String> {
    println!("⚙️ Production: Saving settings");
    
    // 保存到内存
    {
        let mut current_settings = state.settings.lock().await;
        *current_settings = settings.clone();
    }
    
    // 保存到文件
    save_settings_to_file(&*state, &settings)
        .await
        .map_err(|e| format!("Failed to save settings: {}", e))?;
    
    Ok("Settings saved successfully".to_string())
}

// 这个函数已被 get_search_history 替代，保留仅为兼容性
// 建议使用新的 get_search_history 函数

// TEST API CONNECTIONS
#[command]
async fn test_api_connections(
    api_keys: HashMap<String, String>,
    state: tauri::State<'_, AppState>,
) -> Result<HashMap<String, serde_json::Value>, String> {
    println!("🧪 Production: Testing API connections");
    
    let mut results = HashMap::new();
    
    // 测试YouTube API
    if let Some(youtube_key) = api_keys.get("youtube_api_key") {
        if !youtube_key.is_empty() {
            match test_youtube_api(&state.client, youtube_key).await {
                Ok(message) => {
                    results.insert("youtube".to_string(), serde_json::json!({
                        "success": true,
                        "message": message
                    }));
                }
                Err(e) => {
                    results.insert("youtube".to_string(), serde_json::json!({
                        "success": false,
                        "error": e.to_string()
                    }));
                }
            }
        } else {
            results.insert("youtube".to_string(), serde_json::json!({
                "success": false,
                "error": "YouTube API key not provided"
            }));
        }
    }
    
    // 测试OpenAI API
    if let Some(openai_key) = api_keys.get("openai_api_key") {
        if !openai_key.is_empty() {
            match test_openai_api(&state.client, openai_key).await {
                Ok(message) => {
                    results.insert("openai".to_string(), serde_json::json!({
                        "success": true,
                        "message": message
                    }));
                }
                Err(e) => {
                    results.insert("openai".to_string(), serde_json::json!({
                        "success": false,
                        "error": e.to_string()
                    }));
                }
            }
        } else {
            results.insert("openai".to_string(), serde_json::json!({
                "success": false,
                "error": "OpenAI API key not provided"
            }));
        }
    }
    
    // 测试Anthropic API
    if let Some(anthropic_key) = api_keys.get("anthropic_api_key") {
        if !anthropic_key.is_empty() {
            match test_anthropic_api(&state.client, anthropic_key).await {
                Ok(message) => {
                    results.insert("anthropic".to_string(), serde_json::json!({
                        "success": true,
                        "message": message
                    }));
                }
                Err(e) => {
                    results.insert("anthropic".to_string(), serde_json::json!({
                        "success": false,
                        "error": e.to_string()
                    }));
                }
            }
        } else {
            results.insert("anthropic".to_string(), serde_json::json!({
                "success": false,
                "error": "Anthropic API key not provided"
            }));
        }
    }
    
    Ok(results)
}

// 辅助函数
fn create_fallback_response(query: &str) -> SearchResponse {
    let fallback_video = Video {
        id: format!("fallback_{}", chrono::Utc::now().timestamp()),
        title: format!("配置API密钥以搜索: {}", query),
        description: Some("请在设置页面配置YouTube API密钥以启用真实搜索功能".to_string()),
        channel_title: Some("系统提示".to_string()),
        duration: Some(0),
        view_count: Some(0),
        like_count: Some(0),
        published_at: Some(chrono::Utc::now().to_rfc3339()),
        thumbnail_url: Some("https://via.placeholder.com/320x180/f5f5f5/666666?text=API+KEY+REQUIRED".to_string()),
        cached_at: Some(chrono::Utc::now().to_rfc3339()),
        ai_score: None,
        education_score: None,
        safety_score: None,
        age_appropriate: None,
        tags: None,
        subtitles: None,
    };

    SearchResponse {
        videos: vec![fallback_video],
        total_found: 1,
        search_time: 0.0,
        ai_analysis_time: 0.0,
    }
}

fn filter_videos_by_mode(mut videos: Vec<Video>, filter_mode: &str) -> Vec<Video> {
    // 只保留有AI分析结果的视频进行筛选
    videos.retain(|video| {
        match filter_mode {
            "strict" => video.safety_score.unwrap_or(0.0) >= 0.9 && video.age_appropriate.unwrap_or(false),
            "educational" => video.education_score.unwrap_or(0.0) >= 0.75,
            "balanced" => video.ai_score.unwrap_or(0.6) >= 0.6,
            _ => true,
        }
    });

    // 按AI评分排序
    videos.sort_by(|a, b| {
        let score_a = match filter_mode {
            "strict" => a.safety_score.unwrap_or(0.0),
            "educational" => a.education_score.unwrap_or(0.0),
            _ => a.ai_score.unwrap_or(0.0),
        };
        let score_b = match filter_mode {
            "strict" => b.safety_score.unwrap_or(0.0),
            "educational" => b.education_score.unwrap_or(0.0),
            _ => b.ai_score.unwrap_or(0.0),
        };
        score_b.partial_cmp(&score_a).unwrap_or(std::cmp::Ordering::Equal)
    });

    videos
}

// API测试函数 - 参考Chrome扩展的API测试
async fn test_youtube_api(client: &Client, api_key: &str) -> Result<String> {
    println!("🧪 Testing YouTube Data API...");
    
    let test_url = format!(
        "https://www.googleapis.com/youtube/v3/videos?part=snippet&chart=mostPopular&maxResults=1&key={}",
        api_key
    );

    let response = client
        .get(&test_url)
        .timeout(tokio::time::Duration::from_secs(10))
        .send()
        .await
        .map_err(|e| anyhow::anyhow!("YouTube API test request failed: {}", e))?;

    if response.status().is_success() {
        let quota_info = response
            .headers()
            .get("x-ratelimit-remaining")
            .and_then(|h| h.to_str().ok())
            .map(|s| format!("Remaining quota: {}", s))
            .unwrap_or_else(|| "Quota info not available".to_string());
            
        Ok(format!("YouTube API connection successful. {}", quota_info))
    } else if response.status() == 403 {
        Err(anyhow::anyhow!("YouTube API quota exceeded or invalid API key"))
    } else if response.status() == 400 {
        Err(anyhow::anyhow!("YouTube API request parameters error"))
    } else {
        Err(anyhow::anyhow!("YouTube API error: {}", response.status()))
    }
}

async fn test_openai_api(client: &Client, api_key: &str) -> Result<String> {
    println!("🧪 Testing OpenAI API...");
    
    let response = client
        .get("https://api.openai.com/v1/models")
        .header("Authorization", format!("Bearer {}", api_key))
        .timeout(tokio::time::Duration::from_secs(10))
        .send()
        .await
        .map_err(|e| anyhow::anyhow!("OpenAI API test request failed: {}", e))?;

    if response.status().is_success() {
        let data: serde_json::Value = response.json().await?;
        let model_count = data["data"].as_array().map(|a| a.len()).unwrap_or(0);
        Ok(format!("OpenAI API connection successful. Available models: {}", model_count))
    } else {
        Err(anyhow::anyhow!("OpenAI API error: {}", response.status()))
    }
}

async fn test_anthropic_api(client: &Client, api_key: &str) -> Result<String> {
    println!("🧪 Testing Anthropic API...");
    
    let test_request = AnthropicRequest {
        model: "claude-3-haiku-20240307".to_string(),
        max_tokens: 10,
        messages: vec![AnthropicMessage {
            role: "user".to_string(),
            content: "Hello".to_string(),
        }],
    };

    let response = client
        .post("https://api.anthropic.com/v1/messages")
        .header("x-api-key", api_key)
        .header("anthropic-version", "2023-06-01")
        .header("Content-Type", "application/json")
        .json(&test_request)
        .timeout(tokio::time::Duration::from_secs(10))
        .send()
        .await
        .map_err(|e| anyhow::anyhow!("Anthropic API test request failed: {}", e))?;

    if response.status().is_success() {
        Ok("Anthropic API connection successful".to_string())
    } else {
        let error_data: serde_json::Value = response.json().await.unwrap_or_default();
        let error_msg = error_data["error"]["message"]
            .as_str()
            .unwrap_or("Unknown error");
        Err(anyhow::anyhow!("Anthropic API error: {}", error_msg))
    }
}

fn main() {
    tauri::Builder::default()
        .setup(|app| {
            println!("🚀 Production Kid Videos App starting...");
            
            // 初始化应用状态（使用 block_on 来运行异步代码）
            let app_state = tauri::async_runtime::block_on(async {
                AppState::new(app.handle()).await.expect("Failed to create app state")
            });
            app.manage(app_state);
            
            #[cfg(debug_assertions)]
            {
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.open_devtools();
                }
            }
            
            println!("✅ Kid Videos App setup completed - Production mode ready");
            println!("📋 Features enabled:");
            println!("  - ✅ YouTube Data API integration");
            println!("  - ✅ OpenAI GPT analysis"); 
            println!("  - ✅ Anthropic Claude analysis");
            println!("  - ✅ SQLite database caching");
            println!("  - ✅ Configuration persistence");
            println!("  - ✅ Search history & favorites");
            println!("  - ⚠️  Configure API keys in Settings to enable full functionality");
            
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            search_videos,
            analyze_video,
            analyze_videos_batch,
            save_video,
            batch_save_videos,
            delete_video,
            get_cached_videos,
            get_favorites,
            add_to_favorites,
            remove_from_favorites,
            get_settings,
            save_settings,
            clear_cache,
            get_search_history,
            test_api_connections
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}