import { type Type } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiProduces,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
  type SchemaObject,
} from '@nestjs/swagger';
import { AccountController } from '../controllers/account.controller';
import { accountSchema, changePasswordSchema } from '../controllers/account.controller/request.schema';
import { AudiencesController } from '../controllers/audiences.controller';
import { audienceSchema } from '../controllers/audiences.controller/request.schema';
import { CampaignsController } from '../controllers/campaigns.controller';
import { campaignSchema } from '../controllers/campaigns.controller/request.schema';
import { ExecutionGroupsController } from '../controllers/executionGroup.controller';
import { executionGroupSchema } from '../controllers/executionGroup.controller/request.schema';
import { HealthController } from '../controllers/health.controller';
import { LifecycleHookController } from '../controllers/lifecycleHook.controller';
import { lifecycleHookSchema } from '../controllers/lifecycleHook.controller/request.schema';
import { RolesController } from '../controllers/roles.controller';
import { roleSchema } from '../controllers/roles.controller/request.schema';
import { TenantsController } from '../controllers/tenants.controller';
import { tenantSchema } from '../controllers/tenants.controller/request.schema';
import { TrackEventController } from '../controllers/trackEvent.controller';
import { trackEventSchema } from '../controllers/trackEvent.controller/request.schema';
import { UsersController } from '../controllers/users.controller';
import { newUserSchema, oldUserSchema } from '../controllers/users.controller/request.schema';
import commonConstants from '../libs/sharedConstants';
import { AuthController } from '../modules/public/controllers/auth.controller';
import { logInSchema } from '../modules/public/controllers/auth.controller/request.schema';
import { ScriptController } from '../modules/public/controllers/script.controller';
import { ApiZodBody } from './decorators';

function bindDocumentation<T extends Type<object>>(controller: T, tag: string, operations: Partial<Record<Extract<keyof InstanceType<T>, string>, MethodDecorator[]>>): void {
  ApiTags(tag)(controller);

  for (const method of Object.keys(operations) as Extract<keyof InstanceType<T>, string>[]) {
    const decorators = operations[method];
    if (!decorators) continue;

    const descriptor = Object.getOwnPropertyDescriptor(controller.prototype, method);
    if (!descriptor) {
      throw new Error(`Swagger documentation refers to missing handler ${controller.name}.${method}`);
    }

    for (const decorator of decorators) {
      decorator(controller.prototype, method, descriptor);
    }
  }
}

const authorized = [
  ApiCookieAuth('cookie'),
  ApiBadRequestResponse({ description: 'The request does not match the contract or contains invalid parameters.' }),
  ApiUnauthorizedResponse({ description: 'Authentication is missing or the credentials are invalid.' }),
  ApiForbiddenResponse({ description: 'The user is not authorized to perform this operation.' }),
];

const tenantOperations = ['asc' as const, 'desc' as const];
const campaignStatuses = ['active' as const, 'inactive' as const];
const tenantParam = ApiParam({ description: 'Numeric tenant identifier.', example: 1, name: 'tenantId', type: Number });
const pageQuery = ApiQuery({
  description: 'Page number (integer).',
  name: 'page',
  required: true,
  schema: { default: 0, example: 0, type: 'integer' },
});
const quantityQuery = ApiQuery({
  description: 'Number of results per page.',
  name: 'quantity',
  required: true,
  schema: { default: 25, example: 25, type: 'integer' },
});
const campaignOrderByQuery = ApiQuery({
  description: 'Sort field.',
  name: 'orderBy',
  required: true,
  schema: { default: 'updatedAt', enum: ['status', 'name', 'id', 'updatedAt'], type: 'string' },
});
const executionGroupOrderByQuery = ApiQuery({
  description: 'Sort field.',
  name: 'orderBy',
  required: true,
  schema: { default: 'id', enum: ['status', 'name', 'id', 'updatedAt'], type: 'string' },
});
const lifecycleHookOrderByQuery = ApiQuery({
  description: 'Sort field.',
  name: 'orderBy',
  required: true,
  schema: { default: 'updatedAt', enum: ['id', 'name', 'option', 'status', 'updatedAt'], type: 'string' },
});
const ascendingOrderDirectionQuery = ApiQuery({
  description: 'Sort direction.',
  name: 'orderDirection',
  required: true,
  schema: { default: 'asc', enum: tenantOperations, type: 'string' },
});
const descendingOrderDirectionQuery = ApiQuery({
  description: 'Sort direction.',
  name: 'orderDirection',
  required: true,
  schema: { default: 'desc', enum: tenantOperations, type: 'string' },
});
const allStatusesFilter = ApiQuery({
  description: 'Repeat this parameter to filter by status: `active` or `inactive`.',
  explode: true,
  name: 'statusList',
  required: false,
  schema: {
    default: [...campaignStatuses],
    items: { enum: [...campaignStatuses], type: 'string' },
    type: 'array',
  },
  style: 'form',
});
const emptyTextSearchQuery = ApiQuery({
  description: 'Optional text to search by name.',
  name: 'textSearch',
  required: false,
  schema: { default: '', example: '', type: 'string' },
});
const emptyResponse = { schema: { example: {}, type: 'object' as const } };
const created = (description: string, schema?: SchemaObject) => ApiCreatedResponse({ description, ...(schema ? { schema } : emptyResponse) });
const ok = (description: string, schema?: SchemaObject) => ApiOkResponse({ description, ...(schema ? { schema } : emptyResponse) });

