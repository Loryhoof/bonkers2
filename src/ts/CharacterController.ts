import * as THREE from 'three'
import { PointerLockControls } from 'three/examples/jsm/Addons.js'
import PhysicsObject from '../interfaces/PhysicsObject'
import { FLOOR_DISTANCE, INTERACT_DISTANCE, groundLevel, movementSpeed, sprintFactor } from './constants'
import Player from './Player'
import PhysicsManager from './PhysicsManager'
import RAPIER from '@dimforge/rapier3d'
import ItemType from '../enums/ItemType'
import Firearm from '../interfaces/Firearm'
import UIManager from './UIManager'
import Bullet from './Bullet'
import Tool from '../interfaces/Tool'
import { grass_step_sound, grassStepSounds, woodStepSounds } from './AudioManager'
import { isApproximatelyEqual, randomBetween, randomFrom } from './Utils'
import Building from '../interfaces/Building'
import Interactable from '../interfaces/Interactable'
import SoundType from '../enums/SoundType'

let lastStepPlayed = performance.now();
let raycaster = new THREE.Raycaster()

export default class CharacterController {
    
    public isWalking: boolean
    public isSprinting: boolean

    private keyW: boolean
    private keyA: boolean
    private keyS: boolean
    private keyD: boolean
    private keySpace: boolean
    private keyShift: boolean

    private velocity: THREE.Vector3
    private controls: PointerLockControls

    private camera: THREE.Camera

    private physicsObject: PhysicsObject | null
    private physicsController: RAPIER.KinematicCharacterController | null

    private player: Player
    private scene: THREE.Scene

    private grounded: boolean

    private lookingAtObject: any

    private selectedStepSoundArray: Array<THREE.Audio> = woodStepSounds

    constructor(player: Player, camera: THREE.Camera, scene: THREE.Scene) {
        this.isWalking = false
        this.isSprinting = false
        this.velocity = new THREE.Vector3()

        this.keyW = false
        this.keyA = false
        this.keyS = false
        this.keyD = false
        this.keySpace = false 
        this.keyShift = false

        this.camera = camera

        this.physicsObject = null
        this.physicsController = null

        this.grounded = false

        this.controls = new PointerLockControls(camera, document.body)

        this.player = player
        this.scene = scene

        this.initIO()
        this.init()
    }

    init() {
        const physics = PhysicsManager.getInstance()

        this.physicsObject = physics.createPlayerCapsule()
        //this.physicsController = physics.createCharacterController()
    }

