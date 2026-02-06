import { api } from './api';

export interface AnalyticsReport {
  reportType: string;
  timeRange: {
    startDate: string;
    endDate: string;
    granularity: 'HOUR' | 'DAY' | 'WEEK' | 'MONTH' | 'QUARTER' | 'YEAR';
  };
  summary: {
    [key: string]: any;
  };
  cached: boolean;
  generatedAt: string;
}

export interface BusinessOverviewReport extends AnalyticsReport {
  reportType: 'BUSINESS_OVERVIEW';
  summary: {
    totalRevenue: number;
    totalBookings: number;
    activeUsers: number;
    completionRate: number;
    averageRating: number;
    totalDataPoints: number;
  };
  metrics: {
    revenue: {
      total: number;
      byPeriod: Array<{
        timestamp: string;
        value: number;
        label?: string;
      }>;
      growth?: number;
    };
    bookings: {
      total: number;
      byStatus: Array<{
        status: string;
        count: number;
        percentage: number;
      }>;
      completionRate: number;
      growth?: number;
    };
    users: {
      active: number;
      growth: Array<{
        timestamp: string;
        value: number;
        label?: string;
      }>;
      retention?: number;
    };
    quality: {
      averageRating: number;
      completionRate: number;
      satisfaction?: number;
    };
  };
  insights: {
    topServices: Array<{
      serviceId: string;
      serviceName: string;
      bookings: number;
      revenue: number;
      growth: number;
    }>;
    geographicDistribution: Array<{
      region: string;
      bookings: number;
      revenue: number;
      percentage: number;
    }>;
    trends: Array<{
      metric: string;
      trend: 'UP' | 'DOWN' | 'STABLE';
      change: number;
      description: string;
    }>;
    recommendations: string[];
  };
  comparison?: {
    current: any;
    compare: any;
    changes: any;
    period: {
      current: { startDate: string; endDate: string };
      compare: { startDate: string; endDate: string };
    };
  };
}

export interface RevenueAnalysisReport extends AnalyticsReport {
  reportType: 'REVENUE_ANALYSIS';
  summary: {
    totalRevenue: number;
    averageOrderValue: number;
    revenueGrowthRate: number;
    profitMargin: number;
  };
  breakdown: {
    byService: Array<{
      serviceId: string;
      serviceName: string;
      revenue: number;
      percentage: number;
      growth: number;
    }>;
    byMaster: Array<{
      masterId: string;
      masterName: string;
      revenue: number;
      percentage: number;
      bookings: number;
    }>;
    byRegion: Array<{
      region: string;
      revenue: number;
      percentage: number;
      growth: number;
    }>;
    byPeriod: Array<{
      timestamp: string;
      revenue: number;
      bookings: number;
    }>;
  };
  analysis: {
    profitability: {
      margin: number;
      costs: number;
      netProfit: number;
      trends: Array<{
        period: string;
        margin: number;
      }>;
    };
    seasonality: {
      hasSeasonality: boolean;
      peakMonths: string[];
      lowMonths: string[];
      seasonalityStrength: number;
    };
    cohorts: Array<{
      cohort: string;
      revenue: number;
      retention: number;
      lifetimeValue: number;
    }>;
    forecasting: {
      nextMonth: number;
      nextQuarter: number;
      confidence: number;
      trend: 'UP' | 'DOWN' | 'STABLE';
    };
  };
  insights: {
    topPerformers: Array<{
      type: 'service' | 'master' | 'region';
      name: string;
      revenue: number;
      growth: number;
    }>;
    underperformers: Array<{
      type: 'service' | 'master' | 'region';
      name: string;
      revenue: number;
      decline: number;
    }>;
    opportunities: string[];
    risks: string[];
  };
}

