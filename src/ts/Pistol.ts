import * as THREE from 'three'
import ItemType from '../enums/ItemType'
import { loadGLB } from './Utils'

let raycaster = new THREE.Raycaster()

export default class Pistol extends THREE.Object3D {

    public readonly name: string
    public readonly quantity: number
    public readonly damage: number
    public ammo: number
    public readonly maxAmmo: number
    public readonly item_type: ItemType
    public model: THREE.Mesh | null
    public model_slide: THREE.Mesh | null
    public readonly image: string

    private readonly camera: THREE.Camera
    private readonly scene: THREE.Scene

    private isReloading: boolean

    constructor(
        ammoCount: number,
        camera: THREE.Camera,
        scene: THREE.Scene
    ) {
        super()
        this.name = "Pistol"
        this.quantity = 1
        this.damage = 50
        this.ammo = ammoCount
        this.maxAmmo = 15
        this.item_type = ItemType.FIREARM
        this.model = null
        this.model_slide = null
        this.image = 'items/pistol.jpg'
        this.isReloading = false
        this.camera = camera
        this.scene = scene
        this.init()
    }

    async init() {
        let obj = await loadGLB('models/gunReal.glb') as any
        this.model = obj.scene
        this.model_slide = obj.scene.getObjectByName('Slide')

        if(this.model && this.model_slide) {
            this.scene.add(this.model)
        }
    }

    shoot() {
        if(this.ammo > 0 && !this.isReloading) {
            raycaster.setFromCamera(new THREE.Vector2(), this.camera)
            const objectsToIntersect = this.scene.children.filter(object => object !== this.model); // && !object.ignoreRayHit
            const intersects = raycaster.intersectObjects(objectsToIntersect, true);

            if (intersects.length > 0) {
                const point = intersects[0].point;

                const geometry = new THREE.BoxGeometry(0.1, 0.1, 0.1);
                const material = new THREE.MeshStandardMaterial({ color: 0x000000 });
                const cube = new THREE.Mesh(geometry, material);
                cube.position.copy(point);

                //cube.ignoreRayHit = true


                // maybe bad for perf.. dunno
                setTimeout(() => {
                    this.scene.remove(cube)
                }, 10000)
                ///

                this.scene.add(cube);

                // if (intersects[0].object.root && intersects[0].object.root.canTakeDamage) {
                //     if (intersects[0].object.root.name == "Head") {
                //         intersects[0].object.root.damage(100), this.item_type;
                //     } else {
                //         intersects[0].object.root.damage(this.damage, this.item_type);
                //     }
                // }

                // if (pistol_shoot_sound.isPlaying || bullet_impact_sound.isPlaying) {
                //     pistol_shoot_sound.stop();
                //     bullet_impact_sound.stop();
                // }

                // pistol_shoot_sound.play();

                const recoilVector = new THREE.Vector3(0,0,1).clone().multiplyScalar(0.05);
                this.model?.position.add(recoilVector);

                const initialSlidePosition = this.model_slide?.position.clone();
                this.model_slide?.position.add(new THREE.Vector3(1, 0, 0).clone().multiplyScalar(0.1));

                let initialCameraRotationX = new THREE.Vector3();

                // if (!hasAppliedRecoil) {
                //     initialCameraRotationX = camera.rotation.x;
                //     hasAppliedRecoil = true;
                //     camera.rotateX(verticalRecoilAmount);
                // }

                // setTimeout(() => {
                //     gunModel.slide.position.copy(initialSlidePosition);
                //     hasAppliedRecoil = false;
                // }, 50);

                this.ammo -= 1;
            }
        }
    }
}