import {
  BadgeDollarSign, Bike, BookOpen, Banknote, Bot, Map, ChefHat, CreditCard, FileBarChart, History, Image, LandPlot, LayoutDashboard, MapPin, Megaphone, MessageSquareText,
  Layers, Package, Percent, PhoneCall, Radio, ShieldCheck, ShoppingBag, Store, TrendingUp, Users, Wallet, type LucideIcon,
} from 'lucide-react';
import { STAGE } from './stageLevels';

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  /** Faol deb belgilash uchun qo'shimcha yo'l boshlanishlari */
  match?: string[];
  /** Ko'rinadigan eng kichik bosqich (1 — hamkor va mijoz, 2 — + POS tizimi, 3 — + MilliyGo kuryerlari, 4 — hammasi); STAGE (stage.tsx) */
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
    items: [
      { to: '/', label: 'Dashbord', icon: LayoutDashboard, stage: STAGE.BASE },
      { to: '/stats', label: 'Platforma raqamlari', icon: TrendingUp, stage: STAGE.BASE },
    ],
  },
  {
    label: 'Operatsiyalar',
    items: [
      { to: '/orders', label: 'Buyurtmalar', icon: ShoppingBag, stage: STAGE.BASE },
      { to: '/verifications', label: 'Tasdiqlash navbati', icon: PhoneCall, stage: STAGE.BASE },
      { to: '/couriers', label: 'Kuryerlar', icon: Bike, stage: STAGE.BASE },
      { to: '/couriers/map', label: 'Kuryerlar xaritasi', icon: Map, stage: STAGE.BASE },
      { to: '/shifts', label: 'Smenalar', icon: Banknote, stage: STAGE.POS },
      { to: '/dispatch', label: 'Telegram dispetcher', icon: Radio, stage: STAGE.ALL }, // Q49: ichki/tajribaviy, faqat egasi
    ],
  },
  {
    label: 'Mijozlar',
    items: [{ to: '/users', label: 'Foydalanuvchilar', icon: Users, stage: STAGE.BASE }],
  },
  {
    label: 'Hamkorlar',
    items: [
      { to: '/partners', label: 'Hamkorlar', icon: Store, stage: STAGE.BASE },
      { to: '/cuisines', label: 'Oshxona turlari', icon: ChefHat, stage: STAGE.BASE },
      { to: '/tariffs', label: 'Tariflar', icon: BadgeDollarSign, stage: STAGE.BASE },
    ],
  },
  {
    label: 'Katalog',
    items: [
      { to: '/categories', label: 'Kategoriyalar', icon: BookOpen, stage: STAGE.BASE },
      { to: '/products', label: 'Mahsulotlar', icon: Package, stage: STAGE.BASE },
    ],
  },
  {
    label: 'Marketing',
    items: [
      { to: '/banners', label: 'Bannerlar', icon: Image, stage: STAGE.BASE },
      { to: '/promotions', label: 'Aksiyalar', icon: Percent, stage: STAGE.BASE },
      { to: '/broadcast', label: 'Ommaviy xabar', icon: Megaphone, stage: STAGE.BASE },
    ],
  },
  {
    label: 'Moliya',
    items: [
      { to: '/payments', label: "To'lovlar", icon: CreditCard, stage: STAGE.BASE },
      { to: '/reports', label: 'Hisobotlar', icon: FileBarChart, stage: STAGE.BASE },
      { to: '/merchants', label: "To'lov ulanishlari", icon: Wallet, stage: STAGE.BASE },
    ],
  },
  {
    label: 'Hudud',
    items: [
      { to: '/neighborhoods', label: "Xizmat ko'rsatish hududi", icon: LandPlot, stage: STAGE.BASE },
      { to: '/locations', label: 'Joy manzillari', icon: MapPin, stage: STAGE.BASE },
    ],
  },
  {
    label: 'Tizim',
    items: [
      { to: '/admins', label: 'Administratorlar', icon: ShieldCheck, stage: STAGE.BASE },
      { to: '/audit', label: 'Audit jurnali', icon: History, stage: STAGE.BASE },
      { to: '/sms', label: 'SMS', icon: MessageSquareText, stage: STAGE.BASE },
      { to: '/telegram', label: 'Telegram bot', icon: Bot, stage: STAGE.BASE },
      { to: '/stages', label: 'Bosqichlar', icon: Layers, stage: STAGE.BASE },
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
