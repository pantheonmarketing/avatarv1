import { OpenAI } from 'openai';
import { NextRequest, NextResponse } from 'next/server';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const config = {
  runtime: 'edge',
};

export default async function handler(req: NextRequest) {
  if (req.method !== 'POST') {
    return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const { avatarDetails } = await req.json();

    // Create a detailed prompt based on avatar details
    let prompt = `Professional headshot portrait of a `;
    
    if (typeof avatarDetails === 'string') {
      // Parse details from string
      const genderMatch = avatarDetails.match(/Gender:\s*([^,\n]+)/);
      const ageMatch = avatarDetails.match(/Age:\s*([^,\n]+)/);
      const careerMatch = avatarDetails.match(/Career:\s*([^,\n]+)/);
      
      const gender = genderMatch?.[1]?.trim() || '';
      const age = ageMatch?.[1]?.trim() || '';
      const career = careerMatch?.[1]?.trim() || '';
      
      prompt += `${age} ${gender} ${career}, professional attire, natural lighting, neutral background`;
    } else {
      // Use object details
      prompt += `${avatarDetails.age} ${avatarDetails.gender} ${avatarDetails.career || avatarDetails.profession}, professional attire, natural lighting, neutral background`;
    }

    prompt += `. Professional corporate style, high quality, 4k, realistic.`;

    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: prompt,
      n: 1,
      size: "1024x1024",
      quality: "hd",
      style: "natural"
    });

    return NextResponse.json({ imageUrl: response.data[0].url });
  } catch (error) {
    console.error('Error generating image:', error);
    return NextResponse.json(
      { error: 'Failed to generate image' },
      { status: 500 }
    );
  }
} 