import { FT } from "../config.mjs";

/*****************************************************************************
 * Apply Spell Effects
 *
 * Effects on targets the caster owns (or on any target, for a GM caster) are
 * applied directly. Other targets are sent to the active GM as a query, and
 * the GM confirms which targets receive the effects.
 *****************************************************************************/

export const QUERY_NAME = `${FT.id}.applySpellEffects`;
const QUERY_TIMEOUT = 120000; // 2 minutes for the GM to respond

/**
 * Split targets into those whose effects can be applied directly, and those
 * which must be confirmed by the GM.
 *
 * @param {Array<Object>} targets
 * @param {Boolean} isGM Whether the caster is a GM
 * @param {Function} isOwned Whether the caster owns a target
 * @returns {{direct: Array<Object>, request: Array<Object>}}
 */
export function partitionTargets(targets, isGM, isOwned) {
  const direct = targets.filter((target) => isGM || isOwned(target));
  const request = targets.filter((target) => !direct.includes(target));
  return { direct, request };
}

/**
 * Build ActiveEffect creation data from a spell's effect source data.
 *
 * @param {Array<Object>} effects Effect source data (from toObject())
 * @param {String} origin The spell UUID
 * @returns {Array<Object>}
 */
export function buildEffectData(effects, origin) {
  return effects.map((effect) => {
    const data = { ...effect, origin, transfer: false };
    delete data._id;
    return data;
  });
}

/**
 * Create a spell's effects on each target token's actor.
 *
 * @param {Item} spell
 * @param {Array<TokenDocument>} tokens
 * @returns {Promise<{applied: Array<String>, failed: Array<String>}>} Token names
 */
async function createEffects(spell, tokens) {
  const effectData = buildEffectData(
    Array.from(spell.effects, (effect) => effect.toObject()),
    spell.uuid,
  );
  const applied = [];
  const failed = [];
  for (const token of tokens) {
    try {
      await token.actor.createEmbeddedDocuments("ActiveEffect", effectData);
      applied.push(token.name);
    } catch (error) {
      console.error(
        FT.prefix,
        `Unable to apply ${spell.name} to ${token.name}`,
        error,
      );
      failed.push(token.name);
    }
  }
  return { applied, failed };
}

/**
 * Apply a spell's effects to the targeted tokens, asking the GM to confirm
 * any targets the caster does not own.
 *
 * @param {Actor} caster
 * @param {Item} spell
 * @param {Array<Token>} targets
 */
export async function applySpellEffects(caster, spell, targets) {
  const tokens = targets
    .map((target) => target.document)
    .filter((token) => token?.actor);
  const { direct, request } = partitionTargets(
    tokens,
    game.user.isGM,
    (token) => token.actor.isOwner,
  );

  const result = { applied: [], declined: [], failed: [] };
  const merge = (partial) =>
    Object.keys(result).forEach((key) =>
      result[key].push(...(partial?.[key] ?? [])),
    );

  // Targets the caster can update themselves
  if (direct.length) merge(await createEffects(spell, direct));

  // Targets the GM must confirm
  if (request.length) {
    const names = request.map((token) => token.name).join(", ");
    const gm = game.users.activeGM;
    if (!gm) {
      ui.notifications.warn("FT.effect.result.noGM", {
        localize: true,
        format: { spell: spell.name, targets: names },
      });
    } else {
      try {
        merge(
          await gm.query(
            QUERY_NAME,
            {
              spellUuid: spell.uuid,
              casterUuid: caster.uuid,
              targetUuids: request.map((token) => token.uuid),
            },
            { timeout: QUERY_TIMEOUT },
          ),
        );
      } catch (error) {
        console.error(
          FT.prefix,
          "No response to apply spell effects query",
          error,
        );
        ui.notifications.warn("FT.effect.result.noResponse", {
          localize: true,
          format: { spell: spell.name, targets: names },
        });
      }
    }
  }

  // Report the outcome
  const speaker = ChatMessage.getSpeaker({ actor: caster });
  if (result.applied.length) {
    ChatMessage.create({
      speaker,
      flavor: game.i18n.format("FT.effect.result.spell", {
        spell: spell.name,
        targets: result.applied.join(", "),
      }),
    });
  }
  if (result.declined.length) {
    ChatMessage.create({
      speaker,
      flavor: game.i18n.format("FT.effect.result.declined", {
        spell: spell.name,
        targets: result.declined.join(", "),
      }),
      whisper: [game.user.id],
    });
  }
  if (result.failed.length) {
    ui.notifications.warn("FT.effect.result.failed", {
      localize: true,
      format: { spell: spell.name, targets: result.failed.join(", ") },
    });
  }
}

/**
 * Query handler, run on the GM's client: ask the GM which targets should
 * receive the spell's effects, then apply them.
 *
 * @param {Object} queryData
 * @param {Object} [queryOptions]
 * @returns {Promise<{applied: Array<String>, declined: Array<String>, failed: Array<String>}>}
 */
export async function handleApplySpellEffectsQuery(
  { spellUuid, casterUuid, targetUuids },
  { timeout } = {},
) {
  const started = Date.now();

  // Effects always come from the spell itself, never from the request
  const { fromUuid } = foundry.utils;
  const spell = await fromUuid(spellUuid);
  const caster = await fromUuid(casterUuid);
  const tokens = (
    await Promise.all(targetUuids.map((uuid) => fromUuid(uuid)))
  ).filter((token) => token?.actor);
  if (!spell?.effects.size || !tokens.length)
    return { failed: tokens.map((t) => t.name) };

  const content = await foundry.applications.handlebars.renderTemplate(
    `${FT.path}/templates/dialog/apply-effects.hbs`,
    {
      caster,
      spell,
      effects: Array.from(spell.effects, (effect) => ({
        name: effect.name,
        img: effect.img,
        changes: effect.system?.changes ?? effect.changes ?? [],
      })),
      tokens,
    },
  );

  const selected = await foundry.applications.api.DialogV2.wait({
    id: "ft-apply-effects",
    classes: [FT.id, "apply-effects"],
    window: { title: game.i18n.localize("FT.dialog.effects.title") },
    position: { width: 400 },
    content,
    buttons: [
      {
        action: "apply",
        label: game.i18n.localize("FT.dialog.effects.action.apply"),
        default: true,
        callback: (event, button) =>
          Array.from(button.form.elements)
            .filter((element) => element.name === "target" && element.checked)
            .map((element) => element.value),
      },
      {
        action: "deny",
        label: game.i18n.localize("FT.dialog.effects.action.deny"),
        callback: () => [],
      },
    ],
    rejectClose: false,
  });

  // If the caster has stopped waiting, don't apply anything they won't hear about
  if (timeout && Date.now() - started > timeout) {
    ui.notifications.warn("FT.effect.result.expired", {
      localize: true,
      format: { spell: spell.name },
    });
    return { declined: tokens.map((token) => token.name) };
  }

  const chosen = new Set(selected ?? []);
  const result = await createEffects(
    spell,
    tokens.filter((token) => chosen.has(token.uuid)),
  );
  return {
    ...result,
    declined: tokens
      .filter((token) => !chosen.has(token.uuid))
      .map((token) => token.name),
  };
}
