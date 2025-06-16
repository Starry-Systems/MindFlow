import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import Header from "@/components/layout/Header";
import MindmapCanvas from "@/components/mindmap/MindmapCanvas";
import FloatingToolbar from "@/components/mindmap/FloatingToolbar";
import PropertiesSidebar from "@/components/mindmap/PropertiesSidebar";
import FileOperations from "@/components/mindmap/FileOperations";
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
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const queryClient = useQueryClient();
  const [currentMindmap, setCurrentMindmap] = useState<Mindmap | null>(null);
  const [selectedTool, setSelectedTool] = useState<string>("select");
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [showPropertiesSidebar, setShowPropertiesSidebar] = useState(true);

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  // Fetch user's mindmaps
  const { data: mindmaps } = useQuery({
    queryKey: ["/api/mindmaps"],
    enabled: !!isAuthenticated,
  });

  // Create new mindmap mutation
  const createMindmapMutation = useMutation({
    mutationFn: async (data: { name: string; data: MindmapData }) => {
      const response = await apiRequest("POST", "/api/mindmaps", data);
      return response.json();
    },
    onSuccess: (newMindmap) => {
      setCurrentMindmap(newMindmap);
      queryClient.invalidateQueries({ queryKey: ["/api/mindmaps"] });
      toast({
        title: "Success",
        description: "New mindmap created!",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to create mindmap",
        variant: "destructive",
      });
    },
  });

  // Update mindmap mutation
  const updateMindmapMutation = useMutation({
    mutationFn: async (data: { id: string; name?: string; data?: MindmapData }) => {
      const response = await apiRequest("PUT", `/api/mindmaps/${data.id}`, {
        name: data.name,
        data: data.data,
      });
      return response.json();
    },
    onSuccess: (updatedMindmap) => {
      setCurrentMindmap(updatedMindmap);
      queryClient.invalidateQueries({ queryKey: ["/api/mindmaps"] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to save mindmap",
        variant: "destructive",
      });
    },
  });

  // Initialize with default mindmap if none exist
  useEffect(() => {
    if (mindmaps && mindmaps.length === 0 && !currentMindmap) {
      const defaultData: MindmapData = {
        nodes: [
          {
            id: "1",
            x: 400,
            y: 300,
            text: "Main Idea",
            color: "#2563EB",
            shape: "rounded-rectangle"
          }
        ],
        connections: [],
        canvas: {
          zoom: 1.0,
          panX: 0,
          panY: 0,
          background: "#ffffff"
        }
      };

      createMindmapMutation.mutate({
        name: "My First Mindmap",
        data: defaultData
      });
    } else if (mindmaps && mindmaps.length > 0 && !currentMindmap) {
      setCurrentMindmap(mindmaps[0]);
    }
  }, [mindmaps, currentMindmap]);

  const handleMindmapUpdate = (data: MindmapData) => {
    if (currentMindmap) {
      updateMindmapMutation.mutate({
        id: currentMindmap.id,
        data
      });
    }
  };

  const handleMindmapNameChange = (name: string) => {
    if (currentMindmap) {
      updateMindmapMutation.mutate({
        id: currentMindmap.id,
        name
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <Header 
        currentMindmap={currentMindmap}
        onMindmapNameChange={handleMindmapNameChange}
        mindmaps={mindmaps || []}
        onMindmapSelect={setCurrentMindmap}
      />
      
      <div className="flex flex-1 overflow-hidden">
        <FloatingToolbar 
          selectedTool={selectedTool}
          onToolSelect={setSelectedTool}
        />
        
        <div className="flex-1 relative">
          <MindmapCanvas
            mindmapData={currentMindmap?.data as MindmapData}
            selectedTool={selectedTool}
            selectedNode={selectedNode}
            onNodeSelect={setSelectedNode}
            onDataChange={handleMindmapUpdate}
          />
        </div>

        {showPropertiesSidebar && (
          <PropertiesSidebar
            selectedNode={selectedNode}
            onNodeUpdate={(nodeData) => {
              if (currentMindmap && selectedNode) {
                const data = currentMindmap.data as MindmapData;
                const updatedNodes = data.nodes.map(node => 
                  node.id === selectedNode.id ? { ...node, ...nodeData } : node
                );
                handleMindmapUpdate({
                  ...data,
                  nodes: updatedNodes
                });
              }
            }}
            onClose={() => setShowPropertiesSidebar(false)}
          />
        )}
      </div>

      <FileOperations 
        currentMindmap={currentMindmap}
        onMindmapLoad={(data) => {
          if (currentMindmap) {
            handleMindmapUpdate(data);
          }
        }}
      />

      {/* Mobile toolbar */}
      <div className="lg:hidden fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-white rounded-full shadow-lg border border-gray-200 px-4 py-2 flex items-center space-x-4 z-50">
        <button 
          onClick={() => setSelectedTool("select")}
          className={`p-2 ${selectedTool === "select" ? "text-blue-600" : "text-gray-600"}`}
        >
          <i className="fas fa-mouse-pointer"></i>
        </button>
        <button 
          onClick={() => setSelectedTool("addNode")}
          className={`p-2 ${selectedTool === "addNode" ? "text-blue-600" : "text-gray-600"}`}
        >
          <i className="fas fa-plus-circle"></i>
        </button>
        <button 
          onClick={() => setSelectedTool("addConnection")}
          className={`p-2 ${selectedTool === "addConnection" ? "text-blue-600" : "text-gray-600"}`}
        >
          <i className="fas fa-link"></i>
        </button>
        <button 
          onClick={() => setShowPropertiesSidebar(!showPropertiesSidebar)}
          className="p-2 text-gray-600"
        >
          <i className="fas fa-cog"></i>
        </button>
      </div>
    </div>
  );
}
