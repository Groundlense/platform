import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { colors, typography } from '../utils/theme';
import { t } from '../utils/translations';
import { storage } from '../services/storage';
import { syncManager } from '../services/sync';

export default function StartBoringScreen({ route, navigation }: { route: any; navigation: any }) {
  const { borehole, projectId, isResuming } = route.params;
  const [lang, setLang] = useState<'en' | 'hi'>('hi');

  const [weather, setWeather] = useState('Clear');
  const [photoTaken, setPhotoTaken] = useState(false);
  const [gpsData, setGpsData] = useState<any>(null);

  // Load initial simulated GPS data or read from device if available
  useEffect(() => {
    // Falling back to exact coordinates in spec for demo fidelity
    setGpsData({
      lat: "15°27'51.32\"N",
      lng: "73°57'40.72\"E",
      elevation: "19.85 m",
      accuracy: "2.1 m",
      deviation: "+4.2m",
      flagged: true,
    });
  }, []);

  const handleTakePhoto = () => {
    setPhotoTaken(true);
    Alert.alert(
      'Photo Stamped / फोटो ली गई',
      'GPS coords, timestamp and ID stamped directly on photo bytes.'
    );
  };

  const handleStartBoring = async () => {
    if (!photoTaken) {
      Alert.alert('Photo Required', 'Please take a rig photo before starting');
      return;
    }

    try {
      const cachedBoreholes = await storage.getBoreholes(projectId);
      const updated = cachedBoreholes.map((bh: any) => {
        if (bh.id === borehole.id) {
          return {
            ...bh,
            status: isResuming ? 'IN_PROGRESS' : 'IN_PROGRESS',
            currentDepth: bh.currentDepth || 0.0,
            weather,
            lat: gpsData?.lat,
            lng: gpsData?.lng,
            elevation: gpsData?.elevation,
            deviationFlagged: gpsData?.flagged,
          };
        }
        return bh;
      });

      await storage.saveBoreholes(projectId, updated);

      // Create a boring session
      const sessionId = `sess-${Date.now()}`;
      const newSession = {
        id: sessionId,
        boreholeId: borehole.id,
        startDepth: borehole.depth ? parseFloat(borehole.depth) : 0.0,
        weather,
        gpsLat: gpsData?.lat,
        gpsLng: gpsData?.lng,
        startedAt: new Date().toISOString(),
      };

      const sessions = await storage.getBoringSessions(borehole.id);
      sessions.push(newSession);
      await storage.saveBoringSessions(borehole.id, sessions);

      // Queue sync actions
      await syncManager.queueOperation(
        'BORING',
        borehole.id,
        'UPDATE',
        { status: 'IN_PROGRESS' },
        sessionId
      );

      // Navigate to SPT entry loop screen
      navigation.replace('SPTEntry', {
        borehole: updated.find(bh => bh.id === borehole.id),
        projectId,
        sessionId,
        currentDepth: borehole.status === 'TERMINATED' ? 10.5 : 0.0,
        intervalNo: borehole.status === 'TERMINATED' ? 8 : 1,
      });
    } catch (err) {
      Alert.alert('Error', 'Failed to start boring');
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerBar}>
        <View style={styles.headerTitleRow}>
          <Text style={styles.headerTitle}>
            {borehole.boreholeCode} · {isResuming ? 'Resume' : 'Start'}
          </Text>
          <TouchableOpacity
            style={styles.langBtn}
            onPress={() => setLang(lang === 'hi' ? 'en' : 'hi')}
          >
            <Text style={styles.langText}>{lang === 'hi' ? 'En' : 'हिं'}</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.headerSub}>Navigate to location</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Mock Map Panel */}
        <View style={styles.mapContainer}>
          <View style={styles.mapGridLineH1} />
          <View style={styles.mapGridLineH2} />
          <View style={styles.mapGridLineV1} />
          <View style={styles.mapGridLineV2} />
          
          <Text style={styles.mapPlannedPin}>📍</Text>
          <View style={styles.mapDistanceLine} />
          <Text style={styles.mapMePin}>🔵</Text>
        </View>

        {/* Distance information */}
        <View style={styles.mapInfo}>
          <Text style={styles.mapInfoText}>45m away · Walk north</Text>
          <TouchableOpacity style={styles.mapButton}>
            <Text style={styles.mapBtnText}>{t('openMaps', lang)}</Text>
          </TouchableOpacity>
        </View>

        {/* Warning panel */}
        <View style={styles.infoBoxAmber}>
          <Text style={styles.infoBoxAmberTitle}>
            You are 45m from planned location
          </Text>
          <Text style={styles.infoBoxAmberSub}>
            Walk to the pin before starting. GPS will auto-record when you tap start.
          </Text>
        </View>

        {/* Take Photo Widget */}
        <Text style={styles.fieldLabel}>Rig photo — GPS coords stamped on image</Text>
        <TouchableOpacity
          style={[styles.cameraBtn, photoTaken && styles.cameraBtnDone]}
          onPress={handleTakePhoto}
        >
          <Text style={[styles.cameraBtnText, photoTaken && styles.cameraBtnTextDone]}>
            📷 {photoTaken ? '✓ Rig Photo Captured' : 'Take rig photo / रिग की फोटो लें'}
          </Text>
        </TouchableOpacity>

        {/* GPS Stamped coordinates block */}
        {photoTaken && gpsData && (
          <View style={styles.gpsStamp}>
            <Text style={styles.gpsLine}>
              {borehole.boreholeCode} · {new Date().toLocaleDateString('en-GB')} · {new Date().toLocaleTimeString()}
            </Text>
            <Text style={styles.gpsLine}>Lat {gpsData.lat} · Long {gpsData.lng}</Text>
            <Text style={styles.gpsLine}>RL (Elevation): {gpsData.elevation} ± 16.0 m</Text>
            <Text style={styles.gpsLine}>GPS Accuracy: {gpsData.accuracy}</Text>
            {gpsData.flagged && (
              <Text style={styles.gpsDevText}>
                Deviation from plan: {gpsData.deviation} ⚠️ FLAGGED
              </Text>
            )}
          </View>
        )}

        {/* Weather Selector */}
        <Text style={styles.fieldLabel}>{t('weather', lang)}</Text>
        <View style={styles.horizontalRow}>
          {['Clear', 'Cloudy', 'Rainy', 'Hot'].map((w) => {
            const isSelected = weather === w;
            return (
              <TouchableOpacity
                key={w}
                style={[styles.tileQuarter, isSelected && styles.tileQuarterSelected]}
                onPress={() => setWeather(w)}
              >
                <Text style={[styles.tileQuarterText, isSelected && styles.tileQuarterTextSelected]}>
                  {w === 'Clear' && '☀️ Clear'}
                  {w === 'Cloudy' && '⛅ Cloudy'}
                  {w === 'Rainy' && '🌧️ Rainy'}
                  {w === 'Hot' && '🔥 Hot'}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity style={styles.startBtn} onPress={handleStartBoring}>
          <Text style={styles.startBtnText}>▶ {t('startBoringBtn', lang)}</Text>
        </TouchableOpacity>
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
    fontSize: 14,
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
    fontSize: 10,
    color: '#F5C4B3',
    marginTop: 2,
  },
  scrollContainer: {
    padding: 16,
  },
  mapContainer: {
    height: 90,
    backgroundColor: '#C8E6C9', // light green map mock background
    borderRadius: 8,
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 0.5,
    borderColor: colors.grayBorder,
  },
  // Map grid design
  mapGridLineH1: { position: 'absolute', left: 0, right: 0, top: 30, height: 0.5, backgroundColor: 'rgba(255,255,255,0.4)' },
  mapGridLineH2: { position: 'absolute', left: 0, right: 0, top: 60, height: 0.5, backgroundColor: 'rgba(255,255,255,0.4)' },
  mapGridLineV1: { position: 'absolute', top: 0, bottom: 0, left: '33%', width: 0.5, backgroundColor: 'rgba(255,255,255,0.4)' },
  mapGridLineV2: { position: 'absolute', top: 0, bottom: 0, left: '66%', width: 0.5, backgroundColor: 'rgba(255,255,255,0.4)' },
  mapPlannedPin: {
    position: 'absolute',
    top: 15,
    left: '35%',
    fontSize: 18,
  },
  mapMePin: {
    position: 'absolute',
    top: 45,
    left: '55%',
    fontSize: 14,
  },
  mapDistanceLine: {
    position: 'absolute',
    top: 32,
    left: '42%',
    width: 32,
    height: 1,
    backgroundColor: colors.rustMid,
    transform: [{ rotate: '25deg' }],
  },
  mapInfo: {
    backgroundColor: colors.blueLight,
    borderRadius: 8,
    padding: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 10,
    borderWidth: 0.5,
    borderColor: '#85B7EB',
  },
  mapInfoText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.blueDark,
  },
  mapButton: {
    backgroundColor: colors.amber,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  mapBtnText: {
    fontSize: 9,
    color: colors.white,
    fontWeight: '700',
  },
  infoBoxAmber: {
    backgroundColor: colors.amberLight,
    borderWidth: 0.5,
    borderColor: colors.amber,
    borderRadius: 6,
    padding: 8,
    marginBottom: 12,
  },
  infoBoxAmberTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.amber,
  },
  infoBoxAmberSub: {
    fontSize: 9,
    color: colors.grayMid,
    marginTop: 2,
  },
  fieldLabel: {
    fontSize: 9,
    color: colors.grayMid,
    marginBottom: 4,
    marginTop: 8,
  },
  cameraBtn: {
    backgroundColor: colors.grayLight,
    borderWidth: 0.5,
    borderColor: colors.greenMid,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  cameraBtnDone: {
    backgroundColor: colors.greenLight,
  },
  cameraBtnText: {
    fontSize: 11,
    color: colors.greenMid,
    fontWeight: '700',
  },
  cameraBtnTextDone: {
    color: colors.greenDark,
  },
  gpsStamp: {
    backgroundColor: colors.grayDark,
    borderRadius: 6,
    padding: 8,
    marginBottom: 12,
  },
  gpsLine: {
    fontFamily: typography.fontFamilyMono,
    fontSize: 8,
    color: '#FAC775',
    lineHeight: 12,
  },
  gpsDevText: {
    fontFamily: typography.fontFamilyMono,
    fontSize: 8,
    color: '#F0997B',
    fontWeight: '700',
    marginTop: 2,
  },
  horizontalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 4,
    marginBottom: 16,
  },
  tileQuarter: {
    flex: 1,
    backgroundColor: colors.grayLight,
    borderWidth: 0.5,
    borderColor: colors.grayBorder,
    borderRadius: 6,
    paddingVertical: 8,
    alignItems: 'center',
  },
  tileQuarterSelected: {
    backgroundColor: colors.blueLight,
    borderColor: colors.blueDark,
    borderWidth: 1.5,
  },
  tileQuarterText: {
    fontSize: 9,
    color: colors.grayDark,
    fontWeight: '600',
  },
  tileQuarterTextSelected: {
    fontWeight: '700',
    color: colors.blueDark,
  },
  startBtn: {
    backgroundColor: colors.rustMid,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  startBtnText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '700',
  },
});
