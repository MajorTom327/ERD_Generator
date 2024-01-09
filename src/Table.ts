import { always, isEmpty } from "ramda";
import { match } from "ts-pattern";

export class Table {
  name: string;
  columns: Column[];

  constructor(name: string) {
    this.name = name;
    this.columns = [];
  }

  addColumn(column: Column) {
    this.columns.push(column);
  }

  serialize() {
    const lines = [
      `"${this.name}" {`,
      ...this.columns
        // .sort((a, b) => {
        //   return a.name.localeCompare(b.name);
        // })
        .map((column) => "  " + column.serialize()),
      `}`,
    ].map((line) => `  ${line}`);

    return lines.join("\n") + "\n";
  }
}

type KeySettings = {
  toTable: string;
  toColumn: string;
};

export class Column {
  name: string;
  type: "Boolean" | "DateTime" | "String" | "Int" | null;
  isPrimary?: boolean;
  isNullable?: boolean;

  fkSettings?: KeySettings;

  get isKey() {
    return this.fkSettings !== undefined;
  }

  constructor(
    name: string,
    type: string,
    isPrimary?: boolean,
    is_nullable?: boolean
  ) {
    this.name = name;

    // @ts-ignore
    this.type = match(type)
      .with("boolean", always("Boolean"))
      .with("timestamp without time zone", always("DateTime"))
      .with("text", always("String"))
      .with("integer", always("Int"))
      .otherwise((value) => {
        console.log(`Unknown type: ${value}`);
        return null;
      });

    this.isPrimary = isPrimary;
    this.isNullable = is_nullable;
  }

  serialize(): string {
    const str = `${this.name} ${this.type}`;

    const columnItem = match({
      isPrimary: this.isPrimary,
      isNullable: this.isNullable,
    })
      .with({ isPrimary: true }, always("🗝️"))
      .with({ isNullable: true }, always("❓"))
      .otherwise(always(""));

    if (isEmpty(columnItem)) {
      return str;
    }

    return `${str} "${columnItem}"`;
  }
}

export class ForeignKey {
  constructor(
    public table: string,
    public column: string,
    public toTable: string,
    public toColumn: string
  ) {}

  serialize(): string {
    // Todo: Handle Many to Many and other stuff correctly
    return `"${this.table}" o|--|o "${this.toTable}" : "${this.column}"`;
  }
}
