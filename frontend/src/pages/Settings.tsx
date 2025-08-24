import React, { useEffect, useState } from 'react'
import { 
  Form, 
  Input, 
  Select, 
  Button, 
  Typography, 
  InputNumber,
  message,
  Row,
  Col,
  Alert,
  Switch,
  Checkbox,
  Modal,
  Divider
} from 'antd'
import { 
  SaveOutlined, 
  SettingOutlined,
  BulbOutlined,
  RobotOutlined,
  YoutubeOutlined,
  SearchOutlined,
  ExportOutlined,
  ImportOutlined,
  ReloadOutlined,
  QuestionCircleOutlined,
  ClockCircleOutlined
} from '@ant-design/icons'

import { useAppStore } from '@/stores/appStore'
import { AppSettings, FilterPreset } from '@/types'
import useI18n from '@/hooks/useI18n'
import useTheme from '@/hooks/useTheme'
import api from '@/services/api'

const { Title, Paragraph, Text } = Typography
const { TextArea } = Input
const { Option } = Select

// 预设配置数据 - 获取本地化名称的函数
const getFilterPresets = (t: any): FilterPreset[] => [
  {
    key: 'strict',
    name: t('filterModes.strict.name'),
    description: t('filterModes.strict.description'),
    emoji: '🛡️',
    age_range: '2-4',
    prompt: t('filterPresets.strict.prompt', 'Please analyze videos with the strictest standards to ensure content is completely suitable for 2-4 year olds. Requirements: 1. Absolutely no violence or scary elements 2. Simple and easy to understand language 3. Soft colors 4. Slow pace 5. Clear educational value 6. Duration 2-8 minutes. Scoring criteria are extremely strict, only videos scoring above 95 will pass.'),
    video_count: 5,
    filter_mode: 'strict'
  },
  {
    key: 'balanced',
    name: t('filterModes.balanced.name'),
    description: t('filterModes.balanced.description'),
    emoji: '⚖️',
    age_range: '3-6',
    prompt: t('filterPresets.balanced.prompt', 'Please analyze whether videos are suitable for 3-6 year old children. Criteria: 1. Educational value: helps with learning cognition, language, math, science, etc. 2. Content safety: no violence, horror, or inappropriate content 3. Age appropriate: matches preschool cognitive level 4. Suitable duration: recommended 2-20 minutes 5. Production quality: clear picture, clear audio, well-produced. Score each video 0-100, only return videos scoring above 70.'),
    video_count: 10,
    filter_mode: 'balanced'
  },
  {
    key: 'educational',
    name: t('filterModes.educational.name'),
    description: t('filterModes.educational.description'),
    emoji: '📚',
    age_range: '4-8',
    prompt: t('filterPresets.educational.prompt', 'Please prioritize videos with high educational value. Focus on: 1. Subject knowledge (math, science, language, arts) 2. Cognitive development 3. Creativity inspiration 4. Problem-solving skills 5. Critical thinking. Educational value weight 80%, entertainment weight 20%. Only return videos with education score above 85.'),
    video_count: 15,
    filter_mode: 'educational'
  },
  {
    key: 'creative',
    name: t('filterModes.creative.name'),
    description: t('filterModes.creative.description'),
    emoji: '🎨',
    age_range: '3-8',
    prompt: t('filterPresets.creative.prompt', 'Please filter videos that stimulate children\'s artistic creativity. Focus on: 1. Art forms like drawing, crafts, music, dance 2. Creative thinking development 3. Aesthetic ability improvement 4. Hands-on skills training 5. Imagination stimulation. Prioritize interactive content that children can follow along with.'),
    video_count: 12,
    filter_mode: 'educational'
  },
  {
    key: 'nature',
    name: t('filterModes.nature.name'),
    description: t('filterModes.nature.description'),
    emoji: '🌿',
    age_range: '4-10',
    prompt: t('filterPresets.nature.prompt', 'Please filter nature science enlightenment videos. Focus on: 1. Natural knowledge about animals, plants, weather, geography 2. Science experiments and observation 3. Environmental awareness cultivation 4. Curiosity stimulation 5. Exploration spirit development. Content should be factual and scientifically based.'),
    video_count: 10,
    filter_mode: 'educational'
  },
  {
    key: 'language',
    name: t('filterModes.language.name'),
    description: t('filterModes.language.description'),
    emoji: '🗣️',
    age_range: '3-8',
    prompt: t('filterPresets.language.prompt', 'Please filter videos that help develop language abilities. Focus on: 1. Vocabulary expansion 2. Pronunciation practice 3. Grammar structure 4. Reading comprehension 5. Expression ability. Include Chinese and English learning content, prioritize interactive videos with standard pronunciation.'),
    video_count: 12,
    filter_mode: 'educational'
  }
];

