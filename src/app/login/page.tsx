import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Lock, User, Eye, EyeOff, Loader2, Phone, KeyRound } from 'lucide-react';
import { useAuthStore } from '@/stores/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import api from '@/services/api';

type AuthMode = 'password' | 'otp';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuthStore();

  const [mode, setMode] = useState<AuthMode>('password');
  // password mode
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  // otp mode
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [otpCountdown, setOtpCountdown] = useState(0);
  const [otpRequesting, setOtpRequesting] = useState(false);
  // shared
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (otpCountdown <= 0) return;
    const t = setTimeout(() => setOtpCountdown((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [otpCountdown]);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!username.trim() || !password) {
      setError('请输入用户名和密码');
      return;
    }
    setIsLoading(true);
    try {
      const response = await api.post('/auth/login', { username, password });
      login(response.data.token, {
        id: response.data.user.id,
        username: response.data.user.username,
        name: response.data.user.name,
        role: response.data.user.role,
        avatar: undefined,
      });
      if (rememberMe) {
        localStorage.setItem('remembered-username', username);
      } else {
        localStorage.removeItem('remembered-username');
      }
      navigate('/copilot');
    } catch (err) {
      setError(err instanceof Error ? err.message : '登录失败，请检查用户名和密码');
      setIsLoading(false);
    }
  };

  const handleRequestOtp = async () => {
    setError('');
    if (!/^1[3-9]\d{9}$/.test(phone)) {
      setError('请输入有效的 11 位手机号');
      return;
    }
    setOtpRequesting(true);
    try {
      const res = await api.post('/auth/otp/request', { phone });
      setOtpCountdown(res.data?.data?.expiresInSec ?? 60);
    } catch (err) {
      setError(err instanceof Error ? err.message : '发送验证码失败');
    } finally {
      setOtpRequesting(false);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!/^1[3-9]\d{9}$/.test(phone)) {
      setError('请输入有效的 11 位手机号');
      return;
    }
    if (!/^\d{6}$/.test(code)) {
      setError('请输入 6 位数字验证码');
      return;
    }
    setIsLoading(true);
    try {
      const response = await api.post('/auth/otp/verify', { phone, code });
      login(response.data.token, {
        id: response.data.user.id,
        username: response.data.user.username,
        name: response.data.user.name,
        role: response.data.user.role,
        avatar: undefined,
      });
      navigate('/copilot');
    } catch (err) {
      setError(err instanceof Error ? err.message : '登录失败');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-white to-emerald-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-2xl rounded-2xl">
        <div className="p-8 space-y-8">
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-2xl flex items-center justify-center shadow-lg">
                <ShieldCheck className="w-8 h-8 text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">FinMark AI</h1>
              <p className="text-sm text-slate-500 mt-1">金融智能营销平台</p>
            </div>
          </div>

          <Tabs value={mode} onValueChange={(v) => { setMode(v as AuthMode); setError(''); }}>
            <TabsList className="grid grid-cols-2 w-full">
              <TabsTrigger value="password">
                <Lock className="w-4 h-4 mr-1" />
                密码登录
              </TabsTrigger>
              <TabsTrigger value="otp">
                <Phone className="w-4 h-4 mr-1" />
                短信登录
              </TabsTrigger>
            </TabsList>

            <TabsContent value="password" className="mt-6">
              <form onSubmit={handlePasswordSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-sm font-medium">用户名</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      id="username"
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="请输入用户名"
                      className="pl-10 h-11"
                      disabled={isLoading}
                      autoComplete="username"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium">密码</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="请输入密码"
                      className="pl-10 pr-10 h-11"
                      disabled={isLoading}
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      disabled={isLoading}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="remember"
                      checked={rememberMe}
                      onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                      disabled={isLoading}
                    />
                    <Label htmlFor="remember" className="text-xs text-slate-500 cursor-pointer">记住我</Label>
                  </div>
                  <button
                    type="button"
                    className="text-xs text-indigo-600 hover:text-indigo-700 hover:underline"
                    onClick={() => alert('请联系管理员重置密码')}
                  >
                    忘记密码？
                  </button>
                </div>

                {error && (
                  <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600 text-center">{error}</div>
                )}

                <Button type="submit" disabled={isLoading} className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 rounded-xl">
                  {isLoading ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" />登录中...</>) : '登录'}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="otp" className="mt-6">
              <form onSubmit={handleOtpSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-sm font-medium">手机号</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      id="phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 11))}
                      placeholder="11 位手机号"
                      className="pl-10 h-11"
                      disabled={isLoading}
                      autoComplete="tel"
                      inputMode="numeric"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="code" className="text-sm font-medium">验证码</Label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input
                        id="code"
                        type="text"
                        value={code}
                        onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        placeholder="6 位数字"
                        className="pl-10 h-11"
                        disabled={isLoading}
                        inputMode="numeric"
                        autoComplete="one-time-code"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleRequestOtp}
                      disabled={otpCountdown > 0 || otpRequesting || isLoading}
                      className="h-11 px-4 whitespace-nowrap"
                    >
                      {otpRequesting ? <Loader2 className="w-4 h-4 animate-spin" /> : otpCountdown > 0 ? `${otpCountdown}s` : '获取验证码'}
                    </Button>
                  </div>
                  {import.meta.env.DEV && (
                    <p className="text-[11px] text-slate-400">DEV 模式:验证码会在 data-service 控制台输出</p>
                  )}
                </div>

                {error && (
                  <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600 text-center">{error}</div>
                )}

                <Button type="submit" disabled={isLoading} className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 rounded-xl">
                  {isLoading ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" />登录中...</>) : '登录'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          {import.meta.env.DEV && (
            <div className="pt-4 border-t border-slate-100 text-xs text-slate-400 text-center">
              API: {import.meta.env.VITE_API_BASE_URL || '/api'}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

