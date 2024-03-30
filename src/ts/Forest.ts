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

        //console.log(model)

        for (let i = 0; i < amount; i++) {
            const tree = new Tree(model.scene);
            this.add(tree)
            this.trees.push(tree);
        }

        console.log(this)
    }

    update(elapsedTime: number, deltaTime: number) {
        this.trees.forEach((tree) => {
            tree.update(elapsedTime, deltaTime)

            if(tree.isDead) {
                this.trees.splice(this.trees.indexOf(tree), 1)
                this.remove(tree)
            }
        })
    }
}