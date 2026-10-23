'use client';

import type { TypeNodeRequirement as TypeAudienceNodeRequirement } from '@ab-tester/constants/types/audience';
import type { TypeCampaignForMenu, TypeNodeRequirement, TypeOrderCampaignsBy } from '@ab-tester/constants/types/campaign';
import type { TypeDirection } from '@ab-tester/constants/types/constants';
import type { TypeExecutionGroup } from '@ab-tester/constants/types/executionGroup';
import { ArrowRight, ChevronDown, ChevronUp, Copy, Pencil, PlusCircle, Trash2 } from 'lucide-react';
import { useEffect, useReducer, useState } from 'react';
import { DataTable } from '@/app/_common/components/DataTable';
import { Pagination } from '@/app/_common/components/Pagination';
import { useDialogStore } from '@/app/_common/contexts/Dialog/state';
import { useToast } from '@/app/_common/contexts/ToastEmitter';
import { useTranslationContext } from '@/app/_common/contexts/Translation';
import { useUser } from '@/app/_common/contexts/User';
import config, { getStringPermission } from '@/config/constants';
import commonConstants from '@/config/sharedConstants';
import { apiCaller } from '@/libs/restClient';

const getAudienceIds = (requirements: TypeNodeRequirement): number[] => {
  const audienceIds = new Set<number>();
  const visit = (node: TypeNodeRequirement) => {
    for (const requirement of node.data.children) {
      if (requirement.type === 'node') visit(requirement);
      else if (requirement.type === 'audience') audienceIds.add(requirement.data.id);
    }
  };

  visit(requirements);
  return [...audienceIds];
};

const hasTrackEventRequirements = (requirements: TypeAudienceNodeRequirement): boolean =>
  requirements.data.children.some((requirement) => (requirement.type === 'node' ? hasTrackEventRequirements(requirement) : true));

type UiState = {
  sortConfig: { key: TypeOrderCampaignsBy; direction: TypeDirection };
  statusFilter: TypeCampaignForMenu['status'][];
  nameFilter: string;
  itemsPerPage: number;
  totalItems: number;
  currentPage: number;
};

type UiAction =
  | { type: 'SET_SORT'; payload: TypeOrderCampaignsBy }
  | { type: 'SET_STATUS_FILTER'; payload: TypeCampaignForMenu['status'] }
  | { type: 'SET_NAME_FILTER'; payload: string }
  | { type: 'SET_ITEMS_PER_PAGE'; payload: number }
  | { type: 'SET_TOTAL_ITEMS'; payload: number }
  | { type: 'SET_CURRENT_PAGE'; payload: number };

