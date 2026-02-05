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
