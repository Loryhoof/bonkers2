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
import Placeable from "../interfaces/Placeable"
import EntityManager from "./EntityManager"

let TOP = new THREE.Vector3(0, 0, -1.5)
let BOTTOM = new THREE.Vector3(0, 0, 1.5)
let LEFT = new THREE.Vector3(0, 1.75, 0)
let RIGHT = new THREE.Vector3(0, -1.75, 0)

const scale = new THREE.Vector3(0.5, 3.5, 3)

let positions = [
    LEFT,
    RIGHT,
    TOP,
    BOTTOM
]

export default class Window extends THREE.Object3D implements Placeable {

    public connectors: Array<Connector> = new Array().fill(4)
    private floorObject: THREE.Object3D = new THREE.Object3D
    private physicsObject: PhysicsObject | null = null
    public height: number = scale.y / 2

    private loader: GLTFLoader = new GLTFLoader()
    private door: any = null
    private doorway: any = null
    //private item_type: ItemType = ItemType.INTERACTABLE
    private doorOpen: boolean = false
    public buildType: SelectedBuildType = SelectedBuildType.wall

    public health: number = 500
    public maxHealth: number = 500

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
            'models/window.glb',
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

                this.userData.interactInfo = `${this.health} / ${this.maxHealth}`

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

    update() {

        if(!this.physicsObject) {
            return
        }  

        this.userData.interactInfo = `${this.health} / ${this.maxHealth}`

        //console.log(this.position)

        //this.physicsObject.rigidBody.setTranslation(new THREE.Vector3().copy(this.position), true)

        //console.log(this.floorObject, "floor obj")

        //this.floorObject.userData.class

        // for(let i = 0; i < this.connectors.length; i++) {
        //     //const worldPosition = this.connectors[i].userData.sphere.position.clone().applyMatrix4(this.floorObject.matrixWorld);
        //     //connector.position.copy(worldPosition)
        //     //this.connectors[i].position.copy(worldPosition)
        // }

    }
}