import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Ghostwriter API',
      version: '1.0.0',
      description: `
# Ghostwriter API

AI-powered social media content generation platform using historical personas.

## Features
- 👻 **Personas** - Historical figures as content creators
- 📝 **Posts** - AI-generated content with approval workflow
- 🔥 **Trends** - Real-time viral topics from Google, HN, Reddit
- 📅 **Schedules** - Automated posting schedules
- 🧵 **Threads** - Meta Threads API integration

## Authentication
Currently no authentication required (add API key middleware for production).
      `,
      contact: {
        name: 'Ghostwriter',
      },
    },
    servers: [
      {
        url: process.env.RAILWAY_PUBLIC_DOMAIN 
          ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`
          : process.env.API_URL || 'http://localhost:3000',
        description: 'API Server',
      },
    ],
    tags: [
      { name: 'Stats', description: 'Dashboard statistics' },
      { name: 'Personas', description: 'Historical persona management' },
      { name: 'Posts', description: 'Content management and workflow' },
      { name: 'Generate', description: 'AI content generation' },
      { name: 'Trends', description: 'Viral topics from multiple sources' },
      { name: 'Schedules', description: 'Automated posting schedules' },
      { name: 'Topics', description: 'Manual topic management' },
      { name: 'Accounts', description: 'Threads account management' },
      { name: 'Settings', description: 'System configuration' },
      { name: 'Threads', description: 'Threads OAuth and publishing' },
    ],
    components: {
      schemas: {
        Persona: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string', example: 'Marcus Aurelius' },
            handle: { type: 'string', example: 'emperor_marcus' },
            era: { type: 'string', example: '121-180 AD' },
            occupation: { type: 'string', example: 'Roman Emperor, Stoic Philosopher' },
            style: { type: 'string', example: 'Contemplative, measured, focused on virtue and duty' },
            sampleQuotes: { 
              type: 'array', 
              items: { type: 'string' },
              example: ['The happiness of your life depends upon the quality of your thoughts.']
            },
            systemPrompt: { type: 'string' },
            avatarUrl: { type: 'string', nullable: true },
            active: { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        Post: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            personaId: { type: 'string', format: 'uuid' },
            accountId: { type: 'string', format: 'uuid', nullable: true },
            content: { type: 'string', example: 'In the age of artificial minds, remember: it is not the machine that thinks, but the human who decides what thinking means.' },
            topic: { type: 'string', example: 'AI and consciousness' },
            status: { 
              type: 'string', 
              enum: ['DRAFT', 'PENDING', 'APPROVED', 'SCHEDULED', 'PUBLISHED', 'REJECTED', 'FAILED'],
            },
            scheduledAt: { type: 'string', format: 'date-time', nullable: true },
            publishedAt: { type: 'string', format: 'date-time', nullable: true },
            threadsId: { type: 'string', nullable: true },
            error: { type: 'string', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Schedule: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            personaId: { type: 'string', format: 'uuid' },
            accountId: { type: 'string', format: 'uuid' },
            postsPerDay: { type: 'integer', example: 3 },
            postingTimes: { 
              type: 'array', 
              items: { type: 'string' },
              example: ['09:00', '15:00', '21:00']
            },
            timezone: { type: 'string', example: 'UTC' },
            autoApprove: { type: 'boolean' },
            active: { type: 'boolean' },
          },
        },
        Topic: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            type: { type: 'string', enum: ['RSS', 'TRENDING', 'MANUAL'] },
            source: { type: 'string' },
            title: { type: 'string', nullable: true },
            description: { type: 'string', nullable: true },
            active: { type: 'boolean' },
          },
        },
        TrendingTopic: {
          type: 'object',
          properties: {
            title: { type: 'string', example: 'OpenAI announces GPT-5' },
            source: { type: 'string', enum: ['google', 'hackernews', 'reddit'] },
            url: { type: 'string', nullable: true },
            score: { type: 'integer', nullable: true },
            description: { type: 'string', nullable: true },
          },
        },
        Account: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            threadsUserId: { type: 'string', nullable: true },
            active: { type: 'boolean' },
          },
        },
        Settings: {
          type: 'object',
          properties: {
            aiModel: { type: 'string', example: 'claude-sonnet-4-20250514' },
            aiTemp: { type: 'number', example: 0.8 },
          },
        },
        Stats: {
          type: 'object',
          properties: {
            totalPersonas: { type: 'integer' },
            totalPosts: { type: 'integer' },
            pendingPosts: { type: 'integer' },
            publishedPosts: { type: 'integer' },
            scheduledPosts: { type: 'integer' },
            postsThisWeek: { type: 'integer' },
            recentPosts: { type: 'array', items: { $ref: '#/components/schemas/Post' } },
          },
        },
        Error: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            message: { type: 'string' },
          },
        },
      },
    },
  },
  apis: ['./src/routes/*.ts', './src/index.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);
