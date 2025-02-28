import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

async function getData() {
  const client = await pool.connect();
  try {
    const { rows } = await client.query("SELECT * FROM capitals");
    return rows;
  } catch (error) {
    console.error("Database error:", error);
    return [];
  } finally {
    client.release();
  }
}

export default async function Page() {
  const data = await getData();

  return (
    <div>
      <h1>World Capitals</h1>
      {data.length > 0 ? (
        data.map((capital, index) => (
          <div key={index}>
            <h2>{capital.country}</h2>
            <p>Capital: {capital.capital}</p>
          </div>
        ))
      ) : (
        <p>No data found.</p>
      )}
    </div>
  );
}
