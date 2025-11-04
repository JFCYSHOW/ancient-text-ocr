import { useState } from 'react';

export default function Home() {
  const [activeTab, setActiveTab] = useState('ocr');
  const [imagePreview, setImagePreview] = useState(null);
  const [recognizedText, setRecognizedText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [compareText, setCompareText] = useState('');
  const [comparisonResult, setComparisonResult] = useState(null);
  
  // 新增：OCR引擎选择和对比
  const [ocrEngine, setOcrEngine] = useState('baidu'); // 'baidu' 或 'newapi'
  const [compareMode, setCompareMode] = useState(false); // 是否对比模式
  const [baiduResult, setBaiduResult] = useState(null);
  const [newapiResult, setNewapiResult] = useState(null);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => setImagePreview(event.target.result);
      reader.readAsDataURL(file);
      // 清空之前的结果
      setRecognizedText('');
      setBaiduResult(null);
      setNewapiResult(null);
    }
  };

  const recognizeText = async () => {
    if (!imagePreview) return;
    
    if (compareMode) {
      // 对比模式：同时调用两个API
      await recognizeBoth();
    } else {
      // 单一模式：只调用选中的API
      await recognizeSingle();
    }
  };

  const recognizeSingle = async () => {
    setIsProcessing(true);
    try {
      const endpoint = ocrEngine === 'baidu' ? '/api/ocr-baidu' : '/api/ocr-newapi';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: imagePreview })
      });

      const data = await response.json();
      if (data.text) {
        setRecognizedText(data.text);
        if (ocrEngine === 'baidu') {
          setBaiduResult(data);
        } else {
          setNewapiResult(data);
        }
      } else {
        setRecognizedText('识别失败：' + (data.error || '未知错误'));
      }
    } catch (error) {
      setRecognizedText('识别出错：' + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const recognizeBoth = async () => {
    setIsProcessing(true);
    setBaiduResult(null);
    setNewapiResult(null);

    // 并行调用两个API
    const [baiduRes, newapiRes] = await Promise.allSettled([
      fetch('/api/ocr-baidu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: imagePreview })
      }),
      fetch('/api/ocr-newapi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: imagePreview })
      })
    ]);

    // 处理百度结果
    if (baiduRes.status === 'fulfilled') {
      const data = await baiduRes.value.json();
      setBaiduResult(data);
    }

    // 处理NewAPI结果
    if (newapiRes.status === 'fulfilled') {
      const data = await newapiRes.value.json();
      setNewapiResult(data);
    }

    setIsProcessing(false);
  };

  const searchLiterature = () => {
    if (!searchQuery) return;
    setIsProcessing(true);
    
    setTimeout(() => {
      setSearchResults([
        {
          title: '清史稿',
          chapter: '卷一百二十',
          confidence: '95%',
          preview: `${searchQuery}...諸侯歸於朝廷...`,
          source: '中国哲学书电子化计划'
        },
        {
          title: '清实录',
          chapter: '康熙朝实录',
          confidence: '87%',
          preview: `...前文所述${searchQuery}...`,
          source: '国学大师'
        }
      ]);
      setIsProcessing(false);
    }, 1000);
  };

  const compareTexts = async () => {
    if (!recognizedText || !compareText) {
      alert('请先识别图片并输入待校对文本');
      return;
    }

    setIsProcessing(true);
    try {
      const response = await fetch('/api/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source: recognizedText, target: compareText })
      });

      const data = await response.json();
      setComparisonResult(data.result);
    } catch (error) {
      alert('比对失败：' + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>📚 古籍研究智能工作流系统</h1>
        <p style={styles.subtitle}>清代古籍专业工具 | OCR识别 · 文献查询 · 智能校对</p>
      </div>

      <div style={styles.content}>
        <div style={styles.tabs}>
          <button 
            style={{...styles.tab, ...(activeTab === 'ocr' ? styles.activeTab : {})}}
            onClick={() => setActiveTab('ocr')}
          >
            📤 OCR识别
          </button>
          <button 
            style={{...styles.tab, ...(activeTab === 'search' ? styles.activeTab : {})}}
            onClick={() => setActiveTab('search')}
          >
            🔍 查询出处
          </button>
          <button 
            style={{...styles.tab, ...(activeTab === 'compare' ? styles.activeTab : {})}}
            onClick={() => setActiveTab('compare')}
          >
            ✅ 智能校对
          </button>
        </div>

        {activeTab === 'ocr' && (
          <div style={styles.tabContent}>
            {/* 引擎选择器 */}
            <div style={styles.engineSelector}>
              <div style={{display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '16px'}}>
                <label style={{fontWeight: 'bold', color: '#92400e'}}>识别引擎：</label>
                <label style={{display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer'}}>
                  <input
                    type="radio"
                    name="engine"
                    value="baidu"
                    checked={ocrEngine === 'baidu'}
                    onChange={(e) => setOcrEngine(e.target.value)}
                    disabled={compareMode}
                  />
                  <span>方案B：百度古文OCR（专业）</span>
                </label>
                <label style={{display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer'}}>
                  <input
                    type="radio"
                    name="engine"
                    value="newapi"
                    checked={ocrEngine === 'newapi'}
                    onChange={(e) => setOcrEngine(e.target.value)}
                    disabled={compareMode}
                  />
                  <span>方案A：NewAPI AI（通用）</span>
                </label>
              </div>

              <label style={{display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer'}}>
                <input
                  type="checkbox"
                  checked={compareMode}
                  onChange={(e) => setCompareMode(e.target.checked)}
                />
                <span style={{fontWeight: 'bold', color: '#dc2626'}}>
                  🆚 对比模式（同时测试两种方案）
                </span>
              </label>
            </div>

            <div style={styles.grid}>
              <div>
                <h3 style={styles.sectionTitle}>上传古籍图片</h3>
                <label style={styles.uploadArea}>
                  <input type="file" accept="image/*" onChange={handleImageUpload} style={{display: 'none'}} />
                  <div style={{fontSize: '48px', marginBottom: '16px'}}>📤</div>
                  <p style={{fontSize: '18px', color: '#92400e'}}>点击上传图片</p>
                  <p style={{fontSize: '14px', color: '#78350f'}}>支持竖排、繁体、清代字体</p>
                </label>

                {imagePreview && (
                  <div>
                    <img src={imagePreview} alt="预览" style={styles.previewImage} />
                    <button 
                      onClick={recognizeText} 
                      disabled={isProcessing}
                      style={styles.button}
                    >
                      {isProcessing ? '识别中...' : (compareMode ? '🆚 开始对比识别' : '🔍 开始识别')}
                    </button>
                  </div>
                )}
              </div>

              <div>
                <h3 style={styles.sectionTitle}>识别结果</h3>
                
                {/* 对比模式结果显示 */}
                {compareMode && (baiduResult || newapiResult) ? (
                  <div>
                    {/* 百度结果 */}
                    <div style={{...styles.resultBox, borderColor: '#3b82f6', marginBottom: '16px'}}>
                      <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '8px'}}>
                        <h4 style={{color: '#1e40af', margin: 0}}>方案B：百度古文OCR</h4>
                        {baiduResult && (
                          <div style={{fontSize: '12px', color: '#6b7280'}}>
                            {baiduResult.processingTime}ms | 
                            置信度: {(baiduResult.confidence * 100).toFixed(1)}% | 
                            {baiduResult.wordCount}字
                          </div>
                        )}
                      </div>
                      <textarea 
                        value={baiduResult?.text || '识别中...'}
                        readOnly
                        style={{...styles.textarea, height: '200px', background: '#eff6ff'}}
                      />
                    </div>

                    {/* NewAPI结果 */}
                    <div style={{...styles.resultBox, borderColor: '#10b981'}}>
                      <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '8px'}}>
                        <h4 style={{color: '#047857', margin: 0}}>方案A：NewAPI AI</h4>
                        {newapiResult && (
                          <div style={{fontSize: '12px', color: '#6b7280'}}>
                            {newapiResult.processingTime}ms | 
                            {newapiResult.wordCount}字
                          </div>
                        )}
                      </div>
                      <textarea 
                        value={newapiResult?.text || '识别中...'}
                        readOnly
                        style={{...styles.textarea, height: '200px', background: '#f0fdf4'}}
                      />
                    </div>

                    {/* 对比总结 */}
                    {baiduResult && newapiResult && (
                      <div style={{...styles.infoBox, marginTop: '16px'}}>
                        <h4 style={{margin: '0 0 8px 0'}}>📊 对比总结</h4>
                        <div style={{fontSize: '14px', lineHeight: '1.6'}}>
                          <p>⏱️ 速度：{baiduResult.processingTime < newapiResult.processingTime ? '百度更快' : 'NewAPI更快'} 
                            ({Math.abs(baiduResult.processingTime - newapiResult.processingTime)}ms差距)</p>
                          <p>📝 字数：百度 {baiduResult.wordCount}字 vs NewAPI {newapiResult.wordCount}字</p>
                          <p>💡 建议：{baiduResult.confidence > 0.8 ? '百度识别置信度高' : '两种方案都可参考'}</p>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  /* 单一模式结果 */
                  <textarea 
                    value={recognizedText}
                    onChange={(e) => setRecognizedText(e.target.value)}
                    placeholder="识别的文字将显示在这里..."
                    style={styles.textarea}
                    rows={20}
                  />
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'search' && (
          <div style={styles.tabContent}>
            <h3 style={styles.sectionTitle}>查询文献出处</h3>
            <div style={{display: 'flex', gap: '16px', marginBottom: '24px'}}>
              <input 
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="输入关键文字..."
                style={styles.input}
                onKeyPress={(e) => e.key === 'Enter' && searchLiterature()}
              />
              <button onClick={searchLiterature} style={styles.button}>
                🔍 搜索
              </button>
            </div>

            {searchResults.map((result, i) => (
              <div key={i} style={styles.resultCard}>
                <h4 style={{color: '#92400e', marginBottom: '8px'}}>{result.title}</h4>
                <p style={{fontSize: '14px', color: '#78350f', marginBottom: '12px'}}>{result.chapter}</p>
                <div style={styles.preview}>{result.preview}</div>
                <button 
                  onClick={() => {
                    setCompareText(result.preview);
                    setActiveTab('compare');
                  }}
                  style={styles.buttonSecondary}
                >
                  对比校对 →
                </button>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'compare' && (
          <div style={styles.tabContent}>
            <h3 style={styles.sectionTitle}>智能比对校对</h3>
            <div style={styles.grid}>
              <div>
                <label style={{display: 'block', fontWeight: 'bold', marginBottom: '8px'}}>原图识别文本</label>
                <textarea 
                  value={recognizedText}
                  readOnly
                  placeholder="请先识别图片..."
                  style={{...styles.textarea, background: '#f0fdf4'}}
                  rows={12}
                />
              </div>
              <div>
                <label style={{display: 'block', fontWeight: 'bold', marginBottom: '8px'}}>待校对文本</label>
                <textarea 
                  value={compareText}
                  onChange={(e) => setCompareText(e.target.value)}
                  placeholder="粘贴需要校对的文本..."
                  style={styles.textarea}
                  rows={12}
                />
              </div>
            </div>

            <button 
              onClick={compareTexts}
              disabled={isProcessing}
              style={{...styles.button, width: '100%', marginTop: '24px'}}
            >
              {isProcessing ? '分析中...' : '✅ 开始智能比对'}
            </button>

            {comparisonResult && (
              <div style={{marginTop: '24px', padding: '24px', background: '#fef2f2', borderRadius: '12px'}}>
                <h4>📊 校对报告</h4>
                {comparisonResult.differences && comparisonResult.differences.length > 0 && (
                  <div style={{marginTop: '16px'}}>
                    <h5>文字差异：</h5>
                    {comparisonResult.differences.map((diff, i) => (
                      <div key={i} style={{padding: '8px', background: 'white', borderRadius: '8px', marginBottom: '8px'}}>
                        <strong>{diff.type}:</strong> {diff.position} - 
                        {diff.original && <span style={{color: '#059669'}}> "{diff.original}"</span>}
                        {diff.current && <span style={{color: '#dc2626'}}> → "{diff.current}"</span>}
                      </div>
                    ))}
                  </div>
                )}
                {comparisonResult.suggestions && comparisonResult.suggestions.length > 0 && (
                  <div style={{marginTop: '16px'}}>
                    <h5>修改建议：</h5>
                    {comparisonResult.suggestions.map((sug, i) => (
                      <div key={i} style={{padding: '8px', background: 'white', borderRadius: '8px', marginBottom: '8px'}}>
                        {i + 1}. {sug}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #fef3c7 0%, #fed7aa 50%, #fecaca 100%)',
  },
  header: {
    background: 'linear-gradient(90deg, #1e293b 0%, #92400e 100%)',
    color: 'white',
    padding: '24px',
    textAlign: 'center',
  },
  title: {
    fontSize: '28px',
    fontWeight: 'bold',
    margin: 0,
  },
  subtitle: {
    color: '#fde68a',
    fontSize: '14px',
    marginTop: '8px',
  },
  content: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '24px',
  },
  tabs: {
    display: 'flex',
    background: 'white',
    borderRadius: '12px 12px 0 0',
    overflow: 'hidden',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
  },
  tab: {
    flex: 1,
    padding: '16px',
    border: 'none',
    background: 'white',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#6b7280',
  },
  activeTab: {
    background: 'linear-gradient(90deg, #f59e0b 0%, #f97316 100%)',
    color: 'white',
  },
  tabContent: {
    background: 'white',
    padding: '32px',
    borderRadius: '0 0 12px 12px',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
  },
  engineSelector: {
    background: '#fef3c7',
    padding: '16px',
    borderRadius: '12px',
    marginBottom: '24px',
    border: '2px solid #fde68a',
  },
  sectionTitle: {
    color: '#92400e',
    marginBottom: '16px',
  },
  uploadArea: {
    display: 'block',
    border: '3px dashed #f59e0b',
    borderRadius: '12px',
    padding: '48px',
    textAlign: 'center',
    cursor: 'pointer',
    marginBottom: '16px',
  },
  previewImage: {
    width: '100%',
    borderRadius: '12px',
    marginTop: '16px',
    marginBottom: '16px',
  },
  button: {
    width: '100%',
    padding: '12px 24px',
    background: 'linear-gradient(90deg, #f59e0b 0%, #f97316 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
  },
  buttonSecondary: {
    padding: '8px 16px',
    background: '#f59e0b',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    cursor: 'pointer',
    marginTop: '12px',
  },
  textarea: {
    width: '100%',
    padding: '16px',
    border: '2px solid #fde68a',
    borderRadius: '8px',
    fontSize: '16px',
    fontFamily: '"Noto Serif SC", "STSong", serif',
    lineHeight: '1.8',
  },
  input: {
    flex: 1,
    padding: '12px 16px',
    border: '2px solid #fde68a',
    borderRadius: '8px',
    fontSize: '16px',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '24px',
  },
  resultCard: {
    border: '2px solid #fde68a',
    borderRadius: '12px',
    padding: '24px',
    marginBottom: '16px',
    background: 'linear-gradient(90deg, white 0%, #fef3c7 100%)',
  },
  resultBox: {
    border: '2px solid',
    borderRadius: '12px',
    padding: '16px',
  },
  preview: {
    background: '#fef3c7',
    padding: '12px',
    borderRadius: '8px',
    fontFamily: '"Noto Serif SC", "STSong", serif',
    lineHeight: '1.8',
  },
  infoBox: {
    background: '#dbeafe',
    border: '2px solid #93c5fd',
    borderRadius: '12px',
    padding: '16px',
  }
};
