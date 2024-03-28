import * as THREE from 'three'
import { groundLevel, movementSpeed, sprintFactor } from './constants'
import { PointerLockControls } from 'three/examples/jsm/Addons.js'
import PhysicsObject from '../interfaces/PhysicsObject'
import PhysicsManager from './PhysicsManager'
import CharacterController from './CharacterController'

export default class Player extends THREE.Object3D {

    private model: THREE.Mesh | null

    private camera: THREE.Camera

    private health: number
    private hunger: number

    private inventory: Object
    private selectedItem: any
    private selectedSlot: number

    private controller: CharacterController

    constructor(camera: THREE.Camera) {
        super()
        this.model = null
        this.camera = camera
        this.health = 100
        this.hunger = 100

        this.inventory = {}
        this.selectedItem = null
        this.selectedSlot = -1
        
        this.controller = new CharacterController(this, camera)

        this.init()
    }

    private init() {
        const geometry = new THREE.CylinderGeometry(0.5, 0.5, 1.8, 32);
        const material = new THREE.MeshStandardMaterial({color: 0x00ff00});

        

        // this.physicsObject = {
            
        // }

        this.model = new THREE.Mesh(geometry, material)
        this.model.position.set(0, groundLevel, 0)
    }

    update(elapsedTime: number, deltaTime: number) {
        this.controller.update(elapsedTime, deltaTime)
        //this.position.copy(this.camera.position)
        //this.camera.position.copy(this.position)
        //this.rotation.copy(this.camera.rotation)
    }
}