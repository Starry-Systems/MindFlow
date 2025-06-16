
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import Header from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, FileText, Brain } from "lucide-react";
import type { Mindmap } from "@shared/schema";

async function fetchMindmaps(): Promise<Mindmap[]> {
  const response = await fetch('/api/mindmaps', {
    credentials: 'include'
  });
  if (!response.ok) {
    throw new Error('Failed to fetch mindmaps');
  }
  return response.json();
}

async function createMindmap(title: string): Promise<Mindmap> {
  const response = await fetch('/api/mindmaps', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    credentials: 'include',
    body: JSON.stringify({
      title,
      data: { nodes: [], connections: [] }
    })
  });
  if (!response.ok) {
    throw new Error('Failed to create mindmap');
  }
  return response.json();
}

async function deleteMindmap(id: string): Promise<void> {
  const response = await fetch(`/api/mindmaps/${id}`, {
    method: 'DELETE',
    credentials: 'include'
  });
  if (!response.ok) {
    throw new Error('Failed to delete mindmap');
  }
}

export default function MindmapsPage() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newMindmapTitle, setNewMindmapTitle] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: mindmaps = [], isLoading } = useQuery({
    queryKey: ['mindmaps'],
    queryFn: fetchMindmaps
  });

  const createMutation = useMutation({
    mutationFn: createMindmap,
    onSuccess: (mindmap) => {
      queryClient.invalidateQueries({ queryKey: ['mindmaps'] });
      setIsCreateDialogOpen(false);
      setNewMindmapTitle("");
      navigate(`/mindmap/${mindmap.id}`);
      toast({
        title: "Mindmap created",
        description: "Your new mindmap has been created successfully."
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create mindmap. Please try again.",
        variant: "destructive"
      });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: deleteMindmap,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mindmaps'] });
      toast({
        title: "Mindmap deleted",
        description: "The mindmap has been deleted successfully."
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete mindmap. Please try again.",
        variant: "destructive"
      });
    }
  });

  const handleCreateMindmap = () => {
    if (newMindmapTitle.trim()) {
      createMutation.mutate(newMindmapTitle.trim());
    }
  };

  const handleDeleteMindmap = (id: string, title: string) => {
    if (confirm(`Are you sure you want to delete "${title}"?`)) {
      deleteMutation.mutate(id);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Brain className="h-8 w-8 text-blue-600" />
              My Mindmaps
            </h1>
            <p className="text-gray-600 mt-2">
              Create and manage your visual thinking projects
            </p>
          </div>
          
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                New Mindmap
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Mindmap</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={newMindmapTitle}
                    onChange={(e) => setNewMindmapTitle(e.target.value)}
                    placeholder="Enter mindmap title"
                    onKeyPress={(e) => e.key === 'Enter' && handleCreateMindmap()}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleCreateMindmap}
                    disabled={!newMindmapTitle.trim() || createMutation.isPending}
                  >
                    {createMutation.isPending ? "Creating..." : "Create"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : mindmaps.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No mindmaps yet</h3>
            <p className="text-gray-600 mb-6">
              Create your first mindmap to start visualizing your ideas
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Create Your First Mindmap
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mindmaps.map((mindmap) => (
              <Card key={mindmap.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="truncate">{mindmap.title}</span>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/mindmap/${mindmap.id}`);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteMindmap(mindmap.id, mindmap.title);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardTitle>
                  <CardDescription>
                    Created {formatDate(mindmap.createdAt)}
                    {mindmap.updatedAt !== mindmap.createdAt && (
                      <br />
                      <span>Updated {formatDate(mindmap.updatedAt)}</span>
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent onClick={() => navigate(`/mindmap/${mindmap.id}`)}>
                  <div className="text-sm text-gray-600">
                    {mindmap.data.nodes?.length || 0} nodes, {mindmap.data.connections?.length || 0} connections
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
