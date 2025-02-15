/**
 * Manage Active Effect instances through an Actor or Item Sheet via effect control buttons.
 * @param {MouseEvent} event      The left-click event on the effect control
 * @param {Actor|Item} owner      The owning document which manages this effect
 */
export function onManageActiveEffect(event) {
  event.preventDefault();
  const element = $(event.currentTarget);
  const dataset = element.data();

  const effectId = element?.closest("[data-effect-id]").data("effectId");
  const effect = effectId ? this.effects.get(effectId) : null;

  console.log("onManageActiveEffect()", effectId, effect);
  switch (dataset.action) {
    case "create":
      return this.createEmbeddedDocuments("ActiveEffect", [
        {
          name: game.i18n.format("DOCUMENT.New", {
            type: game.i18n.localize("DOCUMENT.ActiveEffect"),
          }),
          icon: "icons/svg/aura.svg",
          origin: this.uuid,
        },
      ]);
    case "edit":
      return effect.sheet.render(true);
    case "delete":
      return effect.delete();
    case "toggle":
      return effect.update({ disabled: !effect.disabled });
  }
}
