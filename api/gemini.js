// api/gemini.js
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  try {
    const { prompt } = req.body || {};
    if (!prompt) {
      res.status(400).json({ error: 'Missing "prompt" in request body.' });
      return;
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      res.status(500).json({ error: 'Missing GEMINI_API_KEY on server.' });
      return;
    }

    // モデルは元コードに合わせておく（必要なら安定版に変更可能）
    const model = 'gemini-2.5-flash-preview-05-20';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const payload = {
      contents: [{ parts: [{ text: prompt }]}]
    };

    const upstream = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!upstream.ok) {
      const detail = await upstream.text();
      res.status(upstream.status).json({ error: `Upstream error`, detail });
      return;
    }

    const data = await upstream.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';

    // 簡易サニタイズ（scriptタグやon*属性を除去）
    const safeHtml = String(text)
      .replace(/<\s*\/?\s*script[^>]*>/gi, '')
      .replace(/\son\w+\s*=/gi, ' ');

    res.status(200).json({ html: safeHtml });
  } catch (err) {
    res.status(500).json({ error: 'Server error', detail: String(err) });
  }
}
