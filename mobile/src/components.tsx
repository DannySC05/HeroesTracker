import type { PropsWithChildren, ReactNode } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from 'react-native';

import { colors, shadows } from './theme';
import type { Hero, Mission } from './types';

export function PageHeader({
  eyebrow,
  title,
  action,
}: {
  eyebrow: string;
  title: string;
  action?: ReactNode;
}) {
  return (
    <View style={styles.pageHeader}>
      <View style={styles.pageHeaderText}>
        <Text style={styles.eyebrow}>{eyebrow}</Text>
        <Text style={styles.pageTitle}>{title}</Text>
      </View>
      {action}
    </View>
  );
}

export function ScreenState({
  loading,
  error,
  empty,
  onRetry,
}: {
  loading?: boolean;
  error?: string;
  empty?: string;
  onRetry?: () => void;
}) {
  return (
    <View style={styles.state}>
      {loading ? <ActivityIndicator color={colors.red} size="large" /> : null}
      <Text style={styles.stateTitle}>
        {loading ? 'Sincronizando' : error ? 'Algo salió mal' : 'Sin información'}
      </Text>
      <Text style={styles.stateText}>
        {error || empty || 'Consultando la API de Heroes Tracker.'}
      </Text>
      {error && onRetry ? (
        <Pressable style={styles.secondaryButton} onPress={onRetry}>
          <Text style={styles.secondaryButtonText}>Reintentar</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function PrimaryButton({
  children,
  onPress,
  disabled,
  compact,
}: PropsWithChildren<{ onPress: () => void; disabled?: boolean; compact?: boolean }>) {
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.primaryButton,
        compact && styles.compactButton,
        (pressed || disabled) && styles.buttonPressed,
      ]}
    >
      <Text style={styles.primaryButtonText}>{children}</Text>
    </Pressable>
  );
}

export function FormField({ label, ...props }: TextInputProps & { label: string }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        {...props}
        placeholderTextColor={colors.faint}
        style={[styles.input, props.multiline && styles.multiline, props.style]}
      />
    </View>
  );
}

