import db from "../db/index.js";

export class SQLBuilder {
  constructor() {
    this.queryString = "";
    this.params = [];
  }
  select(cols) {
    this.queryString += `SELECT ${cols}`;
    return this;
  }
  from(table) {
    this.queryString += ` FROM ${table}`;
    return this;
  }

  insert(table) {
    this.queryString += `INSERT INTO ${table}`;
    return this;
  }
  values(data) {
    const keys = Object.keys(data);
    const values = Object.values(data);
    const placeholders = values.map((_, idx) => `$${idx + 1}`);
    this.queryString += ` (${keys.join(", ")})`;
    this.queryString += ` VALUES (${placeholders.join(", ")})`;
    this.params.push(...values);
    return this;
  }

  update(table) {
    this.queryString += `UPDATE ${table}`;
    return this;
  }
  set(setClause, params) {
    this.queryString += ` SET ${setClause}`;
    this.params.push(...params);
    return this;
  }

  delete(table) {
    this.queryString += `DELETE FROM ${table}`;
    return this;
  }

  where(conditions, params) {
    this.queryString += ` WHERE ${conditions}`;
    this.params.push(...params);
    return this;
  }
  returning(cols) {
    this.queryString += ` RETURNING ${cols}`;
    return this;
  }

  build() {
    // Returns the object { query, params }
    return { queryString: this.queryString, params: this.params };
  }
  query() {
    // Returns the result of the query
    return db.query(this.queryString, this.params);
  }

  async transaction(func) {
    var client;
    try {
      client = await db.connect();
      await client.query(`BEGIN`);
      const queryFunc = (query) => {
        const { queryString, params } = query;
        return client.query(queryString, params);
      };
      await func(queryFunc);
      await client.query(`COMMIT`);
    } catch (err) {
      if (client) await client.query(`ROLLBACK`);
      throw err;
    } finally {
      if (client) client.release();
    }
  }
}
