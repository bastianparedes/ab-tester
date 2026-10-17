import { ApiBody, type SchemaObject } from '@nestjs/swagger';
import { z } from 'zod';

export function ApiZodBody<T extends z.ZodType>(schema: T, description: string, example?: z.input<T>): MethodDecorator {
  const openApiSchema = z.toJSONSchema(schema, { io: 'input', target: 'openapi-3.0', unrepresentable: 'any' }) as SchemaObject;

  return ApiBody({
    description,
    ...(example === undefined ? {} : { examples: { example: { summary: 'Request example', value: example } } }),
    schema: openApiSchema,
  });
}
