import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Play, Save, RotateCcw } from 'lucide-react';
import { DataImport, useUpdateDataImport } from '@/hooks/useDataImports';

interface ColumnMapperProps {
  importRecord: DataImport;
  headers: string[];
}

// Mapping configurations for different target entities
const getTargetFields = (targetEntity: string) => {
  switch (targetEntity) {
    case 'knowledge_items':
      return [
        // Core fields
        { key: 'name', label: 'Name/Title', required: true },
        { key: 'slug', label: 'URL Slug', required: false },
        { key: 'description', label: 'Description', required: false },
        { key: 'summary', label: 'Summary', required: false },
        { key: 'purpose', label: 'Purpose', required: false },
        { key: 'originator', label: 'Originator/Source', required: false },
        
        // Status and visibility
        { key: 'is_published', label: 'Published (true/false)', required: false },
        { key: 'is_featured', label: 'Featured (true/false)', required: false },
        { key: 'is_complete', label: 'Complete (true/false)', required: false },
        
        // Categorization
        { key: 'category_name', label: 'Category Name', required: false },
        { key: 'activity_focus_name', label: 'Activity Focus', required: false },
        { key: 'activity_domain_name', label: 'Activity Domain', required: false },
        { key: 'activity_category_name', label: 'Activity Category', required: false },
        { key: 'planning_layers', label: 'Planning Layers (comma-separated)', required: false },
        { key: 'tags', label: 'Tags (comma-separated)', required: false },
        
        // Metadata
        { key: 'difficulty_level', label: 'Difficulty Level', required: false },
        { key: 'estimated_reading_time', label: 'Reading Time (minutes)', required: false },
        { key: 'industry_context', label: 'Industry Context', required: false },
        { key: 'team_size_min', label: 'Min Team Size', required: false },
        { key: 'team_size_max', label: 'Max Team Size', required: false },
        { key: 'duration_min_minutes', label: 'Min Duration (minutes)', required: false },
        { key: 'duration_max_minutes', label: 'Max Duration (minutes)', required: false },
        
        // Generic fields (6W framework)
        { key: 'generic_who', label: 'Generic Who', required: false },
        { key: 'generic_what', label: 'Generic What', required: false },
        { key: 'generic_when', label: 'Generic When', required: false },
        { key: 'generic_where', label: 'Generic Where', required: false },
        { key: 'generic_why', label: 'Generic Why', required: false },
        { key: 'generic_how', label: 'Generic How', required: false },
        
        // Example fields
        { key: 'example_who', label: 'Example Who', required: false },
        { key: 'example_what', label: 'Example What', required: false },
        { key: 'example_when', label: 'Example When', required: false },
        { key: 'example_where', label: 'Example Where', required: false },
        { key: 'example_why', label: 'Example Why', required: false },
        { key: 'example_how', label: 'Example How', required: false },
        
        // Rich arrays (pipe-separated in Excel)
        { key: 'typical_participants', label: 'Typical Participants (pipe-separated)', required: false },
        { key: 'required_skills', label: 'Required Skills (pipe-separated)', required: false },
        { key: 'success_criteria', label: 'Success Criteria (pipe-separated)', required: false },
        { key: 'common_pitfalls', label: 'Common Pitfalls (pipe-separated)', required: false },
        { key: 'related_practices', label: 'Related Practices (pipe-separated)', required: false },
        
        // Additional content
        { key: 'planning_considerations', label: 'Planning Considerations', required: false },
        
        // SEO fields
        { key: 'seo_title', label: 'SEO Title', required: false },
        { key: 'seo_description', label: 'SEO Description', required: false },
        { key: 'seo_keywords', label: 'SEO Keywords (comma-separated)', required: false },
      ];
    case 'events':
      return [
        { key: 'title', label: 'Event Title', required: true },
        { key: 'description', label: 'Description', required: false },
        { key: 'start_date', label: 'Start Date', required: true },
        { key: 'end_date', label: 'End Date', required: false },
        { key: 'capacity', label: 'Capacity', required: false },
        { key: 'price_cents', label: 'Price (cents)', required: false },
        { key: 'location_name', label: 'Location Name', required: false },
        { key: 'instructor_name', label: 'Instructor Name', required: false },
        { key: 'category_name', label: 'Category Name', required: false },
      ];
    case 'instructors':
      return [
        { key: 'name', label: 'Instructor Name', required: true },
        { key: 'bio', label: 'Biography', required: false },
        { key: 'profile_image_url', label: 'Profile Image URL', required: false },
      ];
    case 'categories':
      return [
        { key: 'name', label: 'Category Name', required: true },
        { key: 'description', label: 'Description', required: false },
        { key: 'color', label: 'Color (hex)', required: false },
      ];
    case 'tags':
      return [
        { key: 'name', label: 'Tag Name', required: true },
        { key: 'slug', label: 'URL Slug', required: false },
      ];
    default:
      return [];
  }
};

