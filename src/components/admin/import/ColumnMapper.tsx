import React, { useState } from 'react';
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
    case 'knowledge_techniques':
      return [
        { key: 'name', label: 'Name/Title', required: true },
        { key: 'description', label: 'Description', required: false },
        { key: 'summary', label: 'Summary', required: false },
        { key: 'purpose', label: 'Purpose', required: false },
        { key: 'difficulty_level', label: 'Difficulty Level', required: false },
        { key: 'estimated_reading_time', label: 'Reading Time (minutes)', required: false },
        { key: 'originator', label: 'Originator/Source', required: false },
        { key: 'category_name', label: 'Category Name', required: false },
        { key: 'tags', label: 'Tags (comma-separated)', required: false },
        { key: 'is_published', label: 'Published (true/false)', required: false },
        { key: 'is_featured', label: 'Featured (true/false)', required: false },
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
      
      // Special mappings for common variations
      if (!matchedHeader) {
        const specialMappings: Record<string, string[]> = {
          name: ['title', 'activity', 'technique', 'event'],
          description: ['desc', 'content', 'activity description'],
          summary: ['brief', 'overview', 'generic summary'],
          purpose: ['why', 'generic why', 'objective'],
          originator: ['source', 'author', 'created by'],
          difficulty_level: ['difficulty', 'level'],
          category_name: ['category', 'type', 'domain'],
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