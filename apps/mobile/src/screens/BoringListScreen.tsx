import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { colors, typography } from '../utils/theme';
import { t } from '../utils/translations';
import { storage } from '../services/storage';
import { api } from '../services/api';

export default function BoringListScreen({ route, navigation }: { route: any; navigation: any }) {
  const { projectId, projectCode, projectName } = route.params || {};

  const [lang, setLang] = useState<'en' | 'hi'>('hi');
  const [boreholes, setBoreholes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    if (projectId) {
      loadBoreholes();
    }
  }, [projectId]);

  const loadBoreholes = async () => {
    setLoading(true);
    setOffline(false);
    try {
      // Try the live API first; cache the result for offline use
      const fresh = await api.getProjectBoreholes(projectId);
      if (Array.isArray(fresh)) {
        await storage.saveBoreholes(projectId, fresh);
        setBoreholes(fresh);
      } else {
        setBoreholes([]);
      }
    } catch (err) {
      // Offline (or server error) — fall back to whatever is cached.
      // Never fabricate boreholes: an empty cache shows the honest empty state.
      setOffline(true);
      try {
        const cached = await storage.getBoreholes(projectId);
        setBoreholes(cached);
      } catch (cacheErr) {
        console.warn(cacheErr);
        setBoreholes([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const isRigSetupDone = (bh: any) => bh.rigSetupDone === true || !!bh.rigType;

  const handleSelectBorehole = (bh: any) => {
    // If rig setup is not done, force them to RigSetup screen
    if (!isRigSetupDone(bh)) {
      navigation.navigate('RigSetup', { borehole: bh, projectId });
    } else if (bh.status === 'TERMINATED') {
      // Resume state
      navigation.navigate('StartBoring', { borehole: bh, projectId, isResuming: true });
    } else if (bh.status === 'COMPLETED') {
      // Completed - show summary/ closure read-only
      navigation.navigate('BoringClosure', { borehole: bh, projectId, readOnly: true });
    } else {
      // Start or In progress
      navigation.navigate('StartBoring', { borehole: bh, projectId, isResuming: false });
    }
  };

  const getBoringStatusStyle = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return styles.bhCompleted;
      case 'TERMINATED':
        return styles.bhTerminated;
      case 'IN_PROGRESS':
        return styles.bhActive;
      default:
        return styles.bhPending;
    }
  };

  const getBoringDotStyle = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return styles.dotDone;
      case 'TERMINATED':
        return styles.dotTerm;
      case 'IN_PROGRESS':
        return styles.dotActive;
      default:
        return styles.dotPend;
    }
  };

  const fmtDepth = (val: any): string | null => {
    const n = Number(val);
    return Number.isFinite(n) && n > 0 ? `${n.toFixed(1)}m` : null;
  };

  const fmtDate = (iso: any): string | null => {
    if (!iso) return null;
    const d = new Date(iso);
    if (isNaN(d.getTime())) return null;
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  };

  const getStatusLine = (bh: any): string => {
    const planned = fmtDepth(bh.plannedDepth);
    const final = fmtDepth(bh.finalDepth) || fmtDepth(bh.currentDepth);
    switch (bh.status) {
      case 'COMPLETED':
        return ['Complete', final, fmtDate(bh.completedAt)].filter(Boolean).join(' · ');
      case 'TERMINATED':
        return ['Terminated', final, 'Resume today / आज जारी रखें'].filter(Boolean).join(' · ');
      case 'IN_PROGRESS':
        return ['In progress', final && planned ? `${final} of ${planned}` : final || (planned ? `of ${planned}` : null)]
          .filter(Boolean)
          .join(' · ');
      case 'ABANDONED':
        return 'Abandoned / छोड़ा गया';
      case 'SUSPENDED':
        return 'Suspended / निलंबित';
      default:
        return planned ? `Pending / बाकी है · planned ${planned}` : 'Pending / बाकी है';
    }
  };

  // Real status counts
  const total = boreholes.length;
  const doneCount = boreholes.filter(bh => bh.status === 'COMPLETED').length;
  const termCount = boreholes.filter(bh => bh.status === 'TERMINATED').length;
  const activeCount = boreholes.filter(bh => bh.status === 'IN_PROGRESS').length;
  const pendingCount = total - doneCount - termCount - activeCount;
  const progressPct = total > 0 ? Math.round((doneCount / total) * 100) : 0;

  // Find if there is a terminated boring we can suggest resuming
  const terminatedBoring = boreholes.find(bh => bh.status === 'TERMINATED');
  // Find pending boring
  const pendingBoring = boreholes.find(bh => bh.status === 'PLANNED');

  // Honest error state when the screen is opened without a project
  if (!projectId) {
    return (
      <View style={styles.container}>
        <View style={styles.headerBar}>
          <Text style={styles.headerTitle}>{t('boringList', lang)}</Text>
        </View>
        <View style={styles.emptyBox}>
          <Text style={styles.emptyTitle}>No project selected / कोई प्रोजेक्ट नहीं चुना गया</Text>
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => navigation.navigate('ProjectSelection')}
          >
            <Text style={styles.primaryBtnText}>{t('selectProject', lang)}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerBar}>
        <View style={styles.headerTitleRow}>
          <Text style={styles.headerTitle}>{projectCode || projectId}</Text>
          <TouchableOpacity
            style={styles.langBtn}
            onPress={() => setLang(lang === 'hi' ? 'en' : 'hi')}
          >
            <Text style={styles.langText}>{lang === 'hi' ? 'En' : 'हिं'}</Text>
          </TouchableOpacity>
        </View>
        {!!projectName && <Text style={styles.headerSub}>{projectName}</Text>}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Project Card Info */}
        <View style={styles.projectCard}>
          <View style={styles.projectInfoCol}>
            {!!projectCode && <Text style={styles.projCode}>{projectCode}</Text>}
            <Text style={styles.projName}>{projectName || projectCode || projectId}</Text>
            <Text style={styles.projSub}>
              {total > 0
                ? `${total} boring${total === 1 ? '' : 's'} assigned to you / आपको सौंपे गए`
                : 'No borings assigned yet / अभी कोई बोरिंग नहीं'}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.changeBtn}
            onPress={() => navigation.navigate('ProjectSelection')}
          >
            <Text style={styles.changeBtnText}>Change</Text>
          </TouchableOpacity>
        </View>

        {/* Offline notice */}
        {offline && (
          <View style={styles.offlineBox}>
            <Text style={styles.offlineText}>
              Offline — showing saved data / ऑफलाइन — सहेजा गया डेटा
            </Text>
          </View>
        )}

        {/* Subtitle */}
        <Text style={styles.sectionTitle}>{t('todayBoring', lang)}</Text>

        {/* Loading / Empty / List */}
        {loading ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyTitle}>Loading borings… / लोड हो रहा है…</Text>
          </View>
        ) : total === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyTitle}>
              No borings assigned yet / कोई बोरिंग नहीं
            </Text>
            <Text style={styles.emptySub}>
              {offline
                ? 'Connect to the network and sync to load your borings. / नेटवर्क मिलने पर सिंक करें।'
                : 'Ask your engineer to assign boreholes to this project. / इंजीनियर से बोरहोल असाइन करवाएं।'}
            </Text>
            <TouchableOpacity style={styles.primaryBtn} onPress={loadBoreholes}>
              <Text style={styles.primaryBtnText}>Retry / फिर कोशिश करें</Text>
            </TouchableOpacity>
          </View>
        ) : (
          boreholes.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[styles.bhItem, getBoringStatusStyle(item.status)]}
              onPress={() => handleSelectBorehole(item)}
            >
              <View style={styles.bhInfoCol}>
                <Text style={styles.bhCode}>{item.boreholeCode}</Text>
                <Text style={styles.bhName}>{item.name || item.boreholeCode}</Text>
                <Text style={[styles.bhStatus, item.status === 'TERMINATED' && styles.statusTermText]}>
                  {getStatusLine(item)}
                </Text>
              </View>
              <View style={[styles.statusDot, getBoringDotStyle(item.status)]} />
            </TouchableOpacity>
          ))
        )}

        {/* Progress bar — computed from real statuses */}
        {total > 0 && (
          <View style={styles.progressContainer}>
            <View style={styles.progressBarOuter}>
              <View style={[styles.progressBarInner, { width: `${progressPct}%` }]} />
            </View>
            <Text style={styles.progressText}>
              {doneCount} done · {termCount} terminated · {activeCount} active · {pendingCount} pending
            </Text>
          </View>
        )}

        {/* Dynamic CTA button */}
        {terminatedBoring ? (
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => handleSelectBorehole(terminatedBoring)}
          >
            <Text style={styles.primaryBtnText}>
              {t('resume', lang)} {(terminatedBoring.boreholeCode || '').split('-').pop()} / जारी रखें
            </Text>
          </TouchableOpacity>
        ) : pendingBoring ? (
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => handleSelectBorehole(pendingBoring)}
          >
            <Text style={styles.primaryBtnText}>
              {t('start', lang)} {(pendingBoring.boreholeCode || '').split('-').pop()} / शुरू करें
            </Text>
          </TouchableOpacity>
        ) : null}
      </ScrollView>
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
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.white,
  },
  langBtn: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  langText: {
    fontSize: 12,
    color: colors.white,
    fontWeight: '700',
  },
  headerSub: {
    fontSize: 15,
    color: '#F5C4B3',
    marginTop: 2,
  },
  scrollContainer: {
    padding: 16,
  },
  projectCard: {
    backgroundColor: colors.rustLight,
    borderWidth: 0.5,
    borderColor: colors.rustMid,
    borderRadius: 8,
    padding: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  projectInfoCol: {
    flex: 1,
  },
  projCode: {
    fontSize: 11,
    fontFamily: typography.fontFamilyMono,
    color: colors.amber,
  },
  projName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.rust,
  },
  projSub: {
    fontSize: 12,
    color: colors.rustMid,
    marginTop: 2,
  },
  changeBtn: {
    backgroundColor: colors.white,
    borderWidth: 0.5,
    borderColor: colors.rustMid,
    borderRadius: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  changeBtnText: {
    fontSize: 12,
    color: colors.rust,
    fontWeight: '600',
  },
  offlineBox: {
    backgroundColor: colors.amberLight,
    borderWidth: 0.5,
    borderColor: colors.amber,
    borderRadius: 6,
    padding: 8,
    marginBottom: 12,
  },
  offlineText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.amber,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.grayMid,
    marginBottom: 8,
  },
  emptyBox: {
    backgroundColor: colors.grayLight,
    borderWidth: 0.5,
    borderColor: colors.grayBorder,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginVertical: 8,
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
    textAlign: 'center',
    marginTop: 6,
  },
  bhItem: {
    backgroundColor: colors.grayLight,
    borderRadius: 8,
    padding: 10,
    marginBottom: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderLeftWidth: 3,
    borderLeftColor: colors.grayBorder,
  },
  bhInfoCol: {
    flex: 1,
    paddingRight: 8,
  },
  bhCompleted: {
    borderLeftColor: colors.greenMid,
    backgroundColor: colors.greenLight,
  },
  bhTerminated: {
    borderLeftColor: colors.amber,
    backgroundColor: colors.amberLight,
  },
  bhActive: {
    borderLeftColor: colors.rustMid,
    backgroundColor: colors.rustLight,
  },
  bhPending: {
    borderLeftColor: colors.grayBorder,
  },
  bhCode: {
    fontSize: 11,
    fontFamily: typography.fontFamilyMono,
    color: colors.grayMid,
  },
  bhName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.grayDark,
    marginTop: 2,
  },
  bhStatus: {
    fontSize: 12,
    color: colors.grayMid,
    marginTop: 2,
  },
  statusTermText: {
    color: colors.amber,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotDone: {
    backgroundColor: colors.greenMid,
  },
  dotTerm: {
    backgroundColor: colors.amber,
  },
  dotActive: {
    backgroundColor: colors.rustMid,
  },
  dotPend: {
    backgroundColor: colors.grayBorder,
  },
  progressContainer: {
    marginTop: 10,
    alignItems: 'center',
  },
  progressBarOuter: {
    width: '100%',
    height: 4,
    backgroundColor: colors.grayLight,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarInner: {
    height: '100%',
    backgroundColor: colors.rustMid,
  },
  progressText: {
    fontSize: 12,
    color: colors.grayMid,
    marginTop: 6,
  },
  primaryBtn: {
    backgroundColor: colors.rustMid,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  primaryBtnText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
});
