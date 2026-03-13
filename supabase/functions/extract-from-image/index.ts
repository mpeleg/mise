import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SYSTEM_PROMPT = `You are a precise recipe transcription tool. You COPY text from the source — you do NOT rewrite, rephrase, or embellish. Treat this like a transcription task, not a creative task.

Return ONLY valid JSON:

{
  "name": "Recipe Name",
  "prepTime": "30 min",
  "servings": "4",
  "tags": ["Tag1", "Tag2"],
  "ingredients": [
    { "name": "סוכר", "quantity": "200 גרם" }
  ],
  "steps": [
    "Step text copied from source."
  ]
}

LANGUAGE:
- Preserve the ORIGINAL LANGUAGE of the source exactly. Hebrew stays Hebrew, English stays English.
- Tags must also be in the source language.
- Do not translate anything.

INGREDIENTS:
- The "name" field is ONLY the ingredient name (e.g. "קמח", "חמאה", "flour", "butter")
- The "quantity" field contains the amount AND the unit together (e.g. "200 גרם", "2 כוסות", "1/2 כפית", "3 tbsp")
- NEVER put the unit or amount in the name field. NEVER put the ingredient name in the quantity field.
- Copy ingredient names exactly as written in the source.

STEPS:
- Copy each step exactly as written in the source. Do not rephrase or reword.
- Do NOT split, merge, or add steps.
- If text is blurry or unclear, write exactly what you can read. Do NOT guess missing words.

GENERAL:
- Only include prepTime and servings if explicitly stated.
- Generate 3-5 short tags in the source language for: cuisine type, main protein/dish type, or course type.
- Return ONLY the JSON, nothing else.`;

function parseRecipeJson(text: string): unknown {
  let jsonStr = text
    .replace(/```json\s*/gi, '')
    .replace(/```\s*/g, '')
    .trim();

  const start = jsonStr.indexOf('{');
  const end = jsonStr.lastIndexOf('}');
  if (start === -1 || end === -1) throw new Error('No JSON in response');
  jsonStr = jsonStr.slice(start, end + 1);

  try {
    return JSON.parse(jsonStr);
  } catch {
    const cleaned = jsonStr
      .replace(/,\s*([}\]])/g, '$1')
      .replace(/[\u2018\u2019]/g, "'")
      .replace(/[\u201C\u201D]/g, '"')
      .replace(/[\u200B-\u200D\uFEFF]/g, '');
    return JSON.parse(cleaned);
  }
}

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401, headers: { 'Content-Type': 'application/json' },
    });
  }
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    { global: { headers: { Authorization: authHeader } } },
  );
  const { error: authError } = await supabase.auth.getUser();
  if (authError) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401, headers: { 'Content-Type': 'application/json' },
    });
  }

  const { base64, mediaType } = await req.json();
  if (!base64 || !mediaType) {
    return new Response(
      JSON.stringify({ error: 'base64 and mediaType are required' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    );
  }

  const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
  if (!GEMINI_API_KEY) {
    return new Response(
      JSON.stringify({ error: 'GEMINI_API_KEY not configured' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }

  const geminiRes = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents: [
          {
            parts: [
              { inline_data: { mime_type: mediaType, data: base64 } },
              {
                text: 'Transcribe the recipe in this image word-for-word. Copy the text exactly as written — same language, same words, same number of steps. Do not rephrase, do not add anything, do not correct anything. If a word is unclear, write what you see.',
              },
            ],
          },
        ],
        generationConfig: {
          response_mime_type: 'application/json',
        },
      }),
    },
  );

  if (!geminiRes.ok) {
    const err = await geminiRes.text();
    return new Response(
      JSON.stringify({ error: `Gemini API error: ${err}` }),
      { status: 502, headers: { 'Content-Type': 'application/json' } },
    );
  }

  const geminiData = await geminiRes.json();
  const rawText =
    geminiData.candidates?.[0]?.content?.parts?.[0]?.text || '';
  const recipe = parseRecipeJson(rawText);

  return new Response(JSON.stringify(recipe), {
    headers: { 'Content-Type': 'application/json' },
  });
});
