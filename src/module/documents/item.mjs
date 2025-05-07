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

/**
 * Hook into item update. If the item has spells, grab the spell data
 * from the world and add it to the spell record.
 *
 */
Hooks.on("preUpdateItem", (item, changes, options, userId) => {
  // console.log("Hooks.preUpdateItem", item.type, item, "changes", changes, "options", options, "userId", userId);

  Object.values(changes.system?.spells ?? [])
    .filter((s) => s.id !== s.data?._id)
    .forEach((spell) => {
      spell.data = game.items.get(spell.id);
    });
});