    private initIO() {
        window.addEventListener('mousedown', (event) => {
            // if(!isPointerLocked) {
            //     return
            // }
            if (event.button === 0) {
                // Left mouse button pressed
                //leftMouse = true;
                if(this.player.selectedItem) {
                    if(this.player.selectedItem.item_type === ItemType.TOOL) {
                        const tool = this.player.selectedItem as Tool;
                        tool.setHold(true);
                    }
                    else {
                        this.player.selectedItem.use()
                    }
                }
            } else if (event.button === 2) {
                // Right mouse button pressed
                //rightMouse = true;
        
                if(this.player.selectedItem) {
                    if(this.player.selectedItem.item_type === ItemType.FIREARM) {
                        const firearm = this.player.selectedItem as Firearm;
                        firearm.ads(true);
                    }
                }
            }
        });
        
        // Event listener for mouse button release
        window.addEventListener('mouseup', (event) => {
            if (event.button === 0) {
                // Left mouse button released
                //leftMouse = false;
        
                if(this.player.selectedItem) {
                    if(this.player.selectedItem.item_type === ItemType.TOOL) {
                        if(this.player.selectedItem.item_type === ItemType.TOOL) {
                            const tool = this.player.selectedItem as Tool;
                            tool.setHold(false);
                        }
                    }
                }
            } else if (event.button === 2) {
                // Right mouse button released
                //rightMouse = false;
        
                if(this.player.selectedItem) {
                    if(this.player.selectedItem.item_type === ItemType.FIREARM) {
                        const firearm = this.player.selectedItem as Firearm
                        firearm.ads(false);
                    }
                }
            }
        });

        window.addEventListener("keydown", (event) => {
            const keyPressed = event.key.toLowerCase();
             
            if (keyPressed === "w" ) {
                this.keyW = true;
            }
            if (keyPressed === "a") {
                this.keyA = true;
            }
            if (keyPressed === "s") {
                this.keyS = true;
            }
            if (keyPressed === "d") {
                this.keyD = true;
            }
            if (keyPressed === "r") {
                if(this.player.selectedItem) {
                    if(this.player.selectedItem.item_type === ItemType.FIREARM) {
                        const firearm = this.player.selectedItem as Firearm;
                        if(this.player.inventory.inventory["Bullet"]) {
                            firearm.reload(this.player.inventory.inventory['Bullet'] as Bullet)
                        }
                    }

                    if(this.player.selectedItem.item_type == ItemType.BUILDING) {
                        const bp = this.player.selectedItem as Building;
                        bp.rotate()
                    }
                }
            }
            if (keyPressed === "q") {
                if(this.player.selectedItem) {
                    if(this.player.selectedItem.item_type == ItemType.BUILDING) {
                        const bp = this.player.selectedItem as Building;
                        bp.switch()
                    }
                }
            }
            if (keyPressed === " ") {
                this.keySpace = true;
                //this.isJumping = true
                //jumpHeight = 0
            }
            if (keyPressed === "shift") {
                this.keyShift = true;
            }

            if (keyPressed === 'e') {
                if (this.lookingAtObject && this.lookingAtObject.item_type && this.lookingAtObject.item_type == ItemType.INTERACTABLE) {
                    this.lookingAtObject.interact()
                }
            }
         
            // if (keyPressed === "tab") {
            //     exitPointerLock()
            // }
        
            // if (keyPressed === "t") {
            //     respawn()
            // }
        
        
            const numberKeyMapping: { [key: string]: number } = {
                'Digit1': 1,
                'Digit2': 2,
                'Digit3': 3,
                'Digit4': 4,
                'Digit5': 5,
                'Digit6': 6,
                'Digit7': 7,
                'Digit8': 8,
                'Digit9': 9
            }
        
            if (event.code.startsWith('Digit')) {
                const slotNumber = numberKeyMapping[event.code];
                this.switchSlot(slotNumber - 1);
            }
          });

          window.addEventListener("keyup", (event) => {
            const keyPressed = event.key.toLowerCase();
        
            if (keyPressed === "w") {
                this.keyW = false;
            }
            if (keyPressed === "a") {
                this.keyA = false;
            }
            if (keyPressed === "s") {
                this.keyS = false;
            }
            if (keyPressed === "d") {
                this.keyD = false;
            }
            if (keyPressed === " ") {
                this.keySpace = false;
            }
            if (keyPressed === "shift") {
                this.keyShift = false;
            }
          });
    }

    private handleMovement(elapsedTime: number, deltaTime: number) {
        if(!this.physicsObject?.rigidBody) {
            return
        
        }

        const canSprint = () => {
            return this.keyShift // !rightMouse && 
        }
        
        const isGrounded = () => {
            //return this.player.position.y <= groundLevel
            return this.grounded
          }

        const isMoving = () => {
            return this.keyW || this.keyA || this.keyS || this.keyD
        }

        let current = performance.now()

        let footstepDelay = canSprint() ? 300 : 500;

        let cur = randomFrom(this.selectedStepSoundArray)

        if (current - lastStepPlayed > footstepDelay && isGrounded() && isMoving()) {
            if (cur.isPlaying) {
                cur.stop();
            }
            cur.setDetune(randomBetween(-200, -500))
            cur.play();
            lastStepPlayed = current; 
        }

        let {x, y, z} = this.physicsObject?.rigidBody.translation()

        this.player.position.set(x, y, z)
        this.camera.position.copy(this.player.position)

        const cameraDirection = new THREE.Vector3();
        this.controls.getObject().getWorldDirection(cameraDirection);
        cameraDirection.normalize();

        const cameraForward = new THREE.Vector3(cameraDirection.x, 0, cameraDirection.z).normalize();

        this.velocity.set(0, 0, 0);

        let speed = movementSpeed;

        if(canSprint()) {
            speed = movementSpeed * sprintFactor;
        }

        if (this.keyW) {
            this.velocity.add(cameraForward.clone().multiplyScalar(speed * 60));
        }
        if (this.keyA) {
            const left = new THREE.Vector3(-cameraDirection.z, 0, cameraDirection.x);
            this.velocity.add(left.multiplyScalar(-speed * 60));
        }
        if (this.keyS) {
            this.velocity.add(cameraForward.clone().multiplyScalar(-speed * 60));
        }
        if (this.keyD) {
            const right = new THREE.Vector3(cameraDirection.z, 0, -cameraDirection.x);
            this.velocity.add(right.multiplyScalar(-speed * 60));
        }


        // crouch
        if (!this.keyShift && this.keySpace && isGrounded()) {
            this.physicsObject?.rigidBody.applyImpulse(new THREE.Vector3(0, 0.5, 0), true)
        }

        // jump
        if (this.keyShift && this.keySpace && isGrounded()) {
            this.physicsObject?.rigidBody.applyImpulse(new THREE.Vector3(0, 0.7, 0), true)
        }

        const physics = PhysicsManager.getInstance()

        const displacement = this.velocity.clone().multiplyScalar(deltaTime * 75)
        const linVel = this.physicsObject.rigidBody.linvel()
        displacement.y = linVel.y

        physics.setLinearVelocity(this.physicsObject?.rigidBody, displacement)

        this.isWalking = isMoving()
        this.isSprinting = isMoving() && this.keyShift
    }

