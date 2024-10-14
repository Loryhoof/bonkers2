const PLAYER_START_POSITION: { x: number; y: number; z: number } = {
  x: 0,
  y: 2,
  z: 0,
};

function multiplyScalar(
  vector: { x: number; y: number; z: number },
  scalar: number
): { x: number; y: number; z: number } {
  return {
    x: vector.x * scalar,
    y: vector.y * scalar,
    z: vector.z * scalar,
  };
}

// Function to normalize an object with {x, y, z}
function normalize(vector: { x: number; y: number; z: number }): {
  x: number;
  y: number;
  z: number;
} {
  const length = Math.sqrt(
    vector.x * vector.x + vector.y * vector.y + vector.z * vector.z
  );

  if (length === 0) return { ...vector }; // Return unchanged if the length is 0 to avoid division by 0

  return {
    x: vector.x / length,
    y: vector.y / length,
    z: vector.z / length,
  };
}

export { PLAYER_START_POSITION, multiplyScalar, normalize };
