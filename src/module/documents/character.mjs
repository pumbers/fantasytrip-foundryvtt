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

  // prepareDerivedData() {
  //   console.log("FTCharacter.prepareDerivedData()", this);
  //   super.prepareDerivedData();
  // }

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
