import { FT } from "../system/config.mjs";
import { FTDiceRollerApp } from "../applications/dice-roller.mjs";

/**
 *
 */
const DICE_ROLLER = new FTDiceRollerApp();

/**
 *
 * @param {*} data
 * @returns
 */
function extractRollParameters(data) {
  const attributes = JSON.parse(data.attributes).filter((a) => !!a);
  const totalAttributes = attributes.reduce(
    (total, attribute) => total + foundry.utils.getProperty(data.actor.getRollData(), attribute),
    0
  );
  const totalModifiers = Object.values(data.modifiers).reduce((total, modifier) => total + parseInt(modifier), 0);
  return {
    type: data.type,
    actor: data.actor,
    talent: data.talent,
    item: data.item,
    spell: data.spell,
    attributes,
    totalAttributes,
    dice: data.dice,
    totalModifiers,
    targets: data.targets?.map((t) => t.name).join(", ") ?? "",
    rollMode: data.rollMode,
  };
}

/**
 *
 * @param {*} dice
 * @param {*} target
 * @param {*} roll
 * @returns
 */
function determineRollResult(dice, target, roll) {
  switch (dice) {
    case 1:
      return "automaticSuccess";
    case 2:
      if (roll.total === 2) return "automaticSuccess";
      if (roll.total === 12) return "criticalFailure";
      return roll.total <= target ? "success" : "failure";
    case 3:
      if (roll.total <= 5) return "automaticSuccess";
      if (roll.total >= 16) return "criticalFailure";
      return roll.total <= target ? "success" : "failure";
    case 4:
      if (roll.total <= 8) return "automaticSuccess";
      if (roll.total >= 20) return "criticalFailure";
      return roll.total <= target ? "success" : "failure";
    case 5:
      if (roll.total <= 11) return "automaticSuccess";
      if (roll.total >= 22) return "criticalFailure";
      return roll.total <= target ? "success" : "failure";
    case 6:
      if (roll.total <= 14) return "automaticSuccess";
      if (roll.total >= 24) return "criticalFailure";
      return roll.total <= target ? "success" : "failure";
    case 7:
      if (roll.total <= 17) return "automaticSuccess";
      if (roll.total >= 26) return "criticalFailure";
      return roll.total <= target ? "success" : "failure";
    case 8:
      if (roll.total <= 20) return "automaticSuccess";
      if (roll.total >= 28) return "criticalFailure";
      return roll.total <= target ? "success" : "failure";
    default:
      console.error("FT | Incorrect number of dice rolled", dice);
      break;
  }
}

/**
 * Make an Attribute Roll for the specified Actor
 *
 * @param {Actor} actor
 * @param {Object} options
 */
export function attributeRoll(actor, options) {
  console.log("Action.attributeRoll()", actor, options);

  const context = {
    //
    force: true,
    //
    type: "success",
    dice: 3,
    actor,
    attribute: options.attribute,
    //
    submit: (data) => {
      console.log("Action.attributeRoll().submit()", "data", data);

      // Extract roll parameters
      const { actor, attributes, dice, totalAttributes, totalModifiers, rollMode } = extractRollParameters(data);

      // Create & evaluate a roll based on the set parameters
      new Roll(`${dice}D6`).evaluate().then((roll) => {
        // Determine roll result and margin of success/failure
        const result = determineRollResult(dice, totalAttributes + totalModifiers, roll);
        const margin = totalAttributes + totalModifiers - roll.total;

        // Create a chat message for the result
        const message = game.i18n.format(`FT.system.roll.flavor.${data.type}.${Math.floor(Math.random() * 3)}`, {
          attributes: attributes.map((a) => game.i18n.localize(`FT.character.attribute.${a}`)).join("+"),
          result: game.i18n.format(`FT.system.roll.result.${margin === 0 ? "exact" : result}`, {
            margin: Math.abs(margin),
          }),
        });

        roll.toMessage(
          {
            speaker: ChatMessage.getSpeaker({ actor }),
            flavor: message,
          },
          { rollMode }
        );
      });
    },
  };

  DICE_ROLLER.render(context);
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
  const context = {
    force: true,
    //
    type: "talent",
    dice: 3,
    actor,
    talent,
    attribute: talent.system.defaultAttribute,
    //
    submit: async (data) => {
      console.log("Action.talentRoll().submit()", "data", data);

      // Extract roll parameters
      const { actor, talent, dice, totalAttributes, totalModifiers, rollMode } = extractRollParameters(data);

      // Create & evaluate a roll based on the set parameters
      const roll = await new Roll(`${data.dice}D6`).evaluate();

      // Determine roll result and margin of success/failure
      const result = determineRollResult(dice, totalAttributes + totalModifiers, roll);
      const margin = totalAttributes + totalModifiers - roll.total;

      // Create a chat message for the result
      const message = game.i18n.format(`FT.system.roll.flavor.${data.type}.${Math.floor(Math.random() * 3)}`, {
        talent: talent.name,
        result: game.i18n.format(`FT.system.roll.result.${margin === 0 ? "exact" : result}`, {
          margin: Math.abs(margin),
        }),
      });

      roll.toMessage(
        {
          speaker: ChatMessage.getSpeaker({ actor }),
          flavor: message,
        },
        { rollMode }
      );
    },
  };

  DICE_ROLLER.render(context);
}

