import { Client } from "pg";

type YN = "YES" | "NO";

type TableDefinitionType = {
  table_catalog: string;
  table_schema: string;
  table_name: string;
  column_name: string;
  ordinal_position: number;
  column_default: any;
  is_nullable: YN;
  data_type: string;
  character_maximum_length: any;
  character_octet_length: number;
  numeric_precision: any;
  numeric_precision_radix: any;
  numeric_scale: any;
  datetime_precision: any;
  interval_type: any;
  interval_precision: any;
  character_set_catalog: any;
  character_set_schema: any;
  character_set_name: any;
  collation_catalog: any;
  collation_schema: any;
  collation_name: any;
  domain_catalog: any;
  domain_schema: any;
  domain_name: any;
  udt_catalog: string;
  udt_schema: string;
  udt_name: string;
  scope_catalog: any;
  scope_schema: any;
  scope_name: any;
  maximum_cardinality: any;
  dtd_identifier: string;
  is_self_referencing: YN;
  is_identity: YN;
  identity_generation: any;
  identity_start: any;
  identity_increment: any;
  identity_maximum: any;
  identity_minimum: any;
  identity_cycle: YN;
  is_generated: string;
  generation_expression: any;
  is_updatable: YN;
};

export class Database {
  client: Client;
  constructor() {
    this.client = new Client(process.env.DATABASE_URL);
  }

  async connect() {
    await this.client.connect();
  }

  async getListOfTables(): Promise<string[]> {
    return this.client
      .query(
        "SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE'"
      )
      .then((res) => {
        return res.rows.map(({ table_name }: { table_name: string }) => {
          return table_name;
        }) as string[];
      });
  }

  async getTableDefinition(table: string): Promise<TableDefinitionType[]> {
    const res = await this.client.query(
      `SELECT * FROM information_schema.columns WHERE table_name='${table}'`
    );

    console.log(res.rows);
    return res.rows;
  }

  async getThePrimaryKeys(table: string) {
    const res = await this.client.query(
      `SELECT
        tc.table_name, kcu.column_name
      FROM
        information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
      WHERE constraint_type = 'PRIMARY KEY' AND tc.table_name='${table}';`
    );
    return res.rows as Array<{
      table_name: string;
      column_name: string;
    }>;
  }

  async getTheForeignKeys(table: string) {
    const res = await this.client.query(
      `SELECT
        tc.table_name, kcu.column_name, ccu.table_name AS foreign_table_name, ccu.column_name AS foreign_column_name
      FROM
        information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
      WHERE constraint_type = 'FOREIGN KEY' AND tc.table_name='${table}';`
    );
    return res.rows as Array<{
      table_name: string;
      column_name: string;
      foreign_table_name: string;
      foreign_column_name: string;
    }>;
  }

  async close() {
    this.client.end();
  }
}
