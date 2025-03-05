// Import Modules
import { FT } from "./system/config.mjs";
import { FTActorData } from "./data/actor-data.mjs";
import { FTActor } from "./documents/actor.mjs";
import { FTCharacterSheet, FTNPCSheet } from "./sheets/actor-sheet.mjs";

import { FTItem } from "./documents/item.mjs";
import { FTEquipmentData, FTTalentData, FTSpellData } from "./data/item-data.mjs";
import { FTItemSheet } from "./sheets/item-sheet.mjs";

import { FTCombatTracker, FTCombatant } from "./documents/combat.mjs";

import * as Macros from "./util/macros.mjs";
import * as Helpers from "./util/helpers.mjs";

const { StringField, NumberField, BooleanField } = foundry.data.fields;

/* -------------------------------------------- */
/*  Define Module Structure                         
/* -------------------------------------------- */

Hooks.once("init", async function () {
  console.info(`FT | Initializing the Fantasy Trip Game System`);

  /* -------------------------------------------- */
  /*  Config                            
  /* -------------------------------------------- */

  // Add custom constants for configuration.
  CONFIG.FT = FT;

  // Active Effects are never copied to the Actor,
  // but will still apply to the Actor from within the Item
  // if the transfer property on the Active Effect is true.
  CONFIG.ActiveEffect.legacyTransferral = false;

  /* -------------------------------------------- */
  /*  Game Settings                            
  /* -------------------------------------------- */

  // Add utility classes to the global game object so that they're more easily
  // accessible in global contexts.
  game.ft = {
    FTActor,
    FTItem,
  };

  /*
   * Define game settings
   */
  game.settings.register("fantasytrip", "initialAP", {
    name: game.i18n.localize("FT.game.settings.initialAP.name"),
    hint: game.i18n.localize("FT.game.settings.initialAP.hint"),
    scope: "world",
    type: new NumberField({ initial: 32 }),
    config: true,
  });

  game.settings.register("fantasytrip", "initiativeType", {
    name: game.i18n.localize("FT.game.settings.initiativeType.name"),
    hint: game.i18n.localize("FT.game.settings.initiativeType.hint"),
    scope: "world",
    type: new StringField({
      choices: {
        individual: game.i18n.localize("FT.game.settings.initiativeType.options.individual"),
        group: game.i18n.localize("FT.game.settings.initiativeType.options.group"),
      },
      required: true,
      nullable: false,
      initial: "group",
    }),
    config: true,
    restricted: true,
    requiresReload: false,
  });

  game.settings.register("fantasytrip", "damageMultiplierStrategy", {
    name: game.i18n.localize("FT.game.settings.damageMultiplierStrategy.name"),
    hint: game.i18n.localize("FT.game.settings.damageMultiplierStrategy.hint"),
    scope: "world",
    type: new StringField({
      choices: {
        rollTimes: game.i18n.localize("FT.game.settings.damageMultiplierStrategy.options.rollTimes"),
        multiply: game.i18n.localize("FT.game.settings.damageMultiplierStrategy.options.multiply"),
      },
      required: true,
      nullable: false,
      initial: "multiply",
    }),
    config: true,
    restricted: true,
    requiresReload: true,
  });

  game.settings.register("fantasytrip", "allowTalentSpendOnIQIncrease", {
    name: game.i18n.localize("FT.game.settings.allowTalentSpendOnIQIncrease.name"),
    hint: game.i18n.localize("FT.game.settings.allowTalentSpendOnIQIncrease.hint"),
    scope: "world",
    type: new BooleanField({ initial: true }),
    config: true,
  });

  game.settings.register("fantasytrip", "showItemIcons", {
    name: game.i18n.localize("FT.game.settings.showItemIcons.name"),
    hint: game.i18n.localize("FT.game.settings.showItemIcons.hint"),
    scope: "world",
    type: new BooleanField({ initial: true }),
    config: true,
  });

  /* -------------------------------------------- */
  /*  Define Entities & Sheets                           
  /* -------------------------------------------- */

  // Actor document configuration
  CONFIG.Actor.dataModels.character = FTActorData;
  CONFIG.Actor.dataModels.npc = FTActorData;
  CONFIG.Actor.documentClass = FTActor;
  Actors.unregisterSheet("core", ActorSheet);
  Actors.registerSheet("FT", FTCharacterSheet, { types: ["character", "npc"], makeDefault: true });
  Actors.registerSheet("FT", FTNPCSheet, { types: ["npc"], makeDefault: true });

  // Item document configuration
  CONFIG.Item.dataModels = {
    talent: FTTalentData,
    spell: FTSpellData,
    equipment: FTEquipmentData,
  };
  CONFIG.Item.documentClass = FTItem;
  Items.unregisterSheet("core", ItemSheet);
  Items.registerSheet("FT", FTItemSheet, { makeDefault: true });

  // Other document configuration
  CONFIG.ui.combat = FTCombatTracker;
  CONFIG.Combatant.documentClass = FTCombatant;
  CONFIG.Combat.initiative.formula = FT.combat.initiative.formula;

  /* -------------------------------------------- */
  /*  Handlebars Helpers & Partials                      
  /* -------------------------------------------- */

  Handlebars.registerHelper("log", Helpers.log);
  Handlebars.registerHelper("stringify", Helpers.stringify);
  Handlebars.registerHelper("property", Helpers.property);
  Handlebars.registerHelper("offset", Helpers.offset);
  Handlebars.registerHelper("object", Helpers.object);
  Handlebars.registerHelper("array", Helpers.array);
  Handlebars.registerHelper("range", Helpers.range);
  Handlebars.registerHelper("abbrev", Helpers.abbrev);
  Handlebars.registerHelper("abs", Helpers.abs);
  Handlebars.registerHelper("sort", Helpers.sort);
  Handlebars.registerHelper("includes", Helpers.includes);
  Handlebars.registerHelper("between", Helpers.between);
  Handlebars.registerHelper("startsWith", Helpers.startsWith);

  loadTemplates([
    `${CONFIG.FT.path}/templates/sheet/character/character-sheet.hbs`,
    `${CONFIG.FT.path}/templates/sheet/character/_header.hbs`,
    `${CONFIG.FT.path}/templates/sheet/character/_navigation.hbs`,
    `${CONFIG.FT.path}/templates/sheet/character/_tab-character.hbs`,
    `${CONFIG.FT.path}/templates/sheet/character/_stats.hbs`,
    `${CONFIG.FT.path}/templates/sheet/character/_status.hbs`,
    `${CONFIG.FT.path}/templates/sheet/character/_action.hbs`,
    `${CONFIG.FT.path}/templates/sheet/character/_tab-notes.hbs`,
    `${CONFIG.FT.path}/templates/sheet/character/_tab-talents.hbs`,
    `${CONFIG.FT.path}/templates/sheet/character/_tab-inventory.hbs`,
    `${CONFIG.FT.path}/templates/sheet/character/_tab-spells.hbs`,
    `${CONFIG.FT.path}/templates/sheet/character/_tab-effects.hbs`,
    //
    `${CONFIG.FT.path}/templates/sheet/npc/npc-sheet.hbs`,
    `${CONFIG.FT.path}/templates/sheet/npc/_header.hbs`,
    `${CONFIG.FT.path}/templates/sheet/npc/_navigation.hbs`,
    `${CONFIG.FT.path}/templates/sheet/npc/_tab-character.hbs`,
    `${CONFIG.FT.path}/templates/sheet/npc/_stats.hbs`,
    `${CONFIG.FT.path}/templates/sheet/npc/_status.hbs`,
    `${CONFIG.FT.path}/templates/sheet/npc/_action.hbs`,
    `${CONFIG.FT.path}/templates/sheet/npc/_tab-notes.hbs`,
    `${CONFIG.FT.path}/templates/sheet/npc/_tab-inventory.hbs`,
    `${CONFIG.FT.path}/templates/sheet/npc/_tab-effects.hbs`,
    //
    `${CONFIG.FT.path}/templates/sheet/item/item-sheet.hbs`,
    `${CONFIG.FT.path}/templates/sheet/item/_header.hbs`,
    `${CONFIG.FT.path}/templates/sheet/item/_navigation.hbs`,
    `${CONFIG.FT.path}/templates/sheet/item/_tab-description.hbs`,
    `${CONFIG.FT.path}/templates/sheet/item/_tab-actions.hbs`,
    `${CONFIG.FT.path}/templates/sheet/item/_tab-effects.hbs`,
    //
    `${CONFIG.FT.path}/templates/application/dice-roller.hbs`,
  ]);
});

/* -------------------------------------------- */
/*  Hotbar Macros                               
/* -------------------------------------------- */

Hooks.once("ready", async function () {
  // Wait to register hotbar drop hook on ready so that modules could register earlier if they want to
  Hooks.on("hotbarDrop", (bar, data, slot) => Macros.createHotbarMacro(data, slot));
});
