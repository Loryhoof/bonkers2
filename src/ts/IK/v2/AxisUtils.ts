/**
 * @author snayss -- https://codercat.tk
 *
 * Helper utility to iterate through a THREE.Bone heirarchy from a model
 * created in an external software and set each bone +Z Forward vector to
 * face the child bone.
 *
 **/

import * as THREE from 'three'

const t = new THREE.Vector3();
const q = new THREE.Quaternion();
const p = new THREE.Plane();
const FORWARD = new THREE.Vector3(0,0,1);
var RESETQUAT = new THREE.Quaternion();

/**
* Takes in a rootBone and recursively traverses the bone heirarchy,
* setting each bone's +Z axis to face it's child bones. The IK system follows this
* convention, so this step is necessary to update the bindings of a skinned mesh.
*
* Must rebind the model to it's skeleton after this function.
*
* @param {THREE.BONE} rootBone
*/

export function setZForward(rootBone: THREE.Bone) {
  var worldPos = {};
  getOriginalWorldPositions(rootBone, worldPos);
  updateTransformations(rootBone, worldPos);
}

export function updateTransformations(parentBone: THREE.Bone, worldPos: any) {

    var averagedDir = new THREE.Vector3();
    parentBone.children.forEach((childBone) => {
      //average the child bone world pos
      var childBonePosWorld = worldPos[childBone.id];
      averagedDir.add(childBonePosWorld);
    });

    averagedDir.multiplyScalar(1/(parentBone.children.length));

    //set quaternion
    parentBone.quaternion.copy(RESETQUAT);
    parentBone.updateMatrixWorld();
    //get the child bone position in local coordinates
    var childBoneDir = parentBone.worldToLocal(averagedDir).normalize();
    //set the direction to child bone to the forward direction
    var quat = getAlignmentQuaternion(FORWARD, childBoneDir);
    if (quat) {
      //rotate parent bone towards child bone
      parentBone.quaternion.premultiply(quat);
      parentBone.updateMatrixWorld();
      //set child bone position relative to the new parent matrix.
      parentBone.children.forEach((childBone) => {
        var childBonePosWorld = worldPos[childBone.id].clone();
        parentBone.worldToLocal(childBonePosWorld);
        childBone.position.copy(childBonePosWorld);
      });
    }

    parentBone.children.forEach((childBone: any) => {
      updateTransformations(childBone, worldPos);
    })
}

export function getAlignmentQuaternion(fromDir: any, toDir: any) {
  const adjustAxis = t.crossVectors(fromDir, toDir).normalize();
  const adjustAngle = fromDir.angleTo(toDir);
  if (adjustAngle) {
    const adjustQuat = q.setFromAxisAngle(adjustAxis, adjustAngle);
    return adjustQuat;
  }
  return null;
}

export function getOriginalWorldPositions(rootBone: any, worldPos: any) {
  rootBone.children.forEach((child: any) => {
    var childWorldPos = child.getWorldPosition(new THREE.Vector3());
    worldPos[child.id] = childWorldPos;
    getOriginalWorldPositions(child, worldPos);
  })
}