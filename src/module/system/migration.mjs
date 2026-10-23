import { FT } from "./config.mjs";

/*****************************************************************************
 * Fantasy Trip World Data Migration
 *
 * Each migration step has the system version that introduced it, and is run
 * once per world (tracked in the "systemMigrationVersion" world setting).
 * Steps must be idempotent, so that an interrupted migration can be re-run.
 *****************************************************************************/

/**
 * Effects on equipment & abilities had their disabled flag set automatically
 * during data preparation prior to 1.3.0. That is now handled by
 * FTActiveEffect#isSuppressed, so clear any disabled flags left behind.
 *
 * @param {Object} itemData Item source data
 * @returns {Array<Object>} ActiveEffect updates (empty if none needed)
 */
export function clearItemEffectsDisabled(itemData) {
  if (![...FT.item.inventory.types, "ability"].includes(itemData.type))
    return [];
  return (itemData.effects ?? [])
    .filter((effect) => effect.disabled)
    .map((effect) => ({ _id: effect._id, disabled: false }));
}

const MIGRATIONS = [{ version: "1.3.0", itemEffects: clearItemEffectsDisabled }];

/**
 * Select the migration steps which have not yet been applied to the world.
 *
 * @param {String} current The version the world was last migrated to (empty if never)
 * @returns {Array<Object>} Migration steps
 */
export function pendingMigrations(current, migrations = MIGRATIONS) {
  return migrations.filter(
    (step) => !current || foundry.utils.isNewerVersion(step.version, current),
  );
}

/**
 * Run any pending migrations on the world. Only runs for one active GM.
 */
export async function migrateWorld() {
  if (!game.users.activeGM?.isSelf) return;

  const steps = pendingMigrations(
    game.settings.get(FT.id, "systemMigrationVersion"),
  );
  if (!steps.length) return;

  const version = steps.at(-1).version;
  console.info(FT.prefix, "Migrating world data to version", version);
  ui.notifications.info("FT.game.message.migration.start", {
    localize: true,
    format: { version },
  });

  let failures = 0;
  const migrateItem = async (item) => {
    for (const step of steps) {
      try {
        const updates = step.itemEffects(item.toObject());
        if (updates.length)
          await item.updateEmbeddedDocuments("ActiveEffect", updates);
      } catch (error) {
        failures++;
        console.error(
          FT.prefix,
          `Migration ${step.version} failed for ${item.uuid}`,
          error,
        );
      }
    }
  };

  // World items, actors and unlinked tokens
  for (const item of game.items) await migrateItem(item);
  for (const actor of game.actors) {
    for (const item of actor.items) await migrateItem(item);
  }
  for (const scene of game.scenes) {
    for (const token of scene.tokens) {
      if (token.actorLink || !token.actor) continue;
      for (const item of token.actor.items) await migrateItem(item);
    }
  }

  // World compendiums only (system & module packs are left alone)
  const packs = game.packs.filter(
    (pack) =>
      pack.metadata.packageType === "world" &&
      ["Item", "Actor"].includes(pack.documentName),
  );
  for (const pack of packs) {
    const wasLocked = pack.locked;
    try {
      if (wasLocked) await pack.configure({ locked: false });
      for (const document of await pack.getDocuments()) {
        if (pack.documentName === "Item") await migrateItem(document);
        else for (const item of document.items) await migrateItem(item);
      }
    } catch (error) {
      failures++;
      console.error(FT.prefix, `Migration failed for pack ${pack.collection}`, error);
    } finally {
      if (wasLocked) await pack.configure({ locked: true });
    }
  }

  await game.settings.set(FT.id, "systemMigrationVersion", version);

  if (failures) {
    ui.notifications.warn("FT.game.message.migration.failed", {
      localize: true,
      format: { version, count: failures },
    });
  } else {
    ui.notifications.info("FT.game.message.migration.complete", {
      localize: true,
      format: { version },
    });
  }
  console.info(FT.prefix, "Migration to version", version, "complete with", failures, "failure(s)");
}
