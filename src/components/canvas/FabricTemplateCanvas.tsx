import React, { useEffect, useRef, useState, useCallback, useImperativeHandle } from 'react';
import { Canvas as FabricCanvas, FabricText, Rect, Circle, FabricImage, Group, Point } from 'fabric';
import { cn } from '@/lib/utils';
import type { 
  EnhancedTemplateConfig, 
  TemplateElement, 
  TemplateElementType,
  CanvasState,
  CanvasSelection,
  CanvasViewport,
  CanvasTools
} from '@/types/template-enhanced';

export interface FabricTemplateCanvasProps {
  config?: EnhancedTemplateConfig;
  isEditable?: boolean;
  onConfigChange?: (config: EnhancedTemplateConfig) => void;
  onSelectionChange?: (selection: CanvasSelection) => void;
  className?: string;
  width?: number;
  height?: number;
}

export interface FabricTemplateCanvasRef {
  exportCanvas: (format?: 'png' | 'jpeg' | 'svg' | 'pdf') => Promise<string>;
  getCanvas: () => FabricCanvas | null;
  addElement: (type: TemplateElementType, position?: { x: number; y: number }) => void;
  deleteSelected: () => void;
  undo: () => void;
  redo: () => void;
  zoomToFit: () => void;
  setTool: (tool: CanvasTools['activeTool']) => void;
}