/**
 * Make an Attack Roll for the specified Actor
 *
 * @param {Actor} actor
 * @param {Item} weapon
 * @param {Object} options
 */
export function attackRoll(actor, weapon, options) {
  console.log("Action.attackRoll()", actor, weapon, options);
  const attack = weapon.system.attacks[options.attackIndex];
  const talent = !!attack.talent ? actor.getEmbeddedDocument("Item", attack.talent) : null;

  const context = {
    force: true,
    //
    type: "attack",
    dice: attack.dice,
    actor,
    talent,
    item: weapon,
    attribute: attack.attribute,
    modifiers: {
      ...(attack.toHitMod !== 0 ? { toHitMod: attack.toHitMod } : {}),
      ...(attack.minSTMod !== 0 ? { minSTMod: attack.minSTMod } : {}),
      ...(attack.attackTypeMod !== 0 ? { attackTypeMod: attack.attackTypeMod } : {}),
      ...(attack.attributeMod !== 0 ? { attributeMod: attack.attributeMod } : {}),
      ...(attack.type === "thrown" || attack.type === "missile" ? { rangeMod: 0 } : {}),
    },
    targets: Array.from(game.user.targets),
    ...options,
    //
    submit: async (data) => {
      console.log("Action.attackRoll().submit()", "data", data);

      // Extract roll parameters
      const { actor, talent, item, targets, dice, totalAttributes, totalModifiers, rollMode } =
        extractRollParameters(data);

      // Create & evaluate a roll based on the set parameters
      const roll = await new Roll(`${data.dice}D6`).evaluate();

      // Determine roll result and margin of success/failure
      const result = determineRollResult(dice, totalAttributes + totalModifiers, roll);
      const margin = totalAttributes + totalModifiers - roll.total;

      // Create a chat message for the result
      const message = game.i18n.format(`FT.system.roll.flavor.${data.type}.${Math.floor(Math.random() * 3)}`, {
        talent: talent?.name,
        item: item?.name,
        attack: attack.action,
        targets,
        result: game.i18n.format(`FT.system.roll.result.${margin === 0 ? "exact" : result}`, {
          margin: Math.abs(margin),
        }),
      });

      roll.toMessage(
        {
          speaker: ChatMessage.getSpeaker({ actor }),
          flavor: message,
        },
        { rollMode }
      );
    },
  };

  DICE_ROLLER.render(context);
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
    game.settings.get("fantasy-trip", "damageMultiplierStrategy") === "rollTimes"
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

/**
 * Make a Spell Casting Roll for the specified Actor
 *
 * @param {Actor} actor
 * @param {Item} spell
 * @param {Object} options
 */
export function castingRoll(actor, spell, options = {}) {
  console.log("Action.castingRoll()", actor, spell, options);

  const context = {
    force: true,
    //
    type: "cast",
    dice: 3,
    actor,
    spell,
    attribute: ["missile", "thrown"].includes(spell.system.type) ? "dx.value" : "iq.value",
    cost: {
      st: {
        min: spell.system.stToCast.min,
        max: spell.system.stToCast.max,
        value: spell.system.stToCast.min,
      },
    },
    //
    submit: async (data) => {
      console.log("Action.castingRoll().submit()", "data", data);

      // Extract roll parameters
      const { actor, spell, dice, totalAttributes, totalModifiers, rollMode } = extractRollParameters(data);

      // Create & evaluate a roll based on the set parameters
      const roll = await new Roll(`${data.dice}D6`).evaluate();

      // Determine roll result and margin of success/failure
      const result = determineRollResult(dice, totalAttributes + totalModifiers, roll);
      const margin = totalAttributes + totalModifiers - roll.total;

      // Create a chat message for the result
      const message = game.i18n.format(`FT.system.roll.flavor.${data.type}.${Math.floor(Math.random() * 6)}`, {
        spell: spell.name,
        result: game.i18n.format(`FT.system.roll.result.${margin === 0 ? "exact" : result}`, {
          margin: Math.abs(margin),
        }),
      });

      roll.toMessage(
        {
          speaker: ChatMessage.getSpeaker({ actor }),
          flavor: message,
        },
        { rollMode }
      );
    },
  };

  DICE_ROLLER.render(context);
}
