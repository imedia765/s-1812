import { useState, useEffect } from 'react';
import { GitBranch, AlertCircle, Plus } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { GitOperationProgress } from './git/GitOperationProgress';
import { GitOperationLogs } from './git/GitOperationLogs';
import { QuickPushButton } from './git/QuickPushButton';
import { AddRepositoryDialog } from './git/AddRepositoryDialog';

interface Repository {
  id: string;
  repo_url: string;
  branch: string;
}

const GitOperationsCard = () => {
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [logs, setLogs] = useState([]);
  const [currentOperation, setCurrentOperation] = useState('');
  const [progress, setProgress] = useState(0);
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<string>('');
  const [showAddRepo, setShowAddRepo] = useState(false);

  useEffect(() => {
    fetchLogs();
    fetchRepositories();
  }, []);

  const fetchRepositories = async () => {
    try {
      const { data, error } = await supabase
        .from('git_repository_configs')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRepositories(data || []);
      if (data && data.length > 0) {
        setSelectedRepo(data[0].id);
      }
    } catch (error) {
      console.error('Error fetching repositories:', error);
      toast({
        title: "Error",
        description: "Failed to fetch repositories",
        variant: "destructive",
      });
    }
  };

  const fetchLogs = async () => {
    try {
      console.log('Fetching git operation logs...');
      const { data, error } = await supabase
        .from('git_operations_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      console.log('Fetched logs:', data);
      setLogs(data || []);
    } catch (error) {
      console.error('Error fetching logs:', error);
      toast({
        title: "Error",
        description: "Failed to fetch operation logs",
        variant: "destructive",
      });
    }
  };

  const handlePushToRepo = async () => {
    if (isProcessing || !selectedRepo) return;
    
    try {
      setIsProcessing(true);
      setProgress(10);
      setCurrentOperation('Initializing git operation...');
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No active session');
      }

      setProgress(30);
      setCurrentOperation('Authenticating with GitHub...');

      setProgress(50);
      setCurrentOperation('Preparing to push changes...');

      const { data, error } = await supabase.functions.invoke('git-custom-repo', {
        body: {
          repoId: selectedRepo,
          commitMessage: 'Force commit: Pushing all files'
        }
      });

      if (error) throw error;

      console.log('Push operation response:', data);
      setProgress(100);
      
      toast({
        title: "Success",
        description: "Successfully pushed changes to repository",
      });

    } catch (error: any) {
      console.error('Push error:', error);
      
      toast({
        title: "Push Failed",
        description: error.message || "Failed to push changes. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
      setCurrentOperation('');
      setProgress(0);
      await fetchLogs();
    }
  };

  return (
    <Card className="bg-dashboard-card border-white/10">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GitBranch className="w-5 h-5 text-dashboard-accent1" />
            <CardTitle className="text-xl text-white">Git Operations</CardTitle>
          </div>
          <Button
            onClick={() => setShowAddRepo(true)}
            variant="outline"
            size="sm"
            className="gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Repository
          </Button>
        </div>
        <CardDescription className="text-dashboard-muted">
          Manage Git operations and repository synchronization
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert className="bg-dashboard-card/50 border-dashboard-accent1/20">
          <AlertCircle className="h-4 w-4 text-dashboard-accent1" />
          <AlertTitle className="text-dashboard-accent1">Important</AlertTitle>
          <AlertDescription className="text-dashboard-muted">
            Using stored GitHub token from Supabase secrets. Make sure it's configured in the Edge Functions settings.
          </AlertDescription>
        </Alert>

        <QuickPushButton isProcessing={isProcessing} />

        <div className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="repository">Custom Repository</Label>
            <select
              id="repository"
              value={selectedRepo}
              onChange={(e) => setSelectedRepo(e.target.value)}
              className="w-full p-2 rounded-md bg-dashboard-card border border-white/10 text-white"
            >
              {repositories.map((repo) => (
                <option key={repo.id} value={repo.id}>
                  {repo.repo_url} ({repo.branch})
                </option>
              ))}
            </select>
          </div>
        </div>

        {isProcessing && (
          <GitOperationProgress 
            currentOperation={currentOperation}
            progress={progress}
          />
        )}

        <Button
          onClick={handlePushToRepo}
          disabled={isProcessing || !selectedRepo}
          className="w-full bg-dashboard-accent1 hover:bg-dashboard-accent1/80"
        >
          Push to Selected Repository
        </Button>

        <GitOperationLogs logs={logs} />

        <AddRepositoryDialog
          showAddRepo={showAddRepo}
          setShowAddRepo={setShowAddRepo}
          onRepositoryAdded={fetchRepositories}
        />
      </CardContent>
    </Card>
  );
};

export default GitOperationsCard;