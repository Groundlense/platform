import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { colors, typography } from '../utils/theme';
import { t } from '../utils/translations';
import { storage } from '../services/storage';
import { api } from '../services/api';
import { syncManager } from '../services/sync';

export default function ProjectSelectionScreen({ navigation }: { navigation: any }) {
  const [lang] = useState<'en' | 'hi'>('en');
  const [user, setUser] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResult, setSearchResult] = useState<any>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  useEffect(() => {
    loadUserData();
    loadProjects();
  }, []);

  const loadUserData = async () => {
    const cachedUser = await storage.getUser();
    setUser(cachedUser);
  };

  const loadProjects = async () => {
    setLoading(true);
    try {
      const cachedProjects = await storage.getProjects();
      setProjects(cachedProjects);

      // If we have no cached projects, trigger an initial sync
      if (cachedProjects.length === 0) {
        await handleSync();
      }
    } catch (err) {
      console.warn(err);
    } finally {
      setLoading(false);
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
        setSyncError(result.error || 'Sync failed / सिंक विफल');
      }
    } catch (err: any) {
      console.warn('Sync failed:', err);
      setSyncError(err?.message || 'Sync failed / सिंक विफल');
    } finally {
      setSyncing(false);
    }
  };

  const handleSearch = async () => {
    const query = searchQuery.trim();
    if (!query) return;
    setLoading(true);
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
      } catch (err) {
        console.warn('Server project search failed, using local cache:', err);
      }

      // Offline fallback: search the locally synced project cache. Anything
      // cached is by definition assigned to this worker.
      const cachedProjects = await storage.getProjects();
      const matched = cachedProjects.find(
        (p: any) => (p.projectCode || '').toUpperCase() === query.toUpperCase()
      );
      if (matched) {
        setSearchResult({
          ...matched,
          found: true,
          hasAccess: true,
          offline: true,
        });
      } else {
        // Amber "not found" state — the ID is not in the local cache
        setSearchResult({
          projectCode: query,
          found: false,
          offline: true,
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
                      Project found but not assigned to your team / प्रोजेक्ट आपको
                      असाइन नहीं है
                    </Text>
                    <Text style={styles.srSub}>
                      {searchResult.name ? `${searchResult.name} — ` : ''}contact your
                      supervisor to get assigned. / असाइनमेंट के लिए अपने सुपरवाइजर से
                      संपर्क करें।
                    </Text>
                  </View>
                ) : (
                  <View style={styles.searchResultCardWarn}>
                    <Text style={styles.srCodeWarn}>
                      {searchResult.projectCode} · Not found ⚠️
                    </Text>
                    <Text style={styles.srNameWarn}>
                      Project not found / प्रोजेक्ट नहीं मिला
                    </Text>
                    <Text style={styles.srSub}>
                      {searchResult.offline
                        ? 'You are offline — only synced projects were searched. Check the ID or sync first. / आप ऑफलाइन हैं — ID जांचें या पहले सिंक करें।'
                        : 'Check the ID or sync first. If you should be assigned, contact your engineer. / ID जांचें या पहले सिंक करें।'}
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
                📨 Engineer queries / इंजीनियर के सवाल
              </Text>
            </TouchableOpacity>

            {/* Active Projects */}
            <Text style={styles.sectionTitle}>{t('assignedProj', lang)}</Text>
            {activeProjects.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyTitle}>
                  No projects assigned yet / कोई प्रोजेक्ट नहीं
                </Text>
                <Text style={styles.emptySub}>
                  Ask your engineer to assign you, then sync. / अपने इंजीनियर से प्रोजेक्ट
                  आवंटित करवाएं, फिर सिंक करें।
                </Text>
                <TouchableOpacity
                  style={styles.emptySyncBtn}
                  onPress={handleSync}
                  disabled={syncing}
                >
                  {syncing ? (
                    <ActivityIndicator size="small" color={colors.white} />
                  ) : (
                    <Text style={styles.emptySyncBtnText}>🔄 Sync now / अभी सिंक करें</Text>
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
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.white,
  },
  userInfo: {
    fontSize: 14,
    color: '#F5C4B3',
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
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
    fontSize: 14,
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
    fontSize: 14,
  },
  listContainer: {
    padding: 16,
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
    fontSize: 12,
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
    fontSize: 16,
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
    fontSize: 15,
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
    fontSize: 12,
    fontFamily: typography.fontFamilyMono,
    fontWeight: '700',
    color: colors.blueDark,
  },
  srCodeWarn: {
    fontSize: 12,
    fontFamily: typography.fontFamilyMono,
    fontWeight: '700',
    color: colors.amber,
  },
  srName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0C447C',
    marginTop: 4,
  },
  srNameWarn: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.amber,
    marginTop: 4,
  },
  srCodeError: {
    fontSize: 12,
    fontFamily: typography.fontFamilyMono,
    fontWeight: '700',
    color: colors.redMid,
  },
  srNameError: {
    fontSize: 15,
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
    fontSize: 14,
    color: colors.blueDark,
    fontWeight: '700',
  },
  srSub: {
    fontSize: 12,
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
    fontSize: 14,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 16,
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
    fontSize: 15,
    fontWeight: '700',
    color: colors.grayDark,
    textAlign: 'center',
  },
  emptySub: {
    fontSize: 12,
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
    fontSize: 14,
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
    fontSize: 11,
    fontFamily: typography.fontFamilyMono,
    color: colors.amber,
  },
  projName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.grayDark,
    marginTop: 2,
  },
  projSub: {
    fontSize: 12,
    color: colors.grayMid,
    marginTop: 2,
  },
  chipRow: {
    flexDirection: 'row',
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
    fontSize: 11,
    color: colors.rust,
  },
  chipTextGray: {
    fontSize: 11,
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
    fontSize: 11,
    fontFamily: typography.fontFamilyMono,
    color: colors.grayMid,
  },
  projNameOld: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.grayMid,
    marginTop: 2,
  },
});
