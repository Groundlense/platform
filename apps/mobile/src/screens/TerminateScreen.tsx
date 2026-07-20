import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';
import { colors, typography } from '../utils/theme';
import { t } from '../utils/translations';
import { storage } from '../services/storage';
import { syncManager } from '../services/sync';
import { api } from '../services/api';

export default function TerminateScreen({ route, navigation }: { route: any; navigation: any }) {
  const { borehole, projectId, currentDepth } = route.params || {};
  const [lang, setLang] = useState<'en' | 'hi'>('hi');

  const depth = Number(currentDepth);
  const safeDepth = Number.isFinite(depth) && depth >= 0 ? depth : 0;

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

      // willResume → TERMINATED (resumable pause, amber).
      // Permanent stop must NOT mark the borehole COMPLETED here — the
      // Boring Closure screen owns the COMPLETED transition (it locks the log).
      const sessionEndStatus = willResume ? 'TERMINATED' : 'COMPLETED';

      const updated = cachedBoreholes.map((bh: any) => {
        if (bh.id === borehole.id) {
          return {
            ...bh,
            // Keep the borehole's current status on permanent stop until closure completes
            status: willResume ? 'TERMINATED' : bh.status,
            currentDepth: safeDepth,
            terminationReason: reason,
          };
        }
        return bh;
      });

      await storage.saveBoreholes(projectId, updated);

      // End the active session (when one exists) — locally and on the server
      const sessions = await storage.getBoringSessions(borehole.id);
      let activeSessionId: string | undefined;
      if (sessions.length > 0) {
        const active = sessions[sessions.length - 1];
        active.endedAt = new Date().toISOString();
        active.endDepth = safeDepth;
        active.status = sessionEndStatus;
        active.terminationReason = reason;
        await storage.saveBoringSessions(borehole.id, sessions);
        activeSessionId = active.id;

        try {
          await api.endBoringSession(active.id, {
            endDepth: safeDepth,
            status: sessionEndStatus,
            terminationReason: reason,
          });
        } catch (apiErr) {
          // Offline — the local session record above stands until sync
        }
      }

      if (willResume) {
        // Queue the borehole status update regardless of session existence
        await syncManager.queueOperation(
          'BORING',
          borehole.id,
          'UPDATE',
          { status: 'TERMINATED', finalDepth: safeDepth, terminationReason: reason },
          activeSessionId
        );
      }
      // Permanent stop: no COMPLETED queued here — BoringClosure queues
      // { status: 'COMPLETED' } once the worker locks and submits the closure.

      // Push everything recorded so far (intervals, samples, session end,
      // queued photos) right now if there's network — a stopped boring must
      // never sit on the phone. Fire-and-forget: offline it stays queued.
      syncManager.syncWithServer().catch(() => {});

      Alert.alert(
        willResume ? 'Boring Paused' : 'Session Ended',
        willResume
          ? 'Boring set to Amber. Ready for resume later.'
          : 'Now complete the closure form to lock this boring permanently.',
        [
          {
            text: 'OK',
            onPress: () => {
              if (willResume) {
                navigation.navigate('BoringList', { projectId });
              } else {
                navigation.navigate('BoringClosure', {
                  borehole: { ...borehole, currentDepth: safeDepth },
                  projectId,
                  currentDepth: safeDepth,
                });
              }
            }
          }
        ]
      );
    } catch (err) {
      Alert.alert('Error', 'Failed to terminate session');
    }
  };

  // Honest error state when opened without a borehole
  if (!borehole?.id || !projectId) {
    return (
      <View style={styles.container}>
        <View style={styles.popupCard}>
          <Text style={styles.popupTitle}>⏹ {t('confirmTerminate', lang)}</Text>
          <Text style={styles.popupSub}>No borehole selected / कोई बोरहोल नहीं चुना गया</Text>
          <TouchableOpacity style={styles.cancelBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.cancelBtnText}>{t('back', lang)}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.popupCard}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1 }}>
          <Text style={styles.popupTitle}>⏹ {t('confirmTerminate', lang)}</Text>
          <Text style={styles.popupSub}>
            {borehole.boreholeCode} · Depth {safeDepth.toFixed(1)}m
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
              Depth {safeDepth.toFixed(1)}m + your ID + timestamp will be recorded
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
        </ScrollView>
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
    maxHeight: '90%',
  },
  popupTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.redMid,
    textAlign: 'center',
  },
  popupSub: {
    fontSize: 14,
    color: colors.grayMid,
    textAlign: 'center',
    marginBottom: 10,
  },
  fieldLabel: {
    fontSize: 14,
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
    fontSize: 14,
    fontWeight: '700',
    color: colors.grayDark,
  },
  tileHalfTextSelected: {
    color: colors.amber,
  },
  tileHalfSub: {
    fontSize: 15,
    color: colors.grayMid,
    marginTop: 2,
  },
  horizontalRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
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
    fontSize: 15,
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
    fontSize: 15,
    fontWeight: '700',
    color: colors.redMid,
    textAlign: 'center',
  },
  btnRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
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
    fontSize: 16,
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
    fontSize: 16,
    color: colors.white,
    fontWeight: '700',
  },
});
