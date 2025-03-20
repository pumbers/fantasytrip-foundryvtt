import { FT } from "../system/config.mjs";
import { FTDiceRollerApp } from "../applications/dice-roller.mjs";

/**
 * Reusable dice roller application instance
 */
const DICE_ROLLER = new FTDiceRollerApp();

/**
 * Extract roll parameters from the dice roller form.
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
    modifiers: data.modifiers,
    totalModifiers,
    rollMode: data.rollMode,
  };
}

/**
 * Determine the result (level of success) of a dice roll.
 *
 * @param {Number} dice
 * @param {Number} target
 * @param {Roll} evaluated roll
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
 * Make an Attribute Roll for the specified Actor.
 *
 * @param {Actor} actor
 * @param {Object} options
 */
export function attributeRoll(actor, options) {
  // console.log("Action.attributeRoll()", actor, options);

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
      // console.log("Action.attributeRoll().submit()", "data", data);

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
 * Make a Talent Roll for the specified Actor.
 *
 * @param {Actor} actor
 * @param {Item} talent
 * @param {Object} options
 */
export async function talentRoll(actor, talent, options) {
  // console.log("Action.talentRoll()", actor, talent, options);
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
      // console.log("Action.talentRoll().submit()", "data", data);

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
  // console.log("Action.attackRoll()", actor, weapon, options);

  const attack = weapon.system.attacks[options.attackIndex ?? 0];
  const talent = !!attack.talent ? actor.items.get(attack.talent) : null;

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
      ...(attack.toHitMod !== 0
        ? {
            toHitMod: {
              min: FT.roll.modifiers.default.min,
              max: FT.roll.modifiers.default.max,
              value: attack.toHitMod,
            },
          }
        : {}),
      ...(attack.minSTMod !== 0
        ? {
            minSTMod: {
              min: FT.roll.modifiers.default.min,
              max: FT.roll.modifiers.default.max,
              value: attack.minSTMod,
            },
          }
        : {}),
      ...(attack.attackTypeMod !== 0
        ? {
            attackTypeMod: {
              min: FT.roll.modifiers.default.min,
              max: FT.roll.modifiers.default.max,
              value: attack.attackTypeMod,
            },
          }
        : {}),
      ...(attack.attributeMod !== 0
        ? {
            attributeMod: {
              min: FT.roll.modifiers.default.min,
              max: FT.roll.modifiers.default.max,
              value: attack.attributeMod,
            },
          }
        : {}),
      ...(attack.type === "thrown" || attack.type === "missile"
        ? { rangeMod: { min: FT.roll.modifiers.range.min, max: FT.roll.modifiers.range.max, value: 0 } }
        : {}),
    },
    ...options,
    //
    submit: async (data) => {
      // console.log("Action.attackRoll().submit()", "data", data);

      // Extract roll parameters
      const {
        type,
        actor,
        talent,
        item,
        targets,
        dice,
        attributes,
        totalAttributes,
        modifiers,
        totalModifiers,
        rollMode,
      } = extractRollParameters(data);

      // Create & evaluate a roll based on the set parameters
      const roll = await new Roll(`${data.dice}D6`).evaluate();

      // Determine roll result and margin of success/failure
      const result = determineRollResult(dice, totalAttributes + totalModifiers, roll);
      const margin = totalAttributes + totalModifiers - roll.total;

      // Create a chat message for the result
      const message = game.i18n.format(`FT.system.roll.flavor.${data.type}.${Math.floor(Math.random() * 3)}`, {
        talent: talent?.name,
        item: item?.name,
        attack: attack.action?.toLowerCase(),
        targets: Array.from(game.user.targets)
          .map((t) => t.name)
          .join(", "),
        result: game.i18n.format(`FT.system.roll.result.${margin === 0 ? "exact" : result}`, {
          margin: Math.abs(margin),
        }),
      });

      const content = await renderTemplate(`${FT.path}/templates/chat/dice-roll.hbs`, {
        type,
        actor,
        token: actor.parent,
        item,
        attackIndex: options.attackIndex,
        attributes: attributes.map((a) => game.i18n.localize(`FT.character.attribute.${a}`)).join("+"),
        totalAttributes,
        modifiers,
        totalModifiers,
        targetNumber: totalAttributes + totalModifiers,
        unskilled: !talent,
        dice,
        roll,
        success: margin >= 0,
        classes: margin >= 0 ? "success" : "failure",
        multiplier: roll.total === 3 ? 3 : roll.total === 4 ? 2 : 1,
        parts: roll.dice.map((d) => d.getTooltipData()),
      });

      roll.toMessage(
        {
          speaker: ChatMessage.getSpeaker({ actor }),
          flavor: message,
          content,
        },
        { rollMode }
      );
    },
  };

  DICE_ROLLER.render(context);
}

