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
  Alert,
} from 'react-native';
import { colors, typography } from '../utils/theme';
import { t } from '../utils/translations';
import { storage } from '../services/storage';
import { api } from '../services/api';

export default function LoginScreen({ navigation }: { navigation: any }) {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [lang, setLang] = useState<'en' | 'hi'>('en');

  // Login inputs
  const [loginMobile, setLoginMobile] = useState('GL-W-0001');
  const [loginPin, setLoginPin] = useState('1234');

  // Register inputs
  const [registerStep, setRegisterStep] = useState<1 | 2 | 3>(1);
  const [regName, setRegName] = useState('Ramesh Chandra');
  const [regMobile, setRegMobile] = useState('9876543210');
  const [regEducation, setRegEducation] = useState('ITI');
  const [regOtp, setRegOtp] = useState('123456');
  const [regPin, setRegPin] = useState('');
  const [regConfirmPin, setRegConfirmPin] = useState('');

  const handleLogin = async () => {
    if (!loginMobile || !loginPin) {
      Alert.alert(t('error', lang), 'Please enter mobile and PIN');
      return;
    }
    try {
      // Direct integration with Live API
      const result = await api.login(loginMobile, loginPin);
      if (result && result.accessToken) {
        await storage.saveToken(result.accessToken);
        
        // Fetch profile to get organizationId, etc.
        const profile = await api.getProfile();
        await storage.saveUser(profile);
        
        navigation.replace('ProjectSelection');
      } else {
        Alert.alert('Login Failed', 'Invalid credentials');
      }
    } catch (err: any) {
      console.warn('API login failed, attempting local fallback:', err);
      // Local fallback for offline mode or initial seeding
      if (loginMobile === 'GL-W-0001' && loginPin === '1234') {
        const mockUser = {
          id: 'GL-W-0001',
          firstName: 'Field',
          lastName: 'Worker',
          mobile: '9876543210',
          organizationId: 'geotech-seed',
        };
        await storage.saveToken('mock-jwt-token');
        await storage.saveUser(mockUser);
        navigation.replace('ProjectSelection');
      } else {
        Alert.alert('Connection/Auth Error', err.response?.data?.message || err.message);
      }
    }
  };

  const handleRegisterNext = () => {
    if (registerStep === 1) {
      if (!regName || !regMobile) {
        Alert.alert('Missing Fields', 'Please enter your name and mobile number');
        return;
      }
      setRegisterStep(2);
    } else if (registerStep === 2) {
      if (!regOtp) {
        Alert.alert('Missing OTP', 'Please enter the verification code');
        return;
      }
      setRegisterStep(3);
    }
  };

  const handleRegisterSubmit = async () => {
    if (!regPin || regPin.length !== 4) {
      Alert.alert('Invalid PIN', 'Please enter a 4-digit PIN');
      return;
    }
    if (regPin !== regConfirmPin) {
      Alert.alert('PIN Mismatch', 'PINs do not match');
      return;
    }

    try {
      // Local caching and activation
      const generatedId = `GL-W-${Math.floor(1000 + Math.random() * 9000)}`;
      const mockUser = {
        id: generatedId,
        firstName: regName.split(' ')[0],
        lastName: regName.split(' ')[1] || '',
        mobile: regMobile,
        education: regEducation,
        organizationId: 'org-123',
      };
      await storage.saveToken('mock-jwt-token');
      await storage.saveUser(mockUser);

      Alert.alert(
        'Account Created / खाता बन गया',
        `Your supervisor ID: ${generatedId}\n\nShare this with your engineer.`,
        [{ text: 'Continue / आगे बढ़ें', onPress: () => navigation.replace('ProjectSelection') }]
      );
    } catch (err: any) {
      Alert.alert('Registration Failed', err.message);
    }
  };

  const educationOptions = [
    { code: '10th', hi: 'दसवीं' },
    { code: '12th', hi: 'बारहवीं' },
    { code: 'ITI', hi: 'आईटीआई' },
    { code: 'Diploma', hi: 'डिप्लोमा' },
    { code: 'B.E.', hi: 'डिग्री' },
    { code: 'Other', hi: 'अन्य' },
  ];

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
              <Text style={styles.inputLabel}>{t('mobileNumber', lang)}</Text>
              <TextInput
                style={styles.input}
                value={loginMobile}
                onChangeText={setLoginMobile}
                placeholder="9876543210"
                keyboardType="phone-pad"
                placeholderTextColor={colors.grayMid}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>{t('pin', lang)}</Text>
              <TextInput
                style={styles.input}
                value={loginPin}
                onChangeText={setLoginPin}
                placeholder="••••"
                secureTextEntry
                keyboardType="numeric"
                maxLength={4}
                placeholderTextColor={colors.grayMid}
              />
            </View>

            <TouchableOpacity style={styles.primaryBtn} onPress={handleLogin}>
              <Text style={styles.primaryBtnText}>{t('loginBtn', lang)}</Text>
            </TouchableOpacity>

            <View style={styles.divider} />

            <View style={styles.infoBoxBlue}>
              <Text style={styles.infoBoxBlueTitle}>Works offline / ऑफलाइन काम करता है</Text>
              <Text style={styles.infoBoxBlueSub}>{t('offlineMessage', lang)}</Text>
            </View>
          </View>
        ) : (
          /* REGISTER VIEW */
          <View style={styles.formCard}>
            {/* Step Indicators */}
            <View style={styles.stepContainer}>
              <View style={[styles.stepDot, registerStep >= 1 && styles.stepDotActive]}>
                <Text style={styles.stepDotText}>1</Text>
              </View>
              <View style={[styles.stepLine, registerStep >= 2 && styles.stepLineActive]} />
              <View style={[styles.stepDot, registerStep >= 2 && styles.stepDotActive]}>
                <Text style={styles.stepDotText}>2</Text>
              </View>
              <View style={[styles.stepLine, registerStep >= 3 && styles.stepLineActive]} />
              <View style={[styles.stepDot, registerStep >= 3 && styles.stepDotActive]}>
                <Text style={styles.stepDotText}>3</Text>
              </View>
            </View>

            {registerStep === 1 && (
              <>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>{t('fullName', lang)}</Text>
                  <TextInput
                    style={styles.input}
                    value={regName}
                    onChangeText={setRegName}
                    placeholder="Ramesh Chandra"
                    placeholderTextColor={colors.grayMid}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>{t('mobileNumber', lang)}</Text>
                  <TextInput
                    style={styles.input}
                    value={regMobile}
                    onChangeText={setRegMobile}
                    placeholder="9876543210"
                    keyboardType="phone-pad"
                    placeholderTextColor={colors.grayMid}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>{t('education', lang)}</Text>
                  <View style={styles.eduGrid}>
                    {educationOptions.map((opt) => (
                      <TouchableOpacity
                        key={opt.code}
                        style={[
                          styles.eduTile,
                          regEducation === opt.code && styles.eduTileSelected,
                        ]}
                        onPress={() => setRegEducation(opt.code)}
                      >
                        <Text style={[
                          styles.eduTileText,
                          regEducation === opt.code && styles.eduTileTextSelected
                        ]}>
                          {opt.code}
                        </Text>
                        <Text style={[
                          styles.eduTileSubText,
                          regEducation === opt.code && styles.eduTileTextSelected
                        ]}>
                          {opt.hi}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <TouchableOpacity style={styles.primaryBtn} onPress={handleRegisterNext}>
                  <Text style={styles.primaryBtnText}>{t('next', lang)}</Text>
                </TouchableOpacity>
              </>
            )}

            {registerStep === 2 && (
              <>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>{t('otp', lang)}</Text>
                  <TextInput
                    style={styles.input}
                    value={regOtp}
                    onChangeText={setRegOtp}
                    placeholder="123456"
                    keyboardType="numeric"
                    maxLength={6}
                    placeholderTextColor={colors.grayMid}
                  />
                </View>

                <TouchableOpacity style={styles.primaryBtn} onPress={handleRegisterNext}>
                  <Text style={styles.primaryBtnText}>{t('next', lang)}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.secondaryBtn} onPress={() => setRegisterStep(1)}>
                  <Text style={styles.secondaryBtnText}>{t('back', lang)}</Text>
                </TouchableOpacity>
              </>
            )}

            {registerStep === 3 && (
              <>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Choose 4-digit PIN / पिन चुनें</Text>
                  <TextInput
                    style={styles.input}
                    value={regPin}
                    onChangeText={setRegPin}
                    placeholder="••••"
                    secureTextEntry
                    keyboardType="numeric"
                    maxLength={4}
                    placeholderTextColor={colors.grayMid}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Confirm PIN / पिन की पुष्टि करें</Text>
                  <TextInput
                    style={styles.input}
                    value={regConfirmPin}
                    onChangeText={setRegConfirmPin}
                    placeholder="••••"
                    secureTextEntry
                    keyboardType="numeric"
                    maxLength={4}
                    placeholderTextColor={colors.grayMid}
                  />
                </View>

                <TouchableOpacity style={styles.primaryBtn} onPress={handleRegisterSubmit}>
                  <Text style={styles.primaryBtnText}>{t('registerBtn', lang)}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.secondaryBtn} onPress={() => setRegisterStep(2)}>
                  <Text style={styles.secondaryBtnText}>{t('back', lang)}</Text>
                </TouchableOpacity>
              </>
            )}
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
    fontSize: 20,
  },
  logoTitle: {
    fontSize: 18,
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
    fontSize: 12,
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
    fontSize: 12,
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
  primaryBtnText: {
    color: colors.white,
    fontSize: 12,
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
    fontSize: 11,
    fontWeight: '600',
  },
  divider: {
    height: 0.5,
    backgroundColor: colors.grayBorder,
    marginVertical: 12,
  },
  infoBoxBlue: {
    backgroundColor: colors.blueLight,
    borderWidth: 0.5,
    borderColor: '#85B7EB',
    borderRadius: 6,
    padding: 8,
  },
  infoBoxBlueTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.blueDark,
  },
  infoBoxBlueSub: {
    fontSize: 9,
    color: colors.grayMid,
    marginTop: 2,
  },
  // Step indicator styles
  stepContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
  },
  stepDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.grayLight,
    borderWidth: 0.5,
    borderColor: colors.grayBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDotActive: {
    backgroundColor: colors.rustMid,
    borderColor: colors.rustMid,
  },
  stepDotText: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.grayDark,
  },
  stepLine: {
    width: 30,
    height: 1,
    backgroundColor: colors.grayBorder,
    marginHorizontal: 4,
  },
  stepLineActive: {
    backgroundColor: colors.rustMid,
  },
  // Education selector grid
  eduGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  eduTile: {
    width: '48%',
    backgroundColor: colors.grayLight,
    borderWidth: 0.5,
    borderColor: colors.grayBorder,
    borderRadius: 6,
    paddingVertical: 8,
    alignItems: 'center',
    marginBottom: 6,
  },
  eduTileSelected: {
    backgroundColor: colors.rustLight,
    borderColor: colors.rustMid,
    borderWidth: 1.5,
  },
  eduTileText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.grayDark,
  },
  eduTileTextSelected: {
    color: colors.rust,
    fontWeight: '700',
  },
  eduTileSubText: {
    fontSize: 8,
    color: colors.grayMid,
    marginTop: 2,
  },
});
