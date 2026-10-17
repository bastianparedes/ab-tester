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
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AccountController } from '../controllers/account.controller';
import { accountSchema, changePasswordSchema } from '../controllers/account.controller/request.schema';
import { AudiencesController } from '../controllers/audiences.controller';
import { audienceSchema, getAudiencesQuerySchema } from '../controllers/audiences.controller/request.schema';
import { CampaignsController } from '../controllers/campaigns.controller';
import { campaignSchema, getCampaignsQuerySchema } from '../controllers/campaigns.controller/request.schema';
import { ExecutionGroupsController } from '../controllers/executionGroup.controller';
import { executionGroupSchema, getExecutionGroupsQuerySchema } from '../controllers/executionGroup.controller/request.schema';
import { HealthController } from '../controllers/health.controller';
import { LifecycleHookController } from '../controllers/lifecycleHook.controller';
import { getLifecycleHooksQuerySchema, lifecycleHookSchema } from '../controllers/lifecycleHook.controller/request.schema';
import { RolesController } from '../controllers/roles.controller';
import { roleSchema } from '../controllers/roles.controller/request.schema';
import { TenantsController } from '../controllers/tenants.controller';
import { tenantSchema } from '../controllers/tenants.controller/request.schema';
import { TrackEventController } from '../controllers/trackEvent.controller';
import { getTrackEventQuerySchema, trackEventSchema } from '../controllers/trackEvent.controller/request.schema';
import { UsersController } from '../controllers/users.controller';
import { newUserSchema, oldUserSchema } from '../controllers/users.controller/request.schema';
import { AuthController } from '../modules/public/controllers/auth.controller';
import { logInSchema } from '../modules/public/controllers/auth.controller/request.schema';
import { ScriptController } from '../modules/public/controllers/script.controller';
import { ApiZodBody, ApiZodQuery } from './decorators';

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

const tenantParam = ApiParam({ description: 'Numeric tenant identifier.', example: 1, name: 'tenantId', type: Number });
const emptyResponse = { schema: { example: {}, type: 'object' as const } };
const created = (description: string) => ApiCreatedResponse({ description, ...emptyResponse });
const ok = (description: string) => ApiOkResponse({ description, ...emptyResponse });

