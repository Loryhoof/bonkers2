import * as THREE from 'three'
import { loadGLB, randomBetween } from './Utils'
import HitBox from './HitBox'
import ItemType from '../enums/ItemType'
import { tree_fall_sound } from './AudioManager'
import Player from './Player'
import Wood from './Wood'
import PhysicsManager from './PhysicsManager'
import PhysicsObject from '../interfaces/PhysicsObject'

export default class Tree extends THREE.Object3D {

    public health: number
    public canTakeDamage: boolean
    public dying: boolean
    public hitBox: HitBox
    public model: THREE.Group
    public isDead: boolean

    private time: number
    private dropRate: number
    private physicsObject: PhysicsObject

    constructor(model: THREE.Group) {
        super()
        model.scale.set(1, randomBetween(0.4, 1.3), 1)
        this.position.set(randomBetween(-50, 50), 0.5, randomBetween(-50, 50))

        this.health = 100
        this.canTakeDamage = true
        this.dying = false
        this.hitBox = new HitBox(this, new THREE.Vector3(0.4, 10, 0.4))
        this.model = model.clone()

        this.time = 0

        this.isDead = false
        this.dropRate = 20
        this.physicsObject = PhysicsManager.getInstance().createFixedBox(this.position, new THREE.Vector3(0.4, 6, 0.4))

        const clonedModel = model.clone();

        this.add(clonedModel);
    }

    damage(dmg: number, item_type: ItemType, owner: Player) {
        if(item_type != ItemType.TOOL || this.dying) {
            return
        }

        this.health -= dmg

        if(owner.inventory.inventory["Wood"]) {
            owner.inventory.inventory["Wood"].quantity = owner.inventory.inventory["Wood"].quantity + this.dropRate
        }
        else {
            owner.inventory.inventory["Wood"] = new Wood(this.dropRate)
            for(let i = 0; i < owner.hotBar.length; i++) {
                if(owner.hotBar[i] == null) {
                    owner.hotBar[i] = owner.inventory.inventory["Wood"]
                    break;
                }
            }
        }

        if(this.health <= 0) {
            this.die()
        }

    }

    die() {

        if(tree_fall_sound.isPlaying) {
            tree_fall_sound.stop()
        }

        tree_fall_sound.setDetune(randomBetween(200, -200))
        tree_fall_sound.play()
        this.dying = true
        PhysicsManager.getInstance().physicsWorld.removeRigidBody(this.physicsObject.rigidBody)
    }

    update(elapsedTime: number, deltaTime: number) {
        if(this.health <= 0 && !this.dying) {
            this.die()
        }

        if (this.dying) {
            //console.log('yea')
            const targetRotation = { x: Math.PI / 2, y: this.rotation.y, z: this.rotation.z };
            const animationDuration = 10.0;
        
            // Calculate the normalized time 't' based on elapsed time and animation duration
            let t = Math.min(1, this.time / animationDuration);
        
            // Apply ease-out easing function to 't'
            t = 1 - Math.pow(1 - t, 2); // Square the normalized time to apply ease-out
        
            // Interpolate the rotations with eased 't'
            this.rotation.x = THREE.MathUtils.lerp(this.rotation.x, targetRotation.x, t);
            this.rotation.y = THREE.MathUtils.lerp(this.rotation.y, targetRotation.y, t);
            this.rotation.z = THREE.MathUtils.lerp(this.rotation.z, targetRotation.z, t);
        
            this.time += deltaTime;

            if(t >= 1) {
                this.isDead = true
            }
        }
}
}