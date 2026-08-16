import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '../AuthContext';
import { apiErrorMessage } from '../api';
import { FormField, PrimaryButton } from '../components';
import { colors } from '../theme';

export function LoginScreen() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit() {
    if (!email.trim() || !password) {
      setError('Ingresa tu correo y contraseña.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await login(email, password);
    } catch (requestError) {
      setError(apiErrorMessage(requestError, 'Las credenciales no son correctas.'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.brand}>
          <View style={styles.brandMark}>
            <Text style={styles.brandMarkText}>HT</Text>
          </View>
          <Text style={styles.kicker}>CENTRO DE OPERACIONES</Text>
          <Text style={styles.title}>Heroes{`\n`}Tracker</Text>
          <Text style={styles.subtitle}>Acceso seguro al directorio y control de misiones.</Text>
        </View>

        <View style={styles.form}>
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <FormField
            label="Correo electrónico"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            textContentType="emailAddress"
          />
          <View>
            <FormField
              label="Contraseña"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              textContentType="password"
              onSubmitEditing={() => void submit()}
            />
            <Pressable
              style={styles.showPassword}
              onPress={() => setShowPassword((value) => !value)}
            >
              <Text style={styles.showPasswordText}>{showPassword ? 'OCULTAR' : 'MOSTRAR'}</Text>
            </Pressable>
          </View>
          <PrimaryButton disabled={loading} onPress={() => void submit()}>
            {loading ? 'Ingresando…' : 'Iniciar sesión'}
          </PrimaryButton>
        </View>
        <Text style={styles.footer}>API REST · JWT · SUPABASE</Text>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1, justifyContent: 'center', padding: 24 },
  brand: { marginBottom: 32 },
  brandMark: {
    width: 54,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    backgroundColor: colors.red,
    transform: [{ skewX: '-8deg' }],
  },
  brandMarkText: {
    color: colors.white,
    fontSize: 20,
    fontWeight: '900',
    transform: [{ skewX: '8deg' }],
  },
  kicker: { color: colors.red, fontSize: 10, fontWeight: '900', letterSpacing: 2.2 },
  title: {
    marginTop: 5,
    color: colors.white,
    fontSize: 50,
    lineHeight: 49,
    fontWeight: '900',
    letterSpacing: -2,
    textTransform: 'uppercase',
  },
  subtitle: { maxWidth: 330, marginTop: 13, color: colors.muted, fontSize: 14, lineHeight: 21 },
  form: {
    gap: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.line,
    borderLeftWidth: 4,
    borderLeftColor: colors.red,
    borderRadius: 5,
    backgroundColor: colors.surface,
  },
  error: {
    padding: 12,
    color: '#ffb5ae',
    backgroundColor: '#2a1114',
    borderLeftWidth: 2,
    borderLeftColor: colors.danger,
    fontSize: 12,
    lineHeight: 18,
  },
  showPassword: { position: 'absolute', right: 13, bottom: 16 },
  showPasswordText: { color: colors.red, fontSize: 9, fontWeight: '900' },
  footer: {
    marginTop: 24,
    color: colors.faint,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.8,
    textAlign: 'center',
  },
});
