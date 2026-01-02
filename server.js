const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// MySQL connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '12345678',
  database: process.env.DB_NAME || 'data_gatherer',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Initialize database and create table
async function initDatabase() {
  try {
    const conn = await pool.getConnection();
    
    // Create database if not exists
    await conn.query(`CREATE DATABASE IF NOT EXISTS data_gatherer`);
    
    // Switch to database
    await conn.query(`USE data_gatherer`);
    
    // Create submissions table if not exists
    await conn.query(`
      CREATE TABLE IF NOT EXISTS submissions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        address TEXT NOT NULL,
        birthday DATE NOT NULL,
        phone VARCHAR(30) NOT NULL,
        guardian_name VARCHAR(255),
        guardian_phone VARCHAR(30),
        source VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_created_at (created_at),
        INDEX idx_name (name)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    
    // Auto-adjust the AUTO_INCREMENT to match the highest ID in the table
    const [[{ maxId }]] = await conn.query(`SELECT COALESCE(MAX(id), 0) as maxId FROM submissions`);
    const nextId = maxId + 1;
    await conn.query(`ALTER TABLE submissions AUTO_INCREMENT = ${nextId}`);
    
    console.log('✓ Database and table initialized successfully');
    console.log(`✓ Auto-increment set to ${nextId} (highest ID: ${maxId})`);
    conn.release();
  } catch (err) {
    console.error('✗ Database initialization error:', err.message);
    process.exit(1);
  }
}

// Serve static files (info.html)
app.use(express.static(path.join(__dirname)));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'Server is running', time: new Date().toISOString() });
});

// POST endpoint: create submission and save to database
app.post('/api/submissions', async (req, res) => {
  try {
    const { name, address, birthday, phone, guardian_name, guardian_phone, source } = req.body;
    
    // Validation
    if (!name || !address || !birthday || !phone) {
      return res.status(400).json({ 
        message: 'Validation error: name, address, birthday, and phone are required' 
      });
    }

    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(birthday)) {
      return res.status(400).json({ 
        message: 'Invalid birthday format. Use YYYY-MM-DD' 
      });
    }
    
    const conn = await pool.getConnection();
    await conn.query(`USE data_gatherer`);
    
    // Insert submission
    const [result] = await conn.query(
      `INSERT INTO submissions (name, address, birthday, phone, guardian_name, guardian_phone, source)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [name, address, birthday, phone, guardian_name || null, guardian_phone || null, source || null]
    );
    
    const insertId = result.insertId;
    
    // Retrieve the created record to return full data with timestamp
    const [rows] = await conn.query(
      `SELECT * FROM submissions WHERE id = ?`,
      [insertId]
    );
    
    conn.release();
    
    console.log(`✓ Submission saved: ID ${insertId}, Name: ${name}`);
    
    res.status(201).json({
      id: insertId,
      created_at: rows[0].created_at,
      message: 'Data saved successfully'
    });
  } catch (err) {
    console.error('✗ Insert error:', err.message);
    res.status(500).json({ message: 'Failed to save data: ' + err.message });
  }
});

// GET endpoint: list all submissions (admin)
app.get('/api/submissions', async (req, res) => {
  try {
    const limit = Math.min(1000, Number(req.query.limit) || 200);
    const offset = Number(req.query.offset) || 0;
    
    const conn = await pool.getConnection();
    await conn.query(`USE data_gatherer`);
    
    // Get submissions
    const [rows] = await conn.query(
      `SELECT id, name, address, birthday, phone, guardian_name, guardian_phone, source, created_at, updated_at
       FROM submissions
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`,
      [limit, offset]
    );
    
    // Get total count
    const [[{ count }]] = await conn.query(`SELECT COUNT(*) as count FROM submissions`);
    
    conn.release();
    
    console.log(`✓ Retrieved ${rows.length} submissions (total: ${count})`);
    
    res.json({ 
      total: count, 
      count: rows.length, 
      limit: limit,
      offset: offset,
      rows 
    });
  } catch (err) {
    console.error('✗ Select error:', err.message);
    res.status(500).json({ message: 'Failed to retrieve data: ' + err.message });
  }
});

