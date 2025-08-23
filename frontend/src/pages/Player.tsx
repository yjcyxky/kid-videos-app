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

const { Title, Text, Paragraph } = Typography;

const Player: React.FC = () => {
  const navigate = useNavigate();
  const { videoId } = useParams<{ videoId: string }>();
  const { addToFavorites, loading } = useAppStore();
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
      // 这里应该从数据库或缓存中加载视频信息
      // 暂时使用模拟数据
      const mockVideo: Video = {
        id,
        title: '儿童数学启蒙 - 认识数字1到10',
        description: '这是一个专为3-6岁儿童设计的数学启蒙视频，通过生动有趣的动画和互动游戏，帮助孩子们认识数字1到10，培养数学兴趣和基础认知能力。\n\n视频内容包括：\n- 数字的形状和写法\n- 数数练习\n- 简单的数量概念\n- 趣味数学游戏',
        channel_title: '儿童教育频道',
        duration: 600, // 10分钟
        view_count: 125000,
        published_at: '2024-01-15',
        ai_score: 0.88,
        education_score: 0.92,
        safety_score: 0.95,
        age_appropriate: true,
        thumbnail_url: 'https://example.com/thumbnail.jpg'
      };
      setVideo(mockVideo);
    } catch (error) {
      message.error('加载视频信息失败');
    } finally {
      setVideoLoading(false);
    }
  };

  const handleAddToFavorites = async () => {
    if (!video) return;
    
    try {
      await addToFavorites(video.id, '来自播放页面的收藏');
      message.success('已添加到收藏');
    } catch (error) {
      message.error('添加收藏失败');
    }
  };

  const handleShare = () => {
    if (!video) return;
    
    const shareText = `推荐一个不错的儿童教育视频: ${video.title}`;
    
    if (navigator.share) {
      navigator.share({
        title: video.title,
        text: shareText,
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(`${shareText} ${window.location.href}`);
      message.success('链接已复制到剪贴板');
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
    if (score >= 0.8) return '优秀';
    if (score >= 0.6) return '良好';
    return '一般';
  };

  if (videoLoading) {
    return (
      <div className="page-container">
        <div className="loading-spinner">
          <Spin size="large" />
          <div className="loading-text">正在加载视频信息...</div>
        </div>
      </div>
    );
  }

  if (!video) {
    return (
      <div className="page-container">
        <Alert
          message="视频未找到"
          description="抱歉，无法找到您要观看的视频。"
          type="error"
          showIcon
          action={
            <Button onClick={() => navigate('/')}>
              返回首页
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
          返回
        </Button>
      </div>

      <Row gutter={24}>
        {/* 视频播放区域 */}
        <Col xs={24} lg={16}>
          <Card className="video-player-card">
            {/* 视频播放器 */}
            <div className="video-player" style={{
              width: '100%',
              aspectRatio: '16/9',
              background: '#000',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative'
            }}>
              {video.thumbnail_url ? (
                <img 
                  src={video.thumbnail_url}
                  alt={video.title}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    borderRadius: '8px'
                  }}
                />
              ) : (
                <div style={{ color: '#fff', fontSize: '18px' }}>
                  🎥 视频播放器
                  <br />
                  <Text style={{ color: '#ccc', fontSize: '14px' }}>
                    (实际应用中这里会嵌入YouTube播放器)
                  </Text>
                </div>
              )}
              
              {/* 播放按钮覆盖层 */}
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                fontSize: '48px',
                color: '#fff',
                cursor: 'pointer',
                background: 'rgba(0,0,0,0.3)',
                borderRadius: '50%',
                padding: '16px'
              }}>
                ▶️
              </div>
            </div>

            {/* 视频标题和操作 */}
            <div style={{ marginTop: 16 }}>
              <Title level={4}>{video.title}</Title>
              
              <div style={{ marginBottom: 16 }}>
                <Space>
                  <Text type="secondary">{video.channel_title}</Text>
                  <Text type="secondary">•</Text>
                  <Text type="secondary">
                    {video.view_count?.toLocaleString()} 次观看
                  </Text>
                  <Text type="secondary">•</Text>
                  <Text type="secondary">
                    {new Date(video.published_at || '').toLocaleDateString('zh-CN')}
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
                  收藏
                </Button>
                <Button 
                  icon={<ShareAltOutlined />}
                  onClick={handleShare}
                >
                  分享
                </Button>
              </Space>
            </div>
          </Card>

          {/* 视频描述 */}
          {video.description && (
            <Card title="视频介绍" style={{ marginTop: 16 }}>
              <Paragraph style={{ whiteSpace: 'pre-line' }}>
                {video.description}
              </Paragraph>
            </Card>
          )}
        </Col>

        {/* 侧边信息栏 */}
        <Col xs={24} lg={8}>
          {/* AI评分信息 */}
          <Card title={<><StarOutlined /> AI智能评分</>} style={{ marginBottom: 16 }}>
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
                    <Text strong>综合评分</Text>
                    <Tag color={getScoreColor(video.ai_score)}>
                      {getScoreText(video.ai_score)}
                    </Tag>
                  </div>
                  <div style={{
                    width: '100%',
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
                    {Math.round(video.ai_score * 100)}% 推荐指数
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
                        <Text>教育价值</Text>
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
                        <Text>内容安全</Text>
                      </Space>
                      <Text strong>{Math.round(video.safety_score * 100)}%</Text>
                    </Space>
                  </div>
                )}

                {video.age_appropriate && (
                  <div style={{ marginTop: 12 }}>
                    <Tag color="green" icon={<SafetyOutlined />}>
                      年龄适宜 ✓
                    </Tag>
                  </div>
                )}
              </div>
            </Space>
          </Card>

          {/* 家长提醒 */}
          <Card title={<><ExclamationCircleOutlined /> 家长提醒</>}>
            <Alert
              message="观看建议"
              description={
                <ul style={{ margin: '8px 0', paddingLeft: '16px' }}>
                  <li>建议家长陪同观看</li>
                  <li>适合3-6岁儿童</li>
                  <li>建议观看时长不超过30分钟</li>
                  <li>鼓励孩子互动参与</li>
                </ul>
              }
              type="info"
              showIcon={false}
            />
            
            <div style={{ marginTop: 12 }}>
              <Text type="secondary" style={{ fontSize: 12 }}>
                * 此评分由AI智能分析生成，仅供参考。请家长根据孩子的实际情况做出判断。
              </Text>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Player;