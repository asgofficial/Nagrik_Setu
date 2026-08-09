import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { description } = await request.json();
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey || apiKey === 'dummy-key') {
      return NextResponse.json({ error: 'Gemini API key is not configured' }, { status: 400 });
    }

    const prompt = `
You are the AI routing agent for Nagriksetu, a modern civic portal in India.
Analyze the following citizen complaint description: "${description}"

Determine:
1. Category: Select from: "Road", "Water", "Electricity", "Waste", "Sanitation", "Public Safety", "Corruption", "Harassment", "Other".
2. Routing Department: The municipal department responsible for fixing this issue.
3. Priority Score: Select from: "LOW", "MEDIUM", "HIGH", "CRITICAL". (e.g., set CRITICAL for bribes/harassment, HIGH for safety hazards/blackouts).

Return EXACTLY a JSON object matching this format (do not include markdown wrapping or extra comments):
{
  "category": "Road",
  "priority": "MEDIUM",
  "authority": "Roads & Public Works Department (PWD)"
}
`;

    // Make direct HTTP call to Gemini REST API endpoint
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: 'application/json',
          },
        }),
      }
    );

    const data = await response.json();
    const textResult = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!textResult) {
      throw new Error('Empty response from Gemini model');
    }

    const parsedResult = JSON.parse(textResult.trim());
    return NextResponse.json(parsedResult);
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    return NextResponse.json(
      { error: error?.message || 'AI Classification failed' },
      { status: 500 }
    );
  }
}
