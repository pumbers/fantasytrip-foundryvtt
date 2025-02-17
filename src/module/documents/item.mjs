/**
 * Fantasy Trip Item
 * @extends {Item} Extends the basic Item
 */
export class FTItem extends Item {
  prepareBaseData() {
    // console.log("FTItem.prepareBaseData()", this);
    super.prepareBaseData();
  }

  prepareDerivedData() {
    // console.log("FTItem.prepareDerivedData()", this);
    super.prepareDerivedData();
    // Turn on ActiveEffects if equipped, off otherwise, only for inventory items
    if (CONFIG.FT.item.inventory.types.includes(this.type)) {
      this.getEmbeddedCollection("ActiveEffect").forEach((effect) =>
        effect.update({ disabled: this.system.location !== "equipped" })
      );
    }
  }

  /* ------------------------------------------- */
  /*  Action & Utility Functions                 */
  /* ------------------------------------------- */

  /**
   *
   */
  async use() {
    console.log("use", this._id, this.name);
  }

  /**
   * Send item details to chat
   */
  async chat() {
    const content = await renderTemplate(`${CONFIG.FT.path}/templates/chat/item.hbs`, this.system);
    ChatMessage.create({
      content: content,
      flavor: this.name,
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
    });
  }
}
