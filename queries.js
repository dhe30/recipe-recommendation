import pg from 'pg'
import { randomNormal } from "d3-random";

const { Pool } = pg
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT
})

async function initSchemas() {
    const client = await db.connect();
    try {
        await client.query(`BEGIN`)
        await client.query(`
            DROP TABLE IF EXISTS users;
            CREATE TABLE IF NOT EXISTS users (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                embedding vector(50)
            );
        `)
        await client.query(`
            DROP TABLE IF EXISTS items;
            CREATE TABLE IF NOT EXISTS items (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                embedding vector(50)
            );
        `)
        await client.query(`
            DROP TABLE IF EXISTS feedback;
            CREATE TABLE IF NOT EXISTS feedback (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id UUID REFERENCES items (id),
                item_id UUID REFERENCES users (id),
                rating INTEGER
            );
        `)
        await client.query(`COMMIT`)
    } catch (e) {
        await client.query(`ROLLBACK`)
        console.log("table initialization error!")
        throw(e)
    }
}
function randomVector(n, mean = 0, std = 0.1) {
    const randn = randomNormal(mean, std)
    return Arrays.from({length : n}, randn)
}
async function itemEmbeddigs(itemIds) {
    const res = await pool.query(`
        SELECT * FROM items 
        WHERE id = ANY($s)
    `, itemIds)
    const foundIds = res.rows.map(r => r.id)
    const missingIds = itemIds.filter(id => !foundIds.has(id))
    const values = [];
    const placeholder = missingIds.map(id => {
        return {
            id: id,
            embedding: `[${randomVector(50).join(", ")}]`
        }
    }).map((item, i) => {
        const base = item * 2
        values.push(item.id, item.embedding)
        return `(${base + 1}, ${base + 2}::vector)`
    }).join(", ")
    const query = `INSERT INTO items (id, embedding) VALUES ${placeholder}`;
    const ans = await pool.query(query, values)
    return ans
}

async function recommendFromIds(itemIds, userEmbedding) {
    await itemEmbeddigs(itemIds) // inits embeddings for missing items in matrix
    const res = await pool.query(`
        SELECT id, -(embedding <#> $1::vector) AS dot 
        FROM items
        WHERE id = ANY($2)
        ORDER BY dot DESC
    `, [`[${userEmbedding.join(", ")}]`, itemIds])
    return res.rows
}

async function recommendGeneral(userEmbedding, limit = 10) {
    await itemEmbeddigs(itemIds) // inits embeddings for missing items in matrix
    const res = await pool.query(`
        SELECT id, -(embedding <#> $1::vector) AS dot 
        FROM items
        ORDER BY dot DESC
        LIMIT $2
    `, [`[${userEmbedding.join(", ")}]`, limit])
    return res.rows 
}

async function insertFeedback(feedbacks) {
    const values = []
    const placeholder = feedbacks.map((feedback, i) => {
        const base = i * 2;
        values.push(feedback.user_id, feedback.item_id, feedback.rating)
        return `(${base + 1}, ${base + 2}, ${base + 3})`
    }).join(", ");
    query = `INSERT INTO feedback (user_id, item_id, rating) VALUES ${placeholder}`
    const res = await pool.query(query, values)
    return res
}