export function ChoiceRow<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: readonly T[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.choiceRow}>
        {options.map((option) => (
          <Pressable
            key={option}
            onPress={() => onChange(option)}
            style={[styles.choice, value === option && styles.choiceSelected]}
          >
            <Text style={[styles.choiceText, value === option && styles.choiceTextSelected]}>
              {option.replaceAll('_', ' ')}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

export function HeroCard({
  hero,
  activeMissions,
  favorite,
  onPress,
  onToggleFavorite,
}: {
  hero: Hero;
  activeMissions: Mission[];
  favorite: boolean;
  onPress: () => void;
  onToggleFavorite: () => void;
}) {
  return (
    <Pressable
      style={({ pressed }) => [styles.heroCard, pressed && styles.cardPressed]}
      onPress={onPress}
    >
      {hero.imagen_url ? (
        <Image source={{ uri: hero.imagen_url }} style={styles.heroImage} resizeMode="cover" />
      ) : (
        <View style={[styles.heroImage, styles.heroFallback]}>
          <Text style={styles.heroFallbackMark}>HT</Text>
        </View>
      )}
      <View style={styles.heroOverlay} />
      <View style={styles.heroStatusRow}>
        <Text style={[styles.status, hero.estado === 'ACTIVO' ? styles.active : styles.inactive]}>
          {hero.estado}
        </Text>
        <Pressable
          accessibilityLabel={favorite ? 'Quitar de favoritos' : 'Agregar a favoritos'}
          hitSlop={10}
          onPress={(event) => {
            event.stopPropagation();
            onToggleFavorite();
          }}
        >
          <Text style={[styles.favorite, favorite && styles.favoriteSelected]}>
            {favorite ? '★' : '☆'}
          </Text>
        </Pressable>
      </View>
      <View style={styles.heroCardBody}>
        <Text style={styles.heroRealName}>{hero.nombre_real}</Text>
        <Text style={styles.heroName}>{hero.nombre}</Text>
        <Text style={styles.heroPower} numberOfLines={1}>
          {hero.poder_principal}
        </Text>
        <View style={styles.powerTrack}>
          <View style={[styles.powerValue, { width: `${hero.nivel_poder}%` }]} />
        </View>
        <View style={styles.activeMissionBox}>
          <Text style={styles.activeMissionLabel}>MISIONES ACTIVAS · {activeMissions.length}</Text>
          <Text style={styles.activeMissionText} numberOfLines={1}>
            {activeMissions[0]?.titulo || 'Sin operaciones en progreso'}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

export function MissionCard({ mission, onPress }: { mission: Mission; onPress: () => void }) {
  const dangerColor =
    mission.nivel_peligro === 'ALTO'
      ? colors.danger
      : mission.nivel_peligro === 'MEDIO'
        ? colors.gold
        : colors.cyan;

  return (
    <Pressable
      style={({ pressed }) => [styles.missionCard, pressed && styles.cardPressed]}
      onPress={onPress}
    >
      <View style={[styles.missionDanger, { borderColor: dangerColor }]}>
        <Text style={[styles.missionDangerText, { color: dangerColor }]}>
          {mission.nivel_peligro}
        </Text>
      </View>
      <View style={styles.missionBody}>
        <Text style={styles.missionState}>{mission.estado.replaceAll('_', ' ')}</Text>
        <Text style={styles.missionTitle}>{mission.titulo}</Text>
        <Text style={styles.missionDescription} numberOfLines={2}>
          {mission.descripcion}
        </Text>
        <View style={styles.missionMeta}>
          <Text style={styles.missionMetaText}>{mission.ubicacion}</Text>
          <Text style={styles.missionMetaText}>{mission.superheroe.nombre}</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pageHeader: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 16,
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 14,
  },
  pageHeaderText: { flex: 1 },
  eyebrow: { color: colors.red, fontSize: 10, fontWeight: '900', letterSpacing: 2 },
  pageTitle: {
    color: colors.text,
    fontSize: 30,
    fontWeight: '900',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  state: {
    flex: 1,
    minHeight: 300,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
    gap: 10,
  },
  stateTitle: { color: colors.text, fontSize: 18, fontWeight: '900', textTransform: 'uppercase' },
  stateText: { color: colors.muted, textAlign: 'center', lineHeight: 21 },
  primaryButton: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    borderRadius: 4,
    backgroundColor: colors.red,
  },
  compactButton: { minHeight: 38, paddingHorizontal: 14 },
  buttonPressed: { opacity: 0.65 },
  primaryButtonText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.7,
    textTransform: 'uppercase',
  },
  secondaryButton: {
    marginTop: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 4,
  },
  secondaryButtonText: { color: colors.text, fontWeight: '800' },
  field: { gap: 7 },
  fieldLabel: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  input: {
    minHeight: 50,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 4,
    color: colors.text,
    backgroundColor: colors.surface,
  },
  multiline: { minHeight: 110, paddingTop: 13, textAlignVertical: 'top' },
  choiceRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  choice: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 4,
    backgroundColor: colors.surface,
  },
  choiceSelected: { borderColor: colors.red, backgroundColor: '#2a1114' },
  choiceText: { color: colors.muted, fontSize: 10, fontWeight: '800' },
  choiceTextSelected: { color: colors.white },
  heroCard: {
    minHeight: 405,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.line,
    borderTopWidth: 3,
    borderTopColor: colors.red,
    borderRadius: 5,
    backgroundColor: colors.surface,
    ...shadows.card,
  },
  cardPressed: { opacity: 0.82, transform: [{ scale: 0.992 }] },
  heroImage: { width: '100%', height: 220, backgroundColor: colors.surfaceRaised },
  heroFallback: { alignItems: 'center', justifyContent: 'center' },
  heroFallbackMark: { color: colors.red, fontSize: 42, fontWeight: '900', letterSpacing: -3 },
  heroOverlay: {
    position: 'absolute',
    top: 130,
    right: 0,
    left: 0,
    height: 92,
    backgroundColor: 'rgba(9,9,11,0.35)',
  },
  heroStatusRow: {
    position: 'absolute',
    top: 14,
    right: 14,
    left: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  status: {
    overflow: 'hidden',
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: 2,
    fontSize: 9,
    fontWeight: '900',
  },
  active: { color: colors.white, backgroundColor: colors.red },
  inactive: { color: colors.text, backgroundColor: '#484851' },
  favorite: { color: colors.white, fontSize: 30, textShadowColor: '#000', textShadowRadius: 7 },
  favoriteSelected: { color: colors.gold },
  heroCardBody: { flex: 1, padding: 16 },
  heroRealName: { color: colors.muted, fontSize: 11 },
  heroName: {
    marginTop: 2,
    color: colors.white,
    fontSize: 22,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  heroPower: { marginTop: 7, color: colors.muted, fontSize: 12 },
  powerTrack: { height: 4, marginTop: 12, overflow: 'hidden', backgroundColor: colors.line },
  powerValue: { height: '100%', backgroundColor: colors.red },
  activeMissionBox: {
    marginTop: 14,
    padding: 10,
    borderLeftWidth: 2,
    borderLeftColor: colors.red,
    backgroundColor: '#181417',
  },
  activeMissionLabel: { color: colors.red, fontSize: 9, fontWeight: '900', letterSpacing: 0.6 },
  activeMissionText: { marginTop: 4, color: colors.text, fontSize: 11, fontWeight: '700' },
  missionCard: {
    flexDirection: 'row',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 4,
    backgroundColor: colors.surface,
    ...shadows.card,
  },
  missionDanger: {
    width: 70,
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: 3,
    backgroundColor: '#0e0e12',
  },
  missionDangerText: { fontSize: 10, fontWeight: '900', transform: [{ rotate: '-90deg' }] },
  missionBody: { flex: 1, padding: 15 },
  missionState: { color: colors.red, fontSize: 9, fontWeight: '900', letterSpacing: 0.8 },
  missionTitle: {
    marginTop: 3,
    color: colors.white,
    fontSize: 17,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  missionDescription: { marginTop: 7, color: colors.muted, fontSize: 12, lineHeight: 18 },
  missionMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 11,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
  missionMetaText: { flex: 1, color: colors.faint, fontSize: 10, fontWeight: '700' },
});
