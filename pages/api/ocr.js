export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { image } = req.body;
    const base64Data = image.split(',')[1];

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2000,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: 'image/jpeg',
                data: base64Data
              }
            },
            {
              type: 'text',
              text: '这是一张清代古籍的图片。请专业地识别其中的所有文字：\n\n1. 这是竖排文字，请按照从右到左、从上到下的传统阅读顺序识别\n2. 保留所有繁体字、异体字的原貌\n3. 识别所有文字，包括正文、注释、批注\n4. 不要添加标点符号，保持原文格式\n5. 如果有特殊符号或印章，请用[]标注说明\n6. 只输出识别的文字，不要有任何额外解释'
            }
          ]
        }]
      })
    });

    const data = await response.json();
    const text = data.content
      .filter(item => item.type === 'text')
      .map(item => item.text)
      .join('\n');

    res.status(200).json({ text });
  } catch (error) {
    console.error('OCR Error:', error);
    res.status(500).json({ error: error.message });
  }
}
