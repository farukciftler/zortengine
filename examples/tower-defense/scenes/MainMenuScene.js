import { GameScene as ZortGameScene } from 'zortengine';
import { GameScene } from './GameScene.js';
import { Levels } from '../data/LevelConfig.js';

export class MainMenuScene extends ZortGameScene {
    constructor() {
        super({ name: 'menu' });
        this.selectedLevelIndex = 0;
    }

    setup() {
        this.menuUI = document.getElementById('main-menu');
        this.startBtn = document.getElementById('btn-start');
        this.lvlDisplay = document.getElementById('lvl-display');
        
        document.getElementById('btn-prev-lvl').addEventListener('click', () => {
             this.selectedLevelIndex = (this.selectedLevelIndex - 1 + Levels.length) % Levels.length;
             if (this.lvlDisplay) this.lvlDisplay.innerText = Levels[this.selectedLevelIndex].name;
        });
        
        document.getElementById('btn-next-lvl').addEventListener('click', () => {
             this.selectedLevelIndex = (this.selectedLevelIndex + 1) % Levels.length;
             if (this.lvlDisplay) this.lvlDisplay.innerText = Levels[this.selectedLevelIndex].name;
        });
        
        this.startCallback = () => {
            // Remove old scene if any
            if (this.engine.sceneManager.scenes.has('game')) {
                this.engine.sceneManager.removeScene('game');
            }
            // Spawn a completely fresh game scene injected with the selected level map
            const freshGame = new GameScene();
            freshGame.levelIndex = this.selectedLevelIndex;
            
            this.engine.addScene('game', freshGame);
            this.engine.useScene('game');
        };
        this.startBtn.addEventListener('click', this.startCallback);
    }
    
    onEnter() {
        if(this.menuUI) this.menuUI.classList.remove('hidden');
    }

    onExit() {
        if(this.menuUI) this.menuUI.classList.add('hidden');
    }
}
