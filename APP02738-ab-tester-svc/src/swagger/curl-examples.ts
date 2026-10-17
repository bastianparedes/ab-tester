import { type OpenAPIObject, type OperationObject, type ParameterObject, type RequestBodyObject, type SchemaObject } from '@nestjs/swagger';

const httpMethods = ['get', 'post', 'put', 'patch', 'delete', 'options', 'head'] as const;
const defaultBaseUrl = 'http://localhost:4000';

function getSchemaValue(schema?: SchemaObject): unknown {
  return schema?.example ?? schema?.default ?? schema?.enum?.[0];
}

function getParameterValue(parameter: ParameterObject): unknown {
  return parameter.example ?? getSchemaValue(parameter.schema as SchemaObject | undefined);
}

function resolvePath(path: string, parameters: ParameterObject[]): string {
  return path.replace(/\{([^}]+)\}/g, (_placeholder, name: string) => {
    const parameter = parameters.find((candidate) => candidate.in === 'path' && candidate.name === name);
    const value = parameter ? getParameterValue(parameter) : undefined;
    return encodeURIComponent(String(value ?? 1));
  });
}

function getRequestBodyExample(requestBody?: RequestBodyObject): unknown {
  const contentType = Object.keys(requestBody?.content ?? {}).find((type) => type === 'application/json' || type.endsWith('+json'));
  if (!contentType) return undefined;

  const mediaType = requestBody?.content[contentType];
  const example = Object.values(mediaType?.examples ?? {}).find((value) => 'value' in value);
  if (example && 'value' in example) return example.value;
  return getSchemaValue(mediaType?.schema as SchemaObject | undefined);
}

function shellQuote(value: string): string {
  return `'${value.replace(/'/g, "'\\''")}'`;
}

function createCurlExample(method: string, path: string, operation: OperationObject, pathParameters: ParameterObject[], baseUrl: string): string {
  const parameters = [...pathParameters, ...(operation.parameters ?? [])].filter((parameter) => '$ref' in parameter === false) as ParameterObject[];
  const resolvedPath = resolvePath(path, parameters);
  const query = parameters
    .filter((parameter) => parameter.in === 'query')
    .flatMap((parameter) => {
      const value = getParameterValue(parameter);
      if (value === undefined) return [];
      const values = Array.isArray(value) ? value : [value];
      return values.map((item) => `${encodeURIComponent(parameter.name)}=${encodeURIComponent(String(item))}`);
    })
    .join('&');
  const url = `${baseUrl.replace(/\/$/, '')}${resolvedPath}${query ? `?${query}` : ''}`;
  const requestBody = getRequestBodyExample(operation.requestBody as RequestBodyObject | undefined);
  const lines = [`curl -X ${method.toUpperCase()} ${shellQuote(url)}`];

  if (requestBody !== undefined) {
    lines.push("  -H 'Content-Type: application/json'", `  --data-raw ${shellQuote(JSON.stringify(requestBody))}`);
  }

  if (operation.security?.length) {
    const cookie = path.includes('/auth/session/refresh') ? 'refreshToken' : 'accessToken';
    lines.push(`  --cookie ${shellQuote(`${cookie}=YOUR_TOKEN`)}`);
  }

  return lines.join(' \\\n');
}

export function appendCurlExamples(document: OpenAPIObject, baseUrl = defaultBaseUrl): void {
  for (const [path, pathItem] of Object.entries(document.paths ?? {})) {
    if (!pathItem) continue;
    const pathParameters = (pathItem.parameters ?? []).filter((parameter) => '$ref' in parameter === false) as ParameterObject[];
    const methods = pathItem as Record<string, unknown>;

    for (const method of httpMethods) {
      const rawOperation = methods[method];
      if (!rawOperation || typeof rawOperation !== 'object') continue;

      const operation = rawOperation as OperationObject;
      const description = operation.description ?? '';
      if (description.includes('#### cURL')) continue;

      const curl = createCurlExample(method, path, operation, pathParameters, baseUrl);
      operation.description = `${description}${description ? '\n\n' : ''}#### cURL example\n\n\`\`\`bash\n${curl}\n\`\`\``;
    }
  }
}
