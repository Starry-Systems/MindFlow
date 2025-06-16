import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  MousePointer, 
  Plus, 
  Link, 
  Palette, 
  Shapes, 
  ZoomIn, 
  ZoomOut, 
  Maximize 
} from "lucide-react";

interface FloatingToolbarProps {
  selectedTool: string;
  onToolSelect: (tool: string) => void;
}

export default function FloatingToolbar({ selectedTool, onToolSelect }: FloatingToolbarProps) {
  const tools = [
    { id: "select", icon: MousePointer, label: "Select" },
    { id: "addNode", icon: Plus, label: "Add Node" },
    { id: "addConnection", icon: Link, label: "Connect Nodes" },
  ];

  const styleTools = [
    { id: "colors", icon: Palette, label: "Node Colors" },
    { id: "shapes", icon: Shapes, label: "Node Shapes" },
  ];

  const viewTools = [
    { id: "zoomIn", icon: ZoomIn, label: "Zoom In" },
    { id: "zoomOut", icon: ZoomOut, label: "Zoom Out" },
    { id: "fitToScreen", icon: Maximize, label: "Fit to Screen" },
  ];

  return (
    <div className="absolute left-4 top-20 bg-white rounded-lg shadow-lg border border-gray-200 p-2 z-40 flex flex-col space-y-1">
      {/* Drawing Tools */}
      {tools.map((tool) => (
        <Button
          key={tool.id}
          variant={selectedTool === tool.id ? "default" : "ghost"}
          size="sm"
          onClick={() => onToolSelect(tool.id)}
          className="p-2 h-auto"
          title={tool.label}
        >
          <tool.icon className="h-4 w-4" />
        </Button>
      ))}
      
      <Separator />
      
      {/* Node Styling */}
      {styleTools.map((tool) => (
        <Button
          key={tool.id}
          variant="ghost"
          size="sm"
          onClick={() => onToolSelect(tool.id)}
          className="p-2 h-auto"
          title={tool.label}
        >
          <tool.icon className="h-4 w-4" />
        </Button>
      ))}
      
      <Separator />
      
      {/* View Controls */}
      {viewTools.map((tool) => (
        <Button
          key={tool.id}
          variant="ghost"
          size="sm"
          onClick={() => onToolSelect(tool.id)}
          className="p-2 h-auto"
          title={tool.label}
        >
          <tool.icon className="h-4 w-4" />
        </Button>
      ))}
    </div>
  );
}
