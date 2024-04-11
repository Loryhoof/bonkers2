import Bullet from "../ts/Bullet";
import UsableItem from "./UsableItem";

export default interface Firearm extends UsableItem {
    shoot(): void;
    reload(bullets: Bullet): void;
    ads(isOn: boolean): void;
    setHold(bool: boolean): void;
}