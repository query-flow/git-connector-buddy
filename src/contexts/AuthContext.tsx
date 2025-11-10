import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  userId: string | null;
  userName: string | null;
  orgId: string | null;
  orgName: string | null;
  roleInOrg: 'admin' | 'member' | null;
  isAuthenticated: boolean;
}

interface AuthContextType extends AuthState {
  login: (tokens: { access_token: string; refresh_token: string; user_id: string; email: string }) => Promise<void>;
  logout: () => void;
  refreshAccessToken: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const navigate = useNavigate();
  const [authState, setAuthState] = useState<AuthState>({
    accessToken: localStorage.getItem('access_token'),
    refreshToken: localStorage.getItem('refresh_token'),
    userId: localStorage.getItem('user_id'),
    userName: localStorage.getItem('user_name'),
    orgId: localStorage.getItem('org_id'),
    orgName: localStorage.getItem('org_name'),
    roleInOrg: localStorage.getItem('role_in_org') as 'admin' | 'member' | null,
    isAuthenticated: !!localStorage.getItem('access_token'),
  });

  const fetchUserDetails = async (accessToken: string, userId: string) => {
    try {
      const response = await fetch('/api/members', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const currentUser = data.members.find((m: any) => m.user_id === userId);
        
        if (currentUser) {
          localStorage.setItem('user_name', currentUser.name);
          localStorage.setItem('role_in_org', currentUser.role_in_org);
        }
        
        localStorage.setItem('org_id', data.org_id);
        localStorage.setItem('org_name', data.org_name);

        setAuthState(prev => ({
          ...prev,
          userName: currentUser?.name || null,
          roleInOrg: currentUser?.role_in_org || null,
          orgId: data.org_id,
          orgName: data.org_name,
        }));
      }
    } catch (error) {
      console.error('Failed to fetch user details:', error);
    }
  };

  const login = async (tokens: { access_token: string; refresh_token: string; user_id: string; email: string }) => {
    localStorage.setItem('access_token', tokens.access_token);
    localStorage.setItem('refresh_token', tokens.refresh_token);
    localStorage.setItem('user_id', tokens.user_id);

    setAuthState(prev => ({
      ...prev,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      userId: tokens.user_id,
      isAuthenticated: true,
    }));

    await fetchUserDetails(tokens.access_token, tokens.user_id);
  };

  const logout = () => {
    localStorage.clear();
    setAuthState({
      accessToken: null,
      refreshToken: null,
      userId: null,
      userName: null,
      orgId: null,
      orgName: null,
      roleInOrg: null,
      isAuthenticated: false,
    });
    navigate('/login');
  };

  const refreshAccessToken = async (): Promise<boolean> => {
    const refreshToken = authState.refreshToken;
    if (!refreshToken) return false;

    try {
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('access_token', data.access_token);
        setAuthState(prev => ({ ...prev, accessToken: data.access_token }));
        return true;
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
    }

    logout();
    return false;
  };

  return (
    <AuthContext.Provider value={{ ...authState, login, logout, refreshAccessToken }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};