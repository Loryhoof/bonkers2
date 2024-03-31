import * as THREE from "three"
import Connector from "./Connector"
import ConnectorPosition from "../enums/ConnectorPosition"
import SelectedBuildType from "../enums/SelectedBuildType"

const LEFT = new THREE.Vector3(-1.5, 0, 0)
const RIGHT = new THREE.Vector3(1.5, 0, 0)
const TOP = new THREE.Vector3(0, 0, 1.5)
const BOTTOM = new THREE.Vector3(0, 0, -1.5)

let positions = [
    LEFT,
    RIGHT,
    TOP,
    BOTTOM
]


export default class Wall extends THREE.Object3D {

    private connectors: Array<Connector> = new Array().fill(4)
    private floorObject: THREE.Object3D = new THREE.Object3D

    constructor() {
        super()

        this.connectors[0] = new Connector(ConnectorPosition.top, SelectedBuildType.floor)
        this.connectors[1] = new Connector(ConnectorPosition.bottom, SelectedBuildType.floor)
        this.connectors[2] = new Connector(ConnectorPosition.left, SelectedBuildType.floor)
        this.connectors[3] = new Connector(ConnectorPosition.right, SelectedBuildType.floor)

        //console.log(this.connectors)
        this.init()
    }

    init() {

        const geometry = new THREE.BoxGeometry(3, 1, 3);
        const material = new THREE.MeshStandardMaterial({ color: 0x000000, transparent: true, opacity: 0.4 });
        
        const model = new THREE.Mesh(geometry, material);

        this.add(model)

        this.connectors.forEach((connector, index) => {
            let pos = new THREE.Vector3()
            let radius = 0.2

            const geometry = new THREE.SphereGeometry( .4, 32, 16 ); 
            const material = new THREE.MeshBasicMaterial( { color: 0xffff00 } ); 
            const sphere = new THREE.Mesh( geometry, material );

            let offset = new THREE.Vector3(1.5, 0, 0)
            sphere.position.copy(this.position).add(positions[index])
            
            model.add(sphere)
        })
    }
}