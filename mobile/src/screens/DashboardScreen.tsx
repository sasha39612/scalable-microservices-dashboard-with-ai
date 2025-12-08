import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  StatusBar,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import KPICard from '../components/KPICard';
import TrendsChart from '../components/TrendsChart';
import { useDashboardStats, useChartData } from '../hooks/useDashboard';

const DashboardScreen: React.FC = () => {
  const { data: stats, loading, error } = useDashboardStats();
  const { data: chartData, loading: chartLoading } = useChartData();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    // In a real app, you would trigger a refresh of your data here
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading Dashboard...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Icon name="error-outline" size={48} color="#F44336" />
        <Text style={styles.errorText}>Failed to load dashboard</Text>
        <Text style={styles.errorSubtext}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Dashboard</Text>
          <Text style={styles.headerSubtitle}>Monitor your system performance</Text>
        </View>

        <View style={styles.kpiGrid}>
          {stats.map((stat, index) => (
            <KPICard
              key={index}
              title={stat.title}
              value={stat.value}
              trend={stat.trend}
              trendValue={stat.trendValue}
              icon={stat.icon}
              color={stat.color}
              onPress={() => {
                // Handle KPI card press - navigate to detailed view
                // TODO: Implement navigation to detailed stat view
              }}
            />
          ))}
        </View>

        {!chartLoading && chartData && (
          <TrendsChart
            title="Performance Trends"
            data={chartData}
            type="line"
          />
        )}

        <View style={styles.insightsContainer}>
          <Text style={styles.insightsTitle}>Key Insights</Text>
          
          <View style={styles.insightCard}>
            <View style={styles.insightIconContainer}>
              <Icon name="trending-up" size={24} color="#4CAF50" />
            </View>
            <View style={styles.insightContent}>
              <Text style={styles.insightTitle}>Performance Improving</Text>
              <Text style={styles.insightDescription}>
                System response time has decreased by 15% this week
              </Text>
            </View>
          </View>

          <View style={styles.insightCard}>
            <View style={styles.insightIconContainer}>
              <Icon name="people" size={24} color="#2196F3" />
            </View>
            <View style={styles.insightContent}>
              <Text style={styles.insightTitle}>User Growth</Text>
              <Text style={styles.insightDescription}>
                Active user count reached an all-time high of 2,543
              </Text>
            </View>
          </View>

          <View style={styles.insightCard}>
            <View style={styles.insightIconContainer}>
              <Icon name="warning" size={24} color="#FF9800" />
            </View>
            <View style={styles.insightContent}>
              <Text style={styles.insightTitle}>Monitor Server Load</Text>
              <Text style={styles.insightDescription}>
                Server utilization is at 67%. Consider scaling if it exceeds 80%
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    fontSize: 18,
    color: '#666',
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#333',
    fontWeight: '600',
    marginTop: 16,
    textAlign: 'center',
  },
  errorSubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    backgroundColor: '#ffffff',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#666',
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  insightsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  insightsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  insightCard: {
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3,
  },
  insightIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  insightContent: {
    flex: 1,
  },
  insightTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  insightDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
});

export default DashboardScreen;