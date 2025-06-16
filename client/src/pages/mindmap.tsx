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