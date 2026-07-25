import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Image,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { colors, typography } from '../utils/theme';
import { t } from '../utils/translations';
import { useLanguage } from '../utils/LanguageContext';
import { storage } from '../services/storage';
import { api } from '../services/api';
import { sha256Hex } from '../utils/hash';

export default function LoginScreen({ navigation }: { navigation: any }) {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const { lang, setLang } = useLanguage();

  // Login inputs
  const [loginId, setLoginId] = useState('');
  const [loginPin, setLoginPin] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);

  const handleLogin = async () => {
    const identifier = loginId.trim();
    if (!identifier || !loginPin) {
      setLoginError(lang === 'hi' ? 'वर्कर ID और पिन दर्ज करें' : 'Enter your worker ID and PIN');
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

      // Account isolation: a different worker on this device must never see
      // (or sync as) the previous account's cached projects/queues.
      const wiped = await storage.ensureCacheOwner(profile?.id);
      if (wiped) {
        Alert.alert(
          lang === 'hi' ? 'नया खाता' : 'Fresh start',
          lang === 'hi'
            ? 'पिछले खाते का डेटा हटा दिया गया।'
            : 'Cached data from the previous account was cleared. Your projects will load from the server.'
        );
      }

      await storage.saveUser(profile);

      // Record everything needed to log this worker in offline later:
      // every identifier they might type (code, email, mobile) plus a
      // hash of the PIN they just used.
      await storage.saveOfflineLogin({
        userId: profile?.id,
        identifiers: [
          profile?.employeeCode,
          profile?.email,
          profile?.phone,
          profile?.mobile,
          identifier,
        ]
          .filter(Boolean)
          .map((v: any) => String(v).trim().toLowerCase()),
        pinHash: sha256Hex(loginPin),
      });

      navigation.replace('ProjectSelection');
    } catch (err: any) {
      const isNetworkError = !err?.response;
      if (isNetworkError) {
        // Offline: allow continuing ONLY for the user who previously logged
        // in on this device. Identifier is matched against every known id
        // (code/email/mobile) and the PIN is verified against the stored
        // hash. No tokens are fabricated — the stored session is reused and
        // the normal 401/refresh flow handles expiry once back online.
        const offlineRecord = await storage.getOfflineLogin();
        const storedUser = await storage.getUser();
        const enteredId = identifier.toLowerCase();

        const knownIds = new Set(
          (offlineRecord?.identifiers || []).concat(
            storedUser
              ? [storedUser.employeeCode, storedUser.email, storedUser.phone, storedUser.mobile]
                  .filter(Boolean)
                  .map((v: any) => String(v).trim().toLowerCase())
              : []
          )
        );
        const matchesStoredUser = knownIds.has(enteredId);
        // Older installs have no stored PIN hash — fall back to id-only match.
        const pinOk = offlineRecord?.pinHash
          ? sha256Hex(loginPin) === offlineRecord.pinHash
          : true;

        if (matchesStoredUser && pinOk) {
          navigation.replace('ProjectSelection');
          return;
        }
        if (matchesStoredUser && !pinOk) {
          setLoginError(lang === 'hi' ? 'गलत पिन' : 'Incorrect PIN');
          return;
        }
        setLoginError(
          storedUser || offlineRecord
            ? (lang === 'hi'
                ? 'आप ऑफलाइन हैं — पिछली बार वाली वर्कर ID इस्तेमाल करें'
                : 'You are offline — use the worker ID you last logged in with')
            : (lang === 'hi'
                ? 'पहली बार लॉगिन के लिए इंटरनेट से जुड़ें'
                : 'Connect to the internet for first login')
        );
      } else {
        const serverMsg = err.response?.data?.message;
        setLoginError(
          (lang === 'hi' ? 'लॉगिन विफल — ID और पिन जांचें' : 'Login failed — check your ID and PIN') +
            (serverMsg ? `\n(${Array.isArray(serverMsg) ? serverMsg.join(', ') : serverMsg})` : '')
        );
      }
    } finally {
      setLoggingIn(false);
    }
  };

  // Register inputs
  const [regMobile, setRegMobile] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regError, setRegError] = useState('');
  const [regSuccess, setRegSuccess] = useState(false);
  const [registering, setRegistering] = useState(false);

  const handleRegister = async () => {
    const mobile = regMobile.trim();
    if (!mobile || !regPassword || !regConfirmPassword) {
      setRegError(lang === 'hi' ? 'मोबाइल नंबर और पासवर्ड दर्ज करें' : 'Enter your mobile number and password');
      return;
    }
    if (regPassword.length < 4) {
      setRegError(lang === 'hi' ? 'पासवर्ड कम से कम 4 अक्षर का होना चाहिए' : 'Password must be at least 4 characters');
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setRegError(lang === 'hi' ? 'पासवर्ड मेल नहीं खाते' : 'Passwords do not match');
      return;
    }
    setRegError('');
    setRegistering(true);
    try {
      await api.createPassword(mobile, regPassword);
      setRegSuccess(true);
      setRegMobile('');
      setRegPassword('');
      setRegConfirmPassword('');
      Alert.alert(
        lang === 'hi' ? 'खाता सक्रिय' : 'Account activated',
        lang === 'hi'
          ? 'खाता सफलतापूर्वक सक्रिय हो गया! कृपया अब लॉगिन करें।'
          : 'Account activated successfully! Please log in now.'
      );
      setActiveTab('login');
    } catch (err: any) {
      const serverMsg = err.response?.data?.message;
      setRegError(
        (lang === 'hi' ? 'सक्रियण विफल रहा' : 'Activation failed') + '\n' +
          (serverMsg
            ? (Array.isArray(serverMsg) ? serverMsg.join(', ') : serverMsg)
            : (lang === 'hi' ? 'मोबाइल नंबर जांचें' : 'Check mobile number'))
      );
    } finally {
      setRegistering(false);
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
          <Image
            source={require('../assets/groundlense-logo.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
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
              <Text style={styles.inputLabel}>{lang === 'hi' ? 'वर्कर ID या ईमेल' : 'Worker ID or Email'}</Text>
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
              <Text style={styles.inputLabel}>{lang === 'hi' ? 'पिन या पासवर्ड' : 'PIN or Password'}</Text>
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
              <Text style={styles.infoBoxBlueTitle}>{lang === 'hi' ? 'ऑफलाइन काम करता है' : 'Works offline'}</Text>
              <Text style={styles.infoBoxBlueSub}>{t('offlineMessage', lang)}</Text>
            </View>
          </View>
        ) : (
          /* REGISTER VIEW — active password activation form */
          <View style={styles.formCard}>
            <Text style={{ fontSize: 18, fontWeight: '700', color: colors.rust, marginBottom: 12, textAlign: 'center' }}>
              {lang === 'hi' ? 'खाता सक्रिय करें' : 'Activate Account'}
            </Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>{lang === 'hi' ? 'मोबाइल नंबर' : 'Mobile Number'}</Text>
              <TextInput
                style={styles.input}
                value={regMobile}
                onChangeText={(text) => {
                  setRegMobile(text);
                  if (regError) setRegError('');
                }}
                placeholder="e.g. 9876543210"
                keyboardType="phone-pad"
                autoCapitalize="none"
                autoCorrect={false}
                placeholderTextColor={colors.grayMid}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>{lang === 'hi' ? 'पासवर्ड' : 'Password'}</Text>
              <TextInput
                style={styles.input}
                value={regPassword}
                onChangeText={(text) => {
                  setRegPassword(text);
                  if (regError) setRegError('');
                }}
                placeholder="Choose a password"
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                placeholderTextColor={colors.grayMid}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>{lang === 'hi' ? 'पासवर्ड की पुष्टि करें' : 'Confirm Password'}</Text>
              <TextInput
                style={styles.input}
                value={regConfirmPassword}
                onChangeText={(text) => {
                  setRegConfirmPassword(text);
                  if (regError) setRegError('');
                }}
                placeholder="Re-enter password"
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                placeholderTextColor={colors.grayMid}
              />
            </View>

            {regError ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorBoxText}>{regError}</Text>
              </View>
            ) : null}

            <TouchableOpacity
              style={[styles.primaryBtn, registering && styles.primaryBtnDisabled]}
              onPress={handleRegister}
              disabled={registering}
            >
              {registering ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <Text style={styles.primaryBtnText}>{lang === 'hi' ? 'सक्रिय करें' : 'Activate'}</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.secondaryBtn} onPress={() => setActiveTab('login')}>
              <Text style={styles.secondaryBtnText}>
                {lang === 'hi' ? 'लॉगिन पर जाएं' : 'Go to Login'}
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
  logoImage: {
    width: 84,
    height: 84,
    borderRadius: 16,
    marginBottom: 8,
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
    flexWrap: 'wrap',
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
    fontSize: 18,
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
    fontSize: 18,
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
    fontSize: 18,
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
    fontSize: 17,
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
    fontSize: 16,
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
    fontSize: 16,
    fontWeight: '700',
    color: colors.blueDark,
  },
  infoBoxBlueSub: {
    fontSize: 14,
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
    fontSize: 17,
    fontWeight: '700',
    color: colors.amber,
  },
  infoBoxAmberSub: {
    fontSize: 14,
    color: colors.grayMid,
    marginTop: 4,
    lineHeight: 24,
  },
});
