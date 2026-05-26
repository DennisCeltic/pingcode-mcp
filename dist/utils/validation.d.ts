import { z } from 'zod';
interface JsonSchemaProperty {
    type?: string;
    description?: string;
    default?: unknown;
}
export interface JsonSchema {
    type: 'object';
    properties?: Record<string, JsonSchemaProperty>;
    required?: string[];
}
export interface ValidationResult {
    success: boolean;
    data?: Record<string, unknown>;
    errors?: string[];
    schema?: z.ZodObject<z.ZodRawShape>;
}
export declare function validateArgs(toolName: string, inputSchema: JsonSchema, args: Record<string, unknown> | undefined): ValidationResult;
export {};
//# sourceMappingURL=validation.d.ts.map