import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { section, avatarData } = await req.json();

    let prompt = `Given the following avatar data for a ${avatarData.details.career}:

${JSON.stringify(avatarData, null, 2)}

Generate 3 new detailed points for the "${section}" section. The response should be in the following JSON format:

{
  "headline": "${section.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}",
  "points": [
    "First detailed point specific to their situation",
    "Second detailed point about their needs",
    "Third detailed point about their challenges"
  ]
}

Make the points detailed, emotionally resonant, and specific to this avatar's characteristics and situation.`;

    // Add section-specific focus
    if (section === 'biggest-problem') {
      prompt += ' Focus on their most significant challenges and pain points.';
    } else if (section === 'desires') {
      prompt += ' Focus on their aspirations and what they truly want to achieve.';
    } else if (section === 'pain-points') {
      prompt += ' Focus on their daily struggles and frustrations.';
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        {
          role: "system",
          content: "You are an expert at creating detailed avatar profiles. Provide specific, realistic details and emotionally resonant content."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
    });

    const content = completion.choices[0].message.content;
    if (!content) throw new Error('No content received from OpenAI');

    // Parse the JSON response
    let generatedPoints;
    try {
      generatedPoints = JSON.parse(content);
    } catch (error) {
      // If parsing fails, try to extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No valid JSON found in the API response');
      }
      generatedPoints = JSON.parse(jsonMatch[0]);
    }

    // Return the complete structure
    return NextResponse.json({
      headline: generatedPoints.headline,
      points: generatedPoints.points
    });
  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate points', details: error.message },
      { status: 500 }
    );
  }
} 