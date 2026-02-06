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
export declare function generatePost(options: GenerateOptions): Promise<string>;
export declare function generateMultiplePosts(options: GenerateOptions, count?: number): Promise<string[]>;
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
export declare function analyzePersona(personName: string, model?: string): Promise<PersonaAnalysis>;
export {};
//# sourceMappingURL=ai.d.ts.map