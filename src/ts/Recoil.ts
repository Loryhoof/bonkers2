import * as THREE from 'three';
import { randomBetween } from './Utils';

export default class Recoil extends THREE.Object3D {

    private currentRotation: THREE.Quaternion = new THREE.Quaternion();
    private targetRotation: THREE.Quaternion = new THREE.Quaternion();

    private snappiness: number = 12;
    private returnSpeed: number = 8;

    private camera: THREE.Camera

    constructor(camera: THREE.Camera) {
        super();
        this.camera = camera
    }

    update(elapsedTime: number, deltaTime: number) {
        this.targetRotation.slerp(new THREE.Quaternion(), this.returnSpeed * deltaTime);
        this.currentRotation.slerp(this.targetRotation, this.snappiness * deltaTime);

        const euler = new THREE.Euler().setFromQuaternion(this.currentRotation);
        this.setRotationFromEuler(euler);
        // this.rotation.x = euler.x
        // this.rotation.y = euler.y
        // this.rotation.z = euler.z

        //this.camera.rotation.setFromQuaternion(this.quaternion)
    }

    recoilFire() {
        console.log("shoot");

        

        const incrementAngles = new THREE.Vector3(4, randomBetween(-1, 1), randomBetween(-0.5, 0.5)); // Increment by 10 degrees around the x-axis

        // Convert Euler angles to radians
        const incrementRadians = new THREE.Vector3(
            THREE.MathUtils.degToRad(incrementAngles.x),
            THREE.MathUtils.degToRad(incrementAngles.y),
            THREE.MathUtils.degToRad(incrementAngles.z)
        );

        // Create a quaternion representing the rotation increment
        const rotationIncrement = new THREE.Quaternion().setFromEuler(new THREE.Euler(
            incrementRadians.x,
            incrementRadians.y,
            incrementRadians.z,
            'XYZ' // Order of rotation axes
        ));

        this.targetRotation.multiply(rotationIncrement)
    }

}
