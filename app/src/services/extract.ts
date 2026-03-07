import * as FileSystem from 'expo-file-system/legacy';
import { ANTHROPIC_API_KEY } from '../config';
import { Ingredient, Step } from '../types';
import { generateId } from '../store';

export interface ExtractedRecipe {
  name: string;
  prepTime?: string;
  servings?: string;
  tags: string[];
  ingredients: Ingredient[];
  steps: Step[];
}

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
- Quantities can be written as words, not just numbers. Examples:
  "חצי תפוז" → name: "תפוז", quantity: "חצי"
  "half an orange" → name: "orange", quantity: "half"
  "שני ביצים" → name: "ביצים", quantity: "2"
  "קורט מלח" → name: "מלח", quantity: "קורט"
  "200 גרם קמח" → name: "קמח", quantity: "200 גרם"
  "a pinch of salt" → name: "salt", quantity: "a pinch"
  "3 כפות שמן זית" → name: "שמן זית", quantity: "3 כפות"
- Copy ingredient names exactly as written in the source. Do not correct spelling or substitute words.

STEPS:
- Copy each step exactly as written in the source. Do not rephrase or reword.
- Do NOT split one step into multiple steps. If the source has 5 steps, return exactly 5 steps.
- Do NOT merge steps. Do NOT add steps that don't exist in the source.
- Do NOT invent details. If the source says "מחבת" (pan), write "מחבת" — do not change it to "תנור" (oven) or anything else.
- Do NOT add tips, notes, or serving suggestions as steps unless they are explicitly listed as a step in the source.

GENERAL:
- If text in an image is blurry or unclear, write exactly what you can read. Do NOT guess missing words.
- Only include prepTime and servings if explicitly stated in the source.
- Generate 3-5 short tags in the source language based on the recipe content.
- Return ONLY the JSON, nothing else.`;

async function callClaude(
  messages: { role: string; content: any }[],
  useVision = false,
): Promise<ExtractedRecipe> {
  if (!ANTHROPIC_API_KEY || ANTHROPIC_API_KEY === 'your-key-here') {
    throw new Error(
      'Set your EXPO_PUBLIC_ANTHROPIC_API_KEY in .env to enable AI extraction',
    );
  }

  // Append assistant prefill to force JSON output
  const allMessages = [
    ...messages,
    { role: 'assistant', content: '{' },
  ];

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: useVision ? 'claude-sonnet-4-20250514' : 'claude-haiku-4-5-20251001',
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: allMessages,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Claude API error (${response.status}): ${err}`);
  }

  const data = await response.json();
  // Prepend the "{" we used as prefill
  const text = '{' + (data.content?.[0]?.text || '');
  console.log('[extract] Raw Claude response:', text.slice(0, 500));

  // Parse JSON from response — strip markdown fences, BOM, and extra whitespace
  let jsonStr = text
    .replace(/```json\s*/gi, '')
    .replace(/```\s*/g, '')
    .trim();

  // Extract the JSON object
  const start = jsonStr.indexOf('{');
  const end = jsonStr.lastIndexOf('}');
  if (start === -1 || end === -1) {
    throw new Error('Could not find JSON in AI response');
  }
  jsonStr = jsonStr.slice(start, end + 1);

  let raw: any;
  try {
    raw = JSON.parse(jsonStr);
  } catch (e: any) {
    // Try fixing common issues: trailing commas, smart quotes
    const cleaned = jsonStr
      .replace(/,\s*([}\]])/g, '$1')       // trailing commas
      .replace(/[\u2018\u2019]/g, "'")      // smart single quotes
      .replace(/[\u201C\u201D]/g, '"')      // smart double quotes
      .replace(/[\u200B-\u200D\uFEFF]/g, ''); // zero-width chars
    try {
      raw = JSON.parse(cleaned);
    } catch {
      throw new Error(`JSON Parse error: ${e.message}`);
    }
  }

  return {
    name: raw.name || 'Untitled Recipe',
    prepTime: raw.prepTime,
    servings: raw.servings,
    tags: raw.tags || [],
    ingredients: (raw.ingredients || []).map(
      (i: { name: string; quantity: string }) => ({
        id: generateId(),
        name: i.name,
        quantity: i.quantity || 'to taste',
      }),
    ),
    steps: (raw.steps || []).map((text: string, idx: number) => ({
      id: generateId(),
      order: idx + 1,
      text,
    })),
  };
}

export async function extractFromUrl(url: string): Promise<ExtractedRecipe> {
  // Fetch the page content
  const res = await fetch(url, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (compatible; MiseRecipeApp/1.0; +https://mise.app)',
    },
  });

  if (!res.ok) {
    throw new Error(`Could not fetch URL (${res.status})`);
  }

  const html = await res.text();

  // Strip heavy HTML to reduce tokens — keep text content
  const stripped = html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<nav[\s\S]*?<\/nav>/gi, '')
    .replace(/<footer[\s\S]*?<\/footer>/gi, '')
    .replace(/<header[\s\S]*?<\/header>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim()
    .slice(0, 12000); // Cap at ~12k chars to stay within token limits

  return callClaude([
    {
      role: 'user',
      content: `Extract EXACTLY the recipe from this webpage. Do not invent anything — only use what is in the text. Preserve the original language.\n\nURL: ${url}\n\nPage content:\n${stripped}`,
    },
  ]);
}

export async function extractFromImage(
  imageUri: string,
): Promise<ExtractedRecipe> {
  // Read image as base64
  const base64 = await FileSystem.readAsStringAsync(imageUri, {
    encoding: 'base64',
  });

  // Detect media type from URI
  const ext = imageUri.split('.').pop()?.toLowerCase() || 'jpeg';
  const mediaType =
    ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';

  return callClaude([
    {
      role: 'user',
      content: [
        {
          type: 'image',
          source: {
            type: 'base64',
            media_type: mediaType,
            data: base64,
          },
        },
        {
          type: 'text',
          text: 'Transcribe the recipe in this image word-for-word. Copy the text exactly as written — same language, same words, same number of steps. Do not rephrase, do not add anything, do not correct anything. If a word is unclear, write what you see.',
        },
      ],
    },
  ], true); // use stronger model for vision/OCR
}