export const ColumnMapper: React.FC<ColumnMapperProps> = ({ importRecord, headers }) => {
  const targetFields = getTargetFields(importRecord.target_entity);
  const [mapping, setMapping] = useState<Record<string, string>>(
    importRecord.mapping_config?.field_mappings || {}
  );
  
  const updateImport = useUpdateDataImport();

  // Auto-map columns on load for knowledge_items imports if no existing mappings
  useEffect(() => {
    const existingMappings = Object.values(mapping).filter(val => val).length;
    if (existingMappings === 0 && importRecord.target_entity === 'knowledge_items' && headers.length > 0) {
      autoMap();
    }
  }, [headers, importRecord.target_entity]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleMappingChange = (targetField: string, sourceColumn: string) => {
    setMapping(prev => ({
      ...prev,
      [targetField]: sourceColumn === 'unmapped' ? '' : sourceColumn,
    }));
  };

  const autoMap = () => {
    const autoMappings: Record<string, string> = {};
    
    targetFields.forEach(field => {
      const fieldKey = field.key.toLowerCase();
      
      // Try exact match first
      let matchedHeader = headers.find(header => 
        header.toLowerCase() === fieldKey ||
        header.toLowerCase() === field.label.toLowerCase()
      );
      
      // Try partial matches if no exact match
      if (!matchedHeader) {
        matchedHeader = headers.find(header => 
          header.toLowerCase().includes(fieldKey) ||
          fieldKey.includes(header.toLowerCase().replace(/[^a-z]/g, ''))
        );
      }
      
      // Special mappings for knowledge items Excel structure
      if (!matchedHeader) {
        const specialMappings: Record<string, string[]> = {
          name: ['knowledge item', 'title', 'activity', 'technique'],
          description: ['knowledge item description', 'desc', 'content'],
          summary: ['brief', 'overview', 'generic summary', 'narrative form'],
          purpose: ['why', 'generic why', 'objective'],
          originator: ['source', 'author', 'created by'],
          difficulty_level: ['difficulty', 'level'],
          category_name: ['category'],
          activity_domain_name: ['domain of interest'],
          planning_layers: ['planning layer'],
          generic_who: ['generic use case - who'],
          generic_what: ['generic use case - what'],
          generic_when: ['generic use case - when'],
          generic_where: ['generic use case - where'],
          generic_why: ['generic use case - why'],
          generic_how: ['generic use case - how'],
          example_who: ['example / use case - who'],
          example_what: ['example / use case - what'],
          example_when: ['example / use case - when'],
          example_where: ['example / use case - where'],
          example_why: ['example / use case - why'],
          example_how: ['example / use case - how'],
          example_use_case: ['example / use case'],
          example_summary: ['example / use case - summary'],
          tags: ['tag', 'keywords'],
          start_date: ['date', 'when', 'start'],
          capacity: ['max', 'limit', 'size'],
        };
        
        const alternatives = specialMappings[fieldKey] || [];
        matchedHeader = headers.find(header => 
          alternatives.some(alt => 
            header.toLowerCase().includes(alt) || alt.includes(header.toLowerCase())
          )
        );
      }
      
      if (matchedHeader) {
        autoMappings[field.key] = matchedHeader;
      }
    });
    
    setMapping(autoMappings);
  };

  const resetMapping = () => {
    setMapping({});
  };

  const saveMappingConfig = async () => {
    try {
      await updateImport.mutateAsync({
        id: importRecord.id,
        updates: {
          mapping_config: {
            ...importRecord.mapping_config,
            field_mappings: mapping,
            updated_at: new Date().toISOString(),
          },
        },
      });
    } catch (error) {
      console.error('Failed to save mapping config:', error);
    }
  };

  const getMappedFields = () => {
    return Object.entries(mapping).filter(([_, sourceCol]) => sourceCol).length;
  };

  const getRequiredMappedFields = () => {
    return targetFields.filter(field => field.required && mapping[field.key]).length;
  };

  const getRequiredFieldsCount = () => {
    return targetFields.filter(field => field.required).length;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Column Mapping Configuration</CardTitle>
        <CardDescription>
          Map your source columns to target database fields. Required fields must be mapped to proceed with processing.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-x-2">
            <Button variant="outline" onClick={autoMap}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Auto Map
            </Button>
            <Button variant="outline" onClick={resetMapping}>
              Reset
            </Button>
            <Button onClick={saveMappingConfig} disabled={updateImport.isPending}>
              <Save className="h-4 w-4 mr-2" />
              Save Mapping
            </Button>
          </div>
          
          <div className="flex space-x-4 text-sm text-muted-foreground">
            <span>
              Required: {getRequiredMappedFields()}/{getRequiredFieldsCount()}
            </span>
            <span>
              Total: {getMappedFields()}/{targetFields.length}
            </span>
          </div>
        </div>

        <div className="grid gap-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Target Field</TableHead>
                <TableHead>Required</TableHead>
                <TableHead>Source Column</TableHead>
                <TableHead>Preview</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {targetFields.map((field) => (
                <TableRow key={field.key}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{field.label}</div>
                      <div className="text-xs text-muted-foreground">
                        {field.key}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {field.required && (
                      <Badge variant="destructive" className="text-xs">
                        Required
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Select
                      value={mapping[field.key] || 'unmapped'}
                      onValueChange={(value) => handleMappingChange(field.key, value)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unmapped">
                          <span className="text-muted-foreground">Not mapped</span>
                        </SelectItem>
                        {headers.map((header) => (
                          <SelectItem key={header} value={header}>
                            {header}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <div className="text-xs text-muted-foreground max-w-[200px] truncate">
                      {mapping[field.key] ? (
                        `Column: ${mapping[field.key]}`
                      ) : (
                        'No preview available'
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {getRequiredMappedFields() === getRequiredFieldsCount() && (
          <div className="flex justify-end">
            <Button>
              <Play className="h-4 w-4 mr-2" />
              Process Data
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};