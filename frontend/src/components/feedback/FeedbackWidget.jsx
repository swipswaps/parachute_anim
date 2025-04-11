import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ThumbsUp, ThumbsDown, X, MessageSquare } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { useNotifications } from '../../contexts/NotificationContext';
import useAnalytics from '../../hooks/useAnalytics';
import FeedbackForm from './FeedbackForm';

/**
 * FeedbackWidget component for quick feedback collection
 * 
 * @param {Object} props - Component props
 * @param {string} props.pageId - ID of the current page
 * @param {string} props.feature - Feature being rated
 */
export default function FeedbackWidget({ pageId, feature }) {
  const { t } = useTranslation();
  const { showSuccess } = useNotifications();
  const { trackConversion } = useAnalytics();
  const [isVisible, setIsVisible] = useState(true);
  const [showForm, setShowForm] = useState(false);
  
  // Handle positive feedback
  const handlePositive = () => {
    setIsVisible(false);
    showSuccess(t('feedback.thankYou'), t('feedback.positiveFeedbackReceived'));
    
    trackConversion('quick_feedback', {
      pageId,
      feature,
      sentiment: 'positive',
    });
  };
  
  // Handle negative feedback
  const handleNegative = () => {
    setShowForm(true);
    setIsVisible(false);
    
    trackConversion('quick_feedback', {
      pageId,
      feature,
      sentiment: 'negative',
    });
  };
  
  // Dismiss feedback widget
  const handleDismiss = () => {
    setIsVisible(false);
    
    trackConversion('feedback_dismiss', {
      pageId,
      feature,
    });
  };
  
  if (!isVisible) {
    return null;
  }
  
  return (
    <Card className="fixed bottom-4 right-4 z-50 shadow-lg w-80 animate-slide-up">
      <CardContent className="p-4">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-sm font-medium">{t('feedback.quickQuestion')}</h3>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDismiss}
            aria-label={t('feedback.dismiss')}
            className="h-6 w-6"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <p className="text-sm text-gray-500 mb-3">
          {t('feedback.wasThisHelpful', { feature: t(`features.${feature}`) })}
        </p>
        
        <div className="flex space-x-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={handlePositive}
          >
            <ThumbsUp className="h-4 w-4 mr-2" />
            {t('feedback.yes')}
          </Button>
          
          <Button
            variant="outline"
            className="flex-1"
            onClick={handleNegative}
          >
            <ThumbsDown className="h-4 w-4 mr-2" />
            {t('feedback.no')}
          </Button>
          
          <Button
            variant="outline"
            size="icon"
            onClick={() => setShowForm(true)}
            aria-label={t('feedback.moreFeedback')}
          >
            <MessageSquare className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
      
      {showForm && <FeedbackForm />}
    </Card>
  );
}
