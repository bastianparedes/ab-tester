import { ChevronLeft, ChevronRight } from 'lucide-react';

type Props = {
  totalPages: number;
  page: number;
  onChange: (page: number) => void;
};

export function Pagination({ totalPages, page, onChange }: Props) {
  const goTo = (p: number) => {
    if (p < 0 || p >= totalPages) return;
    onChange(p);
  };

  const getPages = () => {
    const pages: (number | 'dots')[] = [];

    const start = Math.max(1, page - 1);
    const end = Math.min(totalPages - 2, page + 1);

    pages.push(0);

    if (start > 1) pages.push('dots');

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (end < totalPages - 2) pages.push('dots');

    if (totalPages > 1) pages.push(totalPages - 1);

    return pages;
  };

  const pages = getPages();

  return (
    <div className="flex items-center justify-center gap-3 text-sm">
      <button type="button" onClick={() => goTo(page - 1)} disabled={page === 0} className="px-2 text-gray-600 hover:text-black disabled:opacity-40">
        <ChevronLeft />
      </button>

      {pages.map((p, i) =>
        p === 'dots' ? (
          <span key={`dots-${i}`} className="px-1 text-gray-500">
            ...
          </span>
        ) : (
          <button
            key={p}
            type="button"
            onClick={() => goTo(p)}
            className={`h-10 w-10 flex items-center justify-center rounded-full transition
            ${p === page ? 'bg-gray-200 text-black' : 'text-gray-700 hover:bg-gray-100'}`}
          >
            {p + 1}
          </button>
        ),
      )}

      <button type="button" onClick={() => goTo(page + 1)} disabled={page === totalPages - 1} className="px-2 text-gray-600 hover:text-black disabled:opacity-40">
        <ChevronRight />
      </button>
    </div>
  );
}
