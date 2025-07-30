import { FT } from "../system/config.mjs";
/**
 * Hook into Combat Tracker rendering to display the round type in the header
 */
Hooks.on("renderCombatTracker", async (app, html, data) => {
  // console.log("Hooks.renderCombatTracker", data);
  if (game.settings.get(FT.id, "useFTInitiative") && data.combat?.started) {
    html
      .querySelector(".encounter-title")
      .append(
        ` - ${game.i18n.localize(
          data.combat?.isMovementRound ? "FT.system.combat.phase.movement" : "FT.system.combat.phase.combat"
        )}`
      );
  }
});

/**
 * Override Combat class functions to implement Fantasy Trip initiative.
 *
 * @inheritdoc
 */
export class FTCombat extends foundry.documents.Combat {
  /**
   * @inheritdoc
   */
  async nextRound() {
    // console.log("Combat.nextRound()", this.round, this.turn);

    // If not using Fantasy Trip initiative, use Foundry default
    const useFTInitiative = game.settings.get(FT.id, "useFTInitiative");
    if (!useFTInitiative) return super.nextRound();

    if (this.isMovementRound) {
      // If we've just ended a movement round, calculate rather than roll initiative for the combat round
      await this.updateEmbeddedDocuments(
        "Combatant",
        this.combatants.map((c) => ({
          _id: c._id,
          initiative: c.isDefeated ? 0 : c.actor?.system.initiative.dx + c.initiative / 10,
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

  /**
   * @inheritdoc
   */
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

    const useFTInitiative = game.settings.get(FT.id, "useFTInitiative");
    const pcGroupInitiative = game.settings.get(FT.id, "pcGroupInitiative");
    const npcGroupInitiative = game.settings.get(FT.id, "npcGroupInitiative");

    // console.log("... useFTInitiative", useFTInitiative, "combatGroupInitiative", combatGroupInitiative);

    // If not using Fantasy Trip initiative, use Foundary default
    if (!useFTInitiative) return super.rollInitiative(ids, { formula, updateTurn, messageOptions });

    // Split up the combatants
    const combatants = ids.map((id) => this.combatants.get(id));
    const pcCombatants = combatants.filter((c) => !c.isDefeated).filter((c) => !c.isNPC);
    const npcCombatants = combatants.filter((c) => !c.isDefeated).filter((c) => c.isNPC);

    // Calculate group initiative bonuses & group rolls
    let pcGroupRoll, npcGroupRoll;
    const pcGroupBonus = Math.max(...pcCombatants.map((c) => c.actor.system.initiative.party), 0);
    if (pcGroupInitiative) pcGroupRoll = (await new Roll(`1d6`).evaluate()).total;
    const npcGroupBonus = Math.max(...npcCombatants.map((c) => c.actor.system.initiative.party), 0);
    if (npcGroupInitiative) npcGroupRoll = (await new Roll(`1d6`).evaluate()).total;

    // Roll PC initiative
    super.rollInitiative(
      pcCombatants.map((c) => c._id),
      {
        formula: [
          pcGroupInitiative ? pcGroupRoll : "1d6",
          "@initiative.situation",
          "@initiative.self",
          pcGroupBonus,
          "(1d6/10)+(1d6/100)",
        ]
          .filter((t) => !!t)
          .join("+"),
        updateTurn,
        messageOptions,
      }
    );

    // Roll NPC initiative
    super.rollInitiative(
      npcCombatants.map((c) => c._id),
      {
        formula: [
          npcGroupInitiative ? npcGroupRoll : "1d6",
          "@initiative.situation",
          "@initiative.self",
          npcGroupBonus,
          "(1d6/10)+(1d6/100)",
        ]
          .filter((t) => !!t)
          .join("+"),
        updateTurn,
        messageOptions,
      }
    );

    // Set all defeated combatants initiative to 0
    Promise.all(combatants.filter((c) => c.isDefeated).map((c) => this.setInitiative(_id, c._id, 0)));

    return this;
  }
}

/**
 * Check for possible conflicting modules
 */
Hooks.on("ready", async () => {
  if (game.modules.get("monks-combat-details")?.active && game.settings.get(FT.id, "useFTInitiative")) {
    ui.notifications.warn(game.i18n.localize("FT.messages.monksWarning"));
  }
});