    switchSlot(slot: number) {
        let ui = UIManager.getInstance()
        if(this.player.hotBar[slot] && this.player.hotBar[slot].passive) {
            ui.updateHotBar(this.player.hotBar, this.player.selectedSlot)
            return
        }
    
        if(!this.player.hotBar[slot]) {
            if(this.player.selectedItem) {
                this.player.selectedItem.setActive(false, this.player)
                this.player.selectedItem = null
                this.player.selectedSlot = -1
            }
            ui.updateHotBar(this.player.hotBar, this.player.selectedSlot)
            return
        }
    
        if(slot != this.player.selectedSlot && this.player.selectedItem) {
            this.player.selectedItem.setActive(false, this.player)
            this.player.selectedItem = null
        }
    
        this.player.selectedSlot = slot
        this.player.selectedItem = this.player.hotBar[this.player.selectedSlot]
        this.player.selectedItem?.setActive(true, this.player)
        ui.updateHotBar(this.player.hotBar, this.player.selectedSlot)
    }

    handleInteract(obj: Interactable) {
        obj.interact()
    }

    checkInfront() {
        raycaster.setFromCamera(new THREE.Vector2(), this.camera);

        //const objectsToIntersect = this.scene.children.filter(object => object !== this.player);
        const intersects = raycaster.intersectObjects(this.scene.children, true);


        // Text Display
        if(intersects[0] && intersects[0].distance <= INTERACT_DISTANCE) {
            //console.log(intersects[0].object)
            if(intersects[0].object.userData.interactInfo) {
                this.lookingAtObject = intersects[0].object.userData.class
                UIManager.getInstance().setInteractText(true, intersects[0].object.userData.interactInfo)
            }
            else if(intersects[0].object.userData.class) {
                if(intersects[0].object.userData.class.userData.interactInfo) {
                    this.lookingAtObject = intersects[0].object.userData.class
                    UIManager.getInstance().setInteractText(true, intersects[0].object.userData.class.userData.interactInfo)
                }
            }
        }
        else {
            UIManager.getInstance().setInteractText(false)
            this.lookingAtObject = null
        }
    }

    checkGround() {
        if(!this.physicsObject) {
            this.grounded = false
            return
        }

        let distance = PhysicsManager.getInstance().raycast(this.player.position, new THREE.Vector3(0, -1, 0), this.physicsObject.rigidBody)

        if(distance) {
            this.grounded = distance <= FLOOR_DISTANCE
            //console.log(distance)
        }
        else {
            this.grounded = false
        }

        // SOUND SPECIFIC

        //raycaster.setFromCamera(new THREE.Vector2(), this.camera);
        raycaster.set(this.player.position, new THREE.Vector3(0, -1, 0))

        const objectsToIntersect = this.scene.children.filter(object => object !== this.player);
        const intersects = raycaster.intersectObjects(objectsToIntersect, true);


        // Text Display
        if(intersects[0] && intersects[0].distance <= INTERACT_DISTANCE) {
            if(intersects[0].object.userData.soundType) {
                const soundType = intersects[0].object.userData.soundType
                if(soundType == SoundType.wood) {
                    this.selectedStepSoundArray = woodStepSounds
                }
            }
            else if(intersects[0].object.userData.class) {
                if(intersects[0].object.userData.class.userData.soundType) {
                    const soundType = intersects[0].object.userData.class.userData.soundType
                    if(soundType == SoundType.wood) {
                        this.selectedStepSoundArray = woodStepSounds
                    }
                }
            }
            else {
                // grass
                this.selectedStepSoundArray = grassStepSounds
            }
        }
    }

    update(elapsedTime: number, deltaTime: number) {
        this.checkGround()
        this.checkInfront()
        this.handleMovement(elapsedTime, deltaTime)
    }
}

