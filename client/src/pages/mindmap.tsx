import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/layout/Header";
import MindmapCanvas from "@/components/mindmap/MindmapCanvas";
import FloatingToolbar from "@/components/mindmap/FloatingToolbar";
import PropertiesSidebar from "@/components/mindmap/PropertiesSidebar";
import FileOperations from "@/components/mindmap/FileOperations";
import MindmapList from "@/components/mindmap/MindmapList";
import type { Mindmap } from "@shared/schema";

interface MindmapData {
  nodes: Array<{
    id: string;
    x: number;
    y: number;
    text: string;
    color: string;
    shape: string;
  }>;
  connections: Array<{
    from: string;
    to: string;
    style: string;
  }>;
  canvas: {
    zoom: number;
    panX: number;
    panY: number;
    background: string;
  };
}

export default function MindmapPage() {
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const [currentMindmap, setCurrentMindmap] = useState<Mindmap | null>(null);
  const [mindmaps, setMindmaps] = useState<Mindmap[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showMindmapList, setShowMindmapList] = useState(false);
  const [autoSaveTimeout, setAutoSaveTimeout] = useState<NodeJS.Timeout | null>(null);

  // Load mindmaps from database
  const loadMindmaps = async () => {
    try {
      const response = await fetch('/api/mindmaps');
      if (response.ok) {
        const data = await response.json();
        setMindmaps(data);

        // If no current mindmap and we have mindmaps, load the first one
        if (!currentMindmap && data.length > 0) {
          setCurrentMindmap(data[0]);
        }
        // If no mindmaps exist, create a default one
        else if (data.length === 0) {
          await createMindmap("My First Mindmap");
        }
      }
    } catch (error) {
      console.error('Failed to load mindmaps:', error);
      toast({
        title: "Error",
        description: "Failed to load mindmaps",
        variant: "destructive",
      });
    }
  };

  // Create new mindmap
  const createMindmap = async (name: string) => {
    try {
      const defaultData = {
        nodes: [{
          id: '1',
          x: 400,
          y: 300,
          text: 'Central Idea',
          color: '#2563EB',
          shape: 'rounded-rectangle'
        }],
        connections: [],
        canvas: {
          zoom: 1,
          panX: 0,
          panY: 0,
          background: '#ffffff'
        }
      };

      const response = await fetch('/api/mindmaps', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, data: defaultData })
      });

      if (response.ok) {
        const newMindmap = await response.json();
        setMindmaps(prev => [newMindmap, ...prev]);
        setCurrentMindmap(newMindmap);
        toast({
          title: "Success",
          description: "New mindmap created",
        });
      }
    } catch (error) {
      console.error('Failed to create mindmap:', error);
      toast({
        title: "Error",
        description: "Failed to create mindmap",
        variant: "destructive",
      });
    }
  };

  // Save current mindmap
  const saveMindmap = async (data?: any, name?: string) => {
    if (!currentMindmap) return;

    try {
      const updateData: any = {};
      if (data !== undefined) updateData.data = data;
      if (name !== undefined) updateData.name = name;

      const response = await fetch(`/api/mindmaps/${currentMindmap.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData)
      });

      if (response.ok) {
        const updatedMindmap = await response.json();
        setCurrentMindmap(updatedMindmap);
        setMindmaps(prev => prev.map(m => m.id === updatedMindmap.id ? updatedMindmap : m));
      }
    } catch (error) {
      console.error('Failed to save mindmap:', error);
      toast({
        title: "Error",
        description: "Failed to save mindmap",
        variant: "destructive",
      });
    }
  };

  // Auto-save with debouncing
  const scheduleAutoSave = (data: any) => {
    if (autoSaveTimeout) {
      clearTimeout(autoSaveTimeout);
    }

    const timeout = setTimeout(() => {
      saveMindmap(data);
    }, 2000); // Auto-save after 2 seconds of inactivity

    setAutoSaveTimeout(timeout);
  };

  // Delete mindmap
  const deleteMindmap = async (id: string) => {
    try {
      const response = await fetch(`/api/mindmaps/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setMindmaps(prev => prev.filter(m => m.id !== id));
        if (currentMindmap?.id === id) {
          const remaining = mindmaps.filter(m => m.id !== id);
          setCurrentMindmap(remaining.length > 0 ? remaining[0] : null);
        }
        toast({
          title: "Success",
          description: "Mindmap deleted",
        });
      }
    } catch (error) {
      console.error('Failed to delete mindmap:', error);
      toast({
        title: "Error",
        description: "Failed to delete mindmap",
        variant: "destructive",
      });
    }
  };

  const handleMindmapNameChange = (name: string) => {
    saveMindmap(undefined, name);
  };

  const handleMindmapSelect = (mindmap: Mindmap | null) => {
    if (mindmap === null) {
      // Show mindmap list
      setShowMindmapList(true);
    } else {
      setCurrentMindmap(mindmap);
    }
  };

  const handleMindmapDataChange = (data: any) => {
    scheduleAutoSave(data);
  };

  // Load mindmaps on component mount
  useEffect(() => {
    if (user && !loading) {
      loadMindmaps();
    }
  }, [user, loading]);

  // Cleanup auto-save timeout
  useEffect(() => {
    return () => {
      if (autoSaveTimeout) {
        clearTimeout(autoSaveTimeout);
      }
    };
  }, [autoSaveTimeout]);

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  if (!user) {
    return <div className="flex items-center justify-center h-screen">Please log in to continue.</div>;
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <Header 
        currentMindmap={currentMindmap}
        onMindmapNameChange={handleMindmapNameChange} 
        mindmaps={mindmaps}
        onMindmapSelect={handleMindmapSelect}
      />

      <div className="flex-1 relative">
        <FloatingToolbar />
        <MindmapCanvas 
          mindmapData={currentMindmap?.data}
          onDataChange={handleMindmapDataChange}
        />
        <FileOperations 
          currentMindmap={currentMindmap}
          onMindmapLoad={handleMindmapDataChange}
        />
        {sidebarOpen && (
          <PropertiesSidebar onClose={() => setSidebarOpen(false)} />
        )}
      </div>

      {showMindmapList && (
        <MindmapList
          mindmaps={mindmaps}
          onMindmapSelect={handleMindmapSelect}
          onMindmapCreate={createMindmap}
          onMindmapDelete={deleteMindmap}
          onClose={() => setShowMindmapList(false)}
        />
      )}
    </div>
  );
}
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