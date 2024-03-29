import * as THREE from 'three'
import { PointerLockControls } from 'three/examples/jsm/Addons.js'
import PhysicsObject from '../interfaces/PhysicsObject'
import { groundLevel, movementSpeed, sprintFactor } from './constants'
import Player from './Player'
import PhysicsManager from './PhysicsManager'
import RAPIER from '@dimforge/rapier3d'
import ItemType from '../enums/ItemType'
import Firearm from '../interfaces/Firearm'
import UIManager from './UIManager'
import Bullet from './Bullet'
import Tool from '../interfaces/Tool'

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

    constructor(player: Player ,camera: THREE.Camera) {
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

        this.controls = new PointerLockControls(camera, document.body)

        this.player = player

        this.initIO()
        this.init()
    }

    init() {
        const physics = PhysicsManager.getInstance()

        this.physicsObject = physics.createPlayerCapsule()
        this.physicsController = physics.createCharacterController()
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
                }
            }
            // if (keyPressed === " " && !isJumping && isGrounded()) {
            //     //keySpace = true;
            //     //this.isJumping = true
            //     //jumpHeight = 0
            // }
            if (keyPressed === "shift") {
                this.keyShift = true;
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
                //keySpace = false;
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
            return this.player.position.y <= groundLevel
          }

        const isMoving = () => {
            return this.keyW || this.keyA || this.keyS || this.keyD
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

        const physics = PhysicsManager.getInstance()

        const displacement = this.velocity.clone().multiplyScalar(deltaTime * 200)
        
        if(this.physicsObject && this.physicsObject.rigidBody) {
            physics.setLinearVelocity(this.physicsObject?.rigidBody, displacement)
        }

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

    update(elapsedTime: number, deltaTime: number) {
        this.handleMovement(elapsedTime, deltaTime)
    }
}

