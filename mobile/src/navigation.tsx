import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { useAuth } from './AuthContext';
import { colors } from './theme';
import type {
  HeroesStackParamList,
  MainTabParamList,
  MissionsStackParamList,
  UsersStackParamList,
} from './navigation.types';
import { FavoritesScreen } from './screens/FavoritesScreen';
import { HeroDetailScreen, HeroFormScreen, HeroesListScreen } from './screens/HeroesScreens';
import { HomeScreen } from './screens/HomeScreen';
import { LoginScreen } from './screens/LoginScreen';
import {
  MissionDetailScreen,
  MissionFormScreen,
  MissionsListScreen,
} from './screens/MissionsScreens';
import { UserFormScreen, UsersListScreen } from './screens/UsersScreens';

const Tab = createBottomTabNavigator<MainTabParamList>();
const HeroesStack = createNativeStackNavigator<HeroesStackParamList>();
const MissionsStack = createNativeStackNavigator<MissionsStackParamList>();
const UsersStack = createNativeStackNavigator<UsersStackParamList>();

const navigationTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: colors.red,
    background: colors.background,
    card: colors.surface,
    text: colors.text,
    border: colors.line,
    notification: colors.red,
  },
};

const stackOptions = {
  headerStyle: { backgroundColor: colors.surface },
  headerTintColor: colors.text,
  headerTitleStyle: { fontWeight: '900' as const, fontSize: 13 },
  headerBackTitle: 'Atrás',
};

function HeroesNavigator() {
  return (
    <HeroesStack.Navigator screenOptions={stackOptions}>
      <HeroesStack.Screen
        name="HeroesList"
        component={HeroesListScreen}
        options={{ headerShown: false }}
      />
      <HeroesStack.Screen
        name="HeroDetail"
        component={HeroDetailScreen}
        options={{ title: 'Ficha del héroe' }}
      />
      <HeroesStack.Screen
        name="HeroForm"
        component={HeroFormScreen}
        options={{ title: 'Administrar héroe' }}
      />
    </HeroesStack.Navigator>
  );
}

function MissionsNavigator() {
  return (
    <MissionsStack.Navigator screenOptions={stackOptions}>
      <MissionsStack.Screen
        name="MissionsList"
        component={MissionsListScreen}
        options={{ headerShown: false }}
      />
      <MissionsStack.Screen
        name="MissionDetail"
        component={MissionDetailScreen}
        options={{ title: 'Detalle de misión' }}
      />
      <MissionsStack.Screen
        name="MissionForm"
        component={MissionFormScreen}
        options={{ title: 'Administrar misión' }}
      />
    </MissionsStack.Navigator>
  );
}

function UsersNavigator() {
  return (
    <UsersStack.Navigator screenOptions={stackOptions}>
      <UsersStack.Screen
        name="UsersList"
        component={UsersListScreen}
        options={{ headerShown: false }}
      />
      <UsersStack.Screen
        name="UserForm"
        component={UserFormScreen}
        options={{ title: 'Administrar usuario' }}
      />
    </UsersStack.Navigator>
  );
}

function MainTabs() {
  const { user } = useAuth();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.red,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabLabel,
        tabBarIcon: ({ color }) => (
          <Text style={[styles.tabIcon, { color }]}>
            {route.name === 'Inicio'
              ? '◆'
              : route.name === 'Héroes'
                ? 'H'
                : route.name === 'Misiones'
                  ? 'M'
                  : route.name === 'Usuarios'
                    ? 'U'
                    : '★'}
          </Text>
        ),
      })}
    >
      <Tab.Screen name="Inicio" component={HomeScreen} />
      <Tab.Screen name="Héroes" component={HeroesNavigator} />
      <Tab.Screen name="Misiones" component={MissionsNavigator} />
      <Tab.Screen name="Favoritos" component={FavoritesScreen} />
      {user?.rol === 'ADMIN' ? <Tab.Screen name="Usuarios" component={UsersNavigator} /> : null}
    </Tab.Navigator>
  );
}

export function AppNavigation() {
  const { status } = useAuth();

  if (status === 'loading') {
    return (
      <View style={styles.loading}>
        <View style={styles.loadingMark}>
          <Text style={styles.loadingMarkText}>HT</Text>
        </View>
        <ActivityIndicator color={colors.red} />
        <Text style={styles.loadingText}>INICIANDO CENTRO DE OPERACIONES</Text>
      </View>
    );
  }

  return (
    <NavigationContainer theme={navigationTheme}>
      {status === 'authenticated' ? <MainTabs /> : <LoginScreen />}
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    height: 66,
    paddingTop: 6,
    paddingBottom: 8,
    borderTopColor: colors.line,
    backgroundColor: colors.surface,
  },
  tabLabel: { fontSize: 9, fontWeight: '800' },
  tabIcon: { fontSize: 16, fontWeight: '900' },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    backgroundColor: colors.background,
  },
  loadingMark: {
    width: 58,
    height: 58,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.red,
  },
  loadingMarkText: { color: colors.white, fontSize: 20, fontWeight: '900' },
  loadingText: { color: colors.muted, fontSize: 9, fontWeight: '900', letterSpacing: 1.6 },
});
