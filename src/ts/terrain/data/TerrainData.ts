import * as THREE from 'three'

export default class TerrainData {

    public meshHeightMulitplier: number
    public uniformScale: number

    public curve: THREE.CatmullRomCurve3

    public minHeight: number = 0
    public maxHeight: number = 100

    constructor(
        meshHeightMulitplier: number,
        scale: number
    ) {
        this.meshHeightMulitplier = meshHeightMulitplier
        this.uniformScale = scale

        this.curve = new THREE.CatmullRomCurve3([
            new THREE.Vector3(0, 0, 0),      // Control point 1
            new THREE.Vector3(0.5, 0.3, 0),  // Control point 2
            new THREE.Vector3(1, 1, 0)       // Control point 3
        ]);

        //console.log(this.meshHeightMulitplier, this.uniformScale)
    }

    setHeight(min: number, max: number){
        this.minHeight = min * this.meshHeightMulitplier * this.uniformScale
        this.maxHeight = max * this.meshHeightMulitplier * this.uniformScale
    }

    interpolateHeight(minHeight: number, maxHeight: number, value: number) {
        // Ensure value is clamped between 0 and 1
        value = THREE.MathUtils.clamp(value, 0, 1);
        
        // Evaluate the curve at the given parameter value
        const curveHeight = this.curve.getPointAt(value).y;
        
        // Interpolate height between minHeight and maxHeight based on curveHeight
        return minHeight + (maxHeight - minHeight) * curveHeight;
    }
}