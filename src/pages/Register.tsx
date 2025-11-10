import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Database, User } from 'lucide-react';
import DatabaseConfigWizard from '@/components/DatabaseConfigWizard';

type Phase = 'userInfo' | 'databaseConfig';

export default function Register() {
  const [phase, setPhase] = useState<Phase>('userInfo');
  const [userFormData, setUserFormData] = useState({
    name: '',
    email: '',
    password: '',
    org_name: '',
  });

  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleUserFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUserFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleUserFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate user data
    if (!userFormData.name || !userFormData.email || !userFormData.password || !userFormData.org_name) {
      toast({
        title: 'Missing information',
        description: 'Please fill in all fields',
        variant: 'destructive',
      });
      return;
    }

    if (userFormData.password.length < 8) {
      toast({
        title: 'Password too short',
        description: 'Password must be at least 8 characters',
        variant: 'destructive',
      });
      return;
    }

    // Move to database configuration phase
    setPhase('databaseConfig');
  };

  const handleDatabaseConfigComplete = async (config: {
    db_host: string;
    db_port: number;
    db_name: string;
    db_user: string;
    db_password: string;
    allowed_schemas: string[];
  }) => {
    setLoading(true);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...userFormData,
          ...config,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        await login(data);
        navigate('/chat');
        toast({
          title: 'Account created',
          description: 'Welcome to QueryFlow!',
        });
      } else {
        toast({
          title: 'Registration failed',
          description: data.detail || 'Please try again',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Something went wrong. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 py-12">
      <Card className="w-full max-w-2xl">
        <CardHeader className="space-y-4 text-center">
          <div className="flex justify-center">
            <div className="h-12 w-12 rounded-lg bg-primary flex items-center justify-center">
              {phase === 'userInfo' ? (
                <User className="h-6 w-6 text-primary-foreground" />
              ) : (
                <Database className="h-6 w-6 text-primary-foreground" />
              )}
            </div>
          </div>
          <div>
            <CardTitle className="text-2xl">
              {phase === 'userInfo' ? 'Create your account' : 'Configure Database'}
            </CardTitle>
            <CardDescription>
              {phase === 'userInfo'
                ? 'Set up your organization details'
                : 'Connect to your MySQL database'}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {phase === 'userInfo' ? (
            <form onSubmit={handleUserFormSubmit} className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-sm font-semibold">Administrator Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      name="name"
                      placeholder="John Doe"
                      value={userFormData.name}
                      onChange={handleUserFormChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="john@company.com"
                      value={userFormData.email}
                      onChange={handleUserFormChange}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="Min. 8 characters"
                    value={userFormData.password}
                    onChange={handleUserFormChange}
                    minLength={8}
                    required
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-semibold">Organization</h3>
                <div className="space-y-2">
                  <Label htmlFor="org_name">Organization Name</Label>
                  <Input
                    id="org_name"
                    name="org_name"
                    placeholder="My Company"
                    value={userFormData.org_name}
                    onChange={handleUserFormChange}
                    required
                  />
                </div>
              </div>

              <Button type="submit" className="w-full">
                Continue to Database Configuration →
              </Button>
            </form>
          ) : (
            <div className="space-y-4">
              {loading ? (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  <p className="mt-4 text-sm text-muted-foreground">Creating your account...</p>
                </div>
              ) : (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setPhase('userInfo')}
                    className="mb-4"
                  >
                    ← Back to Account Details
                  </Button>

                  <DatabaseConfigWizard onComplete={handleDatabaseConfigComplete} />
                </>
              )}
            </div>
          )}

          {phase === 'userInfo' && (
            <div className="mt-4 text-center text-sm">
              <span className="text-muted-foreground">Already have an account? </span>
              <Link to="/login" className="text-primary hover:underline">
                Sign in
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
