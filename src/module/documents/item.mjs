import { FT } from "../system/config.mjs";

/**
 * Fantasy Trip Item
 * @extends {Item} Extends the basic Item
 */
export class FTItem extends Item {
  /* ------------------------------------------- */
  /*  Data Preparation                           */
  /* ------------------------------------------- */

  prepareDerivedData() {
    // console.log("FTItem.prepareDerivedData()", this);
    super.prepareDerivedData();

    // Turn on ActiveEffects if equipped, off otherwise, only for inventory items
    if (FT.item.inventory.types.includes(this.type)) {
      this.getEmbeddedCollection("ActiveEffect").forEach((effect) =>
        effect.update({ disabled: this.system.location !== "equipped" })
      );
    }

    // Turn effects on for abilities only if active or always on
    if (this.type === "ability") {
      this.getEmbeddedCollection("ActiveEffect").forEach((effect) => effect.update({ disabled: !this.system.isReady }));
    }
  }

  /* ------------------------------------------- */
  /*  Action & Utility Functions                 */
  /* ------------------------------------------- */

  /**
   * Send item details to chat
   */
  async chat() {
    const content = await foundry.applications.handlebars.renderTemplate(
      `${CONFIG.FT.path}/templates/chat/item.hbs`,
      this
    );
    ChatMessage.create({
      content: content,
      flavor: this.name,
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
    });
  }
}
