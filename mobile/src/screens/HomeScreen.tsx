import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  StatusBar,
  TouchableOpacity,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

interface HomeScreenProps {
  onNavigateToDashboard?: () => void;
}

const HomeScreen: React.FC<HomeScreenProps> = ({ onNavigateToDashboard }) => {
  const quickActions = [
    { title: 'View Analytics', icon: 'analytics', color: '#4CAF50' },
    { title: 'System Status', icon: 'health-and-safety', color: '#2196F3' },
    { title: 'User Reports', icon: 'people', color: '#FF9800' },
    { title: 'Settings', icon: 'settings', color: '#9C27B0' },
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.welcomeText}>Welcome back!</Text>
          <Text style={styles.headerTitle}>Microservices Dashboard</Text>
          <Text style={styles.headerSubtitle}>
            Monitor and manage your system in real-time
          </Text>
        </View>

        <View style={styles.statsPreview}>
          <Text style={styles.sectionTitle}>Quick Overview</Text>
          <View style={styles.previewGrid}>
            <View style={styles.previewCard}>
              <Icon name="trending-up" size={24} color="#4CAF50" />
              <Text style={styles.previewValue}>+12%</Text>
              <Text style={styles.previewLabel}>Growth</Text>
            </View>
            <View style={styles.previewCard}>
              <Icon name="people" size={24} color="#2196F3" />
              <Text style={styles.previewValue}>2,543</Text>
              <Text style={styles.previewLabel}>Users</Text>
            </View>
            <View style={styles.previewCard}>
              <Icon name="check-circle" size={24} color="#4CAF50" />
              <Text style={styles.previewValue}>99.9%</Text>
              <Text style={styles.previewLabel}>Uptime</Text>
            </View>
          </View>
          
          <TouchableOpacity
            style={styles.viewDashboardButton}
            onPress={onNavigateToDashboard}
          >
            <Text style={styles.viewDashboardText}>View Full Dashboard</Text>
            <Icon name="arrow-forward" size={20} color="#ffffff" />
          </TouchableOpacity>
        </View>

        <View style={styles.quickActionsSection}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            {quickActions.map((action, index) => (
              <TouchableOpacity key={index} style={styles.actionCard}>
                <View style={[styles.actionIcon, { backgroundColor: `${action.color}20` }]}>
                  <Icon name={action.icon} size={24} color={action.color} />
                </View>
                <Text style={styles.actionTitle}>{action.title}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.alertsSection}>
          <Text style={styles.sectionTitle}>Recent Alerts</Text>
          
          <View style={styles.alertCard}>
            <Icon name="info" size={24} color="#2196F3" />
            <View style={styles.alertContent}>
              <Text style={styles.alertTitle}>System Update Available</Text>
              <Text style={styles.alertDescription}>
                A new security update is ready to install
              </Text>
              <Text style={styles.alertTime}>2 hours ago</Text>
            </View>
          </View>

          <View style={styles.alertCard}>
            <Icon name="check-circle" size={24} color="#4CAF50" />
            <View style={styles.alertContent}>
              <Text style={styles.alertTitle}>Backup Completed</Text>
              <Text style={styles.alertDescription}>
                Daily backup completed successfully
              </Text>
              <Text style={styles.alertTime}>4 hours ago</Text>
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
  scrollView: {
    flex: 1,
  },
  header: {
    backgroundColor: '#4CAF50',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 30,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  welcomeText: {
    fontSize: 16,
    color: '#ffffff',
    opacity: 0.9,
    marginBottom: 5,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#ffffff',
    opacity: 0.8,
  },
  statsPreview: {
    margin: 20,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  previewGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  previewCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
  },
  previewValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 8,
    marginBottom: 4,
  },
  previewLabel: {
    fontSize: 12,
    color: '#666',
  },
  viewDashboardButton: {
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 8,
  },
  viewDashboardText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginRight: 8,
  },
  quickActionsSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionCard: {
    width: '48%',
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
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
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  alertsSection: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  alertCard: {
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
  alertContent: {
    flex: 1,
    marginLeft: 16,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  alertDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
    lineHeight: 20,
  },
  alertTime: {
    fontSize: 12,
    color: '#999',
  },
});

export default HomeScreen;