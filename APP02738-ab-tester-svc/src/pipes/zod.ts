import { BadRequestException, PipeTransform } from '@nestjs/common';
import { ZodSchema, z } from 'zod';

export class ZodValidationPipe<T extends ZodSchema> implements PipeTransform<unknown, z.infer<T>> {
  constructor(private readonly schema: T) {}

  transform(value: unknown): z.infer<T> {
    const result = this.schema.safeParse(value);

    if (!result.success) {
      throw new BadRequestException(JSON.parse(result.error.message));
    }

    return result.data;
  }
}
