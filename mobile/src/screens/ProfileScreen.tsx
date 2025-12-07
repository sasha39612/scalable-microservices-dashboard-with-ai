import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  StatusBar,
  TouchableOpacity,
  Image,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

const ProfileScreen: React.FC = () => {
  const profileOptions = [
    { title: 'Account Settings', icon: 'settings', color: '#666' },
    { title: 'Notifications', icon: 'notifications', color: '#666' },
    { title: 'Privacy', icon: 'privacy-tip', color: '#666' },
    { title: 'Help & Support', icon: 'help', color: '#666' },
    { title: 'About', icon: 'info', color: '#666' },
  ];

  const stats = [
    { label: 'Days Active', value: '87' },
    { label: 'Reports Generated', value: '24' },
    { label: 'Alerts Resolved', value: '156' },
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#4CAF50" />
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.profileImageContainer}>
            <Image
              source={{
                uri: 'https://ui-avatars.com/api/?name=John+Doe&background=ffffff&color=4CAF50&size=120',
              }}
              style={styles.profileImage}
            />
            <TouchableOpacity style={styles.editButton}>
              <Icon name="edit" size={20} color="#4CAF50" />
            </TouchableOpacity>
          </View>
          
          <Text style={styles.userName}>John Doe</Text>
          <Text style={styles.userEmail}>john.doe@company.com</Text>
          <Text style={styles.userRole}>System Administrator</Text>
        </View>

        <View style={styles.statsContainer}>
          <Text style={styles.sectionTitle}>Your Activity</Text>
          <View style={styles.statsGrid}>
            {stats.map((stat, index) => (
              <View key={index} style={styles.statCard}>
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.optionsContainer}>
          <Text style={styles.sectionTitle}>Settings</Text>
          
          {profileOptions.map((option, index) => (
            <TouchableOpacity key={index} style={styles.optionCard}>
              <View style={styles.optionLeft}>
                <Icon name={option.icon} size={24} color={option.color} />
                <Text style={styles.optionTitle}>{option.title}</Text>
              </View>
              <Icon name="arrow-forward-ios" size={16} color="#ccc" />
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.actionContainer}>
          <TouchableOpacity style={styles.signOutButton}>
            <Icon name="logout" size={24} color="#F44336" />
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>
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
    alignItems: 'center',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  profileImageContainer: {
    position: 'relative',
    marginBottom: 20,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: '#ffffff',
  },
  editButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#ffffff',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    color: '#ffffff',
    opacity: 0.9,
    marginBottom: 4,
  },
  userRole: {
    fontSize: 14,
    color: '#ffffff',
    opacity: 0.8,
  },
  statsContainer: {
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
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  optionsContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  optionCard: {
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionTitle: {
    fontSize: 16,
    color: '#333',
    marginLeft: 16,
    fontWeight: '500',
  },
  actionContainer: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  signOutButton: {
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F44336',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3,
  },
  signOutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F44336',
    marginLeft: 8,
  },
});

export default ProfileScreen;