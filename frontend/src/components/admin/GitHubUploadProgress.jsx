import React from 'react';
import { useTranslation } from 'react-i18next';
import { AlertCircle, CheckCircle, Clock, FileText, Loader2 } from 'lucide-react';
import { Progress } from '../ui/progress';
import { formatElapsedTime, formatEta } from '../../utils/progressUtils';

/**
 * GitHub Upload Progress component
 * Displays progress information for GitHub repository uploads
 */
export default function GitHubUploadProgress({ progress, className = '' }) {
  const { t } = useTranslation();
  
  if (!progress) {
    return null;
  }
  
  const {
    total,
    completed,
    failed,
    skipped,
    percentage,
    eta,
    elapsedMs,
    isActive,
  } = progress;
  
  const remaining = total - (completed + failed + skipped);
  const formattedElapsed = formatElapsedTime(elapsedMs);
  const formattedEta = formatEta(eta);
  
  return (
    <div className={`space-y-3 ${className}`}>
      {/* Progress bar */}
      <div className="space-y-1">
        <div className="flex justify-between text-sm">
          <span>{t('github.progress.uploading')}</span>
          <span>{percentage}%</span>
        </div>
        <Progress value={percentage} className="h-2" />
      </div>
      
      {/* Stats */}
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div className="flex items-center">
          <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
          <span>{t('github.progress.completed')}: {completed}</span>
        </div>
        
        <div className="flex items-center">
          <AlertCircle className="h-4 w-4 mr-2 text-red-500" />
          <span>{t('github.progress.failed')}: {failed}</span>
        </div>
        
        <div className="flex items-center">
          <FileText className="h-4 w-4 mr-2 text-gray-500" />
          <span>{t('github.progress.remaining')}: {remaining}</span>
        </div>
        
        <div className="flex items-center">
          <FileText className="h-4 w-4 mr-2 text-gray-500" />
          <span>{t('github.progress.total')}: {total}</span>
        </div>
      </div>
      
      {/* Time information */}
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div className="flex items-center">
          <Clock className="h-4 w-4 mr-2 text-blue-500" />
          <span>{t('github.progress.elapsed')}: {formattedElapsed}</span>
        </div>
        
        {isActive && (
          <div className="flex items-center">
            <Clock className="h-4 w-4 mr-2 text-blue-500" />
            <span>{t('github.progress.eta')}: {formattedEta}</span>
          </div>
        )}
      </div>
      
      {/* Status */}
      {isActive ? (
        <div className="flex items-center text-sm text-blue-600">
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          <span>{t('github.progress.inProgress')}</span>
        </div>
      ) : percentage === 100 ? (
        <div className="flex items-center text-sm text-green-600">
          <CheckCircle className="h-4 w-4 mr-2" />
          <span>{t('github.progress.complete')}</span>
        </div>
      ) : (
        <div className="flex items-center text-sm text-yellow-600">
          <AlertCircle className="h-4 w-4 mr-2" />
          <span>{t('github.progress.stopped')}</span>
        </div>
      )}
    </div>
  );
}
