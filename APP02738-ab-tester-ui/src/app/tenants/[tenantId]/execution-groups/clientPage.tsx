'use client';

import type { TypeDirection } from '@ab-tester/constants/types/constants';
import type { TypeExecutionGroupForMenu, TypeOrderExecutionGroupsBy } from '@ab-tester/constants/types/executionGroup';
import { ChevronDown, ChevronUp, Pencil, PlusCircle, Trash2 } from 'lucide-react';
import { useEffect, useReducer, useState } from 'react';
import { DataTable } from '@/app/_common/components/DataTable';
import { Pagination } from '@/app/_common/components/Pagination';
import { useDialogStore } from '@/app/_common/contexts/Dialog/state';
import { useTranslationContext } from '@/app/_common/contexts/Translation';
import { useUser } from '@/app/_common/contexts/User';
import config, { getStringPermission } from '@/config/constants';
import commonConstants from '@/config/sharedConstants';
import { apiCaller } from '@/libs/restClient';

type UiState = {
  sortConfig: { key: TypeOrderExecutionGroupsBy; direction: TypeDirection };
  statusFilter: TypeExecutionGroupForMenu['status'][];
  nameFilter: string;
  itemsPerPage: number;
  totalItems: number;
  currentPage: number;
};

type UiAction =
  | { type: 'SET_SORT'; payload: TypeOrderExecutionGroupsBy }
  | { type: 'SET_STATUS_FILTER'; payload: TypeExecutionGroupForMenu['status'] }
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

  const [executionGroups, setExecutionGroups] = useState<(TypeExecutionGroupForMenu & { campaignsCount: number })[]>([]);
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
      sortConfig: { direction: 'asc', key: 'id' },
      statusFilter: ['active', 'inactive'],
      totalItems: 0,
    },
  );

  const queryCampaigns = async (
    args: Partial<{
      textSearch: string;
      orderBy: TypeOrderExecutionGroupsBy;
      orderDirection: TypeDirection;
      page: number;
      quantity: number;
    }> = {},
  ) => {
    const result = await apiCaller.executionGroups.getMany({
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
      json.executionGroups.forEach((executionGroup) => {
        executionGroup.createdAt = new Date(executionGroup.createdAt);
        executionGroup.updatedAt = new Date(executionGroup.updatedAt);
      });
      setExecutionGroups(json.executionGroups);
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

  const getStatusColor = (status: TypeExecutionGroupForMenu['status']) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const SortIcon = ({ column }: { column: TypeOrderExecutionGroupsBy }) => {
    if (state.sortConfig.key !== column) {
      return <span className="text-slate-400 ml-1">⇅</span>;
    }
    return state.sortConfig.direction === 'asc' ? <ChevronUp className="w-4 h-4 ml-1 inline" /> : <ChevronDown className="w-4 h-4 ml-1 inline" />;
  };

  const confirm = useDialogStore((state) => state.confirm);

  const deleteExecutionGroup = async ({ executionGroup }: { executionGroup: TypeExecutionGroupForMenu }) => {
    const result = await confirm({
      description: translation.common.deleteConfirmationDescription,
      title: translation.executionGroups.deleteTitle.replace('{id}', String(executionGroup.id)).replace('{name}', executionGroup.name),
    });
    if (!result) return;
    await apiCaller.executionGroups.delete({ pathParams: { executionGroupId: executionGroup.id, tenantId } });
    location.reload();
  };

  return (
    <div className="flex">
      {/* Main Content */}
      <div className="flex-1 p-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-slate-900 mb-2">{translation.executionGroups.headerTitle}</h1>
            <p className="text-slate-600">{translation.executionGroups.headerSubTitle}</p>
          </div>

          {user.permissions.includes(getStringPermission({ action: 'create', feature: 'execution-group', tenantId })) && (
            <a
              href={config.pages.executionGroup({ executionGroupId: undefined, tenantId })}
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all bg-blue-600 text-white hover:bg-blue-700 h-9 px-4 py-2"
            >
              <PlusCircle />
              {translation.executionGroups.createButton}
            </a>
          )}
        </div>

        <DataTable
          rows={executionGroups}
          getRowKey={(executionGroup) => executionGroup.id}
          rowClassName="hover:bg-slate-50 transition-colors"
          columns={[
            {
              label: (
                <>
                  {translation.executionGroups.tableId}
                  <SortIcon column="id" />
                </>
              ),
              onSort: () => dispatch({ payload: 'id', type: 'SET_SORT' }),
              renderCell: (executionGroup) => executionGroup.id,
            },
            {
              label: (
                <>
                  {translation.executionGroups.tableName}
                  <SortIcon column="name" />
                </>
              ),
              onSort: () => dispatch({ payload: 'name', type: 'SET_SORT' }),
              renderCell: (executionGroup) => executionGroup.name,
            },
            {
              label: (
                <>
                  {translation.executionGroups.tableStatus}
                  <SortIcon column="status" />
                </>
              ),
              onSort: () => dispatch({ payload: 'status', type: 'SET_SORT' }),
              renderCell: (executionGroup) => (
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(executionGroup.status)}`}>
                  {translation.common[executionGroup.status]}
                </span>
              ),
            },
            {
              label: translation.executionGroups.tableQuantityCampaigns,
              renderCell: (executionGroup) => executionGroup.campaignsCount,
            },
            {
              label: (
                <>
                  {translation.executionGroups.updatedAt}
                  <SortIcon column="name" />
                </>
              ),
              onSort: () => dispatch({ payload: 'updatedAt', type: 'SET_SORT' }),
              renderCell: (executionGroup) =>
                executionGroup.updatedAt.toLocaleString('es-CL', {
                  day: '2-digit',
                  hour: '2-digit',
                  hour12: false,
                  minute: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                }),
            },
            {
              label: translation.executionGroups.modify,
              renderCell: (executionGroup) =>
                user.permissions.includes(getStringPermission({ action: 'update', feature: 'execution-group', tenantId })) && (
                  <a
                    href={config.pages.executionGroup({ executionGroupId: executionGroup.id, tenantId })}
                    className="w-fit h-fit p-2 flex text-blue-500 hover:bg-blue-200 rounded-lg transition-colors"
                  >
                    <Pencil size={20} />
                  </a>
                ),
            },
            {
              label: translation.executionGroups.delete,
              renderCell: (executionGroup) =>
                user.permissions.includes(getStringPermission({ action: 'delete', feature: 'execution-group', tenantId })) && (
                  <button
                    type="button"
                    onClick={() => deleteExecutionGroup({ executionGroup })}
                    className="p-2 flex text-red-500 hover:bg-red-200 rounded-lg transition-colors"
                  >
                    <Trash2 size={20} />
                  </button>
                ),
            },
          ]}
          emptyMessage={translation.executionGroups.noData}
        />

        {/* Pagination */}
        <div className="mt-6 flex items-center justify-center bg-white rounded-lg shadow p-4">
          <Pagination totalPages={totalPages} page={state.currentPage + 1} onChange={(newPage) => dispatch({ payload: newPage, type: 'SET_CURRENT_PAGE' })} />
        </div>
      </div>

      {/* Sidebar */}
      <div className="w-64 bg-white shadow-lg p-6">
        <h2 className="text-xl font-bold text-slate-900 mb-6">{translation.executionGroups.filtersTitle}</h2>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            onApplyFilters();
          }}
        >
          <div className="mb-6">
            <span className="block text-sm font-semibold text-slate-700 mb-2">{translation.executionGroups.filtersText}</span>
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
                  <span className="ml-2 text-sm text-slate-700">{translation.common[status]}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="mb-6">
            <span className="block text-sm font-semibold text-slate-700 mb-2">{translation.executionGroups.filtersQuantity}</span>
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
            {translation.executionGroups.applyFilters}
          </button>
        </form>
      </div>
    </div>
  );
}
