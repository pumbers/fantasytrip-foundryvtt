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
 * Hook into the Combat document update to reroll initiative at the start of each new round
 */
Hooks.on("updateCombat", async (combat, updateData, updateOptions) => {
  // If not using Fantasy Trip initiative, exit now
  if (!game.settings.get("fantasy-trip", "useFTInitiative")) return;

  if (
    game.user.isGM && // only th GM gets to roll initiative
    combat.combatants.size > 0 && // must have some combatants
    combat.started && // combat must be started
    updateOptions.direction === 1 && // must be advancing round
    updateData.round > 1 // only for round 2 or later
  ) {
    const combatPCGroupInitiative = game.settings.get("fantasy-trip", "combatPCGroupInitiative");
    const combatNPCGroupInitiative = game.settings.get("fantasy-trip", "combatNPCGroupInitiative");
    const combatantNPCGroupByActor = game.settings.get("fantasy-trip", "combatantNPCGroupByActor");

    // Break up combatants into PC & NPC groups
    const pcCombatants = combat.combatants.filter((c) => !c.isDefeated).filter((c) => !c.isNPC);
    const npcCombatants = combat.combatants.filter((c) => !c.isDefeated).filter((c) => c.isNPC);

    const combatantGroups = {
      PCs: {
        ids: pcCombatants.map((c) => c._id),
        roll: combatPCGroupInitiative ? (await new Roll("1d6").evaluate()).total : "1d6",
        partyBonus: Math.max(...pcCombatants.map((c) => c.actor.system.initiative.party)),
      },
    };

    if (combatantNPCGroupByActor) {
      // For group initiative by Actor name, create a combatant group for each Actor
      await npcCombatants.reduce(async (groupsPromise, combatant) => {
        const groups = await groupsPromise;
        if (!(combatant.actor.name in groups)) {
          groups[combatant.actor.name] = {
            ids: [],
            roll: combatNPCGroupInitiative ? (await new Roll("1d6").evaluate()).total : "1d6",
            partyBonus: Math.max(
              ...npcCombatants
                .filter((c) => c.actor.name === combatant.actor.name)
                .map((c) => c.actor.system.initiative.party)
            ),
          };
        }
        groups[combatant.actor.name].ids.push(combatant._id);
        return groups;
      }, Promise.resolve(combatantGroups));
    } else {
      // For group initiative by type, just create an NPCs group
      combatantGroups.NPCs = {
        ids: npcCombatants.map((c) => c._id),
        roll: combatNPCGroupInitiative ? (await new Roll("1d6").evaluate()).total : "1d6",
        partyBonus: Math.max(...npcCombatants.map((c) => c.actor.system.initiative.party)),
      };
    }

    if (combat.isCombatRound) {
      await Promise.all(
        [...pcCombatants, ...npcCombatants]
          .filter((c) => !c.isDefeated)
          .map((c) => {
            return combat.rollInitiative(c._id, {
              formula: `@dx.value+${(c.initiative / 10).toFixed(2)}`,
              updateTurn: false,
            });
          })
      );
    } else {
      await Promise.all(
        Object.values(combatantGroups)
          .map((g) => {
            return combat.rollInitiative(g.ids, {
              formula: `${g.roll}+@initiative.situation+@initiative.self+${g.partyBonus}+(1d6/10)+(1d6/100)`,
              updateTurn: false,
            });
          })
          .flat()
      );
    }

    // Ensure any defeated combatants have their initiative set to 0
    await combat.updateEmbeddedDocuments(
      "Combatant",
      Array.from(combat.combatants.values())
        .filter((c) => c.defeated && c.initiative > 0)
        .map((c) => ({ _id: c._id, initiative: 0 }))
    );

    // Set the turn to the first undefeated combatant and set turn order
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
 * Check for possible conflicting modules
 */
Hooks.on("ready", async () => {
  if (game.modules.get("monks-combat-details")?.active && game.settings.get("fantasy-trip", "useFTInitiative")) {
    ui.notifications.warn(game.i18n.localize("FT.messages.monksWarning"));
  }
});
