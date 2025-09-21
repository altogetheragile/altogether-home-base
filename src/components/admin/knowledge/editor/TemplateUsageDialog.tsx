import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, Palette, Code, Eye, Save, Share2 } from 'lucide-react';

import { toast } from 'sonner';
import type { KnowledgeTemplate } from '@/types/template';

interface TemplateUsageDialogProps {
  template: KnowledgeTemplate;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const TemplateUsageDialog = ({ template, open, onOpenChange }: TemplateUsageDialogProps) => {
  const [activeTab, setActiveTab] = useState('preview');
  const [sessionData, setSessionData] = useState<Record<string, any>>({});

  const handleExportPDF = async () => {
    try {
      // For now, just show a success message - export functionality will be enhanced later
      toast.success('Export feature coming soon');
    } catch (error) {
      toast.error('Failed to export template');
    }
  };

  const handleSaveSession = () => {
    // Save current session data
    const sessionId = `template_${template.id}_${Date.now()}`;
    localStorage.setItem(sessionId, JSON.stringify({
      templateId: template.id,
      templateTitle: template.title,
      data: sessionData,
      savedAt: new Date().toISOString()
    }));
    toast.success('Template session saved');
  };

  const handleShareTemplate = () => {
    // Copy template URL to clipboard
    const templateUrl = `${window.location.origin}/templates/${template.id}`;
    navigator.clipboard.writeText(templateUrl);
    toast.success('Template URL copied to clipboard');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                {template.title}
              </DialogTitle>
              <DialogDescription className="mt-1">
                {template.description}
              </DialogDescription>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="outline">{template.template_type}</Badge>
                <Badge variant="secondary">v{template.version}</Badge>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleShareTemplate}>
                <Share2 className="h-4 w-4 mr-1" />
                Share
              </Button>
              <Button variant="outline" size="sm" onClick={handleSaveSession}>
                <Save className="h-4 w-4 mr-1" />
                Save Session
              </Button>
              <Button variant="outline" size="sm" onClick={handleExportPDF}>
                <Download className="h-4 w-4 mr-1" />
                Export PDF
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="preview" className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Interactive Preview
              </TabsTrigger>
              <TabsTrigger value="structure" className="flex items-center gap-2">
                <Code className="h-4 w-4" />
                Template Structure
              </TabsTrigger>
              <TabsTrigger value="instructions" className="flex items-center gap-2">
                <Palette className="h-4 w-4" />
                Usage Instructions
              </TabsTrigger>
            </TabsList>

             <div className="flex-1 overflow-hidden mt-4">
              <TabsContent value="preview" className="h-full overflow-auto">
                <div className="h-full flex items-center justify-center p-8 text-muted-foreground">
                  <div className="text-center">
                    <Eye className="w-12 h-12 mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">Template Preview</h3>
                    <p>Template preview functionality will be available when PDF templates are uploaded.</p>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="structure" className="h-full overflow-auto space-y-4">
                {template.config ? (
                  <>
                    <Card>
                      <CardHeader>
                        <CardTitle>Template Configuration</CardTitle>
                        <CardDescription>
                          Technical details about this template's structure
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 gap-6">
                          <div>
                            <h4 className="font-medium mb-2">Layout</h4>
                            <div className="text-sm text-muted-foreground space-y-1">
                              <p>Type: {template.config.layout}</p>
                              <p>Dimensions: {template.config.dimensions.width} × {template.config.dimensions.height}</p>
                              {template.config.dimensions.grid && (
                                <p>Grid: {template.config.dimensions.grid}</p>
                              )}
                            </div>
                          </div>
                          <div>
                            <h4 className="font-medium mb-2">Sections</h4>
                            <div className="text-sm text-muted-foreground">
                              <p>{template.config.sections.length} sections defined</p>
                              <p>{template.config.sections.reduce((acc, section) => acc + section.fields.length, 0)} total fields</p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>Sections & Fields</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {template.config.sections.map((section) => (
                            <div key={section.id} className="border rounded-lg p-4">
                              <h4 className="font-medium mb-2">{section.title}</h4>
                              {section.description && (
                                <p className="text-sm text-muted-foreground mb-3">{section.description}</p>
                              )}
                              <div className="grid grid-cols-2 gap-2">
                                {section.fields.map((field) => (
                                  <div key={field.id} className="text-sm p-2 bg-muted rounded">
                                    <span className="font-medium">{field.label}</span>
                                    <span className="text-muted-foreground ml-2">({field.type})</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </>
                ) : (
                  <Card>
                    <CardHeader>
                      <CardTitle>PDF Template</CardTitle>
                      <CardDescription>
                        This is a static PDF template without interactive configuration
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-6">
                          <div>
                            <h4 className="font-medium mb-2">File Information</h4>
                            <div className="text-sm text-muted-foreground space-y-1">
                              <p>Type: PDF Document</p>
                              {template.pdf_filename && <p>Filename: {template.pdf_filename}</p>}
                              {template.pdf_file_size && (
                                <p>Size: {(template.pdf_file_size / 1024 / 1024).toFixed(1)} MB</p>
                              )}
                              {template.pdf_page_count && (
                                <p>Pages: {template.pdf_page_count}</p>
                              )}
                            </div>
                          </div>
                          <div>
                            <h4 className="font-medium mb-2">Template Details</h4>
                            <div className="text-sm text-muted-foreground space-y-1">
                              <p>Category: {template.category || 'General'}</p>
                              <p>Version: {template.version}</p>
                              <p>Public: {template.is_public ? 'Yes' : 'No'}</p>
                              <p>Usage Count: {template.usage_count}</p>
                            </div>
                          </div>
                        </div>
                        
                        {template.tags && template.tags.length > 0 && (
                          <div>
                            <h4 className="font-medium mb-2">Tags</h4>
                            <div className="flex flex-wrap gap-2">
                              {template.tags.map((tag) => (
                                <Badge key={tag} variant="secondary">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="instructions" className="h-full overflow-auto space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>How to Use This Template</CardTitle>
                    <CardDescription>
                      Step-by-step guide for getting the most out of this template
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium mb-2">Getting Started</h4>
                        <ol className="list-decimal list-inside text-sm text-muted-foreground space-y-1">
                          <li>Fill out the template sections in order from left to right, top to bottom</li>
                          <li>Use the interactive preview to see your inputs in real-time</li>
                          <li>Save your session periodically to avoid losing work</li>
                          <li>Export the completed template as PDF when finished</li>
                        </ol>
                      </div>

                      <div>
                        <h4 className="font-medium mb-2">Best Practices</h4>
                        <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                          <li>Be specific and concrete in your inputs</li>
                          <li>Review each section before moving to the next</li>
                          <li>Use the template as a thinking tool, not just a form to fill</li>
                          <li>Share the completed template with stakeholders for feedback</li>
                        </ul>
                      </div>

                      <div>
                        <h4 className="font-medium mb-2">Common Applications</h4>
                        <div className="text-sm text-muted-foreground space-y-2">
                          <p>This {template.template_type} template is commonly used for:</p>
                          <ul className="list-disc list-inside ml-4 space-y-1">
                            {template.template_type === 'canvas' && (
                              <>
                                <li>Strategic planning sessions</li>
                                <li>Business model development</li>
                                <li>Problem-solving workshops</li>
                              </>
                            )}
                            {template.template_type === 'worksheet' && (
                              <>
                                <li>Individual reflection exercises</li>
                                <li>Skill development activities</li>
                                <li>Assessment and evaluation</li>
                              </>
                            )}
                            {template.template_type === 'matrix' && (
                              <>
                                <li>Comparative analysis</li>
                                <li>Decision-making frameworks</li>
                                <li>Risk assessment</li>
                              </>
                            )}
                            {template.template_type === 'process' && (
                              <>
                                <li>Workflow documentation</li>
                                <li>Process improvement</li>
                                <li>Standard operating procedures</li>
                              </>
                            )}
                            {template.template_type === 'form' && (
                              <>
                                <li>Data collection</li>
                                <li>Survey and feedback</li>
                                <li>Registration and intake</li>
                              </>
                            )}
                          </ul>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </div>
          </Tabs>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};