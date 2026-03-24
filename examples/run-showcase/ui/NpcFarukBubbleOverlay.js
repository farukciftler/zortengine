import * as THREE from 'three';
import { FARUK_BUBBLE_MESSAGES } from '../data/npcFarukBubblePool.js';

/** Yakınlık yarıçapı (dünya birimi) */
const NEAR_DIST = 6;
const BUBBLE_DURATION = 3.8;
/** Aynı NPC / genel olarak ardışık baloncuklar arası minimum boşluk (sn) */
const GLOBAL_GAP = 0.85;
const PROXIMITY_BEFORE_ROLL = 0.28;
const ROLL_INTERVAL = 0.65;
/** Bu olasılığın altında kalırsa o denemede baloncuk çıkar (daha sık) */
const TRIGGER_PASS = 0.78;

/**
 * Yakında piksel-art konuşma balonu; aynı anda tek baloncuk, sık ama kontrollü tetikleme.
 */
export class NpcFarukBubbleOverlay {
    /** @param {object} scene */
    constructor(scene) {
        this.scene = scene;
        this._root = null;
        this._textEl = null;
        this._states = [];
        this._lastGlobalBubbleEnd = -999;
        this._activeIndex = -1;
        this._worldPos = new THREE.Vector3();
        this._projected = new THREE.Vector3();
        this._disposeStyle = null;
        this._ensureDom();
    }

    _ensureDom() {
        if (typeof document === 'undefined') return;
        const id = 'faruk-bubble-font';
        if (!document.getElementById(id)) {
            const link = document.createElement('link');
            link.id = id;
            link.rel = 'stylesheet';
            link.href = 'https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap';
            document.head.appendChild(link);
        }
        const style = document.createElement('style');
        style.textContent = `
            #npc-faruk-bubble-root {
                position: fixed; inset: 0; pointer-events: none; z-index: 8500;
                font-family: "Press Start 2P", monospace;
            }
            .npc-faruk-bubble-wrap {
                position: absolute; transform: translate(-50%, -100%); margin-top: -8px;
                max-width: min(260px, 72vw);
                display: none;
            }
            .npc-faruk-bubble-inner {
                image-rendering: pixelated;
                background: #fff8dc;
                color: #1a1a2e;
                border: 4px solid #111;
                box-shadow: 4px 4px 0 #000, inset -2px -2px 0 #c9b87a;
                padding: 10px 12px 12px;
                font-size: 9px;
                line-height: 1.65;
                letter-spacing: 0.02em;
                text-rendering: optimizeSpeed;
            }
            .npc-faruk-bubble-tail {
                position: absolute; left: 50%; bottom: -10px; transform: translateX(-50%);
                width: 0; height: 0;
                border-left: 10px solid transparent;
                border-right: 10px solid transparent;
                border-top: 12px solid #111;
            }
            .npc-faruk-bubble-tail::after {
                content: ""; position: absolute; left: -6px; top: -16px;
                border-left: 6px solid transparent; border-right: 6px solid transparent;
                border-top: 10px solid #fff8dc;
            }
        `;
        document.head.appendChild(style);
        this._disposeStyle = () => style.remove();

        this._root = document.createElement('div');
        this._root.id = 'npc-faruk-bubble-root';
        const wrap = document.createElement('div');
        wrap.className = 'npc-faruk-bubble-wrap';
        const inner = document.createElement('div');
        inner.className = 'npc-faruk-bubble-inner';
        const tail = document.createElement('div');
        tail.className = 'npc-faruk-bubble-tail';
        wrap.appendChild(inner);
        wrap.appendChild(tail);
        this._root.appendChild(wrap);
        this._bubbleWrap = wrap;
        this._textEl = inner;

        const parent = this.scene.engine?.container || document.body;
        parent.appendChild(this._root);
    }

    dispose() {
        this._root?.parentNode?.removeChild(this._root);
        this._root = null;
        this._disposeStyle?.();
        this._disposeStyle = null;
    }

