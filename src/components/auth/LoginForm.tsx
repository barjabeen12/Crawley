
import React, { useState } from 'react';
import { Eye, EyeOff, LogIn, TestTube } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface LoginFormProps {
  onSwitchToRegister: () => void;
}

export const LoginForm = ({ onSwitchToRegister }: LoginFormProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { login, loading } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login({ email, password });
    } catch (error) {
      // Error is handled in the context
    }
  };

  const handleTestLogin = () => {
    setEmail('test@crawlx.com');
    setPassword('test123');
  };

  return (
    <div className="w-full max-w-md space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
          Welcome to CrawlX
        </h2>
        <p className="text-muted-foreground mt-2">Sign in to your account</p>
      </div>

      {/* Test Credentials Banner */}
      <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 backdrop-blur-sm rounded-xl p-4 border border-blue-500/20">
        <div className="flex items-center gap-2 mb-2">
          <TestTube className="w-4 h-4 text-blue-400" />
          <span className="text-sm font-medium text-blue-400">Test Credentials</span>
        </div>
        <p className="text-xs text-slate-500 mb-3">Use these credentials to test the application:</p>
        <div className="space-y-1 text-xs">
          <div className="flex justify-between">
            <span className="text-slate-400">Email:</span>
            <span className="text-white font-mono">test@crawlx.com</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Password:</span>
            <span className="text-white font-mono">test123</span>
          </div>
        </div>
        <button
          type="button"
          onClick={handleTestLogin}
          className="mt-3 w-full text-xs bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg py-2 transition-colors"
        >
          Fill Test Credentials
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-2">
            Email Address
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border bg-background/50 backdrop-blur-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 border-border hover:border-blue-500/50"
            placeholder="Enter your email"
            required
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium mb-2">
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 pr-12 rounded-xl border bg-background/50 backdrop-blur-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 border-border hover:border-blue-500/50"
              placeholder="Enter your password"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl font-medium transition-all duration-200 hover:from-blue-600 hover:to-purple-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
        >
          {loading ? (
            "Signing in..."
          ) : (
            <>
              <LogIn className="w-5 h-5" />
              Sign In
            </>
          )}
        </button>
      </form>

      <div className="text-center">
        <p className="text-muted-foreground">
          Don't have an account?{' '}
          <button
            onClick={onSwitchToRegister}
            className="text-blue-400 hover:text-blue-300 font-medium"
          >
            Sign up
          </button>
        </p>
      </div>
    </div>
  );
};
