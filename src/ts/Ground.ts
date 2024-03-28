import * as THREE from 'three';

const groundVertexShader = `
    varying vec2 vUv;
    void main() {
        vUv = uv * 200.0;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
`;

const groundFragmentShader = `
    varying vec2 vUv;
    uniform sampler2D groundTexture1;
    uniform sampler2D groundTexture2;

    float random(vec2 st) {
        return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
    }

    float noise(vec2 st) {
        vec2 i = floor(st);
        vec2 f = fract(st);

        float a = random(i);
        float b = random(i + vec2(1.0, 0.0));
        float c = random(i + vec2(0.0, 1.0));
        float d = random(i + vec2(1.0, 1.0));

        // Smooth interpolation
        vec2 u = f * f * (3.0 - 2.0 * f);
        return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
    }

    void main() {
        vec2 uv = vUv; // UV coordinates adjusted to make the texture "smaller"
        float n = noise(uv); // Generate Perlin noise for each patch

        // Smoothly blend between the two textures using Perlin noise
        vec4 texture1Color = texture2D(groundTexture1, vUv);
        vec4 texture2Color = texture2D(groundTexture2, vUv);
        float blendFactor = smoothstep(0.1, 0.9, n); // Adjust these values for smoother or more abrupt transitions
        gl_FragColor = mix(texture1Color, texture2Color, blendFactor);
    }
`;

const textureLoader = new THREE.TextureLoader();

const groundTexture1 = textureLoader.load('grass.jpg');
groundTexture1.wrapS = THREE.RepeatWrapping; // Repeat the texture in S direction
groundTexture1.wrapT = THREE.RepeatWrapping; // Repeat the texture in T direction

const groundTexture2 = textureLoader.load('dirt.jpg');
groundTexture2.wrapS = THREE.RepeatWrapping; // Repeat the texture in S direction
groundTexture2.wrapT = THREE.RepeatWrapping; // Repeat the texture in T direction

const groundUniforms = {
    groundTexture1: { value: groundTexture1 },
    groundTexture2: { value: groundTexture2 }
};

export const groundMaterial = new THREE.ShaderMaterial({
    vertexShader: groundVertexShader,
    fragmentShader: groundFragmentShader,
    uniforms: groundUniforms
});
