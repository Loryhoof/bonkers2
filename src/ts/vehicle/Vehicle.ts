import Player from "../Player";

export default interface Vehicle {
    use(player: Player): void
    update(elapsedTime: number, deltaTime: number): void
}