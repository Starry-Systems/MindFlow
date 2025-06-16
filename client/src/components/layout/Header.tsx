import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Brain, ChevronDown, Share2 } from "lucide-react";
import type { Mindmap } from "@shared/schema";

interface HeaderProps {
  currentMindmap: Mindmap | null;
  onMindmapNameChange: (name: string) => void;
  mindmaps: Mindmap[];
  onMindmapSelect: (mindmap: Mindmap) => void;
}

export default function Header({ 
  currentMindmap, 
  onMindmapNameChange, 
  mindmaps, 
  onMindmapSelect 
}: HeaderProps) {
  const { user } = useAuth();
  const [isEditingName, setIsEditingName] = useState(false);
  const [editName, setEditName] = useState(currentMindmap?.name || "");

  const handleNameSave = () => {
    if (editName.trim()) {
      onMindmapNameChange(editName.trim());
      setIsEditingName(false);
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between shadow-sm z-50">
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <Brain className="h-8 w-8 text-blue-600" />
          <h1 className="text-xl font-semibold text-gray-900">MindFlow</h1>
        </div>
        
        {/* Document Info */}
        <div className="hidden md:flex items-center space-x-2 ml-8">
          {isEditingName ? (
            <Input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onBlur={handleNameSave}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleNameSave();
                if (e.key === 'Escape') {
                  setIsEditingName(false);
                  setEditName(currentMindmap?.name || "");
                }
              }}
              className="text-sm w-48"
              autoFocus
            />
          ) : (
            <span 
              onClick={() => setIsEditingName(true)}
              className="text-sm text-gray-600 cursor-pointer hover:text-gray-900"
            >
              {currentMindmap?.name || "Untitled Mindmap"}
            </span>
          )}
          <span className="text-xs text-gray-400">•</span>
          <span className="text-xs text-gray-500">
            {currentMindmap?.updatedAt 
              ? `Saved ${new Date(currentMindmap.updatedAt).toLocaleTimeString()}`
              : "Not saved"
            }
          </span>
        </div>
      </div>

      {/* Header Actions */}
      <div className="flex items-center space-x-3">
        {/* Share Button */}
        <Button variant="ghost" size="sm" className="hidden md:flex">
          <Share2 className="h-4 w-4 mr-2" />
          Share
        </Button>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center space-x-2 p-2">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">
                  {user ? getInitials(user.firstName || user.email || "U") : "U"}
                </span>
              </div>
              <ChevronDown className="h-4 w-4 text-gray-500 hidden md:block" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <div className="px-2 py-1.5 text-sm font-medium">
              {user?.firstName || user?.email || "User"}
            </div>
            <div className="px-2 py-1.5 text-xs text-gray-500">
              {user?.email}
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onMindmapSelect(null)}>
              My Mindmaps
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => window.location.href = '/api/logout'}>
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
