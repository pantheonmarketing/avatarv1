import { handleCors } from './corsHandler';

export interface Env {
  AI: any; // This should be more specifically typed if possible
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // Handle CORS
    if (request.method === 'OPTIONS') {
      return handleCors(request);
    }

    try {
      const url = new URL(request.url);
      const prompt = url.searchParams.get('prompt');
      const numSteps = parseInt(url.searchParams.get('num_steps') || '4', 10);

      if (!prompt) {
        return handleCors(request, new Response('Missing prompt parameter', { status: 400 }));
      }

      if (!env.AI) {
        console.error('AI binding is undefined');
        return handleCors(request, new Response('AI binding is not available', { status: 500 }));
      }

      const inputs = {
        prompt: prompt,
        num_steps: Math.min(Math.max(numSteps, 1), 8) // Ensure num_steps is between 1 and 8
      };

      console.log('Attempting to run AI model with inputs:', inputs);

      const result = await env.AI.run(
        "@cf/black-forest-labs/flux-1-schnell",
        inputs
      );

      // The result is a base64 encoded image
      const imageBuffer = Buffer.from(result.image, 'base64');

      return handleCors(request, new Response(imageBuffer, {
        headers: {
          "Content-Type": "image/jpeg",
        },
      }));
    } catch (error: unknown) {
      console.error('Error in Worker:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      return handleCors(request, new Response(`Error generating image: ${errorMessage}`, { status: 500 }));
    }
  },
};
