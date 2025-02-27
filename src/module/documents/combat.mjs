import { FT } from "../system/config.mjs";

/**
 * Extend the Foundry CombatTracker class to add system-specific UI data
 */
export class FTCombatTracker extends CombatTracker {
  /**
   * Override the Combat Tracker to display the Fantasy Trip combat phase
   * (movement or combat) as part of the round number header.
   *
   * @inheritdoc
   * @override
   */
  async _renderInner(data) {
    const html = await super._renderInner(data);
    if (data.combat?.round) {
      html
        .find("h3.encounter-title")
        .append(
          `&nbsp;<span>${game.i18n.localize(
            "FT.system.combat.phase." + (data.combat?.system?.phase ?? "movement")
          )}</span>`
        );
    }
    return html;
  }
}

/**
 * Extend the Foundry Combat class to add system-specific functionality
 */
export class FTCombat extends Combat {
  /**
   * Override to ensure initiative & turn order are re-rolled every "round"
   * and that the round only advances after the movement and combat phases
   * have happened.
   *
   * @inheritdoc
   * @override
   */
  async nextRound() {
    // TODO Situational initiative bonuses
    // TODO Bonuses for character tactics & strategy

    // Update to the next combat phase
    await this.update({ "system.phase": this.system.phase === "movement" ? "combat" : "movement" });
    // Reset & re-roll all initiatives
    await this.resetAll();
    console.log("rollAll()", {
      ...(this.system.phase === "combat"
        ? { formula: FT.combat.phase.combat.initiativeFormula }
        : { formula: FT.combat.phase.movement.initiativeFormula }),
      updateTurn: false,
    });
    await this.rollAll();
    // Resequence the turn order according to the new initiative rolls
    this.turns = null;
    this.setupTurns();
    await this.update({ turn: 0 });
    // Only advance to the next round if it's a new movement phase
    if (this.system.phase === "movement") return await super.nextRound();
  }

  /**
   *
   * @inheritdoc
   * @override
   */
  async rollAll(options) {
    return super.rollAll({
      ...(this.system.phase === "combat"
        ? { formula: FT.combat.phase.combat.initiativeFormula }
        : { formula: FT.combat.phase.movement.initiativeFormula }),
      updateTurn: false,
    });
  }
}
