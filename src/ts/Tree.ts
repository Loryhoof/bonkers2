import * as THREE from 'three'
import { loadGLB } from './Utils'

export default class Tree extends THREE.Object3D {

    public health: number
    public canTakeDamage: boolean
    public dying: boolean

    constructor(model: THREE.Group) {
        super()
        this.health = 100
        this.canTakeDamage = true
        this.dying = false

        const clonedModel = model.clone();
        this.add(clonedModel);
    }

    // async init() {
    //     const model = await loadGLB('models/tree.glb') as any
    //     this.add(model.scene)
    // }

    update(elapsedTime: number, deltaTime: number) {
        if(this.health <= 0 && !this.dying) {
            //this.doDie()
        }

        if (this.dying) {
            const targetRotation = { x: Math.PI / 2, y: this.rotation.y, z: this.rotation.z };
            const animationDuration = 10.0;
        
            // Calculate the normalized time 't' based on elapsed time and animation duration
            let t = Math.min(1, elapsedTime / animationDuration);
        
            // Apply ease-out easing function to 't'
            t = 1 - Math.pow(1 - t, 2); // Square the normalized time to apply ease-out
        
            // Interpolate the rotations with eased 't'
            this.rotation.x = THREE.MathUtils.lerp(this.rotation.x, targetRotation.x, t);
            this.rotation.y = THREE.MathUtils.lerp(this.rotation.y, targetRotation.y, t);
            this.rotation.z = THREE.MathUtils.lerp(this.rotation.z, targetRotation.z, t);
        
            // Increment elapsed time by the fixed delta time
            elapsedTime += deltaTime;

            // if(t >= 1) {
            //     world.splice(world.indexOf(model), 1)
            //     scene.remove(model)
            // }
        }
}
}