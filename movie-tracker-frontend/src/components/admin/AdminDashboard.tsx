import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from '@apollo/client';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';
import { 
  Activity,
  Users,
  Film,
  AlertCircle,  
  Loader2
} from 'lucide-react';
import { ADMIN_STATS_QUERY, RECENT_ACTIVITY_QUERY } from '@/types/graphql/admin';
const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const { data: statsData, loading: statsLoading } = useQuery(ADMIN_STATS_QUERY);
  const { data: recentData, loading: recentLoading } = useQuery(RECENT_ACTIVITY_QUERY);

  if (statsLoading || recentLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  const stats = statsData?.adminStats || {
    totalUsers: 0,
    activeUsers: 0,
    totalReviews: 0,
    pendingReviews: 0,
    totalMovies: 0,
    flaggedContent: 0
  };

  const recentActivity = recentData?.recentActivity || [];

  const StatCard = ({ title, value, icon: Icon, change }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground"/>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {change && (
          <p className="text-xs text-muted-foreground">
            {change > 0 ? '+' : ''}{change}% from last month
          </p>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="p-6 space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          title="Total Users" 
          value={stats.totalUsers}
          icon={Users}
          change={2.5}
        />
        <StatCard 
          title="Active Users" 
          value={stats.activeUsers}
          icon={Activity}
          change={-0.7}
        />
        <StatCard 
          title="Total Reviews" 
          value={stats.totalReviews}
          icon={Film}
          change={1.2}
        />
        <StatCard 
          title="Flagged Content" 
          value={stats.flaggedContent}
          icon={AlertCircle}
          change={0.1}
        />
      </div>

      <Tabs defaultValue={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>User Growth</CardTitle>
            </CardHeader>
            <CardContent className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stats.userGrowth}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="users" 
                    stroke="#8884d8" 
                    activeDot={{ r: 8 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Content Distribution</CardTitle>
            </CardHeader>
            <CardContent className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.contentDistribution}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Additional tab content will be implemented based on specific needs */}
      </Tabs>
    </div>
  );
};

export default AdminDashboard;