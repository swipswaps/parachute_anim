import React, { useState } from 'react';
import { 
  Info, 
  ChevronDown, 
  ChevronUp, 
  Calendar, 
  FileType, 
  User, 
  Tag,
  Clock
} from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';

export default function ModelInfo({ model }) {
  const [expanded, setExpanded] = useState(false);
  
  if (!model) return null;
  
  const toggleExpanded = () => setExpanded(!expanded);
  
  // Format date
  const formatDate = (timestamp) => {
    if (!timestamp) return 'Unknown';
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString(undefined, { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };
  
  // Format time ago
  const formatTimeAgo = (timestamp) => {
    if (!timestamp) return '';
    
    const seconds = Math.floor((Date.now() / 1000) - timestamp);
    
    if (seconds < 60) return 'just now';
    
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days} day${days !== 1 ? 's' : ''} ago`;
    
    const months = Math.floor(days / 30);
    if (months < 12) return `${months} month${months !== 1 ? 's' : ''} ago`;
    
    const years = Math.floor(months / 12);
    return `${years} year${years !== 1 ? 's' : ''} ago`;
  };
  
  return (
    <div className="absolute top-4 left-4 max-w-xs">
      <div className="bg-white bg-opacity-90 rounded-lg shadow-md overflow-hidden">
        <div 
          className="p-3 flex justify-between items-center cursor-pointer hover:bg-gray-50"
          onClick={toggleExpanded}
        >
          <div className="flex items-center">
            <Info className="h-5 w-5 text-blue-500 mr-2" />
            <h3 className="font-medium truncate" title={model.name}>
              {model.name}
            </h3>
          </div>
          <Button variant="ghost" size="sm" className="p-1 h-auto">
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
        
        {expanded && (
          <div className="p-3 pt-0 border-t border-gray-100">
            <div className="space-y-2 text-sm">
              {/* Format */}
              <div className="flex items-start">
                <FileType className="h-4 w-4 text-gray-500 mr-2 mt-0.5" />
                <div>
                  <p className="text-gray-700">Format</p>
                  <Badge variant="outline" className="mt-1">
                    {model.format.toUpperCase()}
                  </Badge>
                </div>
              </div>
              
              {/* Created date */}
              <div className="flex items-start">
                <Calendar className="h-4 w-4 text-gray-500 mr-2 mt-0.5" />
                <div>
                  <p className="text-gray-700">Created</p>
                  <p className="text-gray-900">
                    {formatDate(model.createdAt)}
                    <span className="text-gray-500 text-xs ml-2">
                      ({formatTimeAgo(model.createdAt)})
                    </span>
                  </p>
                </div>
              </div>
              
              {/* Creator */}
              {model.creator && (
                <div className="flex items-start">
                  <User className="h-4 w-4 text-gray-500 mr-2 mt-0.5" />
                  <div>
                    <p className="text-gray-700">Creator</p>
                    <p className="text-gray-900">{model.creator}</p>
                  </div>
                </div>
              )}
              
              {/* Tags */}
              {model.tags && model.tags.length > 0 && (
                <div className="flex items-start">
                  <Tag className="h-4 w-4 text-gray-500 mr-2 mt-0.5" />
                  <div>
                    <p className="text-gray-700">Tags</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {model.tags.map((tag, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              
              {/* Processing time */}
              {model.processingTime && (
                <div className="flex items-start">
                  <Clock className="h-4 w-4 text-gray-500 mr-2 mt-0.5" />
                  <div>
                    <p className="text-gray-700">Processing Time</p>
                    <p className="text-gray-900">{model.processingTime} seconds</p>
                  </div>
                </div>
              )}
              
              {/* Description */}
              {model.description && (
                <div className="mt-2 pt-2 border-t border-gray-100">
                  <p className="text-gray-700">{model.description}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
