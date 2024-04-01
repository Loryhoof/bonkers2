import * as THREE from 'three'
import SelectedBuildType from "../enums/SelectedBuildType";
import Floor from "./Floor";
import Wall from './Wall';
import Connector from './Connector';
import PhysicsManager from './PhysicsManager';
import RAPIER from '@dimforge/rapier3d';
import ConnectorPosition from '../enums/ConnectorPosition';
import { BUILDING_LAYER } from './constants';
import { getWorldPos } from './Utils';

const raycaster = new THREE.Raycaster()

const shape = new RAPIER.Cuboid(1.0, 2.0, 3.0);
const shapePos = new RAPIER.Vector3(0, 0, 0)
const shapeRot = { w: 1.0, x: 0.0, y: 0.0, z: 0.0 };

const previewMaterialValid = new THREE.MeshBasicMaterial({color: 0x00ff00, transparent: true, opacity: 0.5})
const previewMaterialInvalid = new THREE.MeshBasicMaterial({color: 0xff0000, transparent: true, opacity: 0.5})

export default class BuildingManager {

    private floorObjects: Array<Floor> = []
    private wallObjects: Array<Wall> = []

    private currentBuildType: SelectedBuildType = SelectedBuildType.floor

    private connectorOverlapRadius: number = 1
    private maxGroundAngle: number = 45

    private maxRayDistance: number = 10

    private isBuilding: boolean = true
    private currentBuildingIndex: number = -1

    private previewBuildObject: THREE.Group | any = null

    private isPreviewInValidPosition: boolean = false
    private modelParent: THREE.Group = new THREE.Group

    private camera: THREE.Camera
    private scene: THREE.Scene

    constructor(
        camera: THREE.Camera,
        scene: THREE.Scene
    ) {
        this.camera = camera
        this.scene = scene
   
    }

    update() {

        if(this.isBuilding) {
            this.previewBuild()
        }
    }

    public shuffleBuildType() {
        if(this.currentBuildType == SelectedBuildType.floor ) {
            this.setBuildType(SelectedBuildType.wall)
        }
        else if(this.currentBuildType == SelectedBuildType.wall) {
            this.setBuildType(SelectedBuildType.floor)
        }
    }

    public setBuildType(type: SelectedBuildType) {
        if(this.previewBuildObject) {
            this.scene.remove(this.previewBuildObject)
            this.previewBuildObject = null
        }

        this.currentBuildType = type
    }

    public setActive(bool: boolean) {
        this.isBuilding = bool
        this.updateVis(bool)
    }

    private updateVis(bool: boolean) {
        if(this.previewBuildObject)
            this.previewBuildObject.visible = bool
    }

    build() {
        this.placeBuild()
    }

    private ghostifyModel(modelParent: THREE.Mesh, previewMaterial: THREE.Material) {
        if(previewMaterial != null && modelParent.material != previewMaterial) {
            modelParent.material = previewMaterial
        }
        else {
            // disable colliders
        }
    }

    private getConnectorClosestToPlayer(topBottom: boolean) {
        const cameraPosition = this.camera.position

        if(topBottom) {
            return cameraPosition.z >= this.previewBuildObject.position.z ? ConnectorPosition.bottom : ConnectorPosition.top
        }
        else {
            return cameraPosition.x >= this.previewBuildObject.position.x ? ConnectorPosition.left : ConnectorPosition.right
        }

    }

    private getOppositePosition(connector: Connector) {
        let position = connector.connectorPosition

        if(this.currentBuildType == SelectedBuildType.wall && connector.connectorParentType == SelectedBuildType.floor) {
            return ConnectorPosition.bottom
        }

        if(this.currentBuildType == SelectedBuildType.floor && connector.connectorParentType == SelectedBuildType.wall && connector.connectorPosition == ConnectorPosition.top) {
            if(connector.rotation.y == 0) {
                return this.getConnectorClosestToPlayer(true)
            }
            else {
                return this.getConnectorClosestToPlayer(false)
            }
        }

        switch(position) {
            case ConnectorPosition.left:
                return ConnectorPosition.right
            case ConnectorPosition.right:
                return ConnectorPosition.left
            case ConnectorPosition.top:
                return ConnectorPosition.bottom
            case ConnectorPosition.bottom:
                return ConnectorPosition.top
            default:
                return ConnectorPosition.bottom
        }
    }

