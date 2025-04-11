import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Accessibility, X, Settings, CheckSquare } from 'lucide-react';
import { Button } from '../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import AccessibilitySettings from './AccessibilitySettings';
import AccessibilityAudit from './AccessibilityAudit';

/**
 * AccessibilityPanel component for managing accessibility features
 */
export default function AccessibilityPanel() {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('settings');
  
  // Open panel
  const openPanel = () => {
    setIsOpen(true);
  };
  
  // Close panel
  const closePanel = () => {
    setIsOpen(false);
  };
  
  return (
    <>
      <Button
        variant="outline"
        size="icon"
        onClick={openPanel}
        className="fixed bottom-4 right-4 z-50 rounded-full h-12 w-12 shadow-lg"
        aria-label={t('accessibility.openAccessibilityPanel')}
      >
        <Accessibility className="h-6 w-6" />
      </Button>
      
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
          <DialogHeader>
            <div className="flex justify-between items-center">
              <DialogTitle>{t('accessibility.panelTitle')}</DialogTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={closePanel}
                aria-label={t('accessibility.closePanel')}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <DialogDescription>
              {t('accessibility.panelDescription')}
            </DialogDescription>
          </DialogHeader>
          
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="flex-grow flex flex-col overflow-hidden"
          >
            <TabsList className="mb-4">
              <TabsTrigger value="settings">
                <Settings className="h-4 w-4 mr-2" />
                {t('accessibility.settings')}
              </TabsTrigger>
              <TabsTrigger value="audit">
                <CheckSquare className="h-4 w-4 mr-2" />
                {t('accessibility.audit')}
              </TabsTrigger>
            </TabsList>
            
            <div className="flex-grow overflow-auto">
              <TabsContent value="settings" className="h-full">
                <AccessibilitySettings />
              </TabsContent>
              
              <TabsContent value="audit" className="h-full">
                <AccessibilityAudit />
              </TabsContent>
            </div>
          </Tabs>
        </DialogContent>
      </Dialog>
    </>
  );
}