const FabricTemplateCanvas = React.forwardRef<FabricTemplateCanvasRef, FabricTemplateCanvasProps>(({
  config,
  isEditable = false,
  onConfigChange,
  onSelectionChange,
  className,
  width = 800,
  height = 600
}, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<FabricCanvas | null>(null);
  
  const [canvasState, setCanvasState] = useState<CanvasState>({
    config: config || getDefaultConfig(),
    selection: { elementIds: [] },
    viewport: { 
      zoom: 1, 
      pan: { x: 0, y: 0 },
      bounds: { minZoom: 0.1, maxZoom: 5, width, height }
    },
    tools: { activeTool: 'select' },
    history: { states: [], currentIndex: -1, maxStates: 50 },
    isDirty: false,
    isLoading: false
  });

  // Initialize Fabric.js canvas
  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = new FabricCanvas(canvasRef.current, {
      width,
      height,
      backgroundColor: canvasState.config.canvas.background.color,
      selection: isEditable,
      preserveObjectStacking: true,
    });

    // Configure canvas for editing
    if (isEditable) {
      canvas.on('selection:created', handleSelectionCreated);
      canvas.on('selection:updated', handleSelectionUpdated);
      canvas.on('selection:cleared', handleSelectionCleared);
      canvas.on('object:modified', handleObjectModified);
    } else {
      canvas.selection = false;
      canvas.forEachObject((obj) => {
        obj.selectable = false;
        obj.evented = false;
      });
    }

    fabricCanvasRef.current = canvas;

    return () => {
      canvas.dispose();
    };
  }, [isEditable, width, height]);

  // Update canvas when config changes
  useEffect(() => {
    if (!fabricCanvasRef.current || !config) return;
    renderElements();
  }, [config]);

  // Update canvas background
  useEffect(() => {
    if (!fabricCanvasRef.current) return;
    fabricCanvasRef.current.backgroundColor = canvasState.config.canvas.background.color;
    fabricCanvasRef.current.renderAll();
  }, [canvasState.config.canvas.background.color]);

  const handleSelectionCreated = useCallback((e: any) => {
    const selection = getSelectionFromFabric(e.selected);
    setCanvasState(prev => ({ ...prev, selection }));
    onSelectionChange?.(selection);
  }, [onSelectionChange]);

  const handleSelectionUpdated = useCallback((e: any) => {
    const selection = getSelectionFromFabric(e.selected);
    setCanvasState(prev => ({ ...prev, selection }));
    onSelectionChange?.(selection);
  }, [onSelectionChange]);

  const handleSelectionCleared = useCallback(() => {
    const selection = { elementIds: [] };
    setCanvasState(prev => ({ ...prev, selection }));
    onSelectionChange?.(selection);
  }, [onSelectionChange]);

  const handleObjectModified = useCallback((e: any) => {
    // Update element in config when modified
    if (!e.target || !(e.target as any).templateElementId) return;
    
    const elementId = (e.target as any).templateElementId;
    const updatedConfig = updateElementFromFabricObject(canvasState.config, elementId, e.target);
    
    setCanvasState(prev => ({ ...prev, config: updatedConfig, isDirty: true }));
    onConfigChange?.(updatedConfig);
  }, [canvasState.config, onConfigChange]);

  const renderElements = useCallback(() => {
    if (!fabricCanvasRef.current || !canvasState.config) return;

    const canvas = fabricCanvasRef.current;
    canvas.clear();

    // Render each element
    canvasState.config.elements.forEach(element => {
      const fabricObject = createFabricObjectFromElement(element);
      if (fabricObject) {
        // Add custom property safely
        (fabricObject as any).templateElementId = element.id;
        canvas.add(fabricObject);
      }
    });

    canvas.renderAll();
  }, [canvasState.config]);

  const createFabricObjectFromElement = (element: TemplateElement) => {
    const { x, y, width, height, style, content } = element;
    
    // Safety check for content
    if (!content || !content.type) {
      console.warn('Element missing content or content.type:', element);
      return null;
    }
    
    const commonProps = {
      left: x,
      top: y,
      width,
      height,
      fill: style.fill || '#000000',
      stroke: style.stroke,
      strokeWidth: style.strokeWidth || 0,
      opacity: style.opacity || 1,
      angle: style.rotation || 0,
      selectable: isEditable,
      evented: isEditable,
    };

    switch (content.type) {
      case 'text': {
        const textContent = content as any;
        return new FabricText(textContent.text, {
          ...commonProps,
          fontFamily: style.fontFamily || 'Arial',
          fontSize: style.fontSize || 16,
          fontWeight: style.fontWeight || 'normal',
          fontStyle: style.fontStyle || 'normal',
          textAlign: style.textAlign || 'left',
          fill: style.color || style.fill || '#000000',
        });
      }

      case 'shape': {
        const shapeContent = content as any;
        switch (shapeContent.shapeType) {
          case 'rectangle':
            return new Rect(commonProps);
          case 'circle':
            return new Circle({
              ...commonProps,
              radius: Math.min(width, height) / 2,
            });
          default:
            return new Rect(commonProps);
        }
      }

      case 'image': {
        const imageContent = content as any;
        // Handle image loading asynchronously - for now return a placeholder
        const placeholder = new Rect({
          ...commonProps,
          fill: '#f3f4f6',
          stroke: '#d1d5db',
        });
        
        // Load actual image if src exists
        if (imageContent.src) {
          FabricImage.fromURL(imageContent.src).then((img) => {
            img.set(commonProps);
            // Replace placeholder with actual image
            const canvas = fabricCanvasRef.current;
            if (canvas) {
              canvas.remove(placeholder);
              (img as any).templateElementId = (placeholder as any).templateElementId;
              canvas.add(img);
              canvas.renderAll();
            }
          }).catch(() => {
            // Keep placeholder on error
          });
        }
        
        return placeholder;
      }

      default:
        return null;
    }
  };

  const getSelectionFromFabric = (selected: any[]): CanvasSelection => {
    const elementIds = selected
      .filter(obj => (obj as any).templateElementId)
      .map(obj => (obj as any).templateElementId);

    // Calculate bounding box if there are selected elements
    let boundingBox;
    if (selected.length > 0) {
      const group = new Group(selected);
      const bounds = group.getBoundingRect();
      boundingBox = {
        x: bounds.left,
        y: bounds.top,
        width: bounds.width,
        height: bounds.height,
      };
    }

    return { elementIds, boundingBox };
  };

  const updateElementFromFabricObject = (
    config: EnhancedTemplateConfig, 
    elementId: string, 
    fabricObject: any
  ): EnhancedTemplateConfig => {
    const elements = config.elements.map(element => {
      if (element.id === elementId) {
        return {
          ...element,
          x: fabricObject.left,
          y: fabricObject.top,
          width: fabricObject.width * fabricObject.scaleX,
          height: fabricObject.height * fabricObject.scaleY,
          style: {
            ...element.style,
            rotation: fabricObject.angle,
          }
        };
      }
      return element;
    });

    return { ...config, elements };
  };

  const addElement = useCallback((type: TemplateElementType, position = { x: 100, y: 100 }) => {
    const newElement = createDefaultElement(type, position);
    const updatedConfig = {
      ...canvasState.config,
      elements: [...canvasState.config.elements, newElement]
    };

    setCanvasState(prev => ({ ...prev, config: updatedConfig, isDirty: true }));
    onConfigChange?.(updatedConfig);
  }, [canvasState.config, onConfigChange]);

  const deleteSelected = useCallback(() => {
    if (!fabricCanvasRef.current || canvasState.selection.elementIds.length === 0) return;

    const activeObjects = fabricCanvasRef.current.getActiveObjects();
    fabricCanvasRef.current.remove(...activeObjects);

    const elementsToDelete = new Set(canvasState.selection.elementIds);
    const updatedConfig = {
      ...canvasState.config,
      elements: canvasState.config.elements.filter(el => !elementsToDelete.has(el.id))
    };

    setCanvasState(prev => ({ 
      ...prev, 
      config: updatedConfig, 
      selection: { elementIds: [] },
      isDirty: true 
    }));
    onConfigChange?.(updatedConfig);
  }, [canvasState, onConfigChange]);

  const exportCanvas = useCallback(async (format: 'png' | 'jpeg' | 'svg' | 'pdf' = 'png'): Promise<string> => {
    if (!fabricCanvasRef.current) {
      throw new Error('Canvas not available for export');
    }

    const canvas = fabricCanvasRef.current;

    switch (format) {
      case 'svg':
        return canvas.toSVG();
      case 'png':
      case 'jpeg':
        return canvas.toDataURL({
          format: format as any,
          quality: 1,
          multiplier: 2, // For high resolution
        });
      case 'pdf':
        // For PDF, we'll export as PNG and let the caller handle PDF conversion
        const dataUrl = canvas.toDataURL({
          format: 'png' as any,
          quality: 1,
          multiplier: 2,
        });
        return dataUrl;
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }, []);

  const zoomToFit = useCallback(() => {
    if (!fabricCanvasRef.current) return;

    const canvas = fabricCanvasRef.current;
    const objects = canvas.getObjects();
    
    if (objects.length === 0) return;

    const group = new Group(objects);
    const bounds = group.getBoundingRect();
    
    const canvasWidth = canvas.getWidth();
    const canvasHeight = canvas.getHeight();
    
    const scaleX = (canvasWidth * 0.8) / bounds.width;
    const scaleY = (canvasHeight * 0.8) / bounds.height;
    const scale = Math.min(scaleX, scaleY);
    
    const centerX = canvasWidth / 2;
    const centerY = canvasHeight / 2;
    
    canvas.setZoom(scale);
    const panX = centerX - (bounds.left + bounds.width / 2) * scale;
    const panY = centerY - (bounds.top + bounds.height / 2) * scale;
    canvas.relativePan(new Point(panX, panY));
  }, []);

  const setTool = useCallback((tool: CanvasTools['activeTool']) => {
    setCanvasState(prev => ({
      ...prev,
      tools: { ...prev.tools, activeTool: tool }
    }));
  }, []);

  // Expose methods via ref
  useImperativeHandle(ref, () => ({
    exportCanvas,
    getCanvas: () => fabricCanvasRef.current,
    addElement,
    deleteSelected,
    undo: () => {}, // TODO: Implement undo/redo
    redo: () => {}, // TODO: Implement undo/redo
    zoomToFit,
    setTool,
  }));

  return (
    <div className={cn('relative bg-background rounded-lg overflow-hidden', className)}>
      <canvas 
        ref={canvasRef}
        className="border border-border"
      />
    </div>
  );
});

