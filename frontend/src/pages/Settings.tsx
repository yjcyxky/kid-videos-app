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
  Alert
} from 'antd'
import { 
  SaveOutlined, 
  SettingOutlined,
  KeyOutlined,
  BulbOutlined,
  ClockCircleOutlined,
  RobotOutlined,
  GlobalOutlined
} from '@ant-design/icons'

import { useAppStore } from '@/stores/appStore'
import { AppSettings } from '@/types'
import useI18n from '@/hooks/useI18n'
import useTheme from '@/hooks/useTheme'

const { Title, Paragraph } = Typography
const { TextArea } = Input
const { Option } = Select

const Settings: React.FC = () => {
  const { t, changeLanguage, currentLanguage } = useI18n()
  const { theme, setTheme } = useTheme()
  const [form] = Form.useForm()
  const { settings, loading, loadSettings, saveSettings } = useAppStore()
  const [activeSection, setActiveSection] = useState('interface')

  useEffect(() => {
    loadSettings()
  }, [loadSettings])

  useEffect(() => {
    if (settings) {
      form.setFieldsValue({
        ...settings,
        language: currentLanguage,
        theme: theme
      })
    }
  }, [settings, form, currentLanguage, theme])

  const handleSave = async (values: any) => {
    try {
      const appSettings: AppSettings = {
        openai_api_key: values.openai_api_key,
        anthropic_api_key: values.anthropic_api_key,
        youtube_api_key: values.youtube_api_key,
        default_filter_mode: values.default_filter_mode,
        default_platform: values.default_platform,
        cache_duration_hours: values.cache_duration_hours,
        max_video_duration_minutes: values.max_video_duration_minutes,
        ai_provider: values.ai_provider,
        custom_filter_prompt: values.custom_filter_prompt,
        language: values.language,
        theme: values.theme
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

  const handleTestAPI = async () => {
    try {
      message.success(t('messages.apiTestSuccess'))
    } catch (error) {
      message.error(t('messages.apiTestFailed'))
    }
  }

  const cacheOptions = [
    { value: -1, label: t('settings.unlimited') },
    { value: 1, label: `1 ${t('settings.hours')}` },
    { value: 6, label: `6 ${t('settings.hours')}` },
    { value: 12, label: `12 ${t('settings.hours')}` },
    { value: 24, label: `24 ${t('settings.hours')}` },
    { value: 72, label: `72 ${t('settings.hours')}` },
    { value: 168, label: `168 ${t('settings.hours')} (1${t('settings.week')})` }
  ]

  const menuItems = [
    { key: 'interface', icon: <GlobalOutlined />, label: t('settings.interface') },
    { key: 'api', icon: <KeyOutlined />, label: t('settings.apiConfig') },
    { key: 'search', icon: <BulbOutlined />, label: t('settings.searchConfig') },
    { key: 'cache', icon: <ClockCircleOutlined />, label: t('settings.cacheConfig') },
    { key: 'advanced', icon: <SettingOutlined />, label: t('settings.advancedConfig') }
  ]

  const renderContent = () => {
    switch (activeSection) {
      case 'interface':
        return (
          <div className="settings-card">
            <div className="settings-card-header">
              <h3 className="settings-card-title">
                <GlobalOutlined /> {t('settings.interface')}
              </h3>
            </div>
            <div className="settings-card-body">
              <Row gutter={16}>
                <Col xs={24} lg={12}>
                  <Form.Item
                    name="language"
                    label={t('settings.language')}
                  >
                    <Select size="large">
                      <Option value="zh-CN">🇨🇳 中文</Option>
                      <Option value="en-US">🇺🇸 English</Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col xs={24} lg={12}>
                  <Form.Item
                    name="theme"
                    label={t('settings.theme')}
                  >
                    <Select size="large">
                      <Option value="light">☀️ {t('settings.lightTheme')}</Option>
                      <Option value="dark">🌙 {t('settings.darkTheme')}</Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>
            </div>
          </div>
        )

      case 'api':
        return (
          <div className="settings-card">
            <div className="settings-card-header">
              <h3 className="settings-card-title">
                <KeyOutlined /> {t('settings.apiConfig')}
              </h3>
            </div>
            <div className="settings-card-body">
              <Alert
                message={t('common.warning')}
                description={t('settings.apiKeyRequired')}
                type="warning"
                showIcon
                style={{ marginBottom: 20 }}
              />

              <Row gutter={16}>
                <Col xs={24}>
                  <Form.Item
                    name="ai_provider"
                    label={t('settings.aiProvider')}
                  >
                    <Select size="large">
                      <Option value="openai">
                        <RobotOutlined /> OpenAI GPT
                      </Option>
                      <Option value="anthropic">
                        <RobotOutlined /> Anthropic Claude
                      </Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col xs={24} lg={12}>
                  <Form.Item
                    name="openai_api_key"
                    label={t('settings.openaiKey')}
                    tooltip={t('settings.getFromOpenAI')}
                  >
                    <Input.Password
                      size="large"
                      placeholder="sk-..."
                      visibilityToggle={false}
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} lg={12}>
                  <Form.Item
                    name="anthropic_api_key"
                    label={t('settings.anthropicKey')}
                    tooltip={t('settings.getFromAnthropic')}
                  >
                    <Input.Password
                      size="large"
                      placeholder="sk-ant-..."
                      visibilityToggle={false}
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col xs={24} lg={12}>
                  <Form.Item
                    name="youtube_api_key"
                    label={`${t('settings.youtubeKey')} (${t('settings.optional')})`}
                    tooltip={t('settings.getFromGoogle')}
                  >
                    <Input.Password
                      size="large"
                      placeholder="AIza..."
                      visibilityToggle={false}
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} lg={12}>
                  <div style={{ paddingTop: 32 }}>
                    <Button 
                      type="dashed" 
                      onClick={handleTestAPI}
                      block
                      size="large"
                    >
                      {t('settings.testConnection')}
                    </Button>
                  </div>
                </Col>
              </Row>
            </div>
          </div>
        )

      case 'search':
        return (
          <div className="settings-card">
            <div className="settings-card-header">
              <h3 className="settings-card-title">
                <BulbOutlined /> {t('settings.searchConfig')}
              </h3>
            </div>
            <div className="settings-card-body">
              <Row gutter={16}>
                <Col xs={24} lg={8}>
                  <Form.Item
                    name="default_platform"
                    label={t('settings.defaultPlatform')}
                  >
                    <Select size="large">
                      <Option value="youtube">YouTube</Option>
                      <Option value="youtube_kids">YouTube Kids</Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col xs={24} lg={8}>
                  <Form.Item
                    name="default_filter_mode"
                    label={t('settings.defaultFilterMode')}
                  >
                    <Select size="large">
                      <Option value="strict">{t('filterModes.strict.name')}</Option>
                      <Option value="balanced">{t('filterModes.balanced.name')}</Option>
                      <Option value="educational">{t('filterModes.educational.name')}</Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col xs={24} lg={8}>
                  <Form.Item
                    name="max_video_duration_minutes"
                    label={`${t('settings.maxDuration')} (${t('settings.minutes')})`}
                    tooltip={t('settings.durationTooltip')}
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
          </div>
        )

      case 'cache':
        return (
          <div className="settings-card">
            <div className="settings-card-header">
              <h3 className="settings-card-title">
                <ClockCircleOutlined /> {t('settings.cacheConfig')}
              </h3>
            </div>
            <div className="settings-card-body">
              <Row gutter={16}>
                <Col xs={24} lg={12}>
                  <Form.Item
                    name="cache_duration_hours"
                    label={t('settings.cacheDuration')}
                    tooltip={t('settings.cacheDescription')}
                  >
                    <Select size="large">
                      {cacheOptions.map(option => (
                        <Option key={option.value} value={option.value}>
                          {option.label}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                <Col xs={24} lg={12}>
                  <div className="info-tip">
                    <div className="info-tip-title">{t('settings.cacheNote')}</div>
                    <div className="info-tip-content">{t('settings.cacheDescription')}</div>
                  </div>
                </Col>
              </Row>
            </div>
          </div>
        )

      case 'advanced':
        return (
          <div className="settings-card">
            <div className="settings-card-header">
              <h3 className="settings-card-title">
                <SettingOutlined /> {t('settings.advancedConfig')}
              </h3>
            </div>
            <div className="settings-card-body">
              <Form.Item
                name="custom_filter_prompt"
                label={`${t('settings.customPromptDesc')} (${t('settings.advancedFeature')})`}
                tooltip={t('settings.customPromptHelp')}
              >
                <TextArea
                  rows={4}
                  placeholder={t('settings.customPromptPlaceholder')}
                />
              </Form.Item>
              
              <Alert
                message={t('common.info')}
                description={t('settings.customPromptHelp')}
                type="info"
                showIcon
              />
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="settings-layout">
      {/* 侧边栏菜单 */}
      <div className="settings-sidebar">
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
            theme: theme,
            cache_duration_hours: settings?.cache_duration_hours || -1
          }}
        >
          {renderContent()}

          {/* 保存按钮 */}
          <div style={{ textAlign: 'center', marginTop: '2rem' }}>
            <Button 
              type="primary"
              htmlType="submit"
              icon={<SaveOutlined />}
              size="large"
              loading={loading.saving}
              style={{ 
                padding: '0.75rem 3rem',
                fontSize: '1rem',
                fontWeight: '500',
                height: 'auto'
              }}
            >
              {t('common.save')}
            </Button>
          </div>
        </Form>

        {/* 帮助信息 */}
        {activeSection === 'api' && (
          <div className="settings-card" style={{ marginTop: '2rem' }}>
            <div className="settings-card-header">
              <h3 className="settings-card-title">
                📚 {t('settings.helpTitle')}
              </h3>
            </div>
            <div className="settings-card-body">
              <Paragraph>
                <Title level={5}>{t('settings.howToGetApiKeys')}：</Title>
                <ul style={{ paddingLeft: '1.5rem' }}>
                  <li><strong>OpenAI API：</strong> {t('settings.getFromOpenAI')}</li>
                  <li><strong>Anthropic API：</strong> {t('settings.getFromAnthropic')}</li>
                  <li><strong>YouTube Data API：</strong> {t('settings.getFromGoogle')}</li>
                </ul>
              </Paragraph>
            </div>
          </div>
        )}

        {activeSection === 'search' && (
          <div className="settings-card" style={{ marginTop: '2rem' }}>
            <div className="settings-card-header">
              <h3 className="settings-card-title">
                📋 {t('settings.filterModeExplanation')}
              </h3>
            </div>
            <div className="settings-card-body">
              <ul style={{ paddingLeft: '1.5rem' }}>
                <li><strong>{t('filterModes.strict.name')}：</strong> {t('filterModes.strict.description')}</li>
                <li><strong>{t('filterModes.balanced.name')}：</strong> {t('filterModes.balanced.description')}</li>
                <li><strong>{t('filterModes.educational.name')}：</strong> {t('filterModes.educational.description')}</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Settings