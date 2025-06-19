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
    name: game.i18n.localize("FT.game.settings.initialAP.name"),
    hint: game.i18n.localize("FT.game.settings.initialAP.hint"),
    scope: "world",
    type: new NumberField({ initial: 32 }),
    config: true,
  });

  game.settings.register(FT.id, "useFTInitiative", {
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

  game.settings.register(FT.id, "pcGroupInitiative", {
    name: game.i18n.localize("FT.game.settings.pcGroupInitiative.name"),
    hint: game.i18n.localize("FT.game.settings.pcGroupInitiative.hint"),
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
    name: game.i18n.localize("FT.game.settings.npcGroupInitiative.name"),
    hint: game.i18n.localize("FT.game.settings.npcGroupInitiative.hint"),
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

  game.settings.register(FT.id, "addCastingFatigueAuto", {
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

  game.settings.register(FT.id, "useManaFirst", {
    name: game.i18n.localize("FT.game.settings.useManaFirst.name"),
    hint: game.i18n.localize("FT.game.settings.useManaFirst.hint"),
    scope: "world",
    type: new BooleanField({
      required: true,
      nullable: false,
      initial: true,
    }),
    config: true,
  });

  game.settings.register(FT.id, "showItemIcons", {
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
  CONFIG.Actor.dataModels = { character: FTActorData, npc: FTActorData };
  CONFIG.Actor.documentClass = FTActor;
  foundry.documents.collections.Actors.unregisterSheet("core", foundry.applications.sheets.ActorSheetV2);
  foundry.documents.collections.Actors.registerSheet("FT", FTCharacterSheet, {
    types: ["character", "npc"],
    makeDefault: true,
  });
  foundry.documents.collections.Actors.registerSheet("FT", FTNPCSheet, { types: ["npc"], makeDefault: true });

  // Item document configuration
  CONFIG.Item.dataModels = {
    talent: FTTalentData,
    equipment: FTEquipmentData,
    spell: FTSpellData,
    ability: FTAbilityData,
  };
  CONFIG.Item.documentClass = FTItem;
  foundry.documents.collections.Items.unregisterSheet("core", foundry.applications.sheets.ItemSheetV2);
  foundry.documents.collections.Items.registerSheet("FT", FTItemSheet, { makeDefault: true });

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
    `${FT.path}/templates/sheet/actor/_encumbrance.hbs`,
    `${FT.path}/templates/sheet/actor/_health.hbs`,
    `${FT.path}/templates/sheet/actor/_mana.hbs`,
    `${FT.path}/templates/sheet/actor/_modifiers.hbs`,
    `${FT.path}/templates/sheet/actor/_actions.hbs`,
    //
    `${FT.path}/templates/chat/dice-roll.hbs`,
    `${FT.path}/templates/chat/damage-roll.hbs`,
    //
    `${FT.path}/templates/dialog/apply-damage.hbs`,
    `${FT.path}/templates/application/dice-roller.hbs`,
  ]);
});

/* -------------------------------------------- */
/*  Startup Messages                           
/* -------------------------------------------- */

Hooks.on("ready", async () => {
  // ui.notifications.info(game.i18n.localize("FT.messages.disclaimer"));
  // ui.notifications.info(game.i18n.localize("FT.messages.notice"));
  console.info(FT.prefix, "System ready");
});
