import React, { useState } from 'react';
import { HelpCircle, X } from 'lucide-react';
import { Tooltip } from '../ui/tooltip';
import { Button } from '../ui/button';

/**
 * HelpText component for providing contextual help
 * 
 * @param {Object} props - Component props
 * @param {string} props.title - Help title
 * @param {string|React.ReactNode} props.content - Help content
 * @param {string} props.tooltipContent - Short tooltip content
 * @param {string} props.placement - Tooltip placement
 * @param {string} props.className - Additional CSS classes
 */
export default function HelpText({
  title,
  content,
  tooltipContent,
  placement = 'top',
  className = '',
  iconSize = 16,
  iconClassName = 'text-gray-400 hover:text-gray-600',
  expandable = false,
  ...rest
}) {
  const [expanded, setExpanded] = useState(false);

  const toggleExpanded = () => {
    setExpanded(!expanded);
  };

  // If expandable, show a button that toggles the expanded state
  if (expandable) {
    return (
      <div className={`relative ${className}`} {...rest}>
        <Tooltip content={tooltipContent || 'Click for help'} side={placement}>
          <Button
            variant="ghost"
            size="sm"
            className="p-1 h-auto"
            onClick={toggleExpanded}
            aria-expanded={expanded}
            aria-label={expanded ? 'Hide help' : 'Show help'}
          >
            <HelpCircle className={`h-${iconSize / 4} w-${iconSize / 4} ${iconClassName}`} />
          </Button>
        </Tooltip>

        {expanded && (
          <div className="absolute z-50 mt-2 p-4 bg-white rounded-md shadow-lg border border-gray-200 w-64">
            <div className="flex justify-between items-center mb-2">
              <h4 className="font-medium text-gray-900">{title || 'Help'}</h4>
              <Button
                variant="ghost"
                size="sm"
                className="p-1 h-auto"
                onClick={toggleExpanded}
                aria-label="Close help"
              >
                <X className="h-4 w-4 text-gray-400" />
              </Button>
            </div>
            <div className="text-sm text-gray-600">{content}</div>
          </div>
        )}
      </div>
    );
  }

  // If not expandable, just show a tooltip
  return (
    <Tooltip content={content} side={placement}>
      <span className={`inline-flex items-center ${className}`} {...rest}>
        <HelpCircle className={`h-${iconSize / 4} w-${iconSize / 4} ${iconClassName}`} />
      </span>
    </Tooltip>
  );
}
