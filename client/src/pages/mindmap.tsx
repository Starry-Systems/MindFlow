import { useRef, useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Header from "@/components/layout/Header";
import MindmapCanvas from "@/components/mindmap/MindmapCanvas";
import FloatingToolbar from "@/components/mindmap/FloatingToolbar";
import PropertiesSidebar from "@/components/mindmap/PropertiesSidebar";
import FileOperations from "@/components/mindmap/FileOperations";
import { useToast } from "@/hooks/use-toast";
import type { Mindmap } from "@shared/schema";

async function fetchMindmap(id: string): Promise<Mindmap> {
  const response = await fetch(`/api/mindmaps/${id}`, {
    credentials: 'include'
  });
  if (!response.ok) {
    throw new Error('Failed to fetch mindmap');
  }
  return response.json();
}

async function saveMindmap(id: string, title: string, data: any): Promise<Mindmap> {
  const response = await fetch(`/api/mindmaps/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    credentials: 'include',
    body: JSON.stringify({ title, data })
  });
  if (!response.ok) {
    throw new Error('Failed to save mindmap');
  }
  return response.json();
}

export default function MindmapPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const mindmapEngine = useRef<any>(null);
  const [title, setTitle] = useState("Untitled Mindmap");
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  const { data: mindmap, isLoading } = useQuery({
    queryKey: ['mindmap', id],
    queryFn: () => fetchMindmap(id!),
    enabled: !!id
  });

  const saveMutation = useMutation({
    mutationFn: ({ title, data }: { title: string; data: any }) => saveMindmap(id!, title, data),
    onSuccess: () => {
      setLastSaved(new Date());
      queryClient.invalidateQueries({ queryKey: ['mindmap', id] });
      queryClient.invalidateQueries({ queryKey: ['mindmaps'] });
      toast({
        title: "Saved",
        description: "Your mindmap has been saved to the cloud."
      });
    },
    onError: () => {
      toast({
        title: "Save failed",
        description: "Failed to save mindmap. Please try again.",
        variant: "destructive"
      });
    }
  });

  const handleSave = () => {
    if (mindmapEngine.current && id) {
      const data = mindmapEngine.current.exportData();
      saveMutation.mutate({ title, data });
    }
  };

  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle);
  };

  useEffect(() => {
    if (mindmap && mindmapEngine.current) {
      setTitle(mindmap.title);
      mindmapEngine.current.loadData(mindmap.data);
    }
  }, [mindmap]);

  useEffect(() => {
    if (!id) {
      navigate('/mindmaps');
    }
  }, [id, navigate]);

  if (!id) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading mindmap...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        currentMindmap={mindmap}
        onTitleChange={handleTitleChange}
      />

      <div className="flex-1 relative">
        <MindmapCanvas ref={mindmapEngine} />
        <FloatingToolbar onSave={handleSave} />
        <PropertiesSidebar />
        <FileOperations onSave={handleSave} />

        {/* Save Status */}
        <div className="absolute top-4 right-4 bg-white rounded-lg shadow-md px-3 py-2 text-sm">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              className="font-medium border-none outline-none bg-transparent"
              placeholder="Untitled Mindmap"
            />
            <span className="text-gray-500">|</span>
            <span className={`text-xs ${saveMutation.isPending ? 'text-orange-600' : lastSaved ? 'text-green-600' : 'text-gray-600'}`}>
              {saveMutation.isPending ? 'Saving...' : lastSaved ? `Saved ${lastSaved.toLocaleTimeString()}` : 'Unsaved'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}