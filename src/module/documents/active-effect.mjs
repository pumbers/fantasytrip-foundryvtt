import { FT } from "../system/config.mjs";

/*****************************************************************************
 * Fantasy Trip Active Effect
 *****************************************************************************/

export class FTActiveEffect extends foundry.documents.ActiveEffect {
  /**
   * Suppress effects on items that are not currently in use, without changing
   * the stored disabled flag (which remains a manual, user-controlled toggle).
   * @inheritdoc
   */
  get isSuppressed() {
    if (super.isSuppressed) return true;

    const item = this.parent;
    if (!(item instanceof foundry.documents.Item)) return false;

    // Inventory items only apply effects when in a tagged location
    if (FT.item.inventory.types.includes(item.type)) {
      return !item.system.applyEffectsWhen.includes(item.system.location);
    }

    // Abilities only apply effects if active or always on
    if (item.type === "ability") return !item.system.isReady;

    return false;
  }
}
