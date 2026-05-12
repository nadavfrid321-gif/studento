// Supabase Edge Function: extract-task
// Takes an image (base64), pasted text, or PDF page images and returns a
// structured task suggestion.
//
// Supports two AI providers, selected via the AI_PROVIDER env var:
//   - "anthropic" (default) — Claude Messages API + tool_use
//   - "google"              — Gemini generateContent + responseSchema
//
// Required env vars (set via `supabase secrets set`):
//   AI_PROVIDER       — "anthropic" | "google" (optional, defaults to "anthropic")
//   ANTHROPIC_API_KEY — when AI_PROVIDER=anthropic
//   GOOGLE_API_KEY    — when AI_PROVIDER=google
//
// Deploy: supabase functions deploy extract-task

import Anthropic from 'npm:@anthropic-ai/sdk@0.65';

const PROVIDER = (Deno.env.get('AI_PROVIDER') ?? 'anthropic').toLowerCase();

const ANTHROPIC_MODEL = 'claude-sonnet-4-6';
const GEMINI_MODEL = 'gemini-2.5-pro';

const SYSTEM = `You are an assistant that extracts a single academic task (assignment, exam, quiz, reading, or event) from a screenshot, photo, or pasted text submitted by an Israeli law/economics student.

The input is in Hebrew (may include English fragments — course names, dates).

Return your answer ONLY by calling the \`record_task\` tool. Fill every field you are confident about. If a field is not stated in the input, omit it.

Heuristics:
- "פסק דין" / "פס\\"ד" / "בג\\"ץ" → type = "reading".
- "תרגיל בית" / "עבודה" / "מטלה" / "תרגיל" → type = "assignment".
- "מבחן" / "בחינת סיום" / "מועד א" → type = "exam".
- "בוחן" / "בחנון" → type = "quiz".
- Convert relative dates ("עד יום ה'", "השבוע", "בשבוע הבא") into ISO 8601 (UTC) assuming Asia/Jerusalem (+02 or +03 depending on DST). If only date is stated, use 23:59 local time.
- If a percentage like "30% מהציון" appears, set weight to 30.
- title should be the concise subject. description holds extra context (page numbers, instructor notes).
- course_name_hint: the course name as it appears in the source, if any.
- confidence: your overall confidence 0–1.`;

const TASK_SCHEMA = {
  type: 'object',
  properties: {
    type: {
      type: 'string',
      enum: ['reading', 'assignment', 'exam', 'quiz', 'event'],
    },
    title: { type: 'string' },
    description: { type: 'string' },
    due_date: {
      type: 'string',
      description: 'ISO 8601 timestamp in UTC, e.g. 2026-05-20T20:59:00Z. Omit if unknown.',
    },
    weight: { type: 'number', description: 'Percentage of final grade, 0–100.' },
    course_name_hint: { type: 'string' },
    confidence: { type: 'number', minimum: 0, maximum: 1 },
  },
  required: ['type', 'title', 'confidence'],
} as const;

interface RequestBody {
  text?: string;
  images?: Array<{ media_type: string; data: string }>;
}

interface ExtractedTask {
  type: string;
  title: string;
  description?: string;
  due_date?: string;
  weight?: number;
  course_name_hint?: string;
  confidence: number;
}

interface ExtractResult {
  task: ExtractedTask;
  usage?: unknown;
}

const cors = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'POST, OPTIONS',
  'access-control-allow-headers': 'authorization, content-type, x-client-info, apikey',
};

