import { FT } from "../config.mjs";

/**
 * Apply damage to a target, accounting for any defenses if present
 * @param {Actor} actor
 * @param {Number} damage
 * @param {Object} options
 */
export default async function applyDamage(actor, damage, options) {
  // console.log("Action.applyDamage()", actor, damage);
  // Find all items that act as defenses
  const items = Array.from(actor.items).filter((i) => i.system.hasDefenses);

  // If there are none, just apply the damage
  if (!items.length) {
    _applyDamage(actor, damage, options);
    return;
  }

  // Create a dialog for the GM to select applicable defenses
  const content = await foundry.applications.handlebars.renderTemplate(`${FT.path}/templates/dialog/apply-damage.hbs`, {
    damage,
    items,
  });

  new foundry.applications.api.DialogV2({
    id: "ft-apply-damage",
    classes: [FT.id, "apply-damage"],
    window: {
      title: game.i18n.format("FT.dialog.damage.title", { name: actor.parent?.name ?? actor.name, damage }),
    },
    content,
    buttons: [
      {
        action: "cancel",
        label: game.i18n.localize("FT.dialog.damage.action.cancel"),
      },
      {
        action: "apply",
        label: game.i18n.localize("FT.dialog.damage.action.apply"),
        default: true,
        callback: (event, button, dialog) => ({
          action: "apply",
          hitsStopped: Array.from(button.form?.elements)
            .filter((e) => e.id === "defense" && e.checked)
            .reduce((hitsStopped, e) => hitsStopped + parseInt(e.value), 0),
        }),
      },
    ],
    submit: (result) => {
      if (result.action === "apply") {
        _applyDamage(actor, Math.max(damage - result.hitsStopped, 0), options);
      }
    },
  }).render({ force: true });
}

/**
 * Apply damage to an actor and set appropriate status conditions.
 *
 * @param {Actor} actor
 * @param {Number} damageTaken
 * @param {Object} options
 */
function _applyDamage(actor, damageTaken, options = {}) {
  // console.log("Action._applyDamage", actor, damageTaken, options);
  // If net damage is zero, don't bother applying it
  if (damageTaken === 0) {
    ChatMessage.create({
      flavor: game.i18n.format("FT.system.combat.chat.unaffected", {
        name: actor.parent?.name ?? actor.name,
        damageTaken,
      }),
    });
    return;
  }

  // Otherwise, apply it to the target
  actor.update({ "system.damage": actor.system.damage + damageTaken }).then((updatedActor) => {
    if (updatedActor?.system.isDead) {
      updatedActor.toggleStatusEffect("dead", { active: true, overlay: true });
      ChatMessage.create({
        flavor: game.i18n.format(`FT.system.combat.chat.dead.${Math.floor(Math.random() * 6)}`, {
          name: actor.parent?.name ?? actor.name,
          damageTaken,
        }),
      });
    } else if (updatedActor?.system.isDown) {
      updatedActor.toggleStatusEffect("unconscious", { active: true, overlay: true });
      ChatMessage.create({
        flavor: game.i18n.format(`FT.system.combat.chat.down.${Math.floor(Math.random() * 6)}`, {
          name: actor.parent?.name ?? actor.name,
          damageTaken,
        }),
      });
    } else if (damageTaken >= 8) {
      updatedActor.toggleStatusEffect("stun", { active: true, overlay: true });
      ChatMessage.create({
        flavor: game.i18n.format(`FT.system.combat.chat.stunned.${Math.floor(Math.random() * 6)}`, {
          name: actor.parent?.name ?? actor.name,
          damageTaken,
        }),
        whisper: Object.keys(actor.ownership).filter((k) => k !== "default"),
      });
    } else {
      ChatMessage.create({
        flavor: game.i18n.format("FT.system.combat.chat.damaged", {
          name: actor.parent?.name ?? actor.name,
          damageTaken,
        }),
        whisper: Object.keys(actor.ownership).filter((k) => k !== "default"),
      });
    }
  });
}
