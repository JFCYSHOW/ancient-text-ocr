export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { source, target } = req.body;

    if (!source || !target) {
      return res.status(400).json({ error: '缺少比对文本' });
    }

    const response = await fetch(`${process.env.NEWAPI_BASE_URL}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.NEWAPI_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{
          role: 'user',
          content: `你是一位专业的古籍研究专家。请仔细比对以下两段清代古籍文本的差异：

【原图识别文本（标准版本）】
${source}

【待校对文本】
${target}

请进行专业的文献校对分析，包括：
1. 逐字比对，找出所有文字差异（错字、漏字、多字）
2. 标点符号使用的差异
3. 繁简体、异体字使用情况
4. 给出专业的修改建议

请严格按照以下JSON格式输出，不要包含任何其他内容：
{
  "differences": [
    {"type": "错字", "original": "原文字", "current": "现文字", "position": "位置说明"}
  ],
  "punctuation": [
    {"issue": "标点问题的详细说明"}
  ],
  "suggestions": [
    "修改建议1",
    "修改建议2"
  ]
}`
        }],
        max_tokens: 3000,
        temperature: 0.3
      })
    });

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';

    let result;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('未找到有效的JSON格式');
      }
    } catch (parseError) {
      result = {
        differences: [{type: '分析结果', original: '', current: '', position: content}],
        punctuation: [],
        suggestions: ['请查看上方的详细分析']
      };
    }

    if (!result.differences) result.differences = [];
    if (!result.punctuation) result.punctuation = [];
    if (!result.suggestions) result.suggestions = [];

    res.status(200).json({ result });

  } catch (error) {
    console.error('Compare Error:', error);
    res.status(500).json({ 
      error: error.message,
      result: {
        differences: [],
        punctuation: [],
        suggestions: [`分析出错: ${error.message}`]
      }
    });
  }
}
