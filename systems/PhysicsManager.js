import * as CANNON from 'https://cdn.jsdelivr.net/npm/cannon-es@0.20.0/dist/cannon-es.js';

export class PhysicsManager {
    constructor() {
        // Fizik dünyasını oluştur
        this.world = new CANNON.World({
            gravity: new CANNON.Vec3(0, -9.81, 0), // Yerçekimi
        });
        
        // Sweep and prune algoritması performansı arttırır
        this.world.broadphase = new CANNON.SAPBroadphase(this.world);
        this.world.solver.iterations = 10;
        
        // Hangi Three.js objesinin hangi Cannon.js body'sine bağlı olduğunu tutar
        this.bodyMeshMap = new Map();
    }

    // Sahneye fiziksel bir obje ve görünümünü ekler
    addBody(body, mesh) {
        this.world.addBody(body);
        if (mesh) {
            this.bodyMeshMap.set(body, mesh);
        }
    }

    removeBody(body) {
        this.world.removeBody(body);
        this.bodyMeshMap.delete(body);
    }

    // Hızlı zemin (Plane) oluşturucu
    createGround(width = 100, height = 100) {
        const groundShape = new CANNON.Plane();
        const groundBody = new CANNON.Body({ mass: 0 }); // Kütlesi 0 olan cisimler statiktir (hareket etmez)
        groundBody.addShape(groundShape);
        // Cannon.js plane ekseni Z eksenine bakar, bu yüzden X ekseninde -90 derece döndürüyoruz
        groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0); 
        this.world.addBody(groundBody);
        return groundBody;
    }

    // Hızlı kutu oluşturucu
    createBox(width, height, depth, mass, position) {
        const shape = new CANNON.Box(new CANNON.Vec3(width/2, height/2, depth/2));
        const body = new CANNON.Body({ mass: mass, position: new CANNON.Vec3(position.x, position.y, position.z) });
        body.addShape(shape);
        return body;
    }

    // Hızlı küre oluşturucu
    createSphere(radius, mass, position) {
        const shape = new CANNON.Sphere(radius);
        const body = new CANNON.Body({ mass: mass, position: new CANNON.Vec3(position.x, position.y, position.z) });
        body.addShape(shape);
        return body;
    }

    // Döngü her karede güncellenir
    update(delta) {
        // Fizik motorunu adım adım (1/60 hz) ilerlet.
        // Maksimum 3 alt adım yaparak frame düşüşlerinde objelerin duvardan geçmesini engeller.
        this.world.step(1 / 60, delta, 3);
        
        // Cannon.js hesaplamalarını Three.js nesnelerine kopyala
        for (const [body, mesh] of this.bodyMeshMap.entries()) {
            mesh.position.copy(body.position);
            mesh.quaternion.copy(body.quaternion);
        }
    }
}