import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import { ACCOUNT_DELETION_URL } from '../config';
import { colors, typography } from '../utils/theme';
import { t } from '../utils/translations';
import { useLanguage } from '../utils/LanguageContext';
import { storage } from '../services/storage';
import { api } from '../services/api';
import { syncManager } from '../services/sync';

export default function ProjectSelectionScreen({ navigation }: { navigation: any }) {
  const { lang } = useLanguage();
  const [user, setUser] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResult, setSearchResult] = useState<any>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  useEffect(() => {
    loadUserData();
    // 'focus' fires on the initial mount and every return to this screen,
    // so the project list re-syncs whenever the worker lands here.
    const unsubscribe = navigation.addListener('focus', () => {
      loadProjects();
    });
    return unsubscribe;
  }, [navigation]);

  const loadUserData = async () => {
    const cachedUser = await storage.getUser();
    setUser(cachedUser);
  };

  const loadProjects = async () => {
    setLoading(true);
    try {
      const cachedProjects = await storage.getProjects();
      setProjects(cachedProjects);

      // Always refresh from the server too — a membership added on the
      // portal after the last sync (e.g. this user joining a second
      // project) must appear without a manual "Sync" tap. The cached list
      // above keeps the screen usable offline while this runs.
      await handleSync();
    } catch (err) {
      console.warn(err);
    } finally {
      setLoading(false);
    }
  };

  // After a successful sync, tell the worker about any borehole newly
  // assigned to them (across all projects). Each id is announced only once
  // — a persisted seen-set prevents repeat alerts.
  const checkNewAssignments = async () => {
    try {
      const assigned = await api.getAssignedBoreholes();
      if (!Array.isArray(assigned)) return;
      const seen = new Set(await storage.getSeenAssignments());
      const fresh = assigned.filter((bh: any) => bh.id && !seen.has(bh.id));
      if (fresh.length === 0) return;
      await storage.addSeenAssignments(fresh.map((bh: any) => bh.id));
      Alert.alert(
        lang === 'hi' ? 'नई बोरिंग सौंपी गई' : 'New borehole assigned',
        fresh.map((bh: any) => bh.boreholeCode || bh.name || bh.id).join(', ')
      );
    } catch (err) {
      // Offline or endpoint error — no notice, never fabricate one.
      console.warn('Assignment check failed:', err);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    setSyncError(null);
    try {
      const result = await syncManager.syncWithServer();
      const cachedProjects = await storage.getProjects();
      setProjects(cachedProjects);
      if (!result.success) {
        setSyncError(result.error || (lang === 'hi' ? 'सिंक विफल' : 'Sync failed'));
      } else {
        await checkNewAssignments();
      }
    } catch (err: any) {
      console.warn('Sync failed:', err);
      setSyncError(err?.message || (lang === 'hi' ? 'सिंक विफल' : 'Sync failed'));
    } finally {
      setSyncing(false);
    }
  };

  const handleSearch = async () => {
    const query = searchQuery.trim();
    if (!query) return;
    setLoading(true);
    // No response at all = no network reaching the server. A response (even
    // an error one) means the server was reached — not "offline".
    let isNetworkError = true;
    try {
      // Server search first — it distinguishes "exists but not assigned"
      // (red) from "does not exist" (amber).
      try {
        const result = await api.searchProject(query);
        if (result?.found) {
          setSearchResult({
            ...(result.project || {}),
            found: true,
            hasAccess: !!result.hasAccess,
            offline: false,
          });
        } else {
          // Amber "not found" — the ID does not exist on the server
          setSearchResult({ projectCode: query, found: false, offline: false });
        }
        return;
      } catch (err: any) {
        console.warn('Server project search failed, using local cache:', err);
        isNetworkError = !err?.response;
      }

      // Fallback: search the locally synced project cache. Anything cached
      // is by definition assigned to this worker.
      const cachedProjects = await storage.getProjects();
      const matched = cachedProjects.find(
        (p: any) => (p.projectCode || '').toUpperCase() === query.toUpperCase()
      );
      if (matched) {
        setSearchResult({
          ...matched,
          found: true,
          hasAccess: true,
          offline: isNetworkError,
          serverError: !isNetworkError,
        });
      } else {
        // Amber "not found" state — the ID is not in the local cache
        setSearchResult({
          projectCode: query,
          found: false,
          offline: isNetworkError,
          serverError: !isNetworkError,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOpenProject = async (project: any) => {
    navigation.navigate('BoringList', {
      projectId: project.id,
      projectCode: project.projectCode || project.code,
      projectName: project.name,
    });
  };

  const activeProjects = projects.filter(p => p.status !== 'COMPLETED');
  const completedProjects = projects.filter(p => p.status === 'COMPLETED');

  const handleLogout = async () => {
    try {
      // Best effort — invalidates the refresh token server-side when online
      await api.logout();
    } catch (err) {
      console.warn('Server logout failed (continuing local logout):', err);
    }
    await storage.clearTokens();
    await storage.clearUser();
    navigation.replace('Login');
  };

  // Play Store policy: the app must offer an in-app route to account deletion.
  // The request itself is handled on the web page so it also works for users
  // who can no longer sign in.
  const handleDeleteAccount = () => {
    Alert.alert(
      lang === 'hi' ? 'खाता हटाएं' : 'Delete account',
      lang === 'hi'
        ? 'आपका खाता और निजी डेटा हटाने का अनुरोध हमारी वेबसाइट पर किया जाता है। ब्राउज़र खोलें?'
        : 'Account and personal data deletion is requested on our website. Open it in your browser?',
      [
        { text: lang === 'hi' ? 'रद्द करें' : 'Cancel', style: 'cancel' },
        {
          text: lang === 'hi' ? 'खोलें' : 'Open',
          onPress: () => {
            Linking.openURL(ACCOUNT_DELETION_URL).catch(() => {
              Alert.alert(
                lang === 'hi' ? 'नहीं खुल सका' : 'Could not open',
                `${ACCOUNT_DELETION_URL}`,
              );
            });
          },
        },
      ],
    );
  };

  return (
    <View style={styles.container}>
      {/* Header bar */}
      <View style={styles.headerBar}>
        <View>
          <Text style={styles.headerTitle}>{t('selectProject', lang)}</Text>
          {user && (
            <Text style={styles.userInfo}>
              {[
                `${user.firstName || ''} ${user.lastName || ''}`.trim(),
                user.employeeCode,
              ]
                .filter(Boolean)
                .join(' · ')}
            </Text>
          )}
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.syncBtn} onPress={handleSync} disabled={syncing}>
            {syncing ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <Text style={styles.syncBtnText}>🔄 Sync</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <Text style={styles.logoutBtnText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        contentContainerStyle={styles.listContainer}
        data={[]}
        renderItem={null}
        ListHeaderComponent={
          <>
            {/* Sync error notice */}
            {syncError ? (
              <View style={styles.syncErrorBox}>
                <Text style={styles.syncErrorText}>{syncError}</Text>
              </View>
            ) : null}

            {/* Search project */}
            <View style={styles.searchSection}>
              <Text style={styles.label}>{t('searchProjId', lang)}</Text>
              <View style={styles.searchRow}>
                <TextInput
                  style={styles.searchInput}
                  value={searchQuery}
                  onChangeText={(text) => {
                    setSearchQuery(text);
                    if (searchResult) setSearchResult(null);
                  }}
                  placeholder="GL-PRJ-2025-____"
                  placeholderTextColor={colors.grayMid}
                  autoCapitalize="characters"
                  autoCorrect={false}
                />
                <TouchableOpacity style={styles.searchBtn} onPress={handleSearch}>
                  {loading ? (
                    <ActivityIndicator size="small" color={colors.white} />
                  ) : (
                    <Text style={styles.searchBtnText}>GO</Text>
                  )}
                </TouchableOpacity>
              </View>

              {/* Search Result — three states: found+assigned (blue/green),
                  found+not assigned (red), not found (amber) */}
              {searchResult && (
                searchResult.found && searchResult.hasAccess ? (
                  <View style={styles.searchResultCard}>
                    <Text style={styles.srCode}>
                      {searchResult.projectCode} · Found ✓
                    </Text>
                    <Text style={styles.srName}>{searchResult.name}</Text>
                    {(searchResult.description ||
                      searchResult.state ||
                      searchResult.district) ? (
                      <Text style={styles.srSub}>
                        {searchResult.description ||
                          [searchResult.district, searchResult.state]
                            .filter(Boolean)
                            .join(', ')}
                      </Text>
                    ) : null}
                    <TouchableOpacity
                      style={styles.srOpenBtn}
                      onPress={() => handleOpenProject(searchResult)}
                    >
                      <Text style={styles.srOpenBtnText}>{t('openProj', lang)} →</Text>
                    </TouchableOpacity>
                  </View>
                ) : searchResult.found ? (
                  <View style={styles.searchResultCardError}>
                    <Text style={styles.srCodeError}>
                      {searchResult.projectCode} · Not assigned ✗
                    </Text>
                    <Text style={styles.srNameError}>
                      {lang === 'hi'
                        ? 'प्रोजेक्ट आपको असाइन नहीं है'
                        : 'Project found but not assigned to your team'}
                    </Text>
                    <Text style={styles.srSub}>
                      {searchResult.name ? `${searchResult.name} — ` : ''}
                      {lang === 'hi'
                        ? 'असाइनमेंट के लिए अपने सुपरवाइजर से संपर्क करें।'
                        : 'contact your supervisor to get assigned.'}
                    </Text>
                  </View>
                ) : (
                  <View style={styles.searchResultCardWarn}>
                    <Text style={styles.srCodeWarn}>
                      {searchResult.projectCode} · Not found ⚠️
                    </Text>
                    <Text style={styles.srNameWarn}>
                      {lang === 'hi' ? 'प्रोजेक्ट नहीं मिला' : 'Project not found'}
                    </Text>
                    <Text style={styles.srSub}>
                      {searchResult.offline
                        ? (lang === 'hi'
                            ? 'आप ऑफलाइन हैं — केवल सिंक किए गए प्रोजेक्ट खोजे गए। ID जांचें या पहले सिंक करें।'
                            : 'You are offline — only synced projects were searched. Check the ID or sync first.')
                        : searchResult.serverError
                        ? (lang === 'hi'
                            ? 'सर्वर से कनेक्ट नहीं हो सका — केवल सिंक किए गए प्रोजेक्ट खोजे गए।'
                            : "Couldn't reach the server — only synced projects were searched.")
                        : (lang === 'hi'
                            ? 'ID जांचें या पहले सिंक करें। यदि आपको असाइन होना चाहिए, तो अपने इंजीनियर से संपर्क करें।'
                            : 'Check the ID or sync first. If you should be assigned, contact your engineer.')}
                    </Text>
                  </View>
                )
              )}
            </View>

            {/* Engineer query inbox entry point */}
            <TouchableOpacity
              style={styles.queryInboxBtn}
              onPress={() => navigation.navigate('EngineerQuery')}
            >
              <Text style={styles.queryInboxBtnText}>
                {lang === 'hi' ? 'इंजीनियर के सवाल' : '📨 Engineer queries'}
              </Text>
            </TouchableOpacity>

            {/* Active Projects */}
            <Text style={styles.sectionTitle}>{t('assignedProj', lang)}</Text>
            {activeProjects.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyTitle}>
                  {lang === 'hi' ? 'कोई प्रोजेक्ट नहीं' : 'No projects assigned yet'}
                </Text>
                <Text style={styles.emptySub}>
                  {lang === 'hi'
                    ? 'अपने इंजीनियर से प्रोजेक्ट आवंटित करवाएं, फिर सिंक करें।'
                    : 'Ask your engineer to assign you, then sync.'}
                </Text>
                <TouchableOpacity
                  style={styles.emptySyncBtn}
                  onPress={handleSync}
                  disabled={syncing}
                >
                  {syncing ? (
                    <ActivityIndicator size="small" color={colors.white} />
                  ) : (
                    <Text style={styles.emptySyncBtnText}>
                      {lang === 'hi' ? 'अभी सिंक करें' : '🔄 Sync now'}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            ) : (
              activeProjects.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.projectCard}
                  onPress={() => handleOpenProject(item)}
                >
                  <Text style={styles.projCode}>{item.projectCode}</Text>
                  <Text style={styles.projName}>{item.name}</Text>
                  {item.description ? (
                    <Text style={styles.projSub}>{item.description}</Text>
                  ) : null}
                  <View style={styles.chipRow}>
                    <View style={[styles.chip, styles.chipRust]}>
                      <Text style={styles.chipTextRust}>{t('active', lang)}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))
            )}

            {/* Previous Projects */}
            {completedProjects.length > 0 && (
              <>
                <Text style={[styles.sectionTitle, styles.sectionTitleOld]}>
                  {t('previousProj', lang)}
                </Text>
                {completedProjects.map((item) => (
                  <View key={item.id} style={styles.projectCardOld}>
                    <Text style={styles.projCodeOld}>{item.projectCode}</Text>
                    <Text style={styles.projNameOld}>{item.name}</Text>
                    <View style={styles.chipRow}>
                      <View style={[styles.chip, styles.chipGray]}>
                        <Text style={styles.chipTextGray}>{t('completed', lang)}</Text>
                      </View>
                    </View>
                  </View>
                ))}
              </>
            )}

            {/* Account section — deletion route required by Play Store policy */}
            <Text style={[styles.sectionTitle, styles.sectionTitleOld]}>
              {lang === 'hi' ? 'खाता' : 'Account'}
            </Text>
            <TouchableOpacity style={styles.deleteAccountBtn} onPress={handleDeleteAccount}>
              <Text style={styles.deleteAccountBtnText}>
                {lang === 'hi'
                  ? 'मेरा खाता और डेटा हटाएं'
                  : 'Delete my account & data'}
              </Text>
              <Text style={styles.deleteAccountSub}>
                {lang === 'hi'
                  ? 'वेबसाइट पर अनुरोध करें — 30 दिनों में पूरा'
                  : 'Request on our website — completed within 30 days'}
              </Text>
            </TouchableOpacity>
          </>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.pageBg,
  },
  headerBar: {
    backgroundColor: colors.rust,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.white,
  },
  userInfo: {
    fontSize: 16,
    color: '#F5C4B3',
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  syncBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 4,
    marginRight: 8,
  },
  syncBtnText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  logoutBtn: {
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 4,
  },
  logoutBtnText: {
    color: colors.white,
    fontSize: 16,
  },
  listContainer: {
    padding: 16,
  },
  deleteAccountBtn: {
    backgroundColor: colors.redLight,
    borderWidth: 0.5,
    borderColor: colors.redMid,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  deleteAccountBtnText: {
    fontSize: typography.fontSizeBody,
    fontWeight: '700',
    color: colors.redMid,
  },
  deleteAccountSub: {
    fontSize: typography.fontSizeMicro,
    color: colors.grayMid,
    marginTop: 4,
  },
  syncErrorBox: {
    backgroundColor: colors.amberLight,
    borderWidth: 0.5,
    borderColor: colors.amber,
    borderRadius: 6,
    padding: 8,
    marginBottom: 12,
  },
  syncErrorText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.amber,
  },
  searchSection: {
    backgroundColor: colors.white,
    borderRadius: 10,
    padding: 12,
    borderWidth: 0.5,
    borderColor: colors.grayBorder,
    marginBottom: 20,
  },
  label: {
    fontSize: typography.fontSizeCaption,
    color: colors.grayMid,
    marginBottom: 6,
  },
  searchRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.rustMid,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 18,
    fontWeight: '600',
    fontFamily: typography.fontFamilyMono,
    color: colors.grayDark,
  },
  searchBtn: {
    backgroundColor: colors.rustMid,
    borderRadius: 6,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchBtnText: {
    color: colors.white,
    fontSize: 17,
    fontWeight: '700',
  },
  searchResultCard: {
    backgroundColor: colors.blueLight,
    borderWidth: 1.5,
    borderColor: colors.blueDark,
    borderRadius: 8,
    padding: 10,
    marginTop: 10,
  },
  searchResultCardError: {
    backgroundColor: colors.redLight,
    borderWidth: 1.5,
    borderColor: colors.redMid,
    borderRadius: 8,
    padding: 10,
    marginTop: 10,
  },
  searchResultCardWarn: {
    backgroundColor: colors.amberLight,
    borderWidth: 1.5,
    borderColor: colors.amber,
    borderRadius: 8,
    padding: 10,
    marginTop: 10,
  },
  srCode: {
    fontSize: 14,
    fontFamily: typography.fontFamilyMono,
    fontWeight: '700',
    color: colors.blueDark,
  },
  srCodeWarn: {
    fontSize: 14,
    fontFamily: typography.fontFamilyMono,
    fontWeight: '700',
    color: colors.amber,
  },
  srName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0C447C',
    marginTop: 4,
  },
  srNameWarn: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.amber,
    marginTop: 4,
  },
  srCodeError: {
    fontSize: 14,
    fontFamily: typography.fontFamilyMono,
    fontWeight: '700',
    color: colors.redMid,
  },
  srNameError: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.redMid,
    marginTop: 4,
  },
  queryInboxBtn: {
    backgroundColor: colors.blueLight,
    borderWidth: 0.5,
    borderColor: colors.blueDark,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -8,
    marginBottom: 20,
  },
  queryInboxBtnText: {
    fontSize: 16,
    color: colors.blueDark,
    fontWeight: '700',
  },
  srSub: {
    fontSize: 14,
    color: colors.grayMid,
    marginTop: 2,
  },
  srOpenBtn: {
    backgroundColor: colors.rustMid,
    borderRadius: 6,
    paddingVertical: 6,
    alignItems: 'center',
    marginTop: 8,
  },
  srOpenBtnText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.grayDark,
    marginBottom: 8,
  },
  sectionTitleOld: {
    color: colors.grayMid,
    marginTop: 12,
  },
  emptyCard: {
    backgroundColor: colors.white,
    borderWidth: 0.5,
    borderColor: colors.grayBorder,
    borderRadius: 8,
    padding: 14,
    marginBottom: 8,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.grayDark,
    textAlign: 'center',
  },
  emptySub: {
    fontSize: 14,
    color: colors.grayMid,
    marginTop: 4,
    textAlign: 'center',
  },
  emptySyncBtn: {
    backgroundColor: colors.rustMid,
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginTop: 10,
  },
  emptySyncBtnText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
  projectCard: {
    backgroundColor: colors.white,
    borderWidth: 0.5,
    borderColor: colors.grayBorder,
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
  },
  projCode: {
    fontSize: 15,
    fontFamily: typography.fontFamilyMono,
    color: colors.amber,
  },
  projName: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.grayDark,
    marginTop: 2,
  },
  projSub: {
    fontSize: 14,
    color: colors.grayMid,
    marginTop: 2,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 6,
    gap: 4,
  },
  chip: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  chipRust: {
    backgroundColor: colors.rustLight,
  },
  chipGray: {
    backgroundColor: colors.grayLight,
    borderWidth: 0.5,
    borderColor: colors.grayBorder,
  },
  chipTextRust: {
    fontSize: 15,
    color: colors.rust,
  },
  chipTextGray: {
    fontSize: 15,
    color: colors.grayMid,
  },
  projectCardOld: {
    backgroundColor: colors.white,
    borderWidth: 0.5,
    borderColor: colors.grayBorder,
    opacity: 0.75,
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
  },
  projCodeOld: {
    fontSize: 15,
    fontFamily: typography.fontFamilyMono,
    color: colors.grayMid,
  },
  projNameOld: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.grayMid,
    marginTop: 2,
  },
});
