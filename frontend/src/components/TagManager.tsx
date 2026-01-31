import { useState } from 'react';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Input } from './ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from './ui/popover';
import { X, Plus, Tag as TagIcon } from 'lucide-react';

export interface Tag {
  id: string;
  name: string;
  color: string;
}

interface TagManagerProps {
  tags: Tag[];
  selectedTags?: string[];
  onAddTag?: (tag: Tag) => void;
  onRemoveTag?: (tagId: string) => void;
  onToggleTag?: (tagId: string) => void;
  mode?: 'display' | 'manage' | 'filter';
  className?: string;
}

const predefinedColors = [
  '#ef4444', // red
  '#f59e0b', // orange
  '#eab308', // yellow
  '#10b981', // green
  '#3b82f6', // blue
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#6b7280', // gray
];

export function TagManager({
  tags,
  selectedTags = [],
  onAddTag,
  onRemoveTag,
  onToggleTag,
  mode = 'display',
  className,
}: TagManagerProps) {
  const [newTagName, setNewTagName] = useState('');
  const [selectedColor, setSelectedColor] = useState(predefinedColors[0]);
  const [isOpen, setIsOpen] = useState(false);

  const handleCreateTag = () => {
    if (!newTagName.trim() || !onAddTag) return;

    const newTag: Tag = {
      id: Date.now().toString(),
      name: newTagName.trim(),
      color: selectedColor,
    };

    onAddTag(newTag);
    setNewTagName('');
    setSelectedColor(predefinedColors[0]);
  };

  if (mode === 'display') {
    return (
      <div className={`flex flex-wrap gap-1.5 ${className}`}>
        {tags
          .filter((tag) => selectedTags.includes(tag.id))
          .map((tag) => (
            <Badge
              key={tag.id}
              variant="outline"
              style={{
                borderColor: tag.color,
                color: tag.color,
                backgroundColor: `${tag.color}15`,
              }}
              className="text-xs gap-1"
            >
              <TagIcon className="h-3 w-3" />
              {tag.name}
            </Badge>
          ))}
      </div>
    );
  }

  if (mode === 'filter') {
    return (
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <TagIcon className="h-4 w-4" />
            Tags
            {selectedTags.length > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                {selectedTags.length}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-2" align="start">
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {tags.map((tag) => {
              const isSelected = selectedTags.includes(tag.id);
              return (
                <button
                  key={tag.id}
                  onClick={() => onToggleTag?.(tag.id)}
                  className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors ${
                    isSelected
                      ? 'bg-accent text-accent-foreground'
                      : 'hover:bg-accent/50'
                  }`}
                >
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: tag.color }}
                  />
                  <span className="flex-1 text-left">{tag.name}</span>
                  {isSelected && (
                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                  )}
                </button>
              );
            })}
            {tags.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No tags available
              </p>
            )}
          </div>
        </PopoverContent>
      </Popover>
    );
  }

  // mode === 'manage'
  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex flex-wrap gap-2">
        {tags
          .filter((tag) => selectedTags.includes(tag.id))
          .map((tag) => (
            <Badge
              key={tag.id}
              variant="outline"
              style={{
                borderColor: tag.color,
                color: tag.color,
                backgroundColor: `${tag.color}15`,
              }}
              className="text-xs gap-1.5 pr-1"
            >
              <TagIcon className="h-3 w-3" />
              {tag.name}
              {onRemoveTag && (
                <button
                  onClick={() => onRemoveTag(tag.id)}
                  className="ml-1 hover:bg-background/20 rounded-sm p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </Badge>
          ))}
      </div>

      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            Add Tag
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80" align="start">
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Tag Name</label>
              <Input
                placeholder="Enter tag name..."
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleCreateTag();
                  }
                }}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Color</label>
              <div className="grid grid-cols-8 gap-2">
                {predefinedColors.map((color) => (
                  <button
                    key={color}
                    onClick={() => setSelectedColor(color)}
                    className={`h-8 w-8 rounded-md transition-all ${
                      selectedColor === color
                        ? 'ring-2 ring-primary ring-offset-2'
                        : 'hover:scale-110'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            <div className="border-t pt-3">
              <h4 className="text-sm font-medium mb-2">Available Tags</h4>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {tags.map((tag) => {
                  const isSelected = selectedTags.includes(tag.id);
                  return (
                    <button
                      key={tag.id}
                      onClick={() => onToggleTag?.(tag.id)}
                      className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors ${
                        isSelected
                          ? 'bg-accent text-accent-foreground'
                          : 'hover:bg-accent/50'
                      }`}
                    >
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: tag.color }}
                      />
                      <span className="flex-1 text-left">{tag.name}</span>
                      {isSelected && (
                        <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <Button
              onClick={handleCreateTag}
              disabled={!newTagName.trim()}
              className="w-full"
              size="sm"
            >
              Create Tag
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
