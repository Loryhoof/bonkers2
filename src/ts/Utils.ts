import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as THREE from 'three'
import Interactable from '../interfaces/Interactable';
import { FBXLoader } from 'three/examples/jsm/Addons.js';

const gltfLoader = new GLTFLoader();
const fbxLoader = new FBXLoader();

export const randomBetween = (min: number, max: number) => {
    return Math.random() * (max - min) + min;
}

export const randomFrom = (arr: Array<any>) => {
    return arr[Math.floor(Math.random()*arr.length)];
}

export const isApproximatelyEqual = (value: number, target: number, tolerance: number) => {
    return Math.abs(value - target) <= tolerance;
}

export const getWorldPos = (localPosition: THREE.Vector3, worldParent: THREE.Group) => {
    return localPosition.clone().applyMatrix4(worldParent.matrixWorld);
}

export const loadGLB = async (modelPath: string) => {
    return new Promise((resolve, reject) => {
        gltfLoader.load(
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

export const loadFBX = async (modelPath: string) => {
    return new Promise((resolve, reject) => {
        fbxLoader.load(
            modelPath,
            function (fbx) {
                resolve(fbx);
            },
            // Optional progress callback
            function (xhr) {
                console.log((xhr.loaded / xhr.total * 100) + '% loaded');
            },
            // Optional error callback
            function (error) {
                reject(error);
                console.error('Error loading FBX model', error);
            }
        );
    });
};

export const createTextureFrom2DArray = (data: number[][]): THREE.Texture => {
    const width = data[0].length;
    const height = data.length;

    // Convert 2D array to 1D array
    const pixelData = new Uint8ClampedArray(width * height * 4); // RGBA

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const value = data[y][x] * 255; // Scale value to [0, 255]
            const index = (y * width + x) * 4; // Calculate index for RGBA
            pixelData[index] = value; // Red
            pixelData[index + 1] = value; // Green
            pixelData[index + 2] = value; // Blue
            pixelData[index + 3] = 255; // Alpha (fully opaque)
        }
    }

    // Create ImageData object
    const imageData = new ImageData(pixelData, width, height);

    // Create canvas and draw the image data
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d') as any;
    canvas.width = width;
    canvas.height = height;
    context.putImageData(imageData, 0, 0);

    // Create Three.js texture from canvas
    const texture = new THREE.Texture(canvas);
    texture.needsUpdate = true; // Ensure texture is updated

    return texture;
}

export const createTextureFromColorMap = (colorMap: any, width: number, height: number) => {
    
    const imageData = new ImageData(colorMap, width, height);

    // Create canvas and draw the image data
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d') as any;
    canvas.width = width;
    canvas.height = height;
    context.putImageData(imageData, 0, 0);

    // Create Three.js texture from canvas
    const texture = new THREE.Texture(canvas);
    texture.needsUpdate = true; // Ensure texture is updated

    return texture;
}

export const inverseLerp = (a: number, b: number, value: number): number => {
    if (a != b) {
        return (value - a) / (b - a);
    } else {
        return 0;
    }
}