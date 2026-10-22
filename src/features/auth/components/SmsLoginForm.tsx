import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, Loader2, MessageSquareText, Phone } from 'lucide-react';
import { isAxiosError } from 'axios';
import apiClient from '@/core/api/client';
import { ENDPOINTS, STORAGE_KEYS } from '@/core/config/constants';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cleanPhone, formatUzPhone, isCompletePhone } from '../phone';

const RESEND_SECONDS = 60;

const serverMessage = (e: unknown, fallback: string) =>
  (isAxiosError(e) && (e.response?.data?.message || e.response?.data?.detail || e.response?.data?.phone_number?.[0])) || fallback;

/** SMS (Eskiz) orqali bir martalik kod bilan kirish. Faqat `admin` rolidagi hisoblar panelga kiradi. */
export default function SmsLoginForm() {
  const navigate = useNavigate();
  const [phone, setPhone] = useState('+998');
  const [code, setCode] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [wait, setWait] = useState(0);

  useEffect(() => {
    if (wait <= 0) return;
    const t = setTimeout(() => setWait((w) => w - 1), 1000);
    return () => clearTimeout(t);
  }, [wait]);

  const sendCode = async () => {
    if (!isCompletePhone(phone)) return setError("Telefon raqami to'liq emas. Misol: +998 (90) 123-45-67");
    setBusy(true);
    setError(null);
    try {
      await apiClient.post(ENDPOINTS.AUTH.SEND_OTP, { phone_number: cleanPhone(phone), channel: 'sms' }, { skipAuthRedirect: true });
      setSent(true);
      setCode('');
      setWait(RESEND_SECONDS);
    } catch (e) {
      setError(serverMessage(e, "SMS yuborib bo'lmadi. Keyinroq urinib ko'ring."));
    } finally {
      setBusy(false);
    }
  };

  const verify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== 6) return setError('6 xonali kodni kiriting.');
    setBusy(true);
    setError(null);
    try {
      const { data } = await apiClient.post(ENDPOINTS.AUTH.VERIFY_OTP, { phone_number: cleanPhone(phone), otp_code: code }, { skipAuthRedirect: true });
      if (!data?.success || !data.access || !data.refresh || !data.user) throw new Error('format');
      if (data.user.role !== 'admin') {
        setError("Sizda ushbu panelga kirish huquqi yo'q.");
        setCode('');
        return;
      }
      localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, data.access);
      localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, data.refresh);
      localStorage.setItem(STORAGE_KEYS.ADMIN_DATA, JSON.stringify(data.user));
      navigate('/');
    } catch (err) {
      setError(serverMessage(err, "Kod noto'g'ri yoki muddati tugagan."));
      setCode('');
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={sent ? verify : (e) => { e.preventDefault(); void sendCode(); }} className="space-y-5">
      {error && (
        <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertDescription>{error}</AlertDescription></Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="sms-phone">Telefon raqam</Label>
        <div className="relative">
          <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input id="sms-phone" value={phone} onChange={(e) => setPhone(formatUzPhone(e.target.value))} className="pl-9"
            placeholder="+998 (90) 123-45-67" disabled={busy || sent} required />
        </div>
      </div>

      {sent && (
        <div className="space-y-2">
          <Label htmlFor="sms-code">SMS kodi</Label>
          <div className="relative">
            <MessageSquareText className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input id="sms-code" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={code} autoFocus
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} className="pl-9 tracking-[0.4em]" placeholder="••••••" disabled={busy} />
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <button type="button" className="hover:text-foreground" onClick={() => { setSent(false); setCode(''); setError(null); }}>Raqamni o'zgartirish</button>
            <button type="button" className="disabled:opacity-50 enabled:hover:text-foreground" disabled={wait > 0 || busy} onClick={() => void sendCode()}>
              {wait > 0 ? `Qayta yuborish (${wait}s)` : 'Qayta yuborish'}
            </button>
          </div>
        </div>
      )}

      <Button type="submit" disabled={busy || (sent && code.length !== 6)} className="w-full" size="lg">
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : sent ? 'Kirish' : 'SMS kod yuborish'}
      </Button>
    </form>
  );
}
