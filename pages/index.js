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

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => setImagePreview(event.target.result);
      reader.readAsDataURL(file);
    }
  };

  const recognizeText = async () => {
    if (!imagePreview) return;
    setIsProcessing(true);

    try {
      const response = await fetch('/api/ocr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: imagePreview })
      });

      const data = await response.json();
      setRecognizedText(data.text || '识别失败');
    } catch (error) {
      setRecognizedText('识别出错：' + error.message);
    } finally {
      setIsProcessing(false);
    }
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
                      {isProcessing ? '识别中...' : '🔍 开始识别'}
                    </button>
                  </div>
                )}
              </div>

              <div>
                <h3 style={styles.sectionTitle}>识别结果</h3>
                <textarea 
                  value={recognizedText}
                  onChange={(e) => setRecognizedText(e.target.value)}
                  placeholder="识别的文字将显示在这里..."
                  style={styles.textarea}
                  rows={20}
                />
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
                <pre style={{whiteSpace: 'pre-wrap', marginTop: '16px'}}>
                  {JSON.stringify(comparisonResult, null, 2)}
                </pre>
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
  preview: {
    background: '#fef3c7',
    padding: '12px',
    borderRadius: '8px',
    fontFamily: '"Noto Serif SC", "STSong", serif',
    lineHeight: '1.8',
  },
};
