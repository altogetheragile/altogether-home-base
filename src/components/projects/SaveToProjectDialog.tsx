import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useProjects, useProjectMutations } from "@/hooks/useProjects";
import { useProjectArtifactMutations } from "@/hooks/useProjectArtifacts";
import { Loader2, Plus, FolderOpen } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface SaveToProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  artifactType: string;
  artifactName: string;
  artifactDescription?: string;
  artifactData: any;
  onSaveComplete?: (projectId: string, artifactId: string) => void;
}

export const SaveToProjectDialog = ({
  open,
  onOpenChange,
  artifactType,
  artifactName,
  artifactDescription,
  artifactData,
  onSaveComplete,
}: SaveToProjectDialogProps) => {
  const [mode, setMode] = useState<"existing" | "new">("existing");
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectDescription, setNewProjectDescription] = useState("");
  const [newProjectColor, setNewProjectColor] = useState("#3B82F6");

  const { data: projects, isLoading: projectsLoading } = useProjects();
  const { createProject } = useProjectMutations();
  const { createArtifact } = useProjectArtifactMutations();

  const handleSave = async () => {
    try {
      let projectId = selectedProjectId;

      // Create new project if needed
      if (mode === "new") {
        if (!newProjectName.trim()) {
          return;
        }

        const newProject = await createProject.mutateAsync({
          name: newProjectName,
          description: newProjectDescription || undefined,
          color_theme: newProjectColor,
        });
        projectId = newProject.id;
      }

      if (!projectId) {
        return;
      }

      // Create artifact
      const artifact = await createArtifact.mutateAsync({
        project_id: projectId,
        artifact_type: artifactType,
        name: artifactName,
        description: artifactDescription,
        data: artifactData,
      });

      onSaveComplete?.(projectId, artifact.id);
      onOpenChange(false);
      
      // Reset form
      setMode("existing");
      setSelectedProjectId("");
      setNewProjectName("");
      setNewProjectDescription("");
      setNewProjectColor("#3B82F6");
    } catch (error) {
      console.error("Error saving to project:", error);
    }
  };

  const isLoading = createProject.isPending || createArtifact.isPending;
  const canSave = mode === "new" ? newProjectName.trim() : selectedProjectId;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Save to Project</DialogTitle>
          <DialogDescription>
            Choose an existing project or create a new one to save your {artifactType}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <RadioGroup value={mode} onValueChange={(value) => setMode(value as "existing" | "new")}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="existing" id="existing" />
              <Label htmlFor="existing" className="flex items-center gap-2 cursor-pointer">
                <FolderOpen className="h-4 w-4" />
                Save to existing project
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="new" id="new" />
              <Label htmlFor="new" className="flex items-center gap-2 cursor-pointer">
                <Plus className="h-4 w-4" />
                Create new project
              </Label>
            </div>
          </RadioGroup>

          {mode === "existing" && (
            <div className="space-y-2">
              <Label>Select Project</Label>
              {projectsLoading ? (
                <div className="flex items-center justify-center p-4">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : projects && projects.length > 0 ? (
                <ScrollArea className="h-[200px] border rounded-md">
                  <div className="p-2 space-y-2">
                    {projects.map((project) => (
                      <div
                        key={project.id}
                        className={`p-3 rounded-md border cursor-pointer transition-colors ${
                          selectedProjectId === project.id
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50"
                        }`}
                        onClick={() => setSelectedProjectId(project.id)}
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full flex-shrink-0"
                            style={{ backgroundColor: project.color_theme || "#3B82F6" }}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{project.name}</p>
                            {project.description && (
                              <p className="text-xs text-muted-foreground truncate">
                                {project.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <p className="text-sm text-muted-foreground text-center p-4">
                  No projects found. Create a new one instead.
                </p>
              )}
            </div>
          )}

          {mode === "new" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="project-name">Project Name *</Label>
                <Input
                  id="project-name"
                  placeholder="My Project"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="project-description">Description</Label>
                <Textarea
                  id="project-description"
                  placeholder="Optional description..."
                  value={newProjectDescription}
                  onChange={(e) => setNewProjectDescription(e.target.value)}
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="project-color">Color Theme</Label>
                <div className="flex gap-2">
                  {["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899"].map((color) => (
                    <button
                      key={color}
                      type="button"
                      className={`w-8 h-8 rounded-full border-2 transition-all ${
                        newProjectColor === color ? "border-foreground scale-110" : "border-transparent"
                      }`}
                      style={{ backgroundColor: color }}
                      onClick={() => setNewProjectColor(color)}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!canSave || isLoading}>
            {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Save to Project
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
