const fetch = require('node-fetch');

/**
 * Vercel Serverless Function to proxy requests to Google Gemini API.
 *
 * Expects JSON POST body: { prompt: string }
 * Requires environment variable GEMINI_API_KEY to be set on Vercel.
 * Returns: { html: string } with sanitized HTML output from Gemini.
 */
module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  try {
    const { prompt } = req.body || {};
    if (!prompt) {
      res.status(400).json({ error: 'Missing prompt' });
      return;
    }
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      res.status(500).json({ error: 'Server misconfiguration: missing API key' });
      return;
    }
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });
    if (!response.ok) {
      throw new Error(`Upstream error: ${response.status}`);
    }
    const result = await response.json();
    const text = result?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    // Sanitize the output to allow only safe HTML tags
    const sanitized = sanitize(text);
    res.status(200).json({ html: sanitized });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Basic sanitizer: allows only a limited set of HTML tags and strips scripts/events.
 * This is a simple implementation; for production consider using a robust library.
 *
 * @param {string} html 
 * @returns {string}
 */
function sanitize(html) {
  // Allowed tags
  const allowed = new Set(['h4','p','ul','li','strong','em','br']);
  // Parse HTML string
  const { JSDOM } = require('jsdom');
  const dom = new JSDOM(`<div>${html}</div>`);
  (function walk(node) {
    node.childNodes.forEach(child => {
      if (child.nodeType === 1) {
        const tag = child.tagName.toLowerCase();
        if (!allowed.has(tag)) {
          // replace disallowed element with a text node of its text content
          const span = dom.window.document.createElement('span');
          span.textContent = child.textContent;
          child.replaceWith(span);
        } else {
          // remove event handlers and unsafe hrefs
          [...child.attributes].forEach(attr => {
            if (/^on/i.test(attr.name)) {
              child.removeAttribute(attr.name);
            }
            if (attr.name === 'href' && /^javascript:/i.test(attr.value)) {
              child.removeAttribute('href');
            }
          });
          walk(child);
        }
      } else if (child.nodeType === 3) {
        // text node; nothing to do
      }
    });
  })(dom.window.document.body);
  return dom.window.document.body.innerHTML;
}
