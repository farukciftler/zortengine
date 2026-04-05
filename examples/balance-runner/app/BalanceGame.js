import { Engine } from 'zortengine';
import { BalanceScene } from '../scenes/BalanceScene.js';

export class BalanceGame extends Engine {
    constructor() {
        super(document.body, { 
            physics: true,
            debug: false 
        });
        
        this.balanceScene = new BalanceScene();
        this.addScene('main', this.balanceScene);
        this.useScene('main');
        this.start();
    }
}
