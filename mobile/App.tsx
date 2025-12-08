import React, { useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import HomeScreen from './src/screens/HomeScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import AIChatScreen from './src/screens/AIChatScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import TabNavigation from './src/components/TabNavigation';
import { View, StyleSheet } from 'react-native';

type TabKey = 'home' | 'dashboard' | 'chat' | 'profile';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabKey>('home');

  const renderScreen = () => {
    switch (activeTab) {
      case 'home':
        return (
          <HomeScreen onNavigateToDashboard={() => setActiveTab('dashboard')} />
        );
      case 'dashboard':
        return <DashboardScreen />;
      case 'chat':
        return <AIChatScreen />;
      case 'profile':
        return <ProfileScreen />;
      default:
        return <HomeScreen />;
    }
  };

  return (
    <SafeAreaProvider>
      <View style={styles.container}>
        {renderScreen()}
        <TabNavigation activeTab={activeTab} onTabPress={setActiveTab} />
      </View>
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default App;