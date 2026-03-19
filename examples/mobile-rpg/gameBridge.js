/**
 * Engine hazır olana kadar ref null kalabiliyor.
 * Bu modül engine hazır olduğunda API'yi kaydeder.
 */
let api = null;
const DEBUG = true;

export function setGameAPI(gameApi) {
  api = gameApi;
  if (DEBUG) console.log('[gameBridge] setGameAPI', { hasSetJoystickDir: !!api?.setJoystickDir, hasTriggerAttack: !!api?.triggerAttack });
}

export function getGameAPI() {
  if (DEBUG && !api) console.log('[gameBridge] getGameAPI -> null (engine henüz hazır değil)');
  return api;
}

export function clearGameAPI() {
  if (DEBUG) console.log('[gameBridge] clearGameAPI');
  api = null;
}
