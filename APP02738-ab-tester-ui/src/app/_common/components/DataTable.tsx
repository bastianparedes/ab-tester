import type { ReactNode } from 'react';

export type DataTableColumn = {
  label: ReactNode;
  onSort?: () => void;
};

export type DataTableColumnDefinition<Row> = DataTableColumn & {
  renderCell: (row: Row) => ReactNode;
};

type Props<Row> = {
  columns: DataTableColumnDefinition<Row>[];
  rows: Row[];
  getRowKey: (row: Row) => string | number;
  rowClassName?: string;
  emptyMessage: ReactNode;
};

export function DataTable<Row>({ columns, rows, getRowKey, rowClassName, emptyMessage }: Props<Row>) {
  return (
    <div className="overflow-hidden rounded-xl bg-white shadow-lg">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-800 text-white">
            <tr>
              {columns.map((column, index) => (
                <th
                  key={index}
                  onClick={column.onSort}
                  className={`px-6 py-4 text-left text-sm font-semibold ${column.onSort ? 'cursor-pointer select-none transition-colors hover:bg-slate-700' : ''}`}
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-8 text-center text-slate-500">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={getRowKey(row)} className={rowClassName}>
                  {columns.map((column, index) => (
                    <td key={index} className="px-6 py-4 text-left">
                      {column.renderCell(row)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
