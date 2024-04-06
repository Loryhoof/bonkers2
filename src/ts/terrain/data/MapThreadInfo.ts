type Action<T> = (param: T) => void;

export default class MapThreadInfo<T> {
    public readonly callback: Action<T>;
    public readonly parameter: T;

    constructor(callback: Action<T>, parameter: T) {
        this.callback = callback;
        this.parameter = parameter;
    }
}
