// app/api/gemini/route.ts
// Next.js API Route — proxy to Gemini API
// API key stored in environment variables, never exposed to client
//
// Setup in Vercel Dashboard → Project → Settings → Environment Variables:
//   GEMINI_API_KEY = (API key from https://aistudio.google.com)
//
// Called from AI Polish and Generator features

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json(
        { error: 'GEMINI_API_KEY belum dikonfigurasi di Environment Variables.' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { prompt } = body;

    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      return NextResponse.json(
        { error: 'Field "prompt" diperlukan dan tidak boleh kosong.' },
        { status: 400 }
      );
    }

    if (prompt.length > 120000) {
      return NextResponse.json(
        { error: 'Teks terlalu panjang. Coba seleksi sebagian saja.' },
        { status: 400 }
      );
    }

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
      return NextResponse.json({ error: msg }, { status: geminiRes.status });
    }

    const finishReason = data?.candidates?.[0]?.finishReason;
    if (finishReason === 'SAFETY') {
      return NextResponse.json(
        { error: 'Konten diblokir oleh safety filter Gemini. Coba seleksi teks yang berbeda.' },
        { status: 422 }
      );
    }

    const result = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!result) {
      return NextResponse.json(
        { error: 'Gemini tidak mengembalikan hasil. Coba lagi.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ result: result.trim() });
  } catch (err) {
    console.error('Gemini proxy error:', err);
    return NextResponse.json(
      { error: 'Server error: ' + (err instanceof Error ? err.message : 'Unknown error') },
      { status: 500 }
    );
  }
}

// OPTIONS handler for CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
