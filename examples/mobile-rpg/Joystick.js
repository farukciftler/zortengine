import React, { useRef, useState } from 'react';
import { View, PanResponder, StyleSheet, Dimensions } from 'react-native';
import { getGameAPI } from './gameBridge.js';

const SCREEN_WIDTH = Dimensions.get('window').width;
const LEFT_HALF = SCREEN_WIDTH / 2;

const VIRTUAL_RADIUS = 80; // Bu kadar px sürükleyince tam yön
const DEADZONE = 0.12;
const SMOOTH_ALPHA = 0.35;
const SEND_THRESHOLD = 0.06;
const DEBUG = false;
const INDICATOR_RADIUS = 24;

const logGesture = (evt, label, extra = {}) => {
  if (!DEBUG) return;
  const ne = evt?.nativeEvent ?? {};
  const info = {
    label,
    pageX: ne.pageX,
    pageY: ne.pageY,
    locationX: ne.locationX,
    locationY: ne.locationY,
    leftHalf: ne.pageX != null && ne.pageX < LEFT_HALF,
    ...extra,
  };
  console.log('[Joystick]', JSON.stringify(info));
};

export const Joystick = React.memo(function Joystick() {
  const centerRef = useRef({ x: 0, y: 0 });
  const lastSent = useRef({ x: 0, z: 0 });
  const smoothed = useRef({ x: 0, z: 0 });
  const isTrackingRef = useRef(false);
  const hasMovedRef = useRef(false);
  const attackTriggeredRef = useRef(false);
  const [touchCenter, setTouchCenter] = useState(null);
  const [thumbOffset, setThumbOffset] = useState({ x: 0, y: 0 });

  const sendIfChanged = (jx, jz, source = '') => {
    const prev = lastSent.current;
    const skip = Math.abs(jx - prev.x) < SEND_THRESHOLD && Math.abs(jz - prev.z) < SEND_THRESHOLD;
    if (!skip) {
      lastSent.current = { x: jx, z: jz };
      if (DEBUG) console.log('[Joystick] send', { x: jx.toFixed(3), z: jz.toFixed(3), source });
      getGameAPI()?.setJoystickDir?.(jx, jz);
    }
  };

  const computeDir = (locationX, locationY) => {
    const cx = centerRef.current.x;
    const cy = centerRef.current.y;
    let dx = locationX - cx;
    let dy = locationY - cy;
    const len = Math.hypot(dx, dy) || 1;
    const scale = Math.min(1, VIRTUAL_RADIUS / len);
    const clampedDx = dx * scale;
    const clampedDy = dy * scale;
    // Ekran yukarı (dy negatif) = karakter ekranda yukarı (-Z). Ekran sağ (dx pozitif) = karakter sağ (+X).
    const rawJx = Math.abs(clampedDx / VIRTUAL_RADIUS) < DEADZONE ? 0 : clampedDx / VIRTUAL_RADIUS;
    const rawJz = Math.abs(clampedDy / VIRTUAL_RADIUS) < DEADZONE ? 0 : clampedDy / VIRTUAL_RADIUS;
    return { rawJx, rawJz, thumbDx: clampedDx, thumbDy: clampedDy };
  };

  const isLeftHalf = (evt) => {
    const px = evt?.nativeEvent?.pageX;
    if (px === undefined || px === null) return false;
    return px < LEFT_HALF;
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: (evt) => {
        const ok = isLeftHalf(evt);
        logGesture(evt, 'onStartShouldSetPanResponder', { accept: ok });
        return ok;
      },
      onMoveShouldSetPanResponder: (evt) => isLeftHalf(evt),
      onResponderTerminationRequest: () => true,
      onPanResponderGrant: (evt) => {
        logGesture(evt, 'onPanResponderGrant');
        if (!isLeftHalf(evt)) return;
        isTrackingRef.current = true;
        hasMovedRef.current = false;
        attackTriggeredRef.current = false;
        const { locationX, locationY } = evt.nativeEvent;
        centerRef.current = { x: locationX, y: locationY };
        const { rawJx, rawJz, thumbDx, thumbDy } = computeDir(locationX, locationY);
        setTouchCenter({ x: locationX, y: locationY });
        setThumbOffset({ x: thumbDx, y: thumbDy });
        smoothed.current = { x: rawJx, z: rawJz };
        // Sadece gerçek gesture (hareket) varsa aksiyon; merkezde dokunuş = aksiyon yok
        if (rawJx !== 0 || rawJz !== 0) sendIfChanged(rawJx, rawJz, 'Grant:non-zero');
      },
      onPanResponderMove: (evt) => {
        if (!isLeftHalf(evt)) {
          if (!attackTriggeredRef.current) {
            attackTriggeredRef.current = true;
            getGameAPI()?.triggerAttack?.();
          }
          return;
        }
        const { locationX, locationY } = evt.nativeEvent;
        const { rawJx, rawJz, thumbDx, thumbDy } = computeDir(locationX, locationY);
        if (rawJx !== 0 || rawJz !== 0) hasMovedRef.current = true; // Sadece deadzone dışı hareket sayılır
        setThumbOffset({ x: thumbDx, y: thumbDy });
        const prev = smoothed.current;
        const jx = prev.x + SMOOTH_ALPHA * (rawJx - prev.x);
        const jz = prev.z + SMOOTH_ALPHA * (rawJz - prev.z);
        smoothed.current = { x: jx, z: jz };
        if (rawJx !== 0 || rawJz !== 0) {
          const nearZero = Math.abs(jx) < DEADZONE && Math.abs(jz) < DEADZONE;
          if (nearZero && (lastSent.current.x !== 0 || lastSent.current.z !== 0)) return; // Grant sonrası koru
          sendIfChanged(jx, jz, 'Move');
        }
      },
      onPanResponderRelease: (evt) => {
        if (!isLeftHalf(evt)) {
          isTrackingRef.current = false;
          setTouchCenter(null);
          setThumbOffset({ x: 0, y: 0 });
          return; // Sağda bırakma = saldır; joystickDir korunur, karakter devam eder
        }
        logGesture(evt, 'onPanResponderRelease', {
          isTracking: isTrackingRef.current,
          leftHalf: true,
          hasMoved: hasMovedRef.current,
        });
        if (!isTrackingRef.current) return;
        isTrackingRef.current = false;
        setTouchCenter(null);
        setThumbOffset({ x: 0, y: 0 });
        lastSent.current = { x: 0, z: 0 };
        smoothed.current = { x: 0, z: 0 };
        getGameAPI()?.setJoystickDir?.(0, 0);
      },
      onPanResponderTerminate: () => {
        if (DEBUG) console.log('[Joystick] onPanResponderTerminate');
        isTrackingRef.current = false;
        setTouchCenter(null);
        setThumbOffset({ x: 0, y: 0 });
        // joystickDir sıfırlanmaz - karakter son yönde hareket etmeye devam eder
      },
    })
  ).current;

  return (
    <View style={styles.area} {...panResponder.panHandlers} pointerEvents="auto">
      {touchCenter && (
        <>
          <View
            style={[
              styles.indicator,
              {
                left: touchCenter.x - INDICATOR_RADIUS,
                top: touchCenter.y - INDICATOR_RADIUS,
              },
            ]}
            pointerEvents="none"
          />
          <View
            style={[
              styles.thumb,
              {
                left: touchCenter.x - 12 + thumbOffset.x,
                top: touchCenter.y - 12 + thumbOffset.y,
              },
            ]}
            pointerEvents="none"
          />
        </>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  area: {
    flex: 1,
  },
  indicator: {
    position: 'absolute',
    width: INDICATOR_RADIUS * 2,
    height: INDICATOR_RADIUS * 2,
    borderRadius: INDICATOR_RADIUS,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  thumb: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.5)',
  },
});
