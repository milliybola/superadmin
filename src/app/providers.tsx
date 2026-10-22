import type { ReactNode } from 'react';
import { MutationCache, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster, toast } from 'sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { getErrorMessage } from '@/shared/lib/errors';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 15_000,
      retry: (count, error) => {
        // 4xx (ruxsat, topilmadi, validatsiya) qayta urinish bilan to'g'rilanmaydi
        const status = (error as { response?: { status?: number } })?.response?.status;
        return !(status && status < 500) && count < 2;
      },
      refetchOnWindowFocus: false,
    },
  },
  // Har bir amal (mutation) xatosi bir joyda ko'rsatiladi; alohida ko'rsatmoqchi bo'lsa meta.silent
  mutationCache: new MutationCache({
    onError: (error, _vars, _ctx, mutation) => {
      if (!mutation.meta?.silent) toast.error(getErrorMessage(error));
    },
  }),
});

export function Providers({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider delayDuration={200}>{children}</TooltipProvider>
      <Toaster richColors closeButton position="top-right" theme="system" />
    </QueryClientProvider>
  );
}
