import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { hexPoints, wrapLines, ensureOpaqueFill, getLightTint } from '../hex-utils';
import { HexiFloatingToolbar } from './HexiFloatingToolbar';
import { ArtifactLinkDialog } from './ArtifactLinkDialog';
import { ArtifactLinkEditorDialog } from './ArtifactLinkEditorDialog';
import { 
  Plus, 
  Link2, 
  ExternalLink, 
  File, 
  FileText, 
  Image, 
  Video, 
  Music, 
  Table, 
  Presentation,
  LayoutGrid,
  ListTodo,
  BookOpen,
  User,
  Heart,
  Route,
  Hexagon,
  type LucideIcon
} from 'lucide-react';

// Icon map for dynamic icon lookup
const ICON_MAP: Record<string, LucideIcon> = {
  Plus,
  Link2,
  ExternalLink,
  File,
  FileText,
  Image,
  Video,
  Music,
  Table,
  Presentation,
  LayoutGrid,
  ListTodo,
  BookOpen,
  User,
  Heart,
  Route,
  Hexagon,
};

export interface ArtifactLinkData {
  linkType: 'placeholder' | 'artifact' | 'file' | 'external';
  // For artifact links
  linkedArtifactId?: string;
  artifactType?: string;
  artifactName?: string;
  // For file links
  fileUrl?: string;
  fileName?: string;
  fileType?: string;
  // For external links
  externalUrl?: string;
  // Display properties
  label: string;
  icon?: string;
  emoji?: string;
  color: string;
  borderColor?: string;
  fillColor?: string;
  description?: string;
}

export interface ArtifactLinkHexiElementProps {
  id: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  data: ArtifactLinkData;
  isSelected?: boolean;
  isMultiSelected?: boolean;
  isMarqueeSelecting?: boolean;
  projectId?: string;
  onSelect?: (e?: React.MouseEvent, preserveIfSelected?: boolean) => void;
  onMove?: (newPos: { x: number; y: number }) => void;
  onMoveGroup?: (delta: { dx: number; dy: number }) => void;
  onGroupDragStart?: () => void;
  onGroupDragProgress?: (delta: { dx: number; dy: number }) => void;
  onContentChange?: (newData: ArtifactLinkData) => void;
  onDelete?: () => void;
  onDuplicate?: () => void;
}

const getIconForLinkType = (data: ArtifactLinkData): string => {
  if (data.icon) return data.icon;
  
  switch (data.linkType) {
    case 'placeholder':
      return 'Plus';
    case 'artifact':
      return getArtifactTypeIcon(data.artifactType);
    case 'file':
      return getFileTypeIcon(data.fileType);
    case 'external':
      return 'ExternalLink';
    default:
      return 'Link2';
  }
};

const getArtifactTypeIcon = (artifactType?: string): string => {
  switch (artifactType) {
    case 'bmc':
      return 'LayoutGrid';
    case 'product-backlog':
      return 'ListTodo';
    case 'user-story-canvas':
      return 'BookOpen';
    case 'user-persona':
      return 'User';
    case 'empathy-map':
      return 'Heart';
    case 'journey-map':
      return 'Route';
    case 'project-model':
      return 'Hexagon';
    default:
      return 'FileText';
  }
};

const getFileTypeIcon = (fileType?: string): string => {
  if (!fileType) return 'File';
  if (fileType.includes('pdf')) return 'FileText';
  if (fileType.includes('image')) return 'Image';
  if (fileType.includes('video')) return 'Video';
  if (fileType.includes('audio')) return 'Music';
  if (fileType.includes('spreadsheet') || fileType.includes('excel')) return 'Table';
  if (fileType.includes('document') || fileType.includes('word')) return 'FileText';
  if (fileType.includes('presentation') || fileType.includes('powerpoint')) return 'Presentation';
  return 'File';
};

const getDefaultColor = (linkType: string): string => {
  switch (linkType) {
    case 'placeholder':
      return '#9CA3AF';
    case 'artifact':
      return '#3B82F6';
    case 'file':
      return '#10B981';
    case 'external':
      return '#8B5CF6';
    default:
      return '#6B7280';
  }
};

