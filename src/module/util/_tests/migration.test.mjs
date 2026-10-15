import {
  clearItemEffectsDisabled,
  pendingMigrations,
} from "../../system/migration.mjs";

beforeAll(() => {
  // Minimal stand-in for Foundry's version comparison
  globalThis.foundry = {
    utils: {
      isNewerVersion: (v1, v0) => {
        const a = v1.split(".").map(Number);
        const b = v0.split(".").map(Number);
        for (let i = 0; i < Math.max(a.length, b.length); i++) {
          if ((a[i] ?? 0) !== (b[i] ?? 0)) return (a[i] ?? 0) > (b[i] ?? 0);
        }
        return false;
      },
    },
  };
});

test("Clears disabled effects on equipment and abilities", () => {
  for (const type of ["equipment", "ability"]) {
    const updates = clearItemEffectsDisabled({
      type,
      effects: [
        { _id: "a", disabled: true },
        { _id: "b", disabled: false },
        { _id: "c", disabled: true },
      ],
    });
    expect(updates).toEqual([
      { _id: "a", disabled: false },
      { _id: "c", disabled: false },
    ]);
  }
});

test("Leaves effects on other item types alone", () => {
  for (const type of ["talent", "spell"]) {
    expect(
      clearItemEffectsDisabled({ type, effects: [{ _id: "a", disabled: true }] }),
    ).toEqual([]);
  }
});

test("Clearing disabled effects is idempotent", () => {
  const item = { type: "equipment", effects: [{ _id: "a", disabled: true }] };
  const updates = clearItemEffectsDisabled(item);
  const migrated = {
    ...item,
    effects: item.effects.map((effect) => ({
      ...effect,
      ...updates.find((update) => update._id === effect._id),
    })),
  };
  expect(clearItemEffectsDisabled(migrated)).toEqual([]);
  expect(clearItemEffectsDisabled({ type: "equipment" })).toEqual([]);
});

test("Selects only migrations newer than the world's version", () => {
  const steps = [{ version: "1.3.0" }, { version: "1.4.0" }];
  expect(pendingMigrations("", steps)).toEqual(steps);
  expect(pendingMigrations("1.2.0", steps)).toEqual(steps);
  expect(pendingMigrations("1.3.0", steps)).toEqual([{ version: "1.4.0" }]);
  expect(pendingMigrations("1.4.0", steps)).toEqual([]);
});
