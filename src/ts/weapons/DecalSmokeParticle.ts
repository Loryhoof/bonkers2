import * as THREE from 'three'
import EntityManager from '../EntityManager'
import { randomBetween, randomFrom } from '../Utils'

const textureLoader = new THREE.TextureLoader()
const smokeTexture = textureLoader.load('smoke.png')

const textures = [
    smokeTexture
]

export default class DecalSmokeParticle extends THREE.Object3D {

    private particles: any[] = []

    private particleCount: number = 3

    private camera: THREE.Camera

    private scene: THREE.Scene

    private maxLife: number = 2;

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
            let mat = new THREE.MeshBasicMaterial({ map: randomFrom(textures), transparent: true })
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

            particle.material.opacity = randomBetween(0.1, 0.3)

            particle.scale.set(
                randomBetween(0.6, 1.6),
                randomBetween(0.6, 1.6),
                randomBetween(0.6, 1.6)
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
            this.particles[i].material.opacity -= 0.0025

            var direction = new THREE.Vector3();
            this.camera.getWorldPosition(direction);

            this.particles[i].lookAt(direction);
        }
        
    }
}