import {
  partitionTargets,
  buildEffectData,
} from "../../system/action/applySpellEffects.mjs";

const targets = [
  { name: "Own Hero", owned: true },
  { name: "Goblin", owned: false },
  { name: "Other Hero", owned: false },
];
const isOwned = (target) => target.owned;

test("Player casts apply directly only to owned targets", () => {
  const { direct, request } = partitionTargets(targets, false, isOwned);
  expect(direct.map((t) => t.name)).toEqual(["Own Hero"]);
  expect(request.map((t) => t.name)).toEqual(["Goblin", "Other Hero"]);
});

test("GM casts apply directly to all targets", () => {
  const { direct, request } = partitionTargets(targets, true, isOwned);
  expect(direct).toEqual(targets);
  expect(request).toEqual([]);
});

test("Effect data drops ids, sets origin and does not transfer", () => {
  const effects = [
    { _id: "a", name: "Blur", transfer: true, origin: "Item.old" },
    { _id: "b", name: "Slow" },
  ];
  expect(buildEffectData(effects, "Item.spell")).toEqual([
    { name: "Blur", transfer: false, origin: "Item.spell" },
    { name: "Slow", transfer: false, origin: "Item.spell" },
  ]);
  // Source data is not modified
  expect(effects[0]._id).toBe("a");
});
