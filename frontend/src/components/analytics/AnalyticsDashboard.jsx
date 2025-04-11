import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Button } from '../ui/button';
import { Calendar } from '../ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Download, RefreshCw } from 'lucide-react';

// Mock data for demonstration
const pageViewsData = [
  { name: 'Mon', views: 120 },
  { name: 'Tue', views: 150 },
  { name: 'Wed', views: 180 },
  { name: 'Thu', views: 140 },
  { name: 'Fri', views: 190 },
  { name: 'Sat', views: 80 },
  { name: 'Sun', views: 70 },
];

const featureUsageData = [
  { name: 'View', value: 400 },
  { name: 'Edit', value: 150 },
  { name: 'Measure', value: 100 },
  { name: 'Section', value: 80 },
  { name: 'Share', value: 120 },
];

const conversionData = [
  { name: 'Jan', signups: 40, uploads: 24, shares: 18 },
  { name: 'Feb', signups: 30, uploads: 18, shares: 14 },
  { name: 'Mar', signups: 50, uploads: 35, shares: 22 },
  { name: 'Apr', signups: 70, uploads: 42, shares: 28 },
  { name: 'May', signups: 60, uploads: 38, shares: 24 },
  { name: 'Jun', signups: 80, uploads: 50, shares: 32 },
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

/**
 * Analytics Dashboard component
 */
export default function AnalyticsDashboard() {
  const { t } = useTranslation();
  const [dateRange, setDateRange] = useState({
    from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
    to: new Date(),
  });
  const [timeframe, setTimeframe] = useState('week');
  const [isLoading, setIsLoading] = useState(false);

  // Fetch analytics data
  const fetchData = () => {
    setIsLoading(true);
    // In a real implementation, this would fetch data from an API
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  };

  // Handle timeframe change
  const handleTimeframeChange = (value) => {
    setTimeframe(value);
    
    const now = new Date();
    let from = new Date();
    
    switch (value) {
      case 'day':
        from = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        from = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        from = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'quarter':
        from = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
        break;
      case 'year':
        from = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        from = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }
    
    setDateRange({ from, to: now });
  };

  // Handle date range change
  const handleDateRangeChange = (range) => {
    setDateRange(range);
    setTimeframe('custom');
  };

  // Handle refresh
  const handleRefresh = () => {
    fetchData();
  };

  // Handle export
  const handleExport = () => {
    // In a real implementation, this would export the data
    alert('Exporting analytics data...');
  };

  // Fetch data on mount and when date range changes
  useEffect(() => {
    fetchData();
  }, [dateRange]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">{t('analytics.title')}</h1>
        
        <div className="flex items-center space-x-4">
          {/* Timeframe selector */}
          <Select value={timeframe} onValueChange={handleTimeframeChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder={t('analytics.selectTimeframe')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">{t('analytics.timeframes.day')}</SelectItem>
              <SelectItem value="week">{t('analytics.timeframes.week')}</SelectItem>
              <SelectItem value="month">{t('analytics.timeframes.month')}</SelectItem>
              <SelectItem value="quarter">{t('analytics.timeframes.quarter')}</SelectItem>
              <SelectItem value="year">{t('analytics.timeframes.year')}</SelectItem>
              <SelectItem value="custom">{t('analytics.timeframes.custom')}</SelectItem>
            </SelectContent>
          </Select>
          
          {/* Date range picker */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-[240px] justify-start text-left font-normal">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRange?.from ? (
                  dateRange.to ? (
                    <>
                      {format(dateRange.from, 'LLL dd, y')} - {format(dateRange.to, 'LLL dd, y')}
                    </>
                  ) : (
                    format(dateRange.from, 'LLL dd, y')
                  )
                ) : (
                  <span>{t('analytics.selectDateRange')}</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="range"
                selected={dateRange}
                onSelect={handleDateRangeChange}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          
          {/* Refresh button */}
          <Button variant="outline" size="icon" onClick={handleRefresh} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
          
          {/* Export button */}
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            {t('analytics.export')}
          </Button>
        </div>
      </div>
      
      {/* Analytics tabs */}
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">{t('analytics.tabs.overview')}</TabsTrigger>
          <TabsTrigger value="engagement">{t('analytics.tabs.engagement')}</TabsTrigger>
          <TabsTrigger value="conversion">{t('analytics.tabs.conversion')}</TabsTrigger>
          <TabsTrigger value="features">{t('analytics.tabs.features')}</TabsTrigger>
          <TabsTrigger value="performance">{t('analytics.tabs.performance')}</TabsTrigger>
        </TabsList>
        
        {/* Overview tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Summary cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  {t('analytics.metrics.totalUsers')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">1,248</div>
                <p className="text-xs text-green-500 flex items-center mt-1">
                  +12.5% <span className="text-gray-500 ml-1">vs. previous period</span>
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  {t('analytics.metrics.pageViews')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">8,492</div>
                <p className="text-xs text-green-500 flex items-center mt-1">
                  +18.2% <span className="text-gray-500 ml-1">vs. previous period</span>
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  {t('analytics.metrics.uploads')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">342</div>
                <p className="text-xs text-green-500 flex items-center mt-1">
                  +5.7% <span className="text-gray-500 ml-1">vs. previous period</span>
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  {t('analytics.metrics.shares')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">128</div>
                <p className="text-xs text-red-500 flex items-center mt-1">
                  -3.2% <span className="text-gray-500 ml-1">vs. previous period</span>
                </p>
              </CardContent>
            </Card>
          </div>
          
          {/* Page views chart */}
          <Card>
            <CardHeader>
              <CardTitle>{t('analytics.charts.pageViews')}</CardTitle>
              <CardDescription>
                {t('analytics.charts.pageViewsDescription')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={pageViewsData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="views" stroke="#8884d8" activeDot={{ r: 8 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          
          {/* Feature usage chart */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>{t('analytics.charts.featureUsage')}</CardTitle>
                <CardDescription>
                  {t('analytics.charts.featureUsageDescription')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={featureUsageData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {featureUsageData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>{t('analytics.charts.conversion')}</CardTitle>
                <CardDescription>
                  {t('analytics.charts.conversionDescription')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={conversionData.slice(-6)}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="signups" fill="#8884d8" />
                      <Bar dataKey="uploads" fill="#82ca9d" />
                      <Bar dataKey="shares" fill="#ffc658" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* Placeholder for other tabs */}
        <TabsContent value="engagement">
          <Card>
            <CardHeader>
              <CardTitle>{t('analytics.tabs.engagement')}</CardTitle>
              <CardDescription>
                {t('analytics.engagementDescription')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p>{t('analytics.comingSoon')}</p>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="conversion">
          <Card>
            <CardHeader>
              <CardTitle>{t('analytics.tabs.conversion')}</CardTitle>
              <CardDescription>
                {t('analytics.conversionDescription')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p>{t('analytics.comingSoon')}</p>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="features">
          <Card>
            <CardHeader>
              <CardTitle>{t('analytics.tabs.features')}</CardTitle>
              <CardDescription>
                {t('analytics.featuresDescription')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p>{t('analytics.comingSoon')}</p>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="performance">
          <Card>
            <CardHeader>
              <CardTitle>{t('analytics.tabs.performance')}</CardTitle>
              <CardDescription>
                {t('analytics.performanceDescription')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p>{t('analytics.comingSoon')}</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
