const { Pool } = require('pg')

const credentials = {
  user: "postgres",
  host: "20.59.10.79",
  database: "postgres",
  password: "9229sunsetadmin",
  port: 5432,
};

const pool = new Pool(credentials)

module.exports = {
  async query(text: string, params: any[]) {
    console.log('query length', text.length);
    console.log('query string', { text: text })
    const start = Date.now();
    const res = await pool.query(text, params)
    const duration = Date.now() - start
    console.log('executed query', { duration, rows: res.rowCount })
    return res
  }
}