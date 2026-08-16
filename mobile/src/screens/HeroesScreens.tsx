import { useCallback, useState } from 'react';
import {
  Alert,
  FlatList,
  Image,
  Linking,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { useAuth } from '../AuthContext';
import { useFavorites } from '../FavoritesContext';
import {
  apiErrorMessage,
  createHero,
  deleteHero,
  getHero,
  listHeroes,
  listMissions,
  searchHeroImages,
  updateHero,
} from '../api';
import {
  ChoiceRow,
  FormField,
  HeroCard,
  PageHeader,
  PrimaryButton,
  ScreenState,
} from '../components';
import { colors } from '../theme';
import type { Hero, HeroImageCandidate, HeroPayload, HeroState, Mission } from '../types';
import type { HeroesStackParamList } from '../navigation.types';

type ListProps = NativeStackScreenProps<HeroesStackParamList, 'HeroesList'>;
type DetailProps = NativeStackScreenProps<HeroesStackParamList, 'HeroDetail'>;
type FormProps = NativeStackScreenProps<HeroesStackParamList, 'HeroForm'>;

function missionsForHero(missions: Mission[], heroId: string, state: Mission['estado']): Mission[] {
  return missions.filter((mission) => mission.superheroe_id === heroId && mission.estado === state);
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat('es-EC', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${value}T00:00:00.000Z`));
}

export function HeroesListScreen({ navigation }: ListProps) {
  const { user } = useAuth();
  const { favoriteIds, toggle } = useFavorites();
  const [heroes, setHeroes] = useState<Hero[]>([]);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async (name?: string, refresh = false) => {
    if (refresh) setRefreshing(true);
    else setLoading(true);
    setError('');
    try {
      const [heroData, missionData] = await Promise.all([listHeroes(name), listMissions()]);
      setHeroes(heroData);
      setMissions(missionData);
    } catch (requestError) {
      setError(apiErrorMessage(requestError, 'No fue posible cargar los héroes.'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load(search.trim() || undefined);
    }, [load, search]),
  );

  return (
    <View style={styles.screen}>
      <PageHeader
        eyebrow="DIRECTORIO OPERATIVO"
        title="Héroes"
        action={
          user?.rol === 'ADMIN' ? (
            <PrimaryButton compact onPress={() => navigation.navigate('HeroForm')}>
              Nuevo
            </PrimaryButton>
          ) : undefined
        }
      />
      <View style={styles.searchRow}>
        <View style={styles.searchField}>
          <FormField
            label="Buscar por nombre"
            value={search}
            onChangeText={setSearch}
            returnKeyType="search"
            onSubmitEditing={() => void load(search.trim() || undefined)}
          />
        </View>
        <PrimaryButton compact onPress={() => void load(search.trim() || undefined)}>
          Buscar
        </PrimaryButton>
      </View>
      {loading || error ? (
        <ScreenState
          loading={loading}
          error={error}
          onRetry={() => void load(search.trim() || undefined)}
        />
      ) : (
        <FlatList
          data={heroes}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <HeroCard
              hero={item}
              activeMissions={missionsForHero(missions, item.id, 'EN_PROGRESO')}
              favorite={favoriteIds.has(item.id)}
              onToggleFavorite={() => void toggle(item.id)}
              onPress={() => navigation.navigate('HeroDetail', { heroId: item.id })}
            />
          )}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListEmptyComponent={
            <ScreenState
              empty={search ? 'No encontramos coincidencias.' : 'Todavía no hay héroes.'}
            />
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              tintColor={colors.red}
              onRefresh={() => void load(search.trim() || undefined, true)}
            />
          }
        />
      )}
    </View>
  );
}

export function HeroDetailScreen({ route, navigation }: DetailProps) {
  const { user } = useAuth();
  const { favoriteIds, toggle } = useFavorites();
  const [hero, setHero] = useState<Hero | null>(null);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setError('');
    try {
      const [heroData, missionData] = await Promise.all([
        getHero(route.params.heroId),
        listMissions(),
      ]);
      setHero(heroData);
      setMissions(missionData);
    } catch (requestError) {
      setError(apiErrorMessage(requestError, 'No fue posible cargar el detalle.'));
    }
  }, [route.params.heroId]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  function confirmDelete() {
    if (!hero) return;
    Alert.alert('Eliminar héroe', `¿Eliminar a ${hero.nombre}?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: () => {
          deleteHero(hero.id)
            .then(() => navigation.goBack())
            .catch((requestError) =>
              Alert.alert(
                'No se pudo eliminar',
                apiErrorMessage(requestError, 'El héroe tiene información asociada.'),
              ),
            );
        },
      },
    ]);
  }

  if (!hero || error)
    return (
      <View style={styles.screen}>
        <ScreenState loading={!error} error={error} onRetry={() => void load()} />
      </View>
    );

  const active = missionsForHero(missions, hero.id, 'EN_PROGRESO');
  const history = missionsForHero(missions, hero.id, 'COMPLETADA');

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.detailContent}>
      {hero.imagen_url ? (
        <Image source={{ uri: hero.imagen_url }} style={styles.detailImage} />
      ) : (
        <View style={[styles.detailImage, styles.fallback]}>
          <Text style={styles.fallbackText}>HT</Text>
        </View>
      )}
      <View style={styles.detailTitleRow}>
        <View style={styles.flex}>
          <Text style={styles.detailRealName}>{hero.nombre_real}</Text>
          <Text style={styles.detailTitle}>{hero.nombre}</Text>
        </View>
        <Pressable onPress={() => void toggle(hero.id)}>
          <Text
            style={[styles.detailFavorite, favoriteIds.has(hero.id) && styles.favoriteSelected]}
          >
            {favoriteIds.has(hero.id) ? '★' : '☆'}
          </Text>
        </Pressable>
      </View>
      <View style={styles.detailGrid}>
        <Data label="Poder principal" value={hero.poder_principal} />
        <Data label="Nivel de poder" value={`${hero.nivel_poder} / 100`} />
        <Data label="Estado" value={hero.estado} />
      </View>

      <MissionSection
        title="Misiones activas"
        missions={active}
        empty="Sin operaciones en progreso."
      />
      <MissionSection
        title="Historial de misiones"
        missions={history}
        empty="Aún no tiene misiones completadas."
      />

      {user?.rol === 'ADMIN' ? (
        <View style={styles.adminActions}>
          <PrimaryButton onPress={() => navigation.navigate('HeroForm', { heroId: hero.id })}>
            Editar héroe
          </PrimaryButton>
          <Pressable style={styles.deleteButton} onPress={confirmDelete}>
            <Text style={styles.deleteText}>Eliminar héroe</Text>
          </Pressable>
        </View>
      ) : null}
      <Pressable onPress={() => void Linking.openURL('https://comicvine.gamespot.com/')}>
        <Text style={styles.credit}>Datos e imágenes: Comic Vine</Text>
      </Pressable>
    </ScrollView>
  );
}

