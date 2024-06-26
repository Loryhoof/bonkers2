import { Vector3, Matrix4, Object3D, Quaternion } from 'three';

/**
 * A collection of utilities.
 * @module utils
 */

const t1 = new Vector3();
const t2 = new Vector3();
const t3 = new Vector3();
const m1 = new Matrix4();

/**
 * Returns the world position of object and sets
 * it on target.
 *
 * @param {THREE.Object3D} object
 * @param {THREE.Vector3} target
 */
export function getWorldPosition(object: Object3D, target: Vector3) {
  return target.setFromMatrixPosition(object.matrixWorld);
}

/**
 * Returns the distance between two objects.
 *
 * @param {THREE.Object3D} obj1
 * @param {THREE.Object3D} obj2
 * @return {number}
 */
export function getWorldDistance(obj1: Object3D, obj2: Object3D) {
  getWorldPosition(obj1, t1);
  getWorldPosition(obj2, t2);
  return obj1.position.distanceTo(obj2.position);
}

/**
 * Sets the target to the centroid position between all passed in
 * positions.
 *
 * @param {Array<THREE.Vector3>} positions
 * @param {THREE.Vector3} target
 */
export function getCentroid(positions: [], target: Vector3) {
  target.set(0, 0, 0);
  for (let position of positions) {
    target.add(position);
  }
  target.divideScalar(positions.length);

  return target;
};

/**
 * Takes a direction vector and an up vector and sets
 * `target` quaternion to the rotation. Similar to THREE.Matrix4's
 * `lookAt` function, except rather than taking two Vector3 points,
 * we've already calculated the direction earlier so skip the first half.
 *
 * @param {THREE.Vector3} direction
 * @param {THREE.Vector3} up
 * @param {THREE.Quaternion} target
 */
export function setQuaternionFromDirection(direction: Vector3, up: Vector3, target: Quaternion) {
  const x = t1;
  const y = t2;
  const z = t3;
  const m = m1;
  const el = m1.elements;

  z.copy(direction);
  x.crossVectors(up, z);

  if (x.lengthSq() === 0) {
    // parallel
    if (Math.abs(up.z) === 1) {
      z.x += 0.0001;
    } else {
      z.z += 0.0001;
    }
    z.normalize();
    x.crossVectors(up, z);
  }

  x.normalize();
  y.crossVectors(z, x);

  el[ 0 ] = x.x; el[ 4 ] = y.x; el[ 8 ] = z.x;
  el[ 1 ] = x.y; el[ 5 ] = y.y; el[ 9 ] = z.y;
  el[ 2 ] = x.z; el[ 6 ] = y.z; el[ 10 ] = z.z;

  target.setFromRotationMatrix(m);
}

/**
 * Implementation of Unity's Transform.transformPoint, which is similar
 * to three's Vector3.transformDirection, except we want to take scale into account,
 * as we're not transforming a direction. Function taken from BabylonJS.
 *
 * From BabylonJS's `Vector3.transformCoordinates`:
 * Sets the passed vector coordinates with the result of the transformation by the
 * passed matrix of the passed vector. This method computes tranformed coordinates only,
 * not transformed direction vectors (ie. it takes translation in account)
 *
 * @see https://docs.unity3d.com/ScriptReference/Transform.TransformPoint.html
 * @see https://github.com/BabylonJS/Babylon.js/blob/6050288da37623088d5f613ca2d85aef877c5cd5/src/Math/babylon.math.ts#L1936
 * @param {THREE.Vector3} vector
 * @param {THREE.Matrix4} matrix
 * @param {THREE.Vector3} target
 */
export function transformPoint(vector: Vector3, matrix: Matrix4, target: Vector3) {
  const e = matrix.elements;

  const x = (vector.x * e[0]) + (vector.y * e[4]) + (vector.z * e[8]) + e[12];
  const y = (vector.x * e[1]) + (vector.y * e[5]) + (vector.z * e[9]) + e[13];
  const z = (vector.x * e[2]) + (vector.y * e[6]) + (vector.z * e[10]) + e[14];
  const w = (vector.x * e[3]) + (vector.y * e[7]) + (vector.z * e[11]) + e[15];
  target.set(x / w, y / w, z / w);
};
