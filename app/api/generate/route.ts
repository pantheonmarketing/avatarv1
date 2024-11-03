import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  let content = '';

  try {
    const { targetAudience, helpDescription, userId } = await req.json();

    if (!targetAudience || !helpDescription) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const prompt = `Create a detailed avatar profile representing someone from ${targetAudience} who needs help with ${helpDescription}.

For example, if the target audience is "Thai moms" and they need help with "learning English to teach their children", create an avatar of a Thai mother who wants to learn English to help her children succeed.

Return a JSON object with detailed, specific content about this person (NO placeholders, NO brackets):

{
  "details": {
    "name": "A realistic name for this demographic",
    "age": "Typical age for this situation",
    "gender": "Gender based on target audience",
    "location": "Specific location where they live",
    "career": "Their current occupation or role"
  },
  "story": {
    "headline": "Their Background",
    "points": [
      "Their personal history related to this challenge",
      "Current situation that led them to seek help",
      "Previous attempts to solve this problem"
    ]
  },
  "currentWants": {
    "headline": "Immediate Needs",
    "points": [
      "What they urgently want to achieve",
      "Short-term goals related to ${helpDescription}",
      "Immediate changes they want to see"
    ]
  },
  "painPoints": {
    "headline": "Current Struggles",
    "points": [
      "Daily challenges they face with this issue",
      "Specific difficulties related to ${helpDescription}",
      "Problems that keep them up at night"
    ]
  },
  "desires": {
    "headline": "Long-term Dreams",
    "points": [
      "What success looks like to them",
      "Their vision for the future",
      "Long-term impact they want to achieve"
    ]
  },
  "offerResults": {
    "headline": "What They Hope To Gain",
    "points": [
      "Specific outcomes they want to achieve",
      "Changes they want to see in their life",
      "Benefits they're looking for"
    ]
  },
  "biggestProblem": {
    "headline": "Major Obstacles",
    "points": [
      "Their most significant challenge",
      "What's holding them back the most",
      "Biggest barrier to success"
    ]
  },
  "humiliation": {
    "headline": "Personal Fears",
    "points": [
      "What embarrasses them about this situation",
      "Social pressures they feel",
      "Situations that make them uncomfortable"
    ]
  },
  "frustrations": {
    "headline": "Daily Irritations",
    "points": [
      "Regular challenges they face",
      "Recurring problems that bother them",
      "Situations that cause stress"
    ]
  },
  "complaints": {
    "headline": "Common Grievances",
    "points": [
      "What they're tired of dealing with",
      "Issues they frequently mention",
      "Problems they want solved"
    ]
  },
  "costOfNotBuying": {
    "headline": "Consequences of Inaction",
    "points": [
      "What happens if they don't solve this problem",
      "Future challenges they'll face without help",
      "Opportunities they'll miss"
    ]
  },
  "biggestWant": {
    "headline": "Ultimate Goals",
    "points": [
      "Their dream outcome",
      "What perfect success looks like",
      "The transformation they want"
    ]
  }
}

Important:
1. This avatar represents someone FROM the target audience who NEEDS help
2. Make all content specific to ${targetAudience} and their situation with ${helpDescription}
3. Use realistic details that match their demographic and culture
4. Focus on their perspective, challenges, and desires
5. Make each point detailed and emotionally resonant
6. Keep the content authentic to their situation`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are an expert at creating detailed avatar profiles for target audiences. You provide specific, realistic details and emotionally resonant content."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 3000
    });

    const messageContent = completion.choices[0]?.message?.content;
    if (!messageContent) {
      throw new Error('No content received from OpenAI');
    }

    content = messageContent.trim();
    
    // Clean up the response
    content = content
      .replace(/```json\s*|\s*```/g, '')
      .replace(/^[^{]*/, '')
      .replace(/}[^}]*$/, '}');

    let avatarData;
    try {
      avatarData = JSON.parse(content);
    } catch (error) {
      console.error('JSON parsing error:', error);
      console.error('Content attempting to parse:', content);
      throw new Error(`Failed to parse avatar data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Add metadata
    const finalData = {
      ...avatarData,
      targetAudience,
      helpDescription,
      clerk_user_id: userId,
      created_at: new Date().toISOString()
    };

    return NextResponse.json(finalData);
  } catch (error: any) {
    console.error('Generate avatar error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to generate avatar', 
        details: error.message,
        raw: error,
        ...(process.env.NODE_ENV === 'development' ? { 
          debug: {
            message: error.message,
            stack: error.stack,
            rawResponse: content
          }
        } : {})
      }, 
      { status: 500 }
    );
  }
} 