import { FT } from "../config.mjs";
import { FTDiceRollerApp } from "../../applications/dice-roller.mjs";
import { extractRollParameters, determineRollResult } from "./rollResults.mjs";
import { determineLoF, resolveLoF } from "./lof.mjs";

const DICE_ROLLER = new FTDiceRollerApp();

/**
 * Make an Attack Roll for the specified Actor
 *
 * @param {Actor} actor
 * @param {Item} item
 * @param {Object} options
 */
export default function attackRoll(actor, item, options) {
  // console.log("Action.attackRoll()", actor, item, options);
  // Get the attack details
  const attack = item.system.attacks[options.attackIndex ?? 0];
  const talent = !!attack.talent ? actor.items.get(attack.talent) : null;

  // Set up the dice roller context
  const context = {
    force: true,
    //
    type: "attack",
    actor,
    item,
    attack,
    talent,
    //
    dice: attack.dice,
    attribute: "dx.value",
    modifiers: {
      ...(attack.minSTMod !== 0
        ? {
            minSTMod: {
              min: FT.roll.modifiers.default.min,
              max: FT.roll.modifiers.default.max,
              value: attack.minSTMod,
            },
          }
        : {}),
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
    lof: determineLoF(actor, attack),
    ...options,
    //
    submit: async (data) => {
      // console.log("Action.attackRoll().submit()", "data", data);
      // Extract roll parameters
      const { dice, attributes, totalAttributes, modifiers, totalModifiers, lof, messageMode } =
        extractRollParameters(data);

      // If resolving lof misses results in a hit, don't roll for the attack
      if (
        lof?.length &&
        (await resolveLoF(actor, item, attack, dice, attributes, totalAttributes, modifiers, totalModifiers, lof))
      )
        return;

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
          game.i18n.format("FT.system.roll.result.damage", { damage: await new Roll("1d6").evaluate().total }),
        );
      } else if (roll.total === 17) {
        // Item is dropped
        message = message.concat(" ", game.i18n.format("FT.system.roll.result.dropped", { weapon: item?.name }));
      } else if (roll.total === 18) {
        // Item is broken
        message = message.concat(" ", game.i18n.format("FT.system.roll.result.broken", { weapon: item?.name }));
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
        { messageMode },
      );
    },
  };

  DICE_ROLLER.render(context);
}
