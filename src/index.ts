import { Anthropic } from '@anthropic-ai/sdk';

const anthropicClient = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const exportObject = {
  anthropic: anthropicClient,
  // Add any other exports here
};

export interface Env {
  AI: any; // This should be more specifically typed if possible
}

export default exportObject;
