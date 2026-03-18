import * as CANNON from 'https://cdn.jsdelivr.net/npm/cannon-es@0.20.0/dist/cannon-es.js';

export class PhysicsManager {
    constructor() {
        this.world = new CANNON.World({
            gravity: new CANNON.Vec3(0, -20.81, 0), // Daha gerçekçi düşüş için yerçekimini arttırdık
        });
        
        // YENİ: Oyuncunun yere takılmasını ve çapraz yavaşlamayı önlemek için sürtünmeyi sıfırlıyoruz.
        // Çünkü hızı (velocity) zaten biz WASD ile manuel veriyoruz.
        this.world.defaultContactMaterial.friction = 0.0;
        
        this.world.broadphase = new CANNON.SAPBroadphase(this.world);
        this.world.solver.iterations = 10;
        this.bodyMeshMap = new Map();
    }

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

    createGround(width = 100, height = 100) {
        const groundShape = new CANNON.Plane();
        const groundBody = new CANNON.Body({ mass: 0 }); 
        groundBody.addShape(groundShape);
        groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0); 
        this.world.addBody(groundBody);
        return groundBody;
    }

    createBox(width, height, depth, mass, position) {
        const shape = new CANNON.Box(new CANNON.Vec3(width/2, height/2, depth/2));
        const body = new CANNON.Body({ mass: mass, position: new CANNON.Vec3(position.x, position.y, position.z) });
        body.addShape(shape);
        return body;
    }

    createSphere(radius, mass, position) {
        const shape = new CANNON.Sphere(radius);
        const body = new CANNON.Body({ mass: mass, position: new CANNON.Vec3(position.x, position.y, position.z) });
        body.addShape(shape);
        return body;
    }

    // -- YENİ: Oyuncu için fiziksel beden (Yuvarlanmaz, devrilmez) --
    createCharacterBody(radius, position) {
        const shape = new CANNON.Sphere(radius); // Kapsül veya Küre idealdir
        const body = new CANNON.Body({ 
            mass: 5, // 5kg kütle
            fixedRotation: true, // Asla fiziksel olarak takla atmasın veya yuvarlanmasın (dik dursun)
            position: new CANNON.Vec3(position.x, position.y, position.z) 
        });
        body.addShape(shape);
        body.linearDamping = 0.9; // Buzda kayıyormuş gibi durmamak için sürtünme
        this.world.addBody(body);
        return body;
    }

    // -- YENİ: Karmaşık geometriler (Rampa, sütun, tepe) için Trimesh çarpışma ağı --
    createTrimesh(geometry, mass, position, quaternion = null) {
        const vertices = Array.from(geometry.attributes.position.array);
        let indices = [];
        if (geometry.index) {
            indices = Array.from(geometry.index.array);
        } else {
            // İndeks yoksa sıralı oluştur
            for (let i = 0; i < vertices.length / 3; i++) indices.push(i);
        }
        
        const shape = new CANNON.Trimesh(vertices, indices);
        const body = new CANNON.Body({ mass: mass, position: new CANNON.Vec3(position.x, position.y, position.z) });
        
        if (quaternion) {
            body.quaternion.set(quaternion.x, quaternion.y, quaternion.z, quaternion.w);
        }
        
        body.addShape(shape);
        this.world.addBody(body);
        return body;
    }

    update(delta) {
        this.world.step(1 / 60, delta, 3);
        
        for (const [body, mesh] of this.bodyMeshMap.entries()) {
            mesh.position.copy(body.position);
            
            // Eğer body fixedRotation (karakter) ise Three.js mesh'inin rotasyonunu ezip bozma!
            if (!body.fixedRotation) {
                mesh.quaternion.copy(body.quaternion);
            }
        }
    }
}