/**
 * Dokunma bölgesi yardımcısı — sol/sağ yarı veya özel rect.
 * Oyunlar için reusable; engine'e bağımlı değil.
 *
 * @example
 * const isLeft = createRegionChecker('left');
 * if (isLeft(evt)) { ... }
 *
 * const custom = createRegionChecker({ left: 0, top: 0, width: 0.5, height: 1 });
 */
function getDimensions() {
  try {
    const D = require('react-native').Dimensions;
    return D.get('window');
  } catch {
    return { width: 1, height: 1 };
  }
}

/**
 * @param {string|object} region
 *   - 'left' | 'right': ekran yarısı
 *   - { left, top, width, height }: 0–1 oran (örn. width: 0.5 = yarım)
 *   - { leftPx, topPx, widthPx, heightPx }: piksel
 * @returns {(evt: { nativeEvent?: { pageX?: number, pageY?: number } }) => boolean}
 */
export function createRegionChecker(region) {
  if (region === 'left' || region === 'right') {
    return (evt) => {
      const px = evt?.nativeEvent?.pageX;
      if (px === undefined || px === null) return false;
      const { width } = getDimensions();
      return region === 'left' ? px < width / 2 : px >= width / 2;
    };
  }
  if (typeof region === 'object' && region !== null) {
    const { left = 0, top = 0, width: w = 1, height: h = 1 } = region;
    const hasPx = 'leftPx' in region || 'widthPx' in region;
    if (hasPx) {
      const leftPx = region.leftPx ?? 0;
      const topPx = region.topPx ?? 0;
      const widthPx = region.widthPx ?? 0;
      const heightPx = region.heightPx ?? 0;
      return (evt) => {
        const px = evt?.nativeEvent?.pageX;
        const py = evt?.nativeEvent?.pageY;
        if (px == null || py == null) return false;
        return px >= leftPx && px < leftPx + widthPx && py >= topPx && py < topPx + heightPx;
      };
    }
    return (evt) => {
      const px = evt?.nativeEvent?.pageX;
      const py = evt?.nativeEvent?.pageY;
      if (px == null || py == null) return false;
      const { width, height } = getDimensions();
      const x0 = left * width;
      const y0 = top * height;
      const x1 = (left + w) * width;
      const y1 = (top + h) * height;
      return px >= x0 && px < x1 && py >= y0 && py < y1;
    };
  }
  return () => false;
}
