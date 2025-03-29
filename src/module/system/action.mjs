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
  const attributes = JSON.parse(data.attributes ?? "[]").filter((a) => !!a);
  const totalAttributes = attributes.reduce(
    (total, attribute) => total + foundry.utils.getProperty(data.actor.getRollData(), attribute),
    0
  );
  const totalModifiers = Object.values(data.modifiers ?? []).reduce((total, modifier) => total + parseInt(modifier), 0);

  return {
    ...data,
    multiplier: parseInt(data.multiplier ?? 0),
    attributes,
    totalAttributes,
    totalModifiers,
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
  if (roll.total === target) return "exact";
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
    type: "save",
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
        const message = game.i18n.format(`FT.system.roll.flavor.${data.type}.${Math.floor(Math.random() * 6)}`, {
          attributes: attributes.map((a) => game.i18n.localize(`FT.character.attribute.${a}`)).join("+"),
          result: game.i18n.format(`FT.system.roll.result.${result}`, {
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
      const roll = await new Roll(`${dice}D6`).evaluate();

      // Determine roll result and margin of success/failure
      const result = determineRollResult(dice, totalAttributes + totalModifiers, roll);
      const margin = totalAttributes + totalModifiers - roll.total;

      // Create a chat message for the result
      const message = game.i18n.format(`FT.system.roll.flavor.${data.type}.${Math.floor(Math.random() * 6)}`, {
        talent: talent.name,
        result: game.i18n.format(`FT.system.roll.result.${result}`, {
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
      const { type, actor, talent, item, dice, attributes, totalAttributes, modifiers, totalModifiers, rollMode } =
        extractRollParameters(data);

      // Create & evaluate a roll based on the set parameters
      const roll = await new Roll(`${dice}D6`).evaluate();

      // Determine roll result and margin of success/failure
      const result = determineRollResult(dice, totalAttributes + totalModifiers, roll);
      const margin = totalAttributes + totalModifiers - roll.total;

      // Create a chat message for the result
      let message = game.i18n.format(`FT.system.roll.flavor.${data.type}.${Math.floor(Math.random() * 6)}`, {
        talent: talent?.name,
        item: item?.name,
        attack: attack.action?.toLowerCase(),
        targets: Array.from(game.user.targets)
          .map((t) => t.name)
          .join(", "),
        result: game.i18n.format(`FT.system.roll.result.${result}`, {
          margin: Math.abs(margin),
        }),
      });

      if (roll.total >= 17 && (weapon.system.type === "natural" || weapon.system.type === "natural")) {
        const damage = await new Roll("1d6").evaluate().total;
        message = message.concat(" ", game.i18n.format("FT.system.roll.result.damage", { damage }));
      } else if (roll.total === 17) {
        message = message.concat(" ", game.i18n.format("FT.system.roll.result.dropped", { weapon: item?.name }));
      } else if (roll.total === 18) {
        message = message.concat(" ", game.i18n.format("FT.system.roll.result.broken", { weapon: item?.name }));
      }

      const content = await renderTemplate(`${FT.path}/templates/chat/dice-roll.hbs`, {
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
        roll,
        multiplier:
          weapon.type === "spell" ? weapon.system.stSpent ?? 1 : roll.total === 3 ? 3 : roll.total === 4 ? 2 : 1,
        parts: roll.dice.map((d) => d.getTooltipData()),
        showDamageButton: type === "attack" && margin >= 0 && item.system.attacks[options.attackIndex].damage,
        resultClass: margin >= 0 ? "success" : "failure",
        showOwnerClasses: Array.from(Object.entries(actor.ownership))
          .filter(([id, level]) => level === CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER)
          .map(([id, level]) => `.ft-show-${id}`)
          .join(" "),
      });

      roll.toMessage(
        {
          speaker: ChatMessage.getSpeaker({ actor }),
          flavor: message,
          content,
        },
        { rollMode }
      );

      // If the item was an attack spell, cancel it if the settings says so
      if (item.type === "spell" && game.settings.get("fantasy-trip", "cancelAttackSpellAuto"))
        item.update({ "system.stSpent": 0 });
    },
  };

  DICE_ROLLER.render(context);
}

/**
 * Make a Damage Roll for the specified Actor & attack
 *
 * @param {Actor} actor
 * @param {Item} weapon
 * @param {Object} options
 */
export function damageRoll(actor, weapon, options = {}) {
  // console.log("Action.damageRoll()", "actor", actor, "weapon", weapon, "options", options);

  // Create a damage roll
  const attack = weapon.system.attacks[options.attackIndex];

  const context = {
    force: true,
    //
    type: "damage",
    actor,
    item: weapon,
    formula: attack.damage,
    multiplier: options.multiplier ?? 1,
    damageMultiplierStrategy:
      weapon.type === "spell" ? "rollTimes" : game.settings.get("fantasy-trip", "damageMultiplierStrategy"),
    submit: (data) => {
      // console.log("Action.damageRoll().submit()", "data", data);

      // Extract roll parameters
      const { actor, formula, multiplier, damageMultiplierStrategy, rollMode } = extractRollParameters(data);
      const finalFormula =
        damageMultiplierStrategy === "rollTimes"
          ? new Array(multiplier ?? 1).fill(`max(${formula},0)`).join("+")
          : `(max(${formula ?? 0},0))*${multiplier ?? 1}`;

      // Roll and generate a chat message for each target
      if (!!game.user.targets.size) {
        game.user.targets.forEach(async (token) => {
          // Create & evaluate a roll based on the set parameters
          const roll = await new Roll(finalFormula).evaluate();

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
            },
            { rollMode }
          );
        });
      } else {
        // If no targets, just roll
        new Roll(finalFormula).evaluate().then((roll) => {
          roll.toMessage(
            {
              speaker: ChatMessage.getSpeaker({ actor }),
              flavor: game.i18n.format(`FT.system.roll.flavor.damage.${Math.floor(Math.random() * 6)}`, {
                weapon: weapon.name,
                attack: attack.action?.toLowerCase(),
                total: roll.total,
              }),
            },
            { rollMode }
          );
        });
      }
    },
  };

  DICE_ROLLER.render(context);
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
  const items = Array.from(actor.items).filter((i) => i.system.hasDefenses);

  // If there are none, just apply the damage
  if (!items.length) {
    _applyDamage(actor, damage, options);
    return;
  }

  // Create a dialog for the GM to select applicable defenses
  const content = await renderTemplate(`${FT.path}/templates/dialog/apply-damage.hbs`, {
    damage,
    items,
  });

  new foundry.applications.api.DialogV2({
    id: "ft-apply-damage",
    classes: ["fantasy-trip", "apply-damage"],
    window: {
      title: game.i18n.format("FT.dialog.damage.title", { name: actor.parent?.name ?? actor.name, damage }),
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
function _applyDamage(actor, damageTaken, options = {}) {
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
    modifiers: {
      casting: {
        min: FT.roll.modifiers.default.min,
        max: FT.roll.modifiers.default.max,
        value: actor.system.dx.modFor.casting ?? 0,
      },
    },
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
      const { actor, spell, cost, dice, totalAttributes, totalModifiers, rollMode } = extractRollParameters(data);

      // Create & evaluate a roll based on the set parameters
      const roll = await new Roll(`${dice}D6`).evaluate();

      // Determine roll result and margin of success/failure
      const result = determineRollResult(dice, totalAttributes + totalModifiers, roll);
      const margin = totalAttributes + totalModifiers - roll.total;

      // Mark the spell as cast and/or subtract the fatigue
      if (margin >= 0) {
        spell.update({ "system.stSpent": cost.st.value ?? 0 });
      }

      if ((margin >= 0 || roll.total >= 17) && game.settings.get("fantasy-trip", "addCastingFatigueAuto")) {
        actor.update({ "system.fatigue": actor.system.fatigue + parseInt(cost.st.value) });
      }

      // Create a chat message for the result
      let message = game.i18n.format(`FT.system.roll.flavor.${data.type}.${Math.floor(Math.random() * 6)}`, {
        spell: spell.name,
        result: game.i18n.format(`FT.system.roll.result.${result}`, {
          margin: Math.abs(margin),
        }),
      });

      if (roll.total === 17) {
        message = message.concat(" ", game.i18n.format("FT.system.roll.result.fatigued"));
        message = message.concat(" ", game.i18n.format("FT.system.roll.result.maybeDropped"));
      } else if (roll.total === 18) {
        message = message.concat(" ", game.i18n.format("FT.system.roll.result.maybeBroken"));
        message = message.concat(" ", game.i18n.format("FT.system.roll.result.fatigued"));
        message = message.concat(" ", game.i18n.format("FT.system.roll.result.knockdown"));
      }

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
