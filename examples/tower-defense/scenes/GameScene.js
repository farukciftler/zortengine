import * as THREE from 'three';
import { GameScene as ZortGameScene } from 'zortengine';
import { CameraManager, InputManager } from 'zortengine/browser';

import { Levels, tileSize, buildGrid } from '../data/LevelConfig.js';
import { WaveSystem } from '../systems/WaveSystem.js';
import { BaseEntity } from '../actors/Base.js';
import { createFinishLine } from '../utils/FinishLineBuilder.js';
import { LaserTower } from '../towers/LaserTower.js';
import { CannonTower } from '../towers/CannonTower.js';
import { SlowTower } from '../towers/SlowTower.js';

// Skill Pool
const SKILL_POOL = [
    { id: 'laser_speed', name: 'Rapid Laser', desc: 'Laser fire rate +15%', icon: '⚡', apply: (s) => { s.skillMods.laserFireRate *= 0.85; } },
    { id: 'laser_dmg', name: 'Laser Power', desc: 'Laser damage +20%', icon: '🔴', apply: (s) => { s.skillMods.laserDamage *= 1.2; } },
    { id: 'cannon_dmg', name: 'Heavy Rounds', desc: 'Cannon damage +25%', icon: '💥', apply: (s) => { s.skillMods.cannonDamage *= 1.25; } },
    { id: 'slow_range', name: 'Frost Reach', desc: 'Slow tower range +20%', icon: '❄️', apply: (s) => { s.skillMods.slowRange *= 1.2; } },
    { id: 'sell_bonus', name: 'Salvage Expert', desc: 'Tower sell price +25%', icon: '💰', apply: (s) => { s.skillMods.sellBonus *= 1.25; } },
    { id: 'gold_bonus', name: 'Bounty Hunter', desc: 'Enemy gold reward +15%', icon: '🪙', apply: (s) => { s.skillMods.goldBonus *= 1.15; } },
    { id: 'all_range', name: 'Eagle Eye', desc: 'All tower range +10%', icon: '🦅', apply: (s) => { s.skillMods.allRange *= 1.1; } },
    { id: 'all_dmg', name: 'Arsenal', desc: 'All tower damage +10%', icon: '🎯', apply: (s) => { s.skillMods.allDamage *= 1.1; } },
];

export class GameScene extends ZortGameScene {
    constructor() {
        super({ name: 'game' });
        this.enemies = [];
        this.towers = [];
        this.tiles = [];
        this.gold = 300;
        this.playerHp = 100;
        
        this.levelIndex = 0;
        this.currentLevel = null;
        this.baseEntities = [];
        this.particles = [];
        this.floatingTexts = [];
        
        this.selectedTowerType = 'laser';
        this.hoverMesh = null;
        this.selectedTile = null;
        
        this.isGameOver = false;

        // XP & Level System
        this.xp = 0;
        this.playerLevel = 1;
        this.xpToNextLevel = 50;
        this.skillMods = {
            laserFireRate: 1.0,
            laserDamage: 1.0,
            cannonDamage: 1.0,
            slowRange: 1.0,
            sellBonus: 1.0,
            goldBonus: 1.0,
            allRange: 1.0,
            allDamage: 1.0,
        };
    }

