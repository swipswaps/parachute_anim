import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, CheckCircle, X, AlertCircle, Info, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';

// Import UI components with error handling
import { withSelfHealing } from '../common/SelfHealingComponent';

// Import UI components
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Badge } from '../ui/badge';
import { ScrollArea } from '../ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../ui/collapsible';

// Import utilities
import { auditPage, fixAccessibilityIssues } from '../../utils/accessibility';

// Import health check
import './AccessibilityAuditHealthCheck';

/**
 * AccessibilityAudit component for auditing and fixing accessibility issues
 */
function AccessibilityAudit() {
  const { t } = useTranslation();
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [fixedCount, setFixedCount] = useState(0);
  const [expandedIssues, setExpandedIssues] = useState({});

  // Run audit
  const runAudit = async () => {
    setLoading(true);

    // Small delay to allow UI to update
    await new Promise(resolve => setTimeout(resolve, 100));

    try {
      const auditResults = auditPage();
      setIssues(auditResults);
    } catch (error) {
      console.error('Error running accessibility audit:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fix issues
  const fixIssues = async () => {
    setLoading(true);

    // Small delay to allow UI to update
    await new Promise(resolve => setTimeout(resolve, 100));

    try {
      const { fixed } = fixAccessibilityIssues(document.body);
      setFixedCount(prev => prev + fixed);

      // Run audit again to update issues
      runAudit();
    } catch (error) {
      console.error('Error fixing accessibility issues:', error);
    } finally {
      setLoading(false);
    }
  };

  // Toggle issue expansion
  const toggleIssue = (index) => {
    setExpandedIssues(prev => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  // Filter issues by severity
  const filteredIssues = issues.filter(issue => {
    if (activeTab === 'all') return true;
    return issue.severity === activeTab;
  });

  // Count issues by severity
  const errorCount = issues.filter(issue => issue.severity === 'error').length;
  const warningCount = issues.filter(issue => issue.severity === 'warning').length;

  // Run audit on mount
  useEffect(() => {
    runAudit();
  }, []);

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>{t('accessibility.auditTitle')}</CardTitle>
            <CardDescription>{t('accessibility.auditDescription')}</CardDescription>
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              onClick={runAudit}
              disabled={loading}
            >
              {loading ? t('accessibility.running') : t('accessibility.runAudit')}
            </Button>
            <Button
              onClick={fixIssues}
              disabled={loading || issues.length === 0}
            >
              {t('accessibility.fixIssues')}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="p-4 flex items-center space-x-4">
              <div className="bg-blue-100 p-3 rounded-full">
                <Info className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">{t('accessibility.totalIssues')}</p>
                <p className="text-2xl font-bold">{issues.length}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 flex items-center space-x-4">
              <div className="bg-red-100 p-3 rounded-full">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">{t('accessibility.errors')}</p>
                <p className="text-2xl font-bold">{errorCount}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 flex items-center space-x-4">
              <div className="bg-yellow-100 p-3 rounded-full">
                <AlertCircle className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">{t('accessibility.warnings')}</p>
                <p className="text-2xl font-bold">{warningCount}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Fixed issues */}
        {fixedCount > 0 && (
          <div className="mb-6 p-4 bg-green-50 rounded-md flex items-center">
            <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
            <p className="text-green-800">
              {t('accessibility.fixedIssues', { count: fixedCount })}
            </p>
          </div>
        )}

        {/* Issues list */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="all">
              {t('accessibility.all')}
              <Badge variant="secondary" className="ml-2">{issues.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="error">
              {t('accessibility.errors')}
              <Badge variant="secondary" className="ml-2">{errorCount}</Badge>
            </TabsTrigger>
            <TabsTrigger value="warning">
              {t('accessibility.warnings')}
              <Badge variant="secondary" className="ml-2">{warningCount}</Badge>
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[400px] rounded-md border p-4">
            {filteredIssues.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-4">
                {issues.length === 0 ? (
                  <>
                    <CheckCircle className="h-12 w-12 text-green-500 mb-2" />
                    <h3 className="text-lg font-medium text-gray-900 mb-1">
                      {t('accessibility.noIssuesFound')}
                    </h3>
                    <p className="text-gray-500">
                      {t('accessibility.noIssuesDescription')}
                    </p>
                  </>
                ) : (
                  <>
                    <Info className="h-12 w-12 text-blue-500 mb-2" />
                    <h3 className="text-lg font-medium text-gray-900 mb-1">
                      {t('accessibility.noFilteredIssues')}
                    </h3>
                    <p className="text-gray-500">
                      {t('accessibility.tryDifferentFilter')}
                    </p>
                  </>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredIssues.map((issue, index) => (
                  <Collapsible
                    key={index}
                    open={expandedIssues[index]}
                    onOpenChange={() => toggleIssue(index)}
                    className="border rounded-md overflow-hidden"
                  >
                    <div className={`p-4 ${issue.severity === 'error' ? 'bg-red-50' : 'bg-yellow-50'}`}>
                      <div className="flex justify-between items-center">
                        <div className="flex items-center">
                          {issue.severity === 'error' ? (
                            <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
                          ) : (
                            <AlertCircle className="h-5 w-5 text-yellow-600 mr-2" />
                          )}
                          <div>
                            <h3 className={`font-medium ${issue.severity === 'error' ? 'text-red-800' : 'text-yellow-800'}`}>
                              {issue.issue}
                            </h3>
                            <p className="text-sm text-gray-500">
                              WCAG {issue.wcag}
                            </p>
                          </div>
                        </div>
                        <CollapsibleTrigger asChild>
                          <Button variant="ghost" size="sm">
                            {expandedIssues[index] ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </Button>
                        </CollapsibleTrigger>
                      </div>
                    </div>
                    <CollapsibleContent>
                      <div className="p-4 border-t">
                        <h4 className="font-medium mb-2">{t('accessibility.elementInfo')}</h4>
                        <pre className="bg-gray-100 p-2 rounded text-xs overflow-x-auto">
                          {issue.element.outerHTML.substring(0, 200)}
                          {issue.element.outerHTML.length > 200 ? '...' : ''}
                        </pre>

                        <div className="mt-4">
                          <h4 className="font-medium mb-2">{t('accessibility.howToFix')}</h4>
                          <p className="text-sm text-gray-700">
                            {getFixDescription(issue)}
                          </p>
                        </div>

                        <div className="mt-4">
                          <a
                            href={getWcagLink(issue.wcag)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 hover:underline flex items-center"
                          >
                            {t('accessibility.learnMore')}
                            <ExternalLink className="h-3 w-3 ml-1" />
                          </a>
                        </div>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                ))}
              </div>
            )}
          </ScrollArea>
        </Tabs>
      </CardContent>
      <CardFooter className="flex justify-between">
        <p className="text-sm text-gray-500">
          {t('accessibility.lastRun')}: {new Date().toLocaleTimeString()}
        </p>
        <a
          href="https://www.w3.org/WAI/standards-guidelines/wcag/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-blue-600 hover:underline flex items-center"
        >
          {t('accessibility.wcagGuidelines')}
          <ExternalLink className="h-3 w-3 ml-1" />
        </a>
      </CardFooter>
    </Card>
  );
}

/**
 * Get fix description for an issue
 * @param {Object} issue - Accessibility issue
 * @returns {string} - Fix description
 */
function getFixDescription(issue) {
  switch (issue.issue) {
    case 'Image missing alt text':
      return 'Add an alt attribute to the image that describes its content. If the image is decorative, use alt=""';

    case 'Button missing accessible name':
      return 'Add text content to the button, or use aria-label or aria-labelledby attributes';

    case 'Link missing accessible name':
      return 'Add text content to the link, or use aria-label or aria-labelledby attributes';

    case 'Form element missing label':
      return 'Associate a label with the form element using the for attribute, or use aria-label or aria-labelledby attributes';

    case 'Form element missing ID for label association':
      return 'Add an id attribute to the form element and associate it with a label using the for attribute';

    case 'Text on background image may have insufficient contrast':
      return 'Ensure text has sufficient contrast with its background. Consider adding a solid background or text shadow';

    case 'Page missing main landmark':
      return 'Add a main element or an element with role="main" to identify the main content of the page';

    case 'Page missing header landmark':
      return 'Add a header element or an element with role="banner" to identify the page header';

    case 'Page missing footer landmark':
      return 'Add a footer element or an element with role="contentinfo" to identify the page footer';

    case 'Document language not specified':
      return 'Add a lang attribute to the html element to specify the document language';

    default:
      return 'Review the element and ensure it meets accessibility guidelines';
  }
}

/**
 * Get WCAG link for a criterion
 * @param {string} criterion - WCAG criterion
 * @returns {string} - WCAG link
 */
function getWcagLink(criterion) {
  const version = '2.1';
  const [principle, guideline, success] = criterion.split('.');

  return `https://www.w3.org/WAI/WCAG${version}/Understanding/success-criterion-${principle}-${guideline}-${success}.html`;
}

// Export the component with self-healing capabilities
export default withSelfHealing(AccessibilityAudit, {
  dependencyName: 'AccessibilityAudit',
  fallback: () => (
    <div className="p-4 border border-yellow-500 rounded bg-yellow-50 text-yellow-700">
      <h3 className="text-lg font-medium">Accessibility Audit Tool</h3>
      <p>The accessibility audit tool is currently unavailable due to missing dependencies.</p>
      <p>Please try again later or contact support if the issue persists.</p>
    </div>
  )
});
