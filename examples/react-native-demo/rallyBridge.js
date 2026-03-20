let api = null;

/** Gaz / fren (0–1), React pedallarından güncellenir */
const pedals = { gas: 0, brake: 0 };

export function setRallyGas(v) {
  pedals.gas = Math.max(0, Math.min(1, v));
}

export function setRallyBrake(v) {
  pedals.brake = Math.max(0, Math.min(1, v));
}

export function getRallyPedals() {
  return pedals;
}

export function resetRallyPedals() {
  pedals.gas = 0;
  pedals.brake = 0;
}

export function setRallyInputAPI(next) {
  api = next;
}

export function getRallyInputAPI() {
  return api;
}

export function clearRallyInputAPI() {
  api = null;
  resetRallyPedals();
}