FabricTemplateCanvas.displayName = 'FabricTemplateCanvas';

export default FabricTemplateCanvas;

// Helper functions
function getDefaultConfig(): EnhancedTemplateConfig {
  return {
    canvas: {
      dimensions: { width: 800, height: 600 },
      grid: {
        enabled: true,
        size: 20,
        snap: true,
        visible: true,
        color: '#e5e7eb',
      },
      background: {
        color: '#ffffff',
        pattern: 'none',
      },
      export: {
        formats: ['png', 'jpeg', 'pdf', 'svg'],
        quality: 1,
        dpi: 300,
      },
      collaboration: {
        enabled: false,
        cursors: false,
        comments: false,
        realtime: false,
      },
    },
    elements: [],
    groups: {},
    layers: {},
    theme: {
      primaryColor: '#3b82f6',
      secondaryColor: '#64748b',
      accentColor: '#f59e0b',
      backgroundColor: '#ffffff',
      textColor: '#1f2937',
      fontFamily: 'Inter, sans-serif',
    },
    version: '1.0.0',
    created: new Date().toISOString(),
    modified: new Date().toISOString(),
    compatibility: ['1.0.0'],
  };
}

function createDefaultElement(type: TemplateElementType, position: { x: number; y: number }): TemplateElement {
  const id = `element-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  const baseElement = {
    id,
    type,
    x: position.x,
    y: position.y,
    width: 200,
    height: 100,
    zIndex: 0,
    style: {
      fill: '#3b82f6',
      stroke: '#1f2937',
      strokeWidth: 1,
      opacity: 1,
      visible: true,
      locked: false,
    },
    constraints: {
      resizable: true,
      draggable: true,
      snapToGrid: true,
    },
  };

  switch (type) {
    case 'text':
      return {
        ...baseElement,
        height: 40,
        content: {
          type: 'text',
          textType: 'plain',
          text: 'Click to edit text',
          editable: true,
        },
        style: {
          ...baseElement.style,
          fill: 'transparent',
          color: '#1f2937',
          fontSize: 16,
          fontFamily: 'Inter, sans-serif',
          textAlign: 'left',
        },
      };

    case 'shape':
      return {
        ...baseElement,
        content: {
          type: 'shape',
          shapeType: 'rectangle',
        },
      };

    case 'image':
      return {
        ...baseElement,
        content: {
          type: 'image',
          src: '',
          alt: 'Image placeholder',
          fit: 'cover',
          alignment: 'center',
        },
        style: {
          ...baseElement.style,
          fill: '#f3f4f6',
          stroke: '#d1d5db',
        },
      };

    default:
      return baseElement as TemplateElement;
  }
}