import * as THREE from 'three'
import ItemType from '../enums/ItemType'
import { loadGLB, randomFrom } from './Utils'
import Player from './Player'
import Tool from '../interfaces/Tool'
import { handOffset } from './constants'
import Tree from './Tree'
import { axeSounds } from './AudioManager'
import Wall from './Wall'

let raycaster = new THREE.Raycaster()
let currentPosition = new THREE.Vector3()
let lerpFactor = 0.2

export default class Hatchet extends THREE.Object3D implements Tool {

    public readonly name: string
    public readonly quantity: number
    public readonly damage: number
    public readonly item_type: ItemType
    public model: THREE.Mesh | any
    public readonly image: string

    private readonly camera: THREE.Camera
    private readonly scene: THREE.Scene

    private owner: Player | any
    private isActive: boolean
    private isHold: boolean
    private swinging: boolean
    private hitAnim: THREE.AnimationAction | any
    private hitClip: THREE.AnimationClip | any
    private mixer: THREE.AnimationMixer | any

    constructor(
        camera: THREE.Camera,
        scene: THREE.Scene
    ) {
        super()
        this.name = "Hatchet"
        this.quantity = 1
        this.damage = 10
        this.item_type = ItemType.TOOL
        this.model = null
        this.image = 'items/hatchet.jpg'
        this.camera = camera
        this.scene = scene
        this.owner = null
        this.isActive = false
        this.isHold = false
        this.swinging = false
        this.hitAnim = null
        this.hitClip = null
        this.mixer = null

        this.init()
    }

    use() {
        if(this.swinging || this.hitAnim.isRunning()) {
            return
        }

        this.hitAnim.play();
        //console.log('anim play')

        setTimeout(() => {
            raycaster.setFromCamera(new THREE.Vector2(), this.camera);

            const objectsToIntersect = this.scene.children.filter(object => object !== this.model);

            const intersects = raycaster.intersectObjects(objectsToIntersect, true);

            if(intersects[0] && intersects[0].distance < 1.5) {
                let obj = intersects[0].object.parent;

                console.log(obj)

                if(!(obj instanceof Tree)) {
                    return
                }
                
                obj.damage(this.damage, this.item_type, this.owner)

                const point = intersects[0].point;

                const geometry = new THREE.BoxGeometry(0.1, 0.1, 0.1);
                const material = new THREE.MeshStandardMaterial({ color: 0x000000 });
                const cube = new THREE.Mesh(geometry, material);
                cube.position.copy(point);

                setTimeout(() => {
                    this.scene.remove(cube)
                }, 5000)

                let audio = randomFrom(axeSounds)

                if(audio.isPlaying) {
                    audio.stop()
                }

                audio.play()
            }
            
        }, this.hitClip.duration * 500)

        this.swinging = true;

        setTimeout(() => {
            this.hitAnim.stop();
            this.swinging = false
        }, this.hitClip.duration * 1000)
    }

    setHold(bool: boolean) {
        this.isHold = bool
    }

    async init() {
        let obj = await loadGLB('models/hatchet.glb') as any
        const clips = obj.animations;
        this.model = obj.scene

        if(this.model) {
            this.scene.add(this.model)
        }

        this.mixer = new THREE.AnimationMixer( obj.scene );

        this.hitClip = THREE.AnimationClip.findByName( clips, 'hit' );
        this.hitAnim = this.mixer.clipAction( this.hitClip );
        this.model.visible = false
    }

    setActive(bool: boolean, owner: Player) {
        this.model.visible = bool
        this.owner = owner
        this.isActive = bool
    }

    update(elapsedTime: number, deltaTime: number) {
        if (!this.isActive || !this.owner || !this.model) {
            return;
        }

        currentPosition.lerp(handOffset, lerpFactor);

        let target = currentPosition.clone();

        target.applyQuaternion(this.owner.cameraParent.quaternion);

        this.model.position.copy(this.owner.cameraParent.position).add(target);
        this.model.rotation.copy(this.owner.cameraParent.rotation);

        let frequency = 2; // faster
        let amplitude = 0.015; // more movement

        if(this.owner.controller.isWalking) {
            frequency = 10
            amplitude = 0.01
        }
        if(this.owner.controller.isSprinting) {
            frequency = 15
            amplitude = 0.025
        }

        let t = Math.sin(elapsedTime * frequency) * amplitude;
        this.model.position.y += t;
        this.model.position.z -= t;

        if(this.isHold) {
            this.use()
        }

        this.mixer.update(deltaTime)
    }
}