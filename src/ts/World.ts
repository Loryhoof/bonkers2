import * as THREE from 'three'
import PhysicsManager from './PhysicsManager'
import { sky } from './Sky'
import { groundMaterial } from './Ground'
import { PointerLockControls } from 'three/examples/jsm/Addons.js'
import Player from './Player'
import Pistol from './Pistol'

export default class World {

    public readonly camera: THREE.PerspectiveCamera
    public readonly physics: PhysicsManager
    public readonly scene: THREE.Scene
    public readonly entities: Array<any>

    constructor(camera: THREE.PerspectiveCamera, scene: THREE.Scene) {
        this.camera = camera
        this.scene = scene
        this.physics = PhysicsManager.getInstance()
        this.entities = []
    }

    async initialize() {

        const geometry = new THREE.BoxGeometry(10, 10)
        const material = new THREE.MeshStandardMaterial({color: 0xff0000})

        let cube = new THREE.Mesh(geometry, material)
        cube.position.z = -15
        cube.position.y = -1

        const light = new THREE.DirectionalLight(0xffffff, 5)
        light.position.set(0, 4, 2)

        const ambientLight = new THREE.AmbientLight(0xffffff, 5)

        this.scene.add(ambientLight)
        this.scene.add(light)
        this.scene.add(cube)

        this.scene.add(sky)

        const planeGeo = new THREE.PlaneGeometry(1000, 1000)

        const ground = new THREE.Mesh(planeGeo, groundMaterial)
        ground.rotation.x -= Math.PI/2;
        ground.position.y = -5

        this.scene.add(ground)

        let player = new Player(this.camera)
        this.entities.push(player)
        this.scene.add(player)

        console.log(player)
        console.log(this.physics)
        
        let gun = new Pistol(15, this.camera, this.scene)
    }

    update(elapsedTime: number, deltaTime: number) {
        //console.log(deltaTime)
        //console.log(this.camera.position)
        this.physics.update(elapsedTime, deltaTime)

        this.entities.forEach((entity) => {
            entity.update(elapsedTime, deltaTime)
        })

        
    }
}