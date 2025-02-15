/**
 * Fantasy Trip Actor
 * @extends {Actor} Extends the basic Actor
 */
export class FTCharacter extends Actor {
  /* ------------------------------------------- */
  /*  Properties                                 */
  /* ------------------------------------------- */

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

  // prepareBaseData() {
  //   console.log("FTCharacter.prepareBaseData()", this);
  //   super.prepareBaseData();
  // }

  // prepareEmbeddedDocuments() {
  //   console.log("FTCharacter.prepareEmbeddedDocuments()", this);
  //   super.prepareEmbeddedDocuments();
  // }

  prepareDerivedData() {
    // console.log("FTCharacter.prepareDerivedData()", this);
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
      .filter((item) => CONFIG.FT.item.inventory.types.includes(item.type))
      .filter((item) => CONFIG.FT.item.inventory.encumbering.includes(item.system.location))
      .reduce((load, item) => load + item.system.totalWt, 0);
    const level = capacity.findIndex((val) => val > load);

    system.encumbrance = { capacity, load, level };

    // Apply Encumbrance to Stats
    switch (system.encumbrance.level) {
      case 3:
        system.ma.value = Math.min(system.ma.max, 8);
        break;
      case 4:
        system.ma.value = Math.min(system.ma.max, 6);
        system.dx.value = Math.max(system.dx.max - 1, 0);
        break;
      case 5:
        system.ma.value = Math.min(system.ma.max, 4);
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
        container.system.remaining = (container.system.capacity - wt).toFixed(1);
      });
  }

  /* ------------------------------------------- */
  /*  Action & Utility Functions                 */
  /* ------------------------------------------- */

  /**
   * Send character details to chat
   */
  async chat() {
    const content = await renderTemplate(`${CONFIG.FT.path}/templates/chat/character.hbs`, this.data);
    ChatMessage.create({
      content: content,
      flavor: this.name,
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
    });
  }
}
