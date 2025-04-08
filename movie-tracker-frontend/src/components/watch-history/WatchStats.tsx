import React from 'react';
import { useQuery } from '@apollo/client';
import { GET_WATCH_STATS, GET_WATCH_STREAK } from './watch-history-operations';
import { format, differenceInDays } from 'date-fns';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';

// Array of colors for charts
const COLORS = [
  '#1e40af', // blue-800
  '#0e7490', // cyan-700
  '#0f766e', // teal-700
  '#047857', // emerald-700
  '#15803d', // green-700
  '#4d7c0f', // lime-700
  '#a16207', // amber-700
  '#c2410c', // orange-700
  '#b91c1c', // red-700
  '#be185d', // pink-700
  '#a21caf', // fuchsia-700
  '#7e22ce', // purple-700
  '#4338ca', // indigo-700
];

export function WatchStats() {
  // Fetch watch statistics
  const { loading: statsLoading, error: statsError, data: statsData } = useQuery(GET_WATCH_STATS, {
    fetchPolicy: 'cache-and-network',
    onCompleted: (data) => {
      console.log('Watch stats data successfully loaded:', data);
    },
    onError: (error) => {
      console.error('Error fetching watch stats:', error);
    }
  });

  // Fetch watch streak
  const { loading: streakLoading, error: streakError, data: streakData } = useQuery(GET_WATCH_STREAK, {
    fetchPolicy: 'cache-and-network',
  });

  // Combine loading and error states
  const loading = statsLoading || streakLoading;
  const error = statsError || streakError;

  // Handle error state
  if (error) {
    return (
      <div className="p-4 border border-red-200 bg-red-50 rounded-md text-red-800">
        <p>Error loading statistics: {error.message}</p>
        <Button 
          variant="outline" 
          onClick={() => window.location.reload()} 
          className="mt-2"
        >
          Retry
        </Button>
      </div>
    );
  }

  // Handle loading state
  if (loading && !statsData) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, index) => (
            <Card key={index}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-3 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>
        
        <div className="space-y-4">
          <Skeleton className="h-[300px] w-full" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Skeleton className="h-[250px] w-full" />
            <Skeleton className="h-[250px] w-full" />
          </div>
        </div>
      </div>
    );
  }

  // Extract stats data
  const stats = statsData?.watchStats || null;
  const currentStreak = streakData?.currentWatchStreak || 0;
  const longestStreak = streakData?.longestWatchStreak || 0;

  // Handle empty state
  if (!stats || stats.totalWatch === 0) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium mb-2">No watch data yet</h3>
        <p className="text-muted-foreground mb-4">
          Start tracking your movie watches to generate statistics
        </p>
        <Button onClick={() => window.location.href = '/watch-history/add'}>
          Log Your First Watch
        </Button>
      </div>
    );
  }

  // Format first and last watch dates
  const firstWatchDate = stats.firstWatchDate 
    ? format(new Date(stats.firstWatchDate), 'MMMM d, yyyy')
    : 'N/A';
  
  const lastWatchDate = stats.lastWatchDate 
    ? format(new Date(stats.lastWatchDate), 'MMMM d, yyyy')
    : 'N/A';

  // Calculate days tracking (if both dates exist)
  const daysTracking = stats.firstWatchDate && stats.lastWatchDate
    ? differenceInDays(new Date(stats.lastWatchDate), new Date(stats.firstWatchDate)) + 1
    : 0;

  // Prepare genre distribution data for chart
  const genreData = stats.genreDistribution?.map(item => ({
    name: item.genre,
    value: item.count,
    percentage: item.percentage,
  })) || [];

  // Prepare watch type distribution data for chart
  const watchTypeData = stats.watchTypeDistribution?.map(item => ({
    name: item.type === 'FIRST_TIME' ? 'First Time' : 
          item.type === 'REWATCH' ? 'Rewatch' : 
          item.type === 'PARTIAL' ? 'Partial' : item.type,
    value: item.count,
    percentage: item.percentage,
  })) || [];

  // Prepare year distribution data for chart
  const yearData = stats.yearDistribution?.sort((a, b) => a.year - b.year).map(item => ({
    name: item.year.toString(),
    count: item.count,
    percentage: item.percentage,
  })) || [];

  // Prepare monthly watch counts data for chart
  const monthlyData = stats.monthlyWatchCounts?.map(item => ({
    name: `${item.month}/${item.year}`,
    count: item.count,
  })) || [];

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Watches</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalWatch}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.uniqueMovies} unique movies
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Average Rating</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.averageRating?.toFixed(1) || 'N/A'}</div>
            <p className="text-xs text-muted-foreground mt-1">
              out of 5 stars
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Watch Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalWatchTime 
                ? `${Math.floor(stats.totalWatchTime / 60)}h ${stats.totalWatchTime % 60}m`
                : 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              total time spent watching
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Watch Streak</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentStreak}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Current streak (longest: {longestStreak})
            </p>
          </CardContent>
        </Card>
      </div>

      {/* History timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Watching Timeline</CardTitle>
          <CardDescription>
            From {firstWatchDate} to {lastWatchDate}
            {daysTracking ? ` (${daysTracking} days)` : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={monthlyData.slice(-12)} // Show last 12 months
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="name" 
                  tick={{ fontSize: 12 }} 
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis />
                <Tooltip 
                  formatter={(value) => [`${value} watches`, 'Count']}
                  labelFormatter={(label) => `Month: ${label}`}
                />
                <Line 
                  type="monotone" 
                  dataKey="count" 
                  stroke="#1e40af" 
                  strokeWidth={2}
                  activeDot={{ r: 8 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Detailed analytics tabs */}
      <Tabs defaultValue="genres" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="genres">Genres</TabsTrigger>
          <TabsTrigger value="years">Release Years</TabsTrigger>
          <TabsTrigger value="watchTypes">Watch Types</TabsTrigger>
        </TabsList>
        
        <TabsContent value="genres">
          <Card>
            <CardHeader>
              <CardTitle>Genre Distribution</CardTitle>
              <CardDescription>
                Movies watched by genre
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={genreData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      nameKey="name"
                      label={({ name, percentage }) => `${name}: ${percentage.toFixed(1)}%`}
                    >
                      {genreData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value, name, props) => [
                        `${value} watches (${props.payload.percentage.toFixed(1)}%)`,
                        name
                      ]}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="years">
          <Card>
            <CardHeader>
              <CardTitle>Movies by Release Year</CardTitle>
              <CardDescription>
                Distribution of movies watched by their release year
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={yearData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 25 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="name" 
                      tick={{ fontSize: 12 }} 
                      angle={-45}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis />
                    <Tooltip 
                      formatter={(value) => [`${value} watches`, 'Count']}
                      labelFormatter={(label) => `Year: ${label}`}
                    />
                    <Bar dataKey="count" fill="#0e7490">
                      {yearData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="watchTypes">
          <Card>
            <CardHeader>
              <CardTitle>Watch Types</CardTitle>
              <CardDescription>
                First-time watches vs. rewatches
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={watchTypeData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      nameKey="name"
                      label={({ name, percentage }) => `${name}: ${percentage.toFixed(1)}%`}
                    >
                      {watchTypeData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={
                            entry.name === 'First Time' ? '#0e7490' : 
                            entry.name === 'Rewatch' ? '#047857' : '#a16207'
                          } 
                        />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value, name, props) => [
                        `${value} watches (${props.payload.percentage.toFixed(1)}%)`,
                        name
                      ]}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
