import { TrUsageThrowEventTypes } from 'modules/trUsage';

export const TR_USAGE_THROW_EVENT = 'TR_USAGE_THROW_EVENT';
export const TR_USAGE_THROW_EVENT_TZ_SERVER = 'TR_USAGE_THROW_EVENT_TZ_SERVER';

export const trUsageThrowEvent = (
  eventAction: TrUsageThrowEventTypes,
  extraParams?: Record<string, unknown>,
  label?: string,
) =>
  ({
    type: TR_USAGE_THROW_EVENT,
    payload: {
      eventAction,
      extraParams,
      label,
    },
  } as const);

export const trUsageThrowEventTZServer = (
  eventAction: TrUsageThrowEventTypes,
  extraParams?: Record<string, unknown>,
  label?: string,
) =>
  ({
    type: TR_USAGE_THROW_EVENT_TZ_SERVER,
    payload: {
      eventAction,
      extraParams,
      label,
    },
  } as const);
