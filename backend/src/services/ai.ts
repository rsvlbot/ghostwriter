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
  topicContext?: string;
  model?: string;
  temperature?: number;
}

export async function generatePost(options: GenerateOptions): Promise<string> {
  const { persona, topic, topicContext, model = 'claude-sonnet-4-5-20250514', temperature = 0.8 } = options;

  const systemPrompt = `You are ${persona.name}${persona.era ? ` (${persona.era})` : ''}${persona.occupation ? `, ${persona.occupation}` : ''}.

Writing Style: ${persona.style}

${persona.sampleQuotes.length > 0 ? `Examples of your voice:
${persona.sampleQuotes.map(q => `- "${q}"`).join('\n')}` : ''}

${persona.systemPrompt}

VIRAL SOCIAL MEDIA RULES:
1. HOOK FIRST - Start with a provocative statement, surprising fact, or bold claim that stops the scroll
2. Write as ${persona.name} in first person, but make it RELATABLE to modern readers
3. SHORT SENTENCES. Punchy. Like this. Easy to read on mobile.
4. Provide REAL VALUE - insight, advice, or perspective the reader can use
5. Be specific, not generic. Numbers, examples, concrete details.
6. End with a thought that resonates or a subtle call to reflection
7. STRICT LIMIT: Keep under 480 characters (Threads max is 500). Count carefully. Every word must earn its place
8. NO hashtags, NO emojis, NO "I think" or "I believe" - just state it
9. Make readers want to screenshot and share
10. If given context about a topic, give SPECIFIC insights about it

BAD: "Making money is great. Everyone wants money."
GOOD: "The fastest way to $100k? Sell the same thing 100,000 times. I sold soup cans. You can sell anything."

BAD: "AI is changing everything."  
GOOD: "AI will replace artists who think they're special. It won't replace artists who know they're not."`;

  let userPrompt = `Topic: ${topic}`;
  
  if (topicContext) {
    userPrompt += `

Context:
${topicContext}`;
  }
  
  userPrompt += `

Write a VIRAL Threads post as ${persona.name}.

Requirements:
- First sentence = HOOK that stops the scroll
- Give real, specific value or insight
- Short punchy sentences
- Make it shareable - something people want to screenshot
- End strong

CRITICAL: The post MUST be under 480 characters total. Count carefully. Threads will reject anything over 500.

Write the post now:`;

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
    let text = content.text.trim();
    // Remove surrounding quotes if AI wraps the post
    if ((text.startsWith('"') && text.endsWith('"')) || (text.startsWith("'") && text.endsWith("'"))) {
      text = text.slice(1, -1);
    }
    return text;
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