function Data({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.data}>
      <Text style={styles.dataLabel}>{label}</Text>
      <Text style={styles.dataValue}>{value}</Text>
    </View>
  );
}

function MissionSection({
  title,
  missions,
  empty,
}: {
  title: string;
  missions: Mission[];
  empty: string;
}) {
  return (
    <View style={styles.missionSection}>
      <View style={styles.sectionHeading}>
        <Text style={styles.sectionHeadingText}>{title}</Text>
        <Text style={styles.sectionCount}>{missions.length}</Text>
      </View>
      {missions.length ? (
        missions.map((mission) => (
          <View style={styles.historyItem} key={mission.id}>
            <View style={styles.flex}>
              <Text style={styles.historyTitle}>{mission.titulo}</Text>
              <Text style={styles.historyMeta}>
                {formatDate(mission.fecha)} · {mission.ubicacion}
              </Text>
            </View>
            <Text style={styles.historyDanger}>{mission.nivel_peligro}</Text>
          </View>
        ))
      ) : (
        <Text style={styles.emptyText}>{empty}</Text>
      )}
    </View>
  );
}

export function HeroFormScreen({ route, navigation }: FormProps) {
  const heroId = route.params?.heroId;
  const [name, setName] = useState('');
  const [realName, setRealName] = useState('');
  const [power, setPower] = useState('');
  const [level, setLevel] = useState('50');
  const [state, setState] = useState<HeroState>('ACTIVO');
  const [imageUrl, setImageUrl] = useState('');
  const [candidates, setCandidates] = useState<HeroImageCandidate[]>([]);
  const [loading, setLoading] = useState(Boolean(heroId));
  const [saving, setSaving] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  const [error, setError] = useState('');

  useFocusEffect(
    useCallback(() => {
      if (!heroId) return;
      setLoading(true);
      getHero(heroId)
        .then((hero) => {
          setName(hero.nombre);
          setRealName(hero.nombre_real);
          setPower(hero.poder_principal);
          setLevel(String(hero.nivel_poder));
          setState(hero.estado);
          setImageUrl(hero.imagen_url || '');
        })
        .catch((requestError) =>
          setError(apiErrorMessage(requestError, 'No fue posible cargar el héroe.')),
        )
        .finally(() => setLoading(false));
    }, [heroId]),
  );

  async function findImages() {
    if (name.trim().length < 2) {
      setError('Escribe el nombre del héroe en inglés.');
      return;
    }
    setImageLoading(true);
    setError('');
    try {
      setCandidates(await searchHeroImages(name.trim()));
    } catch (requestError) {
      setError(apiErrorMessage(requestError, 'No fue posible buscar imágenes.'));
    } finally {
      setImageLoading(false);
    }
  }

  async function save() {
    const numericLevel = Number(level);
    if (
      !name.trim() ||
      !realName.trim() ||
      !power.trim() ||
      !Number.isInteger(numericLevel) ||
      numericLevel < 1 ||
      numericLevel > 100
    ) {
      setError('Completa los campos y usa un nivel de poder entre 1 y 100.');
      return;
    }
    const payload: HeroPayload = {
      nombre: name.trim(),
      nombre_real: realName.trim(),
      poder_principal: power.trim(),
      nivel_poder: numericLevel,
      imagen_url: imageUrl.trim() || null,
      estado: state,
    };
    setSaving(true);
    setError('');
    try {
      if (heroId) await updateHero(heroId, payload);
      else await createHero(payload);
      navigation.goBack();
    } catch (requestError) {
      setError(apiErrorMessage(requestError, 'No fue posible guardar el héroe.'));
    } finally {
      setSaving(false);
    }
  }

  if (loading)
    return (
      <View style={styles.screen}>
        <ScreenState loading />
      </View>
    );

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.formContent}
      keyboardShouldPersistTaps="handled"
    >
      <PageHeader eyebrow="ADMINISTRACIÓN" title={heroId ? 'Editar héroe' : 'Nuevo héroe'} />
      {error ? <Text style={styles.formError}>{error}</Text> : null}
      <FormField label="Nombre heroico" value={name} onChangeText={setName} />
      <FormField label="Nombre real" value={realName} onChangeText={setRealName} />
      <FormField label="Poder principal" value={power} onChangeText={setPower} />
      <FormField
        label="Nivel de poder"
        value={level}
        onChangeText={setLevel}
        keyboardType="number-pad"
      />
      <ChoiceRow
        label="Estado"
        options={['ACTIVO', 'INACTIVO'] as const}
        value={state}
        onChange={setState}
      />
      <View style={styles.imageSearch}>
        <FormField
          label="URL de imagen"
          value={imageUrl}
          onChangeText={setImageUrl}
          autoCapitalize="none"
          keyboardType="url"
        />
        <PrimaryButton compact disabled={imageLoading} onPress={() => void findImages()}>
          {imageLoading ? 'Buscando…' : 'Buscar en Comic Vine'}
        </PrimaryButton>
        {candidates.length ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.candidateRow}
          >
            {candidates.map((candidate) => (
              <Pressable
                key={candidate.id}
                style={[
                  styles.candidate,
                  imageUrl === candidate.image_url && styles.candidateSelected,
                ]}
                onPress={() => setImageUrl(candidate.image_url)}
              >
                <Image source={{ uri: candidate.image_url }} style={styles.candidateImage} />
                <Text style={styles.candidateName} numberOfLines={1}>
                  {candidate.name}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        ) : null}
      </View>
      <PrimaryButton disabled={saving} onPress={() => void save()}>
        {saving ? 'Guardando…' : 'Guardar héroe'}
      </PrimaryButton>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    paddingHorizontal: 18,
    paddingBottom: 14,
  },
  searchField: { flex: 1 },
  listContent: { flexGrow: 1, paddingHorizontal: 18, paddingBottom: 32 },
  separator: { height: 15 },
  detailContent: { paddingBottom: 36 },
  detailImage: { width: '100%', height: 390, backgroundColor: colors.surface },
  fallback: { alignItems: 'center', justifyContent: 'center' },
  fallbackText: { color: colors.red, fontSize: 56, fontWeight: '900' },
  detailTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    borderTopWidth: 4,
    borderTopColor: colors.red,
  },
  detailRealName: { color: colors.muted, fontSize: 12 },
  detailTitle: { color: colors.white, fontSize: 30, fontWeight: '900', textTransform: 'uppercase' },
  detailFavorite: { color: colors.white, fontSize: 38 },
  favoriteSelected: { color: colors.gold },
  detailGrid: { gap: 1, marginHorizontal: 18, backgroundColor: colors.line },
  data: { padding: 14, backgroundColor: colors.surface },
  dataLabel: { color: colors.faint, fontSize: 9, fontWeight: '900', textTransform: 'uppercase' },
  dataValue: { marginTop: 4, color: colors.text, fontSize: 14, fontWeight: '700' },
  missionSection: { marginHorizontal: 18, marginTop: 22 },
  sectionHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 9,
    borderBottomWidth: 2,
    borderBottomColor: colors.red,
  },
  sectionHeadingText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  sectionCount: { color: colors.red, fontSize: 18, fontWeight: '900' },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  historyTitle: { color: colors.text, fontSize: 13, fontWeight: '800' },
  historyMeta: { marginTop: 3, color: colors.muted, fontSize: 10 },
  historyDanger: { color: colors.gold, fontSize: 9, fontWeight: '900' },
  emptyText: { paddingVertical: 15, color: colors.muted, fontSize: 12 },
  adminActions: { gap: 10, margin: 18, marginTop: 26 },
  deleteButton: { alignItems: 'center', padding: 13 },
  deleteText: { color: colors.danger, fontWeight: '800' },
  credit: {
    marginTop: 4,
    color: colors.muted,
    fontSize: 10,
    textAlign: 'center',
    textDecorationLine: 'underline',
  },
  formContent: { gap: 17, paddingHorizontal: 18, paddingBottom: 40 },
  formError: {
    padding: 12,
    color: '#ffb5ae',
    backgroundColor: '#2a1114',
    borderLeftWidth: 2,
    borderLeftColor: colors.danger,
  },
  imageSearch: {
    gap: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.line,
    borderLeftWidth: 3,
    borderLeftColor: colors.red,
    backgroundColor: colors.surface,
  },
  candidateRow: { gap: 10 },
  candidate: {
    width: 110,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.background,
  },
  candidateSelected: { borderColor: colors.red, borderWidth: 2 },
  candidateImage: { width: '100%', height: 120 },
  candidateName: { padding: 8, color: colors.text, fontSize: 10, fontWeight: '800' },
});
