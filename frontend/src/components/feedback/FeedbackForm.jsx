import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MessageSquare, Star, ThumbsUp, ThumbsDown, Send, X } from 'lucide-react';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/dialog';
import { useNotifications } from '../../contexts/NotificationContext';
import useAnalytics from '../../hooks/useAnalytics';

/**
 * FeedbackForm component for collecting user feedback
 */
export default function FeedbackForm() {
  const { t } = useTranslation();
  const { showSuccess, showError } = useNotifications();
  const { trackConversion } = useAnalytics();
  const [isOpen, setIsOpen] = useState(false);
  const [feedbackType, setFeedbackType] = useState('general');
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState(1);
  
  // Open feedback form
  const openFeedback = () => {
    setIsOpen(true);
    resetForm();
    trackConversion('feedback_open');
  };
  
  // Close feedback form
  const closeFeedback = () => {
    setIsOpen(false);
  };
  
  // Reset form
  const resetForm = () => {
    setFeedbackType('general');
    setRating(0);
    setComment('');
    setEmail('');
    setStep(1);
  };
  
  // Handle rating change
  const handleRatingChange = (newRating) => {
    setRating(newRating);
  };
  
  // Handle next step
  const handleNextStep = () => {
    if (step === 1 && !feedbackType) {
      showError(t('feedback.selectType'), t('feedback.selectTypeMessage'));
      return;
    }
    
    if (step === 2 && rating === 0) {
      showError(t('feedback.selectRating'), t('feedback.selectRatingMessage'));
      return;
    }
    
    setStep(step + 1);
  };
  
  // Handle previous step
  const handlePrevStep = () => {
    setStep(step - 1);
  };
  
  // Handle submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!comment.trim()) {
      showError(t('feedback.enterComment'), t('feedback.enterCommentMessage'));
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // In a real implementation, this would send the feedback to a server
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      showSuccess(
        t('feedback.thankYou'),
        t('feedback.feedbackReceived')
      );
      
      trackConversion('feedback_submit', {
        feedbackType,
        rating,
        hasComment: !!comment.trim(),
        hasEmail: !!email.trim(),
      });
      
      closeFeedback();
      resetForm();
    } catch (error) {
      console.error('Error submitting feedback:', error);
      
      showError(
        t('feedback.submitError'),
        t('feedback.submitErrorMessage')
      );
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <>
      <Button
        variant="outline"
        size="icon"
        onClick={openFeedback}
        className="fixed bottom-4 left-4 z-50 rounded-full h-12 w-12 shadow-lg"
        aria-label={t('feedback.giveFeedback')}
      >
        <MessageSquare className="h-6 w-6" />
      </Button>
      
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex justify-between items-center">
              <DialogTitle>{t('feedback.title')}</DialogTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={closeFeedback}
                aria-label={t('feedback.close')}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <DialogDescription>
              {t('feedback.description')}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit}>
            {/* Step 1: Feedback Type */}
            {step === 1 && (
              <div className="space-y-4">
                <h3 className="text-sm font-medium">{t('feedback.typeQuestion')}</h3>
                <RadioGroup value={feedbackType} onValueChange={setFeedbackType}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="general" id="general" />
                    <Label htmlFor="general">{t('feedback.typeGeneral')}</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="bug" id="bug" />
                    <Label htmlFor="bug">{t('feedback.typeBug')}</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="feature" id="feature" />
                    <Label htmlFor="feature">{t('feedback.typeFeature')}</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="improvement" id="improvement" />
                    <Label htmlFor="improvement">{t('feedback.typeImprovement')}</Label>
                  </div>
                </RadioGroup>
              </div>
            )}
            
            {/* Step 2: Rating */}
            {step === 2 && (
              <div className="space-y-4">
                <h3 className="text-sm font-medium">{t('feedback.ratingQuestion')}</h3>
                <div className="flex justify-center space-x-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      className="focus:outline-none"
                      onClick={() => handleRatingChange(star)}
                      aria-label={`${star} ${t('feedback.stars')}`}
                    >
                      <Star
                        className={`h-8 w-8 ${
                          star <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>
                <div className="flex justify-between text-sm text-gray-500 px-2">
                  <span>{t('feedback.poor')}</span>
                  <span>{t('feedback.excellent')}</span>
                </div>
              </div>
            )}
            
            {/* Step 3: Comment */}
            {step === 3 && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="comment" className="text-sm font-medium">
                    {t('feedback.commentLabel')}
                  </Label>
                  <Textarea
                    id="comment"
                    placeholder={t('feedback.commentPlaceholder')}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="mt-1"
                    rows={5}
                  />
                </div>
                <div>
                  <Label htmlFor="email" className="text-sm font-medium">
                    {t('feedback.emailLabel')} <span className="text-gray-500">({t('feedback.optional')})</span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder={t('feedback.emailPlaceholder')}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-1"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {t('feedback.emailDescription')}
                  </p>
                </div>
              </div>
            )}
            
            <DialogFooter className="mt-6">
              {step > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handlePrevStep}
                  disabled={isSubmitting}
                >
                  {t('feedback.back')}
                </Button>
              )}
              
              {step < 3 ? (
                <Button
                  type="button"
                  onClick={handleNextStep}
                >
                  {t('feedback.next')}
                </Button>
              ) : (
                <Button
                  type="submit"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <span className="flex items-center">
                      <span className="animate-spin mr-2">⟳</span>
                      {t('feedback.sending')}
                    </span>
                  ) : (
                    <span className="flex items-center">
                      <Send className="h-4 w-4 mr-2" />
                      {t('feedback.submit')}
                    </span>
                  )}
                </Button>
              )}
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
