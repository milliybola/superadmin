import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import type { AdminUserDetail } from '../api';
import { useUserActions } from '../hooks';

const schema = z.object({
  full_name: z.string().trim().min(1, 'Ismni kiriting').max(150),
  email: z.union([z.literal(''), z.string().trim().email("Email noto'g'ri")]),
  is_active: z.boolean(),
});
type FormValues = z.infer<typeof schema>;

export function EditUserDialog({ user, open, onOpenChange }: { user: AdminUserDetail; open: boolean; onOpenChange: (o: boolean) => void }) {
  const { update } = useUserActions(user.uuid);
  const { register, handleSubmit, control, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    values: { full_name: user.full_name ?? '', email: user.email ?? '', is_active: user.is_active },
  });

  const submit = handleSubmit((v) =>
    update.mutate({ full_name: v.full_name, email: v.email || null, is_active: v.is_active }, { onSuccess: () => onOpenChange(false) }));

  return (
    <Dialog open={open} onOpenChange={(o) => !update.isPending && onOpenChange(o)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>Foydalanuvchini tahrirlash</DialogTitle></DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="u-name">Ism</Label>
            <Input id="u-name" {...register('full_name')} />
            {errors.full_name && <p className="text-xs text-destructive">{errors.full_name.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="u-email">Email</Label>
            <Input id="u-email" type="email" {...register('email')} />
            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
          </div>
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <Label htmlFor="u-active">Akkaunt faol</Label>
              <p className="text-xs text-muted-foreground">O'chirilsa foydalanuvchi tizimga kira olmaydi.</p>
            </div>
            <Controller control={control} name="is_active"
              render={({ field }) => <Switch id="u-active" checked={field.value} onCheckedChange={field.onChange} />} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={update.isPending}>Bekor qilish</Button>
            <Button type="submit" disabled={update.isPending}>
              {update.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}Saqlash
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
