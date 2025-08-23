import React, { useEffect, useState } from 'react';
import { 
  Card, 
  Button, 
  Typography, 
  Space, 
  Row, 
  Col,
  Empty,
  Spin,
  message,
  Modal,
  Input
} from 'antd';
import { 
  ArrowLeftOutlined,
  HeartOutlined, 
  PlayCircleOutlined,
  DeleteOutlined,
  EditOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '@/stores/appStore';

const { Title, Text } = Typography;
const { TextArea } = Input;

const Favorites: React.FC = () => {
  const navigate = useNavigate();
  const { favorites, loading, loadFavorites, removeFromFavorites } = useAppStore();
  const [noteModalVisible, setNoteModalVisible] = useState(false);
  const [editingFavorite, setEditingFavorite] = useState<any>(null);
  const [noteText, setNoteText] = useState('');

  useEffect(() => {
    loadFavorites();
  }, [loadFavorites]);

  const handlePlay = (videoId: string) => {
    navigate(`/player/${videoId}`);
  };

  const handleRemoveFavorite = async (favoriteId: number, videoTitle: string) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要从收藏中移除 "${videoTitle}" 吗？`,
      okText: '确定',
      cancelText: '取消',
      onOk: async () => {
        try {
          await removeFromFavorites(favoriteId);
          message.success('已从收藏中移除');
        } catch (error) {
          message.error('移除失败');
        }
      }
    });
  };

  const handleEditNote = (favorite: any) => {
    setEditingFavorite(favorite);
    setNoteText(favorite.user_notes || '');
    setNoteModalVisible(true);
  };

  const handleSaveNote = async () => {
    try {
      // 这里应该调用更新笔记的API
      message.success('笔记保存成功');
      setNoteModalVisible(false);
      setEditingFavorite(null);
      setNoteText('');
      loadFavorites();
    } catch (error) {
      message.error('保存笔记失败');
    }
  };

  if (loading.searching) {
    return (
      <div className="page-container">
        <div className="loading-spinner">
          <Spin size="large" />
          <div className="loading-text">正在加载收藏列表...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* 页面头部 */}
      <div className="page-header" style={{ marginBottom: 24 }}>
        <Space>
          <Button 
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate(-1)}
          >
            返回
          </Button>
          <Title level={3} style={{ margin: 0 }}>
            <HeartOutlined style={{ color: '#ff4d4f' }} /> 我的收藏
          </Title>
          {favorites.length > 0 && (
            <Text type="secondary">
              ({favorites.length} 个视频)
            </Text>
          )}
        </Space>
      </div>

      {/* 收藏列表 */}
      {favorites.length > 0 ? (
        <Row gutter={[16, 16]}>
          {favorites.map((favorite) => (
            <Col xs={24} sm={12} md={8} lg={6} key={favorite.id}>
              <Card
                className="video-card fade-in"
                hoverable
                cover={
                  favorite.video && (
                    <div className="video-thumbnail" onClick={() => handlePlay(favorite.video_id)}>
                      <img 
                        src={favorite.video.thumbnail_url || '/placeholder-video.png'} 
                        alt={favorite.video.title}
                        loading="lazy"
                      />
                      <div className="play-overlay">
                        <PlayCircleOutlined className="play-icon" />
                      </div>
                    </div>
                  )
                }
                actions={[
                  <Button 
                    key="play"
                    type="primary" 
                    icon={<PlayCircleOutlined />}
                    onClick={() => handlePlay(favorite.video_id)}
                    className="btn-kid-primary"
                  >
                    观看
                  </Button>,
                  <Button 
                    key="note"
                    icon={<EditOutlined />}
                    onClick={() => handleEditNote(favorite)}
                  >
                    笔记
                  </Button>,
                  <Button 
                    key="remove"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => handleRemoveFavorite(
                      favorite.id, 
                      favorite.video?.title || '未知视频'
                    )}
                  >
                    移除
                  </Button>
                ]}
              >
                {favorite.video && (
                  <Card.Meta
                    title={
                      <Title level={5} ellipsis={{ rows: 2 }}>
                        {favorite.video.title}
                      </Title>
                    }
                    description={
                      <div className="favorite-info">
                        {/* 频道信息 */}
                        {favorite.video.channel_title && (
                          <Text type="secondary" className="channel-name">
                            {favorite.video.channel_title}
                          </Text>
                        )}
                        
                        {/* 收藏时间 */}
                        <div className="favorite-date" style={{ marginTop: 8 }}>
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            收藏于 {new Date(favorite.created_at).toLocaleDateString('zh-CN')}
                          </Text>
                        </div>

                        {/* 用户笔记 */}
                        {favorite.user_notes && (
                          <div className="user-notes" style={{ 
                            marginTop: 8,
                            padding: 8,
                            background: '#f6ffed',
                            borderRadius: 4,
                            border: '1px solid #b7eb8f'
                          }}>
                            <Text style={{ fontSize: 12, color: '#666' }}>
                              💭 {favorite.user_notes}
                            </Text>
                          </div>
                        )}

                        {/* 视频评分信息 */}
                        {favorite.video.ai_score && (
                          <div className="score-info" style={{ marginTop: 8 }}>
                            <Space size={4}>
                              <Text style={{ fontSize: 12 }}>AI评分:</Text>
                              <Text 
                                style={{ 
                                  fontSize: 12,
                                  color: favorite.video.ai_score >= 0.8 ? '#52c41a' : 
                                         favorite.video.ai_score >= 0.6 ? '#faad14' : '#ff4d4f'
                                }}
                              >
                                {Math.round(favorite.video.ai_score * 100)}%
                              </Text>
                            </Space>
                          </div>
                        )}
                      </div>
                    }
                  />
                )}
              </Card>
            </Col>
          ))}
        </Row>
      ) : (
        <Card>
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <div>
                <Text>还没有收藏任何视频</Text>
                <br />
                <Text type="secondary">去搜索页面发现更多精彩内容吧！</Text>
              </div>
            }
            imageStyle={{ height: 100 }}
          >
            <Button 
              type="primary" 
              onClick={() => navigate('/')}
              className="btn-kid-primary"
            >
              开始搜索
            </Button>
          </Empty>
        </Card>
      )}

      {/* 编辑笔记模态框 */}
      <Modal
        title="编辑收藏笔记"
        open={noteModalVisible}
        onOk={handleSaveNote}
        onCancel={() => {
          setNoteModalVisible(false);
          setEditingFavorite(null);
          setNoteText('');
        }}
        okText="保存"
        cancelText="取消"
      >
        {editingFavorite && (
          <>
            <div style={{ marginBottom: 16 }}>
              <Text strong>{editingFavorite.video?.title}</Text>
            </div>
            <TextArea
              rows={4}
              placeholder="为这个视频添加你的笔记或评价..."
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              maxLength={500}
              showCount
            />
          </>
        )}
      </Modal>
    </div>
  );
};

export default Favorites;