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

function jsonSchemaToZod(schema: JsonSchema): z.ZodTypeAny {
  if (schema.type !== 'object' || !schema.properties) {
    return z.object({});
  }

  const shape: Record<string, z.ZodTypeAny> = {};
  const required = new Set(schema.required || []);

  for (const [key, prop] of Object.entries(schema.properties)) {
    let zodType: z.ZodTypeAny;

    switch (prop.type) {
      case 'string':
        zodType = z.string();
        break;
      case 'number':
        zodType = z.number();
        break;
      case 'integer':
        zodType = z.number().int();
        break;
      case 'boolean':
        zodType = z.boolean();
        break;
      case 'array':
        zodType = z.array(z.unknown());
        break;
      default:
        zodType = z.unknown();
        break;
    }

    if (!required.has(key)) {
      zodType = zodType.optional();
    }

    if (prop.default !== undefined) {
      zodType = zodType.optional().default(prop.default);
    }

    shape[key] = zodType;
  }

  return z.object(shape);
}

function buildFriendlyError(issue: z.ZodIssue, label: string): string {
  const path = issue.path.join('.');
  const fieldLabel = path || '参数';

  switch (issue.code) {
    case 'invalid_type':
      if (issue.received === 'undefined') {
        return `缺少必填参数：${fieldLabel}`;
      }
      return `参数类型错误：${fieldLabel} 应为 ${issue.expected}，实际为 ${issue.received}`;
    case 'invalid_literal':
      return `参数值错误：${fieldLabel} 值不符合预期`;
    case 'too_small':
      if (issue.type === 'number') {
        return `参数值过小：${fieldLabel} 最小值为 ${issue.minimum}`;
      }
      return `参数长度不足：${fieldLabel} 最小长度为 ${issue.minimum}`;
    case 'too_big':
      if (issue.type === 'number') {
        return `参数值过大：${fieldLabel} 最大值为 ${issue.maximum}`;
      }
      return `参数长度超限：${fieldLabel} 最大长度为 ${issue.maximum}`;
    case 'invalid_enum_value':
      return `参数值无效：${fieldLabel} 不在允许的枚举值中`;
    case 'unrecognized_keys':
      return `存在未知参数：${issue.keys?.join(', ') || ''}`;
    default:
      return `参数校验失败：${fieldLabel} - ${issue.message}`;
  }
}

export interface ValidationResult {
  success: boolean;
  data?: Record<string, unknown>;
  errors?: string[];
  schema?: z.ZodObject<z.ZodRawShape>;
}

export function validateArgs(
  toolName: string,
  inputSchema: JsonSchema,
  args: Record<string, unknown> | undefined,
): ValidationResult {
  if (!inputSchema.properties || Object.keys(inputSchema.properties).length === 0) {
    return { success: true, data: {}, schema: z.object({}) };
  }

  const zodSchema = jsonSchemaToZod(inputSchema) as z.ZodObject<z.ZodRawShape>;

  const result = zodSchema.safeParse(args ?? {});

  if (result.success) {
    return { success: true, data: result.data as Record<string, unknown>, schema: zodSchema };
  }

  const errors = result.error.issues.map((issue) =>
    buildFriendlyError(issue, toolName),
  );

  return { success: false, errors };
}
