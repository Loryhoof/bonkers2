import { Matrix4, Vector3 } from 'three';
import * as THREE from 'three';
import { transformPoint, getCentroid, getWorldPosition, setQuaternionFromDirection } from './utils.ts';
import IKBallConstraint from './IKBallConstraint.ts';

const Y_AXIS = new Vector3(0, 1, 0);

/**
 * A class for a joint.
 */
class IKJoint {
  /**
   * @param {THREE.Bone} bone
   * @param {Object} config
   * @param {Array<IKConstraint>} [config.constraints]
   */

  public constraints: any
  public bone: THREE.Bone
  public distance: number

  public _originalDirection: THREE.Vector3
  private _direction: THREE.Vector3
  private _worldPosition: THREE.Vector3
  private _isSubBase: boolean
  private _subBasePositions: any

  public isIKJoint: boolean

  constructor(bone: THREE.Bone, { constraints } : any = {}) {
    this.constraints = constraints || [];

    this.bone = bone;

    this.distance = 0;

    this._originalDirection = new Vector3();
    this._direction = new Vector3();
    this._worldPosition = new Vector3();
    this._isSubBase = false;
    this._subBasePositions = null;
    this.isIKJoint = true;

    this._updateWorldPosition();
  }

  /**
   * @private
   */
  _setIsSubBase() {
    this._isSubBase = true;
    this._subBasePositions = [];
  }

  /**
   * Consumes the stored sub base positions and apply it as this
   * joint's world position, clearing the sub base positions.
   *
   * @private
   */
  _applySubBasePositions() {
    if (this._subBasePositions.length === 0) {
      return;
    }
    getCentroid(this._subBasePositions, this._worldPosition);
    this._subBasePositions.length = 0;
  }

  /**
   * @private
   */
  _applyConstraints() {
    if (!this.constraints) {
      return;
    }

    let constraintApplied = false;
    for (let constraint of this.constraints) {
      if (constraint && constraint._apply) {
        let applied = constraint._apply(this);
        constraintApplied = constraintApplied || applied;
      }
    }
    return constraintApplied;
  }

  /**
   * Set the distance.
   * @private
   * @param {number} distance
   */
  _setDistance(distance: number) {
    this.distance = distance;
  }

  /**
   * @private
   */
  _getDirection() {
    return this._direction;
  }

  /**
   * @private
   */
  _setDirection(direction: THREE.Vector3) {
    this._direction.copy(direction);
  }

  /**
   * Gets the distance.
   * @private
   * @return {THREE.Vector3}
   */
  _getDistance() {
    return this.distance;
  }

  /**
   * @private
   */
  _updateMatrixWorld() {
    this.bone.updateMatrixWorld(true);
  }

  /**
   * @private
   * @return {THREE.Vector3}
   */
  _getWorldPosition() {
    return this._worldPosition;
  }

  /**
   * @private
   */
  _getWorldDirection(joint: any) {
    return new Vector3().subVectors(this._getWorldPosition(), joint._getWorldPosition()).normalize();
  }

  /**
   * @private
   */
  _updateWorldPosition() {
    getWorldPosition(this.bone, this._worldPosition);
  }

  /**
   * @private
   */
  _setWorldPosition(position: THREE.Vector3) {
    this._worldPosition.copy(position);
  }

  /**
   * @private
   */
  _localToWorldDirection(direction: THREE.Vector3) {
    if (this.bone.parent) {
      const parent = this.bone.parent.matrixWorld;
      direction.transformDirection(parent);
    }
    return direction;
  }

  /**
   * @private
   */
  _worldToLocalDirection(direction: THREE.Vector3) {
    if (this.bone.parent) {
      const inverseParent = new Matrix4().copy(this.bone.parent.matrixWorld).invert();
      direction.transformDirection(inverseParent);
    }
    return direction;
  }

  /**
   * @private
   */
  _applyWorldPosition() {
    let direction = new Vector3().copy(this._direction);
    let position = new Vector3().copy(this._getWorldPosition());

    const parent = this.bone.parent;

    if (this.bone.parent && parent) {
      this._updateMatrixWorld();
      let inverseParent = new Matrix4().copy(this.bone.parent.matrixWorld).invert();
      transformPoint(position, inverseParent, position);
      this.bone.position.copy(position);

      this._updateMatrixWorld();

      this._worldToLocalDirection(direction);
      //setQuaternionFromDirection(direction, Y_AXIS, this.bone.quaternion);
      this.bone.lookAt(direction)

    } else {
      this.bone.position.copy(position);
    }

    // Update the world matrix so the next joint can properly transform
    // with this world matrix
    this.bone.updateMatrix();
    this._updateMatrixWorld();
  }

  /**
   * @param {IKJoint|THREE.Vector3}
   * @private
   * @return {THREE.Vector3}
   */
  _getWorldDistance(joint: any) {
    return this._worldPosition.distanceTo(joint.isIKJoint ? joint._getWorldPosition() : getWorldPosition(joint, new Vector3()));
  }
}

export default IKJoint;
