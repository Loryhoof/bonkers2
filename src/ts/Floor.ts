import * as THREE from "three"
import Connector from "./Connector"
import ConnectorPosition from "../enums/ConnectorPosition"
import SelectedBuildType from "../enums/SelectedBuildType"
import { BUILDING_LAYER } from "./constants"
import PhysicsManager from "./PhysicsManager"
import PhysicsObject from "../interfaces/PhysicsObject"
import { loadGLB } from "./Utils"
import SoundType from "../enums/SoundType"
import Placeable from "../interfaces/Placeable"
import EntityManager from "./EntityManager"

const LEFT = new THREE.Vector3(-1.5, 0, 0)
const RIGHT = new THREE.Vector3(1.5, 0, 0)
const TOP = new THREE.Vector3(0, 0, 1.5)
const BOTTOM = new THREE.Vector3(0, 0, -1.5)

const scale = new THREE.Vector3(3, 0.5, 3)

let positions = [
    LEFT,
    RIGHT,
    TOP,
    BOTTOM
]


export default class Floor extends THREE.Object3D implements Placeable {

    public connectors: Array<Connector> = new Array().fill(4)
    private floorObject: THREE.Object3D = new THREE.Object3D
    private physicsObject: PhysicsObject | any = null
    public height: number = scale.y / 2
    public buildType: SelectedBuildType = SelectedBuildType.floor

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
      

        this.init()
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
        this.physicsObject = PhysicsManager.getInstance().createFixedBox(this.position, new THREE.Vector3(scale.x / 2, scale.y / 2, scale.z / 2))
    }

    init() {

        //let mod = await loadGLB('models/floor.glb') as any

        const textureLoader = new THREE.TextureLoader();

        const groundTexture1 = textureLoader.load('wood2.jpg');
        groundTexture1.wrapS = THREE.RepeatWrapping; // Repeat the texture in S direction
        groundTexture1.wrapT = THREE.RepeatWrapping; // Repeat the texture in T direction
        groundTexture1.repeat = new THREE.Vector2(2,2)

        const geometry = new THREE.BoxGeometry(scale.x, scale.y, scale.z);
        const material = new THREE.MeshStandardMaterial({ color: 0x8c8c8c,transparent: true, opacity: 1, map: groundTexture1 });
        
        let model = new THREE.Mesh(geometry, material);

        //model = mod.scene.clone()
        //console.log(model)

        this.add(model)

        this.connectors.forEach((connector, index) => {
            let pos = new THREE.Vector3()
            let radius = 0.2

            const geometry = new THREE.SphereGeometry( .4, 32, 16 ); 
            const material = new THREE.MeshBasicMaterial( { color: 0xffff00 } ); 
            const sphere = new THREE.Mesh( geometry, material );

            //let offset = new THREE.Vector3(1.5, 0, 0)
            sphere.position.copy(this.position).add(positions[index])

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
        })

        this.traverse((child) => {
            child.userData.class = this
        })

        this.userData.soundType = SoundType.wood
    }

    update() {

        if(!this.physicsObject) {
            return
        }  

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