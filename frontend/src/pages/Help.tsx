import React, { useState } from 'react'
import { 
  Card, 
  Typography, 
  Steps, 
  Space, 
  Collapse,
  Alert,
  Button,
  Row,
  Col,
  Divider
} from 'antd'
import { 
  QuestionCircleOutlined,
  RocketOutlined,
  StarOutlined,
  KeyOutlined,
  ExclamationCircleOutlined,
  CustomerServiceOutlined,
  SearchOutlined,
  HeartOutlined
} from '@ant-design/icons'

import useI18n from '@/hooks/useI18n'

const { Title, Paragraph, Text } = Typography

const Help: React.FC = () => {
  const { t } = useI18n()
  const [currentStep, setCurrentStep] = useState(0)

  const quickStartSteps = [
    {
      title: '下载安装应用',
      content: '从官方渠道下载儿童视频智能筛选器，支持Windows、macOS、Linux系统',
      icon: <RocketOutlined />
    },
    {
      title: '配置API密钥',
      content: '前往设置页面，配置OpenAI或Anthropic的API密钥（必需）',
      icon: <KeyOutlined />
    },
    {
      title: '开始搜索视频',
      content: '在首页输入关键词，如"儿童数学"、"英语动画"等，开始智能筛选',
      icon: <SearchOutlined />
    },
    {
      title: '管理视频内容',
      content: '查看AI评分，收藏喜欢的视频，删除不合适的内容',
      icon: <HeartOutlined />
    }
  ]

  const features = [
    {
      icon: '🤖',
      title: 'AI智能筛选',
      description: '使用OpenAI GPT或Anthropic Claude进行视频内容分析，从教育价值、安全性、年龄适宜性等多个维度进行评分'
    },
    {
      icon: '🛡️',
      title: '内容安全保障',
      description: '多层次安全筛选，过滤暴力、恐怖、不当内容，确保孩子观看安全健康的视频内容'
    },
    {
      icon: '📚',
      title: '教育价值评估',
      description: '智能识别具有教育意义的视频，优先推荐有助于儿童学习和认知发展的内容'
    },
    {
      icon: '🎯',
      title: '年龄分层筛选',
      description: '提供严格、平衡、教育优先三种筛选模式，适应不同年龄段儿童的需求'
    },
    {
      icon: '💾',
      title: '智能缓存系统',
      description: '本地SQLite数据库缓存搜索结果，支持离线访问，用户可自定义缓存时间'
    },
    {
      icon: '🌍',
      title: '多平台搜索',
      description: '支持YouTube和YouTube Kids平台搜索，提供更丰富的内容来源'
    }
  ]

  const faqData = [
    {
      key: '1',
      label: '如何获取API密钥？',
      children: (
        <div>
          <Paragraph>
            <Title level={5}>OpenAI API密钥：</Title>
            <ol>
              <li>访问 <a href="https://platform.openai.com" target="_blank" rel="noopener noreferrer">OpenAI Platform</a></li>
              <li>注册或登录账号</li>
              <li>在API Keys页面创建新的密钥</li>
              <li>复制密钥并在应用设置中配置</li>
            </ol>
          </Paragraph>
          
          <Paragraph>
            <Title level={5}>Anthropic API密钥：</Title>
            <ol>
              <li>访问 <a href="https://console.anthropic.com" target="_blank" rel="noopener noreferrer">Anthropic Console</a></li>
              <li>注册或登录账号</li>
              <li>在API Keys部分创建新的密钥</li>
              <li>复制密钥并在应用设置中配置</li>
            </ol>
          </Paragraph>
        </div>
      )
    },
    {
      key: '2',
      label: '为什么搜索没有结果？',
      children: (
        <div>
          <ul>
            <li><strong>检查API配置：</strong> 确保已正确配置AI服务的API密钥</li>
            <li><strong>检查网络连接：</strong> 确保设备可以正常访问互联网</li>
            <li><strong>调整关键词：</strong> 尝试使用更具体或更通用的搜索关键词</li>
            <li><strong>修改筛选模式：</strong> 如果严格模式无结果，可尝试平衡模式</li>
            <li><strong>检查API余额：</strong> 确认API账户有足够的调用次数</li>
          </ul>
        </div>
      )
    },
    {
      key: '3',
      label: 'AI分析是否准确？',
      children: (
        <div>
          <Paragraph>
            AI分析结果仅供参考，建议家长：
          </Paragraph>
          <ul>
            <li>根据孩子的实际年龄和理解能力做出判断</li>
            <li>陪同观看，观察孩子的反应</li>
            <li>结合自己的价值观和教育理念</li>
            <li>对于不确定的内容，可以先预览再决定</li>
          </ul>
        </div>
      )
    },
    {
      key: '4',
      label: '如何优化筛选效果？',
      children: (
        <div>
          <ul>
            <li><strong>自定义提示词：</strong> 在设置中配置自定义AI筛选提示，更好地满足特定需求</li>
            <li><strong>调整筛选模式：</strong> 根据孩子年龄选择合适的筛选严格程度</li>
            <li><strong>设置时长限制：</strong> 根据孩子注意力持续时间设置合适的视频时长上限</li>
            <li><strong>使用收藏功能：</strong> 收藏优质内容，建立个人化的视频库</li>
          </ul>
        </div>
      )
    },
    {
      key: '5',
      label: '数据隐私和安全',
      children: (
        <div>
          <Alert
            message="隐私保护承诺"
            description="我们严格保护您的隐私和数据安全"
            type="success"
            showIcon
            style={{ marginBottom: '1rem', borderRadius: 15 }}
          />
          <ul>
            <li><strong>本地存储：</strong> API密钥和所有设置都安全存储在本地设备</li>
            <li><strong>最小数据传输：</strong> 仅向AI服务发送视频的标题和描述等公开信息</li>
            <li><strong>无数据收集：</strong> 应用不会收集或上传任何个人信息</li>
            <li><strong>离线功能：</strong> 缓存的视频信息支持离线浏览</li>
          </ul>
        </div>
      )
    }
  ]

  return (
    <div className="page-container">
      <div className="page-header">
        <Title level={2} className="page-title">
          <QuestionCircleOutlined /> {t('help.title')}
        </Title>
      </div>

      {/* 快速开始指南 */}
      <Card 
        title={<><RocketOutlined /> {t('help.quickStart')}</>}
        className="glass-effect"
        style={{ marginBottom: 24 }}
      >
        <Paragraph style={{ fontSize: '1rem', marginBottom: '2rem' }}>
          {t('help.quickStartDesc')}
        </Paragraph>
        
        <Steps
          current={currentStep}
          direction="vertical"
          items={quickStartSteps.map((step) => ({
            title: step.title,
            description: step.content,
            icon: step.icon
          }))}
          onChange={setCurrentStep}
        />
        
        <div style={{ marginTop: '2rem', textAlign: 'center' }}>
          <Space>
            <Button 
              type="primary"
              onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
              disabled={currentStep === 0}
            >
              上一步
            </Button>
            <Button 
              type="primary"
              onClick={() => setCurrentStep(Math.min(quickStartSteps.length - 1, currentStep + 1))}
              disabled={currentStep === quickStartSteps.length - 1}
            >
              下一步
            </Button>
          </Space>
        </div>
      </Card>

      {/* 功能特色 */}
      <Card 
        title={<><StarOutlined /> {t('help.features')}</>}
        className="glass-effect"
        style={{ marginBottom: 24 }}
      >
        <Row gutter={16}>
          {features.map((feature, idx) => (
            <Col xs={24} lg={12} key={idx}>
              <Card 
                size="small"
                style={{ 
                  marginBottom: 16, 
                  borderRadius: 15,
                  background: 'rgba(255, 255, 255, 0.5)',
                  backdropFilter: 'blur(5px)'
                }}
              >
                <Space align="start">
                  <div style={{ fontSize: '2rem' }}>{feature.icon}</div>
                  <div>
                    <Title level={5} style={{ margin: 0, marginBottom: '0.5rem' }}>
                      {feature.title}
                    </Title>
                    <Text type="secondary" style={{ fontSize: '0.9rem' }}>
                      {feature.description}
                    </Text>
                  </div>
                </Space>
              </Card>
            </Col>
          ))}
        </Row>
      </Card>

      {/* 常见问题 */}
      <Card 
        title={<><ExclamationCircleOutlined /> {t('help.troubleshooting')}</>}
        className="glass-effect"
        style={{ marginBottom: 24 }}
      >
        <Collapse 
          items={faqData}
          size="large"
          style={{ background: 'transparent' }}
        />
      </Card>

      {/* 联系支持 */}
      <Card 
        title={<><CustomerServiceOutlined /> {t('help.contact')}</>}
        className="glass-effect"
      >
        <Row gutter={16}>
          <Col xs={24} lg={12}>
            <Alert
              message="技术支持"
              description={
                <div>
                  <p>如果您在使用过程中遇到问题，可以通过以下方式获取帮助：</p>
                  <ul>
                    <li>📧 邮件支持：support@kidvideos.app</li>
                    <li>🐛 问题反馈：GitHub Issues</li>
                    <li>💬 社区讨论：GitHub Discussions</li>
                    <li>📖 在线文档：docs.kidvideos.app</li>
                  </ul>
                </div>
              }
              type="info"
              showIcon
              style={{ borderRadius: 15 }}
            />
          </Col>
          <Col xs={24} lg={12}>
            <Alert
              message="应用信息"
              description={
                <div>
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <div><strong>版本：</strong> 1.0.0</div>
                    <div><strong>开发团队：</strong> Kid Videos Team</div>
                    <div><strong>开源协议：</strong> MIT License</div>
                    <div><strong>技术栈：</strong> Tauri + React + TypeScript</div>
                    <div><strong>最后更新：</strong> 2025年1月</div>
                  </Space>
                </div>
              }
              type="success"
              showIcon
              style={{ borderRadius: 15 }}
            />
          </Col>
        </Row>

        <Divider />

        <div style={{ textAlign: 'center' }}>
          <Title level={4} style={{ color: '#52c41a' }}>
            🌟 让孩子在安全的环境中享受优质的视频内容 🌟
          </Title>
          <Paragraph>
            儿童视频智能筛选器致力于为家长提供可靠的工具，帮助孩子发现适合的教育和娱乐内容。
            我们相信技术可以让育儿变得更轻松，让学习变得更有趣。
          </Paragraph>
        </div>
      </Card>
    </div>
  )
}

export default Help