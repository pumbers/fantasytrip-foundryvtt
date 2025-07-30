import { FT } from "../system/config.mjs";

/**
 * Fantasy Trip Actor
 *
 * @extends {Actor} Extends the basic Actor
 */
export class FTActor extends Actor {
  /* ------------------------------------------- */
  /*  Data Preparation                           */
  /* ------------------------------------------- */

  // Call sequence is:
  // ActorDataModel.prepareBaseData()
  // Actor.prepareBaseData()
  // Actor.prepareEmbeddedDocuments()
  // ... ItemData.prepareBaseData()
  // ... Item.prepareBaseData()
  // ... ItemData.prepareDerivedData()
  // ... Item.prepareDerivedData()
  // ... Actor.applyActiveEffects()
  // ActorDataModel.prepareDerivedData()
  // Actor.prepareDerivedData()

  prepareDerivedData() {
    // console.log("FTActor.prepareDerivedData()", this);
    super.prepareDerivedData();
    const system = this.system;

    // Calculate Encumbrance
    const capacity = [
      system.st.max * 2,
      system.st.max * 3,
      system.st.max * 4,
      system.st.max * 6,
      system.st.max * 8,
      system.st.max * 10,
      system.st.max * 15,
    ];

    const load = Array.from(this.items)
      .filter((item) => item.type === "equipment")
      .filter((item) => FT.item.inventory.encumbering.includes(item.system.location))
      .reduce((load, item) => load + item.system.totalWt, 0);

    const level = capacity.findIndex((val, index) => val > load || index === capacity.length - 1);

    system.encumbrance = { capacity, load, level };

    // Apply Encumbrance to Stats
    switch (system.encumbrance.level) {
      case 3:
        system.ma.walk.value = Math.min(system.ma.walk.value, 8);
        system.ma.fly.value = Math.min(system.ma.fly.value, 8);
        system.ma.swim.value = 0;
        break;
      case 4:
        system.ma.walk.value = Math.min(system.ma.walk.value, 6);
        system.ma.fly.value = Math.min(system.ma.fly.value, 6);
        system.ma.swim.value = 0;
        system.dx.value = Math.max(system.dx.value - 1, 0);
        break;
      case 5:
        system.ma.walk.value = Math.min(system.ma.walk.value, 4);
        system.ma.fly.value = Math.min(system.ma.fly.value, 4);
        system.ma.swim.value = 0;
        system.dx.value = Math.max(system.dx.value - 2, 0);
        break;
      default:
        break;
    }

    // Calculate container remaining capacity
    Array.from(this.items)
      .filter((item) => item.system.isContainer)
      .forEach((container) => {
        const wt = this.items
          .filter((item) => item.system.container === container._id)
          .reduce((wt, item) => wt + item.system.totalWt, 0);
        container.system.remaining = container.system.capacity - wt;
      });

    // Calculate attack combat stats
    Array.from(this.items)
      .filter((item) => item.system.hasAttacks)
      .forEach((weapon) => {
        weapon.system.attacks.forEach((attack) => {
          // To Hit
          const talent = this.getEmbeddedDocument("Item", attack.talent);
          attack.dice = weapon.type === "equipment" && !talent ? 4 : 3;
          attack.minSTMod = Math.min(this.system.st.max - attack.minST, 0);
          attack.attackTypeMod = this.system.dx.modFor[attack.type];
          attack.toHit = this.system.dx.value + attack.minSTMod + attack.toHitMod + attack.attackTypeMod;

          // Adjust Damage based on weapon min ST
          attack.stDamageMod = Math.floor(Math.min(system.st.max - attack.minST, 0) / 2);
          attack.finalDamage = attack.baseDamage?.concat(
            attack.stDamageMod <= 0 ? "" : "+",
            attack.stDamageMod === 0 ? "" : attack.stDamageMod
          );

          // Calculate worst initiative DX using readied weapons
          if (weapon.system.isReady) {
            this.system.initiative.dx = Math.min(this.system.initiative.dx, this.system.dx.value + attack.minSTMod);
          }
        });
      });

    // Calculate talent & spell costs
    system.totalIQCost = { talents: 0, spells: 0 };
    this.items.forEach((item) => {
      switch (item.type) {
        case "talent":
          item.system.actualIQCost = this.system.type === "hero" ? item.system.iqCost : item.system.iqCost * 2;
          system.totalIQCost.talents += item.system.actualIQCost;
          break;
        case "spell":
          item.system.actualIQCost = this.system.type === "wizard" ? item.system.iqCost : item.system.iqCost * 3;
          system.totalIQCost.spells += item.system.actualIQCost;
          break;
        default:
          item.system.actualIQCost = item.system.iqCost;
          break;
      }
    });

    // Apply status effects if character is down or dead
    this.toggleStatusEffect("unconscious", { active: this.system.isDown });
    this.toggleStatusEffect("dead", { active: this.system.isDead });
  }

  /* ------------------------------------------- */
  /*  Action & Utility Functions                 */
  /* ------------------------------------------- */

  /**
   * Send character details to chat
   */
  chat(speaker) {
    // console.log("chat()", this);
    foundry.applications.handlebars.renderTemplate(`${FT.path}/templates/chat/actor.hbs`, this).then((content) =>
      ChatMessage.create({
        content: content,
        flavor: this.name,
        speaker,
      })
    );
  }
}
