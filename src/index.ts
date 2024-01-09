import "dotenv/config";
import { Database } from "./database";
import Bluebird from "bluebird";
import { Column, ForeignKey, Table } from "./Table";
import fs from "fs-extra";
import { table } from "console";
import { flatten, sortBy, prop } from "ramda";

(async () => {
  const db = new Database();
  db.connect();

  const tables = await db.getListOfTables();

  const tableDefinition = await Bluebird.mapSeries(
    tables,
    async (tableName) => {
      const definition = await db.getTableDefinition(tableName);

      const table = new Table(tableName);
      const primaryKeys = await db.getThePrimaryKeys(tableName);

      sortBy(prop("ordinal_position"), definition).forEach(
        ({ column_name, data_type, is_nullable }) => {
          const isPrimary = primaryKeys.some(
            (key) => key.column_name === column_name
          );

          table.addColumn(
            new Column(column_name, data_type, isPrimary, is_nullable === "YES")
          );
        }
      );

      return table;
    }
  );

  fs.open("./export.md", "w").then((file) => {
    return fs
      .appendFile(file, "```mermaid\nerDiagram\n")
      .then(() => {
        return Bluebird.mapSeries(tableDefinition, async (table) => {
          return fs.appendFile(file, table.serialize() + "\n\n");
        }).then(() => Promise.resolve(file));
      })
      .then(() => {
        return fs.appendFile(file, `\n`);
      })
      .then(() => {
        return Bluebird.mapSeries(tables, async (tableName) => {
          const foreignKeys = (await db.getTheForeignKeys(tableName)).map(
            (fk) =>
              new ForeignKey(
                fk.table_name,
                fk.column_name,
                fk.foreign_table_name,
                fk.foreign_column_name
              )
          );

          return foreignKeys.map((fk) => fk.serialize());
        }).then((fks) => {
          const lines = flatten(fks);

          return fs.appendFile(file, [...lines, "```"].join("\n"));
        });
      });
  });

  // console.log(tableDefinition);

  // console.log(JSON.stringify(tableDefinition, null, 2));
})();
