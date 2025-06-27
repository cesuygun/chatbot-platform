'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { MessageSquare, Users, TrendingUp, FileText } from 'lucide-react';
import { getUsageStats, UsageStats } from '@/lib/usage';

interface AnalyticsData {
  totalMessages: number;
  totalConversations: number;
  totalDocuments: number;
  averageResponseTime: number;
}

export const Analytics = () => {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [usageStats, setUsageStats] = useState<UsageStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        // Fetch usage stats
        const stats = await getUsageStats('current-user-id'); // This should come from auth context
        setUsageStats(stats);

        // Mock analytics data - in real implementation, this would come from API
        setAnalytics({
          totalMessages: 1247,
          totalConversations: 89,
          totalDocuments: 12,
          averageResponseTime: 2.3,
        });
      } catch (error) {
        console.error('Failed to fetch analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Messages</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.totalMessages.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {usageStats && `${usageStats.currentMessages} this month`}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversations</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.totalConversations}</div>
            <p className="text-xs text-muted-foreground">+12% from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Documents</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.totalDocuments}</div>
            <p className="text-xs text-muted-foreground">Knowledge base files</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.averageResponseTime}s</div>
            <p className="text-xs text-muted-foreground">-0.2s from last week</p>
          </CardContent>
        </Card>
      </div>

      {usageStats && (
        <Card>
          <CardHeader>
            <CardTitle>Usage This Month</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Messages</span>
                <span className="text-sm text-muted-foreground">
                  {usageStats.currentMessages} / {usageStats.limits.messagesPerMonth}
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all"
                  style={{
                    width: `${Math.min(
                      (usageStats.currentMessages / usageStats.limits.messagesPerMonth) * 100,
                      100
                    )}%`,
                  }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Chatbots</span>
                <span className="text-sm text-muted-foreground">
                  {usageStats.currentChatbots} / {usageStats.limits.chatbots}
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all"
                  style={{
                    width: `${Math.min(
                      (usageStats.currentChatbots / usageStats.limits.chatbots) * 100,
                      100
                    )}%`,
                  }}
                />
              </div>
            </div>

            {usageStats.currentMessages >= usageStats.limits.messagesPerMonth * 0.8 && (
              <Badge variant="destructive" className="w-fit">
                Approaching message limit
              </Badge>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}; 