const objectSchema = (properties: Record<string, SchemaObject>, required: string[] = Object.keys(properties)) => ({
  properties,
  required,
  type: 'object' as const,
});
const arrayOf = (items: SchemaObject) => ({ items, type: 'array' as const });

const roleSchemaShape = objectSchema({
  description: { example: 'Can view campaigns.', type: 'string' },
  id: { example: 3, type: 'integer' },
  name: { example: 'Analyst', type: 'string' },
  permissions: { example: ['campaign:read'], items: { type: 'string' }, type: 'array' },
});

const userSchemaShape = objectSchema({
  email: { example: 'ada@example.com', type: 'string' },
  id: { example: 12, type: 'integer' },
  name: { example: 'Ada Lovelace', type: 'string' },
  roles: { example: [roleSchemaShape], items: roleSchemaShape, type: 'array' },
});

const tenantSchemaShape = objectSchema({
  description: { example: 'Example store for A/B testing.', type: 'string' },
  domain: { example: 'shop.example.com', type: 'string' },
  id: { example: 1, type: 'integer' },
  name: { example: 'Example store', type: 'string' },
});

const audienceRequirementLeafShape = objectSchema({
  data: { example: { comparator: 'equal', eventCount: 1, quantityOperator: 'equal', timeAmount: 1, timeUnit: 'days', trackEventId: 7, value: 'accepted' }, type: 'object' },
  type: { example: 'string', type: 'string' },
});

const audienceSchemaShape = objectSchema({
  createdAt: { example: '2025-01-15T00:00:00.000Z', format: 'date-time', type: 'string' },
  id: { example: 4, type: 'integer' },
  name: { example: 'Recent buyers', type: 'string' },
  requirements: { example: { data: { children: [audienceRequirementLeafShape], operator: 'and' }, type: 'node' }, type: 'object' },
  tenantId: { example: 1, type: 'integer' },
  updatedAt: { example: '2025-01-16T00:00:00.000Z', format: 'date-time', type: 'string' },
});

const audienceForMenuSchemaShape = objectSchema({
  createdAt: { example: '2025-01-15T00:00:00.000Z', format: 'date-time', type: 'string' },
  id: { example: 4, type: 'integer' },
  name: { example: 'Recent buyers', type: 'string' },
  updatedAt: { example: '2025-01-16T00:00:00.000Z', format: 'date-time', type: 'string' },
});

const executionGroupSchemaShape = objectSchema({
  createdAt: { example: '2025-01-15T00:00:00.000Z', format: 'date-time', type: 'string' },
  id: { example: 7, type: 'integer' },
  name: { example: 'Checkout experimentos', type: 'string' },
  onlyCampaignsPreviouslyExecuted: { example: false, type: 'boolean' },
  onlyOneCampaignPerPageLoad: { example: true, type: 'boolean' },
  status: { example: 'active', type: 'string' },
  tenantId: { example: 1, type: 'integer' },
  updatedAt: { example: '2025-01-16T00:00:00.000Z', format: 'date-time', type: 'string' },
  waitForEveryCampaignToBeEvaluated: { example: true, type: 'boolean' },
});

const campaignTriggerItemShape = objectSchema({
  data: { example: {}, type: 'object' },
  id: { example: 1, type: 'integer' },
  type: { example: 'pageLoad', type: 'string' },
});

const campaignVariationShape = objectSchema({
  css: { example: '', type: 'string' },
  html: { example: '<p>Variante A</p>', type: 'string' },
  id: { example: 1, type: 'integer' },
  javascript: { example: '() => {}', type: 'string' },
  name: { example: 'Variante A', type: 'string' },
  traffic: { example: 100, type: 'integer' },
});

