import * as THREE from 'three';


//groundTexture1.repeat = new THREE.Vector2(2,2)

const oceanVertexShader = `
    varying vec2 vUv;
    varying vec3 vNormal;
    uniform float time;
    uniform float textureScale; // Add a uniform for texture scale

    void main() {
        vUv = uv * textureScale; // Scale the UV coordinates
        vNormal = normal;
        vec3 newPosition = position;
        newPosition.z += sin(position.x * 0.75 + time * 2.0) * 0.1; // Wave effect
        gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
    }
`;

const oceanFragmentShader = `
    varying vec2 vUv;
    varying vec3 vNormal;
    uniform sampler2D oceanTexture;
    uniform float depth;

    void main() {
        // Calculate fresnel effect for more realistic appearance
        float fresnel = 0.5 + 0.5 * pow(1.0 - dot(normalize(vNormal), vec3(0.0, 0.0, 1.0)), 3.0);
        
        // Apply depth-based color
        vec3 baseColor = texture2D(oceanTexture, vUv).rgb;
        vec3 finalColor = mix(baseColor, baseColor * 0.4, depth);

        // Apply fresnel effect
        finalColor *= fresnel;

        gl_FragColor = vec4(finalColor, 1.0);
    }
`;

export default class Ocean {

    public oceanMaterial: THREE.ShaderMaterial

    constructor() {

        const textureLoader = new THREE.TextureLoader();

        const oceanTexture = textureLoader.load('ocean.jpg');
        oceanTexture.wrapS = THREE.RepeatWrapping;
        oceanTexture.wrapT = THREE.RepeatWrapping;

        this.oceanMaterial = new THREE.ShaderMaterial({
            vertexShader: oceanVertexShader,
            fragmentShader: oceanFragmentShader,
            uniforms: {
                time: { value: 0 },
                oceanTexture: { value: oceanTexture },
                depth: { value: 0.0 }, // Depth parameter to control color variation
                textureScale: { value: 50.0 } // Set initial texture scale
            }
        });
    }
    

    update() {
        this.oceanMaterial.uniforms.time.value += 0.01;
    }
}
