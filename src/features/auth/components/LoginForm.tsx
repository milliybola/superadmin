import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Phone, AlertCircle, Eye, EyeOff, ShieldCheck, Loader2 } from 'lucide-react';
import apiClient from '../../../core/api/client';
import { ENDPOINTS, STORAGE_KEYS } from '../../../core/config/constants';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import SmsLoginForm from './SmsLoginForm';

const LoginForm: React.FC = () => {
  const [mode, setMode] = useState<'password' | 'sms'>('password');
  const [phone, setPhone] = useState('+998');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();

  // Simple formatting for Uzbek phone numbers: +998 (XX) XXX-XX-XX
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value;
    if (!val.startsWith('+998')) {
      val = '+998';
    }
    const numbersOnly = val.substring(4).replace(/\D/g, '');
    const truncated = numbersOnly.substring(0, 9);

    let formatted = '+998';
    if (truncated.length > 0) {
      formatted += ' (' + truncated.substring(0, 2);
    }
    if (truncated.length > 2) {
      formatted += ') ' + truncated.substring(2, 5);
    }
    if (truncated.length > 5) {
      formatted += '-' + truncated.substring(5, 7);
    }
    if (truncated.length > 7) {
      formatted += '-' + truncated.substring(7, 9);
    }

    setPhone(formatted);
  };

  const cleanPhoneNumber = (formattedPhone: string) => {
    return formattedPhone.replace(/[^\d+]/g, '');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const rawPhone = cleanPhoneNumber(phone);
    if (rawPhone.length !== 13) {
      setError("Telefon raqami noto'g'ri shakllantirilgan. Misol: +998 (90) 123-45-67");
      setLoading(false);
      return;
    }

    if (password.length < 4) {
      setError("Parol kamida 4 ta belgidan iborat bo'lishi kerak");
      setLoading(false);
      return;
    }

    try {
      const loginResponse = await apiClient.post(ENDPOINTS.AUTH.LOGIN, {
        phone_number: rawPhone,
        password: password,
      });

      const { success, access, refresh, user } = loginResponse.data;

      if (!success || !access || !refresh || !user) {
        throw new Error("Login javobi kutilgan formatda emas.");
      }

      // /auth/user/login/ is a generic endpoint shared by all account types —
      // the API itself doesn't restrict who can call it, so the panel must
      // reject non-admin accounts on its own after authentication succeeds.
      if (user.role !== 'admin') {
        setError("Sizda ushbu panelga kirish huquqi yo'q.");
        setPassword('');
        setLoading(false);
        return;
      }

      localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, access);
      localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refresh);
      localStorage.setItem(STORAGE_KEYS.ADMIN_DATA, JSON.stringify(user));

      setLoading(false);
      navigate('/');
    } catch (err: any) {
      console.error(err);
      setError(
        err.response?.data?.message ||
        err.response?.data?.detail ||
        "Tizimga kirishda xatolik yuz berdi. Iltimos parolni yoki telefon raqamini tekshiring."
      );
      setPassword('');
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md shadow-2xl">
      <CardHeader className="items-center text-center">
        <div className="mb-2 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/20">
          <ShieldCheck className="h-7 w-7 text-primary" />
        </div>
        <CardTitle className="text-2xl">Superadmin</CardTitle>
        <CardDescription>Boshqaruv paneliga xush kelibsiz</CardDescription>
      </CardHeader>
      <CardContent>
        {mode === 'sms' ? <SmsLoginForm /> : (
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="phone">Telefon raqam</Label>
            <div className="relative">
              <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="phone"
                type="text"
                value={phone}
                onChange={handlePhoneChange}
                className="pl-9"
                placeholder="+998 (90) 123-45-67"
                disabled={loading}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Parol</Label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-9 pr-9"
                placeholder="••••••••"
                disabled={loading}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition cursor-pointer"
                disabled={loading}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <Button type="submit" disabled={loading} className="w-full" size="lg">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Kirish'}
          </Button>
        </form>
        )}
        <button type="button" onClick={() => setMode(mode === 'sms' ? 'password' : 'sms')}
          className="mt-4 w-full text-center text-sm text-muted-foreground transition hover:text-foreground">
          {mode === 'sms' ? 'Parol bilan kirish' : 'SMS kod bilan kirish'}
        </button>
      </CardContent>
    </Card>
  );
};

export default LoginForm;