const campaignSchemaShape = objectSchema({
  createdAt: { example: '2025-01-15T00:00:00.000Z', format: 'date-time', type: 'string' },
  executionGroupId: {
    description: 'Execution group identifier, or null when the campaign is not assigned to an execution group.',
    example: 7,
    nullable: true,
    type: 'integer',
  },
  id: { example: 9, type: 'integer' },
  name: { example: 'Checkout experiment', type: 'string' },
  requirements: { example: { data: { children: [], operator: 'and' }, type: 'node' }, type: 'object' },
  status: { example: 'active', type: 'string' },
  tenantId: { example: 1, type: 'integer' },
  triggers: { example: [campaignTriggerItemShape], items: campaignTriggerItemShape, type: 'array' },
  updatedAt: { example: '2025-01-16T00:00:00.000Z', format: 'date-time', type: 'string' },
  variations: { example: [campaignVariationShape], items: campaignVariationShape, type: 'array' },
});

const campaignForMenuSchemaShape = objectSchema({
  createdAt: { example: '2025-01-15T00:00:00.000Z', format: 'date-time', type: 'string' },
  executionGroupId: { example: null, nullable: true, type: 'integer' },
  id: { example: 9, type: 'integer' },
  name: { example: 'Checkout experiment', type: 'string' },
  status: { example: 'active', type: 'string' },
  tenantId: { example: 1, type: 'integer' },
  updatedAt: { example: '2025-01-16T00:00:00.000Z', format: 'date-time', type: 'string' },
});

const trackEventSchemaShape = objectSchema({
  createdAt: { example: '2025-01-15T00:00:00.000Z', format: 'date-time', type: 'string' },
  id: { example: 8, type: 'integer' },
  javascript: { example: 'return { orderId: 123 };', type: 'string' },
  multipleTimes: { example: false, type: 'boolean' },
  name: { example: 'Purchase completed', type: 'string' },
  status: { example: 'active', type: 'string' },
  tenantId: { example: 1, type: 'integer' },
  updatedAt: { example: '2025-01-16T00:00:00.000Z', format: 'date-time', type: 'string' },
});

const lifecycleHookSchemaShape = objectSchema({
  createdAt: { example: '2025-01-15T00:00:00.000Z', format: 'date-time', type: 'string' },
  id: { example: 6, type: 'integer' },
  javascript: { example: 'async () => true', type: 'string' },
  name: { example: 'Script initialization', type: 'string' },
  option: { example: 'scriptStart', type: 'string' },
  status: { example: 'active', type: 'string' },
  tenantId: { example: 1, type: 'integer' },
  updatedAt: { example: '2025-01-16T00:00:00.000Z', format: 'date-time', type: 'string' },
});

const healthStatusSchemaShape = objectSchema({
  deployed: { example: true, type: 'boolean' },
  fileExists: { example: true, type: 'boolean' },
});

const statusFilter = ApiQuery({
  description: 'Repeat this parameter to filter by status: `active` or `inactive`.',
  enum: commonConstants.arrayStatusArray,
  isArray: true,
  name: 'statusList',
  required: false,
});

