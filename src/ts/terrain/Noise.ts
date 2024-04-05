import seedrandom from 'seedrandom';
import * as THREE from 'three';
import { SimplexNoise } from 'three/examples/jsm/Addons.js';
import { ImprovedNoise } from 'three/examples/jsm/Addons.js';


export default class Noise {

    generateNoiseMap(
        mapWidth: number, 
        mapHeight: number,
        seed: number, 
        scale: number,
        octaves: number,
        persistance: number,
        lacunarity: number,
        offset: THREE.Vector2
    ): number[][] {
        let simplex = new SimplexNoise();
        let ns = new ImprovedNoise()
        
        let noiseMap: number[][] = [];

        let prng = seedrandom(seed.toString())

        function prngNext(min: number, max: number): number {
            // Calculate the range and generate a random number within the range
            const range = max - min;
            return Math.floor(prng() * range) + min;
        }

        let octaveOffsets = []

        for (let i = 0; i < octaves; i++) {
            let offsetX = prngNext(-100000, 100000) + offset.x
            let offsetY = prngNext(-100000, 100000) + offset.y
            octaveOffsets[i] = new THREE.Vector2(offsetX, offsetY)
            console.log(octaveOffsets[i])
        }

        if (scale <= 0) {
            scale = 0.0001;
        }

        let maxNoiseHeight = -Infinity;
        let minNoiseHeight = Infinity;

        let halfWidth = mapWidth / 2
        let halfHeight = mapHeight / 2

        // Generate the noise map
        for (let y = 0; y < mapHeight; y++) {
            noiseMap[y] = [];
            for (let x = 0; x < mapWidth; x++) {

                let amplitude = 1;
                let frequency = 1;
                let noiseHeight = 0;

                for (let i = 0; i < octaves; i++) {
                    let sampleX = (x - halfWidth) / scale * frequency + octaveOffsets[i].x
                    let sampleY = (y - halfHeight) / scale * frequency + octaveOffsets[i].y
                    
                    //let perlinValue = simplex.noise(sampleX, sampleY) * 2 - 1; 
                    let perlinValue = ns.noise(sampleX, sampleY, 0) * 2 - 1; 
                    noiseHeight += perlinValue * amplitude;

                    amplitude *= persistance;
                    frequency *= lacunarity;
                }

                if (noiseHeight > maxNoiseHeight) {
                    maxNoiseHeight = noiseHeight;
                } else if (noiseHeight < minNoiseHeight) {
                    minNoiseHeight = noiseHeight;
                }

                noiseMap[y][x] = noiseHeight;
            }
        }

        // Normalize the noise map
        for (let y = 0; y < mapHeight; y++) {
            for (let x = 0; x < mapWidth; x++) {
                // Normalize the value to the range [0, 1]
                noiseMap[y][x] = (noiseMap[y][x] - minNoiseHeight) / (maxNoiseHeight - minNoiseHeight);
            }
        }

        return noiseMap;
    }
}
