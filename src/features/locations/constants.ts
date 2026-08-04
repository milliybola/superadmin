import type { LocationType } from './services/locationsApi';

interface LocationTypeMeta {
  label: string;
  badgeVariant: 'default' | 'secondary' | 'destructive' | 'success' | 'outline';
  mapIcon: string;
}

export const LOCATION_TYPE_META: Record<LocationType, LocationTypeMeta> = {
  GOVERNMENT: { label: 'Davlat muassasasi', badgeVariant: 'default', mapIcon: 'islands#blueDotIcon' },
  MARKET: { label: 'Bozor', badgeVariant: 'success', mapIcon: 'islands#greenDotIcon' },
  HOSPITAL: { label: 'Shifoxona', badgeVariant: 'destructive', mapIcon: 'islands#redDotIcon' },
  EDUCATION: { label: "Ta'lim", badgeVariant: 'secondary', mapIcon: 'islands#violetDotIcon' },
  TRANSPORT: { label: 'Transport', badgeVariant: 'outline', mapIcon: 'islands#grayDotIcon' },
  SHOPPING: { label: 'Savdo', badgeVariant: 'success', mapIcon: 'islands#darkGreenDotIcon' },
  LANDMARK: { label: "Diqqatga sazovor joy", badgeVariant: 'default', mapIcon: 'islands#darkBlueDotIcon' },
  RESIDENTIAL: { label: 'Turar-joy', badgeVariant: 'secondary', mapIcon: 'islands#violetDotIcon' },
  OTHER: { label: 'Boshqa', badgeVariant: 'outline', mapIcon: 'islands#grayDotIcon' },
};

export const LOCATION_TYPE_OPTIONS: { value: LocationType | 'ALL'; label: string }[] = [
  { value: 'ALL', label: 'Barcha turlar' },
  ...(Object.keys(LOCATION_TYPE_META) as LocationType[]).map((value) => ({
    value,
    label: LOCATION_TYPE_META[value].label,
  })),
];
