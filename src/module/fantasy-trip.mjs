// Import Modules
import { FT } from "./system/config.mjs";
import { FTActorData } from "./data/actor-data.mjs";
import { FTActor } from "./documents/actor.mjs";
import { FTCharacterSheet, FTNPCSheet } from "./sheets/actor-sheet.mjs";

import { FTItem } from "./documents/item.mjs";
import { FTEquipmentData, FTTalentData, FTSpellData } from "./data/item-data.mjs";
import { FTItemSheet } from "./sheets/item-sheet.mjs";

import { FTCombat } from "./documents/combat.mjs";
import * as ChatMessage from "./documents/chat-message.mjs";
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

  // Time settings
  CONFIG.time.roundTime = 1;
  CONFIG.time.turnTime = 1;

  // Combat
  CONFIG.Combat.initiative.formula = "1d6+@initiative.situation+@initiative.self+(1d6/10)+(1d6/100)";

  /* -------------------------------------------- */
  /*  Game Settings                            
  /* -------------------------------------------- */

  game.settings.register("fantasy-trip", "initialAP", {
    name: game.i18n.localize("FT.game.settings.initialAP.name"),
    hint: game.i18n.localize("FT.game.settings.initialAP.hint"),
    scope: "world",
    type: new NumberField({ initial: 32 }),
    config: true,
  });

  game.settings.register("fantasy-trip", "useFTInitiative", {
    name: game.i18n.localize("FT.game.settings.useFTInitiative.name"),
    hint: game.i18n.localize("FT.game.settings.useFTInitiative.hint"),
    scope: "world",
    type: new BooleanField({
      required: true,
      nullable: false,
      initial: true,
    }),
    config: true,
    restricted: true,
    requiresReload: false,
  });

  game.settings.register("fantasy-trip", "combatGroupInitiative", {
    name: game.i18n.localize("FT.game.settings.combatGroupInitiative.name"),
    hint: game.i18n.localize("FT.game.settings.combatGroupInitiative.hint"),
    scope: "world",
    type: new BooleanField({
      required: true,
      nullable: false,
      initial: true,
    }),
    config: true,
    restricted: true,
    requiresReload: true,
  });

  game.settings.register("fantasy-trip", "damageMultiplierStrategy", {
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

  game.settings.register("fantasy-trip", "addCastingFatigueAuto", {
    name: game.i18n.localize("FT.game.settings.addCastingFatigueAuto.name"),
    hint: game.i18n.localize("FT.game.settings.addCastingFatigueAuto.hint"),
    scope: "world",
    type: new BooleanField({
      required: true,
      nullable: false,
      initial: true,
    }),
    config: true,
  });

  game.settings.register("fantasy-trip", "cancelAttackSpellAuto", {
    name: game.i18n.localize("FT.game.settings.cancelAttackSpellAuto.name"),
    hint: game.i18n.localize("FT.game.settings.cancelAttackSpellAuto.hint"),
    scope: "world",
    type: new BooleanField({
      required: true,
      nullable: false,
      initial: true,
    }),
    config: true,
  });

  game.settings.register("fantasy-trip", "showItemIcons", {
    name: game.i18n.localize("FT.game.settings.showItemIcons.name"),
    hint: game.i18n.localize("FT.game.settings.showItemIcons.hint"),
    scope: "world",
    type: new BooleanField({ initial: true }),
    config: true,
  });

  /* -------------------------------------------- */
  /*  Define Documents & Sheets                           
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
  CONFIG.Combat.documentClass = FTCombat;

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
    `${CONFIG.FT.path}/templates/chat/dice-roll.hbs`,
    `${CONFIG.FT.path}/templates/chat/damage-roll.hbs`,
    //
    `${CONFIG.FT.path}/templates/dialog/apply-damage.hbs`,
    `${CONFIG.FT.path}/templates/application/dice-roller.hbs`,
  ]);
});

/* -------------------------------------------- */
/*  Startup Messages                           
/* -------------------------------------------- */

Hooks.on("ready", async () => {
  ui.notifications.info(game.i18n.localize("FT.messages.disclaimer"));
  ui.notifications.info(game.i18n.localize("FT.messages.notice"));
});
