import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

interface GenerateOptions {
  persona: {
    name: string;
    era?: string | null;
    occupation?: string | null;
    style: string;
    sampleQuotes: string[];
    systemPrompt: string;
  };
  topic: string;
  model?: string;
  temperature?: number;
}

export async function generatePost(options: GenerateOptions): Promise<string> {
  const { persona, topic, model = 'claude-sonnet-4-20250514', temperature = 0.8 } = options;

  const systemPrompt = `You are ${persona.name}${persona.era ? ` (${persona.era})` : ''}${persona.occupation ? `, ${persona.occupation}` : ''}.

Writing Style: ${persona.style}

${persona.sampleQuotes.length > 0 ? `Examples of your voice:
${persona.sampleQuotes.map(q => `- "${q}"`).join('\n')}` : ''}

${persona.systemPrompt}

IMPORTANT RULES:
1. Write as if YOU are ${persona.name}, using first person
2. Match the writing style perfectly - vocabulary, sentence structure, tone
3. Keep posts concise (under 500 characters) - perfect for social media
4. Be witty, insightful, or provocative as fits the character
5. Reference your known works, experiences, or philosophy when relevant
6. Comment on modern topics through the lens of your historical perspective
7. DO NOT use hashtags or emojis
8. DO NOT break character or mention you are AI
9. Write in English unless specified otherwise`;

  const userPrompt = `Write a Threads post about this topic: ${topic}

Remember: You ARE ${persona.name}. React to this modern topic as they would, with their unique perspective and voice.`;

  const response = await anthropic.messages.create({
    model,
    max_tokens: 500,
    temperature,
    system: systemPrompt,
    messages: [
      { role: 'user', content: userPrompt }
    ]
  });

  const content = response.content[0];
  if (content.type === 'text') {
    return content.text.trim();
  }

  throw new Error('Unexpected response format from AI');
}

export async function generateMultiplePosts(
  options: GenerateOptions,
  count: number = 3
): Promise<string[]> {
  const posts: string[] = [];
  
  for (let i = 0; i < count; i++) {
    const post = await generatePost({
      ...options,
      temperature: options.temperature ? options.temperature + (i * 0.05) : 0.8 + (i * 0.05)
    });
    posts.push(post);
  }

  return posts;
}

interface PersonaAnalysis {
  name: string;
  era: string;
  occupation: string;
  style: string;
  tone: string;
  topics: string[];
  sampleQuotes: string[];
  systemPrompt: string;
  writingPatterns: string;
  vocabulary: string;
  keyThemes: string;
}

/**
 * Analyze a famous person and generate a detailed persona profile
 */
export async function analyzePersona(personName: string, model = 'claude-sonnet-4-20250514'): Promise<PersonaAnalysis> {
  const systemPrompt = `You are an expert biographer and writing analyst. Your task is to analyze famous historical or contemporary figures and create detailed writing profiles that capture their unique voice, style, and perspective.

You have deep knowledge of:
- Their published works, speeches, interviews, and letters
- Their communication patterns, vocabulary preferences, and rhetorical devices
- Their philosophical views, values, and worldview
- Their personality traits and how they manifest in writing
- Historical context and how it influenced their expression

Be specific and detailed. Include actual quotes when possible.`;

  const userPrompt = `Analyze "${personName}" and create a comprehensive writing profile.

Return a JSON object with these fields:
{
  "name": "Full name as they would sign it",
  "era": "Time period they were most active (e.g., '1955-2011' or '20th century physicist')",
  "occupation": "Their primary role/profession",
  "style": "Detailed description of their writing style (2-3 sentences)",
  "tone": "Primary tone: professional/casual/humorous/sarcastic/inspirational/controversial",
  "topics": ["Array of 5-7 topics they frequently discussed"],
  "sampleQuotes": ["5 actual famous quotes that exemplify their voice"],
  "writingPatterns": "Specific patterns in their writing - sentence structure, punctuation, rhetorical devices",
  "vocabulary": "Description of their vocabulary - technical terms, colloquialisms, favorite phrases",
  "keyThemes": "Core themes and values that permeate their communication",
  "systemPrompt": "A detailed system prompt (3-5 paragraphs) that instructs an AI to write exactly like this person. Include specific instructions about their voice, perspective, common phrases, rhetorical techniques, and how they would approach modern topics. Be very specific and detailed."
}

Focus on capturing what makes their communication UNIQUE and RECOGNIZABLE. The goal is to enable AI to write posts that are indistinguishable from what this person would actually write.

Return ONLY valid JSON, no markdown or explanation.`;

  const response = await anthropic.messages.create({
    model,
    max_tokens: 2000,
    temperature: 0.3, // Lower temperature for more accurate analysis
    system: systemPrompt,
    messages: [
      { role: 'user', content: userPrompt }
    ]
  });

  const content = response.content[0];
  if (content.type !== 'text') {
    throw new Error('Unexpected response format from AI');
  }

  try {
    // Clean up potential markdown formatting
    let jsonText = content.text.trim();
    if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/```json?\n?/g, '').replace(/```$/g, '').trim();
    }
    
    const analysis = JSON.parse(jsonText) as PersonaAnalysis;
    return analysis;
  } catch (error) {
    throw new Error(`Failed to parse persona analysis: ${error}`);
  }
}
