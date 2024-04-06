import seedrandom from 'seedrandom';
import * as THREE from 'three';
import { SimplexNoise } from 'three/examples/jsm/math/SimplexNoise.js';
import { clamp, inverseLerp } from 'three/src/math/MathUtils.js';
import { NormalizeMode } from './enum/NormalizeMode';

export default class Noise {

    generateNoiseMap(
        mapWidth: number, 
        mapHeight: number,
        seed: number, 
        scale: number,
        octaves: number,
        persistance: number,
        lacunarity: number,
        offset: THREE.Vector2,
        normalizeMode: NormalizeMode
    ): number[][] {
        let simplex = new SimplexNoise();
        
        let noiseMap: number[][] = new Array(mapWidth);
        
        // Seeded pseudo-random number generator
        let prng = seedrandom(seed.toString());

        let octaveOffsets: THREE.Vector2[] = [];

        let maxPossibleHeight = 0
        let amplitude = 1;
        let frequency = 1;

        for (let i = 0; i < octaves; i++) {
            let offsetX = prng() * 200000 - 100000 + offset.x;
            let offsetY = prng() * 200000 - 100000 - offset.y;
            octaveOffsets.push(new THREE.Vector2(offsetX, offsetY));

            maxPossibleHeight += amplitude
            amplitude *= persistance
        }

        if (scale <= 0) {
            scale = 0.0001;
        }

        let maxLocalNoiseHeight = -Infinity;
        let minLocalNoiseHeight = Infinity;

        

        let halfWidth = mapWidth / 2;
        let halfHeight = mapHeight / 2;

        // Generate the noise map
        for (let x = 0; x < mapWidth; x++) {
            noiseMap[x] = [];
            for (let y = 0; y < mapHeight; y++) {
                amplitude = 1
                frequency = 1
                let noiseHeight = 0;
        
                for (let i = 0; i < octaves; i++) {
                    let sampleX = (x - halfWidth + octaveOffsets[i].x) / scale * frequency;
                    let sampleY = (y - halfHeight + octaveOffsets[i].y) / scale * frequency;
                    
                    let perlinValue = simplex.noise(sampleX, sampleY); // Using Simplex noise
                    noiseHeight += perlinValue * amplitude;
        
                    amplitude *= persistance;
                    frequency *= lacunarity;
                }
        
                if (noiseHeight > maxLocalNoiseHeight) {
                    maxLocalNoiseHeight = noiseHeight;
                } else if (noiseHeight < minLocalNoiseHeight) {
                    minLocalNoiseHeight = noiseHeight;
                }
        
                noiseMap[x][y] = noiseHeight;
            }
        }

        // Normalize the noise map
        for (let x = 0; x < mapWidth; x++) {
            for (let y = 0; y < mapHeight; y++) {
                if(normalizeMode == NormalizeMode.Local) {
                    //[x][y] = (noiseMap[x][y] - minLocalNoiseHeight) / (maxLocalNoiseHeight - minLocalNoiseHeight);
                    [x][y] = inverseLerp(minLocalNoiseHeight, maxLocalNoiseHeight, noiseMap[x][y])
                }
                else {
                    let normalizedHeight = (noiseMap[x][y] + 1) / (maxPossibleHeight)
                    noiseMap[x][y] = THREE.MathUtils.clamp(normalizedHeight, 0, Infinity)
                }
            }
        }

        return noiseMap;
    }
}
