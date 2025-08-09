// Import Modules
import { FT } from "./system/config.mjs";
import { FTActorData } from "./data/actor-data.mjs";
import { FTActor } from "./documents/actor.mjs";
import { FTCharacterSheet, FTNPCSheet } from "./sheets/actor-sheet.mjs";

import { FTItem } from "./documents/item.mjs";
import { FTEquipmentData, FTTalentData, FTSpellData, FTAbilityData } from "./data/item-data.mjs";
import { FTItemSheet } from "./sheets/item-sheet.mjs";

import { FTCombat } from "./documents/combat.mjs";
import * as ChatMessage from "./documents/chat-message.mjs";
import * as Helpers from "./util/helpers.mjs";

const { StringField, NumberField, BooleanField } = foundry.data.fields;

/* -------------------------------------------- */
/*  Define Module Structure                         
/* -------------------------------------------- */

Hooks.once("init", async function () {
  console.info(FT.prefix, "Initializing the Fantasy Trip Game System");

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
  CONFIG.Actor.trackableAttributes = { character: { bar: ["st"], value: [] }, npc: { bar: ["st"], value: [] } };

  /* -------------------------------------------- */
  /*  Game Settings                            
  /* -------------------------------------------- */

  game.settings.register(FT.id, "initialAP", {
    name: game.i18n.localize("FT.game.setting.initialAP.name"),
    hint: game.i18n.localize("FT.game.setting.initialAP.hint"),
    scope: "world",
    type: new NumberField({ initial: 32 }),
    config: true,
  });

  game.settings.register(FT.id, "checkIQForLearned", {
    name: game.i18n.localize("FT.game.setting.checkIQForLearned.name"),
    hint: game.i18n.localize("FT.game.setting.checkIQForLearned.hint"),
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

  game.settings.register(FT.id, "useFTInitiative", {
    name: game.i18n.localize("FT.game.setting.useFTInitiative.name"),
    hint: game.i18n.localize("FT.game.setting.useFTInitiative.hint"),
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

  game.settings.register(FT.id, "pcGroupInitiative", {
    name: game.i18n.localize("FT.game.setting.pcGroupInitiative.name"),
    hint: game.i18n.localize("FT.game.setting.pcGroupInitiative.hint"),
    scope: "world",
    type: new BooleanField({
      required: true,
      nullable: false,
      initial: false,
    }),
    config: true,
    restricted: true,
    requiresReload: true,
  });

  game.settings.register(FT.id, "npcGroupInitiative", {
    name: game.i18n.localize("FT.game.setting.npcGroupInitiative.name"),
    hint: game.i18n.localize("FT.game.setting.npcGroupInitiative.hint"),
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

  game.settings.register(FT.id, "damageMultiplierStrategy", {
    name: game.i18n.localize("FT.game.setting.damageMultiplierStrategy.name"),
    hint: game.i18n.localize("FT.game.setting.damageMultiplierStrategy.hint"),
    scope: "world",
    type: new StringField({
      choices: {
        rollTimes: game.i18n.localize("FT.game.setting.damageMultiplierStrategy.options.rollTimes"),
        multiply: game.i18n.localize("FT.game.setting.damageMultiplierStrategy.options.multiply"),
      },
      required: true,
      nullable: false,
      initial: "multiply",
    }),
    config: true,
    restricted: true,
    requiresReload: true,
  });

  game.settings.register(FT.id, "addCastingFatigueAuto", {
    name: game.i18n.localize("FT.game.setting.addCastingFatigueAuto.name"),
    hint: game.i18n.localize("FT.game.setting.addCastingFatigueAuto.hint"),
    scope: "world",
    type: new BooleanField({
      required: true,
      nullable: false,
      initial: true,
    }),
    config: true,
  });

  game.settings.register(FT.id, "useManaFirst", {
    name: game.i18n.localize("FT.game.setting.useManaFirst.name"),
    hint: game.i18n.localize("FT.game.setting.useManaFirst.hint"),
    scope: "world",
    type: new BooleanField({
      required: true,
      nullable: false,
      initial: true,
    }),
    config: true,
  });

  game.settings.register(FT.id, "showItemIcons", {
    name: game.i18n.localize("FT.game.setting.showItemIcons.name"),
    hint: game.i18n.localize("FT.game.setting.showItemIcons.hint"),
    scope: "world",
    type: new BooleanField({ initial: true }),
    config: true,
  });

  game.settings.register(FT.id, "pdfPagerEnabled", {
    scope: "world",
    type: new BooleanField({ initial: false }),
  });

  /* -------------------------------------------- */
  /*  Define Documents & Sheets                           
  /* -------------------------------------------- */

  // Actor document configuration
  CONFIG.Actor.dataModels = { character: FTActorData, npc: FTActorData };
  CONFIG.Actor.documentClass = FTActor;
  foundry.documents.collections.Actors.unregisterSheet("core", foundry.applications.sheets.ActorSheetV2);
  foundry.documents.collections.Actors.registerSheet(FT.id, FTCharacterSheet, {
    types: ["character", "npc"],
    makeDefault: true,
  });
  foundry.documents.collections.Actors.registerSheet(FT.id, FTNPCSheet, { types: ["npc"], makeDefault: true });

  // Item document configuration
  CONFIG.Item.dataModels = {
    talent: FTTalentData,
    equipment: FTEquipmentData,
    spell: FTSpellData,
    ability: FTAbilityData,
  };
  CONFIG.Item.documentClass = FTItem;
  foundry.documents.collections.Items.unregisterSheet("core", foundry.applications.sheets.ItemSheetV2);
  foundry.documents.collections.Items.registerSheet(FT.id, FTItemSheet, { makeDefault: true });

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
  Handlebars.registerHelper("statusEffect", Helpers.statusEffect);

  foundry.applications.handlebars.loadTemplates([
    //
    `${FT.path}/templates/chat/dice-roll.hbs`,
    `${FT.path}/templates/chat/damage-roll.hbs`,
    //
    `${FT.path}/templates/dialog/apply-damage.hbs`,
  ]);
});

/* -------------------------------------------- */
/*  Startup Messages                           
/* -------------------------------------------- */

Hooks.on("ready", async () => {
  ui.notifications.info(game.i18n.localize("FT.game.message.disclaimer"));
  ui.notifications.info(game.i18n.localize("FT.game.message.notice"));
  console.info(FT.prefix, "System ready");

  // Check for PDF Pager module and enable integration if active
  if (game.modules.has("pdf-pager")) {
    game.settings.set(FT.id, "pdfPagerEnabled", game.modules.get("pdf-pager")?.active);
    console.info(FT.prefix, "PDF Pager module found, setting PDF references", game.modules.get("pdf-pager")?.active);
  }
});
