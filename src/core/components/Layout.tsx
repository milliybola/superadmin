import React, { Suspense, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LogOut, Sun, Moon, ChevronsUpDown, Loader2 } from 'lucide-react';
import { STORAGE_KEYS } from '../config/constants';
import { clearSession } from '../api/client';
import { visibleNavGroups } from '@/app/navigation';
import { StageGuard, StageSelect, useStage } from '@/app/stage';
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
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const PageFallback = () => (
  <div className="flex h-64 items-center justify-center text-muted-foreground">
    <Loader2 className="size-6 animate-spin" />
  </div>
);

const Layout: React.FC = () => {
  const [admin] = useState<{ full_name?: string; email?: string; phone_number?: string } | null>(() => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.ADMIN_DATA);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  });
  const [theme, setTheme] = useState<'light' | 'dark'>(() => (localStorage.getItem('superadmin_theme') as 'light' | 'dark') || 'dark');
  const navigate = useNavigate();
  const { stage } = useStage();

  const applyTheme = (next: 'light' | 'dark') => {
    setTheme(next);
    document.documentElement.classList.toggle('dark', next === 'dark');
    localStorage.setItem('superadmin_theme', next);
  };

  const handleLogout = () => {
    clearSession();
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
              M
            </div>
            <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
              <span className="truncate font-semibold">MilliyGo</span>
              <span className="truncate text-xs text-muted-foreground">Superadmin paneli</span>
            </div>
          </div>
        </SidebarHeader>

        <SidebarContent>
          {visibleNavGroups(stage).map((group) => (
            <SidebarGroup key={group.label}>
              <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {group.items.map((item) => (
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
          ))}
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
                      <span className="truncate text-xs text-muted-foreground">Administrator</span>
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
        <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-2 border-b bg-background/80 px-4 backdrop-blur">
          <SidebarTrigger />
          <Separator orientation="vertical" className="h-4" />
          <span className="text-sm font-medium text-muted-foreground">Boshqaruv paneli</span>
          <div className="ml-auto flex items-center gap-2">
            <StageSelect />
            <Button variant="ghost" size="icon" onClick={() => applyTheme(theme === 'light' ? 'dark' : 'light')} aria-label="Mavzuni almashtirish">
              {theme === 'light' ? <Moon className="size-4" /> : <Sun className="size-4" />}
            </Button>
          </div>
        </header>
        <div className="mx-auto w-full max-w-[1500px] flex-1 p-4 md:p-6 lg:p-8">
          <Suspense fallback={<PageFallback />}>
            <StageGuard><Outlet /></StageGuard>
          </Suspense>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
};

export default Layout;
