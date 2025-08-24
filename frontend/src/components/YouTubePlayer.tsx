import React, { useEffect, useRef, useState } from 'react';
import { Button, Slider, Space, Spin, Alert, message } from 'antd';
import {
  PlayCircleOutlined,
  PauseCircleOutlined,
  SoundOutlined,
  ExpandOutlined,
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
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

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

    return () => {
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
  }, [videoId]);

  const initializePlayer = () => {
    if (!window.YT || !window.YT.Player || !containerRef.current) {
      setTimeout(initializePlayer, 100);
      return;
    }

    try {
      playerRef.current = new window.YT.Player(containerRef.current, {
        videoId: videoId,
        width: '100%',
        height: '100%',
        playerVars: {
          autoplay: autoplay ? 1 : 0,
          // controls: 0, // Hide default controls
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
    
    switch (errorCode) {
      case 2:
        errorMessage = t('player.invalidVideoId', 'Invalid video ID');
        break;
      case 5:
        errorMessage = t('player.html5Error', 'HTML5 player error');
        break;
      case 100:
        errorMessage = t('player.videoNotFound', 'Video not found or has been deleted');
        break;
      case 101:
      case 150:
        errorMessage = t('player.embedDisabled', 'This video cannot be played here. Please watch it on YouTube.');
        setIsEmbedDisabled(true);
        break;
      default:
        errorMessage = t('player.playbackError', 'Video playback error');
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

  const toggleFullscreen = () => {
    // Get the entire player container for fullscreen
    const playerContainer = containerRef.current?.closest('.youtube-player-container');
    
    if (!playerContainer) return;
    
    // Check if already in fullscreen
    const isInFullscreen = document.fullscreenElement || 
                          (document as any).webkitFullscreenElement || 
                          (document as any).mozFullScreenElement;
    
    if (isInFullscreen) {
      // Exit fullscreen
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if ((document as any).webkitExitFullscreen) {
        (document as any).webkitExitFullscreen();
      } else if ((document as any).mozCancelFullScreen) {
        (document as any).mozCancelFullScreen();
      }
    } else {
      // Enter fullscreen
      if (playerContainer.requestFullscreen) {
        playerContainer.requestFullscreen();
      } else if ((playerContainer as any).webkitRequestFullscreen) {
        (playerContainer as any).webkitRequestFullscreen();
      } else if ((playerContainer as any).mozRequestFullScreen) {
        (playerContainer as any).mozRequestFullScreen();
      } else if ((playerContainer as any).msRequestFullscreen) {
        (playerContainer as any).msRequestFullscreen();
      }
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const retry = () => {
    setError(null);
    setIsLoading(true);
    setIsEmbedDisabled(false);
    initializePlayer();
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
    <div className="youtube-player-container" style={{ width: '100%', position: 'relative' }}>
      {/* Video Container */}
      <div style={{ width: '100%', aspectRatio: '16/9', background: '#000', position: 'relative' }}>
        <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
        
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
          background: '#f0f0f0',
          borderTop: '1px solid #d9d9d9'
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

              {/* Fullscreen */}
              <Button
                icon={<ExpandOutlined />}
                onClick={toggleFullscreen}
                title={t('player.fullscreen', 'Fullscreen')}
              >
                {t('player.fullscreen', 'Fullscreen')}
              </Button>
            </div>
          </Space>
        </div>
      )}
    </div>
  );
};

export default YouTubePlayer;