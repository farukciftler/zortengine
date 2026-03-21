import { GameScene } from 'zortengine';

export class MainMenuScene extends GameScene {
    constructor() {
        super({ name: 'menu' });
    }

    setup() {
        this.menuUI = document.getElementById('main-menu');
        this.startBtn = document.getElementById('btn-start');
        
        this.startCallback = () => {
            this.engine.events.emit('nav:game');
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
