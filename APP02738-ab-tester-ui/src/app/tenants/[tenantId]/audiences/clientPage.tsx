'use client';

import type { TypeAudienceForMenu, TypeNodeRequirement, TypeOrderAudiencesBy } from '@ab-tester/constants/types/audience';
import type { TypeDirection } from '@ab-tester/constants/types/constants';
import { ArrowRight, ChevronDown, ChevronUp, Pencil, PlusCircle, Trash2 } from 'lucide-react';
import { useEffect, useReducer, useState } from 'react';
import { DataTable } from '@/app/_common/components/DataTable';
import { Pagination } from '@/app/_common/components/Pagination';
import { useDialogStore } from '@/app/_common/contexts/Dialog/state';
import { useToast } from '@/app/_common/contexts/ToastEmitter';
import { useTranslationContext } from '@/app/_common/contexts/Translation';
import { useUser } from '@/app/_common/contexts/User';
import config from '@/config/constants';
import { apiCaller } from '@/libs/restClient';

const getTrackEventIds = (requirements: TypeNodeRequirement): number[] => {
  const trackEventIds = new Set<number>();
  const visit = (node: TypeNodeRequirement) => {
    for (const requirement of node.data.children) {
      if (requirement.type === 'node') visit(requirement);
      else trackEventIds.add(requirement.data.trackEventId);
    }
  };

  visit(requirements);
  return [...trackEventIds];
};

type UiState = {
  sortConfig: { key: TypeOrderAudiencesBy; direction: TypeDirection };
  nameFilter: string;
  itemsPerPage: number;
  totalItems: number;
  currentPage: number;
};

