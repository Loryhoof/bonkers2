import * as THREE from 'three'
import { loadGLB, randomBetween } from './Utils'
import { FBXLoader } from 'three/examples/jsm/Addons.js'
import PhysicsObject from '../interfaces/PhysicsObject'
import PhysicsManager from './PhysicsManager'


export default class Enemy extends THREE.Object3D {

    private scene: THREE.Scene
    private mixer: THREE.AnimationMixer | any
    private physicsObject: PhysicsObject | any
    private velocity: THREE.Vector3 = new THREE.Vector3()
    private target: any

    private lastAttackTime: number = 0
    private canAttack: boolean = true

    constructor(scene: THREE.Scene) {
        super()
        this.scene = scene
        this.init()
    }

    setTarget(target: any) {
        this.target = target
    }

    init() {
        const fbxLoader = new FBXLoader();
        fbxLoader.load('chars/zombie_running.fbx', (model: any) => {

            //console.log(model, "zombieeeesadsad")

            let clips = model.animations;

            this.add(model)

            console.log(model, "ZOMBIAS")

            this.mixer = new THREE.AnimationMixer( model );

            model.scale.set(0.007, 0.007, 0.007)
            model.position.y -= 1.3

            // clips.forEach( ( clip ) => {
            //     this.mixer.clipAction( clip ).play();
            // } );

            this.mixer.clipAction( clips[0] ).play();

            this.scene.add(this)

            const physics = PhysicsManager.getInstance()

            this.physicsObject = physics.createPlayerCapsule()
        });
    }

    attackTarget(target: any) {
        target.damage(5)
    }

    updateMovement(elapsedTime: number, deltaTime: number) {

        this.velocity.set(0, 0, 0);

        if(this.target) {
            let dir = new THREE.Vector3()
            dir.subVectors(this.target.position, this.position)
            dir.y = 0
            dir.normalize()

            let distance = new THREE.Vector3(this.position.x, 0, this.position.z).distanceTo(new THREE.Vector3(this.target.position.x, 0, this.target.position.z))

            // if(distance < 1.5 && this.canAttack) {
            //     this.lastAttackTime = elapsedTime
            //     this.canAttack = false
            //     this.attackTarget(this.target)
            // }

            if(distance <= 2.5) {
                let t = new THREE.Object3D
                t.position.set(randomBetween(-50, 50), 0, randomBetween(-50, 50))
                this.setTarget(t)
            }

            this.velocity.add(dir.multiplyScalar(deltaTime * 350))
            this.lookAt(new THREE.Vector3(this.target.position.x, this.position.y, this.target.position.z))
        }
    }

    damage(dmg: number) {

    }

    roam() {

        let distance = this.position.distanceTo(this.target.position)

        if(distance <= 1.5) {
            let t = new THREE.Object3D
            t.position.set(randomBetween(-50, 50), 0, randomBetween(-50, 50))
            this.setTarget(t)
        }

    }

    update(elapsedTime: number, deltaTime: number) {
        
        if(!this.canAttack) {
            if (elapsedTime - this.lastAttackTime >= 1) {
                this.canAttack = true
            }
        }
        
        if(!this.mixer || !this.physicsObject) {
            return
        }

        let {x, y, z} = this.physicsObject?.rigidBody.translation()

        this.position.set(x, y, z)

        const physics = PhysicsManager.getInstance()

        const displacement = this.velocity.clone().multiplyScalar(deltaTime * 75)
        const linVel = this.physicsObject.rigidBody.linvel()
        displacement.y = linVel.y

        physics.setLinearVelocity(this.physicsObject?.rigidBody, displacement)

        this.updateMovement(elapsedTime, deltaTime)

        
        this.mixer.update(deltaTime)

    }
}