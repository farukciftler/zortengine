import { Engine } from 'zortengine';
import { TetrisScene } from '../scenes/TetrisScene.js';

export class TetrisGame extends Engine {
    constructor() {
        super(document.body, { seed: '3d-tetris' });
        
        this.tetrisScene = new TetrisScene();
        this.addScene('tetris', this.tetrisScene);
        this.useScene('tetris');
        
        this.start();
    }
}
