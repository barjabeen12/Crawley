import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  AuthContextType,
  LoginRequest,
  RegisterRequest,
} from '../types/auth';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// UI Settings Context
interface UISettingsContextType {
  autoStart: boolean;
  setAutoStart: (value: boolean) => void;
}
const UISettingsContext = createContext<UISettingsContextType | undefined>(undefined);
export const useUISettings = () => {
  const context = useContext(UISettingsContext);
  if (!context) throw new Error('useUISettings must be used within UISettingsProvider');
  return context;
};
export const UISettingsProvider = ({ children }: { children: ReactNode }) => {
  const [autoStart, setAutoStart] = useState(() => {
    const stored = localStorage.getItem('autoStart');
    return stored ? stored === 'true' : true;
  });
  useEffect(() => {
    localStorage.setItem('autoStart', autoStart.toString());
  }, [autoStart]);
  return (
    <UISettingsContext.Provider value={{ autoStart, setAutoStart }}>
      {children}
    </UISettingsContext.Provider>
  );
};

interface AuthProviderProps {
  children: ReactNode;
}

const API_BASE_URL = 'http://localhost:8081/api';

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate(); // navigation hook

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }

    setLoading(false);
  }, []);

  const login = async (credentials: LoginRequest) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: credentials.email,
          password: credentials.password,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Login failed');
      }

      const data = await response.json();
      const user: User = {
        id: data.user.id?.toString(),
        email: data.user.email,
        createdAt: new Date().toISOString(),
        firstName: data.user.firstName,
        lastName: data.user.lastName,
        subscription: data.user.subscription,
      };

      setUser(user);
      setToken(data.token);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('apiKey', data.api_key);

      navigate('/'); 

    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (data: RegisterRequest) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: data.email,
          password: data.password,
          firstName: data.firstName,
          lastName: data.lastName,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Registration failed');
      }

      const responseData = await response.json();
      const user: User = {
        id: responseData.user.id?.toString() ?? responseData.api_key,
        email: responseData.user.email ?? data.email,
        createdAt: new Date().toISOString(),
        firstName: responseData.user.firstName,
        lastName: responseData.user.lastName,
        subscription: responseData.user.subscription,
      };

      setUser(user);
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('apiKey', responseData.api_key);

      navigate('/'); 

    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('apiKey');
    navigate('/'); 
  };

  const value = {
    user,
    token,
    login,
    register,
    logout,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
