import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

interface TabNavigationProps {
  activeTab: 'home' | 'dashboard' | 'chat' | 'profile';
  onTabPress: (tab: 'home' | 'dashboard' | 'chat' | 'profile') => void;
}

const TabNavigation: React.FC<TabNavigationProps> = ({ activeTab, onTabPress }) => {
  const tabs = [
    { key: 'home', label: 'Home', icon: 'home' },
    { key: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
    { key: 'chat', label: 'AI Chat', icon: 'chat' },
    { key: 'profile', label: 'Profile', icon: 'person' },
  ] as const;

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <View style={styles.container}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.activeTab]}
            onPress={() => onTabPress(tab.key)}
          >
            <Icon
              name={tab.icon}
              size={24}
              color={activeTab === tab.key ? '#4CAF50' : '#999'}
            />
            <Text
              style={[
                styles.tabLabel,
                activeTab === tab.key && styles.activeTabLabel,
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    paddingVertical: 8,
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  activeTab: {
    // Additional styling for active tab if needed
  },
  tabLabel: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
    fontWeight: '500',
  },
  activeTabLabel: {
    color: '#4CAF50',
    fontWeight: '600',
  },
});

export default TabNavigation;