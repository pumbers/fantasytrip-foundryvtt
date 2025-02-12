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
    console.log("FTCharacter.prepareDerivedData()", this);
    super.prepareDerivedData();
    const system = this.system;

    // Calculate Adjusted Attribute Values
    system.st.value = Math.max(system.st.max - system.damage - system.fatigue, 0);

    // Calculate ST Fatigue/Damage Thresholds
    system.st.amber = Math.ceil(system.st.max / 2);
    system.st.red = Math.ceil(system.st.max / 5);

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
      .filter((item) => ["item", "weapon", "armour"].includes(item.type))
      .filter((item) => ["carried", "equipped"].includes(item.system.location))
      .reduce((load, item) => load + item.system.wt, 0);
    const level = capacity.findIndex((val) => val > load);

    system.encumbrance = { capacity, load, level };
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
