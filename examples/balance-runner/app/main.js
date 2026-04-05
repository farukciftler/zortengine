import { BalanceGame } from './BalanceGame.js';

window.onload = () => {
    const game = new BalanceGame();
    // Expose for debugging
    window.game = game;
};
