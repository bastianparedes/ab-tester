import { type INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { applySwaggerDocumentation } from './documentation';

export function setupSwagger(app: INestApplication): void {
  const config = new DocumentBuilder()
    .setTitle('AB Tester API')
    .setDescription(
      [
        'AB Tester service API for managing experiments, audiences, events, and tenants.',
        '',
        'Protected administrative resources require the secure `access-token` cookie (the `cookie` scheme).',
        'Sessions are created, refreshed, and closed at `/public/auth/session`; the client script and debug panel are public resources.',
        'Empty write responses are represented as `{}`. Numeric path parameters must be integers.',
      ].join('\n'),
    )
    .setVersion('1.0')
    .addCookieAuth('access-token', { in: 'cookie', type: 'apiKey' }, 'cookie')
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

  SwaggerModule.setup('docs', app, document, {
    customSiteTitle: 'AB Tester API | Swagger',
    swaggerOptions: {
      deepLinking: true,
      displayRequestDuration: true,
      docExpansion: 'list',
      filter: true,
      operationsSorter: 'alpha',
      persistAuthorization: true,
      tagsSorter: 'alpha',
    },
  });
}
