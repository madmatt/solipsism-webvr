var ee = require('event-emitter');

/**
 * @author dmarcos / https://github.com/dmarcos
 * @author mrdoob / http://mrdoob.com
 */

var VRControls = function (THREE, object, onError) {
  var scope = this;
  ee(this);

  var vrInput;
  var standingMatrix = new THREE.Matrix4();

  if (navigator.getVRDisplays) {
    navigator.getVRDisplays().then(function (devices) {
      if(devices.length > 0) {
        vrInput = devices[0];
      } else {
        if (onError) onError('VR input not available.');
      }
    });
  }

  /**
   * Return a promise that resolves to true if this client has a VR Display
   */
  this.fetchHasVRDisplay = function() {
    if (navigator.getVRDisplays) {
      return navigator.getVRDisplays().then(function (devices) {
        return (devices.length > 0);
      });

    } else {
      return Promise.resolve(false);
    }
  };

  /**
   * Return a promise that resolves to true if this client has a roomscale VR Display
   */
  this.fetchHasRoomscaleVRDisplay = function() {
    if (navigator.getVRDisplays) {
      return navigator.getVRDisplays().then(function (devices) {
        return (devices.length > 0) && devices[0].stageParameters;
      });

    } else {
      return Promise.resolve(false);
    }
  };

  this.getStandingMatrix = function () {
    return standingMatrix;
  };

  this.update = function (worldLocationMatrix, scale) {
    if (vrInput) {
      var pose = vrInput.getPose();

      if (pose.orientation !== null) {
        object.quaternion.fromArray(pose.orientation);
      }

      if (pose.position !== null) {
        object.position.fromArray(pose.position);

      } else {
        object.position.set(0, 0, 0);
      }

      if (vrInput.stageParameters) {
        object.updateMatrix();
        standingMatrix.fromArray(vrInput.stageParameters.sittingToStandingTransform);
        object.applyMatrix( standingMatrix );
      }

      object.position.setFromMatrixPosition(object.matrix);
      object.position.multiplyScalar(scale);

      if(worldLocationMatrix) {
        object.updateMatrix();
        object.applyMatrix(worldLocationMatrix);
      }

      var position = new THREE.Vector3();
      var orientation = new THREE.Quaternion();
      var scaleVector = new THREE.Vector3(1, 1, 1);
      object.matrix.decompose(position, orientation, scaleVector);

      this.emit('updatePose', {
        position: [position.x, position.y, position.z],
        quaternion: [orientation.x, orientation.y, orientation.z, orientation.w],
        velocity: pose.linearVelocity ? [pose.linearVelocity.x, pose.linearVelocity.y, pose.linearVelocity.z] : [0, 0, 0],
        angularVelocity: pose.angularVelocity ? [pose.angularVelocity.x, pose.angularVelocity.y, pose.angularVelocity.z] : [0, 0, 0],
        scale: scale,
        visible: true,
      });
    }
  };

  this.resetPose = function () {
    if (vrInput && vrInput.resetPose !== undefined) {
      vrInput.resetPose();
    }
  };

  this.dispose = function () {
    vrInput = null;
  };
};

module.exports = VRControls;
