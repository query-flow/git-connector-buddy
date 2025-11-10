import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { UserPlus, Trash2, Shield, User, Database, Check, X } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sidebar } from '@/components/Sidebar';

interface Member {
  user_id: string;
  name: string;
  email: string;
  role_in_org: 'admin' | 'member';
  status: 'active' | 'invited' | 'inactive';
}

export default function Admin() {
  const { accessToken, userId, roleInOrg } = useAuth();
  const { toast } = useToast();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteForm, setInviteForm] = useState({
    name: '',
    email: '',
    role_in_org: 'member' as 'admin' | 'member',
  });
  const [inviteToken, setInviteToken] = useState<string | null>(null);
  const [dbConfig, setDbConfig] = useState({
    db_host: '',
    db_port: '3306',
    db_name: '',
    db_user: '',
    db_password: '',
    allowed_schemas: '',
  });
  const [dbLoading, setDbLoading] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle');

  useEffect(() => {
    fetchMembers();
    fetchDbConfig();
  }, []);

  const fetchMembers = async () => {
    try {
      const response = await fetch('/api/members', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setMembers(data.members);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load members',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchDbConfig = async () => {
    try {
      const response = await fetch('/api/org/db-connection', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setDbConfig({
          db_host: data.host || '',
          db_port: String(data.port || '3306'),
          db_name: data.database_name || '',
          db_user: data.username || '',
          db_password: '', // Don't show password
          allowed_schemas: data.allowed_schemas?.join(', ') || '',
        });
      }
    } catch (error) {
      console.error('Failed to load database config:', error);
    }
  };

  const handleDbConfigChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDbConfig(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setConnectionStatus('idle');
  };

  const testConnection = async () => {
    setTestingConnection(true);
    setConnectionStatus('idle');

    try {
      const response = await fetch('/api/org/test-connection', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          host: dbConfig.db_host,
          port: parseInt(dbConfig.db_port),
          database_name: dbConfig.db_name,
          username: dbConfig.db_user,
          password: dbConfig.db_password || undefined,
        }),
      });

      if (response.ok) {
        setConnectionStatus('success');
        toast({
          title: 'Connection successful',
          description: 'Database connection is working',
        });
      } else {
        setConnectionStatus('error');
        const data = await response.json();
        toast({
          title: 'Connection failed',
          description: data.detail || 'Could not connect to database',
          variant: 'destructive',
        });
      }
    } catch (error) {
      setConnectionStatus('error');
      toast({
        title: 'Connection failed',
        description: 'Could not connect to database',
        variant: 'destructive',
      });
    } finally {
      setTestingConnection(false);
    }
  };

  const handleUpdateDbConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setDbLoading(true);

    try {
      const response = await fetch('/api/org/db-connection', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          host: dbConfig.db_host,
          port: parseInt(dbConfig.db_port),
          database_name: dbConfig.db_name,
          username: dbConfig.db_user,
          password: dbConfig.db_password || undefined,
          allowed_schemas: dbConfig.allowed_schemas.split(',').map(s => s.trim()).filter(Boolean),
        }),
      });

      if (response.ok) {
        toast({
          title: 'Database configuration updated',
          description: 'Your database connection has been updated successfully',
        });
        fetchDbConfig();
      } else {
        const data = await response.json();
        toast({
          title: 'Error',
          description: data.detail || 'Failed to update database configuration',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Something went wrong',
        variant: 'destructive',
      });
    } finally {
      setDbLoading(false);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch('/api/members/invite', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(inviteForm),
      });

      const data = await response.json();

      if (response.ok) {
        setInviteToken(data.invite_token);
        fetchMembers();
        toast({
          title: 'Member invited',
          description: `Invitation sent to ${inviteForm.email}`,
        });
        setInviteForm({ name: '', email: '', role_in_org: 'member' });
      } else {
        toast({
          title: 'Error',
          description: data.detail || 'Failed to invite member',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Something went wrong',
        variant: 'destructive',
      });
    }
  };

  const handleUpdateRole = async (memberId: string, newRole: 'admin' | 'member') => {
    try {
      const response = await fetch(`/api/members/${memberId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role_in_org: newRole }),
      });

      if (response.ok) {
        fetchMembers();
        toast({
          title: 'Role updated',
          description: `Member role changed to ${newRole}`,
        });
      } else {
        const data = await response.json();
        toast({
          title: 'Error',
          description: data.detail || 'Failed to update role',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Something went wrong',
        variant: 'destructive',
      });
    }
  };

  const handleRemoveMember = async (memberId: string, memberEmail: string) => {
    if (!confirm(`Remove ${memberEmail} from organization?`)) return;

    try {
      const response = await fetch(`/api/members/${memberId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (response.ok) {
        fetchMembers();
        toast({
          title: 'Member removed',
          description: `${memberEmail} has been removed`,
        });
      } else {
        const data = await response.json();
        toast({
          title: 'Error',
          description: data.detail || 'Failed to remove member',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Something went wrong',
        variant: 'destructive',
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive'> = {
      active: 'default',
      invited: 'secondary',
      inactive: 'destructive',
    };
    return (
      <Badge variant={variants[status] || 'default'}>
        {status}
      </Badge>
    );
  };

  if (roleInOrg !== 'admin') {
    return (
      <div className="flex h-screen">
        <Sidebar />
        <main className="flex-1 p-8">
          <Card>
            <CardContent className="pt-6">
              <p className="text-muted-foreground">Access restricted to administrators</p>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <div className="max-w-6xl mx-auto p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold">Administration</h1>
            <p className="text-muted-foreground mt-2">Manage your organization settings</p>
          </div>

          <Tabs defaultValue="members" className="space-y-6">
            <TabsList>
              <TabsTrigger value="members">Members</TabsTrigger>
              <TabsTrigger value="database">Database</TabsTrigger>
            </TabsList>

            <TabsContent value="members">
              <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Organization Members</CardTitle>
                  <CardDescription>Invite and manage team members</CardDescription>
                </div>
                <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <UserPlus className="mr-2 h-4 w-4" />
                      Invite Member
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Invite New Member</DialogTitle>
                      <DialogDescription>
                        Send an invitation to join your organization
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleInvite}>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="name">Full Name</Label>
                          <Input
                            id="name"
                            value={inviteForm.name}
                            onChange={(e) => setInviteForm({ ...inviteForm, name: e.target.value })}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="email">Email</Label>
                          <Input
                            id="email"
                            type="email"
                            value={inviteForm.email}
                            onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="role">Role</Label>
                          <Select
                            value={inviteForm.role_in_org}
                            onValueChange={(value: 'admin' | 'member') =>
                              setInviteForm({ ...inviteForm, role_in_org: value })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="member">Member</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        {inviteToken && (
                          <div className="space-y-2">
                            <Label>Invite Token</Label>
                            <div className="p-3 bg-muted rounded-md">
                              <p className="text-xs font-mono break-all">{inviteToken}</p>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Share this token with the new member
                            </p>
                          </div>
                        )}
                      </div>
                      <DialogFooter className="mt-6">
                        <Button type="submit">Send Invitation</Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">Loading...</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {members.map((member) => (
                      <TableRow key={member.user_id}>
                        <TableCell className="font-medium">{member.name}</TableCell>
                        <TableCell>{member.email}</TableCell>
                        <TableCell>
                          <Select
                            value={member.role_in_org}
                            onValueChange={(value: 'admin' | 'member') =>
                              handleUpdateRole(member.user_id, value)
                            }
                            disabled={member.user_id === userId}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="member">
                                <div className="flex items-center">
                                  <User className="mr-2 h-4 w-4" />
                                  Member
                                </div>
                              </SelectItem>
                              <SelectItem value="admin">
                                <div className="flex items-center">
                                  <Shield className="mr-2 h-4 w-4" />
                                  Admin
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>{getStatusBadge(member.status)}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveMember(member.user_id, member.email)}
                            disabled={member.user_id === userId}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
            </TabsContent>

            <TabsContent value="database">
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Database className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle>Database Configuration</CardTitle>
                      <CardDescription>Update your organization's database connection</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleUpdateDbConfig} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="db_host">Host</Label>
                        <Input
                          id="db_host"
                          name="db_host"
                          placeholder="localhost"
                          value={dbConfig.db_host}
                          onChange={handleDbConfigChange}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="db_port">Port</Label>
                        <Input
                          id="db_port"
                          name="db_port"
                          type="number"
                          placeholder="3306"
                          value={dbConfig.db_port}
                          onChange={handleDbConfigChange}
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="db_name">Database Name</Label>
                      <Input
                        id="db_name"
                        name="db_name"
                        placeholder="mydatabase"
                        value={dbConfig.db_name}
                        onChange={handleDbConfigChange}
                        required
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="db_user">Database User</Label>
                        <Input
                          id="db_user"
                          name="db_user"
                          placeholder="root"
                          value={dbConfig.db_user}
                          onChange={handleDbConfigChange}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="db_password">Database Password</Label>
                        <Input
                          id="db_password"
                          name="db_password"
                          type="password"
                          placeholder="Leave empty to keep current"
                          value={dbConfig.db_password}
                          onChange={handleDbConfigChange}
                        />
                        <p className="text-xs text-muted-foreground">
                          Leave empty to keep the current password
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="allowed_schemas">Allowed Schemas</Label>
                      <Input
                        id="allowed_schemas"
                        name="allowed_schemas"
                        placeholder="public, sales, analytics"
                        value={dbConfig.allowed_schemas}
                        onChange={handleDbConfigChange}
                      />
                      <p className="text-xs text-muted-foreground">
                        Comma-separated schema names that can be queried
                      </p>
                    </div>

                    <div className="flex items-center gap-3 pt-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={testConnection}
                        disabled={testingConnection}
                      >
                        {testingConnection ? 'Testing...' : 'Test Connection'}
                      </Button>
                      {connectionStatus === 'success' && (
                        <div className="flex items-center gap-2 text-sm text-green-600">
                          <Check className="h-4 w-4" />
                          <span>Connection successful</span>
                        </div>
                      )}
                      {connectionStatus === 'error' && (
                        <div className="flex items-center gap-2 text-sm text-destructive">
                          <X className="h-4 w-4" />
                          <span>Connection failed</span>
                        </div>
                      )}
                    </div>

                    <div className="flex justify-end pt-4 border-t">
                      <Button type="submit" disabled={dbLoading}>
                        {dbLoading ? 'Updating...' : 'Update Configuration'}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
