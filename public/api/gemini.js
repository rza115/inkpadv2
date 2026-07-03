// api/gemini.js
// DEPRECATED: This file is kept for backward compatibility only
// New endpoint: /app/api/gemini/route.ts (Next.js App Router)
//
// Vercel Serverless Function — proxy ke Gemini API.
// API key disimpan di Vercel Environment Variables, tidak pernah ke client.
//
// Setup di Vercel Dashboard → Project → Settings → Environment Variables:
//   GEMINI_API_KEY = (API key lo dari https://aistudio.google.com)
//
// Endpoint ini dipanggil dari js/modules/ai-polish.js via fetch('/api/gemini').

export default async function handler(req, res) {
  // CORS untuk development lokal
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'GEMINI_API_KEY belum dikonfigurasi di Vercel Environment Variables.' });
  }

  const { prompt } = req.body || {};
  if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
    return res.status(400).json({ error: 'Field "prompt" diperlukan dan tidak boleh kosong.' });
  }

  if (prompt.length > 120000) {
    return res.status(400).json({ error: 'Teks terlalu panjang. Coba seleksi sebagian saja.' });
  }

  try {
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.75,
            maxOutputTokens: 65536,
            topP: 0.9,
          },
          safetySettings: [
            { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
            { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
          ],
        }),
      }
    );

    const data = await geminiRes.json();

    if (!geminiRes.ok) {
      const msg = data?.error?.message || `Gemini API error (${geminiRes.status})`;
      return res.status(geminiRes.status).json({ error: msg });
    }

    const finishReason = data?.candidates?.[0]?.finishReason;
    if (finishReason === 'SAFETY') {
      return res.status(422).json({ error: 'Konten diblokir oleh safety filter Gemini. Coba seleksi teks yang berbeda.' });
    }

    const result = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!result) {
      return res.status(500).json({ error: 'Gemini tidak mengembalikan hasil. Coba lagi.' });
    }

    res.status(200).json({ result: result.trim() });
  } catch (err) {
    console.error('Gemini proxy error:', err);
    res.status(500).json({ error: 'Server error: ' + err.message });
  }
}
