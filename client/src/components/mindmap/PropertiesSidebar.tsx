import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { X } from "lucide-react";

interface PropertiesSidebarProps {
  selectedNode: any;
  onNodeUpdate: (nodeData: any) => void;
  onClose: () => void;
}

export default function PropertiesSidebar({ selectedNode, onNodeUpdate, onClose }: PropertiesSidebarProps) {
  const [nodeText, setNodeText] = useState(selectedNode?.text || "");

  const colors = [
    { name: "Blue", value: "#2563EB" },
    { name: "Green", value: "#10B981" },
    { name: "Amber", value: "#F59E0B" },
    { name: "Purple", value: "#8B5CF6" },
    { name: "Red", value: "#EF4444" },
  ];

  const shapes = [
    { name: "Rectangle", value: "rectangle" },
    { name: "Rounded Rectangle", value: "rounded-rectangle" },
    { name: "Circle", value: "circle" },
    { name: "Diamond", value: "diamond" },
  ];

  const handleTextChange = (text: string) => {
    setNodeText(text);
    if (selectedNode) {
      onNodeUpdate({ text });
    }
  };

  const handleColorChange = (color: string) => {
    if (selectedNode) {
      onNodeUpdate({ color });
    }
  };

  const handleShapeChange = (shape: string) => {
    if (selectedNode) {
      onNodeUpdate({ shape });
    }
  };

  return (
    <div className="w-80 bg-white border-l border-gray-200 p-4 overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">Properties</h3>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-6">
        {/* Node Properties */}
        {selectedNode && (
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-3">Node Properties</h4>
            <div className="space-y-3">
              <div>
                <Label htmlFor="nodeText" className="text-xs font-medium text-gray-700">
                  Text
                </Label>
                <Input
                  id="nodeText"
                  value={nodeText}
                  onChange={(e) => handleTextChange(e.target.value)}
                  placeholder="Node text"
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label className="text-xs font-medium text-gray-700 mb-2 block">
                  Color
                </Label>
                <div className="flex space-x-2">
                  {colors.map((color) => (
                    <button
                      key={color.value}
                      onClick={() => handleColorChange(color.value)}
                      className={`w-8 h-8 rounded-full border-2 focus:ring-2 focus:ring-offset-1 ${
                        selectedNode.color === color.value 
                          ? "border-gray-900 ring-2 ring-blue-500" 
                          : "border-gray-300"
                      }`}
                      style={{ backgroundColor: color.value }}
                      title={color.name}
                    />
                  ))}
                </div>
              </div>
              
              <div>
                <Label htmlFor="nodeShape" className="text-xs font-medium text-gray-700">
                  Shape
                </Label>
                <Select 
                  value={selectedNode.shape || "rounded-rectangle"} 
                  onValueChange={handleShapeChange}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {shapes.map((shape) => (
                      <SelectItem key={shape.value} value={shape.value}>
                        {shape.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )}

        <Separator />

        {/* Connection Properties */}
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-3">Connection Style</h4>
          <div className="space-y-3">
            <div>
              <Label htmlFor="lineType" className="text-xs font-medium text-gray-700">
                Line Type
              </Label>
              <Select defaultValue="curved">
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="curved">Curved</SelectItem>
                  <SelectItem value="straight">Straight</SelectItem>
                  <SelectItem value="stepped">Stepped</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="thickness" className="text-xs font-medium text-gray-700">
                Thickness
              </Label>
              <input
                type="range"
                min="1"
                max="5"
                defaultValue="2"
                className="w-full mt-1 accent-blue-600"
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Document Settings */}
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-3">Document</h4>
          <div className="space-y-3">
            <div>
              <Label className="text-xs font-medium text-gray-700 mb-2 block">
                Background
              </Label>
              <div className="flex space-x-2">
                <button className="w-8 h-8 rounded border-2 border-gray-300 bg-white focus:ring-2 focus:ring-blue-500"></button>
                <button className="w-8 h-8 rounded bg-gray-100 focus:ring-2 focus:ring-blue-500"></button>
                <button className="w-8 h-8 rounded bg-blue-50 focus:ring-2 focus:ring-blue-500"></button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
