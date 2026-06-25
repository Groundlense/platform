import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { colors, typography } from '../utils/theme';
import { t } from '../utils/translations';
import { storage } from '../services/storage';
import { api } from '../services/api';

export default function LoginScreen({ navigation }: { navigation: any }) {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [lang, setLang] = useState<'en' | 'hi'>('en');

  // Login inputs
  const [loginId, setLoginId] = useState('');
  const [loginPin, setLoginPin] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);

  const handleLogin = async () => {
    const identifier = loginId.trim();
    if (!identifier || !loginPin) {
      setLoginError('Enter your worker ID and PIN / वर्कर ID और पिन दर्ज करें');
      return;
    }
    setLoginError('');
    setLoggingIn(true);
    try {
      // api.login stores the access + refresh token pair on success
      const result = await api.login(identifier, loginPin);
      if (!result?.accessToken) {
        throw new Error('Invalid response from server');
      }
      const profile = await api.getProfile();
      await storage.saveUser(profile);
      navigation.replace('ProjectSelection');
    } catch (err: any) {
      const isNetworkError = !err?.response;
      if (isNetworkError) {
        // Offline: allow continuing ONLY for the user who previously logged
        // in on this device, matched by the entered worker ID. No tokens are
        // fabricated — the stored session is reused and the normal
        // 401/refresh flow handles expiry once back online.
        const storedUser = await storage.getUser();
        const storedIds = storedUser
          ? [storedUser.employeeCode, storedUser.email].filter(Boolean)
          : [];
        const matchesStoredUser = storedIds.some(
          (v: string) => String(v).toLowerCase() === identifier.toLowerCase()
        );
        if (matchesStoredUser) {
          navigation.replace('ProjectSelection');
          return;
        }
        setLoginError(
          storedUser
            ? 'You are offline — use the worker ID you last logged in with / आप ऑफलाइन हैं — पिछली बार वाली वर्कर ID इस्तेमाल करें'
            : 'Connect to the internet for first login / पहली बार लॉगिन के लिए इंटरनेट से जुड़ें'
        );
      } else {
        const serverMsg = err.response?.data?.message;
        setLoginError(
          'Login failed — check your ID and PIN / लॉगिन विफल — ID और पिन जांचें' +
            (serverMsg ? `\n(${Array.isArray(serverMsg) ? serverMsg.join(', ') : serverMsg})` : '')
        );
      }
    } finally {
      setLoggingIn(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Language selector badge */}
        <View style={styles.langContainer}>
          <TouchableOpacity
            style={[styles.langBtn, lang === 'hi' && styles.langBtnActive]}
            onPress={() => setLang(lang === 'hi' ? 'en' : 'hi')}
          >
            <Text style={styles.langText}>
              {lang === 'hi' ? 'English' : 'हिंदी'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Brand Header */}
        <View style={styles.header}>
          <View style={styles.logoIcon}>
            <Text style={styles.logoIconText}>⛏</Text>
          </View>
          <Text style={styles.logoTitle}>{t('appTitle', lang)}</Text>
          <Text style={styles.logoSub}>{t('fieldSupervisorApp', lang)}</Text>
        </View>

        {/* Tab Selection */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'login' && styles.tabBtnActive]}
            onPress={() => setActiveTab('login')}
          >
            <Text style={[styles.tabBtnText, activeTab === 'login' && styles.tabBtnTextActive]}>
              {t('login', lang)}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'register' && styles.tabBtnActive]}
            onPress={() => setActiveTab('register')}
          >
            <Text style={[styles.tabBtnText, activeTab === 'register' && styles.tabBtnTextActive]}>
              {t('createAccount', lang)}
            </Text>
          </TouchableOpacity>
        </View>

        {activeTab === 'login' ? (
          /* LOGIN VIEW */
          <View style={styles.formCard}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Worker ID or Email / वर्कर ID या ईमेल</Text>
              <TextInput
                style={styles.input}
                value={loginId}
                onChangeText={(text) => {
                  setLoginId(text);
                  if (loginError) setLoginError('');
                }}
                placeholder="GL-W-XXXX"
                autoCapitalize="none"
                autoCorrect={false}
                placeholderTextColor={colors.grayMid}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>PIN or Password / पिन या पासवर्ड</Text>
              <TextInput
                style={styles.input}
                value={loginPin}
                onChangeText={(text) => {
                  setLoginPin(text);
                  if (loginError) setLoginError('');
                }}
                placeholder="••••"
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                placeholderTextColor={colors.grayMid}
              />
            </View>

            {loginError ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorBoxText}>{loginError}</Text>
              </View>
            ) : null}

            <TouchableOpacity
              style={[styles.primaryBtn, loggingIn && styles.primaryBtnDisabled]}
              onPress={handleLogin}
              disabled={loggingIn}
            >
              {loggingIn ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <Text style={styles.primaryBtnText}>{t('loginBtn', lang)}</Text>
              )}
            </TouchableOpacity>

            <View style={styles.divider} />

            <View style={styles.infoBoxBlue}>
              <Text style={styles.infoBoxBlueTitle}>Works offline / ऑफलाइन काम करता है</Text>
              <Text style={styles.infoBoxBlueSub}>{t('offlineMessage', lang)}</Text>
            </View>
          </View>
        ) : (
          /* REGISTER VIEW — self-registration is not supported by the backend */
          <View style={styles.formCard}>
            <View style={styles.infoBoxAmber}>
              <Text style={styles.infoBoxAmberTitle}>
                Registration is not available yet / पंजीकरण अभी उपलब्ध नहीं है
              </Text>
              <Text style={styles.infoBoxAmberSub}>
                Your supervisor will create your worker ID (GL-W-XXXX) and PIN, then you can log
                in here. / आपका सुपरवाइजर आपकी वर्कर ID (GL-W-XXXX) और पिन बनाएगा, फिर आप यहां
                लॉगिन कर सकते हैं।
              </Text>
            </View>

            <TouchableOpacity style={styles.secondaryBtn} onPress={() => setActiveTab('login')}>
              <Text style={styles.secondaryBtnText}>
                Go to Login / लॉगिन पर जाएं
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.pageBg,
  },
  scrollContainer: {
    padding: 20,
    paddingTop: 40,
    alignItems: 'center',
  },
  langContainer: {
    alignSelf: 'flex-end',
    marginBottom: 10,
  },
  langBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    backgroundColor: colors.white,
    borderWidth: 0.5,
    borderColor: colors.grayBorder,
  },
  langBtnActive: {
    backgroundColor: colors.rustLight,
    borderColor: colors.rustMid,
  },
  langText: {
    fontSize: typography.fontSizeCaption,
    color: colors.rust,
    fontWeight: '700',
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logoIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.rustLight,
    borderWidth: 1.5,
    borderColor: colors.rustMid,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  logoIconText: {
    fontSize: 27,
  },
  logoTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.rust,
  },
  logoSub: {
    fontSize: typography.fontSizeCaption,
    color: colors.grayMid,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 2,
  },
  tabContainer: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: colors.rustMid,
    borderRadius: 8,
    overflow: 'hidden',
    width: '100%',
    marginBottom: 15,
    backgroundColor: colors.white,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: colors.white,
  },
  tabBtnActive: {
    backgroundColor: colors.rustMid,
  },
  tabBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.rust,
  },
  tabBtnTextActive: {
    color: colors.white,
  },
  formCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    width: '100%',
    borderWidth: 0.5,
    borderColor: colors.grayBorder,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  inputGroup: {
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: typography.fontSizeCaption,
    color: colors.grayMid,
    marginBottom: 4,
  },
  input: {
    backgroundColor: colors.grayLight,
    borderWidth: 0.5,
    borderColor: colors.grayBorder,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    color: colors.grayDark,
  },
  primaryBtn: {
    backgroundColor: colors.rustMid,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  primaryBtnDisabled: {
    opacity: 0.6,
  },
  primaryBtnText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryBtn: {
    borderWidth: 0.5,
    borderColor: colors.rustMid,
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    backgroundColor: colors.grayLight,
  },
  secondaryBtnText: {
    color: colors.rust,
    fontSize: 15,
    fontWeight: '600',
  },
  divider: {
    height: 0.5,
    backgroundColor: colors.grayBorder,
    marginVertical: 12,
  },
  errorBox: {
    backgroundColor: colors.redLight,
    borderWidth: 0.5,
    borderColor: colors.redMid,
    borderRadius: 6,
    padding: 8,
    marginBottom: 8,
  },
  errorBoxText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.redMid,
  },
  infoBoxBlue: {
    backgroundColor: colors.blueLight,
    borderWidth: 0.5,
    borderColor: '#85B7EB',
    borderRadius: 6,
    padding: 8,
  },
  infoBoxBlueTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.blueDark,
  },
  infoBoxBlueSub: {
    fontSize: 12,
    color: colors.grayMid,
    marginTop: 2,
  },
  infoBoxAmber: {
    backgroundColor: colors.amberLight,
    borderWidth: 0.5,
    borderColor: colors.amber,
    borderRadius: 6,
    padding: 10,
  },
  infoBoxAmberTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.amber,
  },
  infoBoxAmberSub: {
    fontSize: 12,
    color: colors.grayMid,
    marginTop: 4,
    lineHeight: 14,
  },
});
