import { FTDiceRollerApp } from "../applications/dice-roller.mjs";

const DICE_ROLLER = new FTDiceRollerApp();

/**
 *
 * @returns
 */
export function isCombatsActive() {
  return game.combats && game.combats.active;
}

/**
 *
 * @param {*} token
 * @returns
 */
export function isTokenInActiveCombat(token) {
  return game.combats.active?.combatants.some((c) => c.token?.id === token.id);
}

/**
 *
 * @param {*} actor
 * @param {*} weapon
 * @param {*} options
 */
export async function attackRoll(actor, weapon, options) {
  console.log("Combat.attackRoll()", actor, weapon);
  const talent = weapon?.system.talent ? actor.getEmbeddedDocument("Item", weapon?.system.talent) : null;
  // TODO Weapon type hit mod
  const result = await DICE_ROLLER.render({
    force: true,
    type: "attack",
    dice: 3,
    actor,
    item: weapon,
    modifiers: { stHitMod: weapon.system.stHitMod },
    talent,
    attribute: `${talent?.defaultAttribute ?? "dx"}.max`,
    targets: Array.from(game.user.targets),
    ...options,
    submit: async (data) => {
      console.log("Combat.attackRoll().submit()", "data", data);

      const roll = new Roll(`${data.dice}D6`, {
        actor: data.actor,
        item: data.item,
      });

      roll.evaluate().then((roll) => {
        const totalModifiers = Object.values(data.modifiers).reduce((total, modifier) => total + parseInt(modifier), 0);
        const message = game.i18n.format(`FT.system.roll.flavor.${data.type}.0`, {
          targets: data.targets.map((t) => t.name).join(", "),
          item: data.item.name,
        });
        const margin =
          foundry.utils.getProperty(data.actor.getRollData(), data.attribute) + totalModifiers - roll.total;
        const result = `... ${margin >= 0 ? "Success! Made it by" : "and misses by"} ${Math.abs(margin)}`;
        roll.toMessage(
          {
            speaker: ChatMessage.getSpeaker({ actor: data.actor }),
            flavor: message + result,
          },
          { rollMode: data.visibility }
        );
      });
    },
  });
  console.log("Combat.attackRoll() ... result", result);
}

/**
 *
 * @param {*} actor
 * @param {*} weapon
 * @param {*} options
 */
export function damageRoll(actor, weapon, options = {}) {
  console.log("Combat.damageRoll()", actor, weapon);
  // TODO Remove effects when actor updated manually?

  const baseFormula = weapon.system.damage.concat(weapon.system.stDamageMod);
  const formula =
    game.settings.get("fantasytrip", "damageMultiplierStrategy") === "rollTimes"
      ? new Array(options.multiplier ?? 1).fill(baseFormula).join("+")
      : `(${baseFormula ?? 0})*${options.multiplier ?? 1}`;

  const roll = new Roll(formula, { actor, weapon });

  console.log("... simplified", roll.terms);

  if (!!game.user.targets.size) {
    game.user.targets.forEach((target) => {
      // console.log("... target", target, target.actor);
      roll.evaluate().then((roll) => {
        // console.log("... roll", roll);
        const damage = target.actor
          .update({ "system.damage": target.actor.system.damage + roll.total })
          .then((actor) => {
            if (actor.system.isDead) {
              target.actor.toggleStatusEffect("dead", { active: true });
            } else if (actor.system.isDown) {
              target.actor.toggleStatusEffect("unconscious", { active: true });
            }
          });
        roll.toMessage({
          speaker: ChatMessage.getSpeaker({ actor }),
          flavor: `${weapon.name} deals damage to ${target.name}`,
        });
      });
    });
  } else {
    roll.evaluate().then((roll) => {
      roll.toMessage({
        speaker: ChatMessage.getSpeaker({ actor }),
        flavor: `${weapon.name} deals damage`,
      });
    });
  }
}