type UiAction =
  | { type: 'SET_SORT'; payload: TypeOrderAudiencesBy }
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

  const [audiences, setAudiences] = useState<TypeAudienceForMenu[]>([]);
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
      totalItems: 0,
    },
  );

  const queryAudiences = async (
    args: Partial<{
      textSearch: string;
      orderBy: TypeOrderAudiencesBy;
      orderDirection: TypeDirection;
      page: number;
      quantity: number;
    }> = {},
  ) => {
    const result = await apiCaller.audiences.getMany({
      pathParams: { tenantId },
      queryParams: {
        orderBy: state.sortConfig.key,
        orderDirection: state.sortConfig.direction,
        page: state.currentPage,
        quantity: state.itemsPerPage,
        textSearch: state.nameFilter,
        ...args,
      },
    });

    if (result.ok) {
      const json = await result.json();
      json.audiences.forEach((audience) => {
        audience.createdAt = new Date(audience.createdAt);
        audience.updatedAt = new Date(audience.updatedAt);
      });
      setAudiences(json.audiences);
      dispatch({ payload: json.count, type: 'SET_TOTAL_ITEMS' });
    }
  };
  const totalPages = Math.ceil(state.totalItems / state.itemsPerPage);

  useEffect(() => {
    queryAudiences();
  }, [state.currentPage, state.sortConfig]);

  const onApplyFilters = () => {
    dispatch({ payload: 0, type: 'SET_CURRENT_PAGE' });
    queryAudiences({ page: 0 });
  };

  const SortIcon = ({ column }: { column: TypeOrderAudiencesBy }) => {
    if (state.sortConfig.key !== column) {
      return <span className="text-slate-400 ml-1">⇅</span>;
    }
    return state.sortConfig.direction === 'asc' ? <ChevronUp className="w-4 h-4 ml-1 inline" /> : <ChevronDown className="w-4 h-4 ml-1 inline" />;
  };

  const confirm = useDialogStore((state) => state.confirm);

  const deleteAudience = async ({ audience }: { audience: TypeAudienceForMenu }) => {
    const result = await confirm({
      description: translation.common.deleteConfirmationDescription,
      title: translation.audiences.deleteTitle.replace('{id}', String(audience.id)).replace('{name}', audience.name),
    });
    if (!result) return;
    await apiCaller.audiences.delete({ pathParams: { audienceId: audience.id, tenantId } });
    location.reload();
  };

  const copyAudienceToTenant = async ({ audience }: { audience: TypeAudienceForMenu }) => {
    const audienceResponse = await apiCaller.audiences.get({ pathParams: { audienceId: audience.id, tenantId } });
    if (!audienceResponse.ok) {
      emit({ severity: 'error', text: translation.audiences.copyAudienceError });
      return;
    }
    const sourceAudience = await audienceResponse.json();
    const hasTrackEvents = getTrackEventIds(sourceAudience.requirements).length > 0;
    const canReadSourceTrackEvents = user.hasPermission({ action: 'read', feature: 'track-event', tenantId });
    if (hasTrackEvents && !canReadSourceTrackEvents) {
      emit({ severity: 'error', text: translation.audiences.copyTrackEventsPermissionError });
      return;
    }

    const tenantsResponse = await apiCaller.tenants.getAll();
    if (!tenantsResponse.ok) {
      emit({ severity: 'error', text: translation.audiences.copyTenantsError });
      return;
    }

    const targetTenants = (await tenantsResponse.json()).filter(
      (tenant) =>
        tenant.id !== tenantId &&
        user.hasPermission({ action: 'create', feature: 'audience', tenantId: tenant.id }) &&
        (!hasTrackEvents || user.hasPermission({ action: 'create', feature: 'track-event', tenantId: tenant.id })),
    );
    if (targetTenants.length === 0) {
      emit({ severity: 'warning', text: translation.audiences.noCopyTenants });
      return;
    }

    const formData = await getDataFromForm(
      { title: translation.audiences.copyTenantTitle },
      {
        targetTenantId: {
          label: translation.audiences.copyTenantLabel,
          options: targetTenants.map((tenant) => ({ label: tenant.name, value: String(tenant.id) })),
          required: true,
          type: 'select',
          value: '',
        },
      },
    );
    if (!formData) return;

    const response = await apiCaller.audiences.copy({
      body: { targetTenantId: Number(formData.targetTenantId) },
      pathParams: { audienceId: audience.id, tenantId },
    });
    if (!response.ok) {
      emit({ severity: 'error', text: translation.audiences.copyError });
      return;
    }

    emit({ severity: 'success', text: translation.audiences.copySuccess });
  };

  return (
    <div className="flex">
      {/* Main Content */}
      <div className="flex-1 p-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-slate-900 mb-2">{translation.audiences.headerTitle}</h1>
            <p className="text-slate-600">{translation.audiences.headerSubTitle}</p>
          </div>
          {user.hasPermission({ action: 'create', feature: 'audience', tenantId }) && (
            <a
              href={config.pages.audience({ audienceId: undefined, tenantId })}
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all bg-blue-600 text-white hover:bg-blue-700 h-9 px-4 py-2"
            >
              <PlusCircle />
              {translation.audiences.createButton}
            </a>
          )}
        </div>

        <DataTable
          rows={audiences}
          getRowKey={(audience) => audience.id}
          rowClassName="hover:bg-slate-50 transition-colors"
          columns={[
            {
              label: (
                <>
                  {translation.audiences.tableId}
                  <SortIcon column="id" />
                </>
              ),
              onSort: () => dispatch({ payload: 'id', type: 'SET_SORT' }),
              renderCell: (audience) => audience.id,
            },
            {
              label: (
                <>
                  {translation.audiences.tableName}
                  <SortIcon column="name" />
                </>
              ),
              onSort: () => dispatch({ payload: 'name', type: 'SET_SORT' }),
              renderCell: (audience) => audience.name,
            },
            {
              label: (
                <>
                  {translation.audiences.updatedAt}
                  <SortIcon column="updatedAt" />
                </>
              ),
              onSort: () => dispatch({ payload: 'updatedAt', type: 'SET_SORT' }),
              renderCell: (audience) =>
                audience.updatedAt.toLocaleString('es-CL', {
                  day: '2-digit',
                  hour: '2-digit',
                  hour12: false,
                  minute: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                }),
            },
            {
              label: translation.audiences.modify,
              renderCell: (audience) =>
                user.hasPermission({ action: 'read', feature: 'audience', tenantId }) && (
                  <a
                    href={config.pages.audience({ audienceId: audience.id, tenantId })}
                    className="w-fit h-fit p-2 flex text-blue-500 hover:bg-blue-200 rounded-lg transition-colors"
                  >
                    <Pencil size={20} />
                  </a>
                ),
            },
            {
              label: translation.audiences.copyToTenant,
              renderCell: (audience) =>
                user.hasPermission({ action: 'read', feature: 'audience', tenantId }) && (
                  <button
                    type="button"
                    aria-label={`${translation.audiences.copyToTenant} ${audience.name}`}
                    onClick={() => copyAudienceToTenant({ audience })}
                    className="w-fit h-fit p-2 flex text-violet-500 hover:bg-violet-200 rounded-lg transition-colors"
                  >
                    <ArrowRight size={20} />
                  </button>
                ),
            },
            {
              label: translation.audiences.delete,
              renderCell: (audience) =>
                user.hasPermission({ action: 'delete', feature: 'audience', tenantId }) && (
                  <button type="button" onClick={() => deleteAudience({ audience })} className="p-2 flex text-red-500 hover:bg-red-200 rounded-lg transition-colors">
                    <Trash2 size={20} />
                  </button>
                ),
            },
          ]}
          emptyMessage={translation.audiences.noData}
        />

        {/* Paginación */}
        <div className="mt-6 flex items-center justify-center bg-white rounded-lg shadow p-4">
          <Pagination totalPages={totalPages} page={state.currentPage} onChange={(newPage) => dispatch({ payload: newPage, type: 'SET_CURRENT_PAGE' })} />
        </div>
      </div>

      {/* Sidebar */}
      <div className="w-64 bg-white shadow-lg p-6">
        <h2 className="text-xl font-bold text-slate-900 mb-6">{translation.audiences.filtersTitle}</h2>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            onApplyFilters();
          }}
        >
          <div className="mb-6">
            <span className="block text-sm font-semibold text-slate-700 mb-2">{translation.audiences.filtersText}</span>
            <input
              type="text"
              value={state.nameFilter}
              onChange={(e) => dispatch({ payload: e.target.value, type: 'SET_NAME_FILTER' })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="mb-6">
            <span className="block text-sm font-semibold text-slate-700 mb-2">{translation.audiences.filtersQuantity}</span>
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
            {translation.audiences.applyFilters}
          </button>
        </form>
      </div>
    </div>
  );
}
