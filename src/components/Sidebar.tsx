import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { MessageSquare, FileText, Settings, LogOut, Database } from 'lucide-react';
import { cn } from '@/lib/utils';

export const Sidebar = () => {
  const location = useLocation();
  const { logout, roleInOrg } = useAuth();

  const navItems = [
    { to: '/chat', icon: MessageSquare, label: 'Quick Chat' },
    { to: '/conversations', icon: MessageSquare, label: 'Conversations' },
    { to: '/documents', icon: FileText, label: 'Documents' },
  ];

  if (roleInOrg === 'admin') {
    navItems.push({ to: '/admin', icon: Settings, label: 'Admin' });
  }

  return (
    <aside className="w-64 border-r border-border bg-card flex flex-col">
      <div className="h-16 border-b border-border flex items-center px-6">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
            <Database className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-semibold">QueryFlow</span>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.to;
          
          return (
            <Link key={item.to} to={item.to}>
              <Button
                variant="ghost"
                className={cn(
                  'w-full justify-start',
                  isActive && 'bg-accent text-accent-foreground'
                )}
              >
                <Icon className="h-4 w-4 mr-2" />
                {item.label}
              </Button>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-border">
        <Button
          variant="ghost"
          className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={logout}
        >
          <LogOut className="h-4 w-4 mr-2" />
          Logout
        </Button>
      </div>
    </aside>
  );
};