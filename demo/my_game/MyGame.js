import { Engine } from 'zortengine';
import { MainMenuScene } from '../../game/scenes/MainMenuScene.js';
import { RunScene } from '../../game/scenes/RunScene.js';

export class MyGame extends Engine {
    constructor(options = {}) {
        super(document.body, {
            seed: options.seed
        });
        this.bootOptions = options;
        this.menuScene = new MainMenuScene({
            networkUrl: options.networkUrl,
            playerId: options.playerId,
            playerName: options.playerName,
            initialRoomId: options.initialRoomId
        });
        this._bindMenuScene(this.menuScene);
        this.addScene('menu', this.menuScene);
        this.useScene('menu');
        this.start();
    }

    startRun(overrides = {}) {
        const runOptions = {
            seed: this.bootOptions.seed,
            loadoutId: this.bootOptions.loadoutId,
            restoreCheckpoint: this.bootOptions.restoreCheckpoint,
            replayData: this.bootOptions.replayData,
            ...overrides
        };

        if (this.sceneManager.scenes.has('run')) {
            this.sceneManager.removeScene('run');
        }
        this.addScene('run', this._createRunScene(runOptions));
        this.useScene('run');
    }

    openMenu() {
        this.useScene('menu');
    }

    _createRunScene(runOptions) {
        const scene = new RunScene(runOptions);
        scene.on('requestRestartRun', nextOptions => this.startRun(nextOptions));
        scene.on('requestOpenMenu', () => this.openMenu());
        return scene;
    }

    _bindMenuScene(scene) {
        scene.on('requestStartRun', overrides => {
            this.startRun(overrides);
        });
    }
}