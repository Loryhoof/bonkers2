import * as THREE from 'three';
import RAPIER, { Collider, KinematicCharacterController, QueryFilterFlags, RigidBody } from '@dimforge/rapier3d';

//.log(window.RAPIER, "window rapierrrwee")

let ray = new RAPIER.Ray(new RAPIER.Vector3(0,0,0), new RAPIER.Vector3(0,0,0))

let DOWN = new RAPIER.Vector3(0, -1, 0)

interface PhysicsObject {
    rigidBody: RAPIER.RigidBody;
    collider: RAPIER.Collider;
}

export default class PhysicsManager {
    public readonly gravity: RAPIER.Vector;
    public readonly physicsWorld: RAPIER.World;
    private static instance: PhysicsManager

    constructor() {
        this.gravity = new RAPIER.Vector3(0.0, -9.81, 0.0); // - 9.81
        this.physicsWorld = new RAPIER.World(this.gravity);
    }

    public static getInstance(): PhysicsManager {
        if(!PhysicsManager.instance) {
            PhysicsManager.instance = new PhysicsManager()
        }
        return PhysicsManager.instance
    }

    remove(physicsObject: PhysicsObject) {
        this.physicsWorld.removeRigidBody(physicsObject.rigidBody)
    }

    createDynamicBox(position: THREE.Vector3, scale: THREE.Vector3): PhysicsObject {
        const rbDesc = RAPIER.RigidBodyDesc.dynamic().setTranslation(position.x, position.y, position.z)
        const rigidBody = this.physicsWorld.createRigidBody(rbDesc);

        const colDesc = RAPIER.ColliderDesc.cuboid(scale.x, scale.y, scale.z);
        const collider = this.physicsWorld.createCollider(colDesc, rigidBody);

        return { rigidBody, collider };
    }

    createFixedBox(position: THREE.Vector3, scale: THREE.Vector3, rotation: THREE.Quaternion = new THREE.Quaternion()): PhysicsObject {
        const rbDesc = RAPIER.RigidBodyDesc.fixed().setTranslation(position.x, position.y, position.z).setRotation({w: rotation.w, x: rotation.x, y: rotation.y, z: rotation.z})
        const rigidBody = this.physicsWorld.createRigidBody(rbDesc);

        const colDesc = RAPIER.ColliderDesc.cuboid(scale.x, scale.y, scale.z);
        const collider = this.physicsWorld.createCollider(colDesc, rigidBody);

        return { rigidBody, collider };
    }

    createPlayerCapsule(): PhysicsObject {
        let rbDesc = RAPIER.RigidBodyDesc.dynamic().setTranslation(0, 40, 0).lockRotations() //kinematicVelocityBased
        let rigidBody = this.physicsWorld.createRigidBody(rbDesc)

        let halfHeight = 1.1 // weird s
        let radius = 0.275

        let capsuleColDesc = RAPIER.ColliderDesc.capsule(halfHeight, radius)
        let collider = this.physicsWorld.createCollider(capsuleColDesc, rigidBody)

        return {rigidBody, collider}
    }

    createCharacterController() {
        const controller = this.physicsWorld.createCharacterController(0.01)
        return controller
    }

    setTranslation(physicsObject: PhysicsObject, vec: RAPIER.Vector3) {
        physicsObject.rigidBody.setTranslation(vec, true)
    }

    intersectShape(shapePos: RAPIER.Vector3, shapeRot: RAPIER.Rotation, shape: RAPIER.Shape, collisionGroup: number | undefined) {
        return this.physicsWorld.intersectionWithShape(shapePos, shapeRot, shape, undefined, collisionGroup)     
    }

    moveCharacter(controller: KinematicCharacterController, collider: Collider, rigidBody: RigidBody, translation: RAPIER.Vector3 | THREE.Vector3) {
        controller.computeColliderMovement(
            collider,
            translation
        )
    
        let correctedMovement = controller.computedMovement();
    
        this.setLinearVelocity(rigidBody, correctedMovement)
    }

    raycast(origin: THREE.Vector3, dir: THREE.Vector3, rb: RigidBody) {

        ray.origin = origin
        ray.dir = dir

        let maxToi = 4.0;
        let solid = false;

        let hit = this.physicsWorld.castRay(ray, maxToi, solid, undefined, undefined, undefined, rb);

        if(hit !== null) {
            let hitPoint = ray.pointAt(hit.toi);
            return origin.distanceTo(hitPoint)
        }
        return null
    }

    setLinearVelocity(rigidBody: RigidBody, velocity: RAPIER.Vector3 | THREE.Vector3) {
        rigidBody.setLinvel(velocity, true)
    }

    update(elapsedTime: number, deltaTime: number) {
        this.physicsWorld.step()
    }
}
