import * as THREE from 'three'
import ItemType from '../../enums/ItemType'
import UsableItem from '../../interfaces/UsableItem'
import { loadGLB } from '../Utils'
import { adsOffset, handOffset } from '../constants'
import Firearm from '../../interfaces/Firearm'
import Player from '../Player'
import { bullet_impact_sound, hit_sound, rifle_reload_sound, sniper_bolt_action, sniper_shot_sound } from '../AudioManager'
import Bullet from '../Bullet'
import MuzzleFlash from '../MuzzleFlash'
import Recoil from './Recoil'
import World from '../World'
import { scopeMaterial } from './ScopeMaterial'
import BloodParticle from './BloodParticle'
import DecalSmokeParticle from './DecalSmokeParticle'

let raycaster = new THREE.Raycaster()
let currentPosition = new THREE.Vector3()
let targetPosition = new THREE.Vector3()
let hasAppliedRecoil = false
let lerpFactor = 0.2

export default class Sniper extends THREE.Object3D implements Firearm {

    public readonly name: string
    public readonly quantity: number
    public readonly damage: number
    public ammo: number
    public readonly maxAmmo: number
    public readonly item_type: ItemType
    public model: THREE.Mesh | any
    public model_slide: THREE.Mesh | any
    public model_scope: THREE.Mesh | any
    public readonly image: string

    private readonly camera: THREE.Camera
    private readonly scene: THREE.Scene

    private isReloading: boolean
    private isAds: boolean

    private owner: Player | null
    private isActive: boolean

    private muzzleFlash: MuzzleFlash

    private isHoldingFire: boolean = false

    private lastFireTime: number = -1;

    private fireRate: number = 0.1; // 600 rpm
    private reloadTime: number = 1200;

    private recoil: Recoil

    private scopeCamera: THREE.Camera

    private zoomAmount: number = 15;

    private canShoot: boolean = true

    constructor(
        ammoCount: number,
        camera: THREE.Camera,
        scene: THREE.Scene,
        recoil: Recoil
    ) {
        super()
        this.name = "Sniper"
        this.quantity = 1
        this.damage = 500
        this.ammo = ammoCount
        this.maxAmmo = 15
        this.item_type = ItemType.FIREARM
        this.model = null
        this.image = 'items/sniper.jpg'
        this.isReloading = false
        this.camera = camera
        this.scene = scene
        this.isAds = false
        this.owner = null
        this.isActive = false

        this.recoil = recoil

        this.muzzleFlash = new MuzzleFlash(this.scene)

        this.scopeCamera = new THREE.PerspectiveCamera(75 / this.zoomAmount, 1, 0.01, 10000);


        //let renderer = World.getInstance()

        this.init()
    }

    use() {
        //this.shoot()
    }

    setHold(bool: boolean) {
        this.shoot()
        this.isHoldingFire = bool;

        //console.log(World.getInstance())
    }

    async init() {
        let obj = await loadGLB('models/sniper.glb') as any
        //console.log(obj)
        this.model = obj.scene
        this.model_slide = obj.scene.getObjectByName('Slide')

        this.model_scope = obj.scene.getObjectByName('Scope')
        console.log(this.model_scope, "scope")

        this.model_scope.material = scopeMaterial;
        //console.log(this.model_slide)

        if(this.model) {
            this.scene.add(this.model)
            //this.scene.add(this)
        }
        this.model.visible = false

        //currentPosition = handOffset.clone()
    }

    shoot() {
        if(this.isHoldingFire) {
            return
        }

        if(!this.canShoot) {
            return
        }

        if(this.ammo > 0 && !this.isReloading) {
            this.canShoot = false
            raycaster.setFromCamera(new THREE.Vector2(), this.camera)
            const objectsToIntersect = this.scene.children.filter(object => object !== this.model && object !== this.muzzleFlash.mesh && !object.userData.ignoreRayHit); // && !object.ignoreRayHit
            const intersects = raycaster.intersectObjects(objectsToIntersect, true);

            const offsetPosition = new THREE.Vector3().copy(this.model.position).add(new THREE.Vector3(0,0,-1).clone().multiplyScalar(1).applyQuaternion(this.model.quaternion));
            this.muzzleFlash.show(offsetPosition, this.model.quaternion, 2)

            if (intersects.length > 0) {
                const point = intersects[0].point;

                const geometry = new THREE.BoxGeometry(0.1, 0.1, 0.1);
                const material = new THREE.MeshStandardMaterial({ color: 0x000000 });
                const cube = new THREE.Mesh(geometry, material);
                //cube.position.copy(point);

                //this.scene.add(cube)

                

                //cube.ignoreRayHit = true


                // maybe bad for perf.. dunno
                // setTimeout(() => {
                //     this.scene.remove(cube)
                // }, 10000)
                ///

                //this.scene.add(cube);

                // if (intersects[0].object.root && intersects[0].object.root.canTakeDamage) {
                //     if (intersects[0].object.root.name == "Head") {
                //         intersects[0].object.root.damage(100), this.item_type;
                //     } else {
                //         intersects[0].object.root.damage(this.damage, this.item_type);
                //     }
                // }

                if(intersects[0].object.userData.class) {
                    let obj = intersects[0].object.userData.class


                    // yea this is stupid ik ik
                    //console.log()
                    if(obj.health != undefined) {
                        let blood = new BloodParticle(this.scene, this.camera, point)
                        console.log('has health', obj.health)
                        obj.damage(this.damage)

                        if(hit_sound.isPlaying) {
                            hit_sound.stop()
                        }
                        
                        setTimeout(() => {
                            hit_sound.play()
                        }, 100)
                    }
                }
                else {
                    let particle = new DecalSmokeParticle(this.scene, this.camera, point)
                }

                if (sniper_shot_sound.isPlaying || bullet_impact_sound.isPlaying) {
                    sniper_shot_sound.stop();
                    bullet_impact_sound.stop()
                }

                sniper_shot_sound.play()

                const recoilVector = new THREE.Vector3(0,0,1).clone().multiplyScalar(0.05);
                this.model?.position.add(recoilVector);

                const initialSlidePosition = this.model_slide?.position.clone();
                this.model_slide?.position.add(new THREE.Vector3(0, 0, 1).clone().multiplyScalar(0.02));

                //let initialCameraRotationX

                if (!hasAppliedRecoil) {
                    //initialCameraRotationX = this.camera.rotation.x;
                    hasAppliedRecoil = true;
                   //this.owner?.recoilParent.rotateX(Math.PI / 72);
                    this.owner?.recoilParent.recoilFire()
                }

                setTimeout(() => {
                    this.model_slide?.position.copy(initialSlidePosition);
                    hasAppliedRecoil = false;
                }, 50);

                if(sniper_bolt_action.isPlaying) {
                    sniper_bolt_action.stop()
                }
                sniper_bolt_action.play()

                setTimeout(() => {
                    
                    //sniper_bolt_action.play()
                    this.canShoot = true;
                }, 1300)

                this.ammo -= 1;
            }
        }
    }

