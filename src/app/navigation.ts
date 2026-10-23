import {
  BadgeDollarSign, Bike, BookOpen, Map, ChefHat, CreditCard, FileBarChart, History, Image, LandPlot, LayoutDashboard, MapPin, Megaphone,
  Package, Percent, Radio, ShieldCheck, ShoppingBag, Store, Users, Wallet, type LucideIcon,
} from 'lucide-react';

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  /** Faol deb belgilash uchun qo'shimcha yo'l boshlanishlari */
  match?: string[];
  /** Ko'rinadigan eng kichik bosqich (1 — hamkor va mijoz, 2 — + MilliyGo kuryerlari) */
  stage: number;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

/** Yon menyu tuzilmasi: yangi bo'lim qo'shish uchun shu yerga yozish va router'da yo'l ochish kifoya */
export const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Asosiy',
    items: [{ to: '/', label: 'Dashbord', icon: LayoutDashboard, stage: 1 }],
  },
  {
    label: 'Operatsiyalar',
    items: [
      { to: '/orders', label: 'Buyurtmalar', icon: ShoppingBag, stage: 1 },
      { to: '/couriers', label: 'Kuryerlar', icon: Bike, stage: 1 },
      { to: '/couriers/map', label: 'Kuryerlar xaritasi', icon: Map, stage: 1 },
      { to: '/dispatch', label: 'Dispetcher va SMS', icon: Radio, stage: 2 },
    ],
  },
  {
    label: 'Mijozlar',
    items: [{ to: '/users', label: 'Foydalanuvchilar', icon: Users, stage: 1 }],
  },
  {
    label: 'Hamkorlar',
    items: [
      { to: '/partners', label: 'Hamkorlar', icon: Store, stage: 1 },
      { to: '/cuisines', label: 'Oshxona turlari', icon: ChefHat, stage: 1 },
      { to: '/tariffs', label: 'Tariflar', icon: BadgeDollarSign, stage: 1 },
    ],
  },
  {
    label: 'Katalog',
    items: [
      { to: '/categories', label: 'Kategoriyalar', icon: BookOpen, stage: 1 },
      { to: '/products', label: 'Mahsulotlar', icon: Package, stage: 1 },
    ],
  },
  {
    label: 'Marketing',
    items: [
      { to: '/banners', label: 'Bannerlar', icon: Image, stage: 1 },
      { to: '/promotions', label: 'Aksiyalar', icon: Percent, stage: 1 },
      { to: '/broadcast', label: 'Ommaviy xabar', icon: Megaphone, stage: 1 },
    ],
  },
  {
    label: 'Moliya',
    items: [
      { to: '/payments', label: "To'lovlar", icon: CreditCard, stage: 1 },
      { to: '/reports', label: 'Hisobotlar', icon: FileBarChart, stage: 1 },
      { to: '/merchants', label: "To'lov ulanishlari", icon: Wallet, stage: 1 },
    ],
  },
  {
    label: 'Hudud',
    items: [
      { to: '/neighborhoods', label: "Xizmat ko'rsatish hududi", icon: LandPlot, stage: 1 },
      { to: '/locations', label: 'Joy manzillari', icon: MapPin, stage: 1 },
    ],
  },
  {
    label: 'Tizim',
    items: [
      { to: '/admins', label: 'Administratorlar', icon: ShieldCheck, stage: 1 },
      { to: '/audit', label: 'Audit jurnali', icon: History, stage: 1 },
    ],
  },
];

export const visibleNavGroups = (stage: number): NavGroup[] =>
  NAV_GROUPS.map((g) => ({ ...g, items: g.items.filter((i) => i.stage <= stage) })).filter((g) => g.items.length > 0);

/** Yo'l uchun kerakli bosqich (navigatsiyada bo'lmagan yo'llar doim ruxsat etiladi) */
export function routeStage(pathname: string): number {
  let best: NavItem | null = null;
  for (const g of NAV_GROUPS) {
    for (const i of g.items) {
      const hit = i.to === '/' ? pathname === '/' : pathname === i.to || pathname.startsWith(i.to + '/');
      if (hit && (!best || i.to.length > best.to.length)) best = i;
    }
  }
  return best?.stage ?? 1;
}
