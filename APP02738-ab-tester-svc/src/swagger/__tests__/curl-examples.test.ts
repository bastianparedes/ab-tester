import { type OpenAPIObject } from '@nestjs/swagger';
import { describe, expect, it } from 'vitest';
import { appendCurlExamples } from '../curl-examples';

describe('appendCurlExamples', () => {
  it('adds a visible cURL snippet with path, query, cookie, and body examples', () => {
    const document = {
      info: { title: 'Test API', version: '1.0' },
      openapi: '3.0.0',
      paths: {
        '/tenants/{tenantId}/campaigns': {
          post: {
            description: 'Creates a campaign.',
            parameters: [
              { in: 'path', name: 'tenantId', required: true, schema: { example: 4, type: 'integer' } },
              { in: 'query', name: 'dryRun', schema: { example: true, type: 'boolean' } },
            ],
            requestBody: {
              content: {
                'application/json': {
                  examples: { example: { value: { name: 'Checkout' } } },
                },
              },
            },
            responses: { '201': { description: 'Created' } },
            security: [{ cookie: [] }],
          },
        },
      },
    } as OpenAPIObject;

    appendCurlExamples(document);

    const operation = document.paths['/tenants/{tenantId}/campaigns']?.post;
    expect(operation?.description).toContain('#### cURL example');
    expect(operation?.description).toContain(
      "curl -X POST 'http://localhost:4000/tenants/4/campaigns?dryRun=true' \\\n  -H 'Content-Type: application/json' \\\n  --data-raw '{\"name\":\"Checkout\"}' \\\n  --cookie 'accessToken=YOUR_TOKEN'",
    );
  });

  it('uses the refresh token cookie and does not append duplicate snippets', () => {
    const document = {
      info: { title: 'Test API', version: '1.0' },
      openapi: '3.0.0',
      paths: {
        '/public/auth/session/refresh': {
          get: {
            responses: { '200': { description: 'OK' } },
            security: [{ cookie: [] }],
          },
        },
      },
    } as OpenAPIObject;

    appendCurlExamples(document);
    appendCurlExamples(document);

    const description = document.paths['/public/auth/session/refresh']?.get?.description;
    expect(description).toContain("--cookie 'refreshToken=YOUR_TOKEN'");
    expect(description?.match(/#### cURL example/g)).toHaveLength(1);
  });
});
