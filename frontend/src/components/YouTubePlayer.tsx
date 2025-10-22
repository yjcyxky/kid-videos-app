import React, { useEffect, useRef, useState } from 'react';
import { Button, Slider, Space, Spin, Alert, message } from 'antd';
import {
  PlayCircleOutlined,
  PauseCircleOutlined,
  SoundOutlined,
  ExpandOutlined,
  FullscreenExitOutlined,
  ReloadOutlined,
  LoadingOutlined
} from '@ant-design/icons';
import useI18n from '@/hooks/useI18n';

interface YouTubePlayerProps {
  videoId: string;
  autoplay?: boolean;
  onReady?: () => void;
  onError?: (error: any) => void;
  onStateChange?: (state: number) => void;
}

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

const YouTubePlayer: React.FC<YouTubePlayerProps> = ({
  videoId,
  autoplay = false,
  onReady,
  onError,
  onStateChange
}) => {
  const { t } = useI18n();
  const playerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlayerReady, setIsPlayerReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(100);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEmbedDisabled, setIsEmbedDisabled] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const initTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const retryCountRef = useRef(0);
  const MAX_RETRIES = 3;

  // Load YouTube IFrame API
  useEffect(() => {
    const loadYouTubeAPI = () => {
      // Check if API is already loaded
      if (window.YT && window.YT.Player) {
        initializePlayer();
        return;
      }

      // Load the IFrame Player API code asynchronously
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

      // Create callback for when API is ready
      window.onYouTubeIframeAPIReady = () => {
        initializePlayer();
      };
    };

    loadYouTubeAPI();

    // Setup ESC key listener for exiting fullscreen
    const handleEscKey = async (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        try {
          const isTauri = typeof window !== 'undefined' &&
                         ((window as any).__TAURI__ || (window as any).__IS_TAURI_APP__);
          if (isTauri) {
            const { getCurrentWindow } = await import('@tauri-apps/api/window');
            const appWindow = getCurrentWindow();
            await appWindow.setFullscreen(false);
            setIsFullscreen(false);
          }
        } catch (error) {
          console.error('Failed to exit fullscreen:', error);
        }
      }
    };

    window.addEventListener('keydown', handleEscKey);

    return () => {
      window.removeEventListener('keydown', handleEscKey);
      if (initTimeoutRef.current) {
        clearTimeout(initTimeoutRef.current);
        initTimeoutRef.current = null;
      }
      if (playerRef.current) {
        try {
          playerRef.current.destroy();
        } catch (e) {
          console.error('Error destroying player:', e);
        }
      }
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, [videoId, isFullscreen]);

  const initializePlayer = () => {
    // 清理之前的timeout，防止重复初始化
    if (initTimeoutRef.current) {
      clearTimeout(initTimeoutRef.current);
      initTimeoutRef.current = null;
    }

    if (!window.YT || !window.YT.Player || !containerRef.current) {
      initTimeoutRef.current = setTimeout(initializePlayer, 100);
      return;
    }

    try {
      playerRef.current = new window.YT.Player(containerRef.current, {
        videoId: videoId,
        width: '100%',
        height: '100%',
        playerVars: {
          autoplay: autoplay ? 1 : 0,
          controls: 1, // Enable YouTube native controls (including fullscreen)
          rel: 0, // Don't show related videos
          modestbranding: 1, // Minimal YouTube branding
          fs: 1, // Allow fullscreen
          iv_load_policy: 3, // Hide annotations
          disablekb: 0, // Enable keyboard controls
          playsinline: 1, // Play inline on mobile
          origin: window.location.origin,
          widget_referrer: window.location.href
        },
        events: {
          onReady: handlePlayerReady,
          onStateChange: handlePlayerStateChange,
          onError: handlePlayerError
        }
      });
    } catch (error) {
      console.error('Error initializing YouTube player:', error);
      setError(t('player.initError', 'Failed to initialize video player'));
      setIsLoading(false);
    }
  };

  const handlePlayerReady = (_event: any) => {
    setIsPlayerReady(true);
    setIsLoading(false);
    setError(null);
    setIsEmbedDisabled(false);
    retryCountRef.current = 0; // 重置重试计数器

    // Set initial volume
    if (playerRef.current) {
      playerRef.current.setVolume(volume);
      const duration = playerRef.current.getDuration();
      setDuration(duration);
    }

    onReady?.();
  };

  const handlePlayerStateChange = (event: any) => {
    const state = event.data;
    
    // Update playing state
    if (state === window.YT.PlayerState.PLAYING) {
      setIsPlaying(true);
      setIsLoading(false); // Hide loading when playing
      startProgressTracking();
    } else if (state === window.YT.PlayerState.PAUSED) {
      setIsPlaying(false);
      setIsLoading(false); // Hide loading when paused
      stopProgressTracking();
    } else if (state === window.YT.PlayerState.ENDED) {
      setIsPlaying(false);
      setIsLoading(false); // Hide loading when ended
      stopProgressTracking();
      setCurrentTime(duration);
      
      // Prevent related videos from showing
      if (playerRef.current) {
        playerRef.current.stopVideo();
      }
    } else if (state === window.YT.PlayerState.BUFFERING) {
      // Only show loading during initial buffering, not during playback buffering
      if (!isPlaying) {
        setIsLoading(true);
      }
    } else if (state === window.YT.PlayerState.CUED) {
      setIsLoading(false);
    }

    onStateChange?.(state);
  };

  const handlePlayerError = (event: any) => {
    const errorCode = event.data;
    let errorMessage = t('player.unknownError', 'An unknown error occurred');
    let shouldAutoRetry = false;

    switch (errorCode) {
      case 2:
        errorMessage = t('player.invalidVideoId', 'Invalid video ID');
        break;
      case 5:
        errorMessage = t('player.html5Error', 'HTML5 player error');
        // HTML5错误可能是临时的，允许重试
        shouldAutoRetry = true;
        break;
      case 100:
        errorMessage = t('player.videoNotFound', 'Video not found or has been deleted');
        break;
      case 101:
      case 150:
        // 错误码101/150可能是临时性的网络/加载问题
        // 只有在多次重试后才判定为真正的嵌入禁用
        retryCountRef.current += 1;

        if (retryCountRef.current >= MAX_RETRIES) {
          // 达到最大重试次数，判定为真正的嵌入禁用
          errorMessage = t('player.embedDisabled', 'This video cannot be played here. Please watch it on YouTube.');
          setIsEmbedDisabled(true);
          setError(errorMessage);
          setIsLoading(false);
          message.error(errorMessage);
        } else {
          // 还有重试机会，显示临时错误并自动重试
          errorMessage = t('player.loadingError', `Loading failed, retrying (${retryCountRef.current}/${MAX_RETRIES})...`);
          console.log(`🔄 YouTube Player Error ${errorCode}, auto-retry ${retryCountRef.current}/${MAX_RETRIES}`);

          // 使用指数退避策略自动重试
          const retryDelay = 1000 * retryCountRef.current;
          setTimeout(() => {
            retry();
          }, retryDelay);

          // 显示提示但不算作错误
          message.warning(errorMessage);
          return; // 不继续执行后续的错误处理
        }
        break;
      default:
        errorMessage = t('player.playbackError', 'Video playback error');
        shouldAutoRetry = true;
    }

    // 对于可重试的错误（如HTML5错误），尝试自动重试
    if (shouldAutoRetry && retryCountRef.current < MAX_RETRIES) {
      retryCountRef.current += 1;
      errorMessage = t('player.temporaryError', `Temporary error, retrying (${retryCountRef.current}/${MAX_RETRIES})...`);
      console.log(`🔄 YouTube Player Error ${errorCode}, auto-retry ${retryCountRef.current}/${MAX_RETRIES}`);

      const retryDelay = 1000 * retryCountRef.current;
      setTimeout(() => {
        retry();
      }, retryDelay);

      message.warning(errorMessage);
      return;
    }

    setError(errorMessage);
    setIsLoading(false);
    message.error(errorMessage);
    onError?.(event);
  };

  const startProgressTracking = () => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }

    progressIntervalRef.current = setInterval(() => {
      if (playerRef.current && playerRef.current.getCurrentTime) {
        const time = playerRef.current.getCurrentTime();
        setCurrentTime(time);
      }
    }, 1000);
  };

  const stopProgressTracking = () => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
  };

  // Control functions
  const togglePlayPause = () => {
    if (!playerRef.current) return;

    if (isPlaying) {
      playerRef.current.pauseVideo();
    } else {
      playerRef.current.playVideo();
    }
  };

  const handleVolumeChange = (value: number) => {
    setVolume(value);
    if (playerRef.current) {
      playerRef.current.setVolume(value);
    }
  };

  const handleProgressChange = (value: number) => {
    const newTime = (value / 100) * duration;
    setCurrentTime(newTime);
    if (playerRef.current) {
      playerRef.current.seekTo(newTime, true);
    }
  };

  const toggleFullscreen = async () => {
    console.log('🎬 Attempting to toggle fullscreen, current state:', isFullscreen);

    try {
      // Check if we're in Tauri environment
      const isTauri = typeof window !== 'undefined' &&
                      ((window as any).__TAURI__ || (window as any).__IS_TAURI_APP__);

      console.log('🔍 Environment check:', {
        isTauri,
        hasTauriGlobal: !!(window as any).__TAURI__,
        isTauriAppFlag: !!(window as any).__IS_TAURI_APP__
      });

      if (isTauri) {
        console.log('🚀 Using Tauri Window API for fullscreen...');

        try {
          const { getCurrentWindow } = await import('@tauri-apps/api/window');
          const appWindow = getCurrentWindow();

          if (isFullscreen) {
            // Exit fullscreen
            console.log('📤 Exiting fullscreen...');
            await appWindow.setFullscreen(false);
            setIsFullscreen(false);
            console.log('✅ Exited fullscreen mode (Tauri)');
            message.success(t('player.exitedFullscreen', 'Exited fullscreen'));
          } else {
            // Enter fullscreen
            console.log('📥 Entering fullscreen...');
            await appWindow.setFullscreen(true);
            setIsFullscreen(true);
            console.log('✅ Entered fullscreen mode (Tauri)');
            message.success(t('player.enteredFullscreen', 'Entered fullscreen'));
          }
        } catch (tauriError) {
          console.error('❌ Tauri fullscreen failed:', tauriError);
          throw new Error(`Tauri fullscreen error: ${tauriError}`);
        }
      } else {
        console.log('🌐 Using browser Fullscreen API...');

        // Fallback to standard browser Fullscreen API
        const playerContainer = containerRef.current?.closest('.youtube-player-container') as HTMLElement;

        if (!playerContainer) {
          console.error('❌ Player container not found');
          return;
        }

        const isInFullscreen = document.fullscreenElement ||
                              (document as any).webkitFullscreenElement ||
                              (document as any).mozFullScreenElement;

        if (isInFullscreen) {
          // Exit fullscreen
          if (document.exitFullscreen) {
            await document.exitFullscreen();
          } else if ((document as any).webkitExitFullscreen) {
            await (document as any).webkitExitFullscreen();
          } else if ((document as any).mozCancelFullScreen) {
            await (document as any).mozCancelFullScreen();
          }
          setIsFullscreen(false);
          console.log('✅ Exited fullscreen mode (Browser)');
        } else {
          // Enter fullscreen
          if (playerContainer.requestFullscreen) {
            await playerContainer.requestFullscreen();
          } else if ((playerContainer as any).webkitRequestFullscreen) {
            await (playerContainer as any).webkitRequestFullscreen();
          } else if ((playerContainer as any).mozRequestFullScreen) {
            await (playerContainer as any).mozRequestFullScreen();
          } else if ((playerContainer as any).msRequestFullscreen) {
            await (playerContainer as any).msRequestFullscreen();
          }
          setIsFullscreen(true);
          console.log('✅ Entered fullscreen mode (Browser)');
        }
      }
    } catch (error) {
      console.error('❌ Fullscreen toggle failed:', error);
      console.error('Error details:', {
        name: (error as any)?.name,
        message: (error as any)?.message,
        stack: (error as any)?.stack
      });
      message.error(`${t('player.fullscreenError', 'Failed to toggle fullscreen')}: ${(error as any)?.message || error}`);
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const retry = () => {
    console.log('🔄 Retrying player initialization...');

    // 1. 清理旧的player实例
    if (playerRef.current) {
      try {
        playerRef.current.destroy();
        playerRef.current = null;
        console.log('✅ Old player instance destroyed');
      } catch (e) {
        console.error('❌ Error destroying player:', e);
      }
    }

    // 2. 清理进度跟踪定时器
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }

    // 3. 清理初始化定时器
    if (initTimeoutRef.current) {
      clearTimeout(initTimeoutRef.current);
      initTimeoutRef.current = null;
    }

    // 4. 重置所有状态
    setError(null);
    setIsLoading(true);
    setIsEmbedDisabled(false);
    setIsPlayerReady(false);
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);

    // 5. 重新初始化播放器
    // 使用setTimeout确保DOM清理完成
    setTimeout(() => {
      initializePlayer();
    }, 100);
  };

  const openInYouTube = () => {
    window.open(`https://www.youtube.com/watch?v=${videoId}`, '_blank');
  };

  // Render error state
  if (error && isEmbedDisabled) {
    return (
      <div className="youtube-player-container" style={{ width: '100%', aspectRatio: '16/9', position: 'relative' }}>
        <Alert
          message={t('player.embedDisabled', 'Video Cannot Be Played Here')}
          description={
            <div>
              <p>{t('player.embedDisabledDesc', 'This video has embedding disabled by the uploader.')}</p>
              <Space style={{ marginTop: 16 }}>
                <Button type="primary" onClick={openInYouTube}>
                  {t('player.watchOnYouTube', 'Watch on YouTube')}
                </Button>
                <Button onClick={retry} icon={<ReloadOutlined />}>
                  {t('player.tryAgain', 'Try Again')}
                </Button>
              </Space>
            </div>
          }
          type="warning"
          showIcon
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className="youtube-player-container" style={{ width: '100%', aspectRatio: '16/9', position: 'relative' }}>
        <Alert
          message={t('player.playbackError', 'Playback Error')}
          description={
            <div>
              <p>{error}</p>
              <Button onClick={retry} icon={<ReloadOutlined />} style={{ marginTop: 16 }}>
                {t('player.retry', 'Retry')}
              </Button>
            </div>
          }
          type="error"
          showIcon
        />
      </div>
    );
  }

  return (
    <div
      className="youtube-player-container"
      style={{
        width: '100%',
        position: isFullscreen ? 'fixed' : 'relative',
        top: isFullscreen ? 0 : 'auto',
        left: isFullscreen ? 0 : 'auto',
        right: isFullscreen ? 0 : 'auto',
        bottom: isFullscreen ? 0 : 'auto',
        zIndex: isFullscreen ? 9999 : 'auto',
        background: isFullscreen ? '#000' : 'transparent'
      }}
    >
      {/* Video Container */}
      <div style={{
        width: '100%',
        height: isFullscreen ? '100vh' : 'auto',
        aspectRatio: isFullscreen ? 'auto' : '16/9',
        background: '#000',
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div ref={containerRef} style={{
          width: '100%',
          height: isFullscreen ? '100%' : '100%'
        }} />
        
        {/* Loading Overlay - Only show when truly loading, not during playback */}
        {isLoading && !isPlayerReady && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0, 0, 0, 0.7)',
            zIndex: 10,
            pointerEvents: 'none'
          }}>
            <Spin indicator={<LoadingOutlined style={{ fontSize: 48, color: '#fff' }} spin />} />
          </div>
        )}
      </div>

      {/* Custom Controls */}
      {isPlayerReady && (
        <div className="player-controls" style={{
          padding: '12px',
          background: isFullscreen ? 'rgba(0, 0, 0, 0.8)' : '#f0f0f0',
          borderTop: isFullscreen ? 'none' : '1px solid #d9d9d9',
          position: isFullscreen ? 'absolute' : 'relative',
          bottom: isFullscreen ? 0 : 'auto',
          left: isFullscreen ? 0 : 'auto',
          right: isFullscreen ? 0 : 'auto',
          zIndex: isFullscreen ? 10000 : 'auto'
        }}>
          <Space direction="vertical" style={{ width: '100%' }} size="small">
            {/* Progress Bar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '12px', minWidth: '45px' }}>{formatTime(currentTime)}</span>
              <Slider
                value={(currentTime / duration) * 100 || 0}
                onChange={handleProgressChange}
                tooltip={{ formatter: (value) => formatTime((value! / 100) * duration) }}
                style={{ flex: 1, margin: 0 }}
              />
              <span style={{ fontSize: '12px', minWidth: '45px' }}>{formatTime(duration)}</span>
            </div>

            {/* Control Buttons */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Space>
                {/* Play/Pause */}
                <Button
                  type="primary"
                  shape="circle"
                  icon={isPlaying ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
                  onClick={togglePlayPause}
                  size="large"
                />

                {/* Volume Control */}
                <Space size="small">
                  <SoundOutlined />
                  <Slider
                    value={volume}
                    onChange={handleVolumeChange}
                    style={{ width: 100 }}
                    tooltip={{ formatter: (value) => `${value}%` }}
                  />
                </Space>
              </Space>

              {/* Fullscreen - Custom implementation for Tauri */}
              <Button
                icon={isFullscreen ? <FullscreenExitOutlined /> : <ExpandOutlined />}
                onClick={toggleFullscreen}
                title={isFullscreen ? t('player.exitFullscreen', 'Exit Fullscreen (ESC)') : t('player.fullscreen', 'Fullscreen')}
                type={isFullscreen ? 'primary' : 'default'}
              >
                {isFullscreen ? t('player.exitFullscreen', 'Exit') : t('player.fullscreen', 'Fullscreen')}
              </Button>
            </div>
          </Space>
        </div>
      )}
    </div>
  );
};

export default YouTubePlayer;