export interface CustomerInsightsReport extends AnalyticsReport {
  reportType: 'CUSTOMER_INSIGHTS';
  summary: {
    totalCustomers: number;
    newCustomers: number;
    retentionRate: number;
    churnRate: number;
    averageLifetimeValue: number;
    satisfactionScore: number;
  };
  segmentation: {
    total: number;
    segments: Array<{
      segment: string;
      count: number;
      percentage: number;
      averageSpent: number;
      totalRevenue: number;
    }>;
  };
  acquisition: {
    newCustomers: number;
    acquisitionCost: number;
    channels: Array<{
      channel: string;
      customers: number;
      cost: number;
      conversion: number;
    }>;
  };
  retention: {
    rate: number;
    bySegment: Array<{
      segment: string;
      retentionRate: number;
    }>;
    cohortAnalysis: Array<{
      cohort: string;
      month0: number;
      month1: number;
      month3: number;
      month6: number;
      month12: number;
    }>;
  };
  satisfaction: {
    averageScore: number;
    distribution: Array<{
      rating: number;
      count: number;
      percentage: number;
    }>;
    trends: Array<{
      period: string;
      score: number;
    }>;
  };
  behavior: {
    averageBookingsPerCustomer: number;
    averageOrderValue: number;
    preferredServices: Array<{
      service: string;
      bookings: number;
      percentage: number;
    }>;
    bookingPatterns: Array<{
      pattern: string;
      customers: number;
      description: string;
    }>;
  };
  churn: {
    rate: number;
    churnedCustomers: number;
    totalCustomers: number;
    averageLifespan: number;
    atRiskCustomers: Array<{
      id: string;
      name: string;
      email: string;
      lastActivity: string;
      totalBookings: number;
      totalSpent: number;
      daysSinceLastActivity: number;
    }>;
  };
  loyalty: {
    loyalCustomers: Array<{
      id: string;
      name: string;
      totalBookings: number;
      totalSpent: number;
      loyaltyScore: number;
    }>;
    loyaltyPrograms: Array<{
      program: string;
      participants: number;
      retention: number;
    }>;
  };
  insights: {
    highValueSegments: Array<{
      segment: string;
      count: number;
      lifetimeValue: number;
    }>;
    atRiskCustomers: Array<{
      id: string;
      name: string;
      riskScore: number;
    }>;
    loyalCustomers: Array<{
      id: string;
      name: string;
      loyaltyScore: number;
    }>;
    recommendations: string[];
  };
}

export interface AnalyticsRequest {
  reportType: 'BUSINESS_OVERVIEW' | 'REVENUE_ANALYSIS' | 'CUSTOMER_INSIGHTS' | 'PERFORMANCE_METRICS' | 'MARKET_TRENDS' | 'OPERATIONAL_EFFICIENCY' | 'PREDICTIVE_ANALYTICS' | 'CUSTOM_REPORT';
  timeRange: {
    startDate: string;
    endDate: string;
    granularity?: 'HOUR' | 'DAY' | 'WEEK' | 'MONTH' | 'QUARTER' | 'YEAR';
  };
  filters?: {
    userRole?: 'CLIENT' | 'MASTER' | 'ALL';
    serviceCategories?: string[];
    regions?: string[];
    masterIds?: string[];
    clientIds?: string[];
    priceRange?: {
      min: number;
      max: number;
    };
    ratingRange?: {
      min: number;
      max: number;
    };
    bookingTypes?: ('INSTANT' | 'PROJECT' | 'ALL')[];
  };
  metrics?: string[];
  compareWith?: {
    type: 'PREVIOUS_PERIOD' | 'SAME_PERIOD_LAST_YEAR' | 'CUSTOM';
    customStartDate?: string;
    customEndDate?: string;
  };
  segmentation?: {
    by: 'GEOGRAPHY' | 'DEMOGRAPHICS' | 'BEHAVIOR' | 'VALUE' | 'ACQUISITION_CHANNEL';
    segments?: string[];
  };
  customQuery?: {
    dimensions: string[];
    measures: string[];
    filters: Record<string, any>;
    orderBy?: Array<{
      field: string;
      direction: 'ASC' | 'DESC';
    }>;
    limit?: number;
  };
  exportFormat?: 'JSON' | 'CSV' | 'PDF' | 'EXCEL';
  cacheResults?: boolean;
}

export interface MasterAnalytics {
  summary: {
    totalRevenue: number;
    totalOrders: number;
    completedOrders: number;
    averageRating: number;
    completionRate: number;
    responseTime: number;
    activeProjects: number;
  };
  revenue: {
    total: number;
    byPeriod: Array<{ timestamp: string; value: number; label: string }>;
    growth: number;
    averageOrderValue: number;
  };
  orders: {
    total: number;
    byStatus: Array<{ status: string; count: number; percentage: number }>;
    completionRate: number;
    growth: number;
  };
  categories: Array<{
    category: string;
    orders: number;
    revenue: number;
    percentage: number;
  }>;
  performance: {
    averageRating: number;
    totalReviews: number;
    ratingDistribution: Array<{ rating: number; count: number; percentage: number }>;
    responseTime: number;
    completionTime: number;
  };
  clients: {
    total: number;
    new: number;
    returning: number;
    retentionRate: number;
    topClients: Array<{ id: string; name: string; orders: number; revenue: number }>;
  };
  timeRange: {
    startDate: string;
    endDate: string;
    granularity: string;
  };
  generatedAt: string;
}

