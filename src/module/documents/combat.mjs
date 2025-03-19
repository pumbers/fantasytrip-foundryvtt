/**
 * Patch Foundry to use Fantasy Trip split movement/combat initiative
 */

/**
 * Hook into Combat Tracker rendering to display the round type in the header
 */
Hooks.on("renderCombatTracker", async (app, html, data) => {
  if (!!data.combat) {
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
 * Hook into the Combat document update to reroll initiative at the start of each new round
 */
Hooks.on("updateCombat", async (combat, updateData, updateOptions) => {
  if (
    game.user.isGM &&
    combat.combatants.size &&
    combat.started &&
    updateOptions.direction === 1 &&
    updateData.round > 1 &&
    updateData.turn == 0
  ) {
    await combat.rollInitiative(
      combat.combatants.filter((c) => !c.isDefeated).map((c) => c.id),
      { updateTurn: false }
    );
    await combat.update({ turn: 0 });
    combat.debounceSetup();
  }
});

/**
 * Add two new convenience function to the Combat class
 */
export class FTCombat extends Combat {
  // Odd mnumbered rounds are movement rounds
  get isMovementRound() {
    return this.started && !!(this.round % 2);
  }

  // Even numbered rounds are combat rounds
  get isCombatRound() {
    return this.started && !(this.round % 2);
  }
}

/**
 * Override Combatant initiative rolling to use two initiative formulae
 */
export class FTCombatant extends Combatant {
  getInitiativeRoll(formula) {
    const combat = this.parent;
    const combatant = this;

    if (combat.isCombatRound) {
      // Use character adjDX + existing initiative as tiebreaker
      return super.getInitiativeRoll(`@dx.value+${(combatant.initiative / 10).toFixed(2)}`);
    } else {
      // Party is either...
      // ... Other PC's if combatant is a PC
      // ... Other NPC's of the same Actor name (ie NPC type) if combatant is an NPC
      const party = combat.combatants
        .filter((c) => !c.isDefeated)
        .filter(
          (c) => (!combatant.isNPC && !c.isNPC) || (combatant.isNPC && c.isNPC && c.actor.name === combatant.actor.name)
        );

      // Party bonus is the highest party bonus from all party members of the same actor name
      const partyBonus = Math.max(...party.map((c) => c.actor.system.initiative.party));

      return super.getInitiativeRoll(`1d6+@initiative.situation+@initiative.self+${partyBonus}+(1d6/10)+(1d6/100)`);
    }
  }
}