export function applySwaggerDocumentation(): void {
  bindDocumentation(AccountController, 'account', {
    updateAccount: [
      ApiOperation({ description: 'Updates the authenticated user name and email.', summary: 'Update profile' }),
      ...authorized,
      ApiZodBody(accountSchema, 'User name and email.'),
      ok('Profile updated.'),
    ],
    updatePassword: [
      ApiOperation({ description: 'Verifies the current password before saving the new password.', summary: 'Change password' }),
      ...authorized,
      ApiZodBody(changePasswordSchema, 'Current and new passwords.'),
      ok('Password updated.'),
    ],
  });

  bindDocumentation(AudiencesController, 'audiences', {
    create: [
      ApiOperation({ description: 'Creates an audience with nested inclusion rules.', summary: 'Create audience' }),
      ...authorized,
      tenantParam,
      ApiZodBody(audienceSchema, 'Audience name and logical requirements tree.'),
      created('Audience created.'),
    ],
    get: [
      ApiOperation({ description: 'Returns the audience and its requirements tree.', summary: 'Get audience' }),
      ...authorized,
      tenantParam,
      ApiParam({ description: 'Numeric audience identifier.', example: 1, name: 'audienceId', type: Number }),
      ApiOkResponse({ description: 'Audience and evaluation rules.' }),
      ApiNotFoundResponse({ description: 'The audience was not found in the specified tenant.' }),
    ],
    getAllForCampaign: [
      ApiOperation({ description: 'Returns audiences available to associate with campaigns.', summary: 'List audiences for campaigns' }),
      ...authorized,
      tenantParam,
      ApiOkResponse({ description: 'Audiences available for campaigns.' }),
    ],
    getMany: [
      ApiOperation({ description: 'Returns the tenant audiences with search, sorting, pagination, and status filtering.', summary: 'List audiences' }),
      ...authorized,
      tenantParam,
      ApiZodQuery(getAudiencesQuerySchema),
      ApiOkResponse({ description: 'Audiences and pagination metadata.' }),
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
      ApiZodBody(audienceSchema, 'Updated audience name and logical requirements tree.'),
      ok('Audience updated.'),
    ],
  });

  bindDocumentation(CampaignsController, 'campaigns', {
    create: [
      ApiOperation({ description: 'Creates a campaign with its requirements, triggers, and variations.', summary: 'Create campaign' }),
      ...authorized,
      tenantParam,
      ApiZodBody(campaignSchema, 'The variation traffic allocation must total exactly 100. Requirements form a logical tree.'),
      created('Campaign created.'),
    ],
    get: [
      ApiOperation({ description: 'Returns the campaign, its requirements, triggers, and variations.', summary: 'Get campaign' }),
      ...authorized,
      tenantParam,
      ApiParam({ description: 'Numeric campaign identifier.', example: 1, name: 'campaignId', type: Number }),
      ApiOkResponse({ description: 'Campaign and complete configuration. `executionGroupId` is null when the campaign is not assigned to an execution group.' }),
      ApiNotFoundResponse({ description: 'The campaign was not found in the specified tenant.' }),
    ],
    getAllLightVersion: [
      ApiOperation({ description: 'Returns a reduced list of campaigns eligible for an execution group.', summary: 'List campaigns for execution groups' }),
      ...authorized,
      tenantParam,
      ApiOkResponse({ description: 'Campaigns available for execution groups.' }),
    ],
    getMany: [
      ApiOperation({ description: 'Returns the tenant campaigns with search, sorting, pagination, and status filtering.', summary: 'List campaigns' }),
      ...authorized,
      tenantParam,
      ApiZodQuery(getCampaignsQuerySchema),
      ApiOkResponse({ description: 'Campaigns and pagination metadata.' }),
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
      ApiZodBody(campaignSchema, 'The variation traffic allocation must total exactly 100. Requirements form a logical tree.'),
      ok('Campaign updated.'),
    ],
  });

  bindDocumentation(ExecutionGroupsController, 'execution-groups', {
    create: [
      ApiOperation({ description: 'Associates the specified campaigns with a new tenant execution group.', summary: 'Create execution group' }),
      ...authorized,
      tenantParam,
      ApiZodBody(executionGroupSchema, 'Execution group configuration and associated campaigns.'),
      created('Execution group created.'),
    ],
    get: [
      ApiOperation({ description: 'Returns the execution group and its associated campaigns.', summary: 'Get execution group' }),
      ...authorized,
      tenantParam,
      ApiParam({ description: 'Execution group identifier.', example: 1, name: 'executionGroupId', type: Number }),
      ApiOkResponse({ description: 'Execution group with its campaigns.' }),
      ApiNotFoundResponse({ description: 'The execution group was not found in the specified tenant.' }),
    ],
    getMany: [
      ApiOperation({ description: 'Returns the tenant execution groups with sorting, pagination, search, and status filtering.', summary: 'List execution groups' }),
      ...authorized,
      tenantParam,
      ApiZodQuery(getExecutionGroupsQuerySchema),
      ApiOkResponse({ description: 'Execution groups and pagination metadata.' }),
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
      ApiZodBody(executionGroupSchema, 'Updated execution group configuration and associated campaigns.'),
      ok('Execution group updated.'),
    ],
  });

  bindDocumentation(HealthController, 'health', {
    get: [
      ApiOperation({ description: 'Indicates whether the service is deployed and whether the client script exists on disk.', summary: 'Get service health' }),
      ApiOkResponse({ description: 'Current service status.' }),
    ],
  });

  bindDocumentation(LifecycleHookController, 'lifecycle-hooks', {
    create: [
      ApiOperation({ description: 'Creates a hook whose `javascript` property must be a single async arrow function.', summary: 'Create lifecycle hook' }),
      ...authorized,
      tenantParam,
      ApiZodBody(lifecycleHookSchema, 'The code must be a single async arrow function. `option` determines when it runs.'),
      created('Lifecycle hook created.'),
    ],
    get: [
      ApiOperation({ description: 'Returns the configuration for the specified hook.', summary: 'Get lifecycle hook' }),
      ...authorized,
      tenantParam,
      ApiParam({ description: 'Numeric lifecycle hook identifier.', example: 1, name: 'lifecycleHookId', type: Number }),
      ApiOkResponse({ description: 'Lifecycle hook.' }),
      ApiNotFoundResponse({ description: 'The lifecycle hook was not found in the specified tenant.' }),
    ],
    getMany: [
      ApiOperation({ description: 'Returns the tenant hooks with search, sorting, pagination, and status filtering.', summary: 'List lifecycle hooks' }),
      ...authorized,
      tenantParam,
      ApiZodQuery(getLifecycleHooksQuerySchema),
      ApiOkResponse({ description: 'Lifecycle hooks and pagination metadata.' }),
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
      ApiZodBody(lifecycleHookSchema, 'The code must be a single async arrow function. `option` determines when it runs.'),
      ok('Lifecycle hook updated.'),
      ApiNotFoundResponse({ description: 'The lifecycle hook was not found in the specified tenant.' }),
    ],
  });

  bindDocumentation(RolesController, 'roles', {
    create: [
      ApiOperation({ description: 'Creates a role with a name, description, and permissions.', summary: 'Create role' }),
      ...authorized,
      ApiZodBody(roleSchema, 'Role details. If `permissions` is omitted, an empty list is stored.'),
      created('Role created.'),
    ],
    getAll: [
      ApiOperation({ description: 'Returns the roles available for permission management.', summary: 'List roles' }),
      ...authorized,
      ApiOkResponse({ description: 'List of roles and associated permissions.' }),
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
      ApiZodBody(roleSchema, 'Updated role details.'),
      ok('Role updated.'),
    ],
  });

  bindDocumentation(TenantsController, 'tenants', {
    create: [
      ApiOperation({ description: 'Creates a tenant and returns the created resource.', summary: 'Create tenant' }),
      ...authorized,
      ApiZodBody(tenantSchema, 'Basic tenant details.'),
      ApiCreatedResponse({ description: 'Tenant created and returned in the response.' }),
    ],
    get: [
      ApiOperation({ description: 'Returns the configuration for the specified tenant.', summary: 'Get tenant' }),
      ...authorized,
      tenantParam,
      ApiOkResponse({ description: 'Tenant details.' }),
      ApiNotFoundResponse({ description: 'The tenant was not found.' }),
    ],
    getAll: [ApiOperation({ description: 'Returns all available tenants.', summary: 'List tenants' }), ApiOkResponse({ description: 'Tenant list.' })],
    remove: [
      ApiOperation({ description: 'Deletes the specified tenant.', summary: 'Delete tenant' }),
      ...authorized,
      tenantParam,
      ApiOkResponse({ description: 'Tenant deleted and returned in the response.' }),
      ApiNotFoundResponse({ description: 'The tenant was not found.' }),
    ],
    update: [
      ApiOperation({ description: 'Replaces the tenant name, domain, and description.', summary: 'Update tenant' }),
      ...authorized,
      tenantParam,
      ApiZodBody(tenantSchema, 'Updated tenant details.'),
      ApiOkResponse({ description: 'Tenant updated and returned in the response.' }),
    ],
  });

  bindDocumentation(TrackEventController, 'track-events', {
    create: [
      ApiOperation({ description: 'Registers an event with valid JavaScript code to extract its data.', summary: 'Create tracking event' }),
      ...authorized,
      tenantParam,
      ApiZodBody(trackEventSchema, 'The `javascript` property must contain syntactically valid JavaScript code.'),
      created('Tracking event created.'),
    ],
    get: [
      ApiOperation({ description: 'Returns the configuration for the specified event.', summary: 'Get tracking event' }),
      ...authorized,
      tenantParam,
      ApiParam({ description: 'Numeric tracking event identifier.', example: 1, name: 'trackEventId', type: Number }),
      ApiOkResponse({ description: 'Tracking event.' }),
      ApiNotFoundResponse({ description: 'The tracking event was not found in the specified tenant.' }),
    ],
    getAllForAudience: [
      ApiOperation({ description: 'Returns events available for audience rules.', summary: 'List events for audiences' }),
      ...authorized,
      tenantParam,
      ApiOkResponse({ description: 'Events available for audience rules.' }),
    ],
    getMany: [
      ApiOperation({ description: 'Returns tenant events with search, sorting, pagination, and status filtering.', summary: 'List tracking events' }),
      ...authorized,
      tenantParam,
      ApiZodQuery(getTrackEventQuerySchema),
      ApiOkResponse({ description: 'Tracking events and pagination metadata.' }),
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
      ApiZodBody(trackEventSchema, 'The `javascript` property must contain syntactically valid JavaScript code.'),
      ok('Tracking event updated.'),
    ],
  });

  bindDocumentation(UsersController, 'users', {
    create: [
      ApiOperation({ description: 'Creates a user with login credentials.', summary: 'Create user' }),
      ...authorized,
      ApiZodBody(newUserSchema, 'Initial name, email, and password.'),
      created('User created.'),
    ],
    get: [
      ApiOperation({ description: 'Resolves the authenticated user from the `accessToken` cookie.', summary: 'Get current user' }),
      ApiCookieAuth('cookie'),
      ApiOkResponse({ description: 'Authenticated user details.' }),
      ApiUnauthorizedResponse({ description: 'The cookie is missing, expired, or does not match a user.' }),
    ],
    getAll: [
      ApiOperation({ description: 'Returns users available for administration.', summary: 'List users' }),
      ...authorized,
      ApiOkResponse({ description: 'List of users and their assigned roles.' }),
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
      ApiZodBody(oldUserSchema, 'Account details and roles to assign.'),
      ok('User updated.'),
    ],
  });

  bindDocumentation(AuthController, 'sessions', {
    logIn: [
      ApiOperation({ description: 'Validates credentials and sets secure access and refresh cookies.', summary: 'Sign in' }),
      ApiZodBody(logInSchema, 'User credentials.'),
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
