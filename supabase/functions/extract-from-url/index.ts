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
- The "name" field is ONLY the ingredient name (e.g. "קמח", "חמאה", "flour", "butter", "תפוז", "orange")
- The "quantity" field contains the amount AND the unit together (e.g. "200 גרם", "2 כוסות", "1/2 כפית", "3 tbsp", "חצי", "half")
- NEVER put the unit or amount in the name field. NEVER put the ingredient name in the quantity field.
- Quantities can be written as words, not just numbers.
- Copy ingredient names exactly as written in the source. Do not correct spelling or substitute words.

STEPS:
- Copy each step exactly as written in the source. Do not rephrase or reword.
- Do NOT split one step into multiple steps.
- Do NOT merge steps. Do NOT add steps that don't exist in the source.
- Do NOT invent details.
- Do NOT add tips, notes, or serving suggestions as steps unless they are explicitly listed as a step in the source.

GENERAL:
- Only include prepTime and servings if explicitly stated in the source.
- Generate 3-5 short tags in the source language. Tags must ONLY be one of these categories:
  1. Cuisine type (e.g. italian, asian, mexican, middle eastern, איטלקי, אסיאתי)
  2. Main protein/dish type (e.g. chicken, fish, pasta, salad, עוף, דגים)
  3. Course type (e.g. main course, side dish, starter, dessert, מנה עיקרית, קינוח)
- Return ONLY the JSON, nothing else.`;

function extractImageUrl(html: string, baseUrl: string): string | undefined {
  try {
    const ldJsonMatches = html.match(
      /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
    );
    if (ldJsonMatches) {
      for (const block of ldJsonMatches) {
        const jsonStr = block
          .replace(/<script[^>]*>/i, '')
          .replace(/<\/script>/i, '')
          .trim();
        try {
          let parsed = JSON.parse(jsonStr);
          if (parsed['@graph']) parsed = parsed['@graph'];
          const items = Array.isArray(parsed) ? parsed : [parsed];
          for (const item of items) {
            if (
              item['@type'] === 'Recipe' ||
              (Array.isArray(item['@type']) && item['@type'].includes('Recipe'))
            ) {
              const img = item.image;
              if (img) {
                const imgUrl =
                  typeof img === 'string'
                    ? img
                    : Array.isArray(img)
                    ? img[0]
                    : img.url;
                if (typeof imgUrl === 'string')
                  return new URL(imgUrl, baseUrl).href;
              }
            }
          }
        } catch { /* skip invalid JSON-LD */ }
      }
    }

    const ogMatch =
      html.match(
        /<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["'][^>]*>/i,
      ) ||
      html.match(
        /<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:image["'][^>]*>/i,
      );
    if (ogMatch?.[1]) return new URL(ogMatch[1], baseUrl).href;

    const twMatch =
      html.match(
        /<meta[^>]*(?:name|property)=["']twitter:image["'][^>]*content=["']([^"']+)["'][^>]*>/i,
      ) ||
      html.match(
        /<meta[^>]*content=["']([^"']+)["'][^>]*(?:name|property)=["']twitter:image["'][^>]*>/i,
      );
    if (twMatch?.[1]) return new URL(twMatch[1], baseUrl).href;
  } catch { /* ignore */ }
  return undefined;
}

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

  const { url } = await req.json();
  if (!url) {
    return new Response(JSON.stringify({ error: 'url is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY');
  if (!ANTHROPIC_API_KEY) {
    return new Response(
      JSON.stringify({ error: 'ANTHROPIC_API_KEY not configured' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }

  // Fetch the page
  const pageRes = await fetch(url, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (compatible; MiseRecipeApp/1.0; +https://mise.app)',
    },
  });

  if (!pageRes.ok) {
    return new Response(
      JSON.stringify({ error: `Could not fetch URL (${pageRes.status})` }),
      { status: 422, headers: { 'Content-Type': 'application/json' } },
    );
  }

  const html = await pageRes.text();
  const imageUrl = extractImageUrl(html, url);

  const stripped = html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<nav[\s\S]*?<\/nav>/gi, '')
    .replace(/<footer[\s\S]*?<\/footer>/gi, '')
    .replace(/<header[\s\S]*?<\/header>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim()
    .slice(0, 12000);

  const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: `Extract EXACTLY the recipe from this webpage. Do not invent anything — only use what is in the text. Preserve the original language.\n\nURL: ${url}\n\nPage content:\n${stripped}`,
        },
        { role: 'assistant', content: '{' },
      ],
    }),
  });

  if (!claudeRes.ok) {
    const err = await claudeRes.text();
    return new Response(
      JSON.stringify({ error: `Claude API error: ${err}` }),
      { status: 502, headers: { 'Content-Type': 'application/json' } },
    );
  }

  const claudeData = await claudeRes.json();
  const rawText = '{' + (claudeData.content?.[0]?.text || '');
  const recipe = parseRecipeJson(rawText) as Record<string, unknown>;

  return new Response(
    JSON.stringify({ ...recipe, imageUrl }),
    { headers: { 'Content-Type': 'application/json' } },
  );
});
