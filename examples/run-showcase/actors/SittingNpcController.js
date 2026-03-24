/**
 * Controller for a static sitting NPC to make them look alive with subtle animations.
 */
export class SittingNpcController {
    constructor(parts = {}) {
        this.head = parts.head;
        this.torso = parts.torso;
        this.news = parts.news;
        this.lArm = parts.lArm;
        this.rArm = parts.rArm;
        
        this.seed = Math.random() * 100;
    }

    update(delta, time) {
        const t = time + this.seed;
        
        // 1. Breathing (Torso subtle bobbing and tilt)
        if (this.torso) {
            this.torso.position.y = 0.3 + Math.sin(t * 1.5) * 0.005;
            this.torso.rotation.x = Math.sin(t * 0.8) * 0.02;
        }

        // 2. Reading Head movements (Subtle nod and turn)
        if (this.head) {
            // "Reading lines" pattern
            const readingScan = Math.sin(t * 2.0) * 0.05;
            this.head.rotation.y = readingScan;
            
            // Occasional look up or deeper nod
            this.head.rotation.x = 0.3 + Math.sin(t * 0.4) * 0.04;
        }

        // 3. Holding Newspaper (subtle shake or drift)
        if (this.news) {
            const wobble = Math.sin(t * 3.0) * 0.002;
            this.news.position.y = 1.05 + Math.sin(t * 1.5) * 0.008 + wobble;
            this.news.rotation.z = Math.sin(t * 0.7) * 0.015;
        }

        // 4. Arms following torso/newspaper
        if (this.lArm) this.lArm.rotation.x = -1.0 + Math.sin(t * 1.5) * 0.02;
        if (this.rArm) this.rArm.rotation.x = -1.0 + Math.sin(t * 1.5) * 0.02;
    }
}
