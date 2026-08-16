import { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
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
import {
  apiErrorMessage,
  createMission,
  deleteMission,
  getMission,
  listHeroes,
  listMissions,
  updateMission,
} from '../api';
import {
  ChoiceRow,
  FormField,
  MissionCard,
  PageHeader,
  PrimaryButton,
  ScreenState,
} from '../components';
import { colors } from '../theme';
import type { Hero, Mission, MissionDangerLevel, MissionPayload, MissionState } from '../types';
import type { MissionsStackParamList } from '../navigation.types';

type ListProps = NativeStackScreenProps<MissionsStackParamList, 'MissionsList'>;
type DetailProps = NativeStackScreenProps<MissionsStackParamList, 'MissionDetail'>;
type FormProps = NativeStackScreenProps<MissionsStackParamList, 'MissionForm'>;

const STATES = ['PENDIENTE', 'EN_PROGRESO', 'COMPLETADA'] as const;
const DANGERS = ['BAJO', 'MEDIO', 'ALTO'] as const;

function formatDate(value: string): string {
  return new Intl.DateTimeFormat('es-EC', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${value}T00:00:00.000Z`));
}

export function MissionsListScreen({ navigation }: ListProps) {
  const { user } = useAuth();
  const [missions, setMissions] = useState<Mission[]>([]);
  const [state, setState] = useState<MissionState | 'TODAS'>('TODAS');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async (refresh = false) => {
    if (refresh) setRefreshing(true);
    else setLoading(true);
    setError('');
    try {
      setMissions(await listMissions());
    } catch (requestError) {
      setError(apiErrorMessage(requestError, 'No fue posible cargar las misiones.'));
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

  const visible = useMemo(
    () => missions.filter((mission) => state === 'TODAS' || mission.estado === state),
    [missions, state],
  );

  return (
    <View style={styles.screen}>
      <PageHeader
        eyebrow="CONTROL DE OPERACIONES"
        title="Misiones"
        action={
          user?.rol === 'ADMIN' ? (
            <PrimaryButton compact onPress={() => navigation.navigate('MissionForm')}>
              Nueva
            </PrimaryButton>
          ) : undefined
        }
      />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filters}
      >
        {(['TODAS', ...STATES] as const).map((option) => (
          <Pressable
            key={option}
            style={[styles.filter, state === option && styles.filterSelected]}
            onPress={() => setState(option)}
          >
            <Text style={[styles.filterText, state === option && styles.filterTextSelected]}>
              {option.replaceAll('_', ' ')}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
      {loading || error ? (
        <ScreenState loading={loading} error={error} onRetry={() => void load()} />
      ) : (
        <FlatList
          data={visible}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <MissionCard
              mission={item}
              onPress={() => navigation.navigate('MissionDetail', { missionId: item.id })}
            />
          )}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListEmptyComponent={<ScreenState empty="No hay misiones para este estado." />}
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

export function MissionDetailScreen({ route, navigation }: DetailProps) {
  const { user } = useAuth();
  const [mission, setMission] = useState<Mission | null>(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setError('');
    try {
      setMission(await getMission(route.params.missionId));
    } catch (requestError) {
      setError(apiErrorMessage(requestError, 'No fue posible cargar la misión.'));
    }
  }, [route.params.missionId]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  function confirmDelete() {
    if (!mission) return;
    Alert.alert('Eliminar misión', `¿Eliminar “${mission.titulo}”?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: () => {
          deleteMission(mission.id)
            .then(() => navigation.goBack())
            .catch((requestError) =>
              Alert.alert(
                'No se pudo eliminar',
                apiErrorMessage(requestError, 'Intenta nuevamente.'),
              ),
            );
        },
      },
    ]);
  }

  if (!mission || error)
    return (
      <View style={styles.screen}>
        <ScreenState loading={!error} error={error} onRetry={() => void load()} />
      </View>
    );

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.detailContent}>
      <Text style={styles.detailEyebrow}>{mission.estado.replaceAll('_', ' ')}</Text>
      <Text style={styles.detailTitle}>{mission.titulo}</Text>
      <Text style={styles.detailDescription}>{mission.descripcion}</Text>
      <View style={styles.dangerBanner}>
        <Text style={styles.dangerLabel}>NIVEL DE PELIGRO</Text>
        <Text style={styles.dangerValue}>{mission.nivel_peligro}</Text>
      </View>
      <View style={styles.detailGrid}>
        <Data label="Fecha" value={formatDate(mission.fecha)} />
        <Data label="Ubicación" value={mission.ubicacion} />
        <Data label="Héroe asignado" value={mission.superheroe.nombre} />
        <Data
          label="Última actualización"
          value={new Date(mission.updated_at).toLocaleString('es-EC')}
        />
      </View>
      {user?.rol === 'ADMIN' ? (
        <View style={styles.actions}>
          <PrimaryButton
            onPress={() => navigation.navigate('MissionForm', { missionId: mission.id })}
          >
            Editar misión
          </PrimaryButton>
          <Pressable style={styles.deleteButton} onPress={confirmDelete}>
            <Text style={styles.deleteText}>Eliminar misión</Text>
          </Pressable>
        </View>
      ) : null}
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

