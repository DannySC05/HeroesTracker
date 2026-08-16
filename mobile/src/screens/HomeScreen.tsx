import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';

import { useAuth } from '../AuthContext';
import { listHeroes, listMissions } from '../api';
import { PageHeader, ScreenState } from '../components';
import { colors } from '../theme';
import type { MainTabParamList } from '../navigation.types';

type Props = BottomTabScreenProps<MainTabParamList, 'Inicio'>;

export function HomeScreen({ navigation }: Props) {
  const { user, logout } = useAuth();
  const [counts, setCounts] = useState<{
    heroes: number;
    active: number;
    completed: number;
  } | null>(null);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    setError('');
    Promise.all([listHeroes(), listMissions()])
      .then(([heroes, missions]) => {
        setCounts({
          heroes: heroes.length,
          active: missions.filter(({ estado }) => estado === 'EN_PROGRESO').length,
          completed: missions.filter(({ estado }) => estado === 'COMPLETADA').length,
        });
      })
      .catch(() => setError('No fue posible consultar el resumen operativo.'));
  }, []);

  useFocusEffect(load);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <PageHeader eyebrow="PANEL CENTRAL" title="Inicio" />
      <View style={styles.welcome}>
        <Text style={styles.welcomeLabel}>SESIÓN ACTIVA · {user?.rol}</Text>
        <Text style={styles.welcomeTitle}>Hola, {user?.nombre}</Text>
        <Text style={styles.welcomeText}>
          Consulta el estado del equipo y las operaciones desde cualquier dispositivo.
        </Text>
      </View>

      {!counts || error ? (
        <ScreenState loading={!counts && !error} error={error} onRetry={load} />
      ) : (
        <View style={styles.stats}>
          <Stat value={counts.heroes} label="Héroes" color={colors.red} />
          <Stat value={counts.active} label="En progreso" color={colors.gold} />
          <Stat value={counts.completed} label="Completadas" color={colors.cyan} />
        </View>
      )}

      <Text style={styles.sectionTitle}>ACCESOS RÁPIDOS</Text>
      <View style={styles.actions}>
        <Action
          title="Héroes"
          description="Directorio, favoritos e historial"
          onPress={() => navigation.navigate('Héroes')}
        />
        <Action
          title="Misiones"
          description="Operaciones, estados y peligro"
          onPress={() => navigation.navigate('Misiones')}
        />
        <Action
          title="Favoritos"
          description="Tu selección guardada localmente"
          onPress={() => navigation.navigate('Favoritos')}
        />
      </View>

      <Pressable style={styles.logout} onPress={() => void logout()}>
        <Text style={styles.logoutText}>Cerrar sesión</Text>
      </Pressable>
    </ScrollView>
  );
}

function Stat({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <View style={[styles.stat, { borderTopColor: color }]}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function Action({
  title,
  description,
  onPress,
}: {
  title: string;
  description: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={({ pressed }) => [styles.action, pressed && styles.pressed]}
      onPress={onPress}
    >
      <View>
        <Text style={styles.actionTitle}>{title}</Text>
        <Text style={styles.actionText}>{description}</Text>
      </View>
      <Text style={styles.arrow}>›</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { paddingBottom: 36 },
  welcome: {
    marginHorizontal: 18,
    padding: 20,
    borderLeftWidth: 4,
    borderLeftColor: colors.red,
    backgroundColor: colors.surface,
  },
  welcomeLabel: { color: colors.red, fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  welcomeTitle: { marginTop: 6, color: colors.white, fontSize: 24, fontWeight: '900' },
  welcomeText: { marginTop: 7, color: colors.muted, fontSize: 13, lineHeight: 20 },
  stats: { flexDirection: 'row', gap: 8, margin: 18 },
  stat: { flex: 1, padding: 13, borderTopWidth: 3, backgroundColor: colors.surface },
  statValue: { fontSize: 24, fontWeight: '900' },
  statLabel: {
    marginTop: 4,
    color: colors.muted,
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  sectionTitle: {
    marginHorizontal: 18,
    marginTop: 10,
    marginBottom: 9,
    color: colors.faint,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.4,
  },
  actions: { gap: 8, marginHorizontal: 18 },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 17,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
  },
  pressed: { opacity: 0.7 },
  actionTitle: { color: colors.text, fontSize: 16, fontWeight: '900', textTransform: 'uppercase' },
  actionText: { marginTop: 3, color: colors.muted, fontSize: 11 },
  arrow: { color: colors.red, fontSize: 30, fontWeight: '300' },
  logout: { alignSelf: 'center', marginTop: 28, padding: 10 },
  logoutText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '800',
    textDecorationLine: 'underline',
  },
});
