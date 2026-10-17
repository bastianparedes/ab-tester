import { type CallHandler, type ExecutionContext, InternalServerErrorException, Logger, type NestInterceptor, UseInterceptors } from '@nestjs/common';
import { map, type Observable } from 'rxjs';
import { z } from 'zod';

export class ZodResponseInterceptor<T> implements NestInterceptor<unknown, T> {
  private readonly logger = new Logger(ZodResponseInterceptor.name);

  constructor(private readonly schema: z.ZodType<T>) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<T> {
    const request = context.switchToHttp().getRequest<{ method: string; originalUrl?: string; url: string }>();

    return next.handle().pipe(
      map((response: unknown) => {
        const result = this.schema.safeParse(response);
        if (!result.success) {
          this.logger.error(`Invalid response for ${request.method} ${request.originalUrl ?? request.url}: ${JSON.stringify(result.error.issues)}`);
          throw new InternalServerErrorException('The endpoint produced an invalid response');
        }
        return result.data;
      }),
    );
  }
}

export function ZodResponse<T>(schema: z.ZodType<T>): MethodDecorator {
  return UseInterceptors(new ZodResponseInterceptor(schema));
}