/**
 * Make a Damage Roll for the specified Actor & weapon Item
 *
 * @param {Actor} actor
 * @param {Item} weapon
 * @param {Object} options
 */
export function damageRoll(actor, weapon, options = {}) {
  // console.log("Action.damageRoll()", "actor", actor, "weapon", weapon, "options", options);

  // Create a damage roll
  const attack = weapon.system.attacks[options.attackIndex];
  const formula =
    game.settings.get("fantasy-trip", "damageMultiplierStrategy") === "rollTimes"
      ? new Array(options.multiplier ?? 1).fill(attack.damage).join("+")
      : `(${attack.damage ?? 0})*${options.multiplier ?? 1}`;

  // Roll and generate a chat message for each target
  if (!!game.user.targets.size) {
    game.user.targets.forEach(async (token) => {
      // Create & evaluate a roll based on the set parameters
      const roll = await new Roll(formula).evaluate();

      // Create a chat message for the result
      const message = game.i18n.format(`FT.system.roll.flavor.damage.${Math.floor(Math.random() * 6)}`, {
        weapon: weapon.name,
        attack: attack.action?.toLowerCase(),
        total: roll.total,
      });

      const content = await renderTemplate(`${FT.path}/templates/chat/damage-roll.hbs`, {
        token,
        actor: token.actor,
        roll,
        parts: roll.dice.map((d) => d.getTooltipData()),
      });

      roll.toMessage(
        {
          speaker: ChatMessage.getSpeaker({ actor }),
          flavor: message,
          content,
        }
        // { rollMode }
      );
    });
  } else {
    // If no targets, just roll
    new Roll(formula).evaluate().then((roll) => {
      roll.toMessage({
        speaker: ChatMessage.getSpeaker({ actor }),
        flavor: game.i18n.format(`FT.system.roll.flavor.damage.${Math.floor(Math.random() * 3)}`, {
          weapon: weapon.name,
          attack: attack.action?.toLowerCase(),
          total: roll.total,
        }),
      });
    });
  }
}

/**
 *
 * @param {*} actor
 * @param {*} damage
 * @param {*} options
 */
export async function applyDamage(actor, damage, options) {
  // console.log("Action.applyDamage()", actor, damage);

  // Find all items that act as defenses
  const items = Array.from(actor.items).filter((i) => i.system.canDefend);

  // If there are none, just apply the damage
  if (!items.length) {
    _applyDamage(actor, damage, options);
    return;
  }

  // Create a dialog for the GM to select applicable defenses
  const content = await renderTemplate(`${FT.path}/templates/dialog/apply-damage.hbs`, {
    items,
    damage,
  });

  new foundry.applications.api.DialogV2({
    window: {
      title: game.i18n.format("FT.dialog.damage.title", { name: actor.name }),
    },
    content,
    buttons: [
      {
        action: "cancel",
        label: "Cancel",
        callback: (event, button, dialog) => ({
          action: "cancel",
        }),
      },
      {
        action: "apply",
        label: "Apply Damage",
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
 * @param {*} actor
 * @param {*} damageTaken
 * @param {*} options
 */
function _applyDamage(actor, damageTaken, options) {
  // console.log("Action._applyDamage", actor, damageTaken, options);
  actor.update({ "system.damage": actor.system.damage + damageTaken }).then((updatedActor) => {
    if (updatedActor?.system.isDead) {
      updatedActor.toggleStatusEffect("dead", { active: true });
      ChatMessage.create({
        flavor: game.i18n.format(`FT.system.combat.chat.dead.${Math.floor(Math.random() * 6)}`, {
          name: actor.name,
          damageTaken,
        }),
      });
    } else if (updatedActor?.system.isDown) {
      updatedActor.toggleStatusEffect("unconscious", { active: true });
      ChatMessage.create({
        flavor: game.i18n.format(`FT.system.combat.chat.down.${Math.floor(Math.random() * 6)}`, {
          name: actor.name,
          damageTaken,
        }),
      });
    } else if (damageTaken >= 8) {
      updatedActor.toggleStatusEffect("stun", { active: true });
      ChatMessage.create({
        flavor: game.i18n.format(`FT.system.combat.chat.stunned.${Math.floor(Math.random() * 6)}`, {
          name: actor.name,
          damageTaken,
        }),
        ...(actor.type === "npc" ? { whisper: [game.user._id] } : {}),
      });
    } else {
      ChatMessage.create({
        flavor: game.i18n.format("FT.system.combat.chat.damaged", {
          name: actor.name,
          damageTaken,
        }),
        whisper: [game.user._id],
      });
    }
  });
}

/**
 * Make a Spell Casting Roll for the specified Actor
 *
 * @param {Actor} actor
 * @param {Item} spell
 * @param {Object} options
 */
export function castingRoll(actor, spell, options = {}) {
  // console.log("Action.castingRoll()", actor, spell, options);

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
      // console.log("Action.castingRoll().submit()", "data", data);

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
