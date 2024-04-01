import * as THREE from 'three'
import { groundLevel, movementSpeed, sprintFactor } from './constants'
import PhysicsObject from '../interfaces/PhysicsObject'
import PhysicsManager from './PhysicsManager'
import CharacterController from './CharacterController'
import UIManager from './UIManager'
import Pistol from './Pistol'
import PlayerInventory from './PlayerInventory'
import UsableItem from '../interfaces/UsableItem'
import Bullet from './Bullet'
import Hatchet from './Hatchet'
import Blueprint from './Blueprint'

const ui = UIManager.getInstance()

export default class Player extends THREE.Object3D {

    private model: THREE.Mesh | null

    private camera: THREE.Camera

    private health: number
    private hunger: number

    public readonly inventory: PlayerInventory
    public selectedItem: UsableItem | null
    public selectedSlot: number

    public readonly hotBar: Array<any>

    public readonly controller: CharacterController

    private scene: THREE.Scene

    constructor(scene: THREE.Scene, camera: THREE.Camera) {
        super()
        this.model = null
        this.camera = camera
        this.health = 100
        this.hunger = 100

        this.hotBar = Array(6).fill(null)
        this.inventory = new PlayerInventory(this.hotBar)

        this.selectedItem = null
        this.selectedSlot = -1
        
        this.controller = new CharacterController(this, camera, scene)

        this.scene = scene

        this.init()
    }

    private init() {
        const geometry = new THREE.CylinderGeometry(0.5, 0.5, 1.8, 32);
        const material = new THREE.MeshStandardMaterial({color: 0x00ff00});

        this.model = new THREE.Mesh(geometry, material)
        this.model.position.set(0, 0, 0)

        const pistol = new Pistol(15, this.camera, this.scene)
        this.inventory.add(pistol)
        this.hotBar[0] = pistol

        const bullet = new Bullet(999)
        this.inventory.add(bullet)
        this.hotBar[1] = bullet

        const hatchet = new Hatchet(this.camera, this.scene)
        this.inventory.add(hatchet)
        this.hotBar[2] = hatchet

        const blueprint = new Blueprint(this.camera, this.scene)
        this.inventory.add(blueprint)
        this.hotBar[3] = blueprint

        ui.initHotBar(this.hotBar)
    }

    update(elapsedTime: number, deltaTime: number) {
        this.controller.update(elapsedTime, deltaTime)
        
        if(this.selectedItem) {
            this.selectedItem.update(elapsedTime, deltaTime)
        }

        this.inventory.update()

        ui.updateHealth(this.health)
        ui.updateHotBar(this.hotBar, this.selectedSlot)
        ui.updatePosition(this.position)
    }

    // updateInventory() {
    //     this.inventory.forEach((item) => {
    //         item.update()
    //     })
    // }
}