    reload(bullets: Bullet) {
        if(this.isReloading) {
            return
        }
        //this.ammo = this.maxAmmo
        this.isReloading = true;
        let dif = this.maxAmmo - this.ammo;

        let ammo = this.maxAmmo

        if(bullets.quantity < dif) {
            ammo = bullets.quantity
            bullets.quantity = 0
        }
        else {
            bullets.quantity = bullets.quantity - dif
        }

        this.ammo = ammo

        if(rifle_reload_sound.isPlaying) {
            rifle_reload_sound.stop()
        }

        rifle_reload_sound.play()

        const recoilVector = new THREE.Vector3(0,0,1).clone().multiplyScalar(0.05);
        const initialSlidePosition = this.model_slide.position.clone();

        this.model_slide?.position.add(recoilVector)
        
        setTimeout(() => {
            this.isReloading = false;
            this.model_slide.position.copy(initialSlidePosition)
        }, this.reloadTime)
    }
    
    ads(bool: boolean) {
        this.isAds = bool;
        if (bool) {
            targetPosition = adsOffset.clone().add(new THREE.Vector3(0, 0, 0.12));
            lerpFactor = 0.075
        } else {
            targetPosition = handOffset;
            lerpFactor = 0.05
        }
    }

    setActive(bool: boolean, owner: Player) {
        
        this.model.visible = bool
        this.owner = owner
        this.isActive = bool

        this.recoil?.applySettings(75, 3)
    }

    private handleScope() {
        let renderTarget = new THREE.WebGLRenderTarget(1024 / 5, 1024 / 5);
            renderTarget.texture.flipY = true
            renderTarget.texture.needsUpdate = true
            //his.scopeCamera.fov = 75 / 100
            //this.scopeCamera.updateProjectionMatrix()

            let renderer = (window as any).renderer;

            let offset = new THREE.Vector3(0, 0, -2).applyQuaternion(this.model.quaternion)
            let pos = this.model.position.clone().add(this.model_scope.position).add(offset)

            //console.log(pos)

            this.scopeCamera.position.copy(pos)
            this.scopeCamera.quaternion.copy(this.model.quaternion)
            //this.scopeCamera.updateProjectionMatrix()

            renderer.setRenderTarget(renderTarget);
            renderer.render(this.scene, this.scopeCamera);

            // Switch back to the main scene
            renderer.setRenderTarget(null);

            //this.model_scope.material.uniforms.texture.value = renderTarget.texture;

            //console.log(this.model_scope.position)

            //this.scopeCamera.position.copy(this.model_scope.position)

            //this.model_scope.material.uniforms.texture.value = renderTarget.texture;

            this.model_scope.material = new THREE.MeshBasicMaterial({map: renderTarget.texture, side:1})

           
            

            //his.model_scope.material = scopeMaterial
            //this.model_scope.material.uniforms.value = renderTarget.va
    }

    update(elapsedTime: number, deltaTime: number) {
        if (!this.isActive || !this.owner || !this.model) {
            return;
        }

        // if(this.isHoldingFire && elapsedTime - this.lastFireTime > this.fireRate) {
        //     this.lastFireTime = elapsedTime
        //     this.shoot()
        // }

        currentPosition.lerp(targetPosition, lerpFactor);

        let target = currentPosition.clone();

        target.applyQuaternion(this.owner.cameraParent.quaternion);


        let w = new THREE.Vector3()
        this.owner.recoilParent.getWorldPosition(w)

        let r = new THREE.Quaternion
        this.owner.recoilParent.getWorldQuaternion(r)

        this.model.position.copy(w).add(target);
        this.model.quaternion.copy(r);

        //let d = new THREE.Vector3()
        //this.owner.cameraParent.getWorldDirection(d)


        //this.model.lookAt(d)

        let frequency = 2; // faster
        let amplitude = 0.015; // more movement

        if (this.isAds) {

            

            frequency = 1
            amplitude = 0.005;
        }
        if(this.owner.controller.isWalking) {
            frequency = 10
            amplitude = 0.01
        }
        if(this.owner.controller.isSprinting) {
            frequency = 15
            amplitude = 0.025
        }

        if(this.isAds && this.owner.controller.isWalking || this.isAds && this.owner.controller.isSprinting) {
            frequency = 1
            amplitude = 0.005
        }

        let t = Math.sin(elapsedTime * frequency) * amplitude;
        this.model.position.y += t;


        //this.model.position.z -= t;

        this.handleScope()
    }
}