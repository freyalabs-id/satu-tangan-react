import type { Stage, Payment, Effort } from '../types';

export const CONFIG = {
  EFFORT: { Low: 1, Med: 2, High: 3 } as Record<Effort, number>,
  DEFAULT_CAP: 6,
  DEFAULT_LEAD: 12,
  DEFAULT_NAME: 'mekar',
  DEFAULT_ICON: 'balloon',
  TZ_OFFSET: 7,
  TZ_NAME: 'Asia/Jakarta' as const,
  LOCALE: 'id-ID',
  CURRENCY: 'IDR',
  QUEUE_HORIZON: 24,
  DELIVERY_ALARM_LEAD: 30,
  CRAFT_ALARM_OFFSET: 0,
  WA_COUNTRY_CODE: '62',
  MAX_DESIGN_PRESETS: 12,
  STAGES: ['Confirmed', 'Crafting', 'Out', 'Done'] as Stage[],
  PAYMENTS: ['Unpaid', 'DP', 'Lunas'] as Payment[],
  STAGE_COLORS: {
    Confirmed: '#5b8db8',
    Crafting: '#e8a23c',
    Out: '#9a82bf',
    Done: '#5cba84',
  },
};
