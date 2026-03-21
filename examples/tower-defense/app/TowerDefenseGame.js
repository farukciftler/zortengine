import { Engine } from 'zortengine';
import { MainMenuScene } from '../scenes/MainMenuScene.js';
import { GameScene } from '../scenes/GameScene.js';

export class TowerDefenseGame extends Engine {
    constructor() {
        super(document.body, { seed: 'td-iso-base' });
        
        this.menuScene = new MainMenuScene();
        this.gameScene = new GameScene();
        
        this.addScene('menu', this.menuScene);
        this.addScene('game', this.gameScene);
        
        this.useScene('menu');
        this.start();
        
        // Custom event for scene switching
        this.events.on('nav:game', () => this.useScene('game'));
        this.events.on('nav:menu', () => this.useScene('menu'));
    }
}