async function extractWithAnthropic(body: RequestBody): Promise<ExtractResult> {
  const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not set.');

  interface ImagePart {
    type: 'image';
    source: { type: 'base64'; media_type: string; data: string };
  }
  interface TextPart {
    type: 'text';
    text: string;
  }

  const content: Array<TextPart | ImagePart> = [];

  if (body.images?.length) {
    for (const img of body.images) {
      content.push({
        type: 'image',
        source: { type: 'base64', media_type: img.media_type, data: img.data },
      });
    }
  }

  if (body.text?.trim()) {
    content.push({ type: 'text', text: body.text.trim() });
  } else if (body.images?.length) {
    content.push({ type: 'text', text: 'חלץ את המשימה האקדמית מהתמונה/ות.' });
  }

  const client = new Anthropic({ apiKey });
  const resp = await client.messages.create({
    model: ANTHROPIC_MODEL,
    max_tokens: 1024,
    system: SYSTEM,
    tools: [
      {
        name: 'record_task',
        description: 'Record the extracted academic task.',
        input_schema: TASK_SCHEMA,
      },
    ],
    tool_choice: { type: 'tool', name: 'record_task' },
    messages: [{ role: 'user', content }],
  });

  const toolUse = resp.content.find((c) => c.type === 'tool_use');
  if (!toolUse || toolUse.type !== 'tool_use') {
    throw new Error('Model did not return tool_use');
  }

  return { task: toolUse.input as ExtractedTask, usage: resp.usage };
}

async function extractWithGoogle(body: RequestBody): Promise<ExtractResult> {
  const apiKey = Deno.env.get('GOOGLE_API_KEY');
  if (!apiKey) throw new Error('GOOGLE_API_KEY not set.');

  interface InlineDataPart {
    inline_data: { mime_type: string; data: string };
  }
  interface TextPart {
    text: string;
  }

  const parts: Array<TextPart | InlineDataPart> = [];

  if (body.images?.length) {
    for (const img of body.images) {
      parts.push({ inline_data: { mime_type: img.media_type, data: img.data } });
    }
  }

  if (body.text?.trim()) {
    parts.push({ text: body.text.trim() });
  } else if (body.images?.length) {
    parts.push({ text: 'חלץ את המשימה האקדמית מהתמונה/ות.' });
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${encodeURIComponent(apiKey)}`;

  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: SYSTEM }] },
      contents: [{ role: 'user', parts }],
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: TASK_SCHEMA,
        temperature: 0.2,
      },
    }),
  });

  if (!resp.ok) {
    const errText = await resp.text();
    throw new Error(`Gemini ${resp.status}: ${errText}`);
  }

  const json = await resp.json() as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    usageMetadata?: unknown;
  };

  const text = json.candidates?.[0]?.content?.parts?.map((p) => p.text ?? '').join('') ?? '';
  if (!text) throw new Error('Gemini returned no text content');

  let task: ExtractedTask;
  try {
    task = JSON.parse(text) as ExtractedTask;
  } catch {
    throw new Error(`Gemini returned non-JSON: ${text.slice(0, 200)}`);
  }

  return { task, usage: json.usageMetadata };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });

  try {
    const body = (await req.json()) as RequestBody;

    const hasImages = !!body.images?.length;
    const hasText = !!body.text?.trim();
    if (!hasImages && !hasText) {
      return new Response(JSON.stringify({ error: 'No text or images provided.' }), {
        status: 400,
        headers: { 'content-type': 'application/json', ...cors },
      });
    }

    let result: ExtractResult;
    if (PROVIDER === 'google' || PROVIDER === 'gemini') {
      result = await extractWithGoogle(body);
    } else if (PROVIDER === 'anthropic' || PROVIDER === 'claude') {
      result = await extractWithAnthropic(body);
    } else {
      return new Response(JSON.stringify({ error: `Unknown AI_PROVIDER: ${PROVIDER}` }), {
        status: 500,
        headers: { 'content-type': 'application/json', ...cors },
      });
    }

    return new Response(JSON.stringify({ ok: true, task: result.task, usage: result.usage, provider: PROVIDER }), {
      headers: { 'content-type': 'application/json', ...cors },
    });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ ok: false, error: (err as Error).message }), {
      status: 500,
      headers: { 'content-type': 'application/json', ...cors },
    });
  }
});
