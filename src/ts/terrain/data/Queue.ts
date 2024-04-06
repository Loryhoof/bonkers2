export default class Queue<T> {
    private elements: T[] = [];

    enqueue(element: T): void {
        this.elements.push(element);
    }

    dequeue(): T | undefined {
        return this.elements.shift();
    }

    peek(): T | undefined {
        return this.elements.length > 0 ? this.elements[0] : undefined;
    }

    isEmpty(): boolean {
        return this.elements.length === 0;
    }

    size(): number {
        return this.elements.length;
    }

    clear(): void {
        this.elements = [];
    }
}
