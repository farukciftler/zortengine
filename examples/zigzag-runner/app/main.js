import { ZigzagGame } from './ZigzagGame.js';

window.onload = () => {
    const params = new URLSearchParams(window.location.search);
    new ZigzagGame({
        seed: params.get('seed') || undefined,
        restoreCheckpoint: params.get('restore') === '1'
    });
};
