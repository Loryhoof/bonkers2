import seedrandom from 'seedrandom';
import * as THREE from 'three';
import { SimplexNoise } from 'three/examples/jsm/math/SimplexNoise.js';
import { MathUtils } from 'three/src/math/MathUtils.js';
import { NormalizeMode } from './enum/NormalizeMode';
import Perlin from './data/perlin';



export default class Noise {


    findMinMaxHeight(noiseMap: number[][]): { min: number, max: number } {
        let min = Infinity;
        let max = -Infinity;

        // Iterate through all height values in the noise map
        for (let x = 0; x < noiseMap.length; x++) {
            for (let y = 0; y < noiseMap[x].length; y++) {
                let height = noiseMap[x][y];
                if (height < min) {
                    min = height; // Update min if current height is smaller
                }
                if (height > max) {
                    max = height; // Update max if current height is larger
                }
            }
        }

        return { min, max };
    }

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
    ): { noiseMap: number[][], minMaxHeight: { min: number, max: number } }  {
        let simplex = new SimplexNoise();
        
        let noiseMap: number[][] = new Array(mapWidth);

        //var noise = new Noise
        
        let prng = seedrandom(seed.toString());

        let perlin = new Perlin(prng())

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
                    
                    let perlinValue = perlin.perlin2(sampleX, sampleY)
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
                    noiseMap[x][y] = MathUtils.inverseLerp(minLocalNoiseHeight, maxLocalNoiseHeight, noiseMap[x][y]);
                }
                else {
                    let normalizedHeight = (noiseMap[x][y] + 1) / (maxPossibleHeight/0.9);
                    noiseMap[x][y] = MathUtils.clamp(normalizedHeight, 0, Infinity);
                }
                
            }
        }

        let minMaxHeight = this.findMinMaxHeight(noiseMap);

        return {noiseMap, minMaxHeight};
    }
}
