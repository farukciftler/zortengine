import * as THREE from 'three';
import { getInteractions } from '../data/Interactions.js';

/**
 * Manages interactive dialogues and the persistent trigger UI for the showcase.
 */
export class InteractionManager {
    constructor(scene) {
        this.scene = scene;
        this.interactions = [];
        this.activeInteraction = null;
    }

    setup() {
        this.interactions = getInteractions();
        this.activeInteraction = null;
        this.createDialogueTrigger();
    }

    update(delta, time) {
        if (!this.scene.player || !this.scene._dialogueUI) return;

        const pPos = this.scene.player.group.position;
        let bestInteraction = null;
        let minDist = Infinity;

        for (const inter of this.interactions) {
            // "info_booth" is special (it's the persistent "F" button and start dialogue)
            if (inter.id === 'info_booth') continue; 
            
            const dist = pPos.distanceTo(inter.pos);
            if (dist < inter.radius) {
                if (dist < minDist) {
                    minDist = dist;
                    bestInteraction = inter;
                }
            }
        }

        if (bestInteraction && !this.activeInteraction) {
            this.activeInteraction = bestInteraction;
            this.scene._isDialogueActive = true;
            this.scene._dialogueUI.show({
                ...bestInteraction,
                onComplete: () => {
                    this.scene._isDialogueActive = false;
                }
            });
        } else if (!bestInteraction && this.activeInteraction) {
            this.activeInteraction = null;
            this.scene._dialogueUI.hide();
        }
    }

    createDialogueTrigger() {
        const btn = document.createElement('div');
        btn.id = 'faruk-trigger-btn';
        btn.textContent = 'F'; 
        btn.style.position = 'fixed';
        btn.style.right = '24px';
        btn.style.bottom = '120px';
        btn.style.width = '60px';
        btn.style.height = '60px';
        btn.style.background = '#d35400';
        btn.style.color = '#fff';
        btn.style.border = '4px solid #1a1a2e';
        btn.style.borderRadius = '12px';
        btn.style.display = 'flex';
        btn.style.alignItems = 'center';
        btn.style.justifyContent = 'center';
        btn.style.fontFamily = '"Press Start 2P", cursive';
        btn.style.fontSize = '24px';
        btn.style.cursor = 'pointer';
        btn.style.zIndex = '1000';
        btn.style.boxShadow = '6px 6px 0 rgba(0,0,0,0.4)';
        btn.style.pointerEvents = 'auto';
        btn.style.transition = 'transform 0.1s, background 0.1s';
        
        btn.onmouseover = () => { 
            btn.style.background = '#e67e22';
            btn.style.transform = 'scale(1.1)';
        };
        btn.onmouseout = () => { 
            btn.style.background = '#d35400';
            btn.style.transform = 'scale(1.0)';
        };
        
        btn.onclick = () => {
            if (this.interactions[0]) {
                const triggerBtn = document.getElementById('faruk-trigger-btn');
                if (triggerBtn) triggerBtn.style.display = 'none';
                
                this.scene._isDialogueActive = true;
                this.scene._dialogueUI.show({
                    ...this.interactions[0],
                    onComplete: () => {
                        this.scene._isDialogueActive = false;
                        if (triggerBtn) triggerBtn.style.display = 'flex';
                    }
                });
            }
        };

        const parent = this.scene.engine?.container || document.body;
        parent.appendChild(btn);
    }
}
