export interface CinematicTheme {
  background: string;
  surface: string;
  pageInk: string;
  pageMuted: string;
  surfaceInk: string;
  surfaceMuted: string;
  accent: string;
  accent2: string;
  pageAccentText: string;
  surfaceAccentText: string;
  primaryBackground: string;
  primaryInk: string;
}

export const cinematicThemes = {
  '21n-apps': {
    background: '#172554',
    surface: '#1E3A5F',
    pageInk: '#F8FAFC',
    pageMuted: '#CBD5E1',
    surfaceInk: '#F8FAFC',
    surfaceMuted: '#CBD5E1',
    accent: '#2563EB',
    accent2: '#34D399',
    pageAccentText: '#6EE7B7',
    surfaceAccentText: '#6EE7B7',
    primaryBackground: '#1D4ED8',
    primaryInk: '#FFFFFF'
  },
  snapmate: {
    background: '#FFF7ED',
    surface: '#FFFFFF',
    pageInk: '#4A2D24',
    pageMuted: '#8A675C',
    surfaceInk: '#4A2D24',
    surfaceMuted: '#79574B',
    accent: '#FB923C',
    accent2: '#FB7185',
    pageAccentText: '#9F1239',
    surfaceAccentText: '#9F1239',
    primaryBackground: '#C2410C',
    primaryInk: '#FFFFFF'
  },
  'bubble-bible': {
    background: '#FFF8E7',
    surface: '#F4E8CC',
    pageInk: '#4A3326',
    pageMuted: '#806B58',
    surfaceInk: '#4A3326',
    surfaceMuted: '#6B5542',
    accent: '#C99A36',
    accent2: '#7393B3',
    pageAccentText: '#365A78',
    surfaceAccentText: '#365A78',
    primaryBackground: '#7C5A12',
    primaryInk: '#FFFFFF'
  },
  'dongne-paint': {
    background: '#263238',
    surface: '#FFF3D6',
    pageInk: '#FFF3D6',
    pageMuted: '#C4D0D3',
    surfaceInk: '#263238',
    surfaceMuted: '#4E5C61',
    accent: '#18B87A',
    accent2: '#FF6B4A',
    pageAccentText: '#FF9A83',
    surfaceAccentText: '#9F2D16',
    primaryBackground: '#0B6B4A',
    primaryInk: '#FFFFFF'
  },
  'youth-money-guide': {
    background: '#FFFCF2',
    surface: '#FFFFFF',
    pageInk: '#172033',
    pageMuted: '#64748B',
    surfaceInk: '#172033',
    surfaceMuted: '#64748B',
    accent: '#1D4ED8',
    accent2: '#10B981',
    pageAccentText: '#047857',
    surfaceAccentText: '#047857',
    primaryBackground: '#1D4ED8',
    primaryInk: '#FFFFFF'
  },
  'starlight-greenhouse': {
    background: '#0B1026',
    surface: '#151B35',
    pageInk: '#FFFFFF',
    pageMuted: '#A5B4CF',
    surfaceInk: '#FFFFFF',
    surfaceMuted: '#A5B4CF',
    accent: '#7C5CFC',
    accent2: '#74D9E8',
    pageAccentText: '#74D9E8',
    surfaceAccentText: '#74D9E8',
    primaryBackground: '#5B3CC4',
    primaryInk: '#FFFFFF'
  },
  'volley-king-30': {
    background: '#2563EB',
    surface: '#FFF8E6',
    pageInk: '#FFFFFF',
    pageMuted: '#EFF6FF',
    surfaceInk: '#172033',
    surfaceMuted: '#526071',
    accent: '#EF4444',
    accent2: '#FACC15',
    pageAccentText: '#FFFFFF',
    surfaceAccentText: '#765000',
    primaryBackground: '#B91C1C',
    primaryInk: '#FFFFFF'
  },
  'toris-docs': {
    background: '#20242C',
    surface: '#2B303A',
    pageInk: '#F7F3E8',
    pageMuted: '#B8B3A8',
    surfaceInk: '#F7F3E8',
    surfaceMuted: '#C8C2B4',
    accent: '#22B8CF',
    accent2: '#7C6EE6',
    pageAccentText: '#B8AEFF',
    surfaceAccentText: '#B8AEFF',
    primaryBackground: '#0E7490',
    primaryInk: '#FFFFFF'
  },
  'product-growth-skills': {
    background: '#111827',
    surface: '#1F2937',
    pageInk: '#F9FAFB',
    pageMuted: '#A7B0C0',
    surfaceInk: '#F9FAFB',
    surfaceMuted: '#C0C7D3',
    accent: '#8B5CF6',
    accent2: '#38BDF8',
    pageAccentText: '#38BDF8',
    surfaceAccentText: '#38BDF8',
    primaryBackground: '#6D28D9',
    primaryInk: '#FFFFFF'
  }
} as const satisfies Record<string, CinematicTheme>;
