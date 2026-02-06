"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generatePost = generatePost;
exports.generateMultiplePosts = generateMultiplePosts;
exports.analyzePersona = analyzePersona;
const sdk_1 = __importDefault(require("@anthropic-ai/sdk"));
const anthropic = new sdk_1.default({
    apiKey: process.env.ANTHROPIC_API_KEY
});
async function generatePost(options) {
    const { persona, topic, topicContext, model = 'claude-sonnet-4-5-20250514', temperature = 0.8 } = options;
    const systemPrompt = `You are ${persona.name}${persona.era ? ` (${persona.era})` : ''}${persona.occupation ? `, ${persona.occupation}` : ''}.

Writing Style: ${persona.style}

${persona.sampleQuotes.length > 0 ? `Examples of your voice:
${persona.sampleQuotes.map(q => `- "${q}"`).join('\n')}` : ''}

${persona.systemPrompt}

VIRAL SOCIAL MEDIA RULES:
1. HOOK FIRST - Start with a provocative statement, surprising fact, or bold claim
2. Write as ${persona.name} in first person, RELATABLE to modern readers
3. SHORT SENTENCES. Punchy. But write as ONE CONTINUOUS PARAGRAPH — NO line breaks between sentences
4. Provide REAL VALUE - insight, advice, or perspective
5. Be specific, not generic. Numbers, examples, concrete details
6. End with a thought that resonates
7. STRICT LIMIT: MAX 480 CHARACTERS TOTAL. Count every character. This is non-negotiable
8. NO hashtags, NO emojis, NO "I think" or "I believe"
9. Make readers want to screenshot and share
10. ONE PARAGRAPH ONLY — all sentences flow together as continuous text, no newlines

FORMAT: Single continuous paragraph. No line breaks. No bullet points. Just flowing text.

BAD (line breaks):
"Making money is great.
Everyone wants money."

GOOD (continuous):
"The fastest way to $100k? Sell the same thing 100,000 times. I sold soup cans. You can sell anything."`;
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

CRITICAL RULES:
1. MUST be under 480 characters total. Threads rejects over 500.
2. MUST be ONE continuous paragraph — NO line breaks, NO newlines.
3. Just flowing sentences one after another.

Write the post now (single paragraph, under 480 chars):`;
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
        // Force single paragraph — replace newlines with spaces
        text = text.replace(/\n+/g, ' ').replace(/\s{2,}/g, ' ').trim();
        return text;
    }
    throw new Error('Unexpected response format from AI');
}
async function generateMultiplePosts(options, count = 3) {
    const posts = [];
    for (let i = 0; i < count; i++) {
        const post = await generatePost({
            ...options,
            temperature: options.temperature ? options.temperature + (i * 0.05) : 0.8 + (i * 0.05)
        });
        posts.push(post);
    }
    return posts;
}
/**
 * Analyze a famous person and generate a detailed persona profile
 */
async function analyzePersona(personName, model = 'claude-sonnet-4-20250514') {
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
        const analysis = JSON.parse(jsonText);
        return analysis;
    }
    catch (error) {
        throw new Error(`Failed to parse persona analysis: ${error}`);
    }
}
//# sourceMappingURL=ai.js.map