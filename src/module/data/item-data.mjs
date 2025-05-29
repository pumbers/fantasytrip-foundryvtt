const {
  HTMLField,
  SchemaField,
  NumberField,
  StringField,
  ArrayField,
  EmbeddedDataField,
  ForeignDocumentField,
  BooleanField,
} = foundry.data.fields;

class FTEmbeddedAttack extends foundry.abstract.DataModel {
  static defineSchema() {
    return {
      action: new StringField(),
      minST: new NumberField({ initial: 0 }),
      type: new StringField(),
      toHitMod: new NumberField({ initial: 0 }),
      baseDamage: new StringField({ nullable: true }),
      effects: new StringField(),
      talent: new ForeignDocumentField(foundry.documents.BaseItem, { idOnly: true }),
    };
  }

  get damage() {
    return this.finalDamage ?? this.baseDamage;
  }
}

class FTEmbeddedDefense extends foundry.abstract.DataModel {
  static defineSchema() {
    return { action: new StringField(), hitsStopped: new NumberField({ initial: 0 }) };
  }
}

class FTEmbeddedSpell extends foundry.abstract.DataModel {
  static defineSchema() {
    return {
      uuid: new StringField({ nullable: false }),
      burn: new BooleanField({ initial: false, nullable: false }),
    };
  }
}

/**
 * Fantasy Trip Base Item Data Model
 */
class FTBaseItemData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      notes: new HTMLField(),
      attacks: new ArrayField(new EmbeddedDataField(FTEmbeddedAttack), { initial: [] }),
      defenses: new ArrayField(new EmbeddedDataField(FTEmbeddedDefense), { initial: [] }),
    };
  }

  get hasActions() {
    return this.attacks.length > 0 || this.defenses.length > 0 || this.spells?.length > 0;
  }

  get hasAttacks() {
    return this.attacks.length > 0;
  }

  get hasDefenses() {
    return this.defenses.length > 0;
  }

  get hasSpells() {
    return this.spells?.length > 0;
  }
}

/**
 * Fantasy Trip Talent Data Model
 */
export class FTTalentData extends FTBaseItemData {
  static defineSchema() {
    return Object.assign(super.defineSchema(), {
      minIQ: new NumberField({ initial: 7 }),
      iqCost: new NumberField({ initial: 1 }),
      defaultAttribute: new StringField(),
    });
  }

  get isReady() {
    return !!this.defaultAttribute && this.hasActions;
  }
}

/**
 * Fantasy Trip Ability Data Model
 */
export class FTAbilityData extends FTBaseItemData {
  static defineSchema() {
    return Object.assign(super.defineSchema(), {
      isActive: new BooleanField({ initial: false }),
      isAlwaysOn: new BooleanField({ initial: false }),
    });
  }

  get isReady() {
    return this.isActive || this.isAlwaysOn;
  }
}

/**
 * Fantasy Trip Spell Data Model
 */
export class FTSpellData extends FTTalentData {
  static defineSchema() {
    return Object.assign(super.defineSchema(), {
      type: new StringField(),
      stToCast: new SchemaField({ min: new NumberField({ initial: 1 }), max: new NumberField({ initial: 1 }) }),
      stToMaintain: new NumberField({ initial: 0 }),
      stSpent: new NumberField({ initial: 0 }),
    });
  }

  prepareDerivedData() {
    super.prepareDerivedData();
    this.stToCast.max = Math.max(this.stToCast.min, this.stToCast.max);
  }

  get isCast() {
    return this.stSpent > 0;
  }

  get isReady() {
    return this.isCast;
  }

  get casting() {
    const cast =
      this.stToCast.min === this.stToCast.max ? this.stToCast.max : `${this.stToCast.min}-${this.stToCast.max}`;
    const maintain = this.stToMaintain ? ` (${this.stToMaintain})` : "";
    return cast + maintain;
  }

  get canBeMaintained() {
    return this.stToMaintain > 0;
  }
}

/**
 * Fantasy Trip Equipment Data Model
 */
export class FTEquipmentData extends FTBaseItemData {
  static defineSchema() {
    return Object.assign(super.defineSchema(), {
      cost: new NumberField({ initial: 0 }),
      wt: new NumberField({ initial: 0 }),
      qty: new NumberField({ initial: 1 }),
      //
      location: new StringField({ initial: "carried" }),
      capacity: new NumberField({ initial: 0 }),
      container: new ForeignDocumentField(foundry.documents.BaseItem, { idOnly: true }),
      //
      spells: new ArrayField(new EmbeddedDataField(FTEmbeddedSpell), { initial: [] }),
    });
  }

  prepareDerivedData() {
    super.prepareDerivedData();
    this.totalWt = this.wt * this.qty;
    this.totalCost = this.cost * this.qty;
  }

  get isContainer() {
    return this.capacity > 0;
  }

  get isContained() {
    return !!this.container;
  }

  get isReady() {
    return this.location === "equipped";
  }
}
