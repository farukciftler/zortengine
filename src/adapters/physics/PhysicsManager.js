import * as CANNON from 'cannon-es';

export class PhysicsManager {
    constructor(options = {}) {
        const gravity = options.gravity || { x: 0, y: -20.81, z: 0 };
        this.world = new CANNON.World({
            gravity: new CANNON.Vec3(gravity.x, gravity.y, gravity.z)
        });

        const defaultContact = options.defaultContactMaterial || {};
        this.world.defaultContactMaterial.friction = defaultContact.friction ?? 0.45;
        this.world.defaultContactMaterial.restitution = defaultContact.restitution ?? 0.0;

        this.world.broadphase = new CANNON.SAPBroadphase(this.world);
        this.world.solver.iterations = options.solverIterations || 10;
        this.bodyMeshMap = new Map();
        this.materials = new Map();
        this.contactMaterials = new Map();
        this.materialCounter = 0;
    }

    addBody(body, mesh, options = {}) {
        if (body.world !== this.world) {
            this.world.addBody(body);
        }
        if (mesh) {
            this.bodyMeshMap.set(body, {
                mesh,
                offset: options.offset || body.userData?.visualOffset || null
            });
        }
        return body;
    }

    removeBody(body) {
        this.world.removeBody(body);
        this.bodyMeshMap.delete(body);
    }

    createGround(width = 100, height = 100, options = {}) {
        const groundShape = new CANNON.Plane();
        const groundBody = this._createBody(groundShape, { x: 0, y: 0, z: 0 }, {
            ...options,
            mass: 0
        });
        groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
        return groundBody;
    }

    createBox(width, height, depth, mass, position, quaternion = null, options = {}) {
        const shape = new CANNON.Box(new CANNON.Vec3(width / 2, height / 2, depth / 2));
        const body = this._createBody(shape, position, {
            ...options,
            mass
        });
        if (quaternion) {
            body.quaternion.set(quaternion.x, quaternion.y, quaternion.z, quaternion.w);
        }
        return body;
    }

    createSphere(radius, mass, position, options = {}) {
        const shape = new CANNON.Sphere(radius);
        return this._createBody(shape, position, {
            ...options,
            mass
        });
    }

    createCharacterBody(radius, position, height = radius * 3, options = {}) {
        const halfHeight = Math.max(radius, height * 0.5);
        const shape = new CANNON.Box(new CANNON.Vec3(radius, halfHeight, radius));
        const body = this._createBody(shape, {
            x: position.x,
            y: position.y + halfHeight,
            z: position.z
        }, {
            mass: options.mass ?? 70,
            fixedRotation: options.fixedRotation ?? true,
            linearDamping: options.linearDamping ?? 0.85,
            angularDamping: options.angularDamping ?? 1.0,
            friction: options.friction ?? 0.0,
            restitution: options.restitution ?? 0.0,
            gravityScale: options.gravityScale ?? 1.0,
            allowSleep: options.allowSleep ?? false
        });
        body.userData = {
            ...(body.userData || {}),
            visualOffset: new CANNON.Vec3(0, -halfHeight, 0),
            halfHeight
        };
        return body;
    }

    createTrimesh(geometry, mass, position, quaternion = null, options = {}) {
        const vertices = Array.from(geometry.attributes.position.array);
        let indices = [];
        if (geometry.index) {
            indices = Array.from(geometry.index.array);
        } else {
            for (let i = 0; i < vertices.length / 3; i++) indices.push(i);
        }

        const shape = new CANNON.Trimesh(vertices, indices);
        const body = this._createBody(shape, position, {
            ...options,
            mass
        });

        if (quaternion) {
            body.quaternion.set(quaternion.x, quaternion.y, quaternion.z, quaternion.w);
        }
        return body;
    }

    createMaterial(name, options = {}) {
        if (this.materials.has(name)) {
            return this.materials.get(name);
        }

        const material = new CANNON.Material(name);
        material.friction = options.friction ?? this.world.defaultContactMaterial.friction;
        material.restitution = options.restitution ?? this.world.defaultContactMaterial.restitution;
        this.materials.set(name, material);
        return material;
    }

    getMaterial(name) {
        return this.materials.get(name) || null;
    }

    addContactMaterial(materialA, materialB, options = {}) {
        const materialAObj = this._resolveMaterial(materialA);
        const materialBObj = this._resolveMaterial(materialB);
        if (!materialAObj || !materialBObj) return null;

        const key = [materialAObj.name, materialBObj.name].sort().join('::');
        if (this.contactMaterials.has(key)) {
            return this.contactMaterials.get(key);
        }

        const contactMaterial = new CANNON.ContactMaterial(materialAObj, materialBObj, {
            friction: options.friction ?? this.world.defaultContactMaterial.friction,
            restitution: options.restitution ?? this.world.defaultContactMaterial.restitution
        });
        this.world.addContactMaterial(contactMaterial);
        this.contactMaterials.set(key, contactMaterial);
        return contactMaterial;
    }