export function MissionFormScreen({ route, navigation }: FormProps) {
  const missionId = route.params?.missionId;
  const [heroes, setHeroes] = useState<Hero[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [danger, setDanger] = useState<MissionDangerLevel>('MEDIO');
  const [state, setState] = useState<MissionState>('PENDIENTE');
  const [heroId, setHeroId] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      setError('');
      Promise.all([listHeroes(), missionId ? getMission(missionId) : Promise.resolve(null)])
        .then(([heroData, mission]) => {
          setHeroes(heroData);
          if (mission) {
            setTitle(mission.titulo);
            setDescription(mission.descripcion);
            setLocation(mission.ubicacion);
            setDate(mission.fecha);
            setDanger(mission.nivel_peligro);
            setState(mission.estado);
            setHeroId(mission.superheroe_id);
          } else setHeroId((current) => current || heroData[0]?.id || '');
        })
        .catch((requestError) =>
          setError(apiErrorMessage(requestError, 'No fue posible preparar el formulario.')),
        )
        .finally(() => setLoading(false));
    }, [missionId]),
  );

  async function save() {
    if (
      !title.trim() ||
      !description.trim() ||
      !location.trim() ||
      !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
      !heroId
    ) {
      setError('Completa los campos, selecciona un héroe y usa una fecha YYYY-MM-DD.');
      return;
    }
    const payload: MissionPayload = {
      titulo: title.trim(),
      descripcion: description.trim(),
      ubicacion: location.trim(),
      fecha: date,
      nivel_peligro: danger,
      estado: state,
      superheroe_id: heroId,
    };
    setSaving(true);
    setError('');
    try {
      if (missionId) await updateMission(missionId, payload);
      else await createMission(payload);
      navigation.goBack();
    } catch (requestError) {
      setError(apiErrorMessage(requestError, 'No fue posible guardar la misión.'));
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
      <PageHeader eyebrow="ADMINISTRACIÓN" title={missionId ? 'Editar misión' : 'Nueva misión'} />
      {error ? <Text style={styles.formError}>{error}</Text> : null}
      <FormField label="Título" value={title} onChangeText={setTitle} />
      <FormField
        label="Descripción"
        value={description}
        onChangeText={setDescription}
        multiline
        numberOfLines={4}
      />
      <FormField label="Ubicación" value={location} onChangeText={setLocation} />
      <FormField
        label="Fecha (YYYY-MM-DD)"
        value={date}
        onChangeText={setDate}
        keyboardType="numbers-and-punctuation"
      />
      <ChoiceRow label="Nivel de peligro" options={DANGERS} value={danger} onChange={setDanger} />
      <ChoiceRow label="Estado" options={STATES} value={state} onChange={setState} />
      <View style={styles.heroSelector}>
        <Text style={styles.selectorLabel}>HÉROE ASIGNADO</Text>
        {heroes.map((hero) => (
          <Pressable
            key={hero.id}
            style={[styles.heroOption, heroId === hero.id && styles.heroOptionSelected]}
            onPress={() => setHeroId(hero.id)}
          >
            <View>
              <Text style={styles.heroOptionName}>{hero.nombre}</Text>
              <Text style={styles.heroOptionReal}>{hero.nombre_real}</Text>
            </View>
            <Text style={styles.heroOptionCheck}>{heroId === hero.id ? '●' : '○'}</Text>
          </Pressable>
        ))}
      </View>
      <PrimaryButton disabled={saving || heroes.length === 0} onPress={() => void save()}>
        {saving ? 'Guardando…' : 'Guardar misión'}
      </PrimaryButton>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  filters: { gap: 8, paddingHorizontal: 18, paddingBottom: 14 },
  filter: {
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
  },
  filterSelected: { borderColor: colors.red, backgroundColor: '#2a1114' },
  filterText: { color: colors.muted, fontSize: 9, fontWeight: '900' },
  filterTextSelected: { color: colors.white },
  listContent: { flexGrow: 1, paddingHorizontal: 18, paddingBottom: 32 },
  separator: { height: 12 },
  detailContent: { padding: 20, paddingBottom: 40 },
  detailEyebrow: { color: colors.red, fontSize: 10, fontWeight: '900', letterSpacing: 1.5 },
  detailTitle: {
    marginTop: 7,
    color: colors.white,
    fontSize: 33,
    lineHeight: 37,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  detailDescription: { marginTop: 15, color: colors.muted, fontSize: 15, lineHeight: 23 },
  dangerBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 24,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: colors.gold,
    backgroundColor: colors.surface,
  },
  dangerLabel: { color: colors.muted, fontSize: 10, fontWeight: '900' },
  dangerValue: { color: colors.gold, fontSize: 19, fontWeight: '900' },
  detailGrid: { gap: 1, marginTop: 18, backgroundColor: colors.line },
  data: { padding: 15, backgroundColor: colors.surface },
  dataLabel: { color: colors.faint, fontSize: 9, fontWeight: '900', textTransform: 'uppercase' },
  dataValue: { marginTop: 5, color: colors.text, fontSize: 14, fontWeight: '700' },
  actions: { gap: 10, marginTop: 26 },
  deleteButton: { alignItems: 'center', padding: 13 },
  deleteText: { color: colors.danger, fontWeight: '800' },
  formContent: { gap: 17, paddingHorizontal: 18, paddingBottom: 40 },
  formError: {
    padding: 12,
    color: '#ffb5ae',
    backgroundColor: '#2a1114',
    borderLeftWidth: 2,
    borderLeftColor: colors.danger,
  },
  heroSelector: { gap: 7 },
  selectorLabel: { color: colors.muted, fontSize: 11, fontWeight: '800', letterSpacing: 0.6 },
  heroOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 13,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
  },
  heroOptionSelected: { borderColor: colors.red, backgroundColor: '#211114' },
  heroOptionName: { color: colors.text, fontSize: 13, fontWeight: '800' },
  heroOptionReal: { marginTop: 2, color: colors.muted, fontSize: 10 },
  heroOptionCheck: { color: colors.red, fontSize: 16 },
});
