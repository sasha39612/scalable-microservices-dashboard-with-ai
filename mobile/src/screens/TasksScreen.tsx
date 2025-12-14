import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  StatusBar,
  TouchableOpacity,
  TextInput,
  Modal,
  FlatList,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

interface Task {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  priority: 'low' | 'medium' | 'high';
  createdAt: Date;
  updatedAt: Date;
  progress?: number;
  category: string;
  assignedTo?: string;
}

const TasksScreen: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Mock data for demonstration
  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      const mockTasks: Task[] = [
        {
          id: '1',
          title: 'Data Processing Pipeline',
          description: 'Process daily user analytics data and generate reports',
          status: 'running',
          priority: 'high',
          category: 'Analytics',
          progress: 65,
          createdAt: new Date('2024-12-10'),
          updatedAt: new Date('2024-12-14'),
          assignedTo: 'System Worker 1'
        },
        {
          id: '2',
          title: 'Database Cleanup',
          description: 'Remove outdated logs and optimize database performance',
          status: 'completed',
          priority: 'medium',
          category: 'Maintenance',
          progress: 100,
          createdAt: new Date('2024-12-13'),
          updatedAt: new Date('2024-12-14'),
          assignedTo: 'System Worker 2'
        },
        {
          id: '3',
          title: 'AI Model Training',
          description: 'Train recommendation model with latest user interaction data',
          status: 'pending',
          priority: 'high',
          category: 'Machine Learning',
          createdAt: new Date('2024-12-14'),
          updatedAt: new Date('2024-12-14'),
        },
        {
          id: '4',
          title: 'Security Audit',
          description: 'Perform comprehensive security scan on all microservices',
          status: 'failed',
          priority: 'high',
          category: 'Security',
          createdAt: new Date('2024-12-12'),
          updatedAt: new Date('2024-12-13'),
          assignedTo: 'Security Scanner'
        },
        {
          id: '5',
          title: 'Cache Optimization',
          description: 'Optimize Redis cache configuration for better performance',
          status: 'running',
          priority: 'medium',
          category: 'Performance',
          progress: 30,
          createdAt: new Date('2024-12-14'),
          updatedAt: new Date('2024-12-14'),
          assignedTo: 'System Worker 3'
        }
      ];
      setTasks(mockTasks);
      setLoading(false);
    }, 1000);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTasks();
    setRefreshing(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return '#4CAF50';
      case 'running': return '#2196F3';
      case 'pending': return '#FF9800';
      case 'failed': return '#F44336';
      default: return '#9E9E9E';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return 'check-circle';
      case 'running': return 'sync';
      case 'pending': return 'schedule';
      case 'failed': return 'error';
      default: return 'help';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return '#F44336';
      case 'medium': return '#FF9800';
      case 'low': return '#4CAF50';
      default: return '#9E9E9E';
    }
  };

  const filteredTasks = tasks.filter((task: Task) => {
    const matchesStatus = filterStatus === 'all' || task.status === filterStatus;
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         task.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const openTaskDetails = (task: Task) => {
    setSelectedTask(task);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedTask(null);
  };

  const retryTask = (taskId: string) => {
    setTasks((prev: Task[]) => prev.map((task: Task) => 
      task.id === taskId ? { ...task, status: 'pending' as const, updatedAt: new Date() } : task
    ));
    closeModal();
  };

  const TaskItem = ({ task }: { task: Task }) => (
    <TouchableOpacity style={styles.taskCard} onPress={() => openTaskDetails(task)}>
      <View style={styles.taskHeader}>
        <View style={styles.taskTitleRow}>
          <Text style={styles.taskTitle}>{task.title}</Text>
          <Icon 
            name={getStatusIcon(task.status)} 
            size={20} 
            color={getStatusColor(task.status)} 
          />
        </View>
        <View style={styles.taskMeta}>
          <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(task.priority) }]}>
            <Text style={styles.priorityText}>{task.priority}</Text>
          </View>
          <Text style={styles.categoryText}>{task.category}</Text>
        </View>
      </View>
      
      <Text style={styles.taskDescription}>{task.description}</Text>
      
      {task.progress !== undefined && (
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${task.progress}%` }]} />
          </View>
          <Text style={styles.progressText}>{task.progress}%</Text>
        </View>
      )}
      
      <View style={styles.taskFooter}>
        <Text style={styles.timestampText}>
          Updated {task.updatedAt.toLocaleDateString()}
        </Text>
        {task.assignedTo && (
          <Text style={styles.assignedText}>→ {task.assignedTo}</Text>
        )}
      </View>
    </TouchableOpacity>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <Icon name="assignment" size={48} color="#2196F3" />
        <Text style={styles.loadingText}>Loading Tasks...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Tasks & Jobs</Text>
        <Text style={styles.headerSubtitle}>Monitor system tasks and background jobs</Text>
      </View>

      {/* Search and Filter */}
      <View style={styles.controlsContainer}>
        <View style={styles.searchContainer}>
          <Icon name="search" size={20} color="#9E9E9E" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search tasks..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#9E9E9E"
          />
        </View>
        
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          style={styles.filterContainer}
        >
          {['all', 'pending', 'running', 'completed', 'failed'].map(status => (
            <TouchableOpacity
              key={status}
              style={[
                styles.filterChip,
                filterStatus === status && styles.filterChipActive
              ]}
              onPress={() => setFilterStatus(status)}
            >
              <Text style={[
                styles.filterChipText,
                filterStatus === status && styles.filterChipTextActive
              ]}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Task List */}
      <FlatList<Task>
        data={filteredTasks}
        keyExtractor={(item: Task) => item.id}
        renderItem={({ item }: { item: Task }) => <TaskItem task={item} />}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#2196F3']}
          />
        }
        contentContainerStyle={styles.taskList}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="assignment-turned-in" size={64} color="#E0E0E0" />
            <Text style={styles.emptyText}>No tasks found</Text>
            <Text style={styles.emptySubtext}>
              {searchQuery ? 'Try adjusting your search' : 'All tasks completed!'}
            </Text>
          </View>
        }
      />

      {/* Task Details Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            {selectedTask && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>{selectedTask.title}</Text>
                  <TouchableOpacity onPress={closeModal} style={styles.closeButton}>
                    <Icon name="close" size={24} color="#666" />
                  </TouchableOpacity>
                </View>
                
                <ScrollView style={styles.modalContent}>
                  <View style={styles.modalSection}>
                    <Text style={styles.modalSectionTitle}>Status</Text>
                    <View style={styles.statusRow}>
                      <Icon 
                        name={getStatusIcon(selectedTask.status)} 
                        size={20} 
                        color={getStatusColor(selectedTask.status)} 
                      />
                      <Text style={[styles.statusText, { color: getStatusColor(selectedTask.status) }]}>
                        {selectedTask.status.charAt(0).toUpperCase() + selectedTask.status.slice(1)}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.modalSection}>
                    <Text style={styles.modalSectionTitle}>Description</Text>
                    <Text style={styles.modalDescription}>{selectedTask.description}</Text>
                  </View>

                  {selectedTask.progress !== undefined && (
                    <View style={styles.modalSection}>
                      <Text style={styles.modalSectionTitle}>Progress</Text>
                      <View style={styles.progressContainer}>
                        <View style={styles.progressBar}>
                          <View style={[styles.progressFill, { width: `${selectedTask.progress}%` }]} />
                        </View>
                        <Text style={styles.progressText}>{selectedTask.progress}%</Text>
                      </View>
                    </View>
                  )}

                  <View style={styles.modalSection}>
                    <Text style={styles.modalSectionTitle}>Details</Text>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Priority:</Text>
                      <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(selectedTask.priority) }]}>
                        <Text style={styles.priorityText}>{selectedTask.priority}</Text>
                      </View>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Category:</Text>
                      <Text style={styles.detailValue}>{selectedTask.category}</Text>
                    </View>
                    {selectedTask.assignedTo && (
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Assigned to:</Text>
                        <Text style={styles.detailValue}>{selectedTask.assignedTo}</Text>
                      </View>
                    )}
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Created:</Text>
                      <Text style={styles.detailValue}>{selectedTask.createdAt.toLocaleDateString()}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Updated:</Text>
                      <Text style={styles.detailValue}>{selectedTask.updatedAt.toLocaleDateString()}</Text>
                    </View>
                  </View>
                </ScrollView>

                {selectedTask.status === 'failed' && (
                  <View style={styles.modalActions}>
                    <TouchableOpacity
                      style={styles.retryButton}
                      onPress={() => retryTask(selectedTask.id)}
                    >
                      <Icon name="refresh" size={20} color="#ffffff" />
                      <Text style={styles.retryButtonText}>Retry Task</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </>
            )}
          </View>
        </View>
      </Modal>
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
    marginTop: 16,
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  header: {
    backgroundColor: '#ffffff',
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#212121',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#666',
  },
  controlsContainer: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    height: 48,
    fontSize: 16,
    color: '#212121',
  },
  filterContainer: {
    flexDirection: 'row',
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    marginRight: 12,
  },
  filterChipActive: {
    backgroundColor: '#2196F3',
  },
  filterChipText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: '#ffffff',
  },
  taskList: {
    padding: 16,
  },
  taskCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  taskHeader: {
    marginBottom: 12,
  },
  taskTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  taskTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212121',
    flex: 1,
    marginRight: 12,
  },
  taskMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 12,
  },
  priorityText: {
    fontSize: 12,
    color: '#ffffff',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  categoryText: {
    fontSize: 14,
    color: '#666',
  },
  taskDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 12,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    marginRight: 12,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  taskFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timestampText: {
    fontSize: 12,
    color: '#9E9E9E',
  },
  assignedText: {
    fontSize: 12,
    color: '#2196F3',
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    fontWeight: '500',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9E9E9E',
    marginTop: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#212121',
    flex: 1,
    marginRight: 16,
  },
  closeButton: {
    padding: 4,
  },
  modalContent: {
    padding: 20,
  },
  modalSection: {
    marginBottom: 24,
  },
  modalSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 12,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
    textTransform: 'capitalize',
  },
  modalDescription: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    color: '#212121',
  },
  modalActions: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2196F3',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default TasksScreen;