    setGravity(x, y, z) {
        this.world.gravity.set(x, y, z);
    }

    setBodyProperties(body, options = {}) {
        if (!body) return body;

        if (options.mass !== undefined && body.mass !== options.mass) {
            body.mass = options.mass;
            body.updateMassProperties();
        }

        if (options.linearDamping !== undefined) {
            body.linearDamping = options.linearDamping;
        }

        if (options.angularDamping !== undefined) {
            body.angularDamping = options.angularDamping;
        }

        if (options.fixedRotation !== undefined) {
            body.fixedRotation = options.fixedRotation;
            body.updateMassProperties();
        }

        if (options.gravityScale !== undefined) {
            body.userData = {
                ...(body.userData || {}),
                gravityScale: options.gravityScale
            };
        }

        if (options.allowSleep !== undefined) {
            body.allowSleep = options.allowSleep;
        }

        if (options.friction !== undefined || options.restitution !== undefined || options.material) {
            body.material = this._resolveMaterial(options.material, options);
        }

        return body;
    }

    applyImpulse(body, impulse, worldPoint = null) {
        if (!body) return;

        const impulseVec = this._toVec3(impulse);
        const pointVec = worldPoint ? this._toVec3(worldPoint) : body.position;
        body.applyImpulse(impulseVec, pointVec);
    }

    applyForce(body, force, worldPoint = null) {
        if (!body) return;

        const forceVec = this._toVec3(force);
        const pointVec = worldPoint ? this._toVec3(worldPoint) : body.position;
        body.applyForce(forceVec, pointVec);
    }

    getMomentum(body) {
        if (!body) return new CANNON.Vec3(0, 0, 0);

        return new CANNON.Vec3(
            body.velocity.x * body.mass,
            body.velocity.y * body.mass,
            body.velocity.z * body.mass
        );
    }

    isBodyGrounded(body, maxDistance = 0.2) {
        if (!body) return false;

        const halfHeight = body.userData?.halfHeight || 0;
        const from = body.position.clone();
        const to = new CANNON.Vec3(
            body.position.x,
            body.position.y - halfHeight - maxDistance,
            body.position.z
        );
        const result = new CANNON.RaycastResult();

        this.world.raycastClosest(from, to, {
            skipBackfaces: true
        }, result);

        return result.hasHit && result.body && result.body !== body;
    }

    update(delta) {
        for (const body of this.world.bodies) {
            const gravityScale = body.userData?.gravityScale;
            if (body.mass > 0 && gravityScale !== undefined && gravityScale !== 1) {
                body.force.x += body.mass * this.world.gravity.x * (gravityScale - 1);
                body.force.y += body.mass * this.world.gravity.y * (gravityScale - 1);
                body.force.z += body.mass * this.world.gravity.z * (gravityScale - 1);
            }
        }

        this.world.step(1 / 60, delta, 3);

        for (const [body, binding] of this.bodyMeshMap.entries()) {
            const { mesh, offset } = binding;
            mesh.position.copy(body.position);
            if (offset) {
                mesh.position.x += offset.x;
                mesh.position.y += offset.y;
                mesh.position.z += offset.z;
            }

            if (!body.fixedRotation) {
                mesh.quaternion.copy(body.quaternion);
            }
        }
    }

    snapshot() {
        return {
            bodyCount: this.world.bodies.length,
            gravity: {
                x: this.world.gravity.x,
                y: this.world.gravity.y,
                z: this.world.gravity.z
            }
        };
    }

    _createBody(shape, position, options = {}) {
        const body = new CANNON.Body({
            mass: options.mass ?? 0,
            position: this._toVec3(position)
        });
        body.addShape(shape);
        this.setBodyProperties(body, options);
        return body;
    }

    _resolveMaterial(material, options = {}) {
        if (material instanceof CANNON.Material) {
            return material;
        }

        if (typeof material === 'string') {
            return this.createMaterial(material, options);
        }

        if (options.friction !== undefined || options.restitution !== undefined) {
            this.materialCounter += 1;
            return this.createMaterial(`material-${this.materialCounter}`, options);
        }

        return null;
    }

    _toVec3(value) {
        if (value instanceof CANNON.Vec3) return value;
        return new CANNON.Vec3(value.x, value.y, value.z);
    }
}
