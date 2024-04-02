import * as THREE from 'three';

const skyVertexShader = `
    #include <fog_pars_vertex>
    varying vec3 vWorldPosition;
    void main() {
        #include <begin_vertex>
        #include <project_vertex>
        #include <fog_vertex>
        vec4 worldPosition = modelMatrix * vec4(position, 1.0);
        vWorldPosition = worldPosition.xyz;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
`;

const skyFragmentShader = `
    #include <fog_pars_fragment>
    uniform vec3 topColor;
    uniform vec3 bottomColor;
    uniform float offset;
    uniform float exponent;
    varying vec3 vWorldPosition;
    void main() {
        float h = normalize(vWorldPosition + offset).y;
        gl_FragColor = vec4(mix(bottomColor, topColor, max(pow(max(h, 0.0), exponent), 0.0)), 1.0);
        #include <fog_fragment>
    }
`;

// Create the shader material
const skyUniforms = {
    topColor: { value: new THREE.Color(0xBDDBFF) },
    bottomColor: { value: new THREE.Color(0xffffff) },
    offset: { value: 33 },
    exponent: { value: 0.6 }
};

const skyMaterial = new THREE.ShaderMaterial({
    vertexShader: skyVertexShader,
    fragmentShader: skyFragmentShader,
    uniforms: THREE.UniformsUtils.merge( [
        THREE.UniformsLib[ 'fog' ], skyUniforms
] ),
fog: true,
    side: THREE.BackSide // Render the material on the back side of the mesh
});


// Create a sphere geometry to represent the sky
const skyGeometry = new THREE.SphereGeometry(1000, 0, 0);

// Create the sky mesh using the sphere geometry and the shader material
export const sky = new THREE.Mesh(skyGeometry, skyMaterial);