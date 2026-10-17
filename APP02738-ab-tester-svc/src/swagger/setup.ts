import { type INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { appendCurlExamples } from './curl-examples';
import { applySwaggerDocumentation } from './documentation';
import { appendZodResponseSchemas } from './zod-openapi';

export function setupSwagger(app: INestApplication): void {
  const config = new DocumentBuilder()
    .setTitle('AB Tester API')
    .setDescription(
      [
        '## Authentication workflow',
        '',
        '1. If you do not have a refresh token, sign in with `POST /public/auth/session`. The response sets both the `refreshToken` and `accessToken` cookies.',
        '',
        '2. To obtain a fresh access token, call `GET /public/auth/session/refresh` with the `refreshToken` cookie. A valid refresh token is rotated, and the response sets a new `refreshToken` and `accessToken` cookie.',
        '',
        '3. Once the refresh request succeeds, call protected endpoints normally. They authenticate with the `accessToken` cookie.',
        '',
        'The browser stores the `HttpOnly`, `Secure` cookies from these responses automatically. Swagger UI cannot write an `HttpOnly` cookie from its Authorize dialog; use the sign-in or refresh endpoint to establish the cookie session. The refresh token is not persisted in Swagger authorization settings.',
        '',
        'AB Tester service API for managing experiments, audiences, events, and tenants.',
        '',
        'Protected administrative resources require the secure `accessToken` cookie. Sessions are created, refreshed, and closed at `/public/auth/session`; the client script and debug panel are public resources.',
        'Empty write responses are represented as `{}`. Numeric path parameters must be integers.',
      ].join('\n'),
    )
    .setVersion('1.0')
    .addCookieAuth('refreshToken', { in: 'cookie', type: 'apiKey' }, 'cookie')
    .addTag('account', 'Profile and credentials for the authenticated user.')
    .addTag('audiences', 'Audience definitions and evaluation rules.')
    .addTag('campaigns', 'Campaigns, variations, requirements, and triggers.')
    .addTag('execution-groups', 'Execution groups and their associated campaigns.')
    .addTag('health', 'Basic service health status.')
    .addTag('lifecycle-hooks', 'JavaScript functions executed during the lifecycle.')
    .addTag('roles', 'Administrative access roles and permissions.')
    .addTag('sessions', 'Sign in, refresh, and sign out.')
    .addTag('scripts', 'Client scripts and integration resources.')
    .addTag('tenants', 'Tenant configuration and administration.')
    .addTag('track-events', 'Tracking events used by audiences.')
    .addTag('users', 'Administrative users.')
    .build();

  applySwaggerDocumentation();
  const document = SwaggerModule.createDocument(app, config);
  appendZodResponseSchemas(document);
  appendCurlExamples(document);

  SwaggerModule.setup('docs', app, document, {
    customSiteTitle: 'AB Tester API | Swagger',
    swaggerOptions: {
      deepLinking: true,
      defaultModelsExpandDepth: -1,
      displayRequestDuration: true,
      docExpansion: 'list',
      filter: true,
      operationsSorter: 'alpha',
      persistAuthorization: false,
      supportedSubmitMethods: ['get'],
      tagsSorter: 'alpha',
    },
  });
}
