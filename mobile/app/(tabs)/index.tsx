import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/src/context/AuthContext';
import { profileApi, ProfileStats } from '@/src/api/profile';
import { ordersApi } from '@/src/api/orders';
import { chatApi } from '@/src/api/chat';
import { mastersApi } from '@/src/api/masters';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import DashboardCard from '@/components/DashboardCard';
import OrderCard, { Order } from '@/components/OrderCard';
import ApplicationCard, { Application } from '@/components/ApplicationCard';
import MasterPreviewCard, { MasterPreview } from '@/components/MasterPreviewCard';

export default function HomeScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];

  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<ProfileStats | null>(null);
  const [activeOrders, setActiveOrders] = useState<Order[]>([]);
  const [newApplications, setNewApplications] = useState<Application[]>([]);
  const [recentChats, setRecentChats] = useState<any[]>([]);
  const [recommendedMasters, setRecommendedMasters] = useState<MasterPreview[]>([]);
  const [newJobs, setNewJobs] = useState<Order[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, [user?.role]);

  const fetchDashboardData = async () => {
    try {
      if (user?.role === 'CLIENT') {
        await fetchClientDashboard();
      } else if (user?.role === 'MASTER') {
        await fetchMasterDashboard();
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const fetchClientDashboard = async () => {
    try {
      // Fetch stats
      const statsResponse = await profileApi.getClientStats();
      setStats(statsResponse.data);

      // Fetch active orders
      const ordersResponse = await ordersApi.listOrders({
        status: 'pending,in_progress,awaiting_master',
        page_size: 5
      });
      setActiveOrders(ordersResponse.data || []);

      // Fetch recent chats
      const chatsResponse = await chatApi.listRooms({ page_size: 3 });
      setRecentChats(chatsResponse.data || []);

      // Fetch recommended masters
      const mastersResponse = await mastersApi.listMasters({
        city: user?.city,
        page_size: 6
      });
      setRecommendedMasters(mastersResponse.data || []);

      // TODO: Fetch new applications when endpoint is ready
      setNewApplications([]);
    } catch (error) {
      console.error('Failed to fetch client dashboard', error);
    }
  };

  const fetchMasterDashboard = async () => {
    try {
      // Fetch stats
      const statsResponse = await profileApi.getMasterStats();
      setStats(statsResponse.data);

      // Fetch new jobs
      const jobsResponse = await ordersApi.listOrders({
        status: 'pending',
        city: user?.city,
        page_size: 5
      });
      setNewJobs(jobsResponse.data || []);

      // Fetch active orders (accepted)
      const ordersResponse = await ordersApi.listOrders({
        status: 'in_progress',
        page_size: 5
      });
      setActiveOrders(ordersResponse.data || []);

      // Fetch recent chats
      const chatsResponse = await chatApi.listRooms({ page_size: 3 });
      setRecentChats(chatsResponse.data || []);

      // TODO: Fetch my applications when endpoint is ready
      setNewApplications([]);
    } catch (error) {
      console.error('Failed to fetch master dashboard', error);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  if (isLoading) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.tint} />
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.tint} />
      }
    >
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.card }]}>
        <View>
          <Text style={[styles.greeting, { color: theme.text + '99' }]}>
            {getGreeting()},
          </Text>
          <Text style={[styles.userName, { color: theme.text }]}>
            {user?.firstName}!
          </Text>
          {user?.city && (
            <View style={styles.location}>
              <Ionicons name="location-outline" size={14} color={theme.text + '66'} />
              <Text style={[styles.locationText, { color: theme.text + '66' }]}>
                {user.city}
              </Text>
            </View>
          )}
        </View>

        {/* Primary CTA */}
        <TouchableOpacity
          style={[styles.primaryButton, { backgroundColor: theme.tint }]}
          onPress={() => {
            if (user?.role === 'CLIENT') {
              router.push('/create-order' as any);
            } else {
              router.push('/(tabs)/vacancies');
            }
          }}
        >
          <Ionicons name={user?.role === 'CLIENT' ? 'add-circle' : 'search'} size={20} color="white" />
          <Text style={styles.primaryButtonText}>
            {user?.role === 'CLIENT' ? 'Create Order' : 'Find Jobs'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* CLIENT DASHBOARD */}
      {user?.role === 'CLIENT' && (
        <>
          {/* Active Orders */}
          <DashboardCard
            title="Active Orders"
            badge={activeOrders.length}
            actionText="View All"
            onActionPress={() => router.push('/my-jobs' as any)}
          >
            {activeOrders.length > 0 ? (
              activeOrders.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  onPress={() => router.push(`/orders/${order.id}` as any)}
                  showApplicationCount={true}
                />
              ))
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="document-text-outline" size={48} color={theme.text + '40'} />
                <Text style={[styles.emptyText, { color: theme.text + '66' }]}>
                  No active orders
                </Text>
                <TouchableOpacity
                  style={[styles.emptyButton, { borderColor: theme.tint }]}
                  onPress={() => router.push('/create-order' as any)}
                >
                  <Text style={[styles.emptyButtonText, { color: theme.tint }]}>
                    Create your first order
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </DashboardCard>

          {/* New Applications */}
          {newApplications.length > 0 && (
            <DashboardCard
              title="New Applications"
              badge={newApplications.length}
              actionText="View All"
              onActionPress={() => router.push('/applications' as any)}
            >
              {newApplications.map((application) => (
                <ApplicationCard
                  key={application.id}
                  application={application}
                  variant="client"
                  onPress={() => router.push(`/applications/${application.id}` as any)}
                />
              ))}
            </DashboardCard>
          )}

          {/* Chats */}
          {recentChats.length > 0 && (
            <DashboardCard
              title="Recent Chats"
              actionText="View All"
              onActionPress={() => router.push('/(tabs)/chat')}
            >
              {recentChats.map((chat) => (
                <TouchableOpacity
                  key={chat.id}
                  style={[styles.chatItem, { borderBottomColor: theme.text + '10' }]}
                  onPress={() => router.push(`/chat/${chat.id}`)}
                >
                  <View style={styles.chatInfo}>
                    <Text style={[styles.chatName, { color: theme.text }]}>
                      {chat.otherParticipant?.firstName} {chat.otherParticipant?.lastName}
                    </Text>
                    <Text style={[styles.chatMessage, { color: theme.text + '66' }]} numberOfLines={1}>
                      {chat.lastMessage?.content || 'No messages yet'}
                    </Text>
                  </View>
                  {chat.unreadCount > 0 && (
                    <View style={[styles.unreadBadge, { backgroundColor: theme.tint }]}>
                      <Text style={styles.unreadText}>{chat.unreadCount}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </DashboardCard>
          )}

          {/* Recommended Masters */}
          {recommendedMasters.length > 0 && (
            <DashboardCard
              title="Recommended Masters"
              actionText="View All"
              onActionPress={() => router.push('/(tabs)/masters')}
            >
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {recommendedMasters.map((master) => (
                  <MasterPreviewCard
                    key={master.id}
                    master={master}
                    onPress={() => router.push(`/masters/${master.id}`)}
                  />
                ))}
              </ScrollView>
            </DashboardCard>
          )}
        </>
      )}

      {/* MASTER DASHBOARD */}
      {user?.role === 'MASTER' && (
        <>
          {/* New Jobs */}
          <DashboardCard
            title="New Jobs"
            badge={newJobs.length}
            actionText="View All"
            onActionPress={() => router.push('/(tabs)/vacancies')}
          >
            {newJobs.length > 0 ? (
              newJobs.map((job) => (
                <OrderCard
                  key={job.id}
                  order={job}
                  onPress={() => router.push(`/orders/${job.id}` as any)}
                  showApplicationCount={false}
                />
              ))
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="briefcase-outline" size={48} color={theme.text + '40'} />
                <Text style={[styles.emptyText, { color: theme.text + '66' }]}>
                  No new jobs available
                </Text>
                <TouchableOpacity
                  style={[styles.emptyButton, { borderColor: theme.tint }]}
                  onPress={() => router.push('/(tabs)/vacancies')}
                >
                  <Text style={[styles.emptyButtonText, { color: theme.tint }]}>
                    Browse all jobs
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </DashboardCard>

          {/* My Applications */}
          {newApplications.length > 0 && (
            <DashboardCard
              title="My Applications"
              badge={newApplications.length}
              actionText="View All"
              onActionPress={() => router.push('/responses' as any)}
            >
              {newApplications.map((application) => (
                <ApplicationCard
                  key={application.id}
                  application={application}
                  variant="master"
                  onPress={() => router.push(`/applications/${application.id}` as any)}
                />
              ))}
            </DashboardCard>
          )}

          {/* Active Orders */}
          {activeOrders.length > 0 && (
            <DashboardCard
              title="Active Orders"
              badge={activeOrders.length}
              actionText="View All"
              onActionPress={() => router.push('/my-jobs' as any)}
            >
              {activeOrders.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  onPress={() => router.push(`/orders/${order.id}` as any)}
                  showApplicationCount={false}
                />
              ))}
            </DashboardCard>
          )}

          {/* Chats */}
          {recentChats.length > 0 && (
            <DashboardCard
              title="Recent Chats"
              actionText="View All"
              onActionPress={() => router.push('/(tabs)/chat')}
            >
              {recentChats.map((chat) => (
                <TouchableOpacity
                  key={chat.id}
                  style={[styles.chatItem, { borderBottomColor: theme.text + '10' }]}
                  onPress={() => router.push(`/chat/${chat.id}`)}
                >
                  <View style={styles.chatInfo}>
                    <Text style={[styles.chatName, { color: theme.text }]}>
                      {chat.otherParticipant?.firstName} {chat.otherParticipant?.lastName}
                    </Text>
                    <Text style={[styles.chatMessage, { color: theme.text + '66' }]} numberOfLines={1}>
                      {chat.lastMessage?.content || 'No messages yet'}
                    </Text>
                  </View>
                  {chat.unreadCount > 0 && (
                    <View style={[styles.unreadBadge, { backgroundColor: theme.tint }]}>
                      <Text style={styles.unreadText}>{chat.unreadCount}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </DashboardCard>
          )}
        </>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 20,
    paddingTop: 60,
    marginBottom: 16,
  },
  greeting: {
    fontSize: 14,
    marginBottom: 4,
  },
  userName: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  location: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    fontSize: 13,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 6,
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 12,
    marginBottom: 16,
  },
  emptyButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderWidth: 1,
    borderRadius: 20,
  },
  emptyButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  chatInfo: {
    flex: 1,
  },
  chatName: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  chatMessage: {
    fontSize: 13,
  },
  unreadBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
    marginLeft: 8,
  },
  unreadText: {
    color: 'white',
    fontSize: 11,
    fontWeight: 'bold',
  },
});