export const ArtifactLinkHexiElement: React.FC<ArtifactLinkHexiElementProps> = ({
  id,
  position,
  size,
  data,
  isSelected,
  isMultiSelected,
  isMarqueeSelecting,
  projectId,
  onSelect,
  onMove,
  onMoveGroup,
  onGroupDragStart,
  onGroupDragProgress,
  onContentChange,
  onDelete,
  onDuplicate,
}) => {
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [showEditorDialog, setShowEditorDialog] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ x: number; y: number; startX: number; startY: number } | null>(null);
  const navigate = useNavigate();

  const { width, height } = size;
  const borderColor = data.borderColor ?? data.color ?? getDefaultColor(data.linkType);
  const fillColor = data.linkType === 'placeholder' 
    ? 'transparent' 
    : ensureOpaqueFill(data.fillColor, borderColor);
  const isPlaceholder = data.linkType === 'placeholder';

  const iconName = getIconForLinkType(data);
  const IconComponent = ICON_MAP[iconName] || Link2;

  const handlePointerDown = (e: React.PointerEvent) => {
    if (isMarqueeSelecting) return;
    e.stopPropagation();
    
    const isAlreadySelected = isSelected;
    onSelect?.(e, true);
    
    if (isMultiSelected && isAlreadySelected) {
      onGroupDragStart?.();
    }
    
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      startX: position.x,
      startY: position.y,
    };
    setIsDragging(true);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || !dragStartRef.current) return;
    
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    
    if (isMultiSelected) {
      onGroupDragProgress?.({ dx, dy });
    } else {
      const newX = Math.max(0, dragStartRef.current.startX + dx);
      const newY = Math.max(0, dragStartRef.current.startY + dy);
      onMove?.({ x: newX, y: newY });
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isDragging || !dragStartRef.current) return;
    
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    
    if (isMultiSelected) {
      onMoveGroup?.({ dx, dy });
    }
    
    setIsDragging(false);
    dragStartRef.current = null;
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
  };

  const handleClick = (e: React.MouseEvent) => {
    if (isDragging) return;
    e.stopPropagation();
    
    // Double-click to open link
    if (e.detail === 2) {
      handleOpen();
    }
  };

  const handleOpen = () => {
    switch (data.linkType) {
      case 'placeholder':
        setShowLinkDialog(true);
        break;
      case 'artifact':
        if (data.linkedArtifactId && projectId) {
          navigate(`/projects/${projectId}/artifacts/${data.linkedArtifactId}`);
        }
        break;
      case 'file':
        if (data.fileUrl) {
          window.open(data.fileUrl, '_blank');
        }
        break;
      case 'external':
        if (data.externalUrl) {
          window.open(data.externalUrl, '_blank');
        }
        break;
    }
  };

  const handleLinkSave = (newData: ArtifactLinkData) => {
    onContentChange?.(newData);
    setShowLinkDialog(false);
  };

  const handleEditorSave = (newData: ArtifactLinkData) => {
    onContentChange?.(newData);
    setShowEditorDialog(false);
  };

  const handleUnlink = () => {
    onContentChange?.({
      ...data,
      linkType: 'placeholder',
      linkedArtifactId: undefined,
      artifactType: undefined,
      artifactName: undefined,
      fileUrl: undefined,
      fileName: undefined,
      fileType: undefined,
      externalUrl: undefined,
      label: 'Link...',
      color: getDefaultColor('placeholder'),
    });
  };

  const lines = wrapLines(data.label || 'Link...', 14, 2);

  return (
    <>
      <div
        className="absolute select-none"
        style={{
          left: position.x,
          top: position.y,
          width,
          height,
          cursor: isDragging ? 'grabbing' : 'grab',
          zIndex: isSelected ? 100 : 1,
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onClick={handleClick}
      >
        {/* Floating toolbar when selected */}
        {isSelected && !isMultiSelected && !isMarqueeSelecting && (
          <HexiFloatingToolbar
            onView={handleOpen}
            onEdit={() => setShowEditorDialog(true)}
            onDuplicate={onDuplicate}
            onDelete={onDelete}
            showView={data.linkType !== 'placeholder'}
          />
        )}

        {/* Multi-selection indicator */}
        {isMultiSelected && (
          <div className="absolute -inset-2 border-2 border-primary rounded-lg pointer-events-none z-10" />
        )}

        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
          {/* Hexagon shape */}
          <polygon
            points={hexPoints(width, height)}
            fill={fillColor}
            stroke={borderColor}
            strokeWidth={isSelected ? 3 : 2}
            strokeDasharray={isPlaceholder ? '6 4' : undefined}
            className="transition-all duration-150"
          />

          {/* Icon */}
          <g transform={`translate(${width / 2}, ${height / 2 - 12})`}>
            {data.emoji ? (
              <text
                x={0}
                y={4}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={24}
              >
                {data.emoji}
              </text>
            ) : (
              <foreignObject x={-12} y={-12} width={24} height={24}>
                <div className="flex items-center justify-center w-full h-full" style={{ color: borderColor }}>
                  <IconComponent className="w-5 h-5" />
                </div>
              </foreignObject>
            )}
          </g>

          {/* Label */}
          {lines.map((line, i) => (
            <text
              key={i}
              x={width / 2}
              y={height / 2 + 16 + i * 14}
              textAnchor="middle"
              fontSize={11}
              fontWeight={500}
              fill={isPlaceholder ? '#9CA3AF' : '#374151'}
              className="pointer-events-none"
            >
              {line}
            </text>
          ))}

          {/* Link type badge */}
          {data.linkType !== 'placeholder' && (
            <g transform={`translate(${width - 20}, 14)`}>
              <circle cx={0} cy={0} r={8} fill={borderColor} />
              <foreignObject x={-6} y={-6} width={12} height={12}>
                <div className="flex items-center justify-center w-full h-full text-white">
                  {data.linkType === 'artifact' && <Link2 className="w-3 h-3" />}
                  {data.linkType === 'file' && <File className="w-3 h-3" />}
                  {data.linkType === 'external' && <ExternalLink className="w-3 h-3" />}
                </div>
              </foreignObject>
            </g>
          )}
        </svg>
      </div>

      {/* Link Dialog */}
      <ArtifactLinkDialog
        isOpen={showLinkDialog}
        onClose={() => setShowLinkDialog(false)}
        data={data}
        projectId={projectId}
        onSave={handleLinkSave}
      />

      {/* Editor Dialog */}
      <ArtifactLinkEditorDialog
        isOpen={showEditorDialog}
        onClose={() => setShowEditorDialog(false)}
        data={data}
        onSave={handleEditorSave}
        onDelete={onDelete}
        onDuplicate={onDuplicate}
        onUnlink={handleUnlink}
      />
    </>
  );
};
