import React, { useState } from 'react';
import { 
  Card, 
  Button, 
  Typography, 
  Space, 
  Tag, 
  Tooltip,
  Progress,
  message
} from 'antd';
import { 
  PlayCircleOutlined, 
  HeartOutlined,
  HeartFilled,
  ClockCircleOutlined,
  EyeOutlined,
  StarOutlined
} from '@ant-design/icons';
import { VideoCardProps } from '@/types';
import { useAppStore } from '@/stores/appStore';

const { Text, Title } = Typography;
const { Meta } = Card;

const VideoCard: React.FC<VideoCardProps> = ({
  video,
  showFavoriteButton = true,
  onPlay,
  onFavorite,
  className
}) => {
  const [isFavorited, setIsFavorited] = useState(false);
  const { addToFavorites, loading } = useAppStore();

  // 格式化时长
  const formatDuration = (seconds?: number) => {
    if (!seconds) return '';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // 格式化观看数
  const formatViewCount = (count?: number) => {
    if (!count) return '';
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    }
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  // 获取分数颜色和标签
  const getScoreInfo = (score?: number) => {
    if (!score) return { color: 'default', text: '未评分', class: '' };
    
    if (score >= 0.8) {
      return { color: 'success', text: '优秀', class: 'high-score' };
    } else if (score >= 0.6) {
      return { color: 'warning', text: '良好', class: 'medium-score' };
    } else {
      return { color: 'error', text: '一般', class: 'low-score' };
    }
  };

  const handleFavorite = async () => {
    try {
      await addToFavorites(video.id);
      setIsFavorited(true);
      message.success('已添加到收藏');
      onFavorite?.(video.id);
    } catch (error) {
      message.error('添加收藏失败');
    }
  };

  const handlePlay = () => {
    onPlay?.(video.id);
  };

  const educationScore = getScoreInfo(video.education_score);
  const safetyScore = getScoreInfo(video.safety_score);
  const overallScore = getScoreInfo(video.ai_score);

  return (
    <Card
      className={`video-card ${className || ''}`}
      hoverable
      cover={
        <div className="video-thumbnail" onClick={handlePlay}>
          <img 
            src={video.thumbnail_url || '/placeholder-video.png'} 
            alt={video.title}
            loading="lazy"
          />
          <div className="play-overlay">
            <PlayCircleOutlined className="play-icon" />
          </div>
          
          {/* 时长标签 */}
          {video.duration && (
            <div className="duration-badge">
              <ClockCircleOutlined />
              <span>{formatDuration(video.duration)}</span>
            </div>
          )}
        </div>
      }
      actions={[
        <Button 
          key="play"
          type="primary" 
          icon={<PlayCircleOutlined />}
          onClick={handlePlay}
          className="btn-kid-primary"
          block
        >
          观看
        </Button>,
        ...(showFavoriteButton ? [
          <Button 
            key="favorite"
            icon={isFavorited ? <HeartFilled /> : <HeartOutlined />}
            onClick={handleFavorite}
            loading={loading.saving}
            className={isFavorited ? 'favorited' : ''}
            danger={isFavorited}
          >
            收藏
          </Button>
        ] : [])
      ]}
    >
      <Meta
        title={
          <Tooltip title={video.title}>
            <Title level={5} ellipsis={{ rows: 2 }}>
              {video.title}
            </Title>
          </Tooltip>
        }
        description={
          <div className="video-info">
            {/* 频道信息 */}
            {video.channel_title && (
              <Text type="secondary" className="channel-name">
                {video.channel_title}
              </Text>
            )}
            
            {/* 观看数和发布时间 */}
            <div className="video-stats">
              {video.view_count && (
                <Space size={4}>
                  <EyeOutlined />
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {formatViewCount(video.view_count)}
                  </Text>
                </Space>
              )}
              {video.published_at && (
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {new Date(video.published_at).toLocaleDateString('zh-CN')}
                </Text>
              )}
            </div>

            {/* AI评分信息 */}
            <div className="score-section" style={{ marginTop: 12 }}>
              <Space direction="vertical" size={4} style={{ width: '100%' }}>
                {/* 总体评分 */}
                {video.ai_score && (
                  <div className="score-item">
                    <Space align="center" style={{ width: '100%', justifyContent: 'space-between' }}>
                      <Space size={4}>
                        <StarOutlined style={{ color: '#faad14' }} />
                        <Text style={{ fontSize: 12 }}>综合评分</Text>
                      </Space>
                      <Tag className={`score-tag ${overallScore.class}`}>
                        {overallScore.text}
                      </Tag>
                    </Space>
                    <Progress 
                      percent={Math.round((video.ai_score || 0) * 100)} 
                      size="small"
                      showInfo={false}
                      strokeColor={overallScore.color === 'success' ? '#52c41a' : 
                                  overallScore.color === 'warning' ? '#faad14' : '#ff4d4f'}
                    />
                  </div>
                )}

                {/* 详细评分 */}
                <div className="detailed-scores">
                  <Space size={8}>
                    {video.education_score && (
                      <Tooltip title={`教育价值: ${Math.round((video.education_score || 0) * 100)}%`}>
                        <Tag className={`score-tag ${educationScore.class}`}>
                          教育 {educationScore.text}
                        </Tag>
                      </Tooltip>
                    )}
                    {video.safety_score && (
                      <Tooltip title={`内容安全: ${Math.round((video.safety_score || 0) * 100)}%`}>
                        <Tag className={`score-tag ${safetyScore.class}`}>
                          安全 {safetyScore.text}
                        </Tag>
                      </Tooltip>
                    )}
                    {video.age_appropriate && (
                      <Tag color="green">
                        年龄适宜
                      </Tag>
                    )}
                  </Space>
                </div>
              </Space>
            </div>
          </div>
        }
      />
    </Card>
  );
};

export default VideoCard;