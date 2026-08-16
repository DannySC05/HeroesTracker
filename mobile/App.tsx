import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthProvider } from './src/AuthContext';
import { FavoritesProvider } from './src/FavoritesContext';
import { AppNavigation } from './src/navigation';

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <FavoritesProvider>
          <AppNavigation />
          <StatusBar style="light" />
        </FavoritesProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
