const { HTMLField, SchemaField, NumberField, StringField, ArrayField, ForeignDocumentField, EmbeddedDataField } =
  foundry.data.fields;

/**
 * Fantasy Trip Base Item Data Model
 */
class FTBaseItemData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      notes: new HTMLField(),
    };
  }
}

/**
 * Fantasy Trip Talent Data Model
 */
export class FTTalentData extends FTBaseItemData {
  static defineSchema() {
    return Object.assign(super.defineSchema(), {
      minIQ: new NumberField({ initial: 0 }),
      iqCost: new NumberField({ initial: 0 }),
      defaultAttribute: new StringField(),
    });
  }
}

/**
 * Fantasy Trip Spell Data Model
 */
export class FTSpellData extends FTTalentData {
  static defineSchema() {
    return Object.assign(super.defineSchema(), {
      type: new StringField(),
      stToCast: new NumberField({ initial: 0 }),
    });
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
      location: new StringField(),
      capacity: new NumberField({ initial: 0 }),
      container: new ForeignDocumentField(foundry.documents.BaseItem, { idOnly: true }),
      attacks: new ArrayField(
        new SchemaField({
          action: new StringField(),
          type: new StringField(),
          toHitMod: new NumberField({ initial: 0 }),
          baseDamage: new StringField(),
          minST: new NumberField({ initial: 0 }),
          talent: new ForeignDocumentField(foundry.documents.BaseItem, { idOnly: true }),
        }),
        { initial: [] }
      ),
      defenses: new ArrayField(
        new SchemaField({
          action: new StringField(),
          hitsStopped: new NumberField({ initial: 0 }),
        }),
        { initial: [] }
      ),
    });
  }

  prepareDerivedData() {
    super.prepareDerivedData();
    this.totalWt = this.wt * this.qty;
    this.totalCost = this.cost * this.qty;
  }

  get isReady() {
    return this.location === "equipped";
  }

  get isContainer() {
    return this.capacity > 0;
  }

  get canAttack() {
    return this.attacks.length > 0;
  }

  get canDefend() {
    return this.defenses.length > 0;
  }
}
