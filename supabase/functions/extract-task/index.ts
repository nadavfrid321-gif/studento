// Supabase Edge Function: extract-task
// Takes an image (base64), pasted text, or PDF page images and returns a
// structured task suggestion using Claude (Anthropic Messages API + tool_use).
//
// Required env vars (set via `supabase secrets set`):
//   ANTHROPIC_API_KEY — Anthropic API key
//
// Deploy: supabase functions deploy extract-task

import Anthropic from 'npm:@anthropic-ai/sdk@0.65';

const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
if (!apiKey) console.warn('ANTHROPIC_API_KEY not set — extract-task will fail.');

const client = new Anthropic({ apiKey: apiKey ?? '' });

const MODEL = 'claude-sonnet-4-6';

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

const TOOL = {
  name: 'record_task',
  description: 'Record the extracted academic task.',
  input_schema: {
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
  },
} as const;

interface ImagePart {
  type: 'image';
  source: { type: 'base64'; media_type: string; data: string };
}
interface TextPart {
  type: 'text';
  text: string;
}

interface RequestBody {
  text?: string;
  images?: Array<{ media_type: string; data: string }>;
}

const cors = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'POST, OPTIONS',
  'access-control-allow-headers': 'authorization, content-type, x-client-info, apikey',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });

  try {
    const body = (await req.json()) as RequestBody;

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

    if (content.length === 0) {
      return new Response(JSON.stringify({ error: 'No text or images provided.' }), {
        status: 400,
        headers: { 'content-type': 'application/json', ...cors },
      });
    }

    const resp = await client.messages.create({
      model: MODEL,
      max_tokens: 1024,
      system: SYSTEM,
      tools: [TOOL],
      tool_choice: { type: 'tool', name: 'record_task' },
      messages: [{ role: 'user', content }],
    });

    const toolUse = resp.content.find((c) => c.type === 'tool_use');
    if (!toolUse || toolUse.type !== 'tool_use') {
      return new Response(JSON.stringify({ error: 'Model did not return tool_use', raw: resp.content }), {
        status: 502,
        headers: { 'content-type': 'application/json', ...cors },
      });
    }

    return new Response(JSON.stringify({ ok: true, task: toolUse.input, usage: resp.usage }), {
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
