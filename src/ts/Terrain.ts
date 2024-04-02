import * as THREE from 'three';
import { SimplexNoise } from 'three/examples/jsm/Addons.js';


export default class Terrain {
    private noise: SimplexNoise;

    constructor(private width: number, private height: number, private scale: number) {
        this.noise = new SimplexNoise();
    }

    generateTerrain(): number[][] {
        const terrain: number[][] = [];

        for (let y = 0; y < this.height; y++) {
            const row: number[] = [];
            for (let x = 0; x < this.width; x++) {
                // Generate noise values
                const nx = x / this.width - 0.5;
                const ny = y / this.height - 0.5;
                const noiseValue = this.noise.noise(nx * this.scale, ny * this.scale);

                // Map the noise value to a range suitable for terrain heights
                const height = Math.floor(noiseValue * this.height * 0.5 + this.height * 0.5);

                row.push(height);
            }
            terrain.push(row);
        }

        return terrain;
    }
}