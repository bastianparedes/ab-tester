'use client';

import type { TypeDirection } from '@ab-tester/constants/types/constants';
import type { TypeLifecycleHookForMenu, TypeOrderLifecycleHookBy } from '@ab-tester/constants/types/lifecycleHooks';
import { ArrowRight, ChevronDown, ChevronUp, Copy, Pencil, PlusCircle, Trash2 } from 'lucide-react';
import { useEffect, useReducer, useState } from 'react';
import { DataTable } from '@/app/_common/components/DataTable';
import { Pagination } from '@/app/_common/components/Pagination';
import { useDialogStore } from '@/app/_common/contexts/Dialog/state';
import { useToast } from '@/app/_common/contexts/ToastEmitter';
import { useTranslationContext } from '@/app/_common/contexts/Translation';
import { useUser } from '@/app/_common/contexts/User';
import config from '@/config/constants';
import commonConstants from '@/config/sharedConstants';
import { apiCaller } from '@/libs/restClient';

type UiState = {
  sortConfig: { key: TypeOrderLifecycleHookBy; direction: TypeDirection };
  statusFilter: TypeLifecycleHookForMenu['status'][];
  nameFilter: string;
  itemsPerPage: number;
  totalItems: number;
  currentPage: number;
};

type UiAction =
  | { type: 'SET_SORT'; payload: TypeOrderLifecycleHookBy }
  | { type: 'SET_STATUS_FILTER'; payload: TypeLifecycleHookForMenu['status'] }
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
  const [lifecycleHooks, setLifecycleHooks] = useState<TypeLifecycleHookForMenu[]>([]);
  const [state, dispatch] = useReducer(
    (state: UiState, action: UiAction): UiState => {
      switch (action.type) {
        case 'SET_SORT': {
          if (state.sortConfig.key !== action.payload) {
            return {
              ...state,
              currentPage: 0,
              sortConfig: { direction: 'asc', key: action.payload },
            };
          }

          const direction = state.sortConfig.direction === 'asc' ? 'desc' : 'asc';
          return {
            ...state,
            currentPage: 0,
            sortConfig: { ...state.sortConfig, direction },
          };
        }
        case 'SET_NAME_FILTER':
          return { ...state, nameFilter: action.payload };
        case 'SET_STATUS_FILTER':
          return {
            ...state,
            statusFilter: state.statusFilter.includes(action.payload)
              ? state.statusFilter.filter((status) => status !== action.payload)
              : [...state.statusFilter, action.payload],
          };
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

  const queryLifecycleHooks = async (
    args: Partial<{
      textSearch: string;
      orderBy: TypeOrderLifecycleHookBy;
      orderDirection: TypeDirection;
      page: number;
      quantity: number;
      statusList: TypeLifecycleHookForMenu['status'][];
    }> = {},
  ) => {
    const result = await apiCaller.lifecycleHooks.getMany({
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
      json.lifecycleHooks.forEach((lifecycleHook) => {
        lifecycleHook.createdAt = new Date(lifecycleHook.createdAt);
        lifecycleHook.updatedAt = new Date(lifecycleHook.updatedAt);
      });
      setLifecycleHooks(json.lifecycleHooks);
      dispatch({ payload: json.count, type: 'SET_TOTAL_ITEMS' });
    }
  };

  const totalPages = Math.ceil(state.totalItems / state.itemsPerPage);

  useEffect(() => {
    queryLifecycleHooks();
  }, [state.currentPage, state.sortConfig]);

  const onApplyFilters = () => {
    dispatch({ payload: 0, type: 'SET_CURRENT_PAGE' });
    queryLifecycleHooks({ page: 0 });
  };

  const getStatusColor = (status: TypeLifecycleHookForMenu['status']) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const SortIcon = ({ column }: { column: TypeOrderLifecycleHookBy }) => {
    if (state.sortConfig.key !== column) {
      return <span className="ml-1 text-slate-400">⇅</span>;
    }
    return state.sortConfig.direction === 'asc' ? <ChevronUp className="ml-1 inline h-4 w-4" /> : <ChevronDown className="ml-1 inline h-4 w-4" />;
  };

  const confirm = useDialogStore((state) => state.confirm);

  const deleteLifecycleHook = async (lifecycleHook: TypeLifecycleHookForMenu) => {
    const result = await confirm({
      description: translation.common.deleteConfirmationDescription,
      title: translation.lifecycleHooks.deleteTitle.replace('{id}', String(lifecycleHook.id)).replace('{name}', lifecycleHook.name),
    });
    if (!result) return;
    await apiCaller.lifecycleHooks.delete({ pathParams: { lifecycleHookId: lifecycleHook.id, tenantId } });
    location.reload();
  };

  const copyLifecycleHookToTenant = async (lifecycleHook: TypeLifecycleHookForMenu) => {
    const tenantsResponse = await apiCaller.tenants.getAll();
    if (!tenantsResponse.ok) {
      emit({ severity: 'error', text: translation.lifecycleHooks.copyTenantsError });
      return;
    }
    const targetTenants = (await tenantsResponse.json()).filter(
      (targetTenant) => targetTenant.id !== tenantId && user.hasPermission({ action: 'create', feature: 'tenant', tenantId: targetTenant.id }),
    );
    if (targetTenants.length === 0) {
      emit({ severity: 'warning', text: translation.lifecycleHooks.noCopyTenants });
      return;
    }

    const formData = await getDataFromForm(
      { title: translation.lifecycleHooks.copyTenantTitle },
      {
        targetTenantId: {
          label: translation.lifecycleHooks.copyTenantLabel,
          options: targetTenants.map((targetTenant) => ({ label: targetTenant.name, value: String(targetTenant.id) })),
          required: true,
          type: 'select',
          value: '',
        },
      },
    );
    if (!formData) return;

    const response = await apiCaller.lifecycleHooks.copy({
      body: { targetTenantId: Number(formData.targetTenantId) },
      pathParams: { lifecycleHookId: lifecycleHook.id, tenantId },
    });
    if (!response.ok) {
      emit({ severity: 'error', text: translation.lifecycleHooks.copyError });
      return;
    }
    emit({ severity: 'success', text: translation.lifecycleHooks.copySuccess });
  };

  return (
    <div className="flex">
      <div className="flex-1 p-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="mb-2 text-4xl font-bold text-slate-900">{translation.lifecycleHooks.headerTitle}</h1>
            <p className="text-slate-600">{translation.lifecycleHooks.headerSubTitle}</p>
          </div>
          {user.hasPermission({ action: 'create', feature: 'tenant', tenantId }) && (
            <a
              href={config.pages.lifecycleHook({ lifecycleHookId: undefined, tenantId })}
              className="inline-flex h-9 items-center justify-center gap-2 whitespace-nowrap rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-blue-700"
            >
              <PlusCircle />
              {translation.lifecycleHooks.createButton}
            </a>
          )}
        </div>

        <DataTable
          rows={lifecycleHooks}
          getRowKey={(lifecycleHook) => lifecycleHook.id}
          rowClassName="transition-colors hover:bg-slate-50"
          columns={[
            {
              label: (
                <>
                  {translation.lifecycleHooks.tableId}
                  <SortIcon column="id" />
                </>
              ),
              onSort: () => dispatch({ payload: 'id', type: 'SET_SORT' }),
              renderCell: (lifecycleHook) => lifecycleHook.id,
            },
            {
              label: (
                <>
                  {translation.lifecycleHooks.tableName}
                  <SortIcon column="name" />
                </>
              ),
              onSort: () => dispatch({ payload: 'name', type: 'SET_SORT' }),
              renderCell: (lifecycleHook) => lifecycleHook.name,
            },
            {
              label: (
                <>
                  {translation.lifecycleHooks.tableStatus}
                  <SortIcon column="status" />
                </>
              ),
              onSort: () => dispatch({ payload: 'status', type: 'SET_SORT' }),
              renderCell: (lifecycleHook) => (
                <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${getStatusColor(lifecycleHook.status)}`}>
                  {translation.common[lifecycleHook.status]}
                </span>
              ),
            },
            {
              label: (
                <>
                  {translation.lifecycleHooks.tableTrigger}
                  <SortIcon column="option" />
                </>
              ),
              onSort: () => dispatch({ payload: 'option', type: 'SET_SORT' }),
              renderCell: (lifecycleHook) => translation.lifecycleHooks.triggerOptions[lifecycleHook.option],
            },
            {
              label: (
                <>
                  {translation.lifecycleHooks.updatedAt}
                  <SortIcon column="updatedAt" />
                </>
              ),
              onSort: () => dispatch({ payload: 'updatedAt', type: 'SET_SORT' }),
              renderCell: (lifecycleHook) =>
                lifecycleHook.updatedAt.toLocaleString('es-CL', {
                  day: '2-digit',
                  hour: '2-digit',
                  hour12: false,
                  minute: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                }),
            },
            {
              label: translation.lifecycleHooks.clone,
              renderCell: (lifecycleHook) =>
                user.hasPermission({ action: 'read', feature: 'tenant', tenantId }) && (
                  <a
                    href={config.pages.lifecycleHook({ cloneFrom: lifecycleHook.id, lifecycleHookId: undefined, tenantId })}
                    className="flex h-fit w-fit rounded-lg p-2 text-violet-500 transition-colors hover:bg-violet-200"
                    aria-label={`${translation.lifecycleHooks.clone} ${lifecycleHook.name}`}
                  >
                    <Copy size={20} />
                  </a>
                ),
            },
            {
              label: translation.lifecycleHooks.copyToTenant,
              renderCell: (lifecycleHook) =>
                user.hasPermission({ action: 'read', feature: 'tenant', tenantId }) && (
                  <button
                    type="button"
                    onClick={() => copyLifecycleHookToTenant(lifecycleHook)}
                    className="flex h-fit w-fit rounded-lg p-2 text-indigo-500 transition-colors hover:bg-indigo-100"
                    aria-label={`${translation.lifecycleHooks.copyToTenant} ${lifecycleHook.name}`}
                  >
                    <ArrowRight size={20} />
                  </button>
                ),
            },
            {
              label: translation.lifecycleHooks.modify,
              renderCell: (lifecycleHook) =>
                user.hasPermission({ action: 'read', feature: 'tenant', tenantId }) && (
                  <a
                    href={config.pages.lifecycleHook({ lifecycleHookId: lifecycleHook.id, tenantId })}
                    className="flex h-fit w-fit rounded-lg p-2 text-blue-500 transition-colors hover:bg-blue-200"
                    aria-label={`${translation.lifecycleHooks.modify} ${lifecycleHook.name}`}
                  >
                    <Pencil size={20} />
                  </a>
                ),
            },
            {
              label: translation.lifecycleHooks.delete,
              renderCell: (lifecycleHook) =>
                user.hasPermission({ action: 'delete', feature: 'tenant', tenantId }) && (
                  <button
                    type="button"
                    onClick={() => deleteLifecycleHook(lifecycleHook)}
                    className="flex rounded-lg p-2 text-red-500 transition-colors hover:bg-red-200"
                    aria-label={`${translation.lifecycleHooks.delete} ${lifecycleHook.name}`}
                  >
                    <Trash2 size={20} />
                  </button>
                ),
            },
          ]}
          emptyMessage={translation.lifecycleHooks.noData}
        />

        <div className="mt-6 flex items-center justify-center rounded-lg bg-white p-4 shadow">
          <Pagination totalPages={totalPages} page={state.currentPage} onChange={(newPage) => dispatch({ payload: newPage, type: 'SET_CURRENT_PAGE' })} />
        </div>
      </div>

      <div className="w-64 bg-white p-6 shadow-lg">
        <h2 className="mb-6 text-xl font-bold text-slate-900">{translation.lifecycleHooks.filtersTitle}</h2>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            onApplyFilters();
          }}
        >
          <div className="mb-6">
            <span className="mb-2 block text-sm font-semibold text-slate-700">{translation.lifecycleHooks.filtersText}</span>
            <input
              type="text"
              value={state.nameFilter}
              onChange={(event) => dispatch({ payload: event.target.value, type: 'SET_NAME_FILTER' })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="mb-6">
            <span className="mb-2 block text-sm font-semibold text-slate-700">{translation.lifecycleHooks.filtersStatus}</span>
            <div className="space-y-2">
              {commonConstants.arrayStatusArray.map((status) => (
                <label key={status} className="flex cursor-pointer items-center">
                  <input
                    type="checkbox"
                    checked={state.statusFilter.includes(status)}
                    onChange={() => dispatch({ payload: status, type: 'SET_STATUS_FILTER' })}
                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-slate-700">{translation.common[status]}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="mb-6">
            <span className="mb-2 block text-sm font-semibold text-slate-700">{translation.lifecycleHooks.filtersQuantity}</span>
            <select
              value={state.itemsPerPage}
              onChange={(event) => dispatch({ payload: Number(event.target.value), type: 'SET_ITEMS_PER_PAGE' })}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {config.quantitiesAvailable.map((quantity) => (
                <option key={quantity} value={quantity}>
                  {quantity}
                </option>
              ))}
            </select>
          </div>
          <button type="submit" className="w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white shadow-md transition-colors hover:bg-blue-700 hover:shadow-lg">
            {translation.lifecycleHooks.applyFilters}
          </button>
        </form>
      </div>
    </div>
  );
}
