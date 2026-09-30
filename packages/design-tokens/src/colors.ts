/**
 * N24:31 rang tizimi.
 * Rasmlardan chiqarilgan: krem fon, olive primary, gold accent.
 */

export const light = {
  // Ground
  bg: '#F1EBDB',
  bgAlt: '#EFE9DE',
  surface: '#FAF6EA',
  surfaceAlt: '#FDFAF3',
  surface2: '#EDE5D0',
  surfaceGlass: 'rgba(253, 250, 243, 0.72)',

  // Text
  ink: '#2A2820',
  ink2: '#4A4636',
  text: '#2E2A20',
  muted: '#857E6E',
  textMuted: '#7A756B',

  // Brand
  olive: '#8A8D5B',
  oliveDark: '#4E5230',
  oliveDeep: '#363924',
  oliveSoft: '#B5B891',

  gold: '#C9A96E',
  goldSoft: '#E4CE9A',
  goldDark: '#A88848',

  // Status
  danger: '#B85450',
  success: '#7A8A5B',
  warning: '#D9A24B',
  info: '#5F7A94',

  // Structural
  rule: '#D9D0BE',
  ruleSoft: '#E7DEC8',
  overlay: 'rgba(20, 18, 12, 0.4)',
  scrim: 'rgba(20, 18, 12, 0.7)',
} as const;

export const dark = {
  bg: '#1B1B14',
  bgAlt: '#22221A',
  surface: '#23231B',
  surfaceAlt: '#2D2C22',
  surface2: '#2D2C22',
  surfaceGlass: 'rgba(35, 35, 27, 0.7)',

  ink: '#F0EBDA',
  ink2: '#C9C3AE',
  text: '#F0EBDA',
  muted: '#948E7E',
  textMuted: '#948E7E',

  olive: '#ABAF75',
  oliveDark: '#C4C88C',
  oliveDeep: '#DBDDA2',
  oliveSoft: '#8A8D5B',

  gold: '#E4CE9A',
  goldSoft: '#F1DFB2',
  goldDark: '#C9A96E',

  danger: '#D9836A',
  success: '#9CB878',
  warning: '#E8BD70',
  info: '#8FA9C1',

  rule: '#3B392C',
  ruleSoft: '#302E23',
  overlay: 'rgba(0, 0, 0, 0.55)',
  scrim: 'rgba(0, 0, 0, 0.8)',
} as const;

export type ColorScheme = typeof light;
export type ColorKey = keyof ColorScheme;

export const colors = { light, dark };
