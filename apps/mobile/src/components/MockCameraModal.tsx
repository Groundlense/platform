import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Modal,
  TouchableOpacity,
  Dimensions,
  Animated,
} from 'react-native';
import { colors } from '../utils/theme';

interface MockCameraModalProps {
  visible: boolean;
  onClose: () => void;
  onCapture: (base64Data: string, filename: string) => void;
  boreholeCode: string;
  depth: number | string;
  photoType: string;
}

// 1x1 solid dark gray pixel JPEG base64 (valid JPEG payload for backend uploads)
const TINY_JPEG_BASE64 =
  '/9j/4AAQSkZJRgABAQAAAQABAAD/2wCEAAoHBwgHBgoICAgLCgoLDhgQDg0NDh0VFhEYFyMZGxkbHBobHjUlHx4zKBobJj0lKjU3MjIyJyI5PTgyPC4zNDMBCwsLDg0NDhYWFjMyFhYzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzM/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAf/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFgEBAQEAAAAAAAAAAAAAAAAAAAEC/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAwBAgEBreakQ==';

export default function MockCameraModal({
  visible,
  onClose,
  onCapture,
  boreholeCode,
  depth,
  photoType,
}: MockCameraModalProps) {
  const [flash, setFlash] = useState<boolean>(false);
  const [grid, setGrid] = useState<boolean>(true);
  const [captured, setCaptured] = useState<boolean>(false);
  const [gpsCoords, setGpsCoords] = useState<{ lat: string; lng: string }>({
    lat: '28.6139° N',
    lng: '77.2090° E',
  });
  const [timestamp, setTimestamp] = useState<string>('');
  
  const flashAnim = useState(new Animated.Value(0))[0];

  useEffect(() => {
    if (visible) {
      setCaptured(false);
      setTimestamp(new Date().toLocaleString('en-IN', { hour12: false }));
      
      // Introduce slight randomness to GPS coordinates to simulate real telemetry
      const randLat = (28.6139 + (Math.random() - 0.5) * 0.01).toFixed(5);
      const randLng = (77.2090 + (Math.random() - 0.5) * 0.01).toFixed(5);
      setGpsCoords({
        lat: `${randLat}° N`,
        lng: `${randLng}° E`,
      });
    }
  }, [visible]);

  const handleCapture = () => {
    // Shutter flash animation
    Animated.sequence([
      Animated.timing(flashAnim, {
        toValue: 0.8,
        duration: 80,
        useNativeDriver: true,
      }),
      Animated.timing(flashAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setCaptured(true);
    });
  };

  const handleSave = () => {
    // Generate standard descriptive filename
    const cleanType = photoType.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const cleanBh = boreholeCode.replace(/[^a-zA-Z0-9-]/g, '_');
    const filename = `${cleanBh}_depth_${typeof depth === 'number' ? depth.toFixed(1) : depth}_${cleanType}.jpg`;
    
    onCapture(TINY_JPEG_BASE64, filename);
    onClose();
  };

  // Determine schematic colors based on photo type
  const getViewfinderColors = () => {
    const type = photoType.toLowerCase();
    if (type.includes('rig')) {
      return { bg: '#2D3E50', primary: '#E74C3C', accent: '#ECF0F1' }; // Industrial Blue/Red
    }
    if (type.includes('spoon') || type.includes('sample')) {
      return { bg: '#2E1A1A', primary: '#D35400', accent: '#BDC3C7' }; // Warm Earthy Brown/Orange
    }
    if (type.includes('box') || type.includes('coring')) {
      return { bg: '#1E272C', primary: '#27AE60', accent: '#95A5A6' }; // Forest/Slate
    }
    return { bg: '#1A1A1A', primary: '#2980B9', accent: '#7F8C8D' }; // Tech Gray/Blue
  };

  const colorsTheme = getViewfinderColors();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Top Control Bar */}
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => setFlash(!flash)} style={styles.iconBtn}>
            <Text style={styles.topBarText}>{flash ? '⚡ Flash ON' : '⚡ Flash OFF'}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setGrid(!grid)} style={styles.iconBtn}>
            <Text style={styles.topBarText}>{grid ? '田 Grid ON' : '田 Grid OFF'}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Text style={styles.closeText}>✕ Close</Text>
          </TouchableOpacity>
        </View>

        {/* Camera Viewfinder (Simulated) */}
        <View style={[styles.viewfinder, { backgroundColor: colorsTheme.bg }]}>
          {/* Simulated Scene Graphic */}
          <View style={styles.sceneGraphicContainer}>
            {photoType.toLowerCase().includes('rig') && (
              <View style={styles.rigGraphics}>
                <View style={[styles.rigDerrick, { borderColor: colorsTheme.accent }]} />
                <View style={[styles.rigEngine, { backgroundColor: colorsTheme.primary }]} />
                <View style={styles.rigGround} />
              </View>
            )}
            {(photoType.toLowerCase().includes('spoon') || photoType.toLowerCase().includes('sample')) && (
              <View style={styles.spoonGraphics}>
                <View style={[styles.spoonTube, { backgroundColor: colorsTheme.accent }]} />
                <View style={[styles.spoonSoil, { backgroundColor: colorsTheme.primary }]} />
              </View>
            )}
            {(photoType.toLowerCase().includes('box') || photoType.toLowerCase().includes('coring')) && (
              <View style={styles.boxGraphics}>
                <View style={[styles.coreBox, { borderColor: colorsTheme.accent }]}>
                  <View style={styles.coreRow} />
                  <View style={styles.coreRow} />
                  <View style={styles.coreRow} />
                </View>
              </View>
            )}
            {(!photoType.toLowerCase().includes('rig') &&
              !photoType.toLowerCase().includes('spoon') &&
              !photoType.toLowerCase().includes('sample') &&
              !photoType.toLowerCase().includes('box') &&
              !photoType.toLowerCase().includes('coring')) && (
              <View style={styles.defaultGraphics}>
                <View style={[styles.defaultBorehole, { backgroundColor: '#111' }]} />
                <View style={styles.defaultGround} />
              </View>
            )}
          </View>

          {/* Grid Overlay */}
          {grid && (
            <View style={StyleSheet.absoluteFill} pointerEvents="none">
              <View style={[styles.gridLine, styles.gridV1]} />
              <View style={[styles.gridLine, styles.gridV2]} />
              <View style={[styles.gridLine, styles.gridH1]} />
              <View style={[styles.gridLine, styles.gridH2]} />
            </View>
          )}

          {/* Realistic Slate board overlay */}
          <View style={styles.slateBoard}>
            <View style={styles.slateHeader}>
              <Text style={styles.slateHeaderTitle}>GROUNDLENSE FIELD TELEMETRY</Text>
            </View>
            <View style={styles.slateBody}>
              <View style={styles.slateRow}>
                <Text style={styles.slateLabel}>BOREHOLE ID:</Text>
                <Text style={styles.slateValue}>{boreholeCode}</Text>
              </View>
              <View style={styles.slateRow}>
                <Text style={styles.slateLabel}>DEPTH:</Text>
                <Text style={styles.slateValue}>{typeof depth === 'number' ? `${depth.toFixed(1)}m` : depth}</Text>
              </View>
              <View style={styles.slateRow}>
                <Text style={styles.slateLabel}>GPS LAT/LNG:</Text>
                <Text style={styles.slateValue}>{gpsCoords.lat}, {gpsCoords.lng}</Text>
              </View>
              <View style={styles.slateRow}>
                <Text style={styles.slateLabel}>TIMESTAMP:</Text>
                <Text style={styles.slateValue}>{timestamp}</Text>
              </View>
              <View style={styles.slateRow}>
                <Text style={styles.slateLabel}>PHOTO TYPE:</Text>
                <Text style={styles.slateValue}>{photoType.toUpperCase()}</Text>
              </View>
            </View>
          </View>

          {/* Viewfinder State Labels */}
          <View style={styles.viewfinderBadge}>
            <Text style={styles.viewfinderBadgeText}>CAMERA MOCK VIEW</Text>
          </View>

          {/* White Shutter Flash Effect Overlay */}
          <Animated.View
            style={[
              StyleSheet.absoluteFill,
              {
                backgroundColor: '#FFF',
                opacity: flashAnim,
              },
            ]}
            pointerEvents="none"
          />
        </View>

        {/* Bottom Control Bar */}
        <View style={styles.bottomBar}>
          {!captured ? (
            <View style={styles.captureControls}>
              <Text style={styles.hintText}>Point at the sample and tap capture</Text>
              <TouchableOpacity onPress={handleCapture} style={styles.shutterBtn}>
                <View style={styles.shutterBtnInner} />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.confirmControls}>
              <Text style={styles.confirmTitle}>Photo captured successfully!</Text>
              <View style={styles.btnRow}>
                <TouchableOpacity onPress={() => setCaptured(false)} style={[styles.actionBtn, styles.retakeBtn]}>
                  <Text style={styles.retakeBtnText}>🔄 Retake</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleSave} style={[styles.actionBtn, styles.saveBtn]}>
                  <Text style={styles.saveBtnText}>✓ Use Photo</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const windowWidth = Dimensions.get('window').width;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'space-between',
  },
  topBar: {
    height: 60,
    backgroundColor: 'rgba(0,0,0,0.85)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  topBarText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '600',
  },
  iconBtn: {
    padding: 8,
  },
  closeBtn: {
    backgroundColor: '#E74C3C',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  closeText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
  },
  viewfinder: {
    flex: 1,
    width: windowWidth,
    position: 'relative',
    justifyContent: 'flex-end',
    padding: 16,
    overflow: 'hidden',
  },
  sceneGraphicContainer: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0.65,
  },
  // Rig Graphics
  rigGraphics: {
    alignItems: 'center',
    width: 200,
    height: 200,
  },
  rigDerrick: {
    width: 40,
    height: 140,
    borderWidth: 2.5,
    borderBottomWidth: 0,
  },
  rigEngine: {
    width: 70,
    height: 40,
    borderRadius: 4,
  },
  rigGround: {
    width: 240,
    height: 3,
    backgroundColor: '#95A5A6',
    marginTop: 4,
  },
  // Spoon Graphics
  spoonGraphics: {
    alignItems: 'center',
    width: 200,
    height: 120,
  },
  spoonTube: {
    width: 140,
    height: 35,
    borderRadius: 2,
    borderWidth: 1,
    borderColor: '#7F8C8D',
  },
  spoonSoil: {
    width: 130,
    height: 20,
    marginTop: -27,
    borderRadius: 2,
  },
  // Box Graphics
  boxGraphics: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  coreBox: {
    width: 160,
    height: 120,
    borderWidth: 2,
    borderRadius: 4,
    padding: 6,
    gap: 8,
  },
  coreRow: {
    height: 15,
    backgroundColor: '#555',
    borderRadius: 2,
    opacity: 0.8,
  },
  // Default graphics
  defaultGraphics: {
    alignItems: 'center',
  },
  defaultBorehole: {
    width: 30,
    height: 120,
    borderWidth: 1,
    borderColor: '#333',
  },
  defaultGround: {
    width: windowWidth,
    height: 4,
    backgroundColor: '#7F8C8D',
  },
  // Grid Lines
  gridLine: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
  },
  gridV1: {
    left: windowWidth / 3,
    top: 0,
    bottom: 0,
    width: 0.8,
  },
  gridV2: {
    left: (windowWidth / 3) * 2,
    top: 0,
    bottom: 0,
    width: 0.8,
  },
  gridH1: {
    top: '33.3%',
    left: 0,
    right: 0,
    height: 0.8,
  },
  gridH2: {
    top: '66.6%',
    left: 0,
    right: 0,
    height: 0.8,
  },
  // Slate Board Styling
  slateBoard: {
    backgroundColor: 'rgba(0,0,0,0.82)',
    borderWidth: 1,
    borderColor: '#444',
    borderRadius: 6,
    padding: 10,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 5,
    marginBottom: 8,
  },
  slateHeader: {
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    paddingBottom: 4,
    marginBottom: 6,
  },
  slateHeaderTitle: {
    color: colors.amber || '#F39C12',
    fontSize: 12,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: 1.5,
  },
  slateBody: {
    gap: 3,
  },
  slateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  slateLabel: {
    color: '#888',
    fontSize: 12,
    fontWeight: '700',
    fontFamily: 'monospace',
  },
  slateValue: {
    color: '#EEE',
    fontSize: 12,
    fontWeight: '700',
    fontFamily: 'monospace',
    textAlign: 'right',
  },
  viewfinderBadge: {
    position: 'absolute',
    top: 16,
    left: 16,
    backgroundColor: 'rgba(231, 76, 60, 0.8)',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  viewfinderBadgeText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  bottomBar: {
    height: 120,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  captureControls: {
    alignItems: 'center',
    gap: 10,
  },
  hintText: {
    color: '#7F8C8D',
    fontSize: 14,
    fontWeight: '600',
  },
  shutterBtn: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 4,
    borderColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  shutterBtnInner: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#FFF',
  },
  confirmControls: {
    alignItems: 'center',
    gap: 12,
    width: '100%',
  },
  confirmTitle: {
    color: '#2ECC71',
    fontSize: 16,
    fontWeight: '700',
  },
  btnRow: {
    flexDirection: 'row',
    gap: 16,
    width: '100%',
    justifyContent: 'center',
  },
  actionBtn: {
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 6,
    minWidth: 120,
    alignItems: 'center',
  },
  retakeBtn: {
    backgroundColor: '#34495E',
  },
  retakeBtnText: {
    color: '#ECF0F1',
    fontSize: 15,
    fontWeight: '700',
  },
  saveBtn: {
    backgroundColor: '#2ECC71',
  },
  saveBtnText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
