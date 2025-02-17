// Import Modules
import { FT } from "./system/config.mjs";
import { FTActorData } from "./data/actor-data.mjs";
import { FTActor } from "./documents/actor.mjs";
import { FTCharacterSheet } from "./sheets/character-sheet.mjs";

import { FTItem } from "./documents/item.mjs";
import {
  FTEquipmentData,
  FTTalentData,
  FTSpellData,
  FTWeaponData,
  FTArmorData,
  FTShieldData,
} from "./data/item-data.mjs";
import { FTItemSheet } from "./sheets/item-sheet.mjs";

import * as Macros from "./util/macros.mjs";
import * as Helpers from "./util/helpers.mjs";
import "./util/extensions.mjs";

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

  /**
   * Set an initiative formula for the system
   * @type {String}
   */
  CONFIG.Combat.initiative = {
    formula: "1d10",
    decimals: 0,
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

  game.settings.register("fantasytrip", "damageMultiplierStrategy", {
    name: game.i18n.localize("FT.game.settings.damageMultiplierStrategy.name"),
    hint: game.i18n.localize("FT.game.settings.damageMultiplierStrategy.hint"),
    scope: "world",
    type: new StringField({
      choices: {
        rollTimes: game.i18n.localize("FT.game.settings.damageMultiplierStrategy.options.rollTimes"),
        multiply: game.i18n.localize("FT.game.settings.damageMultiplierStrategy.options.multiply"),
      },
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

  /*
   * Define custom Entity classes
   */
  CONFIG.Actor.dataModels.character = FTActorData;
  CONFIG.Actor.documentClass = FTActor;
  CONFIG.Actor.trackableAttributes = {
    character: {
      bar: ["st"],
    },
  };

  CONFIG.Item.dataModels = {
    talent: FTTalentData,
    spell: FTSpellData,
    equipment: FTEquipmentData,
    weapon: FTWeaponData,
    armor: FTArmorData,
    shield: FTShieldData,
  };
  CONFIG.Item.documentClass = FTItem;

  /*
   * Register Sheet Application Classes
   */
  Actors.unregisterSheet("core", ActorSheet);
  Actors.registerSheet("FT", FTCharacterSheet, { types: ["character"], makeDefault: true });
  // Actors.registerSheet("FT", FTNpcSheet, { types: ["npc"], makeDefault: true });
  Items.unregisterSheet("core", ItemSheet);
  Items.registerSheet("FT", FTItemSheet, { makeDefault: true });

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
    `${CONFIG.FT.path}/templates/sheets/character-sheet.hbs`,
    `${CONFIG.FT.path}/templates/sheets/_character-stats.hbs`,
    `${CONFIG.FT.path}/templates/sheets/_character-status.hbs`,
    `${CONFIG.FT.path}/templates/sheets/_character-action.hbs`,
    `${CONFIG.FT.path}/templates/sheets/_character-talents.hbs`,
    `${CONFIG.FT.path}/templates/sheets/_character-items.hbs`,
    `${CONFIG.FT.path}/templates/sheets/_character-spells.hbs`,
    `${CONFIG.FT.path}/templates/sheets/_character-effects.hbs`,
    `${CONFIG.FT.path}/templates/sheets/item-sheet.hbs`,
    `${CONFIG.FT.path}/templates/sheets/_item-effects.hbs`,
  ]);
});

/* -------------------------------------------- */
/*  Hotbar Macros                               
/* -------------------------------------------- */

Hooks.once("ready", async function () {
  // Wait to register hotbar drop hook on ready so that modules could register earlier if they want to
  Hooks.on("hotbarDrop", (bar, data, slot) => Macros.createHotbarMacro(data, slot));
});

// Hooks.on("ready", () => {
//   ui.notifications.info("Fantasy Trip for Foundry VTT is © Code Theoretic Inc.");
// });
