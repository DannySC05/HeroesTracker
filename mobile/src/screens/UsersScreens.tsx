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

import {
  apiErrorMessage,
  createConsultationUser,
  listConsultationUsers,
  updateConsultationUser,
} from '../api';
import { ChoiceRow, FormField, PageHeader, PrimaryButton, ScreenState } from '../components';
import type { UsersStackParamList } from '../navigation.types';
import { colors } from '../theme';
import type { ConsultationUser } from '../types';

type ListProps = NativeStackScreenProps<UsersStackParamList, 'UsersList'>;
type FormProps = NativeStackScreenProps<UsersStackParamList, 'UserForm'>;

export function UsersListScreen({ navigation }: ListProps) {
  const [users, setUsers] = useState<ConsultationUser[]>([]);
  const [filter, setFilter] = useState<'TODOS' | 'ACTIVOS' | 'INACTIVOS'>('TODOS');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async (refresh = false) => {
    if (refresh) setRefreshing(true);
    else setLoading(true);
    setError('');
    try {
      setUsers(await listConsultationUsers());
    } catch (requestError) {
      setError(apiErrorMessage(requestError, 'No fue posible cargar los usuarios.'));
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

  const visibleUsers = useMemo(
    () =>
      users.filter(
        (user) =>
          filter === 'TODOS' ||
          (filter === 'ACTIVOS' && user.activo) ||
          (filter === 'INACTIVOS' && !user.activo),
      ),
    [filter, users],
  );

  function toggleUser(user: ConsultationUser) {
    const action = user.activo ? 'desactivar' : 'reactivar';
    Alert.alert(
      `${user.activo ? 'Desactivar' : 'Reactivar'} usuario`,
      `¿Deseas ${action} a ${user.nombre}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: user.activo ? 'Desactivar' : 'Reactivar',
          style: user.activo ? 'destructive' : 'default',
          onPress: () => {
            updateConsultationUser(user.id, {
              nombre: user.nombre,
              email: user.email,
              activo: !user.activo,
            })
              .then(() => load())
              .catch((requestError) =>
                Alert.alert(
                  'No se pudo actualizar',
                  apiErrorMessage(requestError, 'Intenta nuevamente.'),
                ),
              );
          },
        },
      ],
    );
  }

  return (
    <View style={styles.screen}>
      <PageHeader
        eyebrow="ADMINISTRACIÓN DE ACCESO"
        title="Usuarios"
        action={
          <PrimaryButton compact onPress={() => navigation.navigate('UserForm')}>
            Nuevo
          </PrimaryButton>
        }
      />
      <View style={styles.summary}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{users.length}</Text>
          <Text style={styles.summaryLabel}>TOTAL</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{users.filter((user) => user.activo).length}</Text>
          <Text style={styles.summaryLabel}>ACTIVOS</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{users.filter((user) => !user.activo).length}</Text>
          <Text style={styles.summaryLabel}>INACTIVOS</Text>
        </View>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filters}
      >
        {(['TODOS', 'ACTIVOS', 'INACTIVOS'] as const).map((option) => (
          <Pressable
            key={option}
            style={[styles.filter, filter === option && styles.filterSelected]}
            onPress={() => setFilter(option)}
          >
            <Text style={[styles.filterText, filter === option && styles.filterTextSelected]}>
              {option}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
      {loading || error ? (
        <ScreenState loading={loading} error={error} onRetry={() => void load()} />
      ) : (
        <FlatList
          data={visibleUsers}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListEmptyComponent={<ScreenState empty="No hay usuarios en este estado." />}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              tintColor={colors.red}
              onRefresh={() => void load(true)}
            />
          }
          renderItem={({ item }) => (
            <View style={styles.userCard}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{item.nombre.slice(0, 2).toUpperCase()}</Text>
              </View>
              <View style={styles.identity}>
                <Text style={[styles.status, item.activo ? styles.active : styles.inactive]}>
                  {item.activo ? 'ACTIVO' : 'INACTIVO'}
                </Text>
                <Text style={styles.name}>{item.nombre}</Text>
                <Text style={styles.email} numberOfLines={1}>
                  {item.email}
                </Text>
              </View>
              <View style={styles.actions}>
                <Pressable
                  style={styles.actionButton}
                  onPress={() => navigation.navigate('UserForm', { userId: item.id })}
                >
                  <Text style={styles.actionText}>EDITAR</Text>
                </Pressable>
                <Pressable style={styles.actionButton} onPress={() => toggleUser(item)}>
                  <Text style={[styles.actionText, item.activo && styles.dangerText]}>
                    {item.activo ? 'DESACTIVAR' : 'REACTIVAR'}
                  </Text>
                </Pressable>
              </View>
            </View>
          )}
        />
      )}
    </View>
  );
}

export function UserFormScreen({ route, navigation }: FormProps) {
  const userId = route.params?.userId;
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [accountState, setAccountState] = useState<'ACTIVO' | 'INACTIVO'>('ACTIVO');
  const [loading, setLoading] = useState(Boolean(userId));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useFocusEffect(
    useCallback(() => {
      if (!userId) return undefined;
      let active = true;
      setLoading(true);
      listConsultationUsers()
        .then((users) => {
          const user = users.find((candidate) => candidate.id === userId);
          if (!user) throw new Error('Usuario no encontrado');
          if (active) {
            setName(user.nombre);
            setEmail(user.email);
            setAccountState(user.activo ? 'ACTIVO' : 'INACTIVO');
          }
        })
        .catch((requestError) => {
          if (active) setError(apiErrorMessage(requestError, 'No se pudo cargar el usuario.'));
        })
        .finally(() => {
          if (active) setLoading(false);
        });
      return () => {
        active = false;
      };
    }, [userId]),
  );

  async function save() {
    if (!name.trim() || !email.trim() || (!userId && password.length < 8)) {
      setError('Completa nombre, email y una contraseña de al menos 8 caracteres.');
      return;
    }
    if (password && password.length < 8) {
      setError('La nueva contraseña debe tener al menos 8 caracteres.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      if (userId) {
        await updateConsultationUser(userId, {
          nombre: name.trim(),
          email: email.trim().toLowerCase(),
          activo: accountState === 'ACTIVO',
          ...(password ? { password } : {}),
        });
      } else {
        await createConsultationUser({
          nombre: name.trim(),
          email: email.trim().toLowerCase(),
          password,
        });
      }
      navigation.goBack();
    } catch (requestError) {
      setError(apiErrorMessage(requestError, 'No fue posible guardar el usuario.'));
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
      <PageHeader eyebrow="CONTROL DE ACCESO" title={userId ? 'Editar usuario' : 'Nuevo usuario'} />
      {error ? <Text style={styles.formError}>{error}</Text> : null}
      <FormField label="Nombre" value={name} onChangeText={setName} autoCapitalize="words" />
      <FormField
        label="Correo electrónico"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="email-address"
      />
      <FormField
        label={userId ? 'Nueva contraseña (opcional)' : 'Contraseña'}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        textContentType="newPassword"
      />
      {userId ? (
        <ChoiceRow
          label="Estado"
          options={['ACTIVO', 'INACTIVO'] as const}
          value={accountState}
          onChange={setAccountState}
        />
      ) : null}
      <Text style={styles.help}>
        Las cuentas CONSULTA pueden visualizar héroes y misiones, pero no modificarlos.
      </Text>
      <PrimaryButton disabled={saving} onPress={() => void save()}>
        {saving ? 'Guardando…' : 'Guardar usuario'}
      </PrimaryButton>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  summary: { flexDirection: 'row', gap: 8, paddingHorizontal: 18, paddingBottom: 12 },
  summaryItem: {
    flex: 1,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.line,
    borderLeftWidth: 3,
    borderLeftColor: colors.red,
    backgroundColor: colors.surface,
  },
  summaryValue: { color: colors.text, fontSize: 22, fontWeight: '900' },
  summaryLabel: { marginTop: 2, color: colors.muted, fontSize: 8, fontWeight: '900' },
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
  separator: { height: 10 },
  userCard: {
    padding: 14,
    borderWidth: 1,
    borderColor: colors.line,
    borderLeftWidth: 3,
    borderLeftColor: colors.red,
    backgroundColor: colors.surface,
  },
  avatar: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.red,
  },
  avatarText: { color: colors.white, fontWeight: '900' },
  identity: { marginTop: 10 },
  status: { alignSelf: 'flex-start', fontSize: 8, fontWeight: '900', letterSpacing: 1 },
  active: { color: colors.success },
  inactive: { color: colors.muted },
  name: { marginTop: 4, color: colors.text, fontSize: 18, fontWeight: '900' },
  email: { marginTop: 2, color: colors.muted, fontSize: 12 },
  actions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 13,
    paddingTop: 11,
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
  actionButton: { paddingVertical: 7, paddingRight: 12 },
  actionText: { color: colors.cyan, fontSize: 9, fontWeight: '900' },
  dangerText: { color: colors.danger },
  formContent: { gap: 17, paddingHorizontal: 18, paddingBottom: 40 },
  formError: {
    padding: 12,
    color: '#ffb5ae',
    backgroundColor: '#2a1114',
    borderLeftWidth: 2,
    borderLeftColor: colors.danger,
  },
  help: { color: colors.muted, fontSize: 12, lineHeight: 18 },
});
