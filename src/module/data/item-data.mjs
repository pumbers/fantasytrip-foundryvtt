const { HTMLField, SchemaField, NumberField, StringField, ArrayField, ForeignDocumentField } = foundry.data.fields;

/* -------------------------------------------- */
/*  Item Data Type                       
/* -------------------------------------------- */

class FTBaseItemData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      notes: new HTMLField(),
    };
  }
}

export class FTTalentData extends FTBaseItemData {
  static defineSchema() {
    return Object.assign(super.defineSchema(), {
      iq: new SchemaField({ min: new NumberField({ initial: 0 }) }),
      cost: new NumberField({ initial: 0 }),
    });
  }
}

export class FTItemData extends FTBaseItemData {
  static defineSchema() {
    return Object.assign(super.defineSchema(), {
      cost: new NumberField({ initial: 0 }),
      wt: new NumberField({ initial: 0 }),
      //
      location: new StringField({ initial: "carried" }),
    });
  }
}

export class FTWeaponData extends FTItemData {
  static defineSchema() {
    return Object.assign(super.defineSchema(), {
      damage: new StringField(),
      st: new NumberField({ initial: 0 }),
      //
      skill: new ForeignDocumentField(foundry.documents.BaseItem, { idOnly: true }),
    });
  }
}

export class FTArmourData extends FTItemData {
  static defineSchema() {
    return Object.assign(super.defineSchema(), {
      hitsStopped: new NumberField({ initial: 0 }),
      dxMod: new NumberField({ initial: 0 }),
      ma: new NumberField({ initial: 0 }),
    });
  }
}