    _syncStates(n) {
        while (this._states.length < n) {
            this._states.push({
                cooldown: 0,
                proximityTime: 0,
                rollAcc: 0,
                lastMsg: '',
                hideAt: 0
            });
        }
    }

    /**
     * @param {number} delta
     * @param {number} time
     */
    update(delta, time) {
        if (!this._root || !this._textEl) return;
        const player = this.scene.player;
        const npcs = this.scene._sidewalkNpcs;
        const camMgr = this.scene.getCamera?.();
        const renderer = this.scene.engine?.renderer;
        if (!player?.group || !npcs?.length || !camMgr || !renderer?.domElement) return;

        const camera = camMgr.getThreeCamera?.();
        if (!camera) return;

        const w = renderer.domElement.clientWidth;
        const h = renderer.domElement.clientHeight;
        const rng = this.scene.rng;
        const px = player.group.position.x;
        const pz = player.group.position.z;

        this._syncStates(npcs.length);

        if (this._activeIndex >= 0) {
            const stActive = this._states[this._activeIndex];
            if (time >= stActive.hideAt) {
                this._bubbleWrap.style.display = 'none';
                stActive.cooldown = rng?.float ? rng.float(4, 9) : 4 + Math.random() * 5;
                this._lastGlobalBubbleEnd = time;
                this._activeIndex = -1;
            } else {
                const npc = npcs[this._activeIndex];
                this._placeBubble(npc, camera, w, h);
                return;
            }
        }

        for (let i = 0; i < npcs.length; i++) {
            const st = this._states[i];
            if (st.cooldown > 0) st.cooldown -= delta;

            const nx = npcs[i].group.position.x;
            const nz = npcs[i].group.position.z;
            const dx = px - nx;
            const dz = pz - nz;
            const dist = Math.sqrt(dx * dx + dz * dz);

            if (dist > NEAR_DIST) {
                st.proximityTime = 0;
                st.rollAcc = 0;
                continue;
            }

            st.proximityTime += delta;
            if (st.cooldown > 0) continue;
            if (time - this._lastGlobalBubbleEnd < GLOBAL_GAP) continue;
            if (st.proximityTime < PROXIMITY_BEFORE_ROLL) continue;

            st.rollAcc += delta;
            if (st.rollAcc < ROLL_INTERVAL) continue;
            st.rollAcc = 0;

            const trigger = rng?.float ? rng.float(0, 1) : Math.random();
            if (trigger > TRIGGER_PASS) continue;

            const msg = this._pickMessage(st.lastMsg, rng);
            st.lastMsg = msg;
            st.hideAt = time + BUBBLE_DURATION;
            this._activeIndex = i;
            this._textEl.textContent = msg;
            this._bubbleWrap.style.display = 'block';
            this._placeBubble(npcs[i], camera, w, h);
            return;
        }
    }

    _pickMessage(exclude, rng) {
        const pool = exclude
            ? FARUK_BUBBLE_MESSAGES.filter(m => m !== exclude)
            : [...FARUK_BUBBLE_MESSAGES];
        if (!pool.length) return FARUK_BUBBLE_MESSAGES[0];
        const idx = rng?.float
            ? Math.min(pool.length - 1, Math.floor(rng.float(0, pool.length)))
            : Math.floor(Math.random() * pool.length);
        return pool[idx] ?? pool[0];
    }

    _placeBubble(npc, camera, w, h) {
        const g = npc.group.position;
        this._worldPos.set(g.x, g.y + 2.15, g.z);
        this._projected.copy(this._worldPos).project(camera);
        if (this._projected.z > 1) {
            this._bubbleWrap.style.display = 'none';
            return;
        }
        const x = (this._projected.x * 0.5 + 0.5) * w;
        const y = (-this._projected.y * 0.5 + 0.5) * h;
        const pad = 12;
        const bx = Math.min(w - pad, Math.max(pad, x));
        const by = Math.min(h - pad, Math.max(pad, y));
        this._bubbleWrap.style.left = `${bx}px`;
        this._bubbleWrap.style.top = `${by}px`;
    }
}
