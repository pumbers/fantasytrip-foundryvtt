/**
 * Hook into Combat Tracker rendering to display the round type in the header
 */
Hooks.on("renderCombatTracker", async (app, html, data) => {
  if (game.settings.get("fantasy-trip", "useFTInitiative") && !!data.combat) {
    html
      .find("h3.encounter-title")
      .append(
        `&nbsp;<span>${game.i18n.localize(
          data.combat?.isMovementRound ? "FT.system.combat.phase.movement" : "FT.system.combat.phase.combat"
        )}</span>`
      );
  }
});

/**
 * Override Combat class functions to implement Fantasy Trip initiative.
 *
 * @inheritdoc
 */
export class FTCombat extends Combat {
  /**
   * @inheritdoc
   */
  async nextRound() {
    // console.log("Combat.nextRound()", this.round, this.turn);

    // If not using Fantasy Trip initiative, use Foundry default
    const useFTInitiative = game.settings.get("fantasy-trip", "useFTInitiative");
    if (!useFTInitiative) return super.nextRound();

    if (this.isMovementRound) {
      // If we've just ended a movement round, calculate rather than roll initiative for the combat round
      await this.updateEmbeddedDocuments(
        "Combatant",
        this.combatants.map((c) => ({
          _id: c._id,
          initiative: c.isDefeated ? 0 : c.actor?.system?.dx?.value + c.initiative / 10,
        }))
      );
    } else {
      // If we've just ended a combat round, roll new initiatives for the movement round

      // Set all defeated combatants initiative to 0, everyone else to null
      await Promise.all(this.combatants.map((c) => this.setInitiative(c._id, c.isDefeated ? 0 : null)));

      // Reroll all remaining initiatives
      await this.rollAll();
    }

    // Advance to the next round
    await super.nextRound();
  }

  // Odd mnumbered rounds are movement rounds
  get isMovementRound() {
    return this.started && !!(this.round % 2);
  }

  // Even numbered rounds are combat rounds
  get isCombatRound() {
    return this.started && !(this.round % 2);
  }

  async rollInitiative(ids, { formula = null, updateTurn = false, messageOptions = {} } = {}) {
    // console.log(
    //   "Combat.rollInitiative()",
    //   "ids",
    //   ids,
    //   "formula",
    //   formula,
    //   "updateTurn",
    //   updateTurn,
    //   "messageOptions",
    //   messageOptions
    // );

    const useFTInitiative = game.settings.get("fantasy-trip", "useFTInitiative");
    const combatGroupInitiative = game.settings.get("fantasy-trip", "combatGroupInitiative");

    // console.log("... useFTInitiative", useFTInitiative, "combatGroupInitiative", combatGroupInitiative);

    // If not using Fantasy Trip initiative, use Foundary default
    if (!useFTInitiative) {
      return super.rollInitiative(ids);
    }

    // Split up the combatants
    const combatants = ids.map((id) => this.combatants.get(id));
    const pcCombatants = combatants.filter((c) => !c.isDefeated).filter((c) => !c.isNPC);
    const npcCombatants = combatants.filter((c) => !c.isDefeated).filter((c) => c.isNPC);

    // Roll group initiatives, reroll until they're different
    let pcGroupRoll, npcGroupRoll;
    const pcGroupBonus = Math.max(...pcCombatants.map((c) => c.actor.system.initiative.party), 0);
    const npcGroupBonus = Math.max(...npcCombatants.map((c) => c.actor.system.initiative.party), 0);
    if (combatGroupInitiative) {
      do {
        pcGroupRoll = (await new Roll(`1d6+${pcGroupBonus}`).evaluate()).total;
        npcGroupRoll = (await new Roll(`1d6+${npcGroupBonus}`).evaluate()).total;
      } while (pcGroupRoll === npcGroupRoll);
    }

    // Roll PC initiative
    await super.rollInitiative(
      pcCombatants.map((c) => c._id),
      {
        formula: [
          combatGroupInitiative ? pcGroupRoll : "1d6",
          "@initiative.situation",
          "@initiative.self",
          combatGroupInitiative ? 0 : pcGroupBonus,
          combatGroupInitiative ? null : "(1d6/10)+(1d6/100)",
        ]
          .filter((t) => !!t)
          .join("+"),
        updateTurn,
        messageOptions,
      }
    );

    // Roll NPC initiative
    await super.rollInitiative(
      npcCombatants.map((c) => c._id),
      {
        formula: [
          combatGroupInitiative ? npcGroupRoll : "1d6",
          "@initiative.situation",
          "@initiative.self",
          combatGroupInitiative ? 0 : npcGroupBonus,
          combatGroupInitiative ? null : "(1d6/10)+(1d6/100)",
        ]
          .filter((t) => !!t)
          .join("+"),
        updateTurn,
        messageOptions,
      }
    );

    // Set all defeated combatants initiative to 0
    await Promise.all(combatants.filter((c) => c.isDefeated).map((c) => this.setInitiative(_id, c._id, 0)));

    return this;
  }
}

/**
 * Check for possible conflicting modules
 */
Hooks.on("ready", async () => {
  if (game.modules.get("monks-combat-details")?.active && game.settings.get("fantasy-trip", "useFTInitiative")) {
    ui.notifications.warn(game.i18n.localize("FT.messages.monksWarning"));
  }
});