export function applySwaggerDocumentation(): void {
  bindDocumentation(AccountController, 'account', {
    updateAccount: [
      ApiOperation({ description: 'Updates the authenticated user name and email.', summary: 'Update profile' }),
      ...authorized,
      ApiZodBody(accountSchema, 'User name and email.', { email: 'ada@example.com', name: 'Ada Lovelace' }),
      ok('Profile updated.'),
    ],
    updatePassword: [
      ApiOperation({ description: 'Verifies the current password before saving the new password.', summary: 'Change password' }),
      ...authorized,
      ApiZodBody(changePasswordSchema, 'Current and new passwords.', { newPassword: 'new-password', oldPassword: 'current-password' }),
      ok('Password updated.'),
    ],
  });

  bindDocumentation(AudiencesController, 'audiences', {
    create: [
      ApiOperation({ description: 'Creates an audience with nested inclusion rules.', summary: 'Create audience' }),
      ...authorized,
      tenantParam,
      ApiZodBody(audienceSchema, 'Audience name and logical requirements tree.', {
        name: 'Recent buyers',
        requirements: { data: { children: [], operator: 'and' }, type: 'node' },
      }),
      created('Audience created.'),
    ],
    get: [
      ApiOperation({ description: 'Returns the audience and its requirements tree.', summary: 'Get audience' }),
      ...authorized,
      tenantParam,
      ApiParam({ description: 'Numeric audience identifier.', example: 1, name: 'audienceId', type: Number }),
      ApiOkResponse({ description: 'Audience and evaluation rules.', schema: audienceSchemaShape }),
      ApiNotFoundResponse({ description: 'The audience was not found in the specified tenant.' }),
    ],
    getAllForCampaign: [
      ApiOperation({ description: 'Returns audiences available to associate with campaigns.', summary: 'List audiences for campaigns' }),
      ...authorized,
      tenantParam,
      ApiOkResponse({
        description: 'Audiences available for campaigns.',
        schema: arrayOf(audienceForMenuSchemaShape),
      }),
    ],
    getMany: [
      ApiOperation({ description: 'Returns the tenant audiences with search, sorting, pagination, and status filtering.', summary: 'List audiences' }),
      ...authorized,
      tenantParam,
      ApiQuery({
        description: 'Sort field.',
        name: 'orderBy',
        required: true,
        schema: { default: 'updatedAt', enum: ['status', 'name', 'id', 'updatedAt'], type: 'string' },
      }),
      descendingOrderDirectionQuery,
      pageQuery,
      quantityQuery,
      statusFilter,
      emptyTextSearchQuery,
      ApiOkResponse({
        description: 'Audiences and pagination metadata.',
        schema: objectSchema({
          audiences: { items: audienceForMenuSchemaShape, type: 'array' },
          count: { example: 42, type: 'integer' },
        }),
      }),
    ],
    remove: [
      ApiOperation({ description: 'Deletes the specified audience from the tenant.', summary: 'Delete audience' }),
      ...authorized,
      tenantParam,
      ApiParam({ description: 'Numeric audience identifier.', example: 1, name: 'audienceId', type: Number }),
      ok('Audience deleted.'),
    ],
    update: [
      ApiOperation({ description: 'Replaces the name and evaluation rules.', summary: 'Update audience' }),
      ...authorized,
      tenantParam,
      ApiParam({ description: 'Numeric audience identifier.', example: 1, name: 'audienceId', type: Number }),
      ApiZodBody(audienceSchema, 'Updated audience name and logical requirements tree.', {
        name: 'Repeat customers',
        requirements: { data: { children: [], operator: 'or' }, type: 'node' },
      }),
      ok('Audience updated.'),
    ],
  });

  bindDocumentation(CampaignsController, 'campaigns', {
    create: [
      ApiOperation({ description: 'Creates a campaign with its requirements, triggers, and variations.', summary: 'Create campaign' }),
      ...authorized,
      tenantParam,
      ApiZodBody(campaignSchema, 'The variation traffic allocation must total exactly 100. Requirements form a logical tree.', {
        name: 'Checkout experiment',
        requirements: { data: { children: [], operator: 'and' }, type: 'node' },
        status: 'active',
        triggers: [{ data: {}, id: 1, type: 'pageLoad' }],
        variations: [{ css: '', html: '<p>Variante A</p>', id: 1, javascript: '() => {}', name: 'Variante A', traffic: 100 }],
      }),
      created('Campaign created.'),
    ],
    get: [
      ApiOperation({ description: 'Returns the campaign, its requirements, triggers, and variations.', summary: 'Get campaign' }),
      ...authorized,
      tenantParam,
      ApiParam({ description: 'Numeric campaign identifier.', example: 1, name: 'campaignId', type: Number }),
      ApiOkResponse({
        content: {
          'application/json': {
            examples: {
              assignedToExecutionGroup: {
                summary: 'Campaign assigned to an execution group',
                value: {
                  createdAt: '2025-01-15T00:00:00.000Z',
                  executionGroupId: 7,
                  id: 9,
                  name: 'Checkout experiment',
                  requirements: { data: { children: [], operator: 'and' }, type: 'node' },
                  status: 'active',
                  tenantId: 1,
                  triggers: [{ data: {}, id: 1, type: 'pageLoad' }],
                  updatedAt: '2025-01-16T00:00:00.000Z',
                  variations: [{ css: '', html: '<p>Variant A</p>', id: 1, javascript: '() => {}', name: 'Variant A', traffic: 100 }],
                },
              },
              notAssignedToExecutionGroup: {
                summary: 'Campaign without an execution group',
                value: {
                  createdAt: '2025-01-15T00:00:00.000Z',
                  executionGroupId: null,
                  id: 9,
                  name: 'Checkout experiment',
                  requirements: { data: { children: [], operator: 'and' }, type: 'node' },
                  status: 'active',
                  tenantId: 1,
                  triggers: [{ data: {}, id: 1, type: 'pageLoad' }],
                  updatedAt: '2025-01-16T00:00:00.000Z',
                  variations: [{ css: '', html: '<p>Variant A</p>', id: 1, javascript: '() => {}', name: 'Variant A', traffic: 100 }],
                },
              },
            },
            schema: campaignSchemaShape,
          },
        },
        description: 'Campaign and complete configuration. `executionGroupId` is null when the campaign is not assigned to an execution group.',
      }),
      ApiNotFoundResponse({ description: 'The campaign was not found in the specified tenant.' }),
    ],
    getAllLightVersion: [
      ApiOperation({ description: 'Returns a reduced list of campaigns eligible for an execution group.', summary: 'List campaigns for execution groups' }),
      ...authorized,
      tenantParam,
      ApiOkResponse({
        description: 'Campaigns available for execution groups.',
        schema: arrayOf(campaignForMenuSchemaShape),
      }),
    ],
    getMany: [
      ApiOperation({ description: 'Returns the tenant campaigns with search, sorting, pagination, and status filtering.', summary: 'List campaigns' }),
      ...authorized,
      tenantParam,
      campaignOrderByQuery,
      descendingOrderDirectionQuery,
      pageQuery,
      quantityQuery,
      allStatusesFilter,
      emptyTextSearchQuery,
      ApiOkResponse({
        content: {
          'application/json': {
            examples: {
              campaignsWithAndWithoutExecutionGroups: {
                summary: 'Campaigns with and without execution groups',
                value: {
                  campaigns: [
                    {
                      createdAt: '2025-01-15T00:00:00.000Z',
                      executionGroupId: null,
                      id: 9,
                      name: 'Checkout experiment',
                      status: 'active',
                      tenantId: 1,
                      updatedAt: '2025-01-16T00:00:00.000Z',
                    },
                    {
                      createdAt: '2025-01-15T00:00:00.000Z',
                      executionGroupId: 7,
                      id: 10,
                      name: 'Product page experiment',
                      status: 'active',
                      tenantId: 1,
                      updatedAt: '2025-01-16T00:00:00.000Z',
                    },
                  ],
                  count: 26,
                },
              },
            },
            schema: objectSchema({
              campaigns: { items: campaignForMenuSchemaShape, type: 'array' },
              count: { example: 26, type: 'integer' },
            }),
          },
        },
        description: 'Campaigns and pagination metadata.',
      }),
    ],
    remove: [
      ApiOperation({ description: 'Deletes the specified campaign from the tenant.', summary: 'Delete campaign' }),
      ...authorized,
      tenantParam,
      ApiParam({ description: 'Numeric campaign identifier.', example: 1, name: 'campaignId', type: Number }),
      ok('Campaign deleted.'),
    ],
    update: [
      ApiOperation({ description: 'Replaces the campaign configuration, triggers, and variations.', summary: 'Update campaign' }),
      ...authorized,
      tenantParam,
      ApiParam({ description: 'Numeric campaign identifier.', example: 1, name: 'campaignId', type: Number }),
      ApiZodBody(campaignSchema, 'The variation traffic allocation must total exactly 100. Requirements form a logical tree.', {
        name: 'Updated checkout experiment',
        requirements: { data: { children: [], operator: 'and' }, type: 'node' },
        status: 'active',
        triggers: [{ data: {}, id: 1, type: 'pageLoad' }],
        variations: [{ css: '', html: '<p>Variante A</p>', id: 1, javascript: '() => {}', name: 'Variante A', traffic: 100 }],
      }),
      ok('Campaign updated.'),
    ],
  });

  bindDocumentation(ExecutionGroupsController, 'execution-groups', {
    create: [
      ApiOperation({ description: 'Associates the specified campaigns with a new tenant execution group.', summary: 'Create execution group' }),
      ...authorized,
      tenantParam,
      ApiZodBody(executionGroupSchema, 'Execution group configuration and associated campaigns.', {
        campaignIds: [34, 35],
        name: 'Checkout experimentos',
        onlyCampaignsPreviouslyExecuted: false,
        onlyOneCampaignPerPageLoad: true,
        status: 'active',
        waitForEveryCampaignToBeEvaluated: true,
      }),
      created('Execution group created.'),
    ],
    get: [
      ApiOperation({ description: 'Returns the execution group and its associated campaigns.', summary: 'Get execution group' }),
      ...authorized,
      tenantParam,
      ApiParam({ description: 'Execution group identifier.', example: 1, name: 'executionGroupId', type: Number }),
      ApiOkResponse({ description: 'Execution group with its campaigns.', schema: executionGroupSchemaShape }),
      ApiNotFoundResponse({ description: 'The execution group was not found in the specified tenant.' }),
    ],
    getMany: [
      ApiOperation({ description: 'Returns the tenant execution groups with sorting, pagination, search, and status filtering.', summary: 'List execution groups' }),
      ...authorized,
      tenantParam,
      executionGroupOrderByQuery,
      ascendingOrderDirectionQuery,
      pageQuery,
      quantityQuery,
      allStatusesFilter,
      emptyTextSearchQuery,
      ApiOkResponse({
        description: 'Execution groups and pagination metadata.',
        schema: objectSchema({
          count: { example: 11, type: 'integer' },
          executionGroups: { items: executionGroupSchemaShape, type: 'array' },
        }),
      }),
    ],
    remove: [
      ApiOperation({ description: 'Deletes the execution group from the specified tenant.', summary: 'Delete execution group' }),
      ...authorized,
      tenantParam,
      ApiParam({ description: 'Execution group identifier.', example: 1, name: 'executionGroupId', type: Number }),
      ok('Execution group deleted.'),
    ],
    update: [
      ApiOperation({ description: 'Replaces the execution group configuration and associated campaigns.', summary: 'Update execution group' }),
      ...authorized,
      tenantParam,
      ApiParam({ description: 'Execution group identifier.', example: 1, name: 'executionGroupId', type: Number }),
      ApiZodBody(executionGroupSchema, 'Updated execution group configuration and associated campaigns.', {
        campaignIds: [34],
        name: 'Checkout principal',
        onlyCampaignsPreviouslyExecuted: true,
        onlyOneCampaignPerPageLoad: true,
        status: 'active',
        waitForEveryCampaignToBeEvaluated: true,
      }),
      ok('Execution group updated.'),
    ],
  });

  bindDocumentation(HealthController, 'health', {
    get: [
      ApiOperation({ description: 'Indicates whether the service is deployed and whether the client script exists on disk.', summary: 'Get service health' }),
      ApiOkResponse({
        description: 'Current service status.',
        schema: healthStatusSchemaShape,
      }),
    ],
  });

  bindDocumentation(LifecycleHookController, 'lifecycle-hooks', {
    create: [
      ApiOperation({ description: 'Creates a hook whose `javascript` property must be a single async arrow function.', summary: 'Create lifecycle hook' }),
      ...authorized,
      tenantParam,
      ApiZodBody(lifecycleHookSchema, 'The code must be a single async arrow function. `option` determines when it runs.', {
        javascript: 'async () => true',
        name: 'Script initialization',
        option: 'scriptStart',
        status: 'active',
      }),
      created('Lifecycle hook created.'),
    ],
    get: [
      ApiOperation({ description: 'Returns the configuration for the specified hook.', summary: 'Get lifecycle hook' }),
      ...authorized,
      tenantParam,
      ApiParam({ description: 'Numeric lifecycle hook identifier.', example: 1, name: 'lifecycleHookId', type: Number }),
      ApiOkResponse({ description: 'Lifecycle hook.', schema: lifecycleHookSchemaShape }),
      ApiNotFoundResponse({ description: 'The lifecycle hook was not found in the specified tenant.' }),
    ],
    getMany: [
      ApiOperation({ description: 'Returns the tenant hooks with search, sorting, pagination, and status filtering.', summary: 'List lifecycle hooks' }),
      ...authorized,
      tenantParam,
      lifecycleHookOrderByQuery,
      descendingOrderDirectionQuery,
      pageQuery,
      quantityQuery,
      allStatusesFilter,
      emptyTextSearchQuery,
      ApiOkResponse({
        description: 'Lifecycle hooks and pagination metadata.',
        schema: objectSchema({
          count: { example: 7, type: 'integer' },
          lifecycleHooks: { items: lifecycleHookSchemaShape, type: 'array' },
        }),
      }),
    ],
    remove: [
      ApiOperation({ description: 'Deletes the hook and regenerates the tenant script.', summary: 'Delete lifecycle hook' }),
      ...authorized,
      tenantParam,
      ApiParam({ description: 'Numeric lifecycle hook identifier.', example: 1, name: 'lifecycleHookId', type: Number }),
      ok('Lifecycle hook deleted.'),
      ApiNotFoundResponse({ description: 'The lifecycle hook was not found in the specified tenant.' }),
    ],
    update: [
      ApiOperation({ description: 'Updates the hook and regenerates the tenant script.', summary: 'Update lifecycle hook' }),
      ...authorized,
      tenantParam,
      ApiParam({ description: 'Numeric lifecycle hook identifier.', example: 1, name: 'lifecycleHookId', type: Number }),
      ApiZodBody(lifecycleHookSchema, 'The code must be a single async arrow function. `option` determines when it runs.', {
        javascript: 'async () => true',
        name: 'Script initialization',
        option: 'scriptStart',
        status: 'active',
      }),
      ok('Lifecycle hook updated.'),
      ApiNotFoundResponse({ description: 'The lifecycle hook was not found in the specified tenant.' }),
    ],
  });

  bindDocumentation(RolesController, 'roles', {
    create: [
      ApiOperation({ description: 'Creates a role with a name, description, and permissions.', summary: 'Create role' }),
      ...authorized,
      ApiZodBody(roleSchema, 'Role details. If `permissions` is omitted, an empty list is stored.', {
        description: 'Can view campaigns.',
        name: 'Analyst',
        permissions: ['campaign:read'],
      }),
      created('Role created.'),
    ],
    getAll: [
      ApiOperation({ description: 'Returns the roles available for permission management.', summary: 'List roles' }),
      ...authorized,
      ApiOkResponse({
        description: 'List of roles and associated permissions.',
        schema: arrayOf(roleSchemaShape),
      }),
    ],
    remove: [
      ApiOperation({ description: 'Deletes the specified role.', summary: 'Delete role' }),
      ...authorized,
      ApiParam({ description: 'Numeric role identifier.', example: 3, name: 'roleId', type: Number }),
      ok('Role deleted.'),
    ],
    update: [
      ApiOperation({ description: 'Updates the role name, description, and permissions.', summary: 'Update role' }),
      ...authorized,
      ApiParam({ description: 'Numeric role identifier.', example: 3, name: 'roleId', type: Number }),
      ApiZodBody(roleSchema, 'Updated role details.', {
        description: 'Read access to campaigns.',
        name: 'Campaign analyst',
        permissions: ['campaign:read'],
      }),
      ok('Role updated.'),
    ],
  });

  bindDocumentation(TenantsController, 'tenants', {
    create: [
      ApiOperation({ description: 'Creates a tenant and returns the created resource.', summary: 'Create tenant' }),
      ...authorized,
      ApiZodBody(tenantSchema, 'Basic tenant details.', {
        description: 'Example store for A/B testing.',
        domain: 'shop.example.com',
        name: 'Example store',
      }),
      ApiCreatedResponse({ description: 'Tenant created and returned in the response.' }),
    ],
    get: [
      ApiOperation({ description: 'Returns the configuration for the specified tenant.', summary: 'Get tenant' }),
      ...authorized,
      tenantParam,
      ApiOkResponse({ description: 'Tenant details.', schema: tenantSchemaShape }),
      ApiNotFoundResponse({ description: 'The tenant was not found.' }),
    ],
    getAll: [
      ApiOperation({ description: 'Returns all available tenants.', summary: 'List tenants' }),
      ApiOkResponse({ description: 'Tenant list.', schema: arrayOf(tenantSchemaShape) }),
    ],
    remove: [
      ApiOperation({ description: 'Deletes the specified tenant.', summary: 'Delete tenant' }),
      ...authorized,
      tenantParam,
      ApiOkResponse({ description: 'Tenant deleted and returned in the response.', schema: tenantSchemaShape }),
      ApiNotFoundResponse({ description: 'The tenant was not found.' }),
    ],
    update: [
      ApiOperation({ description: 'Replaces the tenant name, domain, and description.', summary: 'Update tenant' }),
      ...authorized,
      tenantParam,
      ApiZodBody(tenantSchema, 'Updated tenant details.', {
        description: 'Main store.',
        domain: 'shop.example.com',
        name: 'Main store',
      }),
      ApiOkResponse({ description: 'Tenant updated and returned in the response.', schema: tenantSchemaShape }),
    ],
  });

  bindDocumentation(TrackEventController, 'track-events', {
    create: [
      ApiOperation({ description: 'Registers an event with valid JavaScript code to extract its data.', summary: 'Create tracking event' }),
      ...authorized,
      tenantParam,
      ApiZodBody(trackEventSchema, 'The `javascript` property must contain syntactically valid JavaScript code.', {
        javascript: 'return { orderId: 123 };',
        multipleTimes: false,
        name: 'Purchase completed',
        status: 'active',
      }),
      created('Tracking event created.'),
    ],
    get: [
      ApiOperation({ description: 'Returns the configuration for the specified event.', summary: 'Get tracking event' }),
      ...authorized,
      tenantParam,
      ApiParam({ description: 'Numeric tracking event identifier.', example: 1, name: 'trackEventId', type: Number }),
      ApiOkResponse({ description: 'Tracking event.', schema: trackEventSchemaShape }),
      ApiNotFoundResponse({ description: 'The tracking event was not found in the specified tenant.' }),
    ],
    getAllForAudience: [
      ApiOperation({ description: 'Returns events available for audience rules.', summary: 'List events for audiences' }),
      ...authorized,
      tenantParam,
      ApiOkResponse({ description: 'Events available for audience rules.', schema: arrayOf(trackEventSchemaShape) }),
    ],
    getMany: [
      ApiOperation({ description: 'Returns tenant events with search, sorting, pagination, and status filtering.', summary: 'List tracking events' }),
      ...authorized,
      tenantParam,
      ApiQuery({ description: 'Sort field.', enum: ['status', 'name', 'id', 'updatedAt'], example: 'name', name: 'orderBy' }),
      ApiQuery({ description: 'Sort direction.', enum: tenantOperations, example: 'asc', name: 'orderDirection' }),
      pageQuery,
      quantityQuery,
      statusFilter,
      ApiQuery({ default: '', description: 'Optional text to search by name.', example: 'purchase', name: 'textSearch', required: false }),
      ApiOkResponse({
        description: 'Tracking events and pagination metadata.',
        schema: objectSchema({
          count: { example: 18, type: 'integer' },
          trackEvents: { items: trackEventSchemaShape, type: 'array' },
        }),
      }),
    ],
    remove: [
      ApiOperation({ description: 'Deletes the specified event from the tenant.', summary: 'Delete tracking event' }),
      ...authorized,
      tenantParam,
      ApiParam({ description: 'Numeric tracking event identifier.', example: 1, name: 'trackEventId', type: Number }),
      ok('Tracking event deleted.'),
    ],
    update: [
      ApiOperation({ description: 'Updates the status and code used to extract event data.', summary: 'Update tracking event' }),
      ...authorized,
      tenantParam,
      ApiParam({ description: 'Numeric tracking event identifier.', example: 1, name: 'trackEventId', type: Number }),
      ApiZodBody(trackEventSchema, 'The `javascript` property must contain syntactically valid JavaScript code.', {
        javascript: 'return { orderId: 123 };',
        multipleTimes: false,
        name: 'Purchase completed',
        status: 'active',
      }),
      ok('Tracking event updated.'),
    ],
  });

  bindDocumentation(UsersController, 'users', {
    create: [
      ApiOperation({ description: 'Creates a user with login credentials.', summary: 'Create user' }),
      ...authorized,
      ApiZodBody(newUserSchema, 'Initial name, email, and password.', {
        email: 'ada@example.com',
        name: 'Ada Lovelace',
        password: 'change-this-password',
      }),
      created('User created.'),
    ],
    get: [
      ApiOperation({ description: 'Resolves the authenticated user from the `accessToken` cookie.', summary: 'Get current user' }),
      ApiCookieAuth('cookie'),
      ApiOkResponse({ description: 'Authenticated user details.', schema: userSchemaShape }),
      ApiUnauthorizedResponse({ description: 'The cookie is missing, expired, or does not match a user.' }),
    ],
    getAll: [
      ApiOperation({ description: 'Returns users available for administration.', summary: 'List users' }),
      ...authorized,
      ApiOkResponse({ description: 'List of users and their assigned roles.', schema: arrayOf(userSchemaShape) }),
    ],
    remove: [
      ApiOperation({ description: 'Deletes the specified user.', summary: 'Delete user' }),
      ...authorized,
      ApiParam({ description: 'Numeric user identifier.', example: 23, name: 'userId', type: Number }),
      ok('User deleted.'),
    ],
    update: [
      ApiOperation({ description: 'Updates the user name, email, and roles.', summary: 'Update user' }),
      ...authorized,
      ApiParam({ description: 'Numeric user identifier.', example: 23, name: 'userId', type: Number }),
      ApiZodBody(oldUserSchema, 'Account details and roles to assign.', {
        email: 'ada@example.com',
        name: 'Ada Lovelace',
        roleIds: [3, 4],
      }),
      ok('User updated.'),
    ],
  });

  bindDocumentation(AuthController, 'sessions', {
    logIn: [
      ApiOperation({ description: 'Validates credentials and sets secure access and refresh cookies.', summary: 'Sign in' }),
      ApiZodBody(logInSchema, 'User credentials.', { email: 'ada@example.com', password: 'password' }),
      ApiCreatedResponse({ description: 'Signed in; tokens are sent in HttpOnly cookies.' }),
      ApiUnauthorizedResponse({ description: 'Incorrect email or password.' }),
    ],
    logOut: [
      ApiOperation({ description: 'Clears the access and refresh cookies from the browser.', summary: 'Sign out' }),
      ApiOkResponse({ description: 'Session cookies cleared.', ...emptyResponse }),
    ],
    refreshToken: [
      ApiOperation({
        description:
          'Reads the `refreshToken` cookie, rotates it, and sets new `refreshToken` and `accessToken` HttpOnly cookies. Call this endpoint before protected endpoints when you need a fresh access token. The browser stores the returned cookies automatically. Returns an empty response if no valid refresh token is available.',
        summary: 'Refresh session',
      }),
      ApiCookieAuth('cookie'),
      ApiOkResponse({ description: 'Session refreshed when the refresh token is valid.', ...emptyResponse }),
    ],
  });

  bindDocumentation(ScriptController, 'scripts', {
    get: [
      ApiOperation({
        description: 'Returns the generated client script for the tenant. This public resource is intended to be embedded on the tenant website.',
        summary: 'Get tenant client script',
      }),
      tenantParam,
      ApiProduces('text/javascript'),
      ApiOkResponse({ content: { 'text/javascript': { schema: { type: 'string' } } }, description: 'Tenant JavaScript client script.' }),
      ApiBadRequestResponse({ description: 'The tenant identifier is not a valid integer.' }),
    ],
    getScript: [
      ApiOperation({ description: 'Returns the debug panel JavaScript bundle.', summary: 'Get debug panel script' }),
      ApiProduces('text/javascript'),
      ApiOkResponse({ content: { 'text/javascript': { schema: { type: 'string' } } }, description: 'Debug panel JavaScript bundle.' }),
    ],
  });
}
