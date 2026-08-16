import { useCallback, useMemo, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';

import { useFavorites } from '../FavoritesContext';
import { apiErrorMessage, listHeroes, listMissions } from '../api';
import { HeroCard, PageHeader, ScreenState } from '../components';
import { colors } from '../theme';
import type { Hero, Mission } from '../types';
import type { MainTabParamList } from '../navigation.types';

type Props = BottomTabScreenProps<MainTabParamList, 'Favoritos'>;

export function FavoritesScreen({ navigation }: Props) {
  const { favoriteIds, ready, toggle } = useFavorites();
  const [heroes, setHeroes] = useState<Hero[]>([]);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async (refresh = false) => {
    if (refresh) setRefreshing(true);
    else setLoading(true);
    setError('');
    try {
      const [heroData, missionData] = await Promise.all([listHeroes(), listMissions()]);
      setHeroes(heroData);
      setMissions(missionData);
    } catch (requestError) {
      setError(apiErrorMessage(requestError, 'No fue posible cargar tus favoritos.'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );
  const favorites = useMemo(
    () => heroes.filter((hero) => favoriteIds.has(hero.id)),
    [favoriteIds, heroes],
  );

  return (
    <View style={styles.screen}>
      <PageHeader eyebrow="COLECCIÓN PERSONAL" title="Favoritos" />
      {loading || !ready || error ? (
        <ScreenState loading={loading || !ready} error={error} onRetry={() => void load()} />
      ) : (
        <FlatList
          data={favorites}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <HeroCard
              hero={item}
              activeMissions={missions.filter(
                (mission) => mission.superheroe_id === item.id && mission.estado === 'EN_PROGRESO',
              )}
              favorite
              onToggleFavorite={() => void toggle(item.id)}
              onPress={() =>
                navigation.navigate('Héroes', { screen: 'HeroDetail', params: { heroId: item.id } })
              }
            />
          )}
          contentContainerStyle={styles.content}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListEmptyComponent={
            <ScreenState empty="Marca héroes con la estrella para conservarlos aquí." />
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              tintColor={colors.red}
              onRefresh={() => void load(true)}
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { flexGrow: 1, paddingHorizontal: 18, paddingBottom: 32 },
  separator: { height: 15 },
});
