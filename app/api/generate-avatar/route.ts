import { NextResponse } from 'next/server';
import { Anthropic } from '@anthropic-ai/sdk';
import { debug } from '@/utils/debug';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { targetAudience, helpDescription, offerType } = await req.json();
    debug.log('Generate request:', { targetAudience, helpDescription, offerType });

    if (!targetAudience || !helpDescription) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const prompt = `Create a detailed avatar profile for a target audience with the following information:
      Target Audience: ${targetAudience}
      Help Description: ${helpDescription}
      Offer Type: ${offerType}

      Please provide a structured response with these sections:
      1. Details (name, age, gender, location, career, income level)
      2. Story (background and current situation)
      3. Current Wants (main goals and desires)
      4. Pain Points (current challenges and frustrations)
      5. Desires (aspirations and dreams)
      6. Offer Results (what they want to achieve)
      7. Biggest Problem (financial and emotional challenges)
      8. Humiliation (embarrassing moments or situations)
      9. Frustrations (daily annoyances)
      10. Complaints (what they complain about)
      11. Cost of Not Buying (financial, emotional, and social impact)
      12. Biggest Want (ultimate desire and motivation)

      Format each section appropriately with main points and subpoints where relevant.
      Make the response detailed and specific to this avatar.`;

    const message = await anthropic.messages.create({
      model: 'claude-3-sonnet-20240229',
      max_tokens: 1000,
      messages: [{ 
        role: 'user', 
        content: prompt 
      }],
    });

    // Handle the response content properly
    const response = message.content[0].type === 'text' 
      ? message.content[0].text 
      : '';

    debug.log('Generated response:', response);

    // Parse the response into sections
    const sections = response.split('\n\n').reduce((acc: any, section: string) => {
      const [title, ...content] = section.split('\n');
      const key = title.toLowerCase().replace(/[^a-z]/g, '');
      acc[key] = content.join('\n').trim();
      return acc;
    }, {});

    return NextResponse.json({
      details: sections.details || '',
      story: sections.story || '',
      currentWants: sections.currentwants || '',
      painPoints: sections.painpoints || '',
      desires: sections.desires || '',
      offerResults: sections.offerresults || '',
      biggestProblem: sections.biggestproblem || '',
      humiliation: sections.humiliation || '',
      frustrations: sections.frustrations || '',
      complaints: sections.complaints || '',
      costOfNotBuying: sections.costofnotbuying || '',
      biggestWant: sections.biggestwant || '',
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    debug.error('Error generating avatar:', errorMessage);
    return NextResponse.json(
      { error: 'Failed to generate avatar' },
      { status: 500 }
    );
  }
} 