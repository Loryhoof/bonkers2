import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

const loader = new GLTFLoader();

export const randomBetween = (min: number, max: number) => {
    return Math.random() * (max - min) + min;
}

export const randomFrom = (arr: Array<any>) => {
    return arr[Math.floor(Math.random()*arr.length)];
}

export const loadGLB = async (modelPath: string) => {
    return new Promise((resolve, reject) => {
        loader.load(
            modelPath,
            function (gltf) {
                resolve(gltf);
            },
            // Optional progress callback
            function (xhr) {
                console.log((xhr.loaded / xhr.total * 100) + '% loaded');
            },
            // Optional error callback
            function (error) {
                reject(error);
                console.error('Error loading GLB model', error);
            }
        );
    });
};