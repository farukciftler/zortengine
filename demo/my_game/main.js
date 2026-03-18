import { MyGame } from './MyGame.js';

// Sayfa yüklendiğinde oyun motorunu başlat
window.onload = () => {
    const params = new URLSearchParams(window.location.search);
    const replayRaw = params.get('replay');

    new MyGame({
        seed: params.get('seed') || undefined,
        loadoutId: params.get('loadout') || undefined,
        restoreCheckpoint: params.get('restore') === '1',
        replayData: replayRaw ? JSON.parse(atob(replayRaw)) : null,
        networkUrl: params.get('ws') || 'ws://localhost:2567',
        initialRoomId: params.get('room') || '',
        playerId: params.get('player') || `browser-${Math.random().toString(36).slice(2, 7)}`,
        playerName: params.get('name') || 'Oyuncu'
    });
};