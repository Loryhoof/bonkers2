export default class FalloffGenerator {

    public static generateFalloffMap(size: number) {
        const map = new Array(size);

        for (let i = 0; i < size; i++) {
            map[i] = new Array(size); // Initialize each map[i] as an array
            for (let j = 0; j < size; j++) {
                let x = i / size * 2 - 1;
                let y = j / size * 2 - 1;
                
                let value = Math.max(Math.abs(x), Math.abs(y));
                map[i][j] = this.evaluate(value);
            }
        }
        
        return map;
    }

    static evaluate(value: number) {
        let a = 3
        let b = 2.2

        return Math.pow(value, a) / (Math.pow(value, a) + Math.pow(b-b*value, a))
    }
}
