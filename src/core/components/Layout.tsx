import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LayoutDashboard, MapPin, Store, LandPlot, LogOut, Sun, Moon, ChevronsUpDown } from 'lucide-react';
import { STORAGE_KEYS } from '../config/constants';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const navItems = [
  { to: '/', label: 'Dashbord', icon: LayoutDashboard },
  { to: '/locations', label: 'Joy manzillari', icon: MapPin },
  { to: '/partners', label: 'Hamkorlar', icon: Store },
  { to: '/neighborhoods', label: "Xizmat ko'rsatish hududi", icon: LandPlot },
];

const Layout: React.FC = () => {
  const [admin] = useState<any>(() => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.ADMIN_DATA);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  });
  const [theme, setTheme] = useState<'light' | 'dark'>(() => (localStorage.getItem('superadmin_theme') as 'light' | 'dark') || 'dark');
  const navigate = useNavigate();

  const applyTheme = (next: 'light' | 'dark') => {
    setTheme(next);
    document.documentElement.classList.toggle('dark', next === 'dark');
    localStorage.setItem('superadmin_theme', next);
  };

  const handleLogout = () => {
    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.ADMIN_DATA);
    navigate('/login');
  };

  const displayName = admin?.full_name || admin?.email || admin?.phone_number || 'Admin';
  const initials = displayName.slice(0, 2).toUpperCase();

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon">
        <SidebarHeader>
          <div className="flex items-center gap-2 px-2 py-1.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary font-bold text-primary-foreground">
              S
            </div>
            <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
              <span className="truncate font-semibold">Superadmin</span>
              <span className="truncate text-xs text-muted-foreground">Boshqaruv paneli</span>
            </div>
          </div>
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Menyu</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {navItems.map((item) => (
                  <SidebarMenuItem key={item.to}>
                    <NavLink to={item.to} end={item.to === '/'}>
                      {({ isActive }) => (
                        <SidebarMenuButton isActive={isActive} tooltip={item.label}>
                          <item.icon />
                          <span>{item.label}</span>
                        </SidebarMenuButton>
                      )}
                    </NavLink>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton size="lg">
                    <Avatar className="h-7 w-7 rounded-lg">
                      <AvatarFallback className="rounded-lg bg-primary/10 text-primary text-xs">{initials}</AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-medium">{displayName}</span>
                      <span className="truncate text-xs text-muted-foreground">Superadmin</span>
                    </div>
                    <ChevronsUpDown className="ml-auto size-4" />
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent side="top" align="start" className="w-[--radix-dropdown-menu-trigger-width] min-w-56">
                  <DropdownMenuItem onClick={() => applyTheme(theme === 'light' ? 'dark' : 'light')}>
                    {theme === 'light' ? <Moon className="mr-2 size-4" /> : <Sun className="mr-2 size-4" />}
                    {theme === 'light' ? 'Tungi rejim' : 'Kunduzgi rejim'}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
                    <LogOut className="mr-2 size-4" />
                    Chiqish
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger />
          <Separator orientation="vertical" className="h-4" />
          <span className="text-sm font-medium text-muted-foreground">Boshqaruv paneli</span>
        </header>
        <div className="flex-1 p-4 md:p-8">
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
};

export default Layout;
