import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  FlatList,
} from 'react-native';
import { colors, typography } from '../utils/theme';
import { t } from '../utils/translations';
import { storage } from '../services/storage';
import { api } from '../services/api';

export default function BoringListScreen({ route, navigation }: { route: any; navigation: any }) {
  const { projectId, projectCode, projectName } = route.params || {
    projectId: 'proj-0047',
    projectCode: 'GL-PRJ-2025-0047',
    projectName: 'NH-48 · Package 14 · ROB Km 142+500',
  };

  const [lang, setLang] = useState<'en' | 'hi'>('hi');
  const [boreholes, setBoreholes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadBoreholes();
  }, []);

  const loadBoreholes = async () => {
    setLoading(true);
    try {
      const cached = await storage.getBoreholes(projectId);
      if (cached.length > 0) {
        setBoreholes(cached);
      } else {
        // Seeding default mock boreholes for demonstration matching the spec
        const defaults = [
          {
            id: 'bh-01',
            boreholeCode: 'GL-BH-0047-01',
            name: 'BH-01 · Abutment A',
            status: 'COMPLETED',
            depth: '18.0m',
            date: '12 Apr',
            rigSetupDone: true,
          },
          {
            id: 'bh-03',
            boreholeCode: 'GL-BH-0047-03',
            name: 'BH-03 · Pier P2',
            status: 'TERMINATED', // Paused state
            depth: '10.5m',
            date: 'Resume today',
            rigSetupDone: true,
          },
          {
            id: 'bh-02',
            boreholeCode: 'GL-BH-0047-02',
            name: 'BH-02 · Pier P1',
            status: 'IN_PROGRESS',
            depth: '6.0m of 18m',
            date: 'Active',
            rigSetupDone: true,
          },
          {
            id: 'bh-04',
            boreholeCode: 'GL-BH-0047-04',
            name: 'BH-04 · Pier P3',
            status: 'PLANNED', // Pending
            depth: 'Pending / बाकी है',
            date: '',
            rigSetupDone: false,
          },
        ];
        await storage.saveBoreholes(projectId, defaults);
        setBoreholes(defaults);
      }
    } catch (err) {
      console.warn(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectBorehole = (bh: any) => {
    // If rig setup is not done, force them to RigSetup screen
    if (!bh.rigSetupDone) {
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

  // Find if there is a terminated boring we can suggest resuming
  const terminatedBoring = boreholes.find(bh => bh.status === 'TERMINATED');
  // Find pending boring
  const pendingBoring = boreholes.find(bh => bh.status === 'PLANNED');

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerBar}>
        <View style={styles.headerTitleRow}>
          <Text style={styles.headerTitle}>{projectCode}</Text>
          <TouchableOpacity
            style={styles.langBtn}
            onPress={() => setLang(lang === 'hi' ? 'en' : 'hi')}
          >
            <Text style={styles.langText}>{lang === 'hi' ? 'En' : 'हिं'}</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.headerSub}>{projectName}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Project Card Info */}
        <View style={styles.projectCard}>
          <View style={styles.projectInfoCol}>
            <Text style={styles.projCode}>{projectCode}</Text>
            <Text style={styles.projName}>NH-48 · Package 14</Text>
            <Text style={styles.projSub}>Team A · 4 borings assigned to you</Text>
          </View>
          <TouchableOpacity
            style={styles.changeBtn}
            onPress={() => navigation.navigate('ProjectSelection')}
          >
            <Text style={styles.changeBtnText}>Change</Text>
          </TouchableOpacity>
        </View>

        {/* Subtitle */}
        <Text style={styles.sectionTitle}>{t('todayBoring', lang)}</Text>

        {/* Boreholes List */}
        {boreholes.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={[styles.bhItem, getBoringStatusStyle(item.status)]}
            onPress={() => handleSelectBorehole(item)}
          >
            <View>
              <Text style={styles.bhCode}>{item.boreholeCode}</Text>
              <Text style={styles.bhName}>{item.name}</Text>
              <Text style={[styles.bhStatus, item.status === 'TERMINATED' && styles.statusTermText]}>
                {item.status === 'COMPLETED' && 'Complete · ' + item.depth + ' · ' + item.date}
                {item.status === 'TERMINATED' && 'Terminated · ' + item.depth + ' · Resume today'}
                {item.status === 'IN_PROGRESS' && 'In progress · ' + item.depth}
                {item.status === 'PLANNED' && t('udsSampling', lang) && 'Pending / बाकी है'}
              </Text>
            </View>
            <View style={[styles.statusDot, getBoringDotStyle(item.status)]} />
          </TouchableOpacity>
        ))}

        {/* Progress bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBarOuter}>
            <View style={[styles.progressBarInner, { width: '30%' }]} />
          </View>
          <Text style={styles.progressText}>
            1 done · 1 terminated · 1 active · 7 pending
          </Text>
        </View>

        {/* Dynamic CTA button */}
        {terminatedBoring ? (
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => handleSelectBorehole(terminatedBoring)}
          >
            <Text style={styles.primaryBtnText}>
              {t('resume', lang)} {terminatedBoring.boreholeCode.split('-').pop()} / जारी रखें
            </Text>
          </TouchableOpacity>
        ) : pendingBoring ? (
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => handleSelectBorehole(pendingBoring)}
          >
            <Text style={styles.primaryBtnText}>
              {t('start', lang)} {pendingBoring.boreholeCode.split('-').pop()} / शुरू करें
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
    fontSize: 16,
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
    fontSize: 9,
    color: colors.white,
    fontWeight: '700',
  },
  headerSub: {
    fontSize: 11,
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
    fontSize: 8,
    fontFamily: typography.fontFamilyMono,
    color: colors.amber,
  },
  projName: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.rust,
  },
  projSub: {
    fontSize: 9,
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
    fontSize: 9,
    color: colors.rust,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.grayMid,
    marginBottom: 8,
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
    fontSize: 8,
    fontFamily: typography.fontFamilyMono,
    color: colors.grayMid,
  },
  bhName: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.grayDark,
    marginTop: 2,
  },
  bhStatus: {
    fontSize: 9,
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
    fontSize: 9,
    color: colors.grayMid,
    marginTop: 6,
  },
  primaryBtn: {
    backgroundColor: colors.rustMid,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  primaryBtnText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '700',
  },
});
