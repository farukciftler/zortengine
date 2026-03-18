import { Engine } from 'zortengine';
import { RunScene } from '../../game/scenes/RunScene.js';

export class MyGame extends Engine {
    constructor() {
        super(document.body);
        this.addScene('run', new RunScene());
        this.useScene('run');
        this.start();
    }
}