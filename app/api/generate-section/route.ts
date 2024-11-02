import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: Request) {
  try {
    const { section, avatarData } = await req.json();

    let prompt = `Given the following avatar data for a ${avatarData.details.career}:

${JSON.stringify(avatarData, null, 2)}

`;

    if (section === 'biggest-problem') {
      prompt += `Generate 3 new detailed problems (a mix of financial and emotional) for the "${section}" section. The response should be in the following JSON format:

[
  {
    "type": "financial",
    "problem": "Detailed financial problem"
  },
  {
    "type": "emotional",
    "problem": "Detailed emotional problem"
  },
  {
    "type": "financial",
    "problem": "Another detailed financial problem"
  }
]

Ensure the generated problems are relevant, detailed, and specific to the avatar's situation.`;
    } else {
      prompt += `Generate 3 new detailed main points with up to 3 subpoints each for the "${section}" section. The response should be in the following JSON format:

[
  {
    "main": "Main point 1",
    "subPoints": ["Subpoint 1", "Subpoint 2", "Subpoint 3"]
  },
  {
    "main": "Main point 2",
    "subPoints": ["Subpoint 1", "Subpoint 2"]
  },
  {
    "main": "Main point 3",
    "subPoints": ["Subpoint 1", "Subpoint 2", "Subpoint 3"]
  }
]

Ensure the generated points are relevant, detailed, and specific to the avatar's situation and the ${section} section.`;
    }

    prompt += " Provide ONLY the JSON array as the response, with no additional text.";

    const completion = await anthropic.completions.create({
      model: "claude-2",
      prompt: `Human: ${prompt}\n\nAssistant:`,
      max_tokens_to_sample: 1000,
      stop_sequences: ["\nHuman:"],
    });

    let content = completion.completion.trim();
    if (!content) throw new Error('No content received from Anthropic');

    // Extract JSON from the response
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error('No valid JSON found in the API response');
    }

    content = jsonMatch[0];

    // Clean up the content to ensure it's valid JSON
    content = content.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    content = content.replace(/^\s*\[/, '[').replace(/\]\s*$/, ']');

    let generatedPoints;
    try {
      generatedPoints = JSON.parse(content);
    } catch (jsonError) {
      console.error('Failed to parse JSON:', content);
      if (jsonError instanceof Error) {
        throw new Error(`Failed to parse JSON: ${jsonError.message}`);
      } else {
        throw new Error('Failed to parse JSON: Unknown error');
      }
    }

    if (!Array.isArray(generatedPoints)) {
      throw new Error('Generated content is not an array');
    }

    return NextResponse.json(generatedPoints);
  } catch (error: any) {
    console.error('API Error:', error);
    if (error.status === 429) {
      return NextResponse.json({ error: 'API quota exceeded. Please check your Anthropic account.' }, { status: 429 });
    }
    return NextResponse.json({ error: 'Failed to generate points', details: error.message }, { status: 500 });
  }
}
