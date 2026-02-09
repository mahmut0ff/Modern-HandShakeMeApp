import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/src/context/AuthContext';
import { profileApi } from '@/src/api/profile';
import { ordersApi, Order } from '@/src/api/orders';
import { applicationsApi } from '@/src/api/applications';
import { notificationsApi } from '@/src/api/notifications';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import StatCard from '@/components/StatCard';
import ProgressOrderCard from '@/components/ProgressOrderCard';
import MiniCalendar from '@/components/MiniCalendar';
import { formatDate } from '@/src/utils/date';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];

  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [activeOrders, setActiveOrders] = useState<Order[]>([]);
  const [newApplications, setNewApplications] = useState<any[]>([]);
  const [urgentJobs, setUrgentJobs] = useState<Order[]>([]);
  const [favoriteMasters, setFavoriteMasters] = useState<any[]>([]);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [workDates, setWorkDates] = useState<string[]>([]);
  const [masterProfile, setMasterProfile] = useState<any>(null);

  useEffect(() => {
    if (user) {
      console.log('User loaded:', { id: user.id, role: user.role, firstName: user.firstName });
      fetchDashboardData();
    } else {
      console.log('No user found, skipping dashboard fetch');
    }
  }, [user?.role]);

  const fetchDashboardData = async () => {
    try {
      // Fetch unread notifications count
      try {
        const notifResponse = await notificationsApi.getUnreadCount();
        setUnreadNotifications(notifResponse.data.count || 0);
      } catch (error) {
        console.log('Notifications not available');
      }

      if (user?.role === 'CLIENT') {
        await fetchClientDashboard();
      } else if (user?.role === 'MASTER') {
        await fetchMasterDashboard();
      }
    } catch (error: any) {
      console.error('Failed to fetch dashboard data', error);
      if (error?.response?.status === 401) {
        console.log('Unauthorized - token may have expired');
        // The API client will handle token refresh automatically
      }
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const fetchClientDashboard = async () => {
    try {
      console.log('Fetching client dashboard stats...');
      // Fetch stats
      const statsResponse = await profileApi.getClientStats();
      console.log('Client stats response:', statsResponse.data);
      // Convert snake_case to camelCase
      const rawStats = statsResponse.data as any;
      setStats({
        activeOrders: rawStats.active_orders || 0,
        completedOrders: rawStats.completed_orders || 0,
        totalSpent: rawStats.total_spent || 0,
        favoriteMasters: rawStats.favorite_masters || 0,
      });

      // Fetch active orders with progress
      const ordersResponse = await ordersApi.getMyOrders('IN_PROGRESS');
      setActiveOrders(ordersResponse.data.results || []);

      // Fetch new applications
      const appsResponse = await applicationsApi.getMyApplications();
      const newApps = (appsResponse.data.results || []).filter(
        (app: any) => app.status === 'PENDING' && !app.viewed_at
      ).slice(0, 3);
      setNewApplications(newApps);

      // TODO: Fetch favorite masters when endpoint is ready
      setFavoriteMasters([]);
    } catch (error: any) {
      console.error('Failed to fetch client dashboard', error);
      console.error('Error details:', error.response?.data || error.message);
      // Set default values on error
      setStats({
        activeOrders: 0,
        completedOrders: 0,
        totalSpent: 0,
        favoriteMasters: 0,
      });
    }
  };

  const fetchMasterDashboard = async () => {
    try {
      console.log('Fetching master dashboard stats...');
      
      // Fetch master profile to check verification status
      try {
        const profileResponse = await profileApi.getMasterProfile();
        setMasterProfile(profileResponse.data);
      } catch (error) {
        console.log('Could not fetch master profile');
      }
      
      // Fetch stats
      const statsResponse = await profileApi.getMasterStats();
      console.log('Master stats response:', statsResponse.data);
      // Convert snake_case to camelCase
      const rawStats = statsResponse.data as any;
      setStats({
        activeOrders: rawStats.active_orders || 0,
        completedOrders: rawStats.completed_orders || 0,
        totalEarned: rawStats.total_earned || 0,
        averageRating: rawStats.average_rating || 0,
        pendingApplications: rawStats.pending_applications || 0,
        unreadMessages: rawStats.unread_messages || 0,
      });

      // Fetch urgent jobs
      const jobsResponse = await ordersApi.listOrders({
        status: 'ACTIVE',
        is_urgent: true,
        page_size: 5
      });
      setUrgentJobs(jobsResponse.data.results || []);

      // Fetch active orders for calendar
      const ordersResponse = await ordersApi.getMyOrders('IN_PROGRESS');
      const orders = ordersResponse.data.results || [];
      setActiveOrders(orders);
      
      // Extract work dates for calendar
      const dates = orders.map((order: Order) => order.createdAt);
      setWorkDates(dates);

      // Fetch my applications
      const appsResponse = await applicationsApi.getMyApplications();
      const pendingApps = (appsResponse.data.results || []).filter(
        (app: any) => app.status === 'PENDING'
      ).slice(0, 3);
      setNewApplications(pendingApps);
    } catch (error: any) {
      console.error('Failed to fetch master dashboard', error);
      console.error('Error details:', error.response?.data || error.message);
      // Set default values on error
      setStats({
        activeOrders: 0,
        completedOrders: 0,
        totalEarned: 0,
        averageRating: 0,
        pendingApplications: 0,
        unreadMessages: 0,
      });
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Доброе утро';
    if (hour < 18) return 'Добрый день';
    return 'Добрый вечер';
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
      style={{ backgroundColor: theme.background }}
      contentContainerStyle={{ paddingBottom: 100 }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.tint} />
      }
      showsVerticalScrollIndicator={false}
    >
      {/* Header with Gradient */}
      <LinearGradient
        colors={[theme.tint, theme.tint + 'DD']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: insets.top + 16 }]}
      >
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.greeting}>{getGreeting()}</Text>
            <Text style={styles.userName}>{user?.firstName || 'Пользователь'}</Text>
            {user?.city && (
              <View style={styles.location}>
                <Ionicons name="location" size={14} color="rgba(255,255,255,0.9)" />
                <Text style={styles.locationText}>{user.city}</Text>
              </View>
            )}
          </View>
          
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.notificationButton}
              onPress={() => router.push('/notifications' as any)}
            >
              <Ionicons name="notifications-outline" size={24} color="white" />
              {unreadNotifications > 0 && (
                <View style={styles.notificationBadge}>
                  <Text style={styles.notificationBadgeText}>
                    {unreadNotifications > 9 ? '9+' : unreadNotifications}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>

      <View style={styles.content}>
        {/* CLIENT DASHBOARD */}
        {user?.role === 'CLIENT' && (
          <>
            {/* Stats */}
            <View style={styles.section}>
              <View style={styles.statsGrid}>
                <StatCard
                  title="Активные"
                  value={stats?.activeOrders || 0}
                  icon="briefcase"
                  onPress={() => router.push('/my-jobs' as any)}
                />
                <StatCard
                  title="Новые отклики"
                  value={newApplications.length}
                  icon="mail"
                  onPress={() => router.push('/(tabs)/responses')}
                />
                <StatCard
                  title="Завершено"
                  value={stats?.completedOrders || 0}
                  icon="checkmark-circle"
                />
                <StatCard
                  title="Потрачено"
                  value={`$${stats?.totalSpent || 0}`}
                  icon="wallet"
                />
              </View>
            </View>

            {/* Urgent Applications */}
            {newApplications.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <View style={styles.sectionTitleRow}>
                    <Ionicons name="flame" size={20} color="#FF3B30" />
                    <Text style={[styles.sectionTitle, { color: theme.text }]}>
                      Новые отклики
                    </Text>
                    <View style={[styles.badge, { backgroundColor: '#FF3B30' }]}>
                      <Text style={styles.badgeText}>{newApplications.length}</Text>
                    </View>
                  </View>
                  <TouchableOpacity onPress={() => router.push('/(tabs)/responses')}>
                    <Text style={[styles.sectionAction, { color: theme.tint }]}>Все</Text>
                  </TouchableOpacity>
                </View>
                {newApplications.map((app) => (
                  <TouchableOpacity
                    key={app.id}
                    style={[styles.applicationCard, { backgroundColor: theme.card }]}
                    onPress={() => router.push(`/jobs/${app.order_id}/applications` as any)}
                  >
                    <View style={styles.appHeader}>
                      <Text style={[styles.appTitle, { color: theme.text }]} numberOfLines={1}>
                        {app.order_title || 'Заказ'}
                      </Text>
                      <Text style={[styles.appPrice, { color: theme.tint }]}>
                        ${app.proposed_price}
                      </Text>
                    </View>
                    <Text style={[styles.appMaster, { color: theme.text + '66' }]}>
                      От: {app.master?.name || 'Мастер'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Progress of Active Works */}
            {activeOrders.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <View style={styles.sectionTitleRow}>
                    <Ionicons name="trending-up" size={20} color={theme.tint} />
                    <Text style={[styles.sectionTitle, { color: theme.text }]}>
                      В процессе
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => router.push('/my-jobs' as any)}>
                    <Text style={[styles.sectionAction, { color: theme.tint }]}>Все</Text>
                  </TouchableOpacity>
                </View>
                {activeOrders.slice(0, 3).map((order) => (
                  <ProgressOrderCard
                    key={order.id}
                    title={order.title}
                    masterName={order.masterName}
                    progress={order.status === 'READY_TO_CONFIRM' ? 95 : 50}
                    status={order.status}
                    dueDate={order.deadline ? formatDate(order.deadline) : undefined}
                    onPress={() => router.push(`/jobs/${order.id}` as any)}
                  />
                ))}
              </View>
            )}

            {/* Favorite Masters */}
            {favoriteMasters.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <View style={styles.sectionTitleRow}>
                    <Ionicons name="star" size={20} color="#FFD700" />
                    <Text style={[styles.sectionTitle, { color: theme.text }]}>
                      Избранные мастера
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => router.push('/profile/favorites' as any)}>
                    <Text style={[styles.sectionAction, { color: theme.tint }]}>Все</Text>
                  </TouchableOpacity>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {favoriteMasters.map((master) => (
                    <TouchableOpacity
                      key={master.id}
                      style={[styles.masterCard, { backgroundColor: theme.card }]}
                      onPress={() => router.push(`/masters/${master.id}` as any)}
                    >
                      <View style={[styles.masterAvatar, { backgroundColor: theme.tint + '20' }]}>
                        <Ionicons name="person" size={24} color={theme.tint} />
                      </View>
                      <Text style={[styles.masterName, { color: theme.text }]} numberOfLines={1}>
                        {master.name}
                      </Text>
                      <View style={styles.masterRating}>
                        <Ionicons name="star" size={12} color="#FFD700" />
                        <Text style={[styles.masterRatingText, { color: theme.text + '66' }]}>
                          {master.rating}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Quick Action */}
            <TouchableOpacity
              style={[styles.quickAction, { backgroundColor: theme.tint }]}
              onPress={() => router.push('/create-job' as any)}
            >
              <Ionicons name="add-circle-outline" size={24} color="white" />
              <Text style={styles.quickActionText}>Создать новый заказ</Text>
            </TouchableOpacity>
          </>
        )}

        {/* MASTER DASHBOARD */}
        {user?.role === 'MASTER' && (
          <>
            {/* Verification Alert */}
            {masterProfile && !masterProfile.isVerified && (
              <View style={styles.section}>
                <TouchableOpacity
                  style={[styles.verificationAlert, { backgroundColor: '#FFF3CD', borderColor: '#FFC107' }]}
                  onPress={() => router.push('/verification' as any)}
                >
                  <View style={styles.alertIcon}>
                    <Ionicons name="alert-circle" size={24} color="#FF9800" />
                  </View>
                  <View style={styles.alertContent}>
                    <Text style={styles.alertTitle}>Верификация не пройдена</Text>
                    <Text style={styles.alertText}>
                      Пройдите верификацию, чтобы получить больше заказов и доверие клиентов
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#FF9800" />
                </TouchableOpacity>
              </View>
            )}

            {/* Stats */}
            <View style={styles.section}>
              <View style={styles.statsGrid}>
                <StatCard
                  title="Заработок"
                  value={`$${stats?.totalEarned || 0}`}
                  icon="cash"
                  subtitle="Всего"
                />
                <StatCard
                  title="Активные"
                  value={stats?.activeOrders || 0}
                  icon="briefcase"
                  onPress={() => router.push('/my-jobs' as any)}
                />
                <StatCard
                  title="Завершено"
                  value={stats?.completedOrders || 0}
                  icon="checkmark-circle"
                />
                <StatCard
                  title="Рейтинг"
                  value={stats?.averageRating?.toFixed(1) || '0.0'}
                  icon="star"
                />
              </View>
            </View>

            {/* Calendar */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionTitleRow}>
                  <Ionicons name="calendar" size={20} color={theme.tint} />
                  <Text style={[styles.sectionTitle, { color: theme.text }]}>
                    Мои работы
                  </Text>
                </View>
              </View>
              <MiniCalendar
                workDates={workDates}
                onDayPress={(date) => console.log('Selected date:', date)}
              />
            </View>

            {/* Urgent Jobs */}
            {urgentJobs.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <View style={styles.sectionTitleRow}>
                    <Ionicons name="flash" size={20} color="#FF3B30" />
                    <Text style={[styles.sectionTitle, { color: theme.text }]}>
                      Срочные работы
                    </Text>
                    <View style={[styles.badge, { backgroundColor: '#FF3B30' }]}>
                      <Text style={styles.badgeText}>{urgentJobs.length}</Text>
                    </View>
                  </View>
                  <TouchableOpacity onPress={() => router.push('/(tabs)/jobs')}>
                    <Text style={[styles.sectionAction, { color: theme.tint }]}>Все</Text>
                  </TouchableOpacity>
                </View>
                {urgentJobs.slice(0, 3).map((job) => (
                  <TouchableOpacity
                    key={job.id}
                    style={[styles.jobCard, { backgroundColor: theme.card }]}
                    onPress={() => router.push(`/jobs/${job.id}` as any)}
                  >
                    <View style={styles.jobHeader}>
                      <Text style={[styles.jobTitle, { color: theme.text }]} numberOfLines={1}>
                        {job.title}
                      </Text>
                      <View style={styles.urgentBadge}>
                        <Ionicons name="flash" size={12} color="#FF3B30" />
                        <Text style={styles.urgentText}>СРОЧНО</Text>
                      </View>
                    </View>
                    <View style={styles.jobFooter}>
                      <View style={styles.jobInfo}>
                        <Ionicons name="location-outline" size={14} color={theme.text + '66'} />
                        <Text style={[styles.jobInfoText, { color: theme.text + '66' }]}>
                          {job.city}
                        </Text>
                      </View>
                      <Text style={[styles.jobPrice, { color: theme.tint }]}>
                        {job.budgetType === 'NEGOTIABLE' ? 'Договорная' : `от $${job.budgetMin}`}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Quick Actions */}
            {newApplications.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <View style={styles.sectionTitleRow}>
                    <Ionicons name="paper-plane" size={20} color={theme.tint} />
                    <Text style={[styles.sectionTitle, { color: theme.text }]}>
                      Мои отклики
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => router.push('/(tabs)/responses')}>
                    <Text style={[styles.sectionAction, { color: theme.tint }]}>Все</Text>
                  </TouchableOpacity>
                </View>
                {newApplications.map((app) => (
                  <TouchableOpacity
                    key={app.id}
                    style={[styles.applicationCard, { backgroundColor: theme.card }]}
                    onPress={() => router.push(`/jobs/${app.order_id}` as any)}
                  >
                    <View style={styles.appHeader}>
                      <Text style={[styles.appTitle, { color: theme.text }]} numberOfLines={1}>
                        {app.order_title || 'Заказ'}
                      </Text>
                      <View style={[styles.statusBadge, { backgroundColor: '#FF9500' + '20' }]}>
                        <Text style={[styles.statusBadgeText, { color: '#FF9500' }]}>
                          Ожидание
                        </Text>
                      </View>
                    </View>
                    <Text style={[styles.appMaster, { color: theme.text + '66' }]}>
                      Ваше предложение: ${app.proposed_price}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Quick Action */}
            <TouchableOpacity
              style={[styles.quickAction, { backgroundColor: theme.tint }]}
              onPress={() => router.push('/(tabs)/jobs')}
            >
              <Ionicons name="search" size={24} color="white" />
              <Text style={styles.quickActionText}>Найти новые работы</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </ScrollView>
  );
}


const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  greeting: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '500',
    marginBottom: 4,
  },
  userName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  location: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '500',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 5,
    borderWidth: 2,
    borderColor: 'white',
  },
  notificationBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  content: {
    paddingHorizontal: 20,
    marginTop: -12,
  },
  section: {
    marginBottom: 24,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  badgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  sectionAction: {
    fontSize: 14,
    fontWeight: '600',
  },
  applicationCard: {
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  appHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  appTitle: {
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  appPrice: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  appMaster: {
    fontSize: 13,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  masterCard: {
    width: 100,
    padding: 12,
    borderRadius: 12,
    marginRight: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  masterAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  masterName: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 4,
  },
  masterRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  masterRatingText: {
    fontSize: 12,
  },
  jobCard: {
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  jobHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  jobTitle: {
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  urgentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF3B30' + '15',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  urgentText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FF3B30',
  },
  jobFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  jobInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  jobInfoText: {
    fontSize: 13,
  },
  jobPrice: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  quickAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 16,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  quickActionText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  verificationAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  alertIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 152, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertContent: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#F57C00',
    marginBottom: 4,
  },
  alertText: {
    fontSize: 13,
    color: '#795548',
    lineHeight: 18,
  },
});