// GET endpoint: single submission by id
app.get('/api/submissions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const conn = await pool.getConnection();
    await conn.query(`USE data_gatherer`);
    
    const [rows] = await conn.query(
      `SELECT * FROM submissions WHERE id = ?`,
      [id]
    );
    
    conn.release();
    
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Submission not found' });
    }
    
    console.log(`✓ Retrieved submission ID ${id}`);
    res.json(rows[0]);
  } catch (err) {
    console.error('✗ Select error:', err.message);
    res.status(500).json({ message: 'Failed to retrieve data: ' + err.message });
  }
});

// Function to renumber IDs sequentially (remove gaps)
async function defragmentIds(conn) {
  try {
    // Get all records ordered by creation date
    const [rows] = await conn.query(
      `SELECT * FROM submissions ORDER BY created_at ASC`
    );
    
    if (rows.length === 0) {
      await conn.query(`ALTER TABLE submissions AUTO_INCREMENT = 1`);
      return;
    }
    
    // Disable foreign key checks temporarily
    await conn.query(`SET FOREIGN_KEY_CHECKS = 0`);
    
    // Delete all and reinsert with new sequential IDs
    await conn.query(`TRUNCATE TABLE submissions`);
    
    let newId = 1;
    for (const row of rows) {
      await conn.query(
        `INSERT INTO submissions (id, name, address, birthday, phone, guardian_name, guardian_phone, source, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [newId, row.name, row.address, row.birthday, row.phone, row.guardian_name, row.guardian_phone, row.source, row.created_at, row.updated_at]
      );
      newId++;
    }
    
    // Reset auto-increment
    await conn.query(`ALTER TABLE submissions AUTO_INCREMENT = ${newId}`);
    
    // Re-enable foreign key checks
    await conn.query(`SET FOREIGN_KEY_CHECKS = 1`);
    
    console.log(`✓ IDs defragmented: ${rows.length} records renumbered sequentially`);
  } catch (err) {
    console.error('✗ Defragment error:', err.message);
    throw err;
  }
}

// DELETE endpoint: delete submission by id
app.delete('/api/submissions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const conn = await pool.getConnection();
    await conn.query(`USE data_gatherer`);
    
    const [result] = await conn.query(
      `DELETE FROM submissions WHERE id = ?`,
      [id]
    );
    
    if (result.affectedRows === 0) {
      conn.release();
      return res.status(404).json({ message: 'Submission not found' });
    }
    
    // Defragment IDs after deletion
    await defragmentIds(conn);
    
    conn.release();
    
    console.log(`✓ Deleted submission ID ${id} and renumbered remaining records`);
    res.json({ message: 'Submission deleted and IDs renumbered', id });
  } catch (err) {
    console.error('✗ Delete error:', err.message);
    res.status(500).json({ message: 'Failed to delete data: ' + err.message });
  }
});

// DELETE endpoint: delete all submissions and reset auto-increment
app.delete('/api/submissions', async (req, res) => {
  try {
    const conn = await pool.getConnection();
    await conn.query(`USE data_gatherer`);
    
    // Delete all records
    await conn.query(`DELETE FROM submissions`);
    
    // Reset auto-increment to 1
    await conn.query(`ALTER TABLE submissions AUTO_INCREMENT = 1`);
    
    conn.release();
    
    console.log(`✓ All submissions deleted and auto-increment reset`);
    res.json({ message: 'All data deleted and ID counter reset to 1' });
  } catch (err) {
    console.error('✗ Delete all error:', err.message);
    res.status(500).json({ message: 'Failed to delete all data: ' + err.message });
  }
});

// Start server
const PORT = process.env.PORT || 3000;
initDatabase().then(() => {
  app.listen(PORT, () => {
    console.log('\n========================================');
    console.log(`✓ Server running on http://localhost:${PORT}`);
    console.log(`✓ Form: http://localhost:${PORT}/info.html`);
    console.log(`✓ API Docs:`);
    console.log(`   POST   /api/submissions       - Save new submission`);
    console.log(`   GET    /api/submissions       - List all submissions`);
    console.log(`   GET    /api/submissions/:id   - Get one submission`);
    console.log(`   DELETE /api/submissions/:id   - Delete submission`);
    console.log(`   GET    /health               - Health check`);
    console.log('========================================\n');
  });
}).catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
