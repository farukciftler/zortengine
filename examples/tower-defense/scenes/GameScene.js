import * as THREE from 'three';
import { GameScene as ZortGameScene } from 'zortengine';
import { CameraManager, InputManager } from 'zortengine/browser';

import { LevelConfig, buildGrid } from '../data/LevelConfig.js';
import { WaveSystem } from '../systems/WaveSystem.js';
import { BaseEntity } from '../actors/Base.js';
import { LaserTower } from '../towers/LaserTower.js';
import { CannonTower } from '../towers/CannonTower.js';
import { SlowTower } from '../towers/SlowTower.js';

export class GameScene extends ZortGameScene {
    constructor() {
        super({ name: 'game' });
        this.enemies = [];
        this.towers = [];
        this.tiles = [];
        this.gold = 500;
        
        this.selectedTowerType = 'laser';
        this.hoverMesh = null;
        this.selectedTile = null; // for upgrades
        
        this.isGameOver = false;
    }

    setup() {
        this.cameraManager = this.registerSystem('camera', new CameraManager(this.getRenderScene()), { priority: 10 });
        this.setCamera(this.cameraManager);
        this.cameraManager.setPreset('2.5d');
        
        this.inputManager = this.registerSystem('input', new InputManager({
            platform: this.engine.platform,
            domElement: this.engine.renderer.domElement,
            autoAttach: true
        }), { priority: 20 });
        this.inputManager.isFpsMode = false;
        
        this._setupLighting();
        this._buildWorld();
        this._bindUI();

        this.waveSystem = new WaveSystem(this, this.worldWaypoints);
        this.baseEntity = new BaseEntity(this, 100);
        
        // Setup Base Visuals
        const baseMesh = new THREE.Mesh(
            new THREE.BoxGeometry(4, 4, 4),
            new THREE.MeshStandardMaterial({ color: 0x4facfe, metalness: 0.8 })
        );
        this.baseEntity.group.add(baseMesh);
        this.baseEntity.group.position.copy(this.worldWaypoints[this.worldWaypoints.length - 1]);
        this.baseEntity.group.position.y = 2;
        this.add(this.baseEntity);

        // Hover Highlight
        const hGeo = new THREE.PlaneGeometry(LevelConfig.tileSize, LevelConfig.tileSize);
        hGeo.rotateX(-Math.PI/2);
        this.hoverMesh = new THREE.Mesh(hGeo, new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.3 }));
        this.hoverMesh.position.y = 0.1;
        this.hoverMesh.visible = false;
        this.threeScene.add(this.hoverMesh);

        // Events
        this.events.on('enemy:killed', (enemy) => {
            this.gold += enemy.reward;
            this.updateHUD();
            this.removeEnemy(enemy);
        });
        
        this.events.on('enemy:reached_base', (enemy) => {
            this.baseEntity.takeDamage(enemy.damage);
            this.removeEnemy(enemy);
        });

        this.events.on('base:dmg', () => this.updateHUD());
        this.events.on('base:destroyed', () => this.gameOver());
        
        this.inputManager.on('attack', () => this.handlePointClick());
    }

    _setupLighting() {
        this.threeScene.background = new THREE.Color(0x0f141e);
        const ambient = new THREE.AmbientLight(0xffffff, 0.4);
        this.threeScene.add(ambient);
        
        const dir = new THREE.DirectionalLight(0xffffff, 0.9);
        dir.position.set(20, 40, 20);
        dir.castShadow = true;
        this.threeScene.add(dir);
    }
    
    _buildWorld() {
        const { tileSize, cols, rows, waypoints } = LevelConfig;
        this.gridLogic = buildGrid();
        
        this.worldWaypoints = waypoints.map(wp => new THREE.Vector3(
            (wp.c - cols/2 + 0.5) * tileSize, 
            0, 
            (wp.r - rows/2 + 0.5) * tileSize
        ));

        // Create meshes
        this.groundGroup = new THREE.Group();
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const isPath = !this.gridLogic[r][c];
                const geo = new THREE.PlaneGeometry(tileSize * 0.95, tileSize * 0.95);
                geo.rotateX(-Math.PI/2);
                const mat = new THREE.MeshStandardMaterial({ 
                    color: isPath ? 0x2d3436 : 0x27ae60,
                    roughness: 0.9
                });
                const mesh = new THREE.Mesh(geo, mat);
                mesh.position.set((c - cols/2 + 0.5) * tileSize, 0, (r - rows/2 + 0.5) * tileSize);
                mesh.userData = { r, c, buildable: this.gridLogic[r][c], tower: null };
                this.groundGroup.add(mesh);
                this.tiles.push(mesh);
            }
        }
        this.threeScene.add(this.groundGroup);
    }

    _bindUI() {
        this.hudUI = document.getElementById('hud');
        this.waveUI = document.getElementById('wave-status');
        this.buildUI = document.getElementById('build-menu');
        this.upgradeUI = document.getElementById('upgrade-panel');
        
        this.btnNextWave = document.getElementById('btn-next-wave');
        this.btnNextWave.addEventListener('click', () => {
            if(!this.waveSystem.spawning) {
                this.waveSystem.startWave();
                this.btnNextWave.classList.add('hidden');
                this.updateHUD();
            }
        });

        const btns = document.querySelectorAll('.build-btn');
        btns.forEach(b => {
            b.addEventListener('click', (e) => {
                btns.forEach(btn => btn.classList.remove('selected'));
                b.classList.add('selected');
                this.selectedTowerType = b.dataset.type;
                this.hideUpgradePanel();
            });
        });
        
        document.getElementById('btn-upgrade').addEventListener('click', () => {
            if (this.selectedTile && this.selectedTile.userData.tower) {
                let twr = this.selectedTile.userData.tower;
                if (this.gold >= twr.upgradeCost) {
                    this.gold -= twr.upgradeCost;
                    twr.upgrade();
                    this.showUpgradePanel(this.selectedTile);
                    this.updateHUD();
                }
            }
        });
        
        document.getElementById('btn-sell').addEventListener('click', () => {
            if (this.selectedTile && this.selectedTile.userData.tower) {
                let twr = this.selectedTile.userData.tower;
                this.gold += twr.sellValue;
                this.remove(twr);
                
                // Cleanup 3D
                this.threeScene.remove(twr.group);
                this.towers = this.towers.filter(t => t !== twr);
                this.selectedTile.userData.tower = null;
                
                this.hideUpgradePanel();
                this.updateHUD();
            }
        });

        // initial build selection
        document.querySelector('[data-type="laser"]').classList.add('selected');
    }

    onEnter() {
        if(this.hudUI) {
            this.hudUI.classList.remove('hidden');
            this.waveUI.classList.remove('hidden');
            this.buildUI.classList.remove('hidden');
        }
        this.updateHUD();
        
        // Position camera to look at the board
        this.cameraManager.updateFollow(new THREE.Vector3(0,0,0), 0, 0, {
            orthoOffset: new THREE.Vector3(25, 25, 25),
            lookOffset: new THREE.Vector3(0, 0, 0)
        });
    }

    onExit() {
        if(this.hudUI) {
            this.hudUI.classList.add('hidden');
            this.waveUI.classList.add('hidden');
            this.buildUI.classList.add('hidden');
            this.upgradeUI.classList.add('hidden');
        }
    }

    updateHUD() {
        document.getElementById('val-hp').innerText = this.baseEntity.hp;
        document.getElementById('val-gold').innerText = this.gold;
        document.getElementById('val-wave').innerText = this.waveSystem.wave;
    }

    onWaveEnded() {
        this.btnNextWave.classList.remove('hidden');
    }

    spawnEnemy(enemy) {
        this.add(enemy);
        this.enemies.push(enemy);
    }

    removeEnemy(enemy) {
        enemy.isDead = true; // double safety
        this.enemies = this.enemies.filter(e => e !== enemy);
        this.remove(enemy);
        this.threeScene.remove(enemy.group);
    }

    gameOver() {
        this.isGameOver = true;
        alert("GAME OVER! Sona Kadar Gittin: Wave " + this.waveSystem.wave);
        // Quick Reset
        location.reload(); 
    }

    handlePointClick() {
        if (this.isGameOver) return;
        
        const intersects = this.inputManager.getRaycastIntersection(this.cameraManager.getThreeCamera(), this.tiles);
        if (intersects.length > 0) {
            const tile = intersects[0].object;
            const data = tile.userData;
            
            if (data.tower) {
                // Select existing tower
                this.showUpgradePanel(tile);
            } else if (data.buildable) {
                // Build a new tower
                this.hideUpgradePanel();
                this.buildTower(tile);
            } else {
                this.hideUpgradePanel();
            }
        } else {
            this.hideUpgradePanel();
        }
    }

    buildTower(tile) {
        let TowerClass = LaserTower;
        let pTile = tile.position;
        
        let tempTwr = new LaserTower(this); // Just to get cost, will optimize later
        let cost = 100;
        if(this.selectedTowerType === 'cannon') { TowerClass = CannonTower; cost=200; }
        else if(this.selectedTowerType === 'slow') { TowerClass = SlowTower; cost=150; }
        
        if (this.gold >= cost) {
            this.gold -= cost;
            const twr = new TowerClass(this);
            twr.group.position.copy(pTile);
            this.add(twr);
            this.towers.push(twr);
            tile.userData.tower = twr;
            this.updateHUD();
            console.log(`[GameArea] Built ${twr.id} at [X:${Math.round(pTile.x)}, Z:${Math.round(pTile.z)}]. Gold left: ${this.gold}`);
        } else {
            console.log(`[GameArea] Could not build ${this.selectedTowerType}. Need ${cost} gold, but have ${this.gold}.`);
        }
    }

    showUpgradePanel(tile) {
        this.selectedTile = tile;
        let twr = tile.userData.tower;
        document.getElementById('upg-title').innerText = twr.type.toUpperCase() + ' TOWER';
        document.getElementById('upg-lvl').innerText = twr.level;
        document.getElementById('upg-dmg').innerText = twr.damage.toFixed(0);
        document.getElementById('upg-cost').innerText = twr.upgradeCost;
        this.upgradeUI.classList.remove('hidden');
    }

    hideUpgradePanel() {
        this.selectedTile = null;
        this.upgradeUI.classList.add('hidden');
    }

    onUpdate(delta, time) {
        if (this.isGameOver) return;
        
        if (this.inputManager && this.tiles.length > 0) {
            const intersects = this.inputManager.getRaycastIntersection(this.cameraManager.getThreeCamera(), this.tiles);
            if (intersects.length > 0) {
                this.hoverMesh.position.x = intersects[0].object.position.x;
                this.hoverMesh.position.z = intersects[0].object.position.z;
                this.hoverMesh.visible = true;
                
                if(intersects[0].object.userData.tower) this.hoverMesh.material.color.setHex(0x00a8ff);
                else if(intersects[0].object.userData.buildable) this.hoverMesh.material.color.setHex(0xffffff);
                else this.hoverMesh.material.color.setHex(0xe84118);
            } else {
                this.hoverMesh.visible = false;
            }
        }

        this.cameraManager.updateFollow(new THREE.Vector3(0,0,0), 0, delta, {
            orthoOffset: new THREE.Vector3(25, 25, 25),
            lookOffset: new THREE.Vector3(0, 0, 0)
        });

        this.waveSystem.update(delta);
        
        // ZortEngine scenes require explicit ticks for custom behavior unless using System/Component
        for (let enemy of this.enemies) {
            if (!enemy.isDead) enemy.onUpdate(delta, time);
        }
        for (let tower of this.towers) {
            tower.onUpdate(delta, time);
        }
    }
}
