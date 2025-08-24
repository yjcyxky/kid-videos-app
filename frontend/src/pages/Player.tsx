import React, { useEffect, useState } from 'react';
import { 
  Card, 
  Button, 
  Typography, 
  Space, 
  Tag,
  Row,
  Col,
  Spin,
  Alert,
  message
} from 'antd';
import { 
  ArrowLeftOutlined,
  HeartOutlined,
  ShareAltOutlined,
  ExclamationCircleOutlined,
  StarOutlined,
  SafetyOutlined,
  BookOutlined
} from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { useAppStore } from '@/stores/appStore';
import { Video } from '@/types';
import useI18n from '@/hooks/useI18n';
import YouTubePlayer from '@/components/YouTubePlayer';
// import api from '@/services/api'; // TODO: Uncomment when implementing getVideo API

const { Title, Text, Paragraph } = Typography;

const Player: React.FC = () => {
  const navigate = useNavigate();
  const { videoId } = useParams<{ videoId: string }>();
  const { t, currentLanguage } = useI18n();
  const { addToFavorites, loading, searchResults } = useAppStore();
  const [video, setVideo] = useState<Video | null>(null);
  const [videoLoading, setVideoLoading] = useState(true);

  useEffect(() => {
    if (videoId) {
      loadVideo(videoId);
    }
  }, [videoId]);

  const loadVideo = async (id: string) => {
    try {
      setVideoLoading(true);
      
      // 首先尝试从搜索结果中找到视频
      const cachedVideo = searchResults.find(v => v.id === id);
      if (cachedVideo) {
        setVideo(cachedVideo);
      } else {
        try {
          const defaultVideo: Video = {
            id,
            title: t('player.defaultVideoTitle', 'Video Title'),
            description: t('player.defaultVideoDesc', 'Video Description'),
            channel_title: t('player.defaultChannelTitle', 'Channel Name'),
            duration: 0,
            view_count: 0,
            published_at: new Date().toISOString(),
            ai_score: 0,
            education_score: 0,
            safety_score: 0,
            age_appropriate: false,
            thumbnail_url: ''
          };
          setVideo(defaultVideo);
          message.warning(t('player.apiUnavailable', 'Unable to load complete video information'));
        } catch (apiError) {
          console.error('Failed to fetch video:', apiError);
          const defaultVideo: Video = {
            id,
            title: currentLanguage === 'zh-CN' ? '视频标题' : 'Video Title',
            description: currentLanguage === 'zh-CN' ? '视频描述' : 'Video Description',
            channel_title: currentLanguage === 'zh-CN' ? '频道名称' : 'Channel Name',
            duration: 0,
            view_count: 0,
            published_at: new Date().toISOString(),
            ai_score: 0,
            education_score: 0,
            safety_score: 0,
            age_appropriate: false,
            thumbnail_url: ''
          };
          setVideo(defaultVideo);
          message.error(t('messages.searchFailed', 'Failed to load video information'));
        }
      }
    } catch (error) {
      console.error('Error loading video:', error);
      message.error(t('messages.searchFailed', 'Failed to load video information'));
    } finally {
      setVideoLoading(false);
    }
  };

  const handleAddToFavorites = async () => {
    if (!video) return;
    
    try {
      await addToFavorites(video.id, t('player.favoriteNote', 'Added from player page'));
      message.success(t('messages.favoriteAdded', 'Added to favorites'));
    } catch (error) {
      message.error(t('messages.favoriteAddFailed', 'Failed to add to favorites'));
    }
  };

  const handleShare = () => {
    if (!video) return;
    
    const shareText = t('player.shareText', 'Recommend a great kids educational video: {{title}}').replace('{{title}}', video.title);
    
    if (navigator.share) {
      navigator.share({
        title: video.title,
        text: shareText,
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(`${shareText} ${window.location.href}`);
      message.success(t('player.linkCopied', 'Link copied to clipboard'));
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getScoreColor = (score: number) => {
    if (score >= 0.8) return '#52c41a';
    if (score >= 0.6) return '#faad14';
    return '#ff4d4f';
  };

  const getScoreText = (score: number) => {
    if (score >= 0.8) return t('video.excellent', 'Excellent');
    if (score >= 0.6) return t('video.good', 'Good');
    return t('video.average', 'Average');
  };

  if (videoLoading) {
    return (
      <div className="page-container">
        <div className="loading-spinner">
          <Spin size="large" />
          <div className="loading-text">{t('common.loading', 'Loading...')}</div>
        </div>
      </div>
    );
  }

  if (!video) {
    return (
      <div className="page-container">
        <Alert
          message={t('player.videoNotFound', 'Video not found')}
          description={t('player.videoNotFoundDesc', 'Sorry, we could not find the video you want to watch.')}
          type="error"
          showIcon
          action={
            <Button onClick={() => navigate('/')}>
              {t('player.backToHome', 'Back to Home')}
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* 页面头部 */}
      <div className="page-header" style={{ marginBottom: 24 }}>
        <Button 
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate(-1)}
        >
          {t('common.back', 'Back')}
        </Button>
      </div>

      <Row gutter={24}>
        {/* 视频播放区域 */}
        <Col xs={24} lg={16}>
          <Card className="video-player-card">
            {/* YouTube视频播放器 */}
            <YouTubePlayer
              videoId={video.id}
              autoplay={false}
              onReady={() => {
                console.log('Player ready for video:', video.id);
              }}
              onError={(error) => {
                console.error('Player error:', error);
              }}
              onStateChange={(state) => {
                console.log('Player state changed:', state);
              }}
            />

            {/* 视频标题和操作 */}
            <div style={{ marginTop: 16 }}>
              <Title level={4}>{video.title}</Title>
              
              <div style={{ marginBottom: 16 }}>
                <Space>
                  <Text type="secondary">{video.channel_title}</Text>
                  <Text type="secondary">•</Text>
                  <Text type="secondary">
                    {video.view_count?.toLocaleString()} {t('video.views', 'views')}
                  </Text>
                  <Text type="secondary">•</Text>
                  <Text type="secondary">
                    {new Date(video.published_at || '').toLocaleDateString(currentLanguage === 'zh-CN' ? 'zh-CN' : 'en-US')}
                  </Text>
                  {video.duration && (
                    <>
                      <Text type="secondary">•</Text>
                      <Text type="secondary">{formatDuration(video.duration)}</Text>
                    </>
                  )}
                </Space>
              </div>

              <Space size="middle">
                <Button 
                  icon={<HeartOutlined />}
                  onClick={handleAddToFavorites}
                  loading={loading.saving}
                >
                  {t('video.favorite', 'Favorite')}
                </Button>
                <Button 
                  icon={<ShareAltOutlined />}
                  onClick={handleShare}
                >
                  {t('player.shareVideo', 'Share')}
                </Button>
              </Space>
            </div>
          </Card>

          {/* 视频描述 */}
          {video.description && (
            <Card title={t('player.videoInfo', 'Video Information')} style={{ marginTop: 16 }}>
              <Paragraph style={{ whiteSpace: 'pre-line' }}>
                {video.description}
              </Paragraph>
            </Card>
          )}
        </Col>

        {/* 侧边信息栏 */}
        <Col xs={24} lg={8}>
          {/* AI评分信息 */}
          <Card title={<><StarOutlined /> {t('video.aiScore', 'AI Score')}</>} style={{ marginBottom: 16 }}>
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              {/* 综合评分 */}
              {video.ai_score && (
                <div className="score-item">
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    marginBottom: 8 
                  }}>
                    <Text strong>{t('video.overallScore', 'Overall Score')}</Text>
                    <Tag color={getScoreColor(video.ai_score)}>
                      {getScoreText(video.ai_score)}
                    </Tag>
                  </div>
                  <div style={{
                    width: '100px',
                    height: '8px',
                    background: '#f0f0f0',
                    borderRadius: '4px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      width: `${video.ai_score * 100}%`,
                      height: '100%',
                      background: getScoreColor(video.ai_score),
                      borderRadius: '4px'
                    }} />
                  </div>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {Math.round(video.ai_score * 100)}% {t('player.recommendIndex', 'Recommendation Index')}
                  </Text>
                </div>
              )}

              {/* 详细评分 */}
              <div className="detailed-scores">
                {video.education_score && (
                  <div className="score-detail">
                    <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                      <Space>
                        <BookOutlined style={{ color: '#1890ff' }} />
                        <Text>{t('video.educationScore', 'Education Value')}</Text>
                      </Space>
                      <Text strong>{Math.round(video.education_score * 100)}%</Text>
                    </Space>
                  </div>
                )}

                {video.safety_score && (
                  <div className="score-detail" style={{ marginTop: 8 }}>
                    <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                      <Space>
                        <SafetyOutlined style={{ color: '#52c41a' }} />
                        <Text>{t('video.safetyScore', 'Safety Score')}</Text>
                      </Space>
                      <Text strong>{Math.round(video.safety_score * 100)}%</Text>
                    </Space>
                  </div>
                )}

                {video.age_appropriate && (
                  <div style={{ marginTop: 12 }}>
                    <Tag color="green" icon={<SafetyOutlined />}>
                      {t('video.ageAppropriate', 'Age Appropriate')} ✓
                    </Tag>
                  </div>
                )}
              </div>
            </Space>
          </Card>

          {/* 家长提醒 */}
          <Card title={<><ExclamationCircleOutlined /> {t('player.parentalGuidance', 'Parental Guidance')}</>}>
            <Alert
              message={t('player.watchSuggestion', 'Viewing Suggestions')}
              description={
                <ul style={{ margin: '8px 0', paddingLeft: '16px' }}>
                  <li>{t('player.parentSupervision', 'Parental supervision recommended')}</li>
                  <li>{t('player.ageRecommendation', 'Suitable for ages 3-6')}</li>
                  <li>{t('player.watchDuration', 'Recommended viewing time should not exceed 30 minutes')}</li>
                  <li>{t('player.interactiveViewing', 'Encourage children to participate interactively')}</li>
                </ul>
              }
              type="info"
              showIcon={false}
            />
            
            <div style={{ marginTop: 12 }}>
              <Text type="secondary" style={{ fontSize: 12 }}>
                * {t('player.aiAnalysisNote', 'This score is generated by AI intelligent analysis for reference only. Parents should make judgments based on their children\'s actual situation.')}
              </Text>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Player;