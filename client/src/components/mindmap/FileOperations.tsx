import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Download, Upload, Save } from "lucide-react";
import { FileManager } from "@/lib/fileManager";
import type { Mindmap } from "@shared/schema";

interface FileOperationsProps {
  currentMindmap: Mindmap | null;
  onMindmapLoad: (data: any) => void;
}

export default function FileOperations({ currentMindmap, onMindmapLoad }: FileOperationsProps) {
  const { toast } = useToast();
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [fileName, setFileName] = useState("my-mindmap");
  const [fileFormat, setFileFormat] = useState("xml");

  const handleDownload = () => {
    if (!currentMindmap) {
      toast({
        title: "Error",
        description: "No mindmap to download",
        variant: "destructive",
      });
      return;
    }

    try {
      FileManager.downloadFile(currentMindmap.data, fileName, fileFormat);
      setSaveDialogOpen(false);
      toast({
        title: "Success",
        description: "File downloaded successfully!",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to download file",
        variant: "destructive",
      });
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      FileManager.uploadFile(file, (data) => {
        onMindmapLoad(data);
        setUploadDialogOpen(false);
        toast({
          title: "Success",
          description: "File uploaded successfully!",
        });
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to upload file",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      {/* Save/Download Dialog */}
      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="ghost" size="sm" title="Download">
            <Download className="h-4 w-4" />
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Mindmap</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="fileName">File Name</Label>
              <Input
                id="fileName"
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                placeholder="Enter file name"
              />
            </div>
            <div>
              <Label htmlFor="fileFormat">Format</Label>
              <Select value={fileFormat} onValueChange={setFileFormat}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="xml">XML Format (.xml)</SelectItem>
                  <SelectItem value="json">JSON Format (.json)</SelectItem>
                  <SelectItem value="mindmap">MindFlow Format (.mindmap)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setSaveDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleDownload}>
                Download
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Upload Dialog */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="ghost" size="sm" title="Upload">
            <Upload className="h-4 w-4" />
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Mindmap</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 transition-colors">
              <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600 mb-2">Drop your mindmap file here</p>
              <p className="text-sm text-gray-500 mb-4">or click to browse</p>
              <Input
                type="file"
                accept=".xml,.json,.mindmap"
                onChange={handleFileUpload}
                className="hidden"
                id="fileUpload"
              />
              <Label htmlFor="fileUpload">
                <Button variant="outline" asChild>
                  <span>Choose File</span>
                </Button>
              </Label>
            </div>
            <div className="flex justify-end">
              <Button variant="outline" onClick={() => setUploadDialogOpen(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Save Button (hidden, triggered by keyboard shortcut) */}
      <Button variant="ghost" size="sm" className="hidden" title="Save">
        <Save className="h-4 w-4" />
      </Button>
    </>
  );
}
