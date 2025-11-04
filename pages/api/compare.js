export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { source, target } = req.body;

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
          content: `请专业地比对以下两段清代古籍文本的差异：

原图识别文本（标准）：
${source}

待校对文本：
${target}

请详细分析：
1. 列出所有文字差异（错字、漏字、多字）
2. 标点符号的差异
3. 异体字使用的差异
4. 给出修改建议

输出格式为JSON：
{
  "differences": [{"type": "错字", "original": "X", "current": "Y", "position": "第N字"}],
  "punctuation": [{"issue": "标点错误说明"}],
  "suggestions": ["建议1", "建议2"]
}`
        }]
      })
    });

    const data = await response.json();
    const text = data.content.find(item => item.type === 'text')?.text || '';
    
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const result = jsonMatch ? JSON.parse(jsonMatch[0]) : { error: '解析失败' };

    res.status(200).json({ result });
  } catch (error) {
    console.error('Compare Error:', error);
    res.status(500).json({ error: error.message });
  }
}
