import * as THREE from 'three'

export const dragFactor = 0.99;
export const playerHeight = 1.6
export const groundLevel = playerHeight + 0.5
export const sprintFactor = 1.6
export const movementSpeed = 0.055;
export const handOffset = new THREE.Vector3(0.3, -0.3, -0.5)
export const adsOffset = new THREE.Vector3(0, -0.215, -0.4)

export const jumpVelocity = 15;
export const maxJumpHeight = 2;
export const FLOOR_DISTANCE = 1.48 //1.48
export const BUILDING_LAYER = 3
export const INTERACT_DISTANCE = 1.5

export const CENTER = new THREE.Vector3(0, 0, 0)