import { useState, useEffect } from 'react'
import './App.css'

const API_BASE = 'https://raw.githubusercontent.com/RollingScallop/content-signal-radar/main'

function App() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState('signals')

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    try {
      setLoading(true)
      
      // Fetch dashboard signals data
      const signalsRes = await fetch(`${API_BASE}/dashboard-signals.json?t=${Date.now()}`, {
        headers: { 'Accept': 'application/json' }
      })
      
      // Fetch latest feed data
      const feedXRes = await fetch(`${API_BASE}/feed-x.json?t=${Date.now()}`, {
        headers: { 'Accept': 'application/json' }
      })
      const feedBlogsRes = await fetch(`${API_BASE}/feed-blogs.json?t=${Date.now()}`, {
        headers: { 'Accept': 'application/json' }
      })

      const signals = signalsRes.ok ? await signalsRes.json() : null
      const feedX = feedXRes.ok ? await feedXRes.json() : null
      const feedBlogs = feedBlogsRes.ok ? await feedBlogsRes.json() : null

      setData({
        signals,
        feedX,
        feedBlogs,
        lastUpdated: new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })
      })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>加载中...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="error">
        <h2>⚠️ 数据加载失败</h2>
        <p>{error}</p>
        <button onClick={fetchData}>重试</button>
      </div>
    )
  }

  const stats = data?.signals?.stats || {}

  return (
    <div className="app">
      <header className="header">
        <div className="header-content">
          <h1>📡 Content Signal Radar</h1>
          <p className="subtitle">内容信号雷达 · AI Builder 信号监测</p>
        </div>
        <div className="header-meta">
          <span className="update-time">🕐 {data?.lastUpdated}</span>
          <button onClick={fetchData} className="refresh-btn">🔄 刷新</button>
        </div>
      </header>

      <nav className="tabs">
        <button 
          className={`tab ${activeTab === 'signals' ? 'active' : ''}`}
          onClick={() => setActiveTab('signals')}
        >
          📊 信号概览
        </button>
        <button 
          className={`tab ${activeTab === 'sources' ? 'active' : ''}`}
          onClick={() => setActiveTab('sources')}
        >
          📡 信号源
        </button>
        <button 
          className={`tab ${activeTab === 'content' ? 'active' : ''}`}
          onClick={() => setActiveTab('content')}
        >
          📝 内容列表
        </button>
      </nav>

      <main className="main">
        {activeTab === 'signals' && (
          <div className="signals-tab">
            <div className="stats-grid">
              <StatCard 
                label="X 推文" 
                value={stats.totalTweets || 0} 
                sub={`${stats.rawCounts?.x_tweet || 0} 原始`}
                color="blue"
              />
              <StatCard 
                label="即刻帖子" 
                value={stats.xBuilders || 0} 
                sub=" builders 关注"
                color="purple"
              />
              <StatCard 
                label="博客文章" 
                value={stats.blogPosts || 0} 
                sub={`${stats.rawCounts?.blog_post || 0} 篇`}
                color="green"
              />
              <StatCard 
                label="播客" 
                value={stats.podcastEpisodes || 0} 
                sub="最近72小时"
                color="orange"
              />
            </div>

            <div className="stats-chart">
              <h3>📈 来源分布</h3>
              <div className="chart-bar">
                <div 
                  className="bar-fill twitter"
                  style={{ width: `${(stats.rawCounts?.x_tweet / Math.max(stats.totalTweets, 1)) * 100}%` }}
                ></div>
                <span>X: {stats.rawCounts?.x_tweet || 0}</span>
              </div>
              <div className="chart-bar">
                <div 
                  className="bar-fill jike"
                  style={{ width: `${(stats.rawCounts?.jike_post / Math.max(stats.totalTweets, 1)) * 100}%` }}
                ></div>
                <span>即刻: {stats.rawCounts?.jike_post || 0}</span>
              </div>
              <div className="chart-bar">
                <div 
                  className="bar-fill blog"
                  style={{ width: `${(stats.rawCounts?.blog_post / Math.max(stats.totalTweets, 1)) * 100}%` }}
                ></div>
                <span>博客: {stats.rawCounts?.blog_post || 0}</span>
              </div>
            </div>

            <div className="filter-stats">
              <h3>🔍 过滤统计</h3>
              <div className="filter-grid">
                <div className="filter-item">
                  <span className="filter-label">已过滤重复</span>
                  <span className="filter-value">
                    {(stats.seenFilteredCounts?.x_tweet || 0) + 
                     (stats.seenFilteredCounts?.jike_post || 0) + 
                     (stats.seenFilteredCounts?.blog_post || 0)}
                  </span>
                </div>
                <div className="filter-item">
                  <span className="filter-label">自动降权</span>
                  <span className="filter-value">
                    {(stats.demotedCounts?.x_tweet || 0)}
                  </span>
                </div>
                <div className="filter-item">
                  <span className="filter-label">高信号</span>
                  <span className="filter-value highlight">
                    {stats.highSignalCount || 0}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'sources' && (
          <div className="sources-tab">
            <h3>📡 监控的信号源</h3>
            <div className="sources-list">
              <SourceItem name="X (Twitter)" count={stats.rawCounts?.x_tweet || 0} type="twitter" />
              <SourceItem name="即刻 (Jike)" count={stats.rawCounts?.jike_post || 0} type="jike" />
              <SourceItem name="博客 / Newsletter" count={stats.rawCounts?.blog_post || 0} type="blog" />
              <SourceItem name="播客" count={stats.podcastEpisodes || 0} type="podcast" />
            </div>
            
            <div className="source-note">
              <h4>💡 数据来源</h4>
              <ul>
                <li>X: via nitter RSS 实例</li>
                <li>即刻: 直接 API</li>
                <li>博客: RSS 订阅源</li>
                <li>播客: RSS 订阅源</li>
              </ul>
              <p>⚠️ 当前显示示例数据，需配置 API key 获取实时数据</p>
            </div>
          </div>
        )}

        {activeTab === 'content' && (
          <div className="content-tab">
            <h3>📝 最新内容</h3>
            
            <div className="content-section">
              <h4>X 推文 ({data?.feedX?.tweets?.length || 0})</h4>
              {data?.feedX?.tweets?.slice(0, 5).map((tweet, i) => (
                <div key={i} className="content-item">
                  <div className="content-header">
                    <span className="content-author">@{tweet.handle || tweet.author}</span>
                    <span className="content-date">{tweet.publishedAt}</span>
                  </div>
                  <p className="content-text">{tweet.text || tweet.content}</p>
                </div>
              ))}
            </div>

            <div className="content-section">
              <h4>博客文章 ({data?.feedBlogs?.blogs?.length || 0})</h4>
              {data?.feedBlogs?.blogs?.slice(0, 5).map((blog, i) => (
                <div key={i} className="content-item">
                  <div className="content-header">
                    <span className="content-author">{blog.author || blog.name}</span>
                    <span className="content-date">{blog.publishedAt}</span>
                  </div>
                  <p className="content-title">{blog.title}</p>
                  <a href={blog.url} target="_blank" rel="noopener noreferrer" className="content-link">
                    阅读原文 ↗
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      <footer className="footer">
        <p>Content Signal Radar · 基于 MapleShaw/content-signal-radar</p>
        <p>每天自动更新 · 上海时间 09:00</p>
      </footer>
    </div>
  )
}

function StatCard({ label, value, sub, color }) {
  return (
    <div className={`stat-card ${color}`}>
      <span className="stat-value">{value}</span>
      <span className="stat-label">{label}</span>
      <span className="stat-sub">{sub}</span>
    </div>
  )
}

function SourceItem({ name, count, type }) {
  return (
    <div className="source-item">
      <span className="source-icon">
        {type === 'twitter' && '🐦'}
        {type === 'jike' && '⚡'}
        {type === 'blog' && '📝'}
        {type === 'podcast' && '🎧'}
      </span>
      <span className="source-name">{name}</span>
      <span className="source-count">{count} 条</span>
    </div>
  )
}

export default App