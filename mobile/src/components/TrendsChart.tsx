import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LineChart, BarChart } from 'react-native-chart-kit';

interface TrendsChartProps {
  title: string;
  data: {
    labels: string[];
    datasets: Array<{
      data: number[];
      color?: () => string;
      strokeWidth?: number;
    }>;
  };
  type?: 'line' | 'bar';
  height?: number;
}

const TrendsChart: React.FC<TrendsChartProps> = ({
  title,
  data,
  type = 'line',
  height = 220,
}) => {
  const screenWidth = Dimensions.get('window').width;

  const chartConfig = {
    backgroundColor: '#ffffff',
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '4',
      strokeWidth: '2',
      stroke: '#4CAF50',
    },
  };

  const renderChart = () => {
    if (type === 'bar') {
      return (
        <BarChart
          data={data}
          width={screenWidth - 40}
          height={height}
          chartConfig={chartConfig}
          style={styles.chart}
        />
      );
    }

    return (
      <LineChart
        data={data}
        width={screenWidth - 40}
        height={height}
        chartConfig={chartConfig}
        bezier
        style={styles.chart}
      />
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      {renderChart()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    marginHorizontal: 20,
    marginVertical: 10,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  chart: {
    borderRadius: 16,
  },
});

export default TrendsChart;