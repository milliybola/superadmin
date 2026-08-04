import React from 'react';
import { MapPin } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const DashboardPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Superadmin paneliga xush kelibsiz</h1>
        <p className="text-muted-foreground">Chap tomondagi menyudan bo'limni tanlang.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <NavLink to="/locations">
          <Card className="transition-colors hover:border-primary/50 hover:bg-accent/50">
            <CardHeader className="flex flex-row items-center gap-3 space-y-0">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                <MapPin className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-base">Joy manzillari</CardTitle>
                <CardDescription>Mijozlar uchun joy manzillari ro'yxati</CardDescription>
              </div>
            </CardHeader>
          </Card>
        </NavLink>
      </div>
    </div>
  );
};

export default DashboardPage;
