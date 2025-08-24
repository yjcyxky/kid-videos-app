# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a cross-platform desktop application for intelligent children's video filtering, built with Tauri + React + TypeScript. The app uses AI (OpenAI/Anthropic) to analyze and filter YouTube videos for child safety and educational value.

## Development Commands

### Setup and Installation
```bash
npm run setup              # Install all dependencies (root + frontend)
```

### Development
```bash
npm run dev                # Start full Tauri desktop app (recommended)
cargo tauri dev            # Alternative way to start desktop app
npm run dev:frontend       # Frontend only (browser preview mode)
```

### Building
```bash
npm run build              # Build complete Tauri app for production
cargo tauri build          # Alternative build command
npm run build:frontend     # Build frontend only
```

### Testing and Quality
```bash
npm run test:frontend      # Run frontend tests (Vitest)
npm run test:backend       # Run Rust tests
npm run lint:frontend      # ESLint frontend code
npm run lint:backend       # Clippy Rust code
npm run type-check         # TypeScript type checking (frontend)
```

### Maintenance
```bash
npm run clean              # Clean all build artifacts and node_modules
```

## Architecture Overview

### Dual Environment Support
The app operates in two distinct modes:
- **Production Mode (Tauri)**: Desktop app with real API integrations
- **Browser Mode**: Web preview with demo data

### Service Layer Pattern
The API service layer (`src/services/`) uses a factory pattern to automatically switch between implementations:

- `ApiFactory` detects the environment and returns appropriate service
- `TauriApiService` calls Rust backend commands via Tauri
- `MockApiService` provides demo data for browser preview

### Frontend Architecture
```
frontend/src/
├── services/          # API abstraction layer
│   ├── api.ts         # Factory and environment detection  
│   ├── interfaces.ts  # Shared API interfaces
│   ├── tauri.ts       # Tauri backend integration
│   └── mock.ts        # Browser preview data
├── stores/            # Zustand state management
├── pages/             # React Router pages
├── components/        # Reusable UI components
├── hooks/             # Custom React hooks (i18n, theme)
├── i18n/              # Internationalization (zh-CN, en-US)
└── types/             # TypeScript definitions
```

### Backend Architecture (Rust + Tauri)
```
src-tauri/src/
└── main.rs           # All Tauri commands and business logic
```

Key Tauri commands:
- `search_videos` - YouTube Data API integration with AI analysis
- `analyze_video` - Individual video AI analysis 
- `get_settings`/`save_settings` - Configuration persistence
- `test_api_connections` - API key validation
- Video management (save, delete, favorites)

### Configuration System
Settings are managed through:
- **Frontend**: Comprehensive Settings page with 6 configuration sections
- **Backend**: Persistent JSON file storage in app data directory
- **Types**: Shared `AppSettings` interface between frontend/backend

Settings include:
- API keys (OpenAI, Anthropic, YouTube)
- Filter presets and custom prompts
- Search preferences and duration limits
- Alarm/timer functionality
- Advanced UI and notification settings

### Data Flow
1. User configures API keys in Settings
2. Search request → Tauri command → YouTube API
3. Videos → AI analysis (OpenAI/Anthropic) 
4. Filtered results → Frontend display
5. Configuration auto-saved to JSON file

## Key Implementation Details

### Environment Detection & API Service Selection
```typescript
const isTauriApp = () => {
  return typeof window !== 'undefined' && 
         typeof (window as any).__TAURI__ !== 'undefined'
}
```

**Important**: Mock data is ONLY used for unit tests. In all other modes:
- **Tauri Mode** (`npm run dev`, `cargo tauri dev`): Uses TauriApiService with real API calls
- **Browser Mode** (`npm run dev:frontend`): Uses BrowserApiService which prompts for API configuration
- **Test Mode**: Uses MockApiService with demo data

### API Integration Pattern
The app follows Chrome extension patterns for:
- Batch video details fetching
- Retry mechanisms with exponential backoff
- Proper error handling and fallbacks

### Configuration Sections
Settings page includes 6 sections matching Chrome extension:
- AI Configuration (OpenAI/Anthropic keys)
- YouTube Configuration (Data API key)
- Filter Conditions (6 presets + custom prompts)
- Search Settings (platforms, language, duration)
- Alarm Settings (viewing time controls)
- Advanced Settings (theme, notifications, stats)

### State Management
Uses Zustand with persistence for:
- Search results and current query
- User settings and preferences
- Favorites and search history
- Loading states for async operations

### Internationalization (i18n)
The app supports both Chinese (zh-CN) and English (en-US):
- Translation files: `frontend/src/i18n/locales/`
- Language switching in Settings page
- All UI text should use translation keys via `t()` function
- Avoid hardcoded strings in components
- For dynamic presets, use functions like `getFilterPresets(t)` to get localized content
- Settings form fields merge existing values to prevent data loss when switching sections

## Development Notes

### Frontend Development
- Uses Vite for fast hot reloading
- Ant Design component library for UI
- LESS variables for theming
- React Router for navigation
- i18next for internationalization

### Backend Development
- Single `main.rs` file contains all Tauri commands
- Uses `reqwest` for HTTP API calls to YouTube/OpenAI/Anthropic
- Configuration stored as JSON in app data directory
- SQLite database structure defined but simplified for immediate production use

### API Keys Required for Production
- YouTube Data API (Google Cloud Console)
- OpenAI API or Anthropic API (at least one required)

### Testing
- Frontend: Vitest for unit tests
- Backend: Cargo test for Rust tests
- Built-in test page in app for integration testing

## Common Issues

### TypeScript Errors
If encountering type mismatches in `AppSettings`, ensure frontend types in `src/types/index.ts` match backend Rust structs.

### API Configuration
The app will show fallback content if API keys are not configured. Users must configure keys in Settings for full functionality.

### Build Warnings
The bundle identifier warning for `.app` suffix can be ignored - it's a macOS naming convention notice.