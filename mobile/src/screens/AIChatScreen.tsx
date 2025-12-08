import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  Alert,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import ChatWindow from '../components/ChatWindow';
import { useChat } from '../hooks/useChat';

const AIChatScreen: React.FC = () => {
  const {
    messages,
    isLoading,
    error,
    sendMessage,
    createSession,
    clearCurrentChat,
  } = useChat();

  // Show error alert
  useEffect(() => {
    if (error) {
      Alert.alert(
        'Error',
        error,
        [{ text: 'OK', style: 'default' }]
      );
    }
  }, [error]);

  const handleSendMessage = (message: string) => {
    sendMessage(message);
  };

  const handleNewChat = () => {
    Alert.alert(
      'New Chat',
      'Start a new conversation?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Start New',
          style: 'default',
          onPress: () => {
            createSession();
          },
        },
      ]
    );
  };

  const handleClearChat = () => {
    if (messages.length === 0) return;
    
    Alert.alert(
      'Clear Chat',
      'This will clear all messages in the current conversation. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: clearCurrentChat,
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.aiIcon}>
            <Icon name="smart-toy" size={24} color="#6C63FF" />
          </View>
          <View>
            <Text style={styles.headerTitle}>AI Assistant</Text>
            <Text style={styles.headerSubtitle}>
              {isLoading ? 'Thinking...' : 'Online'}
            </Text>
          </View>
        </View>
        
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={handleClearChat}
            disabled={messages.length === 0}
          >
            <Icon 
              name="clear-all" 
              size={20} 
              color={messages.length === 0 ? '#CCC' : '#666'} 
            />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.headerButton}
            onPress={handleNewChat}
          >
            <Icon name="add" size={20} color="#666" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Chat Window */}
      <ChatWindow
        messages={messages}
        onSendMessage={handleSendMessage}
        isLoading={isLoading}
        isTyping={isLoading}
        error={error}
        placeholder="Ask me anything..."
        disabled={isLoading}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    backgroundColor: '#FFFFFF',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  aiIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E8E6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
  },
  headerButton: {
    padding: 8,
    marginLeft: 8,
  },
});

export default AIChatScreen;