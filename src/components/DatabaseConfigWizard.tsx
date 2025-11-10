import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle2, XCircle, Database, Server, Table } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type Step = 1 | 2 | 3;
type ConnectionStatus = 'idle' | 'testing' | 'success' | 'failed';

interface ConnectionData {
  host: string;
  port: number;
  username: string;
  password: string;
}

interface DatabaseConfigWizardProps {
  onComplete: (config: {
    db_host: string;
    db_port: number;
    db_name: string;
    db_user: string;
    db_password: string;
    allowed_schemas: string[];
  }) => void;
}

export default function DatabaseConfigWizard({ onComplete }: DatabaseConfigWizardProps) {
  const [step, setStep] = useState<Step>(1);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('idle');
  const [connectionData, setConnectionData] = useState<ConnectionData>({
    host: '127.0.0.1',
    port: 3306,
    username: '',
    password: ''
  });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [databases, setDatabases] = useState<string[]>([]);
  const [selectedDatabase, setSelectedDatabase] = useState<string | null>(null);
  const [schemas, setSchemas] = useState<string[]>([]);
  const [selectedSchemas, setSelectedSchemas] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleTestConnection = async () => {
    setConnectionStatus('testing');
    setErrorMessage(null);

    try {
      const response = await fetch('/api/database/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          host: connectionData.host,
          port: connectionData.port,
          username: connectionData.username,
          password: connectionData.password,
          database_name: 'mysql'
        }),
      });

      const data = await response.json();

      if (response.ok && data.status === 'connected') {
        setConnectionStatus('success');
        toast({
          title: 'Connection successful',
          description: data.message,
        });
      } else {
        setConnectionStatus('failed');
        const message = data.detail?.message || data.message || 'Connection failed';
        setErrorMessage(message);
      }
    } catch (error) {
      setConnectionStatus('failed');
      setErrorMessage('Failed to connect to server. Please check your network.');
    }
  };

  const handleNextToStep2 = async () => {
    setLoading(true);
    setErrorMessage(null);

    try {
      const response = await fetch('/api/database/list-databases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(connectionData),
      });

      const data = await response.json();

      if (response.ok) {
        setDatabases(data.databases);
        setStep(2);
      } else {
        setErrorMessage('Failed to list databases');
        toast({
          title: 'Error',
          description: 'Could not list databases',
          variant: 'destructive',
        });
      }
    } catch (error) {
      setErrorMessage('Error listing databases');
      toast({
        title: 'Error',
        description: 'Something went wrong',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleNextToStep3 = async () => {
    setLoading(true);
    setErrorMessage(null);

    try {
      const response = await fetch('/api/database/list-schemas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...connectionData,
          database_name: selectedDatabase
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSchemas(data.schemas);
        setStep(3);
      } else {
        setErrorMessage('Failed to list schemas');
        toast({
          title: 'Error',
          description: 'Could not list schemas',
          variant: 'destructive',
        });
      }
    } catch (error) {
      setErrorMessage('Error listing schemas');
      toast({
        title: 'Error',
        description: 'Something went wrong',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = () => {
    const config = {
      db_host: connectionData.host,
      db_port: connectionData.port,
      db_name: selectedDatabase!,
      db_user: connectionData.username,
      db_password: connectionData.password,
      allowed_schemas: selectedSchemas
    };

    onComplete(config);
  };

  const getStepIcon = (stepNumber: number) => {
    if (stepNumber === 1) return <Server className="h-5 w-5" />;
    if (stepNumber === 2) return <Database className="h-5 w-5" />;
    return <Table className="h-5 w-5" />;
  };

  return (
    <div className="space-y-6">
      {/* Progress Indicator */}
      <div className="flex items-center justify-between mb-6">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center">
            <div
              className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                s === step
                  ? 'border-primary bg-primary text-primary-foreground'
                  : s < step
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-muted-foreground/20 bg-muted text-muted-foreground'
              }`}
            >
              {s < step ? '✓' : s}
            </div>
            {s < 3 && (
              <div
                className={`w-16 h-0.5 ${
                  s < step ? 'bg-primary' : 'bg-muted'
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step Content */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {getStepIcon(step)}
          <span>
            {step === 1 && 'Step 1 of 3: Connect to MySQL Server'}
            {step === 2 && 'Step 2 of 3: Choose Database'}
            {step === 3 && 'Step 3 of 3: Select Tables'}
          </span>
        </div>

        {step === 1 && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="host">Server</Label>
                <Input
                  id="host"
                  value={connectionData.host}
                  onChange={(e) => setConnectionData({...connectionData, host: e.target.value})}
                  placeholder="127.0.0.1"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="port">Port</Label>
                <Input
                  id="port"
                  type="number"
                  value={connectionData.port}
                  onChange={(e) => setConnectionData({...connectionData, port: parseInt(e.target.value)})}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="username">User</Label>
              <Input
                id="username"
                value={connectionData.username}
                onChange={(e) => setConnectionData({...connectionData, username: e.target.value})}
                placeholder="root"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={connectionData.password}
                onChange={(e) => setConnectionData({...connectionData, password: e.target.value})}
                placeholder="••••••••"
              />
            </div>

            <Button
              onClick={handleTestConnection}
              disabled={connectionStatus === 'testing' || !connectionData.username}
              className="w-full"
              variant={connectionStatus === 'success' ? 'secondary' : 'default'}
            >
              {connectionStatus === 'testing' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {connectionStatus === 'success' && <CheckCircle2 className="mr-2 h-4 w-4" />}
              {connectionStatus === 'testing' ? 'Testing Connection...' : 'Test Connection'}
            </Button>

            {connectionStatus === 'success' && (
              <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800 dark:text-green-200">
                  Connection established successfully!
                </AlertDescription>
              </Alert>
            )}

            {connectionStatus === 'failed' && errorMessage && (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertDescription>{errorMessage}</AlertDescription>
              </Alert>
            )}

            <div className="flex justify-end">
              <Button
                onClick={handleNextToStep2}
                disabled={connectionStatus !== 'success' || loading}
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Next: Choose Database →
              </Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Which database would you like to use?
            </p>

            {databases.length > 0 ? (
              <RadioGroup value={selectedDatabase || ''} onValueChange={setSelectedDatabase}>
                <div className="space-y-2">
                  {databases.map((db) => (
                    <div key={db} className="flex items-center space-x-2 border rounded-lg p-3 hover:bg-accent cursor-pointer">
                      <RadioGroupItem value={db} id={db} />
                      <Label htmlFor={db} className="flex-1 cursor-pointer">
                        {db}
                      </Label>
                    </div>
                  ))}
                </div>
              </RadioGroup>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                Loading databases...
              </div>
            )}

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(1)}>
                ← Back
              </Button>
              <Button
                onClick={handleNextToStep3}
                disabled={!selectedDatabase || loading}
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Next: Select Tables →
              </Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">
                Which tables can the system access?
              </p>
              <p className="text-xs text-muted-foreground">
                Database: <strong>{selectedDatabase}</strong>
              </p>
            </div>

            {schemas.length > 0 ? (
              <>
                <div className="space-y-2 max-h-60 overflow-y-auto border rounded-lg p-3">
                  {schemas.map((schema) => (
                    <div key={schema} className="flex items-center space-x-2">
                      <Checkbox
                        id={schema}
                        checked={selectedSchemas.includes(schema)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedSchemas([...selectedSchemas, schema]);
                          } else {
                            setSelectedSchemas(selectedSchemas.filter(s => s !== schema));
                          }
                        }}
                      />
                      <Label htmlFor={schema} className="flex-1 cursor-pointer">
                        {schema}
                      </Label>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedSchemas(schemas)}
                  >
                    Select All
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedSchemas([])}
                  >
                    Deselect All
                  </Button>
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                Loading tables...
              </div>
            )}

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(2)}>
                ← Back
              </Button>
              <Button
                onClick={handleComplete}
                disabled={selectedSchemas.length === 0}
              >
                Complete Configuration ✓
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
