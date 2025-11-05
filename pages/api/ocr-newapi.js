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

    // 使用智谱AI（免费）
    const response = await fetch('https://open.bigmodel.cn/api/paas/v4/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.ZHIPU_API_KEY}`
      },
      body: JSON.stringify({
        model: 'glm-4v',
        messages: [{
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: {
                url: `data:image/jpeg;base64,${base64Data}`
              }
            },
            {
              type: 'text',
              text: '这是一张清代古籍的图片。请专业地识别其中的所有文字：\n\n1. 这是竖排文字，请按照从右到左、从上到下的传统阅读顺序识别\n2. 保留所有繁体字、异体字的原貌\n3. 识别所有文字，包括正文、注释、批注\n4. 不要添加标点符号，保持原文格式\n5. 如果有特殊符号或印章，请用[]标注说明\n6. 只输出识别的文字内容，不要有任何额外解释'
            }
          ]
        }]
      })
    });

    if (!response.ok) {
      throw new Error(`智谱AI请求失败: ${response.status}`);
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || '识别失败';

    const processingTime = Date.now() - startTime;
    const wordCount = text.replace(/\s/g, '').length;

    res.status(200).json({ 
      text,
      confidence: 0.82,
      processingTime,
      wordCount,
      engine: '智谱AI (GLM-4V)'
    });

  } catch (error) {
    console.error('智谱AI OCR Error:', error);
    res.status(500).json({ 
      error: error.message,
      processingTime: Date.now() - startTime,
      engine: '智谱AI'
    });
  }
}
