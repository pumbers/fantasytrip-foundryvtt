import { FT } from "../system/config.mjs";

/*****************************************************************************
 * Fantasy Trip Item
 *****************************************************************************/

export class FTItem extends foundry.documents.Item {
  /**
   * Action & Utility Functions
   */

  async chat() {
    const content = await foundry.applications.handlebars.renderTemplate(
      `${FT.path}/templates/chat/item.hbs`,
      this,
    );
    ChatMessage.create({
      content: content,
      flavor: this.name,
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
    });
  }
}
