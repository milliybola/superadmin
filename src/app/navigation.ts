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
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

/** Yon menyu tuzilmasi: yangi bo'lim qo'shish uchun shu yerga yozish va router'da yo'l ochish kifoya */
export const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Asosiy',
    items: [{ to: '/', label: 'Dashbord', icon: LayoutDashboard }],
  },
  {
    label: 'Operatsiyalar',
    items: [
      { to: '/orders', label: 'Buyurtmalar', icon: ShoppingBag },
      { to: '/couriers', label: 'Kuryerlar', icon: Bike },
      { to: '/couriers/map', label: 'Kuryerlar xaritasi', icon: Map },
      { to: '/dispatch', label: 'Dispetcher va SMS', icon: Radio },
    ],
  },
  {
    label: 'Mijozlar',
    items: [{ to: '/users', label: 'Foydalanuvchilar', icon: Users }],
  },
  {
    label: 'Hamkorlar',
    items: [
      { to: '/partners', label: 'Hamkorlar', icon: Store },
      { to: '/cuisines', label: 'Oshxona turlari', icon: ChefHat },
      { to: '/tariffs', label: 'Tariflar', icon: BadgeDollarSign },
    ],
  },
  {
    label: 'Katalog',
    items: [
      { to: '/categories', label: 'Kategoriyalar', icon: BookOpen },
      { to: '/products', label: 'Mahsulotlar', icon: Package },
    ],
  },
  {
    label: 'Marketing',
    items: [
      { to: '/banners', label: 'Bannerlar', icon: Image },
      { to: '/promotions', label: 'Aksiyalar', icon: Percent },
      { to: '/broadcast', label: 'Ommaviy xabar', icon: Megaphone },
    ],
  },
  {
    label: 'Moliya',
    items: [
      { to: '/payments', label: "To'lovlar", icon: CreditCard },
      { to: '/reports', label: 'Hisobotlar', icon: FileBarChart },
      { to: '/merchants', label: "To'lov ulanishlari", icon: Wallet },
    ],
  },
  {
    label: 'Hudud',
    items: [
      { to: '/neighborhoods', label: "Xizmat ko'rsatish hududi", icon: LandPlot },
      { to: '/locations', label: 'Joy manzillari', icon: MapPin },
    ],
  },
  {
    label: 'Tizim',
    items: [
      { to: '/admins', label: 'Administratorlar', icon: ShieldCheck },
      { to: '/audit', label: 'Audit jurnali', icon: History },
    ],
  },
];
