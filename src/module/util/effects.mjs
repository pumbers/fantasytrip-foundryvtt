import { FT } from "../system/config.mjs";

/**
 * Manage Active Effect instances through an Actor or Item Sheet via effect control buttons.
 *
 * @param {Actor|owner} owner  The owning document which manages this effect
 * @param {MouseEvent} event  The left-click event on the effect control
 * @param {HTMLElement} target  The HTMLElement where the event occurred
 */
export function onManageActiveEffect(owner, event, target) {
  // console.log(
  //   "Effects.onManageActiveEffect()",
  //   "owner",
  //   owner.name,
  //   "dataset",
  //   target.dataset,
  //   "effect",
  //   target?.closest("[data-effect-id]")?.dataset
  // );
  const effectId = target?.closest("[data-effect-id]")?.dataset.effectId;
  const effect = effectId ? owner.effects.get(effectId) : null;

  switch (target.dataset.action) {
    case "createEffect":
      return owner.createEmbeddedDocuments("ActiveEffect", [
        {
          name: game.i18n.format("DOCUMENT.New", {
            type: game.i18n.localize("DOCUMENT.ActiveEffect"),
          }),
          icon: "icons/svg/aura.svg",
          origin: owner.uuid,
          transfer: owner.type !== "spell",
        },
      ]);
    case "editEffect":
      return effect.sheet.render(true);
    case "deleteEffect":
      return effect.delete();
    case "toggleEffect":
      return effect.update({ disabled: !effect.disabled });
    default:
      console.error(FT.prefix, "Unknown effect action", target.dataset.action);
  }
}