type PageProps = {
  tenantId: number;
};
export function ClientPage({ tenantId }: PageProps) {
  const user = useUser();
  const { translation } = useTranslationContext();
  const emit = useToast().emit;
  const getDataFromForm = useDialogStore((state) => state.getDataFromForm);

  const [campaigns, setCampaigns] = useState<(TypeCampaignForMenu & { executionGroup: TypeExecutionGroup | null })[]>([]);
  const [state, dispatch] = useReducer(
    (state: UiState, action: UiAction): UiState => {
      switch (action.type) {
        case 'SET_SORT': {
          if (state.sortConfig.key !== action.payload)
            return {
              ...state,
              currentPage: 0,
              sortConfig: { direction: 'asc', key: action.payload },
            };

          const newDirection = {
            asc: 'desc' as const,
            desc: 'asc' as const,
          }[state.sortConfig.direction];
          return {
            ...state,
            currentPage: 0,
            sortConfig: { ...state.sortConfig, direction: newDirection },
          };
        }
        case 'SET_NAME_FILTER':
          return { ...state, nameFilter: action.payload };
        case 'SET_STATUS_FILTER': {
          if (state.statusFilter.includes(action.payload)) {
            const newStatusFilter = state.statusFilter.filter((status) => status !== action.payload);
            return { ...state, statusFilter: newStatusFilter };
          }
          return {
            ...state,
            statusFilter: [...state.statusFilter, action.payload],
          };
        }
        case 'SET_ITEMS_PER_PAGE':
          return { ...state, itemsPerPage: action.payload };
        case 'SET_TOTAL_ITEMS':
          return { ...state, totalItems: action.payload };
        case 'SET_CURRENT_PAGE':
          return { ...state, currentPage: action.payload };
      }
    },
    {
      currentPage: 0,
      itemsPerPage: config.quantitiesAvailable[0],
      nameFilter: '',
      sortConfig: { direction: 'desc', key: 'updatedAt' },
      statusFilter: ['active', 'inactive'],
      totalItems: 0,
    },
  );

  const queryCampaigns = async (
    args: Partial<{
      textSearch: string;
      orderBy: TypeOrderCampaignsBy;
      orderDirection: TypeDirection;
      page: number;
      quantity: number;
      statusList: TypeCampaignForMenu['status'][];
    }> = {},
  ) => {
    const result = await apiCaller.campaigns.getMany({
      pathParams: { tenantId },
      queryParams: {
        orderBy: state.sortConfig.key,
        orderDirection: state.sortConfig.direction,
        page: state.currentPage,
        quantity: state.itemsPerPage,
        statusList: state.statusFilter,
        textSearch: state.nameFilter,
        ...args,
      },
    });

    if (result.ok) {
      const json = await result.json();
      json.campaigns.forEach((campaign) => {
        campaign.createdAt = new Date(campaign.createdAt);
        campaign.updatedAt = new Date(campaign.updatedAt);
      });
      setCampaigns(json.campaigns);
      dispatch({ payload: json.count, type: 'SET_TOTAL_ITEMS' });
    }
  };
  const totalPages = Math.ceil(state.totalItems / state.itemsPerPage);

  useEffect(() => {
    queryCampaigns();
  }, [state.currentPage, state.sortConfig]);

  const onApplyFilters = () => {
    dispatch({ payload: 0, type: 'SET_CURRENT_PAGE' });
    queryCampaigns({ page: 0 });
  };

  const getStatusColor = (status: TypeCampaignForMenu['status']) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const SortIcon = ({ column }: { column: TypeOrderCampaignsBy }) => {
    if (state.sortConfig.key !== column) {
      return <span className="text-slate-400 ml-1">⇅</span>;
    }
    return state.sortConfig.direction === 'asc' ? <ChevronUp className="w-4 h-4 ml-1 inline" /> : <ChevronDown className="w-4 h-4 ml-1 inline" />;
  };

  const confirm = useDialogStore((state) => state.confirm);

  const deleteCampaign = async ({ campaign }: { campaign: TypeCampaignForMenu }) => {
    const result = await confirm({
      description: translation.common.deleteConfirmationDescription,
      title: translation.campaigns.deleteTitle.replace('{id}', String(campaign.id)).replace('{name}', campaign.name),
    });
    if (!result) return;
    await apiCaller.campaigns.delete({ pathParams: { campaignId: campaign.id, tenantId } });
    location.reload();
  };

  const copyCampaignToTenant = async ({ campaign }: { campaign: TypeCampaignForMenu }) => {
    const campaignResponse = await apiCaller.campaigns.get({ pathParams: { campaignId: campaign.id, tenantId } });
    if (!campaignResponse.ok) {
      emit({ severity: 'error', text: translation.campaigns.copyCampaignError });
      return;
    }
    const sourceCampaign = await campaignResponse.json();
    const audienceIds = getAudienceIds(sourceCampaign.requirements);
    if (audienceIds.length > 0 && !user.permissions.includes(getStringPermission({ action: 'read', feature: 'audience', tenantId }))) {
      emit({ severity: 'error', text: translation.campaigns.copyAudiencesPermissionError });
      return;
    }
    const sourceAudiences = await Promise.all(audienceIds.map((audienceId) => apiCaller.audiences.get({ pathParams: { audienceId, tenantId } })));
    const successfulAudienceResponses = sourceAudiences.filter((response) => response.ok);
    if (successfulAudienceResponses.length !== sourceAudiences.length) {
      emit({ severity: 'error', text: translation.campaigns.copyAudiencesError });
      return;
    }
    const audiences = await Promise.all(successfulAudienceResponses.map((response) => response.json()));
    const requiresTrackEvents = audiences.some((audience) => hasTrackEventRequirements(audience.requirements));
    if (requiresTrackEvents && !user.permissions.includes(getStringPermission({ action: 'read', feature: 'track-event', tenantId }))) {
      emit({ severity: 'error', text: translation.campaigns.copyTrackEventsPermissionError });
      return;
    }

    const tenantsResponse = await apiCaller.tenants.getAll();
    if (!tenantsResponse.ok) {
      emit({ severity: 'error', text: translation.campaigns.copyTenantsError });
      return;
    }

    const targetTenants = (await tenantsResponse.json()).filter(
      (targetTenant) =>
        targetTenant.id !== tenantId &&
        user.permissions.includes(getStringPermission({ action: 'create', feature: 'campaign', tenantId: targetTenant.id })) &&
        (audienceIds.length === 0 || user.permissions.includes(getStringPermission({ action: 'create', feature: 'audience', tenantId: targetTenant.id }))) &&
        (!requiresTrackEvents || user.permissions.includes(getStringPermission({ action: 'create', feature: 'track-event', tenantId: targetTenant.id }))),
    );
    if (targetTenants.length === 0) {
      emit({ severity: 'warning', text: translation.campaigns.noCopyTenants });
      return;
    }

    const formData = await getDataFromForm(
      { title: translation.campaigns.copyTenantTitle },
      {
        targetTenantId: {
          label: translation.campaigns.copyTenantLabel,
          options: targetTenants.map((targetTenant) => ({ label: targetTenant.name, value: String(targetTenant.id) })),
          required: true,
          type: 'select',
          value: '',
        },
      },
    );
    if (!formData) return;

    const response = await apiCaller.campaigns.copy({
      body: { targetTenantId: Number(formData.targetTenantId) },
      pathParams: { campaignId: campaign.id, tenantId },
    });
    if (!response.ok) {
      emit({ severity: 'error', text: translation.campaigns.copyError });
      return;
    }

    emit({ severity: 'success', text: translation.campaigns.copySuccess });
  };

  return (
    <div className="flex">
      {/* Main Content */}
      <div className="flex-1 p-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-slate-900 mb-2">{translation.campaigns.headerTitle}</h1>
            <p className="text-slate-600">{translation.campaigns.headerSubTitle}</p>
          </div>

          {user.permissions.includes(getStringPermission({ action: 'create', feature: 'campaign', tenantId })) && (
            <a
              href={config.pages.campaign({ campaignId: undefined, tenantId })}
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all bg-blue-600 text-white hover:bg-blue-700 h-9 px-4 py-2"
            >
              <PlusCircle />
              {translation.campaigns.createButton}
            </a>
          )}
        </div>

        <DataTable
          rows={campaigns}
          getRowKey={(campaign) => campaign.id}
          rowClassName="hover:bg-slate-50 transition-colors"
          columns={[
            {
              label: (
                <>
                  {translation.campaigns.tableId}
                  <SortIcon column="id" />
                </>
              ),
              onSort: () => dispatch({ payload: 'id', type: 'SET_SORT' }),
              renderCell: (campaign) => campaign.id,
            },
            {
              label: (
                <>
                  {translation.campaigns.tableName}
                  <SortIcon column="name" />
                </>
              ),
              onSort: () => dispatch({ payload: 'name', type: 'SET_SORT' }),
              renderCell: (campaign) => campaign.name,
            },
            {
              label: (
                <>
                  {translation.campaigns.tableStatus}
                  <SortIcon column="status" />
                </>
              ),
              onSort: () => dispatch({ payload: 'status', type: 'SET_SORT' }),
              renderCell: (campaign) => (
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(campaign.status)}`}>{translation.common[campaign.status]}</span>
              ),
            },
            {
              label: (
                <>
                  {translation.campaigns.updatedAt}
                  <SortIcon column="updatedAt" />
                </>
              ),
              onSort: () => dispatch({ payload: 'updatedAt', type: 'SET_SORT' }),
              renderCell: (campaign) =>
                campaign.updatedAt.toLocaleString('es-CL', {
                  day: '2-digit',
                  hour: '2-digit',
                  hour12: false,
                  minute: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                }),
            },
            {
              label: translation.campaigns.tableExecutionGroup,
              renderCell: (campaign) => (
                <span>
                  {campaign.executionGroup ? (
                    <a
                      href={
                        user.permissions.includes(getStringPermission({ action: 'read', feature: 'execution-group', tenantId }))
                          ? config.pages.executionGroup({
                              executionGroupId: campaign.executionGroup.id,
                              tenantId,
                            })
                          : ''
                      }
                    >
                      (ID: {campaign.executionGroup.id}): {campaign.executionGroup.name}
                    </a>
                  ) : (
                    '---'
                  )}
                </span>
              ),
            },
            {
              label: translation.campaigns.clone,
              renderCell: (campaign) =>
                user.permissions.includes(getStringPermission({ action: 'create', feature: 'campaign', tenantId })) && (
                  <a
                    href={config.pages.campaign({ campaignId: undefined, cloneFrom: campaign.id, tenantId })}
                    className="w-fit h-fit p-2 flex text-violet-500 hover:bg-violet-200 rounded-lg transition-colors"
                  >
                    <Copy size={20} />
                  </a>
                ),
            },
            {
              label: translation.campaigns.copyToTenant,
              renderCell: (campaign) =>
                user.permissions.includes(getStringPermission({ action: 'read', feature: 'campaign', tenantId })) && (
                  <button
                    type="button"
                    aria-label={`${translation.campaigns.copyToTenant} ${campaign.name}`}
                    onClick={() => copyCampaignToTenant({ campaign })}
                    className="w-fit h-fit p-2 flex text-violet-500 hover:bg-violet-200 rounded-lg transition-colors"
                  >
                    <ArrowRight size={20} />
                  </button>
                ),
            },
            {
              label: translation.campaigns.modify,
              renderCell: (campaign) =>
                user.permissions.includes(getStringPermission({ action: 'read', feature: 'campaign', tenantId })) && (
                  <a
                    href={config.pages.campaign({ campaignId: campaign.id, tenantId })}
                    className="w-fit h-fit p-2 flex text-blue-500 hover:bg-blue-200 rounded-lg transition-colors"
                  >
                    <Pencil size={20} />
                  </a>
                ),
            },
            {
              label: translation.campaigns.delete,
              renderCell: (campaign) =>
                user.permissions.includes(getStringPermission({ action: 'delete', feature: 'campaign', tenantId })) && (
                  <button type="button" onClick={() => deleteCampaign({ campaign })} className="p-2 flex text-red-500 hover:bg-red-200 rounded-lg transition-colors">
                    <Trash2 size={20} />
                  </button>
                ),
            },
          ]}
          emptyMessage={translation.campaigns.noData}
        />

        {/* Pagination */}
        <div className="mt-6 flex items-center justify-center bg-white rounded-lg shadow p-4">
          <Pagination totalPages={totalPages} page={state.currentPage} onChange={(newPage) => dispatch({ payload: newPage, type: 'SET_CURRENT_PAGE' })} />
        </div>
      </div>

      {/* Sidebar */}
      <div className="w-64 bg-white shadow-lg p-6">
        <h2 className="text-xl font-bold text-slate-900 mb-6">{translation.campaigns.filtersTitle}</h2>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            onApplyFilters();
          }}
        >
          <div className="mb-6">
            <span className="block text-sm font-semibold text-slate-700 mb-2">{translation.campaigns.filtersText}</span>
            <input
              type="text"
              value={state.nameFilter}
              onChange={(e) => dispatch({ payload: e.target.value, type: 'SET_NAME_FILTER' })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="mb-6">
            <span className="block text-sm font-semibold text-slate-700 mb-2">{translation.campaigns.filtersStatus}</span>
            <div className="space-y-2">
              {commonConstants.arrayStatusArray.map((status) => (
                <label key={status} className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={state.statusFilter.includes(status)}
                    onChange={() => dispatch({ payload: status, type: 'SET_STATUS_FILTER' })}
                    className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-slate-700">{translation.campaigns.status[status]}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="mb-6">
            <span className="block text-sm font-semibold text-slate-700 mb-2">{translation.campaigns.filtersQuantity}</span>
            <select
              value={state.itemsPerPage}
              onChange={(e) =>
                dispatch({
                  payload: Number(e.target.value),
                  type: 'SET_ITEMS_PER_PAGE',
                })
              }
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            >
              {config.quantitiesAvailable.map((qty) => (
                <option key={qty} value={qty}>
                  {qty}
                </option>
              ))}
            </select>
          </div>

          <button type="submit" className="w-full px-4 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg">
            {translation.campaigns.applyFilters}
          </button>
        </form>
      </div>
    </div>
  );
}
