import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { debug } from '@/utils/debug';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const maxDuration = 120;

export const POST = async (req: Request) => {
  try {
    const { avatarDetails } = await req.json();

    // Create a detailed prompt based on avatar details
    const prompt = `Create a professional, photorealistic headshot portrait of a ${avatarDetails.gender || ''} 
    ${avatarDetails.ageRange || ''} professional named ${avatarDetails.name || 'the person'}.
    
    Physical characteristics:
    - ${avatarDetails.appearance || 'Professional appearance'}
    - Well-groomed and polished look
    - Wearing professional business attire
    - Natural, confident expression
    - High-quality studio lighting
    - Clean background
    
    Career context: ${avatarDetails.career || avatarDetails.profession || 'Professional'}
    Personality: ${avatarDetails.personality || 'Confident and approachable'}
    
    Style notes:
    - Professional LinkedIn-style headshot
    - Sharp focus on face
    - Soft, natural lighting
    - Neutral background
    - High-quality, realistic photo
    - No artificial or cartoonish effects
    
    Important: Create a PHOTOREALISTIC image, not illustrated or artistic. The image should look like a real professional headshot photograph.`;

    debug.log('Generating image with prompt:', prompt);

    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: prompt,
      n: 1,
      size: "1024x1024",
      quality: "standard",
      style: "natural" // This helps ensure photorealistic results
    });

    return NextResponse.json({ imageUrl: response.data[0].url });
  } catch (error: any) {
    debug.error('API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 