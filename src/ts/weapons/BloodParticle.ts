import * as THREE from 'three'
import EntityManager from '../EntityManager'
import { randomBetween, randomFrom } from '../Utils'

const textureLoader = new THREE.TextureLoader()
const bloodTexture1 = textureLoader.load('blood.png')
const bloodTexture2 = textureLoader.load('blood2.png')

const bloodTextures = [
    bloodTexture1,
    bloodTexture2
]

export default class BloodParticle extends THREE.Object3D {

    private particles: any[] = []

    private particleCount: number = 3

    private camera: THREE.Camera

    private scene: THREE.Scene

    private maxLife: number = 1;

    constructor(scene: THREE.Scene, camera: THREE.Camera, position: THREE.Vector3) {
        super()
        this.camera = camera
        this.scene = scene
        this.position.copy(position)
        this.scene.add(this)
        this.init()

        this.userData.ignoreRayHit = true
    }

    init() {
        EntityManager.getInstance().add(this);

        for (let i = 0; i < this.particleCount; i++) {


            let geom = new THREE.PlaneGeometry(1, 1)
            let mat = new THREE.MeshBasicMaterial({ map: randomFrom(bloodTextures), transparent: true, color: 0xff0000 })
            let particle = new THREE.Mesh(geom, mat)

            // ignore ray cols
            particle.userData.ignoreRayHit = true

            particle.position.set(
                randomBetween(-0.2, 0.2),
                randomBetween(-0.2, 0.2),
                randomBetween(-0.2, 0.2)
            )

            // particle.rotation.set(
            //     0,//randomBetween(0, Math.PI * 2),
            //     0,
            //     randomBetween(0, Math.PI * 2)//randomBetween(0, Math.PI * 2)
            // )

            particle.material.opacity = randomBetween(0.5, 1)

            particle.scale.set(
                randomBetween(0.6, 1.2),
                randomBetween(0.6, 1.2),
                randomBetween(0.6, 1.2)
            )

            particle.lookAt(this.camera.position)

            this.add(particle)
            this.particles.push(particle)

            setTimeout(() => {
                EntityManager.getInstance().remove(this)
                this.scene.remove(this)
            }, this.maxLife * 1000)
        }

        
    }

    update(elapsedTime: number, deltaTime: number) {

        for (let i = 0; i < this.particles.length; i++) {
            this.particles[i].material.opacity -= 0.01

            var direction = new THREE.Vector3();
            this.camera.getWorldPosition(direction);

            this.particles[i].lookAt(direction);
        }
        
    }
}