import { NextRequest, NextResponse } from 'next/server';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

const SYSTEM_PROMPT = `You are CivicSaathi AI, the assistant embedded in Nagriksetu, a civic
platform that helps citizens (1) discover government welfare schemes they're eligible for,
(2) report civic issues (broken streetlights, garbage, leaks, etc.), and (3) track grievances
they've already filed.

Be warm, concise, and practical. Prefer short answers (2-4 sentences) over long ones. When you
explain a scheme, give real specifics if you know them (amount, eligibility, required
documents) and say so plainly if you're not certain of the exact current figures — recommend
opening the scheme page or eligibility checker for verified numbers rather than guessing.

You may suggest 0-4 quick-reply actions per message. Every action needs a short label and an
actionKey. Use these actionKeys when they fit:
- "action_find_schemes" -> opens the eligibility questionnaire
- "action_report_issue" -> opens the civic issue report form
- "action_track_complaint" -> opens the complaints dashboard
- "view_scheme_<slug>" -> opens a specific scheme's page (only use a slug you're confident exists)
- "view_grievance_<id>" -> opens a specific grievance (only use an id from the grievance context given to you)
For anything else — like "tell me more about X" — you can invent a short actionKey (e.g.
"followup_lakshmir_bhandar"); the app will just treat a click on it as the user typing that
label back to you, so keep the label itself clear and conversational.

Respond ONLY with a single JSON object, no markdown fences, no commentary, in this exact shape:
{"reply": "<your reply text, markdown-style **bold** allowed>", "actions": [{"label": "...", "actionKey": "..."}]}
"actions" may be an empty array.`;

export async function POST(req: NextRequest) {
  try {
    const { messages, language, grievances } = await req.json();

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ reply: 'Please send a message.', actions: [] }, { status: 400 });
    }

    const langLine =
      language === 'hi'
        ? 'Reply in Hindi.'
        : language === 'bn'
        ? 'Reply in Bengali.'
        : 'Reply in English.';

    const grievanceLine = `Known grievances for this user (JSON): ${JSON.stringify(grievances ?? [])}`;

    const groqResponse = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        max_tokens: 600,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: `${SYSTEM_PROMPT}\n\n${langLine}\n\n${grievanceLine}` },
          ...messages.map((m: { sender: 'user' | 'assistant'; text: string }) => ({
            role: m.sender === 'user' ? 'user' : 'assistant',
            content: m.text,
          })),
        ],
      }),
    });

    if (!groqResponse.ok) {
      const errText = await groqResponse.text();
      console.error('Groq API error:', groqResponse.status, errText);
      return NextResponse.json(
        { reply: "Sorry, I'm having trouble connecting right now. Please try again in a moment.", actions: [] },
        { status: 500 },
      );
    }

    const groqData = await groqResponse.json();
    const raw: string = groqData?.choices?.[0]?.message?.content ?? '';

    let parsed: { reply: string; actions?: { label: string; actionKey: string }[] };
    try {
      const cleaned = raw.replace(/```json|```/g, '').trim();
      parsed = JSON.parse(cleaned);
    } catch {
      parsed = { reply: raw || "Sorry, I couldn't put together a response.", actions: [] };
    }

    return NextResponse.json(parsed);
  } catch (err) {
    console.error('civic-chat route error:', err);
    return NextResponse.json(
      { reply: "Sorry, I'm having trouble connecting right now. Please try again in a moment.", actions: [] },
      { status: 500 },
    );
  }
}
