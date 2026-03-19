import { Engine } from 'zortengine';
import { MenuScene } from '../scenes/MenuScene.js';
import { RunScene } from '../scenes/RunScene.js';

export class ZigzagGame extends Engine {
    constructor(options = {}) {
        super(document.body, { seed: options.seed });
        this.bootOptions = options;
        this.menuScene = new MenuScene();
        this.menuScene.on('requestStartRun', overrides => this.startRun(overrides));
        this.addScene('menu', this.menuScene);
        this.useScene('menu');
        this.start();
    }

    startRun(overrides = {}) {
        const runOptions = {
            seed: this.bootOptions.seed,
            restoreCheckpoint: this.bootOptions.restoreCheckpoint,
            ...overrides
        };
        if (this.sceneManager.scenes.has('run')) {
            this.sceneManager.removeScene('run');
        }
        const runScene = new RunScene(runOptions);
        runScene.on('requestRestartRun', next => this.startRun(next));
        runScene.on('requestOpenMenu', () => this.useScene('menu'));
        this.addScene('run', runScene);
        this.useScene('run');
    }

    openMenu() {
        this.useScene('menu');
    }
}
