'use client';

import type { TypeAudienceForMenu, TypeOrderAudiencesBy } from '@ab-tester/constants/types/audience';
import type { TypeDirection } from '@ab-tester/constants/types/constants';
import { ChevronDown, ChevronUp, Pencil, PlusCircle, Trash2 } from 'lucide-react';
import { useEffect, useReducer, useState } from 'react';
import { Pagination } from '@/app/_common/components/Pagination';
import { useDialogStore } from '@/app/_common/contexts/Dialog/state';
import { useTranslationContext } from '@/app/_common/contexts/Translation';
import { useUser } from '@/app/_common/contexts/User';
import config, { getStringPermission } from '@/config/constants';
import { apiCaller } from '@/libs/restClient';

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

  return (
    <div className="flex">
      {/* Main Content */}
      <div className="flex-1 p-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-slate-900 mb-2">{translation.audiences.headerTitle}</h1>
            <p className="text-slate-600">{translation.audiences.headerSubTitle}</p>
          </div>
          {user.permissions.includes(getStringPermission({ action: 'create', feature: 'audience', tenantId })) && (
            <a
              href={config.pages.audience({ audienceId: undefined, tenantId })}
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all bg-blue-600 text-white hover:bg-blue-700 h-9 px-4 py-2"
            >
              <PlusCircle />
              {translation.audiences.createButton}
            </a>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-800 text-white">
                <tr>
                  <th
                    onClick={() => dispatch({ payload: 'id', type: 'SET_SORT' })}
                    className="px-6 py-4 text-left text-sm font-semibold cursor-pointer hover:bg-slate-700 transition-colors select-none"
                  >
                    {translation.audiences.tableId}
                    <SortIcon column="id" />
                  </th>
                  <th
                    onClick={() => dispatch({ payload: 'name', type: 'SET_SORT' })}
                    className="px-6 py-4 text-left text-sm font-semibold cursor-pointer hover:bg-slate-700 transition-colors select-none"
                  >
                    {translation.audiences.tableName}
                    <SortIcon column="name" />
                  </th>
                  <th
                    onClick={() => dispatch({ payload: 'updatedAt', type: 'SET_SORT' })}
                    className="px-6 py-4 text-left text-sm font-semibold cursor-pointer hover:bg-slate-700 transition-colors select-none"
                  >
                    {translation.audiences.updatedAt}
                    <SortIcon column="updatedAt" />
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">{translation.audiences.modify}</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">{translation.audiences.delete}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {audiences.length > 0 ? (
                  audiences.map((audience) => (
                    <tr key={audience.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 text-left">{audience.id}</td>
                      <td className="px-6 py-4 text-left">{audience.name}</td>
                      <td className="px-6 py-4 text-left">
                        {audience.updatedAt.toLocaleString('es-CL', {
                          day: '2-digit',
                          hour: '2-digit',
                          hour12: false,
                          minute: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="px-6 py-4 text-left">
                        {user.permissions.includes(getStringPermission({ action: 'read', feature: 'audience', tenantId })) && (
                          <a
                            href={config.pages.audience({ audienceId: audience.id, tenantId })}
                            className="w-fit h-fit p-2 flex text-blue-500 hover:bg-blue-200 rounded-lg transition-colors"
                          >
                            <Pencil size={20} />
                          </a>
                        )}
                      </td>
                      <td className="px-6 py-4 text-left">
                        {user.permissions.includes(getStringPermission({ action: 'delete', feature: 'audience', tenantId })) && (
                          <button type="button" onClick={() => deleteAudience({ audience })} className="p-2 flex text-red-500 hover:bg-red-200 rounded-lg transition-colors">
                            <Trash2 size={20} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-slate-500">
                      {translation.audiences.noData}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

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
