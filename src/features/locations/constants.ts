import type { LocationType } from './services/locationsApi';

interface LocationTypeStyle {
  badgeVariant: 'default' | 'secondary' | 'destructive' | 'success' | 'outline';
  mapIcon: string;
}

// Presentation-only styling per type — labels themselves come live from
// GET /locations/types/ so the backend stays the source of truth for text.
export const LOCATION_TYPE_META: Record<LocationType, LocationTypeStyle> = {
  GOVERNMENT: { badgeVariant: 'default', mapIcon: 'islands#blueDotIcon' },
  MARKET: { badgeVariant: 'success', mapIcon: 'islands#greenDotIcon' },
  HOSPITAL: { badgeVariant: 'destructive', mapIcon: 'islands#redDotIcon' },
  EDUCATION: { badgeVariant: 'secondary', mapIcon: 'islands#violetDotIcon' },
  TRANSPORT: { badgeVariant: 'outline', mapIcon: 'islands#grayDotIcon' },
  SHOPPING: { badgeVariant: 'success', mapIcon: 'islands#darkGreenDotIcon' },
  LANDMARK: { badgeVariant: 'default', mapIcon: 'islands#darkBlueDotIcon' },
  RESIDENTIAL: { badgeVariant: 'secondary', mapIcon: 'islands#violetDotIcon' },
  OTHER: { badgeVariant: 'outline', mapIcon: 'islands#grayDotIcon' },
};