    private findSnapConnector(snapConnector: Connector, previewConnectorParent: any) {
        // placeholder
        const oppositeConnectorTag = this.getOppositePosition(snapConnector)
        //console.log(oppositeConnectorTag)


        //console.log(previewConnectorParent)

        //return previewConnectorParent.connectors[0]
        //console.log(previewConnectorParent.connectors)

        for (let i = 0; i < previewConnectorParent.connectors.length; i++) {
            if(previewConnectorParent.connectors && previewConnectorParent.connectors[i]) {
                //console.log(previewConnectorParent)
                //console.log("found connecotr")
                if(previewConnectorParent.connectors[i].connectorPosition == oppositeConnectorTag) {
                    return previewConnectorParent.connectors[i]
                }
            }
        }

        return null
    }

    private snapPreviewPrefabToConnector(connector: Connector) {
        const previewConnector = this.findSnapConnector(connector, this.previewBuildObject)

        let prev = new THREE.Vector3();
        previewConnector.getWorldPosition(prev)

        let con = new THREE.Vector3()
        connector.getWorldPosition(con)
       
        let off = prev.clone().sub(this.previewBuildObject.position.clone())
        this.previewBuildObject.position.copy(con.clone().sub(off))


        if (this.currentBuildType == SelectedBuildType.wall) {
            const newRotation = this.previewBuildObject.rotation.clone();
            newRotation.set(
                newRotation.x,
                connector.rotation.y,
                newRotation.z,
                newRotation.w
            );
            this.previewBuildObject.rotation.copy(newRotation);

        }

        //console.log(this.previewBuildObject)
        this.ghostifyModel(this.previewBuildObject.children[4], previewMaterialValid)
    }

    private previewSeparateBuild() {
        raycaster.setFromCamera(new THREE.Vector2(), this.camera);

        //const objectsToIntersect = this.scene.children.filter(object => object !== this.previewBuildObject);
        const intersects = raycaster.intersectObjects(this.scene.children, true);

        if(intersects[0] && intersects[0].distance < this.maxRayDistance) {

            if(this.currentBuildType == SelectedBuildType.wall) {
                //this.isPreviewInValidPosition = false
                return
            }
            else {
                // may be not valid thing to add
                this.isPreviewInValidPosition = true
                return
            }

            
        }

    }

    private previewConnectBuild(colliders: Array<any>) {

        let bestConnector = null

        //console.log(colliders)

        for(let i = 0; i < colliders.length; i++) {
            if(colliders[i].userData.connector) {
                if(colliders[i].userData.connector.canConnectTo) {
                    bestConnector = colliders[i].userData.connector
                    break
                }
            }
        }

        //console.log(bestConnector, "THE BEST")

        if(bestConnector == null || this.currentBuildType == SelectedBuildType.floor && bestConnector.isConnectedToFloor || 
           bestConnector == null || this.currentBuildType == SelectedBuildType.wall && bestConnector.isConnectedToWall) {
            this.ghostifyModel(this.previewBuildObject.children[4], previewMaterialInvalid)
            this.isPreviewInValidPosition = false
            console.log("Bad")
            return
           }

        //console.log(bestConnector.position)
        //console.log(bestConnector)
        this.snapPreviewPrefabToConnector(bestConnector)
    }

