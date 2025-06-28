import { FT } from "../system/config.mjs";
import { FTDiceRollerApp } from "../applications/dice-roller.mjs";

/**
 * Reusable dice roller application instance
 */
const DICE_ROLLER = new FTDiceRollerApp();

/**
 * Extract roll parameters from the dice roller form.
 *
 * @param {FormData} data
 * @returns
 */
function extractRollParameters(data) {
  const attributes = JSON.parse(data.attributes ?? "[]").filter((a) => !!a);
  const totalAttributes = attributes.reduce(
    (total, attribute) => total + foundry.utils.getProperty(data.actor.getRollData(), attribute),
    0
  );
  const totalModifiers = Object.values(data.modifiers ?? []).reduce((total, modifier) => total + parseInt(modifier), 0);
  if (data.cost) data.cost.st.value = parseInt(data.cost.st.value ?? 0);

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
 * @param {Number} dice Number of dice rolled
 * @param {Number} target Target number
 * @param {Roll} evaluated roll The Foundry dice roll (with results)
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
      console.error(FT.prefix, "Incorrect number of dice rolled", dice);
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

  const attribute = options.attribute.split(".")[0];
  const saveMod = actor.system[attribute].modFor.save;

  const context = {
    //
    force: true,
    //
    type: "save",
    dice: 3,
    actor,
    attribute: options.attribute,
    modifiers: {
      ...(saveMod !== 0
        ? {
            saveMod: {
              min: FT.roll.modifiers.default.min,
              max: FT.roll.modifiers.default.max,
              value: saveMod,
            },
          }
        : {}),
    },
    //
    submit: (data) => {
      // console.log("Action.attributeRoll().submit()", "data", data);

      // Extract roll parameters
      const { actor, dice, attributes, totalAttributes, modifiers, totalModifiers, rollMode } =
        extractRollParameters(data);

      // Create & evaluate a roll based on the set parameters
      new Roll(`${dice}D6`).evaluate().then(async (roll) => {
        // Determine roll result and margin of success/failure
        const result = determineRollResult(dice, totalAttributes + totalModifiers, roll);
        const margin = totalAttributes + totalModifiers - roll.total;

        // Create a chat message for the result
        const message = game.i18n.format(`FT.system.roll.flavor.attribute.${Math.floor(Math.random() * 6)}`, {
          attributes: attributes.map((a) => game.i18n.localize(`FT.actor.attribute.${a}`)).join("+"),
          result: game.i18n.format(`FT.system.roll.result.${result}`, {
            margin: Math.abs(margin),
          }),
        });

        const content = await foundry.applications.handlebars.renderTemplate(
          `${FT.path}/templates/chat/dice-roll.hbs`,
          {
            actor,
            attributes: attributes.map((a) => game.i18n.localize(`FT.actor.attribute.${a}`)).join("+"),
            totalAttributes,
            modifiers,
            totalModifiers,
            targetNumber: totalAttributes + totalModifiers,
            roll,
            parts: roll.dice.map((d) => d.getTooltipData()),
          }
        );

        roll.toMessage(
          {
            speaker: ChatMessage.getSpeaker({ actor }),
            flavor: message,
            content,
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
      const { actor, talent, dice, attributes, totalAttributes, modifiers, totalModifiers, rollMode } =
        extractRollParameters(data);

      // Create & evaluate a roll based on the set parameters
      const roll = await new Roll(`${dice}D6`).evaluate();

      // Determine roll result and margin of success/failure
      const result = determineRollResult(dice, totalAttributes + totalModifiers, roll);
      const margin = totalAttributes + totalModifiers - roll.total;

      // Create a chat message for the result
      const message = game.i18n.format(`FT.system.roll.flavor.talent.${Math.floor(Math.random() * 6)}`, {
        talent: talent.name,
        result: game.i18n.format(`FT.system.roll.result.${result}`, {
          margin: Math.abs(margin),
        }),
      });

      const content = await foundry.applications.handlebars.renderTemplate(`${FT.path}/templates/chat/dice-roll.hbs`, {
        actor,
        token: actor.getDependentTokens()[0],
        item: talent,
        attributes: attributes.map((a) => game.i18n.localize(`FT.actor.attribute.${a}`)).join("+"),
        totalAttributes,
        modifiers,
        totalModifiers,
        targetNumber: totalAttributes + totalModifiers,
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
    },
  };

  DICE_ROLLER.render(context);
}

/**
 * Make an Attack Roll for the specified Actor
 *
 * @param {Actor} actor
 * @param {Item} item
 * @param {Object} options
 */
export function attackRoll(actor, item, options) {
  // console.log("Action.attackRoll()", actor, item, options);

  const attack = item.system.attacks[options.attackIndex ?? 0];
  const talent = !!attack.talent ? actor.items.get(attack.talent) : null;

  // Set up the dice roller context
  const context = {
    force: true,
    //
    type: "attack",
    actor,
    item,
    talent,
    //
    dice: attack.dice,
    attribute: "dx.value",
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
      ...(attack.attackTypeMod !== 0
        ? {
            attackTypeMod: {
              min: FT.roll.modifiers.default.min,
              max: FT.roll.modifiers.default.max,
              value: attack.attackTypeMod,
            },
          }
        : {}),
      ...(attack.type === "thrown"
        ? {
            rangeMod: {
              note: game.i18n.localize("FT.system.combat.range.scale.thrown"),
              min: FT.roll.modifiers.range.min,
              max: FT.roll.modifiers.range.max,
              value: 0,
            },
          }
        : {}),
      ...(attack.type === "missile"
        ? {
            rangeMod: {
              note: game.i18n.localize("FT.system.combat.range.scale.missile"),
              min: FT.roll.modifiers.range.min,
              max: FT.roll.modifiers.range.max,
              value: 0,
            },
          }
        : {}),
    },
    ...options,
    //
    submit: async (data) => {
      // console.log("Action.attackRoll().submit()", "data", data);

      // Extract roll parameters
      const { dice, attributes, totalAttributes, modifiers, totalModifiers, rollMode } = extractRollParameters(data);

      // Create & evaluate a roll based on the set parameters
      const roll = await new Roll(`${dice}D6`).evaluate();

      // Determine roll result and margin of success/failure
      const result = determineRollResult(dice, totalAttributes + totalModifiers, roll);
      const margin = totalAttributes + totalModifiers - roll.total;

      // Create a chat message for the result
      let message = game.i18n.format(`FT.system.roll.flavor.attack.${Math.floor(Math.random() * 6)}`, {
        item: item?.name,
        action: attack.action?.toLowerCase(),
        targets: Array.from(game.user.targets)
          .map((t) => t.name)
          .join(", "),
        result: game.i18n.format(`FT.system.roll.result.${result}`, {
          margin: Math.abs(margin),
        }),
      });

      // On 17+, bad things happen to the attacker
      if (roll.total >= 17 && item.system.type === "natural") {
        // Natural weapons take 1d6 damage
        message = message.concat(
          " ",
          game.i18n.format("FT.system.roll.result.damage", { damage: await new Roll("1d6").evaluate().total })
        );
      } else if (roll.total === 17) {
        // Item is dropped
        message = message.concat(" ", game.i18n.format("FT.system.roll.result.dropped", { item: item?.name }));
      } else if (roll.total === 18) {
        // Item is broken
        message = message.concat(" ", game.i18n.format("FT.system.roll.result.broken", { item: item?.name }));
      }

      // Full chat message content, including roll parameters & result
      const content = await foundry.applications.handlebars.renderTemplate(`${FT.path}/templates/chat/dice-roll.hbs`, {
        actor,
        token: actor.getDependentTokens()[0],
        item,
        attackIndex: options.attackIndex ?? 0,
        attributes: attributes.map((a) => game.i18n.localize(`FT.actor.attribute.${a}`)).join("+"),
        totalAttributes,
        modifiers,
        totalModifiers,
        targetNumber: totalAttributes + totalModifiers,
        unskilled: item.type !== "equipment" && !talent,
        roll,
        parts: roll.dice.map((d) => d.getTooltipData()),
        ...(margin >= 0 &&
          item.system.attacks[options.attackIndex].damage && {
            damage: {
              ownerClasses: Array.from(Object.entries(actor.ownership))
                .filter(([id, level]) => level === CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER)
                .map(([id, level]) => `ft-show-${id}`)
                .join(" "),
              minimum: 0,
              multiplier: roll.total === 3 ? 3 : roll.total === 4 ? 2 : 1,
              damageMultiplierStrategy: game.settings.get(FT.id, "damageMultiplierStrategy"),
            },
          }),
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
    attribute: "dx.value",
    modifiers: {
      ...(actor.system.dx.modFor.casting !== 0 && {
        attributeMod: {
          min: FT.roll.modifiers.default.min,
          max: FT.roll.modifiers.default.max,
          value: actor.system.dx.modFor.casting,
        },
      }),
      ...(spell.system.type === "thrown" && {
        rangeMod: {
          note: game.i18n.localize("FT.system.combat.range.scale.thrown"),
          min: FT.roll.modifiers.default.min * 2,
          max: 0,
          value: 0,
        },
      }),
      ...(spell.system.type === "missile" && {
        rangeMod: {
          note: game.i18n.localize("FT.system.combat.range.scale.missile"),
          min: FT.roll.modifiers.default.min,
          max: 0,
          value: 0,
        },
      }),
    },
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
      const { cost, dice, attributes, totalAttributes, modifiers, totalModifiers, rollMode } =
        extractRollParameters(data);

      // Create & evaluate a roll based on the set parameters
      const roll = await new Roll(`${dice}D6`).evaluate();

      // Determine roll result and margin of success/failure
      const result = determineRollResult(dice, totalAttributes + totalModifiers, roll);
      const margin = totalAttributes + totalModifiers - roll.total;

      // Calculate item mana cost and/or actor ST cost for the casting
      let manaCost = 0;
      let stCost = margin >= 0 || spell.system.type === "missile" || roll.total >= 17 ? cost.st.value : 1;
      if (game.settings.get(FT.id, "useManaFirst")) {
        manaCost = Math.min(actor.system.mana.value, stCost);
        stCost = stCost - manaCost;
      }

      // Add fatigue and/or subtract item mana for successful casting
      if (game.settings.get(FT.id, "addCastingFatigueAuto")) {
        actor.update({ "system.fatigue": actor.system.fatigue + stCost });
        actor.update({ "system.mana.value": actor.system.mana.value - manaCost });
      }

      // If the spell can be maintained...
      if (margin >= 0 && spell.system.canBeMaintained) {
        // Create a "cast" spell clone and record the ST spent
        actor.createEmbeddedDocuments("Item", [spell.clone({ "system.stSpent": stCost + manaCost })]);
      }

      // Create a chat message for the result
      let message = game.i18n.format(`FT.system.roll.flavor.cast.${Math.floor(Math.random() * 6)}`, {
        spell: spell.name,
        targets: Array.from(game.user.targets)
          .map((t) => t.name)
          .join(", "),
        result: game.i18n.format(`FT.system.roll.result.${result}`, {
          margin: Math.abs(margin),
        }),
      });

      // Bad stuff happens on a 17 or 18
      if (roll.total === 17) {
        message = message.concat(" ", game.i18n.format("FT.system.roll.result.fatigued"));
        message = message.concat(" ", game.i18n.format("FT.system.roll.result.maybeDropped"));
      } else if (roll.total === 18) {
        message = message.concat(" ", game.i18n.format("FT.system.roll.result.maybeBroken"));
        message = message.concat(" ", game.i18n.format("FT.system.roll.result.fatigued"));
        message = message.concat(" ", game.i18n.format("FT.system.roll.result.knockdown"));
      }

      const content = await foundry.applications.handlebars.renderTemplate(`${FT.path}/templates/chat/dice-roll.hbs`, {
        actor,
        token: actor.getDependentTokens()[0],
        item: spell,
        attackIndex: options.attackIndex ?? 0,
        attributes: attributes.map((a) => game.i18n.localize(`FT.actor.attribute.${a}`)).join("+"),
        totalAttributes,
        modifiers,
        unskilled: false,
        totalModifiers,
        targetNumber: totalAttributes + totalModifiers,
        roll,
        parts: roll.dice.map((d) => d.getTooltipData()),
        ...(margin >= 0 &&
          spell.system.attacks[0]?.damage && {
            damage: {
              ownerClasses: Array.from(Object.entries(actor.ownership))
                .filter(([id, level]) => level === CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER)
                .map(([id, level]) => `ft-show-${id}`)
                .join(" "),
              minimum: spell.system.type === "missile" ? cost.st.value : 0,
              multiplier: spell.system.type === "missile" ? cost.st.value : 1,
              damageMultiplierStrategy:
                spell.system.type === "missile" ? "rollTimes" : game.settings.get(FT.id, "damageMultiplierStrategy"),
            },
          }),
      });

      roll.toMessage(
        {
          speaker: ChatMessage.getSpeaker({ actor }),
          flavor: message,
          content,
        },
        { rollMode }
      );

      // If the spell is cast from an item, then it may get burned (deleted)
      if (!!options.item && options.burn === "true") {
        actor.deleteEmbeddedDocuments("Item", [options.item._id]);
        ChatMessage.create({
          flavor: game.i18n.format("FT.item.chat.burn", { name: options.item.name }),
          whisper: Object.keys(actor.ownership).filter((k) => k !== "default"),
        });
      }
    },
  };

  DICE_ROLLER.render(context);
}

/**
 * Make a Damage Roll for the specified Actor & attack
 *
 * @param {Actor} actor
 * @param {Item} item
 * @param {Object} options
 */
export function damageRoll(actor, item, options = {}) {
  // console.log("Action.damageRoll()", "actor", actor, "item", item, "options", options);

  const attack = item.system.attacks[options.attackIndex ?? 0];

  // Create a damage roll
  const context = {
    force: true,
    //
    type: "damage",
    actor,
    item,
    formula: attack.damage,
    minimum: options.minimum ?? 0,
    multiplier: options.multiplier ?? 1,
    damageMultiplierStrategy:
      item.type === "spell" ? "rollTimes" : game.settings.get(FT.id, "damageMultiplierStrategy"),
    submit: (data) => {
      // console.log("Action.damageRoll().submit()", "data", data);

      // Extract roll parameters
      const { actor, formula, minimum, multiplier, damageMultiplierStrategy, rollMode } = extractRollParameters(data);

      // Build a damage formula
      const finalFormula =
        damageMultiplierStrategy === "rollTimes"
          ? "max(" + new Array(multiplier ?? 1).fill(`max(${formula},0)`).join("+") + `,${minimum})`
          : `max(max(${formula},0)*${multiplier ?? 1},${minimum ?? 0})`;

      // Roll and generate a chat message for each target
      if (!!game.user.targets.size) {
        game.user.targets.forEach(async (token) => {
          // Create & evaluate a roll based on the set parameters
          const roll = await new Roll(finalFormula).evaluate();

          // Create a chat message for the result
          const message = game.i18n.format(`FT.system.roll.flavor.damage.${Math.floor(Math.random() * 6)}`, {
            name: token.name,
            effects: attack.effects,
            total: roll.total,
          });

          const content = await foundry.applications.handlebars.renderTemplate(
            `${FT.path}/templates/chat/damage-roll.hbs`,
            {
              token,
              actor: token.actor,
              roll,
              parts: roll.dice.map((d) => d.getTooltipData()),
            }
          );

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
                item: item.name,
                total: roll.total,
                effects: attack.effects,
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
 * Apply damage to a target, accounting for any defenses if present
 * @param {Actor} actor
 * @param {Number} damage
 * @param {Object} options
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
        label: "Cancel",
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
 * @param {Actor} actor
 * @param {Number} damageTaken
 * @param {Object} options
 */
function _applyDamage(actor, damageTaken, options = {}) {
  // console.log("Action._applyDamage", actor, damageTaken, options);
  actor.update({ "system.damage": actor.system.damage + damageTaken }).then((updatedActor) => {
    if (updatedActor?.system.isDead) {
      ChatMessage.create({
        flavor: game.i18n.format(`FT.system.combat.chat.dead.${Math.floor(Math.random() * 6)}`, {
          name: actor.parent?.name ?? actor.name,
          damageTaken,
        }),
      });
    } else if (updatedActor?.system.isDown) {
      ChatMessage.create({
        flavor: game.i18n.format(`FT.system.combat.chat.down.${Math.floor(Math.random() * 6)}`, {
          name: actor.parent?.name ?? actor.name,
          damageTaken,
        }),
      });
    } else if (damageTaken >= 8) {
      updatedActor.toggleStatusEffect("stun", { active: true });
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
