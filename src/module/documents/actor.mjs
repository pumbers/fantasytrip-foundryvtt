import * as Dice from "../util/dice.mjs";

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
      .filter((item) => CONFIG.FT.item.inventory.encumbering.includes(item.system.location))
      .reduce((load, item) => load + item.system.totalWt, 0);
    const level = capacity.findIndex((val) => val > load);

    system.encumbrance = { capacity, load, level };

    // Apply Encumbrance to Stats
    switch (system.encumbrance.level) {
      case 3:
        system.ma.walk.value = Math.min(system.ma.walk.max, 8);
        system.ma.fly.value = Math.min(system.ma.fly.max, 8);
        system.ma.swim.value = 0;
        break;
      case 4:
        system.ma.walk.value = Math.min(system.ma.walk.max, 6);
        system.ma.fly.value = Math.min(system.ma.fly.max, 6);
        system.ma.swim.value = 0;
        system.dx.value = Math.max(system.dx.max - 1, 0);
        break;
      case 5:
        system.ma.walk.value = Math.min(system.ma.walk.max, 4);
        system.ma.fly.value = Math.min(system.ma.fly.max, 4);
        system.ma.swim.value = 0;
        system.dx.value = Math.max(system.dx.max - 2, 0);
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
          .reduce((wt, item) => wt + item.system.wt, 0);
        container.system.remaining = container.system.capacity - wt;
      });

    // Calculate attack combat stats
    Array.from(this.items)
      .filter((item) => item.system.hasAttacks)
      .forEach((weapon) => {
        weapon.system.attacks.forEach((attack) => {
          // To Hit
          const talent = this.getEmbeddedDocument("Item", attack.talent);
          attack.attribute = !!talent ? talent.system.defaultAttribute : "dx.value";
          attack.dice = weapon.type === "spell" ? 3 : !!talent ? 3 : 4;
          attack.minSTMod = Math.min(this.system.st.max - attack.minST, 0);
          attack.attackTypeMod = this.system.dx.modFor[attack.type];
          attack.attributeMod = this.system.dx.mod;
          attack.toHit =
            foundry.utils.getProperty(this.system, attack.attribute) +
            attack.toHitMod +
            attack.minSTMod +
            attack.attackTypeMod +
            attack.attributeMod;

          // Damage
          attack.stDamageMod = Math.ceil(Math.min(this.system.st.max - attack.minST, 0) / 2);
          attack.damage = Dice.simplifyRollFormula(attack.baseDamage?.concat("+", attack.stDamageMod));
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
  }

  /* ------------------------------------------- */
  /*  Action & Utility Functions                 */
  /* ------------------------------------------- */

  /**
   * Send character details to chat
   */
  async chat() {
    const content = await renderTemplate(`${CONFIG.FT.path}/templates/chat/character.hbs`, this);
    ChatMessage.create({
      content: content,
      flavor: this.name,
      speaker: ChatMessage.getSpeaker({ actor: this }),
    });
  }
}