    private checkBuildValidity() {

        //let s = PhysicsManager.getInstance().intersectShape(this.previewBuildObject.position, shapeRot, shape, undefined)

        let spPos = this.previewBuildObject.position.clone()
        spPos.y -= this.previewBuildObject.height
        
        const sphere = new THREE.Sphere(spPos, 0.6)
        //sphere.intersectsSphere()

        let intersectedObjects = [] as any

        // Loop through all objects in the scene
        this.scene.traverse((object: any) => {
            // Check if the object has a geometry and bounding sphere
            if (object.geometry && object.geometry.boundingSphere && object.userData.layer == BUILDING_LAYER ) {
                // Get the object's bounding sphere
                var objectSphere = object.geometry.boundingSphere.clone();
                objectSphere.applyMatrix4(object.matrixWorld);

                // Check if the object's bounding sphere intersects with the given sphere
                if (sphere.intersectsSphere(objectSphere)) {
                    intersectedObjects.push(object);
                }
            }
        });

        intersectedObjects = intersectedObjects.filter((obj: any) => obj.userData.class != this.previewBuildObject)
        

        if(intersectedObjects.length > 0) {
            this.previewConnectBuild(intersectedObjects)
        } else {
            this.ghostifyModel(this.previewBuildObject.children[4], previewMaterialInvalid)
            this.previewSeparateBuild()
        }

    }

    private movePreviewBuildToRaycast() {
        raycaster.setFromCamera(new THREE.Vector2(), this.camera);

        const objectsToIntersect = this.scene.children.filter(object => object !== this.previewBuildObject);
        const intersects = raycaster.intersectObjects(objectsToIntersect, true);

        //console.log(intersects)

        if(intersects[0] && intersects[0].distance < this.maxRayDistance) {


            //onsole.log(intersects[0].object)

            this.previewBuildObject.visible = true

            const point = intersects[0].point;

            let obj = this.previewBuildObject
            obj.position.copy(point);
            obj.position.y = point.y + this.previewBuildObject.height

            //this.objectPreview.visible = true
        }
        else {
            this.previewBuildObject.visible = false
        }
    }

    private createPreviewPrefab(currentBuild: null) {

        if(this.previewBuildObject == null) {
            //this.previewBuildObject = currentBuild.clone()
            ///this.currentBuildType = SelectedBuildType.floor
            if(this.currentBuildType == SelectedBuildType.floor) {
                this.previewBuildObject = new Floor(this.scene)
            }

            if(this.currentBuildType == SelectedBuildType.wall) {
                this.previewBuildObject = new Wall(this.scene)
            }

            this.scene.add(this.previewBuildObject)
        }

    }

    private getCurrentBuild() {
        if(this.currentBuildType) {
            return this.currentBuildType
        }
        // switch(this.currentBuildType) {
        //     case SelectedBuildType.floor:
        //         return this.previewBuildObject//new Floor(this.scene)//this.floorObjects[this.currentBuildingIndex]
        //     // case SelectedBuildType.wall:
        //     //     return this.wallObjects[this.currentBuildingIndex]
        // }

        return null
    }

    private previewBuild() {
        //const currentBuild = this.getCurrentBuild() as any
       // let currentBuild = null
        this.createPreviewPrefab(null)

        this.movePreviewBuildToRaycast()
        this.checkBuildValidity()
    }

    private placeBuild() {
        //console.log(this.previewBuildObject, this.isPreviewInValidPosition)

        console.log(this.currentBuildType, "isvalid:", this.isPreviewInValidPosition)
        if(this.isBuilding && this.previewBuildObject && this.isPreviewInValidPosition) {
            //let obj = this.getCurrentBuild() as any

            let obj = this.previewBuildObject

            //console.log(this.currentBuildType)

            if(this.currentBuildType == SelectedBuildType.floor) {
                obj = new Floor(this.scene)
            }

            if(this.currentBuildType == SelectedBuildType.wall) {
                obj = new Wall(this.scene)
            }
            //let obj = this.previewBuildObject
            //console.log(obj)
            this.scene.add(obj)
            obj.position.copy(this.previewBuildObject.position)
            obj.quaternion.copy(this.previewBuildObject.quaternion)

            //this.scene.remove(this.previewBuildObject)
            //this.previewBuildObject = null

            //this.isBuilding = false

            //console.log

            obj.connectors.forEach((connector: Connector) => {
                connector.updateConnectors(true)
            })

            obj.cook()
        }
    }
}