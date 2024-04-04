import * as THREE from 'three';
import { randomBetween, randomFrom } from './Utils';

const textureLoader = new THREE.TextureLoader()

class MuzzleFlash {
    public mesh: THREE.Mesh;
    private duration: number; // Duration of the muzzle flash in milliseconds

    constructor(scene: THREE.Scene) {

        const texture = textureLoader.load('muz.png');
        
        //texture.repeat = new THREE.Vector2(2,2)
        // Create geometry and material for the muzzle flash
        const geometry = new THREE.PlaneGeometry(1, 1); // Adjust size as needed
        const material = new THREE.MeshStandardMaterial({ map: texture, transparent: true, emissive: 0xff9100 });

        // Create mesh for the muzzle flash
        this.mesh = new THREE.Mesh(geometry, material);
        scene.add(this.mesh);

        // Duration of the muzzle flash in milliseconds
        this.duration = 25; // Example duration, adjust as needed
    }

    show(gunPosition: THREE.Vector3, gunRotation: THREE.Quaternion, distance: number) {
      
        this.mesh.position.copy(gunPosition);
        this.mesh.quaternion.copy(gunRotation)
        
        this.mesh.rotation.z = randomBetween(-Math.PI / 4, Math.PI / 4)
        this.mesh.scale.set(randomBetween(0.8, 1), randomBetween(0.8, 1), randomBetween(0.8, 1))
        this.mesh.visible = true
    
        // Schedule hiding the muzzle flash after the duration
        setTimeout(() => {
            this.hide();
        }, this.duration);
    }

    hide() {
        // Hide the muzzle flash
        this.mesh.visible = false
    }
}

export default MuzzleFlash;
