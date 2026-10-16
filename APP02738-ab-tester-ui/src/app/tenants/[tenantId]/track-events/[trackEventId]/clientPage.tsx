'use client';

import type { TypeTrackEventWithOptionalId } from '@ab-tester/constants/types/trackEvents';
import type { TypeUser } from '@ab-tester/constants/types/user';
import Monaco from '@monaco-editor/react';
import { ChevronDown } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { io, type Socket } from 'socket.io-client';
import { Button } from '@/app/_common/components/button';
import { FormSection } from '@/app/_common/components/FormSection';
import { Switch } from '@/app/_common/components/switch';
import { useTranslationContext } from '@/app/_common/contexts/Translation';
import { useUser } from '@/app/_common/contexts/User';
import constants, { getStringPermission } from '@/config/constants';
import commonConstants from '@/config/sharedConstants';
import { env } from '@/libs/env';
import { apiCaller } from '@/libs/restClient';
import { jsCodeHasCorrectSyntax } from '@/utils/jsCode';
import { LiveViewersNavbar } from './components/LiveViewersBar';

type Props = {
  initialTrackEvent: TypeTrackEventWithOptionalId;
  tenantId: number;
  trackEventId: number | undefined;
};

const ClientPage = ({ initialTrackEvent, tenantId, trackEventId }: Props) => {
  const { translation } = useTranslationContext();
  const [trackEvent, setTrackEvent] = useState(initialTrackEvent);
  const socketRef = useRef<Socket | null>(null);
  const [usersWatching, setUsersWatching] = useState<{ id: TypeUser['id']; name: TypeUser['name'] }[]>([]);
  const [userMadeChange, setUserMadeChange] = useState<{ id: TypeUser['id']; name: TypeUser['name']; date: Date } | null>(null);
  const user = useUser();

  const isNewTrackEvent = trackEvent.id === undefined;
  const getDataIsValidJavascript = jsCodeHasCorrectSyntax(trackEvent.getData);

  const returnToTrackEvents = () => {
    location.href = constants.pages.trackEvents({ tenantId: trackEvent.tenantId });
  };

  const handleOnSave = async () => {
    if (trackEvent.id === undefined) {
      await apiCaller.trackEvents.create({
        body: trackEvent,
        pathParams: { tenantId: trackEvent.tenantId },
      });
    } else {
      notifyUsersTrackEventWasUpdated();
      await apiCaller.trackEvents.update({
        body: trackEvent,
        pathParams: { tenantId: trackEvent.tenantId, trackEventId: trackEvent.id },
      });
    }
    returnToTrackEvents();
  };

  useEffect(() => {
    const socket = io(`${env.NEXT_PUBLIC_BACKEND_URL_FROM_CLIENT_SIDE}/gateways/trackEvents`, {
      auth: {
        tenantId,
        trackEventId,
      },
      transports: ['websocket'],
      withCredentials: true,
    });

    socketRef.current = socket;

    socket.on('update-users-watching-trackEvent', (users) => {
      setUsersWatching(users);
    });

    socket.on('user-updated-trackEvent', (user) => {
      setUserMadeChange({ ...user, date: new Date() });
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const notifyUsersTrackEventWasUpdated = () => {
    socketRef.current?.emit('user-updated-trackEvent', { tenantId, trackEventId });
  };

  return (
    <>
      {trackEventId !== undefined && <LiveViewersNavbar usersWatching={usersWatching} userMadeChange={userMadeChange} />}
      <div className="w-9/10 mx-auto my-8 relative flex flex-col gap-8">
        <div className="mb-8">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-4xl font-bold text-blue-900 mb-2">{translation.trackEvent.title}</h1>
              <p className="text-blue-600">{translation.trackEvent.description}</p>
            </div>
            <div className="flex gap-3">
              <div className="relative">
                <select
                  value={trackEvent.status}
                  onChange={(e) =>
                    setTrackEvent({
                      ...trackEvent,
                      status: e.target.value as typeof trackEvent.status,
                    })
                  }
                  className={`outline-none px-6 py-2 rounded-lg font-semibold transition-all shadow-md appearance-none cursor-pointer pr-10 ${
                    trackEvent.status === 'active'
                      ? 'bg-green-500 text-white hover:bg-green-600'
                      : trackEvent.status === 'inactive'
                        ? 'bg-gray-400 text-white hover:bg-gray-500'
                        : 'bg-red-500 text-white hover:bg-red-600'
                  }`}
                >
                  {commonConstants.arrayStatusArray.map((status) => (
                    <option key={status} value={status}>
                      {translation.common[status]}
                    </option>
                  ))}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-white">
                  <ChevronDown />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* NAME */}
        <FormSection>
          <h2 className="text-xl font-semibold text-blue-900 mb-4">{translation.trackEvent.name}</h2>
          <input
            type="text"
            value={trackEvent.name}
            onChange={(e) => setTrackEvent({ ...trackEvent, name: e.target.value })}
            className="w-full px-4 py-3 border-2 border-blue-200 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
          />
        </FormSection>

        <FormSection>
          <h2 className="text-xl font-semibold text-blue-900 mb-4">{translation.trackEvent.config}</h2>

          <div className="flex flex-col gap-3">
            {/* MULTIPLE TIMES */}
            <div className="flex gap-2">
              <div className="flex min-w-16 max-w-16 py-1">
                <Switch
                  checked={trackEvent.multipleTimes}
                  onChange={() =>
                    setTrackEvent((state) => ({
                      ...state,
                      multipleTimes: !state.multipleTimes,
                    }))
                  }
                />
              </div>
              <div>
                <h3 className="text-xl font-bold">{translation.trackEvent.multipleTimesTitle}</h3>
                <p>
                  <span className="text-green-600">{translation.trackEvent.enabled}</span> {translation.trackEvent.multipleTimesEnabledDescription}
                </p>
                <p>
                  <span className="text-red-600">{translation.trackEvent.disabled}</span> {translation.trackEvent.multipleTimesDisabledDescription}
                </p>
              </div>
            </div>
          </div>
        </FormSection>

        {/* NAME */}
        <FormSection>
          <h2 className="text-xl font-semibold text-blue-900 mb-4">{translation.trackEvent.name}</h2>
          <div className="h-96">
            <Monaco
              options={{
                minimap: {
                  enabled: false,
                },
              }}
              theme="vs-dark"
              language="javascript"
              onChange={(javascript: string | undefined) => {
                setTrackEvent({ ...trackEvent, getData: javascript ?? '' });
              }}
              value={trackEvent.getData}
            />
          </div>
        </FormSection>

        <div className="mt-8 flex justify-end gap-4">
          <Button onClick={returnToTrackEvents} variant="destructive">
            Cancel
          </Button>
          {((isNewTrackEvent && user.permissions.includes(getStringPermission({ action: 'create', feature: 'track-event', tenantId }))) ||
            (!isNewTrackEvent && user.permissions.includes(getStringPermission({ action: 'update', feature: 'track-event', tenantId })))) && (
            <Button disabled={!!userMadeChange || !getDataIsValidJavascript} onClick={handleOnSave} variant="default">
              Save track event
            </Button>
          )}
        </div>
      </div>
    </>
  );
};

export { ClientPage };
