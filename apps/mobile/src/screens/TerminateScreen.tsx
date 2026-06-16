import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { colors, typography } from '../utils/theme';
import { t } from '../utils/translations';
import { storage } from '../services/storage';
import { syncManager } from '../services/sync';

export default function TerminateScreen({ route, navigation }: { route: any; navigation: any }) {
  const { borehole, projectId, currentDepth } = route.params;
  const [lang, setLang] = useState<'en' | 'hi'>('hi');

  const [reason, setReason] = useState('End of day');
  const [willResume, setWillResume] = useState<boolean>(true);

  const reasons = [
    { code: 'End of day', hi: 'आज का काम खत्म', icon: '⏰' },
    { code: 'Equipment', hi: 'मशीन खराब', icon: '🔧' },
    { code: 'Obstruction', hi: 'रुकावट', icon: '⚠️' },
    { code: 'Engineer instruction', hi: 'निर्देश', icon: '📋' },
    { code: 'Weather', hi: 'मौसम खराब', icon: '🌧️' },
    { code: 'Other', hi: 'अन्य', icon: '❓' },
  ];

  const handleConfirm = async () => {
    try {
      const cachedBoreholes = await storage.getBoreholes(projectId);
      
      const newStatus = willResume ? 'TERMINATED' : 'COMPLETED';

      const updated = cachedBoreholes.map((bh: any) => {
        if (bh.id === borehole.id) {
          return {
            ...bh,
            status: newStatus,
            currentDepth: currentDepth,
          };
        }
        return bh;
      });

      await storage.saveBoreholes(projectId, updated);

      // Save termination context in sessions
      const sessions = await storage.getBoringSessions(borehole.id);
      if (sessions.length > 0) {
        const active = sessions[sessions.length - 1];
        active.endedAt = new Date().toISOString();
        active.endDepth = currentDepth;
        active.status = newStatus;
        active.terminationReason = reason;
        await storage.saveBoringSessions(borehole.id, sessions);
        
        // Queue operation
        await syncManager.queueOperation(
          'BORING',
          borehole.id,
          'UPDATE',
          { status: newStatus, finalDepth: currentDepth },
          active.id
        );
      }

      Alert.alert(
        willResume ? 'Boring Paused' : 'Boring Terminated',
        willResume 
          ? 'Boring set to Amber. Ready for resume later.'
          : 'Boring closed permanently.',
        [
          {
            text: 'OK',
            onPress: () => {
              if (willResume) {
                navigation.navigate('BoringList', { projectId });
              } else {
                navigation.navigate('BoringClosure', { borehole, projectId });
              }
            }
          }
        ]
      );
    } catch (err) {
      Alert.alert('Error', 'Failed to terminate session');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.popupCard}>
        <Text style={styles.popupTitle}>⏹ {t('confirmTerminate', lang)}</Text>
        <Text style={styles.popupSub}>
          {borehole.boreholeCode} · Depth {currentDepth}m
        </Text>

        {/* Reasons Grid */}
        <Text style={styles.fieldLabel}>{t('reason', lang)} / कारण</Text>
        <View style={styles.grid2x2}>
          {reasons.map((r) => {
            const isSelected = reason === r.code;
            return (
              <TouchableOpacity
                key={r.code}
                style={[styles.tileHalf, isSelected && styles.tileHalfSelected]}
                onPress={() => setReason(r.code)}
              >
                <Text style={[styles.tileHalfText, isSelected && styles.tileHalfTextSelected]}>
                  {r.icon} {r.code}
                </Text>
                <Text style={[styles.tileHalfSub, isSelected && styles.tileHalfTextSelected]}>
                  {r.hi}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Will Resume Selector */}
        <Text style={styles.fieldLabel}>{t('willResume', lang)}</Text>
        <View style={styles.horizontalRow}>
          <TouchableOpacity
            style={[styles.tileHalfRow, willResume && styles.tileHalfRowYes]}
            onPress={() => setWillResume(true)}
          >
            <Text style={[styles.tileText, willResume && styles.tileTextActive]}>
              Yes — resume later / हाँ — बाद में
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tileHalfRow, !willResume && styles.tileHalfRowNo]}
            onPress={() => setWillResume(false)}
          >
            <Text style={[styles.tileText, !willResume && styles.tileTextActive]}>
              No — permanent stop / नहीं
            </Text>
          </TouchableOpacity>
        </View>

        {/* Info label */}
        <View style={styles.infoBoxRed}>
          <Text style={styles.infoBoxRedTitle}>
            Depth {currentDepth}m + your ID + timestamp will be recorded
          </Text>
        </View>

        {/* Buttons */}
        <View style={styles.btnRow}>
          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.cancelBtnText}>{t('cancel', lang)}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.submitBtn}
            onPress={handleConfirm}
          >
            <Text style={styles.submitBtnText}>Confirm / पुष्टि करें</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  popupCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    width: '100%',
    borderWidth: 0.5,
    borderColor: colors.grayBorder,
  },
  popupTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.redMid,
    textAlign: 'center',
  },
  popupSub: {
    fontSize: 9,
    color: colors.grayMid,
    textAlign: 'center',
    marginBottom: 10,
  },
  fieldLabel: {
    fontSize: 9,
    color: colors.grayMid,
    marginBottom: 4,
    marginTop: 6,
  },
  grid2x2: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 6,
    marginBottom: 8,
  },
  tileHalf: {
    width: '48%',
    backgroundColor: colors.grayLight,
    borderWidth: 0.5,
    borderColor: colors.grayBorder,
    borderRadius: 6,
    paddingVertical: 8,
    alignItems: 'center',
  },
  tileHalfSelected: {
    backgroundColor: colors.amberLight,
    borderColor: colors.amber,
    borderWidth: 1.5,
  },
  tileHalfText: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.grayDark,
  },
  tileHalfTextSelected: {
    color: colors.amber,
  },
  tileHalfSub: {
    fontSize: 8,
    color: colors.grayMid,
    marginTop: 2,
  },
  horizontalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
    marginBottom: 10,
  },
  tileHalfRow: {
    flex: 1,
    backgroundColor: colors.grayLight,
    borderWidth: 0.5,
    borderColor: colors.grayBorder,
    borderRadius: 6,
    paddingVertical: 8,
    alignItems: 'center',
  },
  tileHalfRowYes: {
    backgroundColor: colors.greenLight,
    borderColor: colors.greenMid,
    borderWidth: 1.5,
  },
  tileHalfRowNo: {
    backgroundColor: colors.redLight,
    borderColor: colors.redMid,
    borderWidth: 1.5,
  },
  tileText: {
    fontSize: 8,
    fontWeight: '600',
    color: colors.grayDark,
    textAlign: 'center',
  },
  tileTextActive: {
    fontWeight: '700',
    color: colors.grayDark,
  },
  infoBoxRed: {
    backgroundColor: colors.redLight,
    borderWidth: 0.5,
    borderColor: '#F09595',
    borderRadius: 6,
    padding: 8,
    marginVertical: 10,
  },
  infoBoxRedTitle: {
    fontSize: 8.5,
    fontWeight: '700',
    color: colors.redMid,
    textAlign: 'center',
  },
  btnRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: colors.grayLight,
    borderWidth: 0.5,
    borderColor: colors.grayBorder,
    borderRadius: 6,
    paddingVertical: 8,
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 10,
    color: colors.grayDark,
  },
  submitBtn: {
    flex: 1,
    backgroundColor: colors.redMid,
    borderRadius: 6,
    paddingVertical: 8,
    alignItems: 'center',
  },
  submitBtnText: {
    fontSize: 10,
    color: colors.white,
    fontWeight: '700',
  },
});
