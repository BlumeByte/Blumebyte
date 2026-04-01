import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { AlertCircle, Github } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';

export function GitHubSyncInfo() {
  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Github className="size-5" />
          <CardTitle>GitHub Integration</CardTitle>
        </div>
        <CardDescription>
          Sync your code with GitHub repository
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Feature Not Available</AlertTitle>
          <AlertDescription>
            Automated GitHub sync is not currently supported in Figma Make. This feature would require:
            <ul className="list-disc ml-5 mt-2 space-y-1">
              <li>GitHub API authentication</li>
              <li>Repository access credentials</li>
              <li>Clone/pull mechanisms</li>
              <li>Code merge capabilities</li>
            </ul>
          </AlertDescription>
        </Alert>

        <div className="border-t pt-4">
          <h3 className="font-semibold mb-2">Manual Workflow</h3>
          <p className="text-sm text-muted-foreground mb-3">
            To sync your code with GitHub, follow these steps:
          </p>
          <ol className="list-decimal ml-5 space-y-2 text-sm">
            <li>Export your code from Figma Make</li>
            <li>Initialize a Git repository in your local project</li>
            <li>
              <code className="text-xs bg-muted px-2 py-1 rounded">git init</code>
            </li>
            <li>Add your remote repository</li>
            <li>
              <code className="text-xs bg-muted px-2 py-1 rounded">
                git remote add origin [your-repo-url]
              </code>
            </li>
            <li>Commit and push your changes</li>
            <li>
              <code className="text-xs bg-muted px-2 py-1 rounded">
                git add . && git commit -m "Update" && git push
              </code>
            </li>
          </ol>
        </div>

        <div className="border-t pt-4">
          <h3 className="font-semibold mb-2">Alternative: Use GitHub Codespaces</h3>
          <p className="text-sm text-muted-foreground">
            Consider using GitHub Codespaces or similar cloud IDE that provides native Git integration 
            for a seamless development experience with version control.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