export interface OrderAnalytics {
  summary: {
    totalOrders: number;
    completedOrders: number;
    inProgressOrders: number;
    cancelledOrders: number;
    averageOrderValue: number;
    totalRevenue: number;
  };
  trends: {
    ordersGrowth: number;
    revenueGrowth: number;
    averageValueGrowth: number;
  };
  byStatus: Array<{
    status: string;
    count: number;
    percentage: number;
    revenue: number;
  }>;
  byCategory: Array<{
    category: string;
    orders: number;
    revenue: number;
    avgValue: number;
  }>;
  byPeriod: Array<{
    period: string;
    orders: number;
    revenue: number;
    avgValue: number;
  }>;
  topOrders: Array<{
    id: string;
    title: string;
    revenue: number;
    status: string;
    date: string;
  }>;
  timeRange: {
    startDate: string;
    endDate: string;
  };
  generatedAt: string;
}

export interface FinancialAnalytics {
  summary: {
    totalEarnings: number;
    totalWithdrawals: number;
    totalCommissions: number;
    netIncome: number;
    pendingPayments: number;
    availableBalance: number;
  };
  breakdown: {
    earnings: {
      fromOrders: number;
      fromProjects: number;
      bonuses: number;
      tips: number;
    };
    deductions: {
      platformFee: number;
      taxes: number;
      refunds: number;
      chargebacks: number;
    };
    withdrawals: {
      total: number;
      count: number;
      averageAmount: number;
      lastWithdrawal: {
        amount: number;
        date: string;
        status: string;
      };
    };
  };
  cashFlow: Array<{
    date: string;
    income: number;
    expenses: number;
    net: number;
  }>;
  projections: {
    nextMonth: {
      estimatedEarnings: number;
      estimatedCommissions: number;
      estimatedNet: number;
      confidence: number;
    };
    nextQuarter: {
      estimatedEarnings: number;
      estimatedCommissions: number;
      estimatedNet: number;
      confidence: number;
    };
  };
  paymentMethods: Array<{
    method: string;
    count: number;
    amount: number;
    percentage: number;
  }>;
  insights: Array<{
    type: string;
    title: string;
    description: string;
    impact: string;
  }>;
  timeRange: {
    startDate: string;
    endDate: string;
  };
  generatedAt: string;
}

