import { CENTER } from "./constants";

export default class EntityManager {
  private entities: Array<any> = [];
  private static instance: EntityManager;

  constructor() {}

  public static getInstance(): EntityManager {
    if (!EntityManager.instance) {
      EntityManager.instance = new EntityManager();
    }
    return EntityManager.instance;
  }

  add(obj: any) {
    console.log("pushin", obj, this);
    this.entities.push(obj);
  }

  remove(obj: any) {
    if (this.entities.includes(obj)) {
      this.entities.splice(this.entities.indexOf(obj), 1);
    }
  }

  getEntities() {
    return this.entities;
  }

  update(elapsedTime: number, deltaTime: number) {
    this.entities.forEach((entity) => {
      //console.log(this.entities.length)
      entity.update(elapsedTime, deltaTime);
    });
  }
}
