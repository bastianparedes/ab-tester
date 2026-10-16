'use client';

import { TypeUser } from '@ab-tester/constants/types/user';
import { Eye } from 'lucide-react';
import { useState } from 'react';
import { useTranslationContext } from '@/app/_common/contexts/Translation';
import { useUser } from '@/app/_common/contexts/User';

const formatTimestamp = (date: Date) => {
  return date.toLocaleString('es-ES', {
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};
type Props = {
  usersWatching: { id: TypeUser['id']; name: TypeUser['name'] }[];
  userMadeChange: { id: TypeUser['id']; name: TypeUser['name']; date: Date } | null;
};

export function LiveViewersNavbar({ usersWatching: allUsersWatching, userMadeChange }: Props) {
  const { translation } = useTranslationContext();
  const user = useUser();
  const usersWatching = structuredClone(allUsersWatching).filter((userInList) => userInList.id !== user.data?.id);
  const viewerCount = usersWatching.length;
  const [showTooltip, setShowTooltip] = useState(false);
  const showWarning = !!userMadeChange;

  const bgColor = showWarning ? 'bg-yellow-50' : 'bg-white';
  const borderColor = showWarning ? 'border-yellow-200' : 'border-slate-200';
  const buttonBg = showWarning ? 'bg-yellow-100' : 'bg-slate-50';
  const buttonBorder = showWarning ? 'border-yellow-300' : 'border-slate-200';
  const buttonHover = showWarning ? 'hover:bg-yellow-200' : 'hover:bg-slate-100';
  const iconColor = showWarning ? 'text-yellow-700' : 'text-slate-600';
  const pulseColor = showWarning ? 'bg-yellow-500' : 'bg-green-500';
  const textColor = showWarning ? 'text-yellow-800' : 'text-slate-700';

  if (viewerCount === 0 && !showWarning) return null;

  return (
    <nav className={`${bgColor} shadow-md top-0 ${borderColor}`}>
      <div className="max-w-7xl mx-auto px-8">
        <div className="flex items-center justify-between h-16">
          {/* Editor Info (solo visible en modo warning) */}
          {showWarning && (
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-semibold shadow-sm`}>
                {userMadeChange?.name.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-medium text-yellow-900">
                  <span className="font-semibold">{userMadeChange?.name}</span> {translation.liveViewers.updatedThisData}
                </p>
                <p className="text-xs text-yellow-700">
                  {formatTimestamp(userMadeChange?.date)} • {translation.liveViewers.reloadToMakeChanges}
                </p>
              </div>
            </div>
          )}

          {/* Spacer en modo normal */}
          {!showWarning && <div></div>}

          {/* Live Viewers Indicator */}
          {viewerCount > 0 && (
            <button
              type="button"
              className={`relative flex items-center gap-3 ${buttonBg} px-4 py-2 rounded-full border ${buttonBorder} ${buttonHover} transition-colors`}
              onMouseEnter={() => setShowTooltip(true)}
              onMouseLeave={() => setShowTooltip(false)}
            >
              <div className="relative">
                <Eye className={`w-5 h-5 ${iconColor}`} />
                <span className={`absolute -top-1 -right-1 w-2 h-2 ${pulseColor} rounded-full animate-pulse`}></span>
              </div>

              <span className={`text-sm font-semibold ${textColor}`}>
                {viewerCount.toLocaleString('es-ES')} {translation.liveViewers.peopleViewing}
              </span>

              {/* Tooltip */}
              {showTooltip && usersWatching.length > 0 && (
                <div className="absolute top-full right-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-slate-200 p-4 z-99999">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-slate-800">{translation.liveViewers.watchingNow}</h3>
                    <span className="text-xs text-slate-500">
                      {viewerCount} {translation.liveViewers.total}
                    </span>
                  </div>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {usersWatching.map((viewer) => (
                      <div key={viewer.id} className="flex items-center gap-2 py-1">
                        <div className={`w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-semibold shadow-sm`}>
                          {viewer.name.slice(0, 2).toUpperCase()}
                        </div>
                        <span className="text-sm text-slate-700">{viewer.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
