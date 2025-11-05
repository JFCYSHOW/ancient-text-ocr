  export const runtime = 'edge';

  export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const startTime = Date.now();

  try {
    const { image } = req.body;
    const base64Data = image.includes('base64,') 
      ? image.split('base64,')[1] 
      : image;

    // 获取百度 Access Token
    const tokenUrl = `https://aip.baidubce.com/oauth/2.0/token?grant_type=client_credentials&client_id=${process.env.BAIDU_API_KEY}&client_secret=${process.env.BAIDU_SECRET_KEY}`;
    
    const tokenResponse = await fetch(tokenUrl, { method: 'POST' });
    const tokenData = await tokenResponse.json();
    
    if (!tokenData.access_token) {
      throw new Error('获取百度Access Token失败');
    }

    // 调用百度古文识别
    const ocrUrl = `https://aip.baidubce.com/rest/2.0/ocr/v1/accurate?access_token=${tokenData.access_token}`;
    
    const params = new URLSearchParams();
    params.append('image', base64Data);
    params.append('detect_direction', 'true');
    params.append('paragraph', 'true');
    params.append('probability', 'true');

    const ocrResponse = await fetch(ocrUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params
    });

    const ocrData = await ocrResponse.json();

    if (ocrData.error_code) {
      throw new Error(`百度OCR错误: ${ocrData.error_msg}`);
    }

    if (ocrData.words_result && ocrData.words_result.length > 0) {
      const sortedResults = ocrData.words_result.sort((a, b) => {
        if (a.location && b.location) {
          const xDiff = b.location.left - a.location.left;
          if (Math.abs(xDiff) > 50) return xDiff > 0 ? 1 : -1;
          return a.location.top - b.location.top;
        }
        return 0;
      });

      const text = sortedResults.map(item => item.words).join('\n');
      const avgConfidence = sortedResults.reduce((sum, item) => 
        sum + (item.probability?.average || 0), 0) / sortedResults.length;

      const processingTime = Date.now() - startTime;

      res.status(200).json({ 
        text,
        confidence: avgConfidence,
        processingTime,
        wordCount: sortedResults.length,
        engine: '百度古文OCR'
      });
    } else {
      res.status(200).json({ 
        text: '未识别到文字',
        confidence: 0,
        processingTime: Date.now() - startTime,
        wordCount: 0,
        engine: '百度古文OCR'
      });
    }

  } catch (error) {
    console.error('Baidu OCR Error:', error);
    res.status(500).json({ 
      error: error.message,
      processingTime: Date.now() - startTime,
      engine: '百度古文OCR'
    });
  }
}
