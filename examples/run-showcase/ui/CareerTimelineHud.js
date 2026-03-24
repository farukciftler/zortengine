import * as THREE from 'three';
import { getDoorWorldPosition } from '../buildings/buildingPhysics.js';

export class CareerTimelineHud {
    constructor(scene) {
        this.scene = scene;
        this.root = null;
        this.container = null;
    }

    setup() {
        if (typeof document === 'undefined') return;

        const style = document.createElement('style');
        style.innerHTML = `
            .timeline-root {
                position: fixed;
                right: 0;
                top: 50%;
                transform: translate(0, -50%);
                z-index: 2000;
                display: flex;
                align-items: center;
                pointer-events: none;
                transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
            }
            .timeline-root.collapsed {
                transform: translate(308px, -50%);
            }
            /* Focused State (Inside Building) */
            .timeline-root.focused {
                transform: translate(0, -50%) !important;
                right: 20px;
            }
            .timeline-root.focused .timeline-toggle {
                display: none;
            }
            .timeline-root.focused .timeline-header {
                display: none;
            }
            .timeline-root.focused .timeline-container {
                opacity: 1;
                background: rgba(10, 10, 15, 0.85); /* Slightly more transparent */
                border-color: #f1c40f;
            }
            .timeline-root.focused .timeline-item:not(.active-focus) {
                display: none;
            }
            .timeline-root.focused .timeline-item.active-focus {
                border-color: #f1c40f;
                background: rgba(241, 196, 15, 0.1);
                pointer-events: none; /* Already inside, no need to click teleport */
            }

            .timeline-toggle {
                background: #f1c40f;
                border: 3px solid #000;
                border-right: none;
                width: 32px;
                height: 120px;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                font-family: 'Courier New', monospace;
                font-weight: bold;
                font-size: 14px;
                writing-mode: vertical-rl;
                text-orientation: mixed;
                pointer-events: auto;
                image-rendering: pixelated;
                box-shadow: -4px 4px 0px rgba(0,0,0,0.5);
                transition: transform 0.2s, background 0.2s;
                z-index: 2001;
            }
            .timeline-toggle:hover {
                transform: scale(1.05);
                background: #ffdb58;
            }
            .timeline-container {
                background: rgba(10, 10, 15, 0.95);
                border: 4px solid #fff;
                width: 300px;
                max-height: 80vh;
                overflow-y: auto;
                padding: 15px;
                display: flex;
                flex-direction: column;
                gap: 15px;
                pointer-events: auto;
                image-rendering: pixelated;
                box-shadow: 4px 4px 0px rgba(0,0,0,0.8);
                transition: opacity 0.3s, border-color 0.3s;
            }
            .timeline-root.collapsed .timeline-container {
                opacity: 0;
                pointer-events: none;
            }
            .timeline-header {
                color: #f1c40f;
                font-family: 'Courier New', monospace;
                font-size: 16px;
                font-weight: 900;
                margin-bottom: 5px;
                text-transform: uppercase;
                border-bottom: 2px solid #555;
                padding-bottom: 5px;
            }
            .timeline-item {
                border: 2px solid #444;
                padding: 10px;
                cursor: pointer;
                transition: border-color 0.2s, background 0.2s;
            }
            .timeline-item:hover {
                border-color: #f1c40f;
                background: rgba(241, 196, 15, 0.1);
            }
            .timeline-item .comp-name {
                font-family: 'Courier New', monospace;
                font-size: 18px;
                font-weight: 900;
                color: #fff;
            }
            .timeline-item .comp-title {
                font-family: 'Courier New', monospace;
                font-size: 12px;
                color: #f1c40f;
                margin: 4px 0;
            }
            .timeline-item .comp-period {
                font-family: 'Courier New', monospace;
                font-size: 11px;
                color: #888;
                font-style: italic;
            }
            .timeline-item .comp-desc {
                font-family: 'Courier New', monospace;
                font-size: 11px;
                color: #ccc;
                margin-top: 8px;
                line-height: 1.4;
            }
            .timeline-container::-webkit-scrollbar {
                width: 8px;
            }
            .timeline-container::-webkit-scrollbar-track {
                background: #111;
            }
            .timeline-container::-webkit-scrollbar-thumb {
                background: #fff;
                border: 2px solid #111;
            }
        `;
        document.head.appendChild(style);

        this.root = document.createElement('div');
        this.root.className = 'timeline-root';
        
        const toggle = document.createElement('div');
        toggle.className = 'timeline-toggle';
        toggle.innerText = 'CAREER PATH';
        toggle.onclick = () => this.root.classList.toggle('collapsed');
        this.root.appendChild(toggle);

        this.container = document.createElement('div');
        this.container.className = 'timeline-container';
        
        const header = document.createElement('div');
        header.className = 'timeline-header';
        header.innerText = 'Experiences';
        this.container.appendChild(header);

        this.experienceItems = new Map();

        const experiences = [
            { 
                name: 'BOYNER', 
                title: 'Senior Product Manager',
                period: 'Jan 2025 – Present',
                desc: 'Leading ML initiatives for PRD automation and fraud engine transformation. Integrated AI tools with Insider for advanced segmentation.',
                buildingId: 'boyner' 
            },
            { 
                name: 'WUGO', 
                title: 'Product Manager',
                period: 'Jul 2023 – May 2024',
                desc: 'Optimized user engagement and retention for event discovery app. Developed feature roadmaps and expanded product-market fit.',
                buildingId: 'wugo' 
            },
            { 
                name: 'INVEON', 
                title: 'Junior Developer',
                period: 'Dec 2019 – Mar 2021',
                desc: 'Built ASP.NET APIs and Dockerized orchestration environments. Developed a social platform using the MVC framework.',
                buildingId: 'inveon' 
            }
        ];

        experiences.forEach(exp => {
            const item = document.createElement('div');
            item.className = 'timeline-item';
            item.innerHTML = `
                <div class="comp-name">${exp.name}</div>
                <div class="comp-title">${exp.title}</div>
                <div class="comp-period">${exp.period}</div>
                <div class="comp-desc">${exp.desc}</div>
            `;
            item.onclick = (e) => {
                e.stopPropagation();
                this._teleportToBuilding(exp.buildingId);
            };
            this.container.appendChild(item);
            this.experienceItems.set(exp.buildingId, item);
        });

        this.root.appendChild(this.container);
        document.body.appendChild(this.root);
    }

