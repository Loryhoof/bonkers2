import * as THREE from 'three'
import ItemType from '../enums/ItemType'
import { randomBetween, randomFrom } from './Utils'
import Player from './Player'
import { build_sound, bullet_impact_sound } from './AudioManager'
import PhysicsManager from './PhysicsManager'
import Floor from './Floor'
import BuildingManager from './BuildingManager'
import Building from '../interfaces/Building'
import SelectedBuildType from '../enums/SelectedBuildType'

let raycaster = new THREE.Raycaster()

let maxPlaceDistance = 10

let size = new THREE.Vector3(1,5, 5)

export default class Blueprint implements Building {

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

    switch() {
        this.builder.shuffleBuildType()
    }

    rotate() {
        this.builder.rotate()
    }

    use() {
        if(this.owner.inventory.inventory["Wood"]) {
            const costToBuild = 0
            if(this.owner.inventory.inventory["Wood"].quantity >= costToBuild) {
                console.log("has over 100 wood")
                this.owner.inventory.inventory["Wood"].quantity -= costToBuild
                this.builder.build()

                if(build_sound.isPlaying) {
                    build_sound.stop()
                }

                build_sound.setDetune(randomBetween(250, 500))

                build_sound.play()
            }
        }
    }

    async init() {

        const geometry = new THREE.BoxGeometry(size.x, size.y, size.z);
        const material = new THREE.MeshStandardMaterial({ color: 0x000000 });
        const previewMaterial = new THREE.MeshStandardMaterial({ color: 0x00ff00, transparent: true, opacity: 0.5 });
        
        this.objectPreview = new THREE.Mesh(geometry, previewMaterial);
        this.objectToPlace = new THREE.Mesh(geometry, material);

        //this.scene.add(this.objectPreview)
        this.objectPreview.visible = false
        
    }

    setActive(bool: boolean, owner: Player) {
        //this.model.visible = bool
        this.builder.setActive(bool)

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