    setup() {
        if (this.engine.renderer) {
            this.engine.renderer.shadowMap.enabled = true;
            this.engine.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        }

        this.currentLevel = Levels[this.levelIndex];

        // Format world positions
        this.worldPaths = this.currentLevel.paths.map(path => {
            return path.map(wp => new THREE.Vector3(
                (wp.c - this.currentLevel.cols/2 + 0.5) * tileSize, 
                0, 
                (wp.r - this.currentLevel.rows/2 + 0.5) * tileSize
            ));
        });
        
        this.worldBaseNodes = this.currentLevel.baseNodes.map(wp => new THREE.Vector3(
            (wp.c - this.currentLevel.cols/2 + 0.5) * tileSize, 
            2.5, 
            (wp.r - this.currentLevel.rows/2 + 0.5) * tileSize
        ));

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

        this.waveSystem = new WaveSystem(this, this.worldPaths);
        this.baseEntities = [];
        
        for (let basePos of this.worldBaseNodes) {
            let baseExt = new BaseEntity(this, 100);
            
            // Generate Detailed Racing-style Finish Line
            const finishVisuals = createFinishLine();
            
            baseExt.group.add(finishVisuals.group);
            baseExt.group.position.copy(basePos);
            this.add(baseExt);
            
            baseExt.core = finishVisuals.core;
            baseExt.ring = finishVisuals.ring;
            baseExt.flag = finishVisuals.flag; // New animated flag
            this.baseEntities.push(baseExt);
        }

        // Hover Highlight
        const hGeo = new THREE.PlaneGeometry(tileSize, tileSize);
        hGeo.rotateX(-Math.PI/2);
        this.hoverMesh = new THREE.Mesh(hGeo, new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.5, depthWrite: false }));
        this.hoverMesh.visible = false;
        this.threeScene.add(this.hoverMesh);

        // Range Blueprint Circle
        this.rangeCircle = new THREE.Mesh(
            new THREE.RingGeometry(0.95, 1.0, 64),
            new THREE.MeshBasicMaterial({ color: 0x00f2fe, side: THREE.DoubleSide, transparent: true, opacity: 0.8, depthWrite: false })
        );
        this.rangeCircle.rotation.x = -Math.PI / 2;
        this.rangeCircle.visible = false;
        this.threeScene.add(this.rangeCircle);

        // Events
        this.events.on('enemy:killed', (enemy) => {
            const goldReward = Math.floor(enemy.reward * this.skillMods.goldBonus);
            this.gold += goldReward;
            this.addXP(enemy.reward);
            this.updateHUD();
            this.removeEnemy(enemy);
        });
        
        this.events.on('enemy:reached_base', (enemy) => {
            this.playerHp -= enemy.damage;
            if (this.playerHp <= 0) this.events.emit('base:destroyed');
            else this.events.emit('base:dmg');
            this.removeEnemy(enemy);
        });

        this.events.on('base:dmg', () => this.updateHUD());
        this.events.on('base:destroyed', () => {
            this.updateHUD();
            this.gameOver();
        });
        
        this.inputManager.on('attack', () => this.handlePointClick());
    }

    _setupLighting() {
        this.threeScene.fog = new THREE.FogExp2(0x111520, 0.015);
        this.threeScene.background = new THREE.Color(0x111520);
        
        // Atmosphere soft light
        const hemi = new THREE.HemisphereLight(0x2d3436, 0x090a0f, 2.5);
        this.threeScene.add(hemi);

        const dir = new THREE.DirectionalLight(0xfdcbcb, 2.5);
        dir.position.set(30, 50, 30);
        dir.castShadow = true;
        dir.shadow.mapSize.width = 2048;
        dir.shadow.mapSize.height = 2048;
        dir.shadow.camera.near = 1;
        dir.shadow.camera.far = 150;
        dir.shadow.camera.left = -30;
        dir.shadow.camera.right = 30;
        dir.shadow.camera.top = 30;
        dir.shadow.camera.bottom = -30;
        dir.shadow.bias = -0.0005;
        this.threeScene.add(dir);
    }
    
    _buildWorld() {
        const { cols, rows } = this.currentLevel;
        this.gridLogic = buildGrid(this.currentLevel);
        
        // Build buff zone lookup
        this.buffZoneMap = {};
        if (this.currentLevel.buffZones) {
            for (const bz of this.currentLevel.buffZones) {
                this.buffZoneMap[`${bz.r}_${bz.c}`] = bz;
            }
        }

        // Create meshes
        this.groundGroup = new THREE.Group();
        
        const basePlateGeo = new THREE.BoxGeometry(cols * tileSize + 4, 8, rows * tileSize + 4);
        const basePlateMat = new THREE.MeshStandardMaterial({ color: 0x111625, roughness: 0.9 });
        const basePlate = new THREE.Mesh(basePlateGeo, basePlateMat);
        basePlate.position.set(0, -4.5, 0);
        basePlate.receiveShadow = true;
        this.groundGroup.add(basePlate);

        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const isPath = !this.gridLogic[r][c];
                const isBuffZone = !!this.buffZoneMap[`${r}_${c}`];
                
                const height = isPath ? 0.2 : 1.6;
                const centerY = isPath ? -0.1 : -0.4;
                
                const geo = new THREE.BoxGeometry(tileSize * 0.96, height, tileSize * 0.96);
                let colorHex = isPath ? 0x2d3436 : ( ((r+c)%2===0) ? 0x34495e : 0x2c3e50 );
                
                // Buff Zone visual highlight
                if (isBuffZone && !isPath) {
                    const bz = this.buffZoneMap[`${r}_${c}`];
                    colorHex = bz.type === 'range' ? 0x2d6a4f : 0x5a189a;
                }

                const mat = new THREE.MeshStandardMaterial({ 
                    color: colorHex,
                    roughness: 0.8,
                    metalness: isPath ? 0.2 : 0.1
                });
                
                const mesh = new THREE.Mesh(geo, mat);
                mesh.position.set((c - cols/2 + 0.5) * tileSize, centerY, (r - rows/2 + 0.5) * tileSize);
                mesh.castShadow = true;
                mesh.receiveShadow = true;
                
                if (!isPath) {
                    const edgeColor = isBuffZone ? 0x00f2fe : 0x55efc4;
                    const edgeOpacity = isBuffZone ? 0.4 : 0.15;
                    const edges = new THREE.LineSegments(
                        new THREE.EdgesGeometry(geo),
                        new THREE.LineBasicMaterial({ color: edgeColor, transparent: true, opacity: edgeOpacity })
                    );
                    mesh.add(edges);
                }

                // Buff Zone glow marker
                if (isBuffZone && !isPath) {
                    const bz = this.buffZoneMap[`${r}_${c}`];
                    const markerColor = bz.type === 'range' ? 0x00f2fe : 0xe040fb;
                    const markerGeo = new THREE.TorusGeometry(0.6, 0.04, 8, 32);
                    const markerMat = new THREE.MeshBasicMaterial({ color: markerColor, transparent: true, opacity: 0.7 });
                    const marker = new THREE.Mesh(markerGeo, markerMat);
                    marker.rotation.x = -Math.PI / 2;
                    marker.position.set(mesh.position.x, centerY + height/2 + 0.05, mesh.position.z);
                    this.groundGroup.add(marker);
                }

                const hitGeo = new THREE.PlaneGeometry(tileSize, tileSize);
                hitGeo.rotateX(-Math.PI/2);
                const hitMesh = new THREE.Mesh(hitGeo, new THREE.MeshBasicMaterial({visible: false}));
                hitMesh.position.set(mesh.position.x, centerY + height/2, mesh.position.z);
                hitMesh.userData = { r, c, buildable: this.gridLogic[r][c], tower: null, buffZone: this.buffZoneMap[`${r}_${c}`] || null };
                
                this.groundGroup.add(mesh);
                this.groundGroup.add(hitMesh);
                this.tiles.push(hitMesh);
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
                this.showWaveBanner(this.waveSystem.wave);
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

        // Next Level button
        const btnNextLvl = document.getElementById('btn-next-level');
        if (btnNextLvl) {
            btnNextLvl.addEventListener('click', () => {
                location.reload(); // Quick reset for now
            });
        }

        // initial build selection
        document.querySelector('[data-type="laser"]').classList.add('selected');
    }

    showWaveBanner(wave) {
        const banner = document.getElementById('wave-banner');
        const text = document.getElementById('banner-text');
        if (!banner || !text) return;
        
        text.innerText = `WAVE ${wave}`;
        banner.classList.remove('hidden');
        text.style.opacity = '1';
        text.style.transform = 'scale(1)';
        
        setTimeout(() => {
            text.style.opacity = '0';
            text.style.transform = 'scale(1.2)';
            setTimeout(() => {
                banner.classList.add('hidden');
                text.style.transform = 'scale(0.8)';
            }, 500);
        }, 2000);
    }

    onWaveEnded() {
        if (this.waveSystem.wave >= 10) { 
            this.victory();
        } else {
            this.btnNextWave.classList.remove('hidden');
        }
    }

    victory() {
        this.isGameOver = true;
        document.getElementById('victory-screen').classList.remove('hidden');
        this.createExplosion(new THREE.Vector3(0, 10, 0), 0xffff00);
        this.createExplosion(new THREE.Vector3(5, 8, -5), 0x00ff00);
        this.createExplosion(new THREE.Vector3(-5, 8, 5), 0x00ffff);
    }

    onResize(width, height, aspect) {
        if (this.cameraManager) {
            this.cameraManager.onResize(aspect);
        }
    }

    onEnter() {
        if(this.hudUI) {
            this.hudUI.classList.remove('hidden');
            this.waveUI.classList.remove('hidden');
            this.buildUI.classList.remove('hidden');
        }
        const xpBarContainer = document.getElementById('xp-bar-container');
        if (xpBarContainer) xpBarContainer.classList.remove('hidden');
        this.updateHUD();
        
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
        document.getElementById('val-hp').innerText = this.playerHp;
        document.getElementById('val-gold').innerText = this.gold;
        document.getElementById('val-wave').innerText = this.waveSystem.wave;
        document.getElementById('val-xp').innerText = this.xp;
        document.getElementById('val-player-lvl').innerText = this.playerLevel;
        
        const fill = document.getElementById('xp-bar-fill');
        if (fill) fill.style.width = `${Math.min(100, (this.xp / this.xpToNextLevel) * 100)}%`;
    }

    spawnEnemy(enemy) {
        this.add(enemy);
        this.enemies.push(enemy);
    }

    removeEnemy(enemy) {
        if (enemy.hp <= 0) {
            const pos = enemy.group.position.clone();
            pos.y += 1;
            this.createExplosion(pos, 0x4facfe);
            this.createFloatingText(pos, `+$${enemy.reward}`, 0x00f2fe);
        }
        
        enemy.isDead = true;
        this.enemies = this.enemies.filter(e => e !== enemy);
        this.remove(enemy);
        if (enemy.group) this.threeScene.remove(enemy.group);
    }

    createExplosion(pos, color) {
        for (let i = 0; i < 8; i++) {
            const size = 0.2 + Math.random() * 0.3;
            const p = new THREE.Mesh(
                new THREE.BoxGeometry(size, size, size),
                new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 1 })
            );
            p.position.copy(pos);
            const vel = new THREE.Vector3(
                (Math.random() - 0.5) * 6,
                Math.random() * 6 + 2,
                (Math.random() - 0.5) * 6
            );
            this.particles.push({ mesh: p, vel, life: 1.0 });
            this.threeScene.add(p);
        }
    }

    createFloatingText(pos, text, color) {
        const p = new THREE.Mesh(
            new THREE.OctahedronGeometry(0.35),
            new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 2.0 })
        );
        p.position.copy(pos);
        p.position.y += 1.0;
        this.threeScene.add(p);
        this.particles.push({ mesh: p, vel: new THREE.Vector3(0, 3, 0), life: 1.2, isFloatingText: true });
    }

    // XP & Level System
    addXP(amount) {
        this.xp += amount;
        while (this.xp >= this.xpToNextLevel) {
            this.xp -= this.xpToNextLevel;
            this.playerLevel++;
            this.xpToNextLevel = Math.floor(this.xpToNextLevel * 1.5);
            this.showSkillPanel();
        }
    }

    showSkillPanel() {
        const panel = document.getElementById('skill-panel');
        const choicesDiv = document.getElementById('skill-choices');
        if (!panel || !choicesDiv) return;
        
        // Pick 3 random skills
        const shuffled = [...SKILL_POOL].sort(() => Math.random() - 0.5);
        const choices = shuffled.slice(0, 3);
        choicesDiv.innerHTML = '';
        
        for (const skill of choices) {
            const btn = document.createElement('div');
            btn.style.cssText = 'cursor:pointer; background:rgba(30,40,50,0.95); border:1px solid rgba(255,255,255,0.2); border-radius:10px; padding:15px; width:140px; transition:border-color 0.2s, transform 0.2s;';
            btn.innerHTML = `<div style="font-size:2rem;">${skill.icon}</div><div style="font-weight:bold; margin:8px 0; color:#fff;">${skill.name}</div><div style="font-size:0.8rem; color:#aaa;">${skill.desc}</div>`;
            btn.addEventListener('mouseenter', () => { btn.style.borderColor = '#4facfe'; btn.style.transform = 'scale(1.05)'; });
            btn.addEventListener('mouseleave', () => { btn.style.borderColor = 'rgba(255,255,255,0.2)'; btn.style.transform = 'scale(1)'; });
            btn.addEventListener('click', () => {
                skill.apply(this);
                panel.classList.add('hidden');
                this.createFloatingText(new THREE.Vector3(0, 5, 0), `${skill.icon} ${skill.name}`, 0x4facfe);
                this.updateHUD();
            });
            choicesDiv.appendChild(btn);
        }
        panel.classList.remove('hidden');
    }

    // Impact Sparks (called by LaserTower on hit)
    createImpactSparks(pos, color) {
        for (let i = 0; i < 6; i++) {
            const size = 0.02 + Math.random() * 0.03;
            const p = new THREE.Mesh(
                new THREE.TetrahedronGeometry(size),
                new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 1 })
            );
            p.position.copy(pos);
            const vel = new THREE.Vector3(
                (Math.random() - 0.5) * 4,
                Math.random() * 3 + 0.5,
                (Math.random() - 0.5) * 4
            );
            this.particles.push({ mesh: p, vel, life: 0.25 });
            this.threeScene.add(p);
        }
    }

    gameOver() {
        this.isGameOver = true;
        alert("GAME OVER! Wave " + this.waveSystem.wave);
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
        
        let cost = 120;
        if(this.selectedTowerType === 'cannon') { TowerClass = CannonTower; cost=200; }
        else if(this.selectedTowerType === 'slow') { TowerClass = SlowTower; cost=150; }
        
        if (this.gold >= cost) {
            this.gold -= cost;
            const twr = new TowerClass(this);
            twr.group.position.copy(pTile);
            
            // Apply global skill mods
            twr.range *= this.skillMods.allRange;
            twr.damage *= this.skillMods.allDamage;
            twr.sellValue *= this.skillMods.sellBonus;
            if (twr.type === 'laser') {
                twr.fireRate *= this.skillMods.laserFireRate;
                twr.damage *= this.skillMods.laserDamage;
            } else if (twr.type === 'cannon') {
                twr.damage *= this.skillMods.cannonDamage;
            } else if (twr.type === 'slow') {
                twr.range *= this.skillMods.slowRange;
            }

            // Apply Buff Zone bonuses
            const bz = tile.userData.buffZone;
            if (bz) {
                if (bz.type === 'range') twr.range *= (1 + bz.bonus);
                else if (bz.type === 'damage') twr.damage *= (1 + bz.bonus);
                console.log(`[BuffZone] Tower gets ${bz.type} +${Math.round(bz.bonus*100)}% bonus!`);
            }

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
        document.getElementById('upg-dmg').innerText = twr.damage.toFixed(1);
        document.getElementById('upg-range').innerText = twr.range.toFixed(1);
        document.getElementById('upg-sell').innerText = Math.floor(twr.sellValue);
        document.getElementById('upg-cost').innerText = twr.upgradeCost;
        this.upgradeUI.classList.remove('hidden');
    }

    hideUpgradePanel() {
        this.selectedTile = null;
        this.upgradeUI.classList.add('hidden');
    }

    onUpdate(delta, time) {
        if (this.isGameOver) return;
        
        let showingRange = false;
        
        // Show range of currently selected tower
        if (this.selectedTile && this.selectedTile.userData.tower) {
            const twr = this.selectedTile.userData.tower;
            this.rangeCircle.position.set(twr.group.position.x, twr.group.position.y + 0.1, twr.group.position.z);
            this.rangeCircle.scale.setScalar(twr.range);
            this.rangeCircle.material.color.setHex(0x00f2fe);
            this.rangeCircle.visible = true;
            showingRange = true;
        }
        
        const buffTooltip = document.getElementById('buff-tooltip');
        let showingBuff = false;

        if (this.inputManager && this.tiles.length > 0) {
            const intersects = this.inputManager.getRaycastIntersection(this.cameraManager.getThreeCamera(), this.tiles);
            if (intersects.length > 0) {
                const hitMesh = intersects[0].object;
                const data = hitMesh.userData;
                this.hoverMesh.position.x = hitMesh.position.x;
                this.hoverMesh.position.y = hitMesh.position.y + 0.02;
                this.hoverMesh.position.z = hitMesh.position.z;
                this.hoverMesh.visible = true;
                
                if(data.tower) {
                    this.hoverMesh.material.color.setHex(0x00a8ff);
                    if (!showingRange) {
                        const twr = data.tower;
                        this.rangeCircle.position.set(twr.group.position.x, twr.group.position.y + 0.1, twr.group.position.z);
                        this.rangeCircle.scale.setScalar(twr.range);
                        this.rangeCircle.material.color.setHex(0xffffff);
                        this.rangeCircle.visible = true;
                        showingRange = true;
                    }
                } else if(data.buildable) {
                    this.hoverMesh.material.color.setHex(0xffffff);
                    if (!showingRange) {
                        let r = 5;
                        if(this.selectedTowerType === 'cannon') r = 4;
                        else if(this.selectedTowerType === 'slow') r = 5;
                        
                        this.rangeCircle.position.set(hitMesh.position.x, hitMesh.position.y + 0.1, hitMesh.position.z);
                        this.rangeCircle.scale.setScalar(r);
                        this.rangeCircle.material.color.setHex(0x00f2fe);
                        this.rangeCircle.visible = true;
                        showingRange = true;
                    }

                    // Show buff zone tooltip
                    if (data.buffZone && buffTooltip) {
                        const bz = data.buffZone;
                        const icon = bz.type === 'range' ? '🎯' : '⚔️';
                        const label = bz.type === 'range' ? 'RANGE' : 'DAMAGE';
                        const pct = Math.round(bz.bonus * 100);
                        buffTooltip.innerHTML = `${icon} +${pct}% ${label}`;
                        buffTooltip.style.borderColor = bz.type === 'range' ? 'rgba(0, 242, 254, 0.6)' : 'rgba(224, 64, 251, 0.6)';
                        buffTooltip.style.boxShadow = bz.type === 'range' 
                            ? '0 0 12px rgba(0, 242, 254, 0.3)' 
                            : '0 0 12px rgba(224, 64, 251, 0.3)';

                        // Position near the mouse
                        const ptr = this.inputManager.mousePos || { x: 0, y: 0 };
                        const screenX = ((ptr.x + 1) / 2) * window.innerWidth;
                        const screenY = ((1 - ptr.y) / 2) * window.innerHeight;
                        buffTooltip.style.left = `${screenX + 15}px`;
                        buffTooltip.style.top = `${screenY - 30}px`;
                        buffTooltip.classList.remove('hidden');
                        showingBuff = true;
                    }
                } else {
                    this.hoverMesh.material.color.setHex(0xe84118);
                }
            } else {
                this.hoverMesh.visible = false;
            }
        }
        if (!showingRange) {
            this.rangeCircle.visible = false;
        }
        if (!showingBuff && buffTooltip) {
            buffTooltip.classList.add('hidden');
        }

        // Animate particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.life -= delta;
            if (p.life <= 0) {
                this.threeScene.remove(p.mesh);
                if (p.mesh.geometry) p.mesh.geometry.dispose();
                if (p.mesh.material) p.mesh.material.dispose();
                this.particles.splice(i, 1);
                continue;
            }
            p.mesh.position.add(p.vel.clone().multiplyScalar(delta));
            if (!p.isFloatingText) {
                p.vel.y -= delta * 15; // Gravity
                p.mesh.scale.setScalar(p.life);
                p.mesh.rotation.x += delta * 5;
            } else {
                p.mesh.rotation.y += delta * 3;
                p.mesh.scale.setScalar(0.8 + Math.sin(time * 10) * 0.2);
            }
            if (p.mesh.material.opacity) p.mesh.material.opacity = p.life;
        }

        this.cameraManager.updateFollow(new THREE.Vector3(0,0,0), 0, delta, {
            orthoOffset: new THREE.Vector3(25, 25, 25),
            lookOffset: new THREE.Vector3(0, 0, 0)
        });

        this.waveSystem.update(delta);
        
        for (let b of this.baseEntities) {
            if (b.flag) {
                b.flag.children.forEach(piece => {
                    // Waving on the X axis since flag is spanning Z
                    const wave = Math.sin(time * 3 + piece.userData.phase) * 0.15;
                    piece.position.x = piece.userData.origX + wave;
                    piece.position.y = piece.userData.origY + Math.cos(time * 2 + piece.userData.phase) * 0.05;
                });
            }
        }

        // ZortEngine scenes require explicit ticks for custom behavior unless using System/Component
        for (let enemy of this.enemies) {
            if (!enemy.isDead) enemy.onUpdate(delta, time);
        }
        for (let tower of this.towers) {
            tower.onUpdate(delta, time);
        }
    }
}
