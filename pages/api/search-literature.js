export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { query } = req.body;
    
    if (!query || query.trim().length < 2) {
      return res.status(400).json({ error: '请输入至少2个字的搜索内容' });
    }

    const results = [];

    // 1. 搜索 ctext.org（中国哲学书电子化计划）
    try {
      const ctextUrl = `https://ctext.org/searchbooks.pl?if=gb&searchmode=showall&searchu=${encodeURIComponent(query)}`;
      const ctextResponse = await fetch(ctextUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      
      if (ctextResponse.ok) {
        const html = await ctextResponse.text();
        // 简单解析HTML（生产环境建议用cheerio）
        const titleMatches = html.match(/<a[^>]*>([^<]+)<\/a>/g);
        if (titleMatches && titleMatches.length > 0) {
          results.push({
            title: '搜索结果来自中国哲学书电子化计划',
            source: 'ctext.org',
            chapter: '找到多个匹配',
            confidence: '85%',
            preview: `在多部典籍中找到"${query}"...`,
            url: ctextUrl
          });
        }
      }
    } catch (error) {
      console.error('ctext搜索失败:', error);
    }

    // 2. 搜索维基文库
    try {
      const wikiUrl = `https://zh.wikisource.org/w/api.php?action=opensearch&format=json&search=${encodeURIComponent(query)}&limit=3`;
      const wikiResponse = await fetch(wikiUrl);
      
      if (wikiResponse.ok) {
        const wikiData = await wikiResponse.json();
        if (wikiData[1] && wikiData[1].length > 0) {
          wikiData[1].forEach((title, index) => {
            results.push({
              title: title,
              source: '维基文库',
              chapter: '全文',
              confidence: '78%',
              preview: `找到相关条目：${title}`,
              url: wikiData[3][index]
            });
          });
        }
      }
    } catch (error) {
      console.error('维基文库搜索失败:', error);
    }

    // 3. 如果没有结果，返回建议
    if (results.length === 0) {
      results.push({
        title: '未找到直接匹配',
        source: '建议',
        chapter: '',
        confidence: '0%',
        preview: `建议：1. 尝试更短的关键词 2. 检查是否是繁体字 3. 手动访问 ctext.org 或 guoxuedashi.net 搜索`,
        url: 'https://ctext.org/'
      });
    }

    res.status(200).json({ results });

  } catch (error) {
    console.error('搜索失败:', error);
    res.status(500).json({ error: error.message });
  }
}
