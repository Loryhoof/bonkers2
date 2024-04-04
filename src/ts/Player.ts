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
import { FBXLoader } from 'three/examples/jsm/Addons.js'
import Recoil from './Recoil'
import CustomCameraControls from './CustomCameraControls'

const ui = UIManager.getInstance()

export default class Player extends THREE.Object3D {

    private model: THREE.Mesh | null

    public camera: THREE.Camera

    private health: number
    private hunger: number

    public readonly inventory: PlayerInventory
    public selectedItem: UsableItem | null
    public selectedSlot: number

    public readonly hotBar: Array<any>

    public readonly controller: CharacterController

    private scene: THREE.Scene

    private playerModel: any

    public cameraParent: THREE.Object3D = new THREE.Object3D

    public recoilParent: Recoil

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

        this.recoilParent = new Recoil(this.camera)
        
        this.controller = new CharacterController(this, camera, scene)

        this.scene = scene

        this.init()
    }

    private init() {

        this.cameraParent = new THREE.Object3D
        this.cameraParent.add(this.recoilParent)
        this.recoilParent.add(this.camera)
        this.scene.add(this.cameraParent)

        //console.log(this.cameraParent, "camera parentttttttt")
        //console.log(this.camera)


        
        // const fbxLoader = new FBXLoader();
        // fbxLoader.load('chars/zombie_running.fbx', (model: any) => {
        //     model.scale.set(0.007, 0.007, 0.007)
        //     model.position.y -= 1.3

        //     //model.scale.set(0.01, 0.01, 0.01)
        //     this.add(model)
        //     this.playerModel = model;
        // })

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

        this.traverse((child) => {
            child.userData.class = this
        })
    }

    damage(dmg: number) {
        this.health -= dmg
    }

    update(elapsedTime: number, deltaTime: number) {

        // if(this.controls) {
        //     this.controls.update()
        // }
        //this.cameraParent.position.copy(this.controller.dummyCamera.position)
        this.cameraParent.quaternion.copy(this.controller.dummyCamera.quaternion)

        this.controller.update(elapsedTime, deltaTime)

        //this.recoilParent.rotateX(Math.PI / 1000)
        this.recoilParent.update(elapsedTime, deltaTime)

        if(this.playerModel) {
            //this.playerModel.lookAt(this)
        }
        
        if(this.selectedItem) {
            this.selectedItem.update(elapsedTime, deltaTime)
        }

        if(this.health <= 0) {
            this.health = 100
            this.controller.respawn()
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