    setFocusedBuilding(buildingId) {
        if (!this.root) return;

        if (buildingId) {
            this.root.classList.add('focused');
            this.root.classList.remove('collapsed');
            
            // Mark the active card
            this.experienceItems.forEach((item, id) => {
                if (id === buildingId) {
                    item.classList.add('active-focus');
                } else {
                    item.classList.remove('active-focus');
                }
            });
        } else {
            this.root.classList.remove('focused');
            this.experienceItems.forEach(item => item.classList.remove('active-focus'));
        }
    }

    setCollapsed(collapsed) {
        if (!this.root || this.root.classList.contains('focused')) return;
        if (collapsed) {
            this.root.classList.add('collapsed');
        } else {
            this.root.classList.remove('collapsed');
        }
    }

    _teleportToBuilding(buildingId) {
        if (!this.scene.player || !this.scene.player.group || !this.scene.player.body) return;

        const movement = this.scene.player.getComponent('movement');
        const nav = this.scene._navSystem;

        const targetBuilding = this.scene._interactiveBuildings.find(b => {
             const bName = b.interaction?.buildingName?.toLowerCase();
             return bName === buildingId;
        });

        if (targetBuilding) {
            const entrancePos = getDoorWorldPosition(targetBuilding.interaction);
            
            // Auto-collapse when choice is made
            this.setCollapsed(true);

            // Try to navigate using AI pathfinding
            if (nav && movement) {
                // Ensure we are in isometric mode for path following
                movement.setMode('isometric');
                this.scene.cameraMode = 'isometric';
                if (this.scene.cameraManager) this.scene.cameraManager.setMode('isometric');

                // Target a point slightly offset from the door to avoid building collision padding
                // Sidewalk is usually in negative X, more +X is towards the street center
                const targetPos = new THREE.Vector3(entrancePos.x + 1.2, 0, entrancePos.z);
                const path = nav.findPath(this.scene.player.group.position, targetPos);
                
                if (path && path.length > 0) {
                    movement.setPath(path, () => {
                        // After walking to the door, step inside to trigger interior mode
                        const targetX = entrancePos.x - 3.5; 
                        const targetZ = entrancePos.z;
                        this.scene.player.body.position.set(targetX, 1.2, targetZ);
                        this.scene.player.body.velocity.set(0, 0, 0);
                        this.scene.player.group.position.set(targetX, 1.2, targetZ);
                    });
                    if (this.scene.hud) {
                        this.scene.hud.updateInfo(`${buildingId.toUpperCase()} konumuna yürünüyor...`);
                    }
                    return;
                }
            }

            // Fallback: Teleport if no path found or system missing
            // If we are here, pathfinding failed (likely blocked or out of bounds)
            const targetX = entrancePos.x - 3; 
            const targetZ = entrancePos.z;
            this.scene.player.body.position.set(targetX, 1.2, targetZ);
            this.scene.player.body.velocity.set(0, 0, 0);
            this.scene.player.group.position.set(targetX, 1.2, targetZ);
            
            if (this.scene.hud) {
                this.scene.hud.updateInfo(`${buildingId.toUpperCase()} binasına rota bulunamadı, ışınlanıldı.`);
            }
        }
    }
}
