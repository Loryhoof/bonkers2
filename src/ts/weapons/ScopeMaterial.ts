import * as THREE from 'three'

// Define the vertex shader
const vertexShader = `
    varying vec2 vUv;

    void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
`;

// Define the fragment shader
// Define the fragment shader
const fragmentShader = `
    varying vec2 vUv;
    uniform sampler2D texture;
    uniform float radius;

    void main() {
        vec2 uv = vUv - 0.5; // Center UV coordinates
        //float dist = length(uv);
        //if (dist > radius) {
        //    discard; // Discard pixels outside the circular mask
        //} else {
        //    gl_FragColor = texture2D(texture, vUv); // Sample texture for pixels inside the mask
        //}

        gl_FragColor = texture2D(texture, vUv);
        //gl_FragColor = vec4(0.5, 0.1, 0.1, 1);
    }
`;


// Create shader material
const uniforms = {
    texture: { value: null },
    radius: { value: 0.5 } // Adjust the radius as needed
};
export const scopeMaterial = new THREE.ShaderMaterial({
    uniforms,
    vertexShader,
    fragmentShader,
    transparent: true
});


