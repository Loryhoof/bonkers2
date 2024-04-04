import * as THREE from 'three';

class CustomCameraControls {
    private cameraParent: THREE.Object3D;
    private rotateSpeed: number;
    private lastMousePosition: { x: number; y: number };
    private maxVerticalAngle: number;
    private minVerticalAngle: number;

    constructor(cameraParent: THREE.Object3D, rotateSpeed: number = 0.002, maxVerticalAngle: number = Math.PI / 2, minVerticalAngle: number = -Math.PI / 2) {
        this.cameraParent = cameraParent;
        this.rotateSpeed = rotateSpeed;
        this.lastMousePosition = { x: 0, y: 0 };
        this.maxVerticalAngle = maxVerticalAngle;
        this.minVerticalAngle = minVerticalAngle;

        document.addEventListener('mousemove', this.onMouseMove.bind(this));
    }

    private onMouseMove(event: MouseEvent) {
        const movementX = event.movementX || 0;
        const movementY = event.movementY || 0;

        // Rotate camera parent
        this.cameraParent.rotateY(-movementX * this.rotateSpeed);
        this.cameraParent.rotateX(-movementY * this.rotateSpeed);

        // Clamp vertical rotation angle
        const currentRotationX = this.cameraParent.rotation.x;
        this.cameraParent.rotation.x = Math.max(this.minVerticalAngle, Math.min(this.maxVerticalAngle, currentRotationX));

        // Update last mouse position
        this.lastMousePosition.x = event.clientX;
        this.lastMousePosition.y = event.clientY;
    }

    update() {
        // Reset last mouse position at the beginning of each frame
        this.lastMousePosition.x = 0;
        this.lastMousePosition.y = 0;
    }
}

export default CustomCameraControls;
