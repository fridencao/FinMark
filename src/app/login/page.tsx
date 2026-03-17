import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Lock, User, Eye, EyeOff, Loader2, CheckCircle } from 'lucide-react';
import { useAuthStore } from '@/stores/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card } from '@/components/ui/card';

// Mock 测试账号
const MOCK_USERS = [
  { username: 'admin', password: 'admin123', name: '管理员', role: 'admin' },
  { username: 'manager1', password: 'manager123', name: '李四', role: 'manager' },
  { username: 'operator1', password: 'operator123', name: '王五', role: 'operator' },
];

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuthStore();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username.trim() || !password) {
      setError('请输入用户名和密码');
      return;
    }

    setIsLoading(true);

    // 模拟 API 调用延迟
    await new Promise(resolve => setTimeout(resolve, 1000));

    // 验证 Mock 用户
    const mockUser = MOCK_USERS.find(u => u.username === username && u.password === password);

    if (mockUser) {
      // 登录成功
      const token = 'mock-jwt-token-' + Date.now();
      login(token, {
        id: '1',
        username: mockUser.username,
        name: mockUser.name,
        role: mockUser.role,
        avatar: undefined,
      });

      if (rememberMe) {
        localStorage.setItem('remembered-username', username);
      } else {
        localStorage.removeItem('remembered-username');
      }

      navigate('/copilot');
    } else {
      setError('用户名或密码错误');
      setIsLoading(false);
    }
  };

  // 填充测试账号
  const fillTestAccount = (username: string, password: string) => {
    setUsername(username);
    setPassword(password);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-white to-emerald-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-2xl rounded-2xl">
        <div className="p-8 space-y-8">
          {/* Logo & Title */}
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

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Username */}
            <div className="space-y-2">
              <Label htmlFor="username" className="text-sm font-medium">
                用户名
              </Label>
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
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">
                密码
              </Label>
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

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="remember"
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                  disabled={isLoading}
                />
                <Label htmlFor="remember" className="text-xs text-slate-500 cursor-pointer">
                  记住我
                </Label>
              </div>
              <button
                type="button"
                className="text-xs text-indigo-600 hover:text-indigo-700 hover:underline"
                onClick={() => alert('请联系管理员重置密码')}
              >
                忘记密码？
              </button>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600 text-center">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 rounded-xl"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  登录中...
                </>
              ) : (
                '登录'
              )}
            </Button>
          </form>

          {/* Test Accounts */}
          <div className="pt-6 border-t border-slate-100">
            <p className="text-xs font-medium text-slate-400 mb-3 text-center">测试账号（点击填充）</p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { role: '管理员', username: 'admin', password: 'admin123' },
                { role: '业务经理', username: 'manager1', password: 'manager123' },
                { role: '运营人员', username: 'operator1', password: 'operator123' },
              ].map((account) => (
                <button
                  key={account.username}
                  type="button"
                  onClick={() => fillTestAccount(account.username, account.password)}
                  className="p-2 text-xs bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 rounded-xl transition-colors text-center"
                >
                  <div className="font-medium text-slate-700">{account.role}</div>
                  <div className="text-slate-400 text-[10px] mt-0.5">{account.username}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