const Settings: React.FC = () => {
  const { t, changeLanguage, currentLanguage } = useI18n()
  const { theme, setTheme } = useTheme()
  const [form] = Form.useForm()
  const { settings, loading, loadSettings, saveSettings } = useAppStore()
  const [activeSection, setActiveSection] = useState('ai-config')
  const [showApiKey, setShowApiKey] = useState({
    openai: false,
    anthropic: false,
    youtube: false
  })
  const [testing, setTesting] = useState({
    openai: false,
    anthropic: false,
    youtube: false
  })
  const [apiTestResults, setApiTestResults] = useState<any>({})
  const [showHelpModal, setShowHelpModal] = useState(false)

  useEffect(() => {
    loadSettings()
  }, [loadSettings])

  useEffect(() => {
    if (settings) {
      // 确保完整设置所有字段
      form.setFieldsValue({
        ...settings,
        language: currentLanguage,
        theme: theme
      })
    }
  }, [settings, form, currentLanguage, theme])
  
  // 当切换section时，确保表单值不丢失
  useEffect(() => {
    // 保存当前表单值到临时状态（但不提交到后端）
    const currentValues = form.getFieldsValue(true)
    if (currentValues && Object.keys(currentValues).length > 0) {
      // 合并现有设置和当前表单值
      form.setFieldsValue({
        ...settings,
        ...currentValues,
        language: currentLanguage,
        theme: theme
      })
    }
  }, [activeSection])

  const handleSave = async (values: any) => {
    try {
      // 合并现有设置和新值，确保不会丢失未修改的字段
      const appSettings: AppSettings = {
        ...settings, // 先保留所有现有设置
        // API配置 - 只更新有值的字段
        openai_api_key: values.openai_api_key !== undefined ? values.openai_api_key : settings?.openai_api_key,
        anthropic_api_key: values.anthropic_api_key !== undefined ? values.anthropic_api_key : settings?.anthropic_api_key,
        youtube_api_key: values.youtube_api_key !== undefined ? values.youtube_api_key : settings?.youtube_api_key,
        ai_provider: values.ai_provider || settings?.ai_provider || 'openai',
        
        // 过滤条件配置
        child_age: values.child_age || settings?.child_age || '3-6',
        custom_filter_prompt: values.custom_filter_prompt !== undefined ? values.custom_filter_prompt : settings?.custom_filter_prompt,
        video_count: values.video_count || settings?.video_count || 10,
        cache_duration_hours: values.cache_duration_hours !== undefined ? values.cache_duration_hours : (settings?.cache_duration_hours || 24),
        
        // 搜索配置
        default_platforms: values.default_platforms || settings?.default_platforms || ['youtube'],
        search_language: values.search_language || settings?.search_language || 'zh',
        min_duration: values.min_duration !== undefined ? values.min_duration : (settings?.min_duration || 2),
        max_duration: values.max_duration !== undefined ? values.max_duration : (settings?.max_duration || 30),
        
        // 闹钟配置
        enable_alarm: values.enable_alarm !== undefined ? values.enable_alarm : (settings?.enable_alarm || false),
        default_alarm_time: values.default_alarm_time || settings?.default_alarm_time || 600,
        countdown_seconds: values.countdown_seconds || settings?.countdown_seconds || 60,
        alarm_interval: values.alarm_interval || settings?.alarm_interval || 10,
        enable_alarm_sound: values.enable_alarm_sound !== undefined ? values.enable_alarm_sound : (settings?.enable_alarm_sound !== false),
        enable_visual_alarm: values.enable_visual_alarm !== undefined ? values.enable_visual_alarm : (settings?.enable_visual_alarm !== false),
        enable_vibration_alarm: values.enable_vibration_alarm !== undefined ? values.enable_vibration_alarm : (settings?.enable_vibration_alarm || false),
        alarm_message: values.alarm_message || settings?.alarm_message || t('settings.defaultAlarmMessage'),
        
        // 高级设置
        enable_notifications: values.enable_notifications !== undefined ? values.enable_notifications : (settings?.enable_notifications !== false),
        enable_debug_mode: values.enable_debug_mode !== undefined ? values.enable_debug_mode : (settings?.enable_debug_mode || false),
        enable_usage_stats: values.enable_usage_stats !== undefined ? values.enable_usage_stats : (settings?.enable_usage_stats !== false),
        enable_filter_stats: values.enable_filter_stats !== undefined ? values.enable_filter_stats : (settings?.enable_filter_stats !== false),
        theme: values.theme || settings?.theme || 'light',
        language: values.language || settings?.language || 'zh-CN',
        
        // 兼容性字段
        default_filter_mode: values.default_filter_mode || settings?.default_filter_mode || 'balanced',
        default_platform: values.default_platform || settings?.default_platform || 'youtube',
        max_video_duration_minutes: values.max_duration || settings?.max_video_duration_minutes || 30,
      }
      
      await saveSettings(appSettings)
      
      if (values.language !== currentLanguage) {
        changeLanguage(values.language)
      }
      
      if (values.theme !== theme) {
        setTheme(values.theme)
      }
      
      message.success(t('messages.settingsSaved'))
    } catch (error) {
      message.error(t('messages.settingsSaveFailed'))
    }
  }

  const handleTestAPI = async (provider: 'openai' | 'anthropic' | 'youtube') => {
    setTesting(prev => ({ ...prev, [provider]: true }))
    
    try {
      const apiKeys = form.getFieldsValue()
      const testData: any = {}
      
      if (provider === 'openai' && apiKeys.openai_api_key) {
        testData.openai_api_key = apiKeys.openai_api_key
      } else if (provider === 'anthropic' && apiKeys.anthropic_api_key) {
        testData.anthropic_api_key = apiKeys.anthropic_api_key
      } else if (provider === 'youtube' && apiKeys.youtube_api_key) {
        testData.youtube_api_key = apiKeys.youtube_api_key
      } else {
        message.error(t('messages.apiKeyRequired'))
        setTesting(prev => ({ ...prev, [provider]: false }))
        return
      }
      
      const results = await api.testAPIConnections(testData)
      
      // 结果中的key就是provider名称(openai, anthropic, youtube)
      const testResult = results[provider]
      
      if (testResult) {
        setApiTestResults((prev: any) => ({ ...prev, [provider]: testResult }))
        
        if (testResult.success) {
          message.success(t('messages.apiTestSuccess'))
        } else {
          message.error(`${t('messages.apiTestFailed')}: ${testResult.error || 'Unknown error'}`)
        }
      } else {
        message.error(`${t('messages.apiTestFailed')}: No response`)
      }
    } catch (error: any) {
      console.error('API test error:', error)
      message.error(`${t('messages.apiTestFailed')}: ${error?.message || error || 'Unknown error'}`)
    } finally {
      setTesting(prev => ({ ...prev, [provider]: false }))
    }
  }

  const applyPreset = (preset: FilterPreset) => {
    form.setFieldsValue({
      child_age: preset.age_range,
      custom_filter_prompt: preset.prompt,
      video_count: preset.video_count,
      default_filter_mode: preset.filter_mode
    })
    message.success(t('messages.presetApplied').replace('{{preset}}', preset.name))
  }

  const resetSettings = () => {
    Modal.confirm({
      title: t('settings.confirmReset'),
      content: t('settings.confirmResetContent'),
      onOk: () => {
        form.resetFields()
        message.success(t('messages.settingsReset'))
      }
    })
  }

  const exportSettings = () => {
    const settings = form.getFieldsValue()
    const dataStr = JSON.stringify(settings, null, 2)
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr)
    
    const exportFileDefaultName = 'kid-videos-settings.json'
    const linkElement = document.createElement('a')
    linkElement.setAttribute('href', dataUri)
    linkElement.setAttribute('download', exportFileDefaultName)
    linkElement.click()
    
    message.success(t('messages.settingsExported'))
  }

  const importSettings = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    
    input.onchange = (e: any) => {
      const file = e.target.files[0]
      if (file) {
        const reader = new FileReader()
        reader.onload = (e: any) => {
          try {
            const settings = JSON.parse(e.target.result)
            form.setFieldsValue(settings)
            message.success(t('messages.settingsImported'))
          } catch (error) {
            message.error(t('messages.importFailed'))
          }
        }
        reader.readAsText(file)
      }
    }
    
    input.click()
  }

  const menuItems = [
    { key: 'ai-config', icon: <RobotOutlined />, label: t('settings.apiConfig') },
    { key: 'youtube-config', icon: <YoutubeOutlined />, label: t('settings.youtubeConfig') },
    { key: 'filter-config', icon: <BulbOutlined />, label: t('settings.filterConfig') },
    { key: 'search-config', icon: <SearchOutlined />, label: t('settings.searchConfig') },
    { key: 'alarm-config', icon: <ClockCircleOutlined />, label: t('settings.alarmConfig') },
    { key: 'advanced-config', icon: <SettingOutlined />, label: t('settings.advancedConfig') }
  ]

  const sectionTitles = {
    'ai-config': t('settings.apiConfig'),
    'youtube-config': t('settings.youtubeConfig'), 
    'filter-config': t('settings.filterConfig'),
    'search-config': t('settings.searchConfig'),
    'alarm-config': t('settings.alarmConfig'),
    'advanced-config': t('settings.advancedConfig')
  }

  const sectionDescriptions = {
    'ai-config': t('settings.aiConfigDesc'),
    'youtube-config': t('settings.youtubeConfigDesc'),
    'filter-config': t('settings.filterConfigDesc'),
    'search-config': t('settings.searchConfigDesc'),
    'alarm-config': t('settings.alarmConfigDesc'),
    'advanced-config': t('settings.advancedConfigDesc')
  }

  return (
    <div className="settings-layout">
      {/* 侧边栏菜单 */}
      <div className="settings-sidebar">
        <div className="sidebar-header">
          <Title level={4} style={{ marginLeft: '16px', color: 'var(--text-color)' }}>
            {t('settings.title')}
          </Title>
          {/* <Text type="secondary">{t('settings.title')}</Text> */}
        </div>
        
        <ul className="sidebar-menu">
          {menuItems.map(item => (
            <li
              key={item.key}
              className={`sidebar-menu-item ${activeSection === item.key ? 'active' : ''}`}
              onClick={() => setActiveSection(item.key)}
            >
              {item.icon}
              <span>{item.label}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* 内容区域 */}
      <div className="settings-content">
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSave}
          initialValues={{
            ...settings,
            language: currentLanguage,
            theme: theme
          }}
        >
          {/* 顶部操作栏 */}
          <div className="content-header">
            <div className="header-left">
              <Title level={2} style={{ margin: 0 }}>
                {sectionTitles[activeSection as keyof typeof sectionTitles]}
              </Title>
              <Paragraph style={{ margin: '8px 0 0 0' }}>
                {sectionDescriptions[activeSection as keyof typeof sectionDescriptions]}
              </Paragraph>
            </div>
            <div className="header-right">
              <Button 
                type="primary"
                icon={<SaveOutlined />}
                htmlType="submit"
                loading={loading.saving}
                size="large"
              >
                {t('common.save')}
              </Button>
            </div>
          </div>

          <Divider />

          {/* AI配置部分 */}
          {activeSection === 'ai-config' && (
            <div className="settings-section">
              <Alert
                message={t('tips.title')}
                description={t('settings.apiKeyRequired')}
                type="warning"
                showIcon
                style={{ marginBottom: 24 }}
              />

              <Row gutter={24}>
                <Col span={12}>
                  <Form.Item
                    name="ai_provider"
                    label={t('settings.aiProvider')}
                    tooltip={t('settings.aiProvider')}
                  >
                    <Select size="large">
                      <Option value="openai">
                        <RobotOutlined /> OpenAI (GPT-3.5/GPT-4)
                      </Option>
                      <Option value="anthropic">
                        <RobotOutlined /> Anthropic (Claude)
                      </Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={24}>
                <Col span={12}>
                  <Form.Item
                    name="openai_api_key"
                    label={t('settings.openaiKey')}
                    tooltip={t('settings.getFromOpenAI')}
                  >
                    <Input.Password
                      size="large"
                      placeholder="sk-..."
                      visibilityToggle={{
                        visible: showApiKey.openai,
                        onVisibleChange: (visible) => 
                          setShowApiKey(prev => ({ ...prev, openai: visible }))
                      }}
                      addonAfter={
                        <Button 
                          type="link"
                          icon={<SettingOutlined />}
                          onClick={() => handleTestAPI('openai')}
                          loading={testing.openai}
                          size="small"
                        >
                          {t('settings.testConnection')}
                        </Button>
                      }
                    />
                  </Form.Item>
                  {apiTestResults.openai && (
                    <Alert
                      message={apiTestResults.openai.success ? t('messages.apiTestSuccess') : t('messages.apiTestFailed')}
                      description={apiTestResults.openai.success ? 
                        apiTestResults.openai.message : 
                        apiTestResults.openai.error
                      }
                      type={apiTestResults.openai.success ? "success" : "error"}
                      style={{ marginBottom: 16 }}
                    />
                  )}
                </Col>
                
                <Col span={12}>
                  <Form.Item
                    name="anthropic_api_key"
                    label={t('settings.anthropicKey')}
                    tooltip={t('settings.getFromAnthropic')}
                  >
                    <Input.Password
                      size="large"
                      placeholder="sk-ant-..."
                      visibilityToggle={{
                        visible: showApiKey.anthropic,
                        onVisibleChange: (visible) => 
                          setShowApiKey(prev => ({ ...prev, anthropic: visible }))
                      }}
                      addonAfter={
                        <Button 
                          type="link"
                          icon={<SettingOutlined />}
                          onClick={() => handleTestAPI('anthropic')}
                          loading={testing.anthropic}
                          size="small"
                        >
                          {t('settings.testConnection')}
                        </Button>
                      }
                    />
                  </Form.Item>
                  {apiTestResults.anthropic && (
                    <Alert
                      message={apiTestResults.anthropic.success ? t('messages.apiTestSuccess') : t('messages.apiTestFailed')}
                      description={apiTestResults.anthropic.success ? 
                        apiTestResults.anthropic.message : 
                        apiTestResults.anthropic.error
                      }
                      type={apiTestResults.anthropic.success ? "success" : "error"}
                      style={{ marginBottom: 16 }}
                    />
                  )}
                </Col>
              </Row>

              <div style={{ marginTop: 24 }}>
                <Title level={4}>{t('settings.howToGetApiKeys')}</Title>
                <div style={{ display: 'flex', gap: 16 }}>
                  <Button 
                    type="dashed"
                    icon={<QuestionCircleOutlined />}
                    onClick={() => setShowHelpModal(true)}
                  >
                    {t('common.help')}
                  </Button>
                  <Button 
                    href="https://platform.openai.com/api-keys" 
                    target="_blank"
                    type="link"
                  >
                    {t('settings.openaiApiKeyTitle')}
                  </Button>
                  <Button 
                    href="https://console.anthropic.com/" 
                    target="_blank"
                    type="link"
                  >
                    {t('settings.anthropicApiKeyTitle')}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* YouTube配置部分 */}
          {activeSection === 'youtube-config' && (
            <div className="settings-section">
              <Alert
                message={t('settings.youtubeConfig')}
                description={t('settings.youtubeConfigDesc')}
                type="info"
                showIcon
                style={{ marginBottom: 24 }}
              />

              <Row gutter={24}>
                <Col span={12}>
                  <Form.Item
                    name="youtube_api_key"
                    label={t('settings.youtubeKey')}
                    tooltip={t('settings.getFromGoogle')}
                  >
                    <Input.Password
                      size="large"
                      placeholder="AIza..."
                      visibilityToggle={{
                        visible: showApiKey.youtube,
                        onVisibleChange: (visible) => 
                          setShowApiKey(prev => ({ ...prev, youtube: visible }))
                      }}
                      addonAfter={
                        <Button 
                          type="link"
                          icon={<SettingOutlined />}
                          onClick={() => handleTestAPI('youtube')}
                          loading={testing.youtube}
                          size="small"
                        >
                          {t('settings.testConnection')}
                        </Button>
                      }
                    />
                  </Form.Item>
                  {apiTestResults.youtube && (
                    <Alert
                      message={apiTestResults.youtube.success ? t('messages.apiTestSuccess') : t('messages.apiTestFailed')}
                      description={apiTestResults.youtube.success ? 
                        apiTestResults.youtube.message : 
                        apiTestResults.youtube.error
                      }
                      type={apiTestResults.youtube.success ? "success" : "error"}
                      style={{ marginBottom: 16 }}
                    />
                  )}
                </Col>
              </Row>

              <div style={{ marginTop: 24 }}>
                <Title level={4}>{t('settings.youtubeApiAdvantages', 'YouTube API的优势')}</Title>
                <Row gutter={16} style={{ marginTop: 16 }}>
                  <Col span={6}>
                    <div style={{ textAlign: 'center', padding: 16, border: '1px solid var(--border-color)', borderRadius: 8 }}>
                      <Text strong>📊 {t('settings.moreAccurateInfo', '更准确的信息')}</Text>
                      <br />
                      <Text type="secondary">{t('settings.officialVideoData', '获取官方视频数据')}</Text>
                    </div>
                  </Col>
                  <Col span={6}>
                    <div style={{ textAlign: 'center', padding: 16, border: '1px solid var(--border-color)', borderRadius: 8 }}>
                      <Text strong>🔍 {t('settings.morePreciseSearch', '更精确的搜索')}</Text>
                      <br />
                      <Text type="secondary">{t('settings.advancedSearchFilter', '支持高级搜索过滤')}</Text>
                    </div>
                  </Col>
                  <Col span={6}>
                    <div style={{ textAlign: 'center', padding: 16, border: '1px solid var(--border-color)', borderRadius: 8 }}>
                      <Text strong>⚡ {t('settings.fasterResponse', '更快的响应')}</Text>
                      <br />
                      <Text type="secondary">{t('settings.apiFasterThanScraping', 'API比网页抓取更快')}</Text>
                    </div>
                  </Col>
                  <Col span={6}>
                    <div style={{ textAlign: 'center', padding: 16, border: '1px solid var(--border-color)', borderRadius: 8 }}>
                      <Text strong>📈 {t('settings.betterFiltering', '更好的筛选')}</Text>
                      <br />
                      <Text type="secondary">{t('settings.officialDataAnalysis', '基于官方数据分析')}</Text>
                    </div>
                  </Col>
                </Row>

                <div style={{ marginTop: 24 }}>
                  <Title level={4}>{t('settings.howToGetYoutubeKey', '如何获取YouTube API密钥')}</Title>
                  <div style={{ display: 'flex', gap: 16 }}>
                    <Button 
                      href="https://console.cloud.google.com" 
                      target="_blank"
                      type="primary"
                    >
                      {t('settings.getFromGoogle')}
                    </Button>
                    <Button 
                      href="https://developers.google.com/youtube/v3/getting-started" 
                      target="_blank"
                      type="link"
                    >
                      {t('help.apiSetup')}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 过滤条件配置部分 */}
          {activeSection === 'filter-config' && (
            <div className="settings-section">
              <Row gutter={24}>
                <Col span={8}>
                  <Form.Item
                    name="child_age"
                    label={t('settings.childAge', '孩子年龄')}
                    tooltip={t('tips.filterModes')}
                  >
                    <Select size="large">
                      <Option value="2-4">{t('settings.age2to4', '2-4岁 (幼儿)')}</Option>
                      <Option value="3-6">{t('settings.age3to6', '3-6岁 (学前)')}</Option>
                      <Option value="4-8">{t('settings.age4to8', '4-8岁 (学龄前)')}</Option>
                      <Option value="6-10">{t('settings.age6to10', '6-10岁 (小学低年级)')}</Option>
                      <Option value="8-12">{t('settings.age8to12', '8-12岁 (小学高年级)')}</Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    name="video_count"
                    label={t('settings.videoCount', '每次筛选视频数量')}
                    tooltip={t('tips.searchKeywords')}
                  >
                    <InputNumber
                      size="large"
                      min={5}
                      max={50}
                      style={{ width: '100%' }}
                    />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    name="cache_duration_hours"
                    label={t('settings.cacheDuration')}
                    tooltip={t('settings.cacheDescription')}
                  >
                    <InputNumber
                      size="large"
                      min={1}
                      max={168}
                      style={{ width: '100%' }}
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item
                name="custom_filter_prompt"
                label={t('settings.customPrompt')}
                tooltip={t('settings.customPromptHelp')}
              >
                <TextArea
                  rows={8}
                  placeholder={t('settings.customPromptPlaceholder')}
                  style={{ fontFamily: 'monospace' }}
                />
              </Form.Item>

              <div style={{ marginTop: 24 }}>
                <Title level={4}>{t('settings.quickPresets', '快速预设')}</Title>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16, marginTop: 16 }}>
                  {getFilterPresets(t).map((preset: FilterPreset) => (
                    <div 
                      key={preset.key}
                      style={{ 
                        border: '1px solid var(--border-color)', 
                        borderRadius: 8, 
                        padding: 16,
                        cursor: 'pointer',
                        transition: 'all 0.3s'
                      }}
                      onClick={() => applyPreset(preset)}
                      className="preset-card"
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                        <span style={{ fontSize: 20 }}>{preset.emoji}</span>
                        <Text strong>{preset.name}</Text>
                      </div>
                      <Text className="preset-description" type="secondary">{preset.description}</Text>
                      <div style={{ marginTop: 8 }}>
                        <Text code>{t('settings.ageRange', '适龄')}：{preset.age_range}</Text>
                        <Text code style={{ marginLeft: 8 }}>{t('settings.count', '数量')}：{preset.video_count}</Text>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 搜索配置部分 */}
          {activeSection === 'search-config' && (
            <div className="settings-section">
              <Row gutter={24}>
                <Col span={8}>
                  <Form.Item
                    name="default_platforms"
                    label={t('settings.defaultPlatform')}
                  >
                    <Checkbox.Group>
                      <Checkbox value="youtube">YouTube</Checkbox>
                      <Checkbox value="youtube_kids">YouTube Kids</Checkbox>
                    </Checkbox.Group>
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    name="search_language"
                    label={t('settings.searchLanguage', '搜索语言偏好')}
                  >
                    <Select size="large">
                      <Option value="zh">{t('settings.langChinese', '中文')}</Option>
                      <Option value="en">{t('settings.langEnglish', '英文')}</Option>
                      <Option value="both">{t('settings.langBoth', '中英文')}</Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    name="default_filter_mode"
                    label={t('settings.defaultFilterMode')}
                  >
                    <Select size="large">
                      <Option value="strict">🛡️ {t('filterModes.strict.name')}</Option>
                      <Option value="balanced">⚖️ {t('filterModes.balanced.name')}</Option>
                      <Option value="educational">📚 {t('filterModes.educational.name')}</Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={24}>
                <Col span={12}>
                  <Form.Item
                    name="min_duration"
                    label={t('settings.minDuration', '最短时长（分钟）')}
                  >
                    <InputNumber
                      size="large"
                      min={0}
                      max={60}
                      style={{ width: '100%' }}
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="max_duration"
                    label={t('settings.maxDuration')}
                  >
                    <InputNumber
                      size="large"
                      min={1}
                      max={120}
                      style={{ width: '100%' }}
                    />
                  </Form.Item>
                </Col>
              </Row>
            </div>
          )}

          {/* 闹钟配置部分 */}
          {activeSection === 'alarm-config' && (
            <div className="settings-section">
              <Alert
                message={t('settings.alarmFunctionTitle', '闹钟功能说明')}
                description={t('settings.alarmFunctionDesc', '配置观看时长提醒，帮助控制孩子的观看时间，培养良好的观看习惯。')}
                type="info"
                showIcon
                style={{ marginBottom: 24 }}
              />

              <Row gutter={24}>
                <Col span={6}>
                  <Form.Item
                    name="enable_alarm"
                    valuePropName="checked"
                  >
                    <Switch 
                      checkedChildren={t('settings.enableAlarm', '启用闹钟')} 
                      unCheckedChildren={t('settings.disableAlarm', '关闭闹钟')}
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={24}>
                <Col span={8}>
                  <Form.Item
                    name="default_alarm_time"
                    label={t('settings.defaultAlarmTime', '默认闹钟时间（秒）')}
                    tooltip={t('settings.alarmTimeTooltip', '打开视频后，闹钟将在指定时间后响起')}
                  >
                    <InputNumber
                      size="large"
                      min={1}
                      max={1000000000}
                      style={{ width: '100%' }}
                    />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    name="countdown_seconds"
                    label={t('settings.countdownSeconds', '倒计时秒数')}
                    tooltip={t('settings.countdownSeconds')}
                  >
                    <InputNumber
                      size="large"
                      min={10}
                      max={300}
                      style={{ width: '100%' }}
                    />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    name="alarm_interval"
                    label={t('settings.alarmInterval', '闹钟间隔时间（分钟）')}
                    tooltip={t('settings.alarmInterval')}
                  >
                    <InputNumber
                      size="large"
                      min={1}
                      max={1000000000}
                      style={{ width: '100%' }}
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={24}>
                <Col span={12}>
                  <Form.Item
                    name="alarm_message"
                    label={t('settings.customAlarmMessage', '自定义闹钟消息')}
                    tooltip={t('settings.customAlarmMessage')}
                  >
                    <Input
                      size="large"
                      placeholder={t('settings.alarmMessagePlaceholder', '例如：该休息了，小朋友！')}
                    />
                  </Form.Item>
                </Col>
              </Row>

              <div style={{ marginTop: 16 }}>
                <Title level={4}>{t('settings.alarmTypes', '闹钟类型')}</Title>
                <Row gutter={24}>
                  <Col span={8}>
                    <Form.Item
                      name="enable_alarm_sound"
                      valuePropName="checked"
                    >
                      <Switch 
                        checkedChildren={`🔊 ${t('settings.soundReminder', '声音提醒')}`} 
                        unCheckedChildren={`🔇 ${t('settings.silentMode', '静音模式')}`}
                      />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item
                      name="enable_visual_alarm"
                      valuePropName="checked"
                    >
                      <Switch 
                        checkedChildren={`👁️ ${t('settings.visualReminder', '视觉提醒')}`} 
                        unCheckedChildren={`⚫ ${t('settings.visualOff', '关闭视觉')}`}
                      />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item
                      name="enable_vibration_alarm"
                      valuePropName="checked"
                    >
                      <Switch 
                        checkedChildren={`📳 ${t('settings.vibrationReminder', '震动提醒')}`} 
                        unCheckedChildren={`🚫 ${t('settings.vibrationOff', '关闭震动')}`}
                      />
                    </Form.Item>
                  </Col>
                </Row>
              </div>
            </div>
          )}

          {/* 高级设置部分 */}
          {activeSection === 'advanced-config' && (
            <div className="settings-section">
              <Row gutter={24}>
                <Col span={8}>
                  <Form.Item
                    name="language"
                    label={t('settings.language')}
                  >
                    <Select size="large">
                      <Option value="zh-CN">🇨🇳 {t('settings.langChinese', '中文')}</Option>
                      <Option value="en-US">🇺🇸 English</Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    name="theme"
                    label={t('settings.theme')}
                  >
                    <Select size="large">
                      <Option value="auto">🔄 {t('settings.themeAuto', '自动')}</Option>
                      <Option value="light">☀️ {t('settings.lightTheme')}</Option>
                      <Option value="dark">🌙 {t('settings.darkTheme')}</Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              <Divider orientation="left">{t('settings.notificationSettings', '通知设置')}</Divider>
              
              <Row gutter={24}>
                <Col span={8}>
                  <Form.Item
                    name="enable_notifications"
                    valuePropName="checked"
                  >
                    <Switch 
                      checkedChildren={`✅ ${t('settings.enableNotifications', '启用通知')}`} 
                      unCheckedChildren={`🔕 ${t('settings.disableNotifications', '关闭通知')}`}
                    />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    name="enable_debug_mode"
                    valuePropName="checked"
                  >
                    <Switch 
                      checkedChildren={`🐛 ${t('settings.debugMode', '调试模式')}`} 
                      unCheckedChildren={`🏃 ${t('settings.normalMode', '普通模式')}`}
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Divider orientation="left">{t('settings.dataStatistics', '数据统计')}</Divider>
              
              <Row gutter={24}>
                <Col span={12}>
                  <Form.Item
                    name="enable_usage_stats"
                    valuePropName="checked"
                  >
                    <Switch 
                      checkedChildren={`📊 ${t('settings.recordUsageStats', '记录使用统计')}`} 
                      unCheckedChildren={`🚫 ${t('settings.disableStats', '关闭统计')}`}
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="enable_filter_stats"
                    valuePropName="checked"
                  >
                    <Switch 
                      checkedChildren={`📈 ${t('settings.recordFilterStats', '记录筛选统计')}`} 
                      unCheckedChildren={`🚫 ${t('settings.disableFilterStats', '关闭筛选统计')}`}
                    />
                  </Form.Item>
                </Col>
              </Row>
            </div>
          )}

          {/* 底部操作区 */}
          <div style={{ 
            marginTop: 48, 
            padding: '24px 0', 
            borderTop: '1px solid var(--border-color)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div style={{ display: 'flex', gap: 16 }}>
              <Button 
                icon={<ReloadOutlined />}
                onClick={resetSettings}
              >
                {t('settings.resetSettings', 'Reset Settings')}
              </Button>
              <Button 
                icon={<ExportOutlined />}
                onClick={exportSettings}
              >
                {t('settings.exportSettings')}
              </Button>
              <Button 
                icon={<ImportOutlined />}
                onClick={importSettings}
              >
                {t('settings.importSettings')}
              </Button>
            </div>
            
            <div>
              <Text type="secondary">{t('settings.autoSaveNote', '所有设置将自动保存到本地')}</Text>
            </div>
          </div>
        </Form>
      </div>

      {/* API帮助模态框 */}
      <Modal
        title={t('settings.howToGetApiKeys')}
        open={showHelpModal}
        onCancel={() => setShowHelpModal(false)}
        footer={null}
        width={600}
      >
        <div>
          <Title level={4}>{t('settings.openaiApiKeyTitle', 'OpenAI API密钥')}</Title>
          <ol>
            <li>{t('settings.apiSteps.visitPlatform', 'Visit')} <a href="https://platform.openai.com" target="_blank">{t('settings.apiSteps.openaiPlatform', 'OpenAI Platform')}</a></li>
            <li>{t('settings.apiSteps.registerOrLogin', 'Register or login to your account')}</li>
            <li>{t('settings.apiSteps.goToApiKeys', 'Go to API Keys page')}</li>
            <li>{t('settings.apiSteps.createNewKey', 'Click "Create new secret key" to create a new key')}</li>
            <li>{t('settings.apiSteps.copyAndPaste', 'Copy the key and paste it into the input field above')}</li>
          </ol>

          <Title level={4}>{t('settings.anthropicApiKeyTitle', 'Anthropic API密钥')}</Title>
          <ol>
            <li>{t('settings.apiSteps.visitPlatform', 'Visit')} <a href="https://console.anthropic.com" target="_blank">{t('settings.apiSteps.anthropicConsole', 'Anthropic Console')}</a></li>
            <li>{t('settings.apiSteps.registerOrLogin', 'Register or login to your account')}</li>
            <li>{t('settings.apiSteps.goToApiKeys', 'Go to API Keys page')}</li>
            <li>{t('settings.apiSteps.createNewKey', 'Create a new API key')}</li>
            <li>{t('settings.apiSteps.copyAndPaste', 'Copy the key and paste it into the input field above')}</li>
          </ol>

          <Alert
            message={t('tips.title')}
            description={t('settings.apiKeyRequired')}
            type="info"
            style={{ marginTop: 16 }}
          />
        </div>
      </Modal>
    </div>
  )
}

export default Settings