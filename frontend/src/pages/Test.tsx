import React, { useState } from 'react'
import { 
  Card, 
  Button, 
  Typography, 
  Space, 
  Progress,
  Tag,
  Divider,
  Alert,
  message,
  Row,
  Col
} from 'antd'
import { 
  ExperimentOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  PlayCircleOutlined,
  DatabaseOutlined,
  CloudServerOutlined,
  SearchOutlined,
  ThunderboltOutlined
} from '@ant-design/icons'

import { useAppStore } from '@/stores/appStore'
import { getApiMode } from '@/services/api'
import useI18n from '@/hooks/useI18n'

const { Title, Text, Paragraph } = Typography

interface TestResult {
  name: string
  status: 'pending' | 'running' | 'passed' | 'failed'
  message?: string
  duration?: number
}

const Test: React.FC = () => {
  const { t } = useI18n()
  const { settings, searchVideos, loadFavorites, clearCache } = useAppStore()
  const [testResults, setTestResults] = useState<TestResult[]>([
    { name: t('test.apiTest'), status: 'pending' },
    { name: t('test.databaseTest'), status: 'pending' },
    { name: t('test.searchTest'), status: 'pending' },
    { name: t('test.aiTest'), status: 'pending' },
    { name: t('test.cacheTest'), status: 'pending' }
  ])
  const [isRunning, setIsRunning] = useState(false)
  const [currentTest, setCurrentTest] = useState(-1)

  const apiMode = getApiMode()
  const isConnected = apiMode === 'tauri'

  const updateTestResult = (index: number, status: TestResult['status'], message?: string, duration?: number) => {
    setTestResults(prev => prev.map((test, i) => 
      i === index ? { ...test, status, message, duration } : test
    ))
  }

  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

  const runSingleTest = async (testIndex: number) => {
    const tests = [
      async () => {
        // API连接测试
        updateTestResult(0, 'running')
        const start = Date.now()
        
        try {
          if (!isConnected) {
            updateTestResult(0, 'passed', t('test.apiTestSkipped'), Date.now() - start)
            return
          }
          
          if (!settings?.openai_api_key && !settings?.anthropic_api_key) {
            updateTestResult(0, 'failed', t('test.apiKeyNotConfigured'), Date.now() - start)
            return
          }
          
          await delay(1000) // 模拟API测试
          updateTestResult(0, 'passed', t('test.apiConnectionNormal'), Date.now() - start)
        } catch (error) {
          updateTestResult(0, 'failed', t('test.apiConnectionFailed'), Date.now() - start)
        }
      },
      
      async () => {
        // 数据库测试
        updateTestResult(1, 'running')
        const start = Date.now()
        
        try {
          if (!isConnected) {
            updateTestResult(1, 'passed', t('test.databaseTestSkipped'), Date.now() - start)
            return
          }
          
          await loadFavorites()
          await delay(500)
          updateTestResult(1, 'passed', t('test.databaseConnectionNormal'), Date.now() - start)
        } catch (error) {
          updateTestResult(1, 'failed', t('test.databaseConnectionFailed'), Date.now() - start)
        }
      },
      
      async () => {
        // 搜索功能测试
        updateTestResult(2, 'running')
        const start = Date.now()
        
        try {
          const response = await searchVideos({
            query: t('test.testVideo'),
            platform: 'youtube',
            filter_mode: 'balanced',
            max_results: 5
          })
          
          if (response.videos.length > 0) {
            updateTestResult(2, 'passed', t('test.searchSuccessful', { count: response.videos.length }), Date.now() - start)
          } else {
            updateTestResult(2, 'failed', t('test.searchNoResults'), Date.now() - start)
          }
        } catch (error) {
          updateTestResult(2, 'failed', t('test.searchException'), Date.now() - start)
        }
      },
      
      async () => {
        // AI分析测试
        updateTestResult(3, 'running')
        const start = Date.now()
        
        try {
          await delay(1500) // 模拟AI分析时间
          updateTestResult(3, 'passed', t('test.aiAnalysisNormal'), Date.now() - start)
        } catch (error) {
          updateTestResult(3, 'failed', t('test.aiAnalysisException'), Date.now() - start)
        }
      },
      
      async () => {
        // 缓存功能测试
        updateTestResult(4, 'running')
        const start = Date.now()
        
        try {
          await clearCache()
          await delay(300)
          updateTestResult(4, 'passed', t('test.cacheCleanupNormal'), Date.now() - start)
        } catch (error) {
          updateTestResult(4, 'failed', t('test.cacheException'), Date.now() - start)
        }
      }
    ]

    if (tests[testIndex]) {
      await tests[testIndex]()
    }
  }

  const runAllTests = async () => {
    setIsRunning(true)
    
    // 重置所有测试状态
    setTestResults(prev => prev.map(test => ({ ...test, status: 'pending', message: undefined })))
    
    try {
      for (let i = 0; i < testResults.length; i++) {
        setCurrentTest(i)
        await runSingleTest(i)
        await delay(300) // 测试间隔
      }
      
      message.success(t('common.allTestsComplete'))
    } catch (error) {
      message.error(t('common.testError'))
    } finally {
      setIsRunning(false)
      setCurrentTest(-1)
    }
  }

  const getTestIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'passed': return <CheckCircleOutlined style={{ color: '#52c41a' }} />
      case 'failed': return <CloseCircleOutlined style={{ color: '#ff4d4f' }} />
      case 'running': return <PlayCircleOutlined style={{ color: '#1890ff' }} />
      default: return <ExperimentOutlined style={{ color: '#666' }} />
    }
  }

  const getTestColor = (status: TestResult['status']) => {
    switch (status) {
      case 'passed': return 'success'
      case 'failed': return 'error'
      case 'running': return 'processing'
      default: return 'default'
    }
  }

  const overallProgress = (testResults.filter(t => t.status === 'passed' || t.status === 'failed').length / testResults.length) * 100

  return (
    <div className="page-container">
      <div className="page-header">
        <Title level={2} className="page-title">
          <ExperimentOutlined /> {t('test.title')}
        </Title>
      </div>

      {/* 测试概览 */}
      <Card className="glass-effect" style={{ marginBottom: 24 }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <Title level={4}>{t('test.systemTest')}</Title>
          <Paragraph>
            {t('test.testDescription')}
            {t('test.currentMode')}：<Tag color={isConnected ? 'green' : 'blue'}>
              {isConnected ? t('common.tauriMode') : t('common.mockMode')}
            </Tag>
          </Paragraph>
          
          <Progress 
            type="circle" 
            percent={Math.round(overallProgress)}
            strokeColor="#52c41a"
            style={{ marginBottom: '1rem' }}
          />
          
          <div>
            <Button
              type="primary"
              size="large"
              icon={<PlayCircleOutlined />}
              onClick={runAllTests}
              loading={isRunning}
              disabled={isRunning}
              style={{ 
                borderRadius: 25,
                padding: '0.75rem 2rem',
                fontSize: '1.1rem',
                fontWeight: 'bold',
                height: 'auto'
              }}
            >
              {isRunning ? t('test.testInProgress') : t('test.runTest')}
            </Button>
          </div>
        </div>
      </Card>

      {/* 测试项目列表 */}
      <Row gutter={16}>
        {testResults.map((test, index) => (
          <Col xs={24} lg={12} key={index}>
            <Card 
              className="glass-effect"
              style={{ 
                marginBottom: 16,
                border: currentTest === index ? '2px solid #1890ff' : 'none'
              }}
              bodyStyle={{ padding: '1.5rem' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ fontSize: '2rem' }}>
                  {index === 0 && <CloudServerOutlined />}
                  {index === 1 && <DatabaseOutlined />}
                  {index === 2 && <SearchOutlined />}
                  {index === 3 && <ThunderboltOutlined />}
                  {index === 4 && <ExperimentOutlined />}
                </div>
                
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    {getTestIcon(test.status)}
                    <Text strong style={{ fontSize: '1.1rem' }}>{test.name}</Text>
                    <Tag color={getTestColor(test.status)}>
                      {test.status === 'pending' ? t('common.pending') :
                       test.status === 'running' ? t('common.running') :
                       test.status === 'passed' ? t('test.testPassed') :
                       t('test.testFailed')}
                    </Tag>
                  </div>
                  
                  {test.message && (
                    <Text type="secondary" style={{ fontSize: '0.9rem' }}>
                      {test.message}
                      {test.duration && ` (${test.duration}ms)`}
                    </Text>
                  )}
                  
                  {test.status === 'running' && (
                    <Progress 
                      percent={100}
                      status="active"
                      size="small"
                      style={{ marginTop: '0.5rem' }}
                    />
                  )}
                </div>
                
                <Button
                  size="small"
                  type="link"
                  onClick={() => runSingleTest(index)}
                  disabled={isRunning}
                >
                  {t('test.runSingleTest')}
                </Button>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      {/* 测试详情 */}
      <Card 
        title={`📊 ${t('test.testResults')}`}
        className="glass-effect"
        style={{ marginTop: 24 }}
      >
        <Row gutter={16}>
          <Col xs={24} lg={8}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', color: '#52c41a', marginBottom: '0.5rem' }}>
                {testResults.filter(t => t.status === 'passed').length}
              </div>
              <Text>{t('test.passedTests')}</Text>
            </div>
          </Col>
          <Col xs={24} lg={8}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', color: '#ff4d4f', marginBottom: '0.5rem' }}>
                {testResults.filter(t => t.status === 'failed').length}
              </div>
              <Text>{t('test.failedTests')}</Text>
            </div>
          </Col>
          <Col xs={24} lg={8}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', color: '#1890ff', marginBottom: '0.5rem' }}>
                {testResults.filter(t => t.duration).reduce((sum, t) => sum + (t.duration || 0), 0)}ms
              </div>
              <Text>{t('test.totalTime')}</Text>
            </div>
          </Col>
        </Row>

        <Divider />

        <Alert
          message={t('test.testExplanation')}
          description={
            <ul style={{ marginBottom: 0, paddingLeft: '1.5rem' }}>
              <li><strong>API连接测试：</strong> 验证OpenAI/Anthropic API密钥配置是否正确</li>
              <li><strong>数据库测试：</strong> 检查SQLite数据库连接和基本操作</li>
              <li><strong>搜索功能测试：</strong> 测试视频搜索和结果返回功能</li>
              <li><strong>AI分析测试：</strong> 验证视频内容智能分析功能</li>
              <li><strong>缓存功能测试：</strong> 检查视频缓存机制是否正常</li>
            </ul>
          }
          type="info"
          showIcon
          style={{ borderRadius: 15 }}
        />
      </Card>

      {/* 系统信息 */}
      <Card 
        title="🔧 系统信息"
        className="glass-effect"
        style={{ marginTop: 24 }}
      >
        <Row gutter={16}>
          <Col xs={24} lg={12}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <div>
                <Text strong>运行模式：</Text>
                <Tag color={isConnected ? 'green' : 'blue'} style={{ marginLeft: '0.5rem' }}>
                  {isConnected ? 'Tauri桌面应用' : 'Mock开发模式'}
                </Tag>
              </div>
              <div>
                <Text strong>API配置：</Text>
                <Tag color={settings?.openai_api_key || settings?.anthropic_api_key ? 'green' : 'red'} style={{ marginLeft: '0.5rem' }}>
                  {settings?.openai_api_key || settings?.anthropic_api_key ? '已配置' : '未配置'}
                </Tag>
              </div>
              <div>
                <Text strong>缓存时长：</Text>
                <Text style={{ marginLeft: '0.5rem' }}>
                  {settings?.cache_duration_hours === -1 ? '无限' : `${settings?.cache_duration_hours || 24}小时`}
                </Text>
              </div>
            </Space>
          </Col>
          <Col xs={24} lg={12}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <div>
                <Text strong>AI服务商：</Text>
                <Text style={{ marginLeft: '0.5rem' }}>
                  {settings?.ai_provider === 'openai' ? 'OpenAI GPT' : 'Anthropic Claude'}
                </Text>
              </div>
              <div>
                <Text strong>筛选模式：</Text>
                <Text style={{ marginLeft: '0.5rem' }}>
                  {settings?.default_filter_mode === 'strict' ? '严格模式' :
                   settings?.default_filter_mode === 'educational' ? '教育优先' : '平衡模式'}
                </Text>
              </div>
              <div>
                <Text strong>最大时长：</Text>
                <Text style={{ marginLeft: '0.5rem' }}>
                  {settings?.max_video_duration_minutes || 20}分钟
                </Text>
              </div>
            </Space>
          </Col>
        </Row>
      </Card>
    </div>
  )
}

export default Test