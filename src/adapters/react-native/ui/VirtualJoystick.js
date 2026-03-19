/**
 * Yeniden kullanılabilir sanal joystick — gesture tabanlı, sadece gerekli API.
 * Sol/sağ ayırma, deadzone, smoothing dahil.
 *
 * @example
 * <VirtualJoystick
 *   region="left"
 *   onDirectionChange={(x, z) => inputManager.setJoystickDir(x, z)}
 *   onReleaseOutside={() => inputManager.triggerAction('attack')}
 * />
 */
import React, { useRef, useState, useMemo } from 'react';
import { View, PanResponder, StyleSheet } from 'react-native';
import { createRegionChecker } from './TouchRegion.js';

const DEFAULT_RADIUS = 80;
const DEFAULT_DEADZONE = 0.12;
const DEFAULT_SMOOTH_ALPHA = 0.35;
const DEFAULT_SEND_THRESHOLD = 0.06;

export function VirtualJoystick({
  region = 'left',
  onDirectionChange,
  onReleaseOutside,
  radius = DEFAULT_RADIUS,
  deadzone = DEFAULT_DEADZONE,
  smoothAlpha = DEFAULT_SMOOTH_ALPHA,
  resetOnRelease = true,
  showVisual = true,
  style,
}) {
  const isInRegion = useMemo(() => createRegionChecker(region), [region]);
  const onDirRef = useRef(onDirectionChange);
  const onReleaseRef = useRef(onReleaseOutside);
  onDirRef.current = onDirectionChange;
  onReleaseRef.current = onReleaseOutside;
  const centerRef = useRef({ x: 0, y: 0 });
  const lastSent = useRef({ x: 0, z: 0 });
  const smoothed = useRef({ x: 0, z: 0 });
  const isTrackingRef = useRef(false);
  const hasMovedRef = useRef(false);
  const releaseOutsideTriggeredRef = useRef(false);
  const [touchCenter, setTouchCenter] = useState(null);
  const [thumbOffset, setThumbOffset] = useState({ x: 0, y: 0 });

  const send = (jx, jz) => {
    const prev = lastSent.current;
    const skip = Math.abs(jx - prev.x) < DEFAULT_SEND_THRESHOLD && Math.abs(jz - prev.z) < DEFAULT_SEND_THRESHOLD;
    if (!skip && onDirRef.current) {
      lastSent.current = { x: jx, z: jz };
      onDirRef.current(jx, jz);
    }
  };

  const computeDir = (lx, ly) => {
    const cx = centerRef.current.x;
    const cy = centerRef.current.y;
    let dx = lx - cx;
    let dy = ly - cy;
    const len = Math.hypot(dx, dy) || 1;
    const scale = Math.min(1, radius / len);
    const cdx = dx * scale;
    const cdy = dy * scale;
    const rawJx = Math.abs(cdx / radius) < deadzone ? 0 : cdx / radius;
    const rawJz = Math.abs(cdy / radius) < deadzone ? 0 : cdy / radius;
    return { rawJx, rawJz, thumbDx: cdx, thumbDy: cdy };
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: (evt) => isInRegion(evt),
      onMoveShouldSetPanResponder: (evt) => isInRegion(evt),
      onResponderTerminationRequest: () => true,
      onPanResponderGrant: (evt) => {
        if (!isInRegion(evt)) return;
        isTrackingRef.current = true;
        hasMovedRef.current = false;
        releaseOutsideTriggeredRef.current = false;
        const { locationX, locationY } = evt.nativeEvent;
        centerRef.current = { x: locationX, y: locationY };
        const { rawJx, rawJz, thumbDx, thumbDy } = computeDir(locationX, locationY);
        setTouchCenter({ x: locationX, y: locationY });
        setThumbOffset({ x: thumbDx, y: thumbDy });
        smoothed.current = { x: rawJx, z: rawJz };
        if (rawJx !== 0 || rawJz !== 0) send(rawJx, rawJz);
      },
      onPanResponderMove: (evt) => {
        if (!isInRegion(evt)) {
          if (!releaseOutsideTriggeredRef.current && onReleaseRef.current) {
            releaseOutsideTriggeredRef.current = true;
            onReleaseRef.current();
          }
          return;
        }
        const { locationX, locationY } = evt.nativeEvent;
        const { rawJx, rawJz, thumbDx, thumbDy } = computeDir(locationX, locationY);
        if (rawJx !== 0 || rawJz !== 0) hasMovedRef.current = true;
        setThumbOffset({ x: thumbDx, y: thumbDy });
        const prev = smoothed.current;
        const jx = prev.x + smoothAlpha * (rawJx - prev.x);
        const jz = prev.z + smoothAlpha * (rawJz - prev.z);
        smoothed.current = { x: jx, z: jz };
        if (rawJx !== 0 || rawJz !== 0) {
          const nearZero = Math.abs(jx) < deadzone && Math.abs(jz) < deadzone;
          if (nearZero && (lastSent.current.x !== 0 || lastSent.current.z !== 0)) return;
          send(jx, jz);
        }
      },
      onPanResponderRelease: (evt) => {
        if (!isInRegion(evt)) {
          isTrackingRef.current = false;
          setTouchCenter(null);
          setThumbOffset({ x: 0, y: 0 });
          return;
        }
        if (!isTrackingRef.current) return;
        isTrackingRef.current = false;
        setTouchCenter(null);
        setThumbOffset({ x: 0, y: 0 });
        if (resetOnRelease && onDirRef.current) {
          lastSent.current = { x: 0, z: 0 };
          smoothed.current = { x: 0, z: 0 };
          onDirRef.current(0, 0);
        }
      },
      onPanResponderTerminate: () => {
        isTrackingRef.current = false;
        setTouchCenter(null);
        setThumbOffset({ x: 0, y: 0 });
      },
    })
  ).current;

  return (
    <View style={[styles.area, style]} {...panResponder.panHandlers} pointerEvents="auto">
      {showVisual && touchCenter && (
        <>
          <View
            style={[styles.indicator, { left: touchCenter.x - 24, top: touchCenter.y - 24 }]}
            pointerEvents="none"
          />
          <View
            style={[
              styles.thumb,
              { left: touchCenter.x - 12 + thumbOffset.x, top: touchCenter.y - 12 + thumbOffset.y },
            ]}
            pointerEvents="none"
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  area: { flex: 1 },
  indicator: {
    position: 'absolute',
    width: 48,
    height: 48,
    borderRadius: 24,
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
