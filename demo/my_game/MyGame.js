import { Engine } from 'zortengine';
import { IsometricBattleScene } from './IsometricBattleScene.js';

export class MyGame extends Engine {
    constructor() {
        super(document.body);
        this.addScene('battle', new IsometricBattleScene());
        this.useScene('battle');
        this.start();
    }
}