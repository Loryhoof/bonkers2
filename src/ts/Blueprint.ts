import * as THREE from 'three'
import ItemType from '../enums/ItemType'
import { randomFrom } from './Utils'
import Player from './Player'
import { bullet_impact_sound } from './AudioManager'
import PhysicsManager from './PhysicsManager'
import Floor from './Floor'
import BuildingManager from './BuildingManager'

let raycaster = new THREE.Raycaster()

let maxPlaceDistance = 10

let size = new THREE.Vector3(1,5, 5)

export default class Blueprint {

    public readonly name: string
    public readonly quantity: number
    public readonly item_type: ItemType
    public model: THREE.Mesh | any
    public readonly image: string

    private readonly camera: THREE.Camera
    private readonly scene: THREE.Scene

    private owner: Player | any
    private isActive: boolean

    private objectToPlace: THREE.Object3D | any
    private objectPreview: THREE.Object3D | any

    private builder: BuildingManager

    constructor(
        camera: THREE.Camera,
        scene: THREE.Scene
    ) {
        this.name = "Blueprint"
        this.quantity = 1
        this.item_type = ItemType.BUILDING
        this.model = null
        this.image = 'items/blueprint.jpg'
        this.camera = camera
        this.scene = scene
        this.owner = null
        this.isActive = false
        this.objectToPlace = null
        this.objectPreview = null
        this.builder = new BuildingManager(camera, scene)

        this.init()
    }

    use() {
        this.builder.build()
        // raycaster.setFromCamera(new THREE.Vector2(), this.camera);

        // const objectsToIntersect = this.scene.children.filter(object => object !== this.objectPreview);

        // const intersects = raycaster.intersectObjects(objectsToIntersect, true);

        // if(intersects[0] && intersects[0].distance < maxPlaceDistance) {
            
        //     const point = intersects[0].point;

        //     let floor = new Floor()
        //     this.scene.add(floor)
        //     floor.position.copy(point)
        //     floor.position.y = point.y + 0.5

        //     // let obj = this.objectToPlace.clone()
        //     // obj.position.copy(point);
        //     // obj.position.y = point.y + size.y / 2

        //     // PhysicsManager.getInstance().createFixedBox(obj.position, new THREE.Vector3(size.x / 2, size.y / 2, size.z / 2))

        //     // this.scene.add(obj)

        //     let audio = bullet_impact_sound

        //     if(audio.isPlaying) {
        //         audio.stop()
        //     }

        //     audio.play()
        // }
    }

    async init() {

        const geometry = new THREE.BoxGeometry(size.x, size.y, size.z);
        const material = new THREE.MeshStandardMaterial({ color: 0x000000 });
        const previewMaterial = new THREE.MeshStandardMaterial({ color: 0x00ff00, transparent: true, opacity: 0.5 });
        
        this.objectPreview = new THREE.Mesh(geometry, previewMaterial);
        this.objectToPlace = new THREE.Mesh(geometry, material);

        this.scene.add(this.objectPreview)
        this.objectPreview.visible = false
        
    }

    setActive(bool: boolean, owner: Player) {
        //this.model.visible = bool
        this.owner = owner
        this.isActive = bool
        this.objectPreview.visible = bool
    }

    update(elapsedTime: number, deltaTime: number) {
        if (!this.isActive || !this.owner) {
            return;
        }

        //this.renderPreview()
        this.builder.update()


    }

    renderPreview() {
        raycaster.setFromCamera(new THREE.Vector2(), this.camera);

        const objectsToIntersect = this.scene.children.filter(object => object !== this.objectPreview);
        const intersects = raycaster.intersectObjects(objectsToIntersect, true);

        if(intersects[0] && intersects[0].distance < maxPlaceDistance) {

            const point = intersects[0].point;

            let obj = this.objectPreview
            obj.position.copy(point);
            obj.position.y = point.y + size.y / 2

            this.objectPreview.visible = true
        }
        else {
            this.objectPreview.visible = false
        }
    }
}