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

  it('uses schema defaults and enums for array query and JSON-compatible request examples', () => {
    const document = {
      info: { title: 'Test API', version: '1.0' },
      openapi: '3.0.0',
      paths: {
        '/items/{itemId}': {
          parameters: [{ in: 'path', name: 'itemId', schema: { default: 7, type: 'integer' } }],
          post: {
            parameters: [
              { in: 'query', name: 'tags', schema: { default: ['red blue', 'green'], type: 'array' } },
              { in: 'query', name: 'state', schema: { enum: ['active', 'inactive'], type: 'string' } },
              { in: 'query', name: 'omitted', schema: { type: 'string' } },
            ],
            requestBody: {
              content: {
                'application/problem+json': { schema: { example: { reason: 'invalid' }, type: 'object' } },
              },
            },
            responses: { '200': { description: 'OK' } },
          },
        },
      },
    } as OpenAPIObject;

    appendCurlExamples(document, 'https://api.example.test/');

    expect(document.paths['/items/{itemId}']?.post?.description).toContain(
      "curl -X POST 'https://api.example.test/items/7?tags=red%20blue&tags=green&state=active' \\\n  -H 'Content-Type: application/json' \\\n  --data-raw '{\"reason\":\"invalid\"}'",
    );
  });

  it('omits body and security options when no JSON example or security is defined', () => {
    const document = {
      info: { title: 'Test API', version: '1.0' },
      openapi: '3.0.0',
      paths: {
        '/empty/{unknown}': {
          get: {
            parameters: [{ in: 'query', name: 'withoutExample', schema: { type: 'string' } }],
            requestBody: { content: { 'text/plain': { schema: { type: 'string' } } } },
            responses: { '200': { description: 'OK' } },
          },
        },
      },
    } as OpenAPIObject;

    appendCurlExamples(document);

    const description = document.paths['/empty/{unknown}']?.get?.description ?? '';
    expect(description).toContain("curl -X GET 'http://localhost:4000/empty/1'");
    expect(description).not.toContain('?withoutExample');
    expect(description).not.toContain('--data-raw');
    expect(description).not.toContain('--cookie');
  });

  it('skips empty path entries and falls back from descriptive JSON examples to schema defaults', () => {
    const document = {
      info: { title: 'Test API', version: '1.0' },
      openapi: '3.0.0',
      paths: {
        '/ignored': null,
        '/fallback': {
          post: {
            requestBody: {
              content: {
                'application/json': {
                  examples: { note: { summary: 'No value supplied' } },
                  schema: { default: { enabled: true }, type: 'object' },
                },
              },
            },
            responses: { '200': { description: 'OK' } },
          },
        },
      },
    } as OpenAPIObject;

    appendCurlExamples(document);

    expect(document.paths['/fallback']?.post?.description).toContain(
      "curl -X POST 'http://localhost:4000/fallback' \\\n  -H 'Content-Type: application/json' \\\n  --data-raw '{\"enabled\":true}'",
    );
  });
});
