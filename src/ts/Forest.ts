import Tree from "./Tree";
import { loadGLB, randomBetween } from "./Utils";
import * as THREE from 'three'

export default class Forest extends THREE.Object3D {
    private trees: Tree[];

    constructor(amount: number) {
        super()
        this.trees = [];
        this.initializeForest(amount)
    }

    async initializeForest(amount: number) {
        const model = await loadGLB('models/tree.glb') as any

        console.log(model)

        for (let i = 0; i < amount; i++) {
            const tree = new Tree(model.scene);
            tree.scale.set(1, randomBetween(0.4, 1.3), 1)
            tree.position.set(randomBetween(-50, 50), 0.5, randomBetween(-50, 50))
            this.add(tree)
            this.trees.push(tree);
        }
    }
}