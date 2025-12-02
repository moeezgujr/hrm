import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Calendar, TrendingUp, Users, PhoneCall, Mail, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

export default function CrmManagementDashboard() {
  const { user } = useAuth();
  const [dateRange, setDateRange] = useState('week'); // week, month, custom
  const [fromDate, setFromDate] = useState(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
  const [toDate, setToDate] = useState(new Date().toISOString().split('T')[0]);

  // Fetch summary data
  const { data: summaryData } = useQuery({
    queryKey: ['/api/crm/daily-summary', fromDate, toDate],
    queryFn: async () => {
      const response = await fetch(`/api/crm/daily-summary?from=${fromDate}&to=${toDate}`);
      if (!response.ok) return null;
      return response.json();
    },
  });

  // Fetch daily records
  const { data: dailyRecords } = useQuery({
    queryKey: ['/api/crm/daily-meetings', fromDate, toDate],
    queryFn: async () => {
      const response = await fetch(`/api/crm/daily-meetings?from=${fromDate}&to=${toDate}`);
      if (!response.ok) return [];
      return response.json();
    },
  });

  // Process data for charts
  const chartData = useMemo(() => {
    if (!dailyRecords) return [];
    return dailyRecords.map((record) => ({
      date: new Date(record.meetingDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      sessions: record.totalSessions,
      inquiries: record.totalInquiries,
      deals: record.closedDeals,
      calls: record.callsPlaced,
    }));
  }, [dailyRecords]);

  const teamData = useMemo(() => {
    if (!dailyRecords) return [];
    const teamStats: Record<string, any> = {};
    
    dailyRecords.forEach((record) => {
      const name = record.user?.name || 'Unknown';
      if (!teamStats[name]) {
        teamStats[name] = {
          name,
          sessions: 0,
          inquiries: 0,
          deals: 0,
          calls: 0,
          emails: 0,
        };
      }
      teamStats[name].sessions += record.totalSessions;
      teamStats[name].inquiries += record.totalInquiries;
      teamStats[name].deals += record.closedDeals;
      teamStats[name].calls += record.callsPlaced;
      teamStats[name].emails += record.emailsSent;
    });

    return Object.values(teamStats);
  }, [dailyRecords]);

  const communicationData = useMemo(() => {
    if (!summaryData) return [];
    return [
      { name: 'Calls', value: summaryData.callsPlaced || 0, fill: '#3B82F6' },
      { name: 'Emails', value: summaryData.emailsSent || 0, fill: '#10B981' },
      { name: 'Meetings Scheduled', value: summaryData.meetingsScheduled || 0, fill: '#F59E0B' },
    ];
  }, [summaryData]);

  const conversionRate = useMemo(() => {
    if (!summaryData || summaryData.totalInquiries === 0) return 0;
    return ((summaryData.closedDeals / summaryData.totalInquiries) * 100).toFixed(2);
  }, [summaryData]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">CRM Management Dashboard</h1>
          <p className="text-gray-600">Complete overview of your CRM team's performance</p>
        </div>

        {/* Date Range Selector */}
        <div className="mb-6 bg-white p-4 rounded-lg shadow">
          <div className="flex gap-4 items-end">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={dateRange === 'week' ? 'default' : 'outline'}
                onClick={() => {
                  setDateRange('week');
                  setFromDate(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
                  setToDate(new Date().toISOString().split('T')[0]);
                }}
              >
                Week
              </Button>
              <Button
                variant={dateRange === 'month' ? 'default' : 'outline'}
                onClick={() => {
                  setDateRange('month');
                  setFromDate(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
                  setToDate(new Date().toISOString().split('T')[0]);
                }}
              >
                Month
              </Button>
            </div>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
              <PhoneCall className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summaryData?.totalSessions || 0}</div>
              <p className="text-xs text-gray-500 mt-1">All tracked sessions</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Inquiries</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summaryData?.totalInquiries || 0}</div>
              <p className="text-xs text-gray-500 mt-1">New inquiries received</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Closed Deals</CardTitle>
              <DollarSign className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summaryData?.closedDeals || 0}</div>
              <p className="text-xs text-gray-500 mt-1">Conversion rate: {conversionRate}%</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">New Leads</CardTitle>
              <Users className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summaryData?.newLeads || 0}</div>
              <p className="text-xs text-gray-500 mt-1">Qualified prospects</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Daily Performance Trend */}
          <Card>
            <CardHeader className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-t-lg">
              <CardTitle>Daily Performance Trend</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="sessions" stroke="#3B82F6" strokeWidth={2} />
                  <Line type="monotone" dataKey="inquiries" stroke="#10B981" strokeWidth={2} />
                  <Line type="monotone" dataKey="deals" stroke="#F59E0B" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Communication Breakdown */}
          <Card>
            <CardHeader className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-t-lg">
              <CardTitle>Communication Methods</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={communicationData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {communicationData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Team Performance */}
        <Card>
          <CardHeader className="bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-t-lg">
            <CardTitle>Team Performance</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={teamData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="sessions" fill="#3B82F6" />
                <Bar dataKey="inquiries" fill="#10B981" />
                <Bar dataKey="deals" fill="#F59E0B" />
                <Bar dataKey="calls" fill="#8B5CF6" />
                <Bar dataKey="emails" fill="#EC4899" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          <Card>
            <CardHeader className="bg-blue-50">
              <CardTitle className="text-sm">Total Calls Placed</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-blue-600">{summaryData?.callsPlaced || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="bg-green-50">
              <CardTitle className="text-sm">Total Emails Sent</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-green-600">{summaryData?.emailsSent || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="bg-purple-50">
              <CardTitle className="text-sm">Avg Conversion Rate</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-purple-600">{conversionRate}%</div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
