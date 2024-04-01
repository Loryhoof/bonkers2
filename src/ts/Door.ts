import * as THREE from "three"
import Connector from "./Connector"
import ConnectorPosition from "../enums/ConnectorPosition"
import SelectedBuildType from "../enums/SelectedBuildType"
import { BUILDING_LAYER } from "./constants"
import PhysicsManager from "./PhysicsManager"
import PhysicsObject from "../interfaces/PhysicsObject"
import { loadGLB } from "./Utils"
import { GLTFLoader } from "three/examples/jsm/Addons.js"
import Interactable from "../interfaces/Interactable"
import ItemType from "../enums/ItemType"
import SoundType from "../enums/SoundType"
import { door_close_sound, door_open_sound } from "./AudioManager"
import EntityManager from "./EntityManager"

let TOP = new THREE.Vector3(0, 0, -1.5)
let BOTTOM = new THREE.Vector3(0, 0, 1.5)
let LEFT = new THREE.Vector3(0, 1.75, 0)
let RIGHT = new THREE.Vector3(0, -1.75, 0)

const scale = new THREE.Vector3(0.5, 3.5, 3)
const animationDuration = 1

const openRotation = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI / 2); // Rotate 90 degrees around Y-axis
const closedRotation = new THREE.Quaternion();

let positions = [
    LEFT,
    RIGHT,
    TOP,
    BOTTOM
]

export default class Door extends THREE.Object3D implements Interactable {

    public connectors: Array<Connector> = new Array().fill(4)
    private floorObject: THREE.Object3D = new THREE.Object3D
    private physicsObject: PhysicsObject | null = null
    public height: number = scale.y / 2

    private loader: GLTFLoader = new GLTFLoader()
    private door: any = null
    private doorway: any = null
    private item_type: ItemType = ItemType.INTERACTABLE
    private doorOpen: boolean = false
    public buildType: SelectedBuildType = SelectedBuildType.wall
    private isAnimating: boolean = false
    private startAnimate: boolean = false
    private animationStartTime: number = -1

    public health: number = 500
    public maxHealth: number = 500

    private target: THREE.Quaternion = new THREE.Quaternion()

    private scene: THREE.Scene

    constructor(scene: THREE.Scene) {
        super()

        this.scene = scene

        this.connectors[0] = new Connector(scene, ConnectorPosition.top, this.buildType)
        this.connectors[1] = new Connector(scene, ConnectorPosition.bottom, this.buildType)
        this.connectors[2] = new Connector(scene, ConnectorPosition.left, this.buildType)
        this.connectors[3] = new Connector(scene, ConnectorPosition.right, this.buildType)

        this.add(this.connectors[0], this.connectors[1], this.connectors[2], this.connectors[3])

        //console.log(this.connectors)

        this.loader.load(
            // resource URL
            'models/door.glb',
            // called when the resource is loaded
            ( gltf ) => {

                let model = gltf.scene.clone()

                
        
                //scene.add( gltf.scene );
        
                //gltf.animations; // Array<THREE.AnimationClip>
                //gltf.scene; // THREE.Group
                //gltf.scenes; // Array<THREE.Group>
                //gltf.cameras; // Array<THREE.Camera>
                //gltf.asset; // Object

                this.add(model)

                this.traverse((child) => {
                    child.userData.class = this
                })

                //gltf.scene.userData.class = this

                this.userData.interactInfo = "Open"
                this.userData.soundType = SoundType.wood

                //console.log(gltf.scene, "SCENE")

                this.connectors.forEach((connector, index) => {
                    let pos = new THREE.Vector3()
                    let radius = 0.2
        
                    const geometry = new THREE.SphereGeometry( .4, 32, 16 ); 
                    const material = new THREE.MeshBasicMaterial( { color: 0xffff00 } ); 
                    const sphere = new THREE.Mesh( geometry, material );
        
                    //let offset = new THREE.Vector3(1.5, 0, 0)
                    //this.position.set(0,0,0)
                    sphere.position.copy(new THREE.Vector3(0,0,0)).add(positions[index])
                    //console.log(this.position)
        
                    const worldPosition = sphere.position.clone().applyMatrix4(model.matrixWorld);
                    connector.position.copy(worldPosition)
        
                    sphere.userData.layer = BUILDING_LAYER;
                    sphere.userData.connector = connector
                    sphere.userData.class = this
                    sphere.visible = false
                    
                    model.add(sphere)
                    connector.userData.sphere = sphere
                    this.floorObject = model
                    this.floorObject.userData.class = this

                    this.door = model.getObjectByName('door')
                    this.doorway = model.getObjectByName('doorway')
                    //console.log(this.door, this.doorway, "doorss")
                })

                //this.init()
                this.init()
            },
            // called while loading is progressing
            function ( xhr ) {
        
                console.log( ( xhr.loaded / xhr.total * 100 ) + '% loaded' );
        
            },
            // called when loading has errors
            function ( error ) {
        
                console.log( 'An error happened' );
        
            }
        );

      
    }

    damage(dmg: number) {
        this.health -= dmg

        console.log(this.health)

        if(this.health <= 0) {
            PhysicsManager.getInstance().remove(this.physicsObject as any)
            EntityManager.getInstance().remove(this)
            this.scene.remove(this) 
        }
    }

    cook() {
        this.physicsObject = PhysicsManager.getInstance().createFixedBox(this.position, new THREE.Vector3(scale.x / 2, scale.y / 2, scale.z / 2), this.quaternion)
    }

    init() {

    }

    open() {
        if(this.isAnimating) {
            return
        }

        if(this.physicsObject) {
            this.physicsObject.collider.setEnabled(false)
        }

        //this.target.position.copy(this.door.position)
        //this.target.quaternion.copy(this.door.quaternion)

        //this.target.rotateY(Math.PI / 2)
        this.target = closedRotation

        this.isAnimating = true

        setTimeout(() => {
            this.isAnimating = false
        }, animationDuration * 1000)

        if(door_open_sound.isPlaying) {
            door_open_sound.stop()
        }

        door_open_sound.play()

        this.doorOpen = true
        this.userData.interactInfo = "Close"
    }

    close() {
        if(this.isAnimating) {
            return
        }

        if(this.physicsObject) {
            this.physicsObject.collider.setEnabled(true)
        }

        this.target = openRotation

        this.isAnimating = true

        setTimeout(() => {
            this.isAnimating = false
        },  animationDuration * 1000)

        if(door_close_sound.isPlaying) {
            door_close_sound.stop()
        }
        
        door_close_sound.play()

        this.doorOpen = false
        this.userData.interactInfo = "Open"
    }
    

    interact() {
        if(!this.door) {
            return
        }

        if(this.doorOpen) {
            this.close()
        }
        else {
            this.open()
        }

        //if(this.doorOpen)
        //this.door.rotateY(Math.PI / 2)

        //console.log("interacting", this.doorOpen)
    }

    update(elapsedTime: number, deltaTime: number) {

        if(!this.physicsObject) {
            return
        }  

        if (this.isAnimating) {
            const t = Math.min(deltaTime / 0.25, 1);
        
            this.door.quaternion.slerp(this.target, t);
        
            this.door.updateMatrixWorld();
            this.updateMatrixWorld();
        }
    }
}