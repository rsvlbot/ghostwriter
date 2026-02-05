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
export {};
//# sourceMappingURL=ai.d.ts.map