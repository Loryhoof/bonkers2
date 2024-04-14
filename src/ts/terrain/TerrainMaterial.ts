import * as THREE from 'three';


const textureLoader = new THREE.TextureLoader();

const groundTexture1 = textureLoader.load('grass2.jpg');
groundTexture1.wrapS = THREE.RepeatWrapping; // Repeat the texture in S direction
groundTexture1.wrapT = THREE.RepeatWrapping; // Repeat the texture in T direction

const groundTexture2 = textureLoader.load('dirt.jpg');
groundTexture2.wrapS = THREE.RepeatWrapping; // Repeat the texture in S direction
groundTexture2.wrapT = THREE.RepeatWrapping; // Repeat the texture in T direction

const textures = [
    groundTexture2,
    groundTexture1,
];

const colors = [
    new THREE.Color(0x2ea8ff), // lowest
    new THREE.Color(0x85a832),
    new THREE.Color(0x694825), 
    new THREE.Color(0x66625b),
    new THREE.Color(0xffffff) // highest
];

const heights = [
    0.5, 
    0.6
]; // Adjust these heights as needed

const groundVertexShader = `
    #include <fog_pars_vertex>


    varying vec2 vUv;
    varying float heightPercent;

    uniform float minHeight;
    uniform float maxHeight;

    void main() {
        #include <begin_vertex>
        #include <project_vertex>
        #include <fog_vertex>

        vUv = uv * 200.0;
        heightPercent = (position.y - minHeight) / (maxHeight - minHeight);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
`;

const groundFragmentShader = `

    #include <fog_pars_fragment>
    varying vec2 vUv;
    varying float heightPercent;


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

    

    uniform sampler2D textureLow;
    uniform sampler2D textureHigh;

    uniform float heights[${heights.length}];

    void main() {

        vec2 uv = vUv; // UV coordinates adjusted to make the texture "smaller"
        float n = noise(uv); // Generate Perlin noise for each patch

        vec4 colorLow = texture2D(textureLow, vUv);
        vec4 colorHigh = texture2D(textureHigh, vUv);
    
        vec4 finalColor;

        //float blendFactor = smoothstep(0.1, 0.9, n); // Adjust these values for smoother or more abrupt transitions
        // gl_FragColor = mix(texture1Color, texture2Color, blendFactor);

        if (heightPercent < 0.4) {
            finalColor = mix(colorLow, colorHigh, heightPercent * 2.0);
        } else {
            finalColor = mix(colorHigh, colorLow, (heightPercent - 0.5) * 2.0);
        }
    
        gl_FragColor = finalColor;

        #include <fog_fragment>
    }
`;






const groundUniforms = {
    colors: { value: colors },
    heights: { value: heights },
    minHeight: { value: 0.0 },
    maxHeight: { value: 25.0 },
    textureLow: { value: textures[0] },
    textureHigh: { value: textures[1] }
};

export const terrainMaterial = new THREE.ShaderMaterial({
    vertexShader: groundVertexShader,
    fragmentShader: groundFragmentShader,
    uniforms: THREE.UniformsUtils.merge( [
        THREE.UniformsLib[ 'fog' ], groundUniforms
] ),
fog: true
});
