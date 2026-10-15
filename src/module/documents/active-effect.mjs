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

/*****************************************************************************
 * Status Overlays
 *****************************************************************************/

// Statuses drawn as a large overlay over the token, unless turned off in the world settings
export const OVERLAY_STATUSES = ["dead", "unconscious", "stun"];

/**
 * Whether the dead, unconscious & stunned statuses should be drawn as token overlays
 * @returns {Boolean}
 */
export function useStatusOverlays() {
  return game.settings.get(FT.id, "statusOverlays");
}

// When overlays are turned off, remove the overlay from these statuses however
// they're applied (e.g. by the combat tracker's defeated toggle, macros or modules)
Hooks.on("preCreateActiveEffect", (effect) => {
  if (useStatusOverlays()) return;
  if (!OVERLAY_STATUSES.some((status) => effect.statuses.has(status))) return;
  effect.updateSource({ "flags.core.overlay": false });
});
