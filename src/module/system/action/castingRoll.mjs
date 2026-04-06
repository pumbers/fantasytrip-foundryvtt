import { FT } from "../config.mjs";
import { FTDiceRollerApp } from "../../applications/dice-roller.mjs";
import { extractRollParameters, determineRollResult } from "./rollResults.mjs";

const DICE_ROLLER = new FTDiceRollerApp();

/**
 * Make a Spell Casting Roll for the specified Actor
 *
 * @param {Actor} actor
 * @param {Item} spell
 * @param {Object} options
 */
export default function castingRoll(actor, spell, options = {}) {
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
        effectMod: {
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
        await actor.update({ "system.fatigue": actor.system.fatigue + stCost });
        await actor.update({ "system.mana.value": actor.system.mana.value - manaCost });
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

      // If the actor used all their fatigue...
      if (actor.system.isDown) {
        actor.toggleStatusEffect("unconscious", { active: true, overlay: true });
        message = message.concat(" ", game.i18n.format("FT.system.roll.result.strained"));
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
        { rollMode },
      );

      // Apply spell effects to target
      console.log("SPELL", spell.name, spell.effects);
      if (spell.effects.size && game.user.targets.size) {
        ChatMessage.create({
          flavor: game.i18n.format("FT.effect.result.spell", {
            spell: spell.name,
            targets: Array.from(game.user.targets)
              .map((target) => target.name)
              .join(", "),
          }),
        });

        for (const target of game.user.targets) {
          target.actor.createEmbeddedDocuments("ActiveEffect", Array.from(spell.effects));
        }
      }

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
