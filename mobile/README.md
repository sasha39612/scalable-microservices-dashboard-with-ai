# Mobile Dashboard App

A React Native mobile application for monitoring microservices dashboard with comprehensive KPI tracking and analytics.

## Features

### Dashboard Screen
- **KPI Cards**: 6 key performance indicators with trends
  - Active Users (2,543 with +12% growth)
  - Total Orders (1,234 with +8% growth)  
  - Revenue ($45,230 with +15% growth)
  - Server Load (67% with -5% improvement)
  - Response Time (245ms with -3% improvement)
  - Error Rate (0.2% with -0.1% improvement)

- **Performance Trends Chart**: Interactive line chart showing 6-month data trends
- **Key Insights**: AI-powered insights and recommendations
- **Pull-to-refresh**: Real-time data synchronization

### Home Screen
- Welcome dashboard with quick overview
- Performance preview cards
- Quick action buttons for common tasks
- Recent alerts and notifications

### Profile Screen
- User profile management
- Activity statistics
- Settings and preferences
- Account management

## Architecture

```
mobile/
├── src/
│   ├── screens/
│   │   ├── DashboardScreen.tsx     # Main dashboard with KPIs
│   │   ├── HomeScreen.tsx          # Welcome screen
│   │   └── ProfileScreen.tsx       # User profile
│   ├── components/
│   │   ├── KPICard.tsx            # Reusable KPI card component
│   │   ├── TrendsChart.tsx        # Chart component
│   │   └── TabNavigation.tsx      # Bottom tab navigation
│   ├── hooks/
│   │   └── useDashboard.ts        # Data fetching hooks
│   └── types/
│       └── dashboard.ts           # TypeScript interfaces
├── App.tsx                        # Main app component
├── package.json                   # Dependencies
└── tsconfig.json                 # TypeScript configuration
```

## Key Components

### DashboardScreen
- Displays 6 KPI cards in a responsive grid layout
- Shows performance trends with interactive charts
- Provides AI-powered insights
- Implements pull-to-refresh functionality
- Error handling and loading states

### KPICard Component
- Reusable component for displaying metrics
- Supports trend indicators (up/down arrows)
- Color-coded icons for easy identification
- Responsive design for different screen sizes

### TrendsChart Component
- Uses react-native-chart-kit for data visualization
- Supports both line and bar charts
- Configurable styling and colors
- Responsive width based on screen size

## Technologies Used

- **React Native**: Cross-platform mobile development
- **TypeScript**: Type-safe development
- **Expo**: Development and build platform
- **react-native-chart-kit**: Charts and data visualization
- **react-native-vector-icons**: Material Design icons
- **react-native-svg**: SVG support for charts

## Installation

```bash
cd mobile
npm install
# or
yarn install
```

## Running the App

```bash
# Start the development server
npm start

# Run on iOS simulator
npm run ios

# Run on Android emulator
npm run android

# Run in web browser
npm run web
```

## Data Integration

The app currently uses mock data but is designed to integrate with the backend API gateway:

```typescript
// Example API integration
const fetchDashboardStats = async () => {
  const response = await fetch('http://localhost:3001/api/dashboard/stats');
  return response.json();
};
```

## Future Enhancements

1. **Real-time Updates**: WebSocket integration for live data
2. **Push Notifications**: Alert system for critical events
3. **Offline Support**: Cache data for offline viewing
4. **Advanced Charts**: More chart types and customization
5. **User Authentication**: Secure login and session management
6. **Dark Mode**: Theme switching capability
7. **Localization**: Multi-language support