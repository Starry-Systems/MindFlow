
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, FileText } from "lucide-react";
import type { Mindmap } from "@shared/schema";

interface MindmapListProps {
  mindmaps: Mindmap[];
  onMindmapSelect: (mindmap: Mindmap) => void;
  onMindmapCreate: (name: string) => void;
  onMindmapDelete: (id: string) => void;
  onClose: () => void;
}

export default function MindmapList({ 
  mindmaps, 
  onMindmapSelect, 
  onMindmapCreate, 
  onMindmapDelete, 
  onClose 
}: MindmapListProps) {
  const { toast } = useToast();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newMindmapName, setNewMindmapName] = useState("");

  const handleCreate = () => {
    if (newMindmapName.trim()) {
      onMindmapCreate(newMindmapName.trim());
      setNewMindmapName("");
      setShowCreateDialog(false);
      onClose();
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete "${name}"?`)) {
      onMindmapDelete(id);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[80vh] overflow-hidden">
          <div className="p-6 border-b">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold">My Mindmaps</h2>
              <div className="flex items-center space-x-2">
                <Button onClick={() => setShowCreateDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  New Mindmap
                </Button>
                <Button variant="ghost" onClick={onClose}>
                  ×
                </Button>
              </div>
            </div>
          </div>
          
          <div className="p-6 overflow-y-auto max-h-[60vh]">
            {mindmaps.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No mindmaps yet</h3>
                <p className="text-gray-500 mb-4">Create your first mindmap to get started</p>
                <Button onClick={() => setShowCreateDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Mindmap
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {mindmaps.map((mindmap) => (
                  <Card key={mindmap.id} className="cursor-pointer hover:shadow-md transition-shadow">
                    <CardHeader>
                      <CardTitle className="text-base truncate">{mindmap.name}</CardTitle>
                      <CardDescription>
                        Updated {formatDate(mindmap.updatedAt!)}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm text-gray-500">
                        {mindmap.data?.nodes?.length || 0} nodes
                      </div>
                    </CardContent>
                    <CardFooter className="flex justify-between">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          onMindmapSelect(mindmap);
                          onClose();
                        }}
                      >
                        Open
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleDelete(mindmap.id, mindmap.name)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Mindmap</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="mindmapName">Mindmap Name</Label>
              <Input
                id="mindmapName"
                value={newMindmapName}
                onChange={(e) => setNewMindmapName(e.target.value)}
                placeholder="Enter mindmap name"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreate();
                }}
                autoFocus
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={!newMindmapName.trim()}>
                Create
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
