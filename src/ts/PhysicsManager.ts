import * as THREE from 'three';
import RAPIER, { Collider, KinematicCharacterController, RigidBody } from '@dimforge/rapier3d';

interface PhysicsObject {
    rigidBody: RAPIER.RigidBody;
    collider: RAPIER.Collider;
}

export default class PhysicsManager {
    public readonly gravity: RAPIER.Vector;
    public readonly physicsWorld: RAPIER.World;
    private static instance: PhysicsManager

    constructor() {
        this.gravity = new RAPIER.Vector3(0.0, -9.81, 0.0);
        this.physicsWorld = new RAPIER.World(this.gravity);
    }

    public static getInstance(): PhysicsManager {
        if(!PhysicsManager.instance) {
            PhysicsManager.instance = new PhysicsManager()
        }
        return PhysicsManager.instance
    }

    createDynamicBox(position: THREE.Vector3, scale: THREE.Vector3): PhysicsObject {
        const rbDesc = RAPIER.RigidBodyDesc.dynamic().setTranslation(position.x, position.y, position.z)
        const rigidBody = this.physicsWorld.createRigidBody(rbDesc);

        const colDesc = RAPIER.ColliderDesc.cuboid(scale.x, scale.y, scale.z);
        const collider = this.physicsWorld.createCollider(colDesc, rigidBody);

        return { rigidBody, collider };
    }

    createFixedBox(position: THREE.Vector3, scale: THREE.Vector3): PhysicsObject {
        const rbDesc = RAPIER.RigidBodyDesc.fixed().setTranslation(position.x, position.y, position.z)
        const rigidBody = this.physicsWorld.createRigidBody(rbDesc);

        const colDesc = RAPIER.ColliderDesc.cuboid(scale.x, scale.y, scale.z);
        const collider = this.physicsWorld.createCollider(colDesc, rigidBody);

        return { rigidBody, collider };
    }

    createPlayerCapsule(): PhysicsObject {
        let rbDesc = RAPIER.RigidBodyDesc.dynamic().setTranslation(0, 10, 0).lockRotations() //kinematicVelocityBased
        let rigidBody = this.physicsWorld.createRigidBody(rbDesc)

        let halfHeight = 0.2 // weird s
        let radius = 0.275

        let capsuleColDesc = RAPIER.ColliderDesc.capsule(halfHeight, radius)
        let collider = this.physicsWorld.createCollider(capsuleColDesc, rigidBody)

        return {rigidBody, collider}
    }

    createCharacterController() {
        const controller = this.physicsWorld.createCharacterController(0.01)
        return controller
    }

    moveCharacter(controller: KinematicCharacterController, collider: Collider, rigidBody: RigidBody, translation: RAPIER.Vector3 | THREE.Vector3) {
        controller.computeColliderMovement(
            collider,
            translation
        )
    
        let correctedMovement = controller.computedMovement();
    
        this.setLinearVelocity(rigidBody, correctedMovement)
    }

    setLinearVelocity(rigidBody: RigidBody, velocity: RAPIER.Vector3 | THREE.Vector3) {
        rigidBody.setLinvel(velocity, true)
    }

    update(elapsedTime: number, deltaTime: number) {
        this.physicsWorld.step()
    }
}
