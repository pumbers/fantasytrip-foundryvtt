import { FTDiceRollerApp } from "../applications/dice-roller.mjs";

const DICE_ROLLER = new FTDiceRollerApp();

/**
 * Make an Attribute Roll for the specified Actor
 *
 * @param {Actor} actor
 * @param {Object} options
 */
export async function attributeRoll(actor, options) {
  console.log("Action.attributeRoll()", actor, options);
  const result = await DICE_ROLLER.render({
    force: true,
    type: "success",
    dice: 3,
    actor,
    attribute: options.attribute,
    submit: async (data) => {
      console.log("Action.attributeRoll().submit()", "data", data);

      const roll = new Roll(`${data.dice}D6`, {
        actor: data.actor,
      });

      roll.evaluate().then((roll) => {
        const attributes = JSON.parse(data.attributes).filter((a) => !!a);
        const totalAttributes = attributes.reduce(
          (total, attribute) => total + foundry.utils.getProperty(data.actor.getRollData(), attribute),
          0
        );
        const totalModifiers = Object.values(data.modifiers).reduce((total, modifier) => total + parseInt(modifier), 0);
        // TODO random message choice
        const message = game.i18n.format(`FT.system.roll.flavor.${data.type}.0`, {
          attributes: attributes.map((a) => game.i18n.localize(`FT.system.roll.attribute.${a}`)).join("+"),
        });
        const margin = totalAttributes + totalModifiers - roll.total;
        const result =
          margin === 0
            ? game.i18n.format("FT.system.roll.result.exact")
            : margin >= 0
            ? game.i18n.format("FT.system.roll.result.success", { margin: Math.abs(margin) })
            : game.i18n.format("FT.system.roll.result.failure", { margin: Math.abs(margin) });

        roll.toMessage(
          {
            speaker: ChatMessage.getSpeaker({ actor: data.actor }),
            flavor: message + result,
          },
          { rollMode: data.rollMode }
        );
      });
    },
  });
}

/**
 * Make a Talent Roll for the specified Actor
 *
 * @param {Actor} actor
 * @param {Item} talent
 * @param {Object} options
 */
export async function talentRoll(actor, talent, options) {
  console.log("Action.talentRoll()", actor, talent, options);
  const result = await DICE_ROLLER.render({
    force: true,
    type: "talent",
    dice: 3,
    actor,
    talent,
    attribute: talent.system.defaultAttribute,
    submit: async (data) => {
      console.log("Action.talentRoll().submit()", "data", data);

      const roll = new Roll(`${data.dice}D6`, {
        actor: data.actor,
      });

      roll.evaluate().then((roll) => {
        const attributes = JSON.parse(data.attributes).filter((a) => !!a);
        const totalAttributes = attributes.reduce(
          (total, attribute) => total + foundry.utils.getProperty(data.actor.getRollData(), attribute),
          0
        );
        const totalModifiers = Object.values(data.modifiers).reduce((total, modifier) => total + parseInt(modifier), 0);
        // TODO random message choice
        const message = game.i18n.format(`FT.system.roll.flavor.${data.type}.0`, {
          talent: talent.name,
        });
        const margin = totalAttributes + totalModifiers - roll.total;
        const result =
          margin === 0
            ? game.i18n.format("FT.system.roll.result.exact")
            : margin >= 0
            ? game.i18n.format("FT.system.roll.result.success", { margin: Math.abs(margin) })
            : game.i18n.format("FT.system.roll.result.failure", { margin: Math.abs(margin) });

        roll.toMessage(
          {
            speaker: ChatMessage.getSpeaker({ actor: data.actor }),
            flavor: message + result,
          },
          { rollMode: data.rollMode }
        );
      });
    },
  });
}

/**
 * Make an Attack Roll for the specified Actor
 *
 * @param {Actor} actor
 * @param {Item} weapon
 * @param {Object} options
 */
export async function attackRoll(actor, weapon, options) {
  console.log("Action.attackRoll()", actor, weapon, options);
  const attack = weapon.system.attacks[options.attackIndex];
  const talent = !!attack.talent ? actor.getEmbeddedDocument("Item", attack.talent) : null;
  const result = await DICE_ROLLER.render({
    force: true,
    type: "attack",
    dice: attack.dice,
    actor,
    talent,
    item: weapon,
    attribute: attack.attribute,
    modifiers: {
      ...(attack.toHitMod !== 0 ? { toHitMod: attack.toHitMod } : {}),
      ...(attack.stHitMod !== 0 ? { stHitMod: attack.stHitMod } : {}),
      ...(attack.attackTypeMod !== 0 ? { attackTypeMod: attack.attackTypeMod } : {}),
      ...(attack.attributeMod !== 0 ? { attributeMod: attack.attributeMod } : {}),
      ...(attack.type === "thrown" || attack.type === "missile" ? { rangeMod: 0 } : {}),
    },
    targets: Array.from(game.user.targets),
    ...options,
    submit: async (data) => {
      console.log("Action.attackRoll().submit()", "data", data);

      const roll = new Roll(`${data.dice}D6`, {
        actor: data.actor,
        item: data.item,
      });

      roll.evaluate().then((roll) => {
        const totalAttributes = JSON.parse(data.attributes)
          .filter((a) => !!a)
          .reduce((total, attribute) => total + foundry.utils.getProperty(data.actor.getRollData(), attribute), 0);
        const totalModifiers = Object.values(data.modifiers).reduce((total, modifier) => total + parseInt(modifier), 0);
        // TODO random message choice
        const message = game.i18n.format(`FT.system.roll.flavor.${data.type}.0`, {
          item: data.item.name,
          attack: attack.action,
          targets: data.targets.map((t) => t.name).join(", "),
        });
        const margin = totalAttributes + totalModifiers - roll.total;
        const result =
          margin === 0
            ? game.i18n.format("FT.system.roll.result.exact")
            : margin >= 0
            ? game.i18n.format("FT.system.roll.result.success", { margin: Math.abs(margin) })
            : game.i18n.format("FT.system.roll.result.failure", { margin: Math.abs(margin) });

        roll.toMessage(
          {
            speaker: ChatMessage.getSpeaker({ actor: data.actor }),
            flavor: message + result,
          },
          { rollMode: data.rollMode }
        );
      });
    },
  });
  console.log("Action.attackRoll() ... result", result);
}

/**
 * Make an Attack Roll for the specified Actor
 *
 * @param {Actor} actor
 * @param {Item} weapon
 * @param {Object} options
 */
export function damageRoll(actor, weapon, options = {}) {
  console.log("Action.damageRoll()", actor, weapon, options);

  const attack = weapon.system.attacks[options.attackIndex];
  const formula =
    game.settings.get("fantasytrip", "damageMultiplierStrategy") === "rollTimes"
      ? new Array(options.multiplier ?? 1).fill(attack.damage).join("+")
      : `(${attack.damage ?? 0})*${options.multiplier ?? 1}`;
  const roll = new Roll(formula, { actor, weapon });

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