export const analyticsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    // Get master analytics
    getMasterAnalytics: builder.query<MasterAnalytics, {
      startDate?: string;
      endDate?: string;
      granularity?: 'DAY' | 'WEEK' | 'MONTH';
    }>({
      query: (params) => ({
        url: '/analytics/master',
        params,
      }),
      providesTags: ['Analytics'],
    }),

    // Get order analytics
    getOrderAnalytics: builder.query<OrderAnalytics, {
      startDate?: string;
      endDate?: string;
      category?: string;
    }>({
      query: (params) => ({
        url: '/analytics/orders',
        params,
      }),
      providesTags: ['Analytics'],
    }),

    // Get financial analytics
    getFinancialAnalytics: builder.query<FinancialAnalytics, {
      startDate?: string;
      endDate?: string;
    }>({
      query: (params) => ({
        url: '/analytics/financial',
        params,
      }),
      providesTags: ['Analytics'],
    }),

    // Generate analytics report - Note: advanced-analytics not in routes.json
    // Using existing analytics endpoints instead
    generateAnalyticsReport: builder.mutation<AnalyticsReport, AnalyticsRequest>({
      query: (data) => ({
        url: '/analytics/master',
        params: {
          startDate: data.timeRange.startDate,
          endDate: data.timeRange.endDate,
          granularity: data.timeRange.granularity,
        },
      }),
      invalidatesTags: ['Analytics'],
    }),

    // Get business overview - uses master analytics
    getBusinessOverview: builder.query<BusinessOverviewReport, {
      timeRange: {
        startDate: string;
        endDate: string;
        granularity?: 'DAY' | 'WEEK' | 'MONTH';
      };
      compareWith?: {
        type: 'PREVIOUS_PERIOD' | 'SAME_PERIOD_LAST_YEAR';
      };
    }>({
      query: (params) => ({
        url: '/analytics/master',
        params: {
          startDate: params.timeRange.startDate,
          endDate: params.timeRange.endDate,
          granularity: params.timeRange.granularity,
        },
      }),
      providesTags: ['Analytics'],
    }),

    // Get revenue analysis - uses financial analytics
    getRevenueAnalysis: builder.query<RevenueAnalysisReport, {
      timeRange: {
        startDate: string;
        endDate: string;
        granularity?: 'DAY' | 'WEEK' | 'MONTH';
      };
      filters?: AnalyticsRequest['filters'];
    }>({
      query: (params) => ({
        url: '/analytics/financial',
        params: {
          startDate: params.timeRange.startDate,
          endDate: params.timeRange.endDate,
        },
      }),
      providesTags: ['Analytics'],
    }),

    // Get customer insights - uses order analytics
    getCustomerInsights: builder.query<CustomerInsightsReport, {
      timeRange: {
        startDate: string;
        endDate: string;
        granularity?: 'DAY' | 'WEEK' | 'MONTH';
      };
      segmentation?: {
        by: 'GEOGRAPHY' | 'DEMOGRAPHICS' | 'BEHAVIOR' | 'VALUE';
      };
    }>({
      query: (params) => ({
        url: '/analytics/orders',
        params: {
          startDate: params.timeRange.startDate,
          endDate: params.timeRange.endDate,
        },
      }),
      providesTags: ['Analytics'],
    }),

    // Note: Export, dashboard, insights, real-time endpoints not in routes.json
    // These are placeholder implementations that may need backend routes

    // Export analytics report
    exportAnalyticsReport: builder.mutation<{
      exportUrl: string;
      fileName: string;
      format: 'CSV' | 'PDF' | 'EXCEL';
      message: string;
    }, AnalyticsRequest & {
      exportFormat: 'CSV' | 'PDF' | 'EXCEL';
    }>({
      query: (data) => ({
        url: '/analytics/financial',
        params: {
          startDate: data.timeRange.startDate,
          endDate: data.timeRange.endDate,
          export: data.exportFormat,
        },
      }),
      invalidatesTags: ['Analytics'],
    }),

    // Get analytics dashboard data
    getAnalyticsDashboard: builder.query<{
      widgets: Array<{
        id: string;
        type: 'metric' | 'chart' | 'table' | 'map';
        title: string;
        data: any;
        config: any;
      }>;
      lastUpdated: string;
    }, {
      dashboardId?: string;
      timeRange?: {
        startDate: string;
        endDate: string;
      };
    }>({
      query: (params) => ({
        url: '/analytics/master',
        params: params.timeRange,
      }),
      providesTags: ['Analytics'],
    }),

    // Save custom analytics dashboard - not implemented in backend
    saveAnalyticsDashboard: builder.mutation<{
      dashboardId: string;
      message: string;
    }, {
      name: string;
      description?: string;
      widgets: Array<{
        type: 'metric' | 'chart' | 'table' | 'map';
        title: string;
        config: any;
        position: {
          x: number;
          y: number;
          width: number;
          height: number;
        };
      }>;
      isDefault?: boolean;
    }>({
      query: (data) => ({
        url: '/analytics/master',
        method: 'GET',
      }),
      invalidatesTags: ['Analytics'],
    }),

    // Get analytics insights
    getAnalyticsInsights: builder.query<{
      insights: Array<{
        type: 'opportunity' | 'risk' | 'trend' | 'anomaly';
        title: string;
        description: string;
        impact: 'HIGH' | 'MEDIUM' | 'LOW';
        confidence: number;
        actionItems: string[];
        data: any;
      }>;
      summary: {
        totalInsights: number;
        highImpactInsights: number;
        actionableInsights: number;
      };
    }, {
      timeRange: {
        startDate: string;
        endDate: string;
      };
      categories?: string[];
    }>({
      query: (params) => ({
        url: '/analytics/master',
        params: {
          startDate: params.timeRange.startDate,
          endDate: params.timeRange.endDate,
        },
      }),
      providesTags: ['Analytics'],
    }),

    // Get real-time analytics
    getRealTimeAnalytics: builder.query<{
      metrics: {
        activeUsers: number;
        ongoingBookings: number;
        revenueToday: number;
        newSignups: number;
      };
      activity: Array<{
        timestamp: string;
        type: 'booking' | 'signup' | 'completion' | 'payment';
        description: string;
        value?: number;
      }>;
      alerts: Array<{
        type: 'warning' | 'error' | 'info';
        message: string;
        timestamp: string;
      }>;
    }, void>({
      query: () => ({
        url: '/analytics/master',
      }),
      providesTags: ['Analytics'],
    }),
  }),
});

export const {
  useGetMasterAnalyticsQuery,
  useGetOrderAnalyticsQuery,
  useGetFinancialAnalyticsQuery,
  useGenerateAnalyticsReportMutation,
  useGetBusinessOverviewQuery,
  useGetRevenueAnalysisQuery,
  useGetCustomerInsightsQuery,
  useExportAnalyticsReportMutation,
  useGetAnalyticsDashboardQuery,
  useSaveAnalyticsDashboardMutation,
  useGetAnalyticsInsightsQuery,
  useGetRealTimeAnalyticsQuery,
} = analyticsApi;