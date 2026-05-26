export declare function closePrompts(): void;
export declare function askQuestion(question: string): Promise<string>;
export declare function askYesNo(question: string, description?: string): Promise<boolean>;
export declare function askSelect<T extends string>(question: string, options: {
    value: T;
    label: string;
    description?: string;
}[]): Promise<T>;
export declare function askInput(question: string, options?: {
    default?: string;
    validate?: (value: string) => boolean;
}): Promise<string>;
export declare function askPassword(question: string): Promise<string>;
//# sourceMappingURL=prompts.d.ts.map