import Anthropic from '@anthropic-ai/sdk';
import { NextApiRequest, NextApiResponse } from 'next';

// Make sure to use the correct environment variable name
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

function stripHtmlTags(str: string): string {
  return str.replace(/<[^>]*>/g, '');
}

function stripHtmlFromObject(obj: any): void {
  Object.keys(obj).forEach(key => {
    if (typeof obj[key] === 'string') {
      obj[key] = stripHtmlTags(obj[key]);
    } else if (typeof obj[key] === 'object' && obj[key] !== null) {
      stripHtmlFromObject(obj[key]);
    }
  });
}

function completeJSON(incompleteJSON: string): string {
  let depth = 0;
  let inString = false;
  let escape = false;

  for (let i = 0; i < incompleteJSON.length; i++) {
    const char = incompleteJSON[i];
    if (!inString) {
      if (char === '{') depth++;
      if (char === '}') depth--;
    }
    if (char === '"' && !escape) inString = !inString;
    escape = char === '\\' && !escape;
  }

  // Complete the JSON by adding closing braces and brackets
  return incompleteJSON + '}'.repeat(depth);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
      const { targetAudience, helpDescription, offerType } = req.body;

      const prompt = `Create a detailed avatar for a target audience with the following characteristics:
        Target Audience: ${targetAudience}
        Help Description: ${helpDescription}
        Offer Type: ${offerType}
        
        Please provide the avatar details in the following JSON format:
        {
          "details": {
            "name": "...",
            "gender": "...",
            "ageRange": "...",
            "relationshipStatus": "...",
            "children": "...",
            "career": "...",
            "income": "..."
          },
          "story": "Start with the avatar's name and then provide a brief story...",
          "shortDescription": {
            "name": "...",
            "profession": "...",
            "niche": "..."
          },
          "currentWants": {
            "main": "...",
            "subPoints": ["...", "...", "..."]
          },
          "painPoints": [
            {
              "main": "...",
              "subPoints": ["...", "...", "..."]
            },
            {
              "main": "...",
              "subPoints": ["...", "...", "..."]
            }
          ],
          "desires": [
            {
              "main": "...",
              "subPoints": ["...", "...", "..."]
            },
            {
              "main": "...",
              "subPoints": ["...", "...", "..."]
            }
          ],
          "offerResults": [
            {
              "main": "...",
              "subPoints": ["...", "...", "..."]
            },
            {
              "main": "...",
              "subPoints": ["...", "...", "..."]
            }
          ],
          "humiliation": [
            {
              "main": "...",
              "subPoints": ["...", "...", "..."]
            },
            {
              "main": "...",
              "subPoints": ["...", "...", "..."]
            }
          ],
          "frustrations": [
            {
              "main": "...",
              "subPoints": ["...", "...", "..."]
            },
            {
              "main": "...",
              "subPoints": ["...", "...", "..."]
            }
          ],
          "complaints": [
            {
              "main": "...",
              "subPoints": ["...", "...", "..."]
            },
            {
              "main": "...",
              "subPoints": ["...", "...", "..."]
            }
          ],
          "biggestProblem": {
            "financial": {
              "desire": "...",
              "problem": "..."
            },
            "emotional": {
              "desire": "...",
              "problem": "..."
            }
          },
          "costOfNotBuying": {
            "financial": "...",
            "emotional": "...",
            "social": "..."
          },
          "biggestWant": {
            "main": "...",
            "subPoints": ["...", "...", "..."]
          },
          "additionalDetails": {
            "avatarAndProblem": "...",
            "desiredOutcome": "...",
            "ineffectiveMethod1": "...",
            "ineffectiveMethod2": "...",
            "ineffectiveMethod3": "...",
            "newSolutionName": "...",
            "imageGenerationKeywords": "..."
          }
        }
        
        Ensure that the shortDescription provides a concise summary in the format: {Name} - {Profession} - {Niche}.
        The niche should be a short, specific area of focus based on the help description.
        For currentWants, provide a main want and 3-5 sub-points related to it.
        For painPoints, desires, offerResults, humiliation, frustrations, and complaints, provide 2-3 main points, each with 2-4 sub-points.
        For biggestProblem, provide financial and emotional aspects, each with a desire and a problem.
        
        Important: Provide only the JSON object as the response, without any additional text or formatting.
        
        For costOfNotBuying, provide specific consequences in financial, emotional, and social aspects if the avatar doesn't solve their problem or doesn't buy the solution.

        For biggestWant, provide the avatar's most significant desire or goal related to the problem, with a main point and 3-5 sub-points elaborating on it.

        For the additionalDetails field, provide the following:
        - avatarAndProblem: A brief description of the specific avatar and their main problem.
        - desiredOutcome: The ideal result the avatar wants to achieve.
        - ineffectiveMethod1: First common but ineffective method they might have tried to fix their problem.
        - ineffectiveMethod2: Second common but ineffective method they might have tried to fix their problem.
        - ineffectiveMethod3: Third common but ineffective method they might have tried to fix their problem.
        - newSolutionName: Create a catchy name for a potential solution to the avatar's problem.
        - imageGenerationKeywords: Provide 5-7 keywords or short phrases, separated by commas, that could be used for generating images related to the avatar and their situation.`;

      const completion = await anthropic.completions.create({
        model: "claude-2",
        max_tokens_to_sample: 1500,
        prompt: `Human: ${prompt}\n\nAssistant: Here's the avatar in the requested JSON format:`,
      });

      console.log('Raw AI response:', completion.completion);

      // Extract JSON from the completion and complete it if necessary
      const jsonMatch = completion.completion.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error('Failed to extract JSON from AI response');
        throw new Error('Failed to extract JSON from the API response');
      }

      const completedJSON = completeJSON(jsonMatch[0]);

      let avatarData;
      try {
        avatarData = JSON.parse(completedJSON);
      } catch (error) {
        console.error('Failed to parse JSON:', error);
        console.error('Completed JSON string:', completedJSON);
        throw new Error('Failed to parse AI response');
      }
      
      // Strip HTML tags from all string fields in the avatar data
      stripHtmlFromObject(avatarData);
      
      // Ensure shortDescription exists and has all required fields
      if (!avatarData.shortDescription || !avatarData.shortDescription.name || !avatarData.shortDescription.profession || !avatarData.shortDescription.niche) {
        avatarData.shortDescription = {
          name: avatarData.details.name || "Unnamed",
          profession: avatarData.details.career || "Professional",
          niche: helpDescription || "General"
        };
      }

      const formattedAdditionalDetails = `
Avatar and Their Problem: ${avatarData.additionalDetails.avatarAndProblem}
Desired Outcome: ${avatarData.additionalDetails.desiredOutcome}
Ineffective Method 1: ${avatarData.additionalDetails.ineffectiveMethod1}
Ineffective Method 2: ${avatarData.additionalDetails.ineffectiveMethod2}
Ineffective Method 3: ${avatarData.additionalDetails.ineffectiveMethod3}
New Solution Name: ${avatarData.additionalDetails.newSolutionName}
`;

      res.status(200).json(avatarData);
    } catch (error: unknown) {
      console.error('Error generating avatar:', error);
      res.status(500).json({ 
        error: 'Failed to generate avatar', 
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
