import React, { useState } from 'react';
import { 
  Form, 
  Input, 
  Select, 
  Button, 
  Space, 
  Card, 
  Tooltip,
  InputNumber,
  Row,
  Col
} from 'antd';
import { 
  SearchOutlined, 
  InfoCircleOutlined,
  YoutubeOutlined,
  SmileOutlined
} from '@ant-design/icons';
import { SearchFormProps, SearchRequest, FilterMode, Platform } from '@/types';

const { Option } = Select;

// 筛选模式配置
const filterModes = [
  {
    key: 'strict' as FilterMode,
    name: '严格模式',
    description: '适合2-4岁，最严格的内容筛选',
    color: '#ff4d4f',
    icon: '🛡️',
    features: ['最高安全标准', '简单易懂', '时长较短']
  },
  {
    key: 'balanced' as FilterMode,
    name: '平衡模式',
    description: '适合3-6岁，平衡教育和娱乐',
    color: '#1890ff',
    icon: '⚖️',
    features: ['教育娱乐并重', '内容丰富', '中等时长']
  },
  {
    key: 'educational' as FilterMode,
    name: '教育优先',
    description: '优先选择教育价值高的内容',
    color: '#52c41a',
    icon: '📚',
    features: ['高教育价值', '知识性强', '启发思考']
  }
];

// 平台配置
const platforms = [
  {
    key: 'youtube' as Platform,
    name: 'YouTube',
    description: '内容最丰富的视频平台',
    icon: <YoutubeOutlined style={{ color: '#ff0000' }} />
  },
  {
    key: 'youtube_kids' as Platform,
    name: 'YouTube Kids',
    description: '专为儿童设计的安全平台',
    icon: <SmileOutlined style={{ color: '#52c41a' }} />
  }
];

const SearchForm: React.FC<SearchFormProps> = ({
  onSearch,
  loading,
  initialValues
}) => {
  const [form] = Form.useForm();
  const [selectedMode, setSelectedMode] = useState<FilterMode>(
    initialValues?.filter_mode || 'balanced'
  );

  const handleSubmit = (values: any) => {
    const request: SearchRequest = {
      query: values.query,
      platform: values.platform || 'youtube',
      filter_mode: values.filter_mode || 'balanced',
      max_results: values.max_results || 10
    };
    onSearch(request);
  };

  const handleModeChange = (mode: FilterMode) => {
    setSelectedMode(mode);
  };

  const selectedModeConfig = filterModes.find(mode => mode.key === selectedMode);

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleSubmit}
      initialValues={{
        platform: 'youtube',
        filter_mode: 'balanced',
        max_results: 10,
        ...initialValues
      }}
    >
      <Row gutter={16}>
        {/* 搜索关键词 */}
        <Col xs={24} md={12}>
          <Form.Item
            name="query"
            label="搜索关键词"
            rules={[{ required: true, message: '请输入搜索关键词' }]}
          >
            <Input
              size="large"
              placeholder="输入您想搜索的内容，如：儿童数学、英语动画..."
              prefix={<SearchOutlined />}
              onPressEnter={() => form.submit()}
            />
          </Form.Item>
        </Col>

        {/* 搜索平台 */}
        <Col xs={24} md={6}>
          <Form.Item
            name="platform"
            label={
              <Space>
                搜索平台
                <Tooltip title="选择视频搜索的平台来源">
                  <InfoCircleOutlined />
                </Tooltip>
              </Space>
            }
          >
            <Select size="large" placeholder="选择平台">
              {platforms.map(platform => (
                <Option key={platform.key} value={platform.key}>
                  <Space>
                    {platform.icon}
                    <span>{platform.name}</span>
                  </Space>
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Col>

        {/* 结果数量 */}
        <Col xs={24} md={6}>
          <Form.Item
            name="max_results"
            label="结果数量"
          >
            <InputNumber
              size="large"
              min={5}
              max={50}
              placeholder="10"
              style={{ width: '100%' }}
            />
          </Form.Item>
        </Col>
      </Row>

      {/* 筛选模式 */}
      <Form.Item
        name="filter_mode"
        label={
          <Space>
            筛选模式
            <Tooltip title="不同模式会使用不同的筛选标准">
              <InfoCircleOutlined />
            </Tooltip>
          </Space>
        }
      >
        <div className="filter-mode-selector">
          <Row gutter={12}>
            {filterModes.map(mode => (
              <Col xs={24} sm={8} key={mode.key}>
                <Card 
                  size="small"
                  className={`mode-card ${selectedMode === mode.key ? 'selected' : ''}`}
                  onClick={() => {
                    form.setFieldValue('filter_mode', mode.key);
                    handleModeChange(mode.key);
                  }}
                  hoverable
                  bodyStyle={{ padding: '12px' }}
                >
                  <div className="mode-header">
                    <Space>
                      <span className="mode-icon">{mode.icon}</span>
                      <span className="mode-name" style={{ fontWeight: 500 }}>
                        {mode.name}
                      </span>
                    </Space>
                  </div>
                  <div className="mode-description" style={{ 
                    fontSize: '12px', 
                    color: '#666',
                    marginTop: '4px'
                  }}>
                    {mode.description}
                  </div>
                  <div className="mode-features" style={{ marginTop: '8px' }}>
                    {mode.features.map(feature => (
                      <span 
                        key={feature} 
                        className="feature-tag"
                        style={{
                          display: 'inline-block',
                          background: '#f0f0f0',
                          color: '#666',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          fontSize: '10px',
                          marginRight: '4px',
                          marginTop: '2px'
                        }}
                      >
                        {feature}
                      </span>
                    ))}
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        </div>
      </Form.Item>

      {/* 当前选择的模式详细信息 */}
      {selectedModeConfig && (
        <div className="selected-mode-info" style={{ 
          background: '#f6ffed', 
          border: '1px solid #b7eb8f',
          borderRadius: '8px',
          padding: '12px',
          marginBottom: '16px'
        }}>
          <Space>
            <span>{selectedModeConfig.icon}</span>
            <span style={{ fontWeight: 500 }}>
              已选择: {selectedModeConfig.name}
            </span>
            <span style={{ color: '#666', fontSize: '14px' }}>
              - {selectedModeConfig.description}
            </span>
          </Space>
        </div>
      )}

      {/* 搜索按钮 */}
      <Form.Item>
        <Button 
          type="primary" 
          htmlType="submit"
          size="large"
          loading={loading}
          className="btn-kid-primary btn-large"
          icon={<SearchOutlined />}
          block
        >
          {loading ? '正在搜索中...' : '🔍 开始智能筛选'}
        </Button>
      </Form.Item>
    </Form>
  );
};

export default SearchForm;