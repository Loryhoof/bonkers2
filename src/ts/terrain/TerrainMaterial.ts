import * as THREE from 'three';

const groundVertexShader = `
    #include <fog_pars_vertex>
    
    varying vec2 vUv;
    varying vec3 worldPos;

    void main() {
        #include <begin_vertex>
        #include <project_vertex>
        #include <fog_vertex>

        worldPos = position;

        vUv = uv * 200.0;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
`;

const groundFragmentShader = `
    #include <fog_pars_fragment>

    uniform int baseColorCount;
    uniform vec3 baseColors[1];
    uniform float baseStartHeights[1];
    uniform float minHeight;
    uniform float maxHeight;

    varying vec3 worldPos;

    uniform sampler2D groundTexture1;
    uniform sampler2D groundTexture2;

    float random(vec2 st) {
        return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
    }

    float inverseLerp(float a, float b, float value) {
        return clamp((value - a) / (b - a), 0.0, 1.0);
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

        float heightPercent = inverseLerp(minHeight, maxHeight, worldPos.y);
        vec3 finalColor = vec3(0.0);

        for (int i = 0; i < baseColorCount; i++) {
            float drawStrength = clamp(sign(heightPercent - baseStartHeights[i]), 0.0, 1.0);
            finalColor += mix(vec3(0.0), baseColors[i], drawStrength);
        }

        gl_FragColor = vec4(finalColor, 1.0);
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
    groundTexture2: { value: groundTexture2 },

    baseColorCount: { value: 2 },
    baseColors: { value: [new THREE.Color(.4,0,1), new THREE.Vector3(0.5, 0, 1)] },
    baseStartHeights: { value: [0.2, 0.4] },
    minHeight: { value: 0.0 },
    maxHeight: { value: 15.0 }
};

export const terrainMaterial = new THREE.ShaderMaterial({
    vertexShader: groundVertexShader,
    fragmentShader: groundFragmentShader,
    uniforms: groundUniforms
});
