import express from 'express';
import mysql from 'mysql2/promise';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' })); 

const dbConfig = {
  host: 'localhost',
  user: 'root',      
  password: '你的密码', 
  database: 'chenghui_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

const pool = mysql.createPool(dbConfig);

// 初始化数据库表结构
async function initDb() {
  try {
    const conn = await pool.getConnection();
    // 项目表
    await conn.execute(`CREATE TABLE IF NOT EXISTS projects (id VARCHAR(50) PRIMARY KEY, name VARCHAR(100), location TEXT, status VARCHAR(20))`);
    // 用户表
    await conn.execute(`CREATE TABLE IF NOT EXISTS users (id VARCHAR(50) PRIMARY KEY, name VARCHAR(50), username VARCHAR(50), password VARCHAR(50), role VARCHAR(20), projectId VARCHAR(50))`);
    // 报告表
    await conn.execute(`CREATE TABLE IF NOT EXISTS reports (id VARCHAR(50) PRIMARY KEY, type VARCHAR(50), projectId VARCHAR(50), authorId VARCHAR(50), authorName VARCHAR(50), content TEXT, details JSON, date VARCHAR(20), status VARCHAR(20), isImportant TINYINT(1))`);
    // 考勤表
    await conn.execute(`CREATE TABLE IF NOT EXISTS attendance (id VARCHAR(50) PRIMARY KEY, userId VARCHAR(50), userName VARCHAR(50), projectId VARCHAR(50), projectName VARCHAR(100), type VARCHAR(20), time VARCHAR(50), location TEXT)`);
    // 公告表
    await conn.execute(`CREATE TABLE IF NOT EXISTS announcements (id VARCHAR(50) PRIMARY KEY, title VARCHAR(200), content TEXT, publishDate VARCHAR(20), author VARCHAR(50), images JSON)`);
    
    const [users] = await conn.execute('SELECT count(*) as count FROM users');
    if (users[0].count === 0) {
        await conn.execute("INSERT INTO users VALUES ('U1', '管理员', 'admin', '123456', 'LEADER', NULL)");
        console.log('已创建默认管理员账号: admin / 123456');
    }
    conn.release();
    console.log('MySQL 数据库架构同步成功');
  } catch (e) {
    console.error('数据库初始化失败:', e.message);
  }
}
initDb();

// 接口实现
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const [rows] = await pool.execute('SELECT * FROM users WHERE username = ? AND password = ?', [username, password]);
    if (rows.length > 0) res.json(rows[0]);
    else res.status(401).json({ message: '工号或密码错误' });
  } catch (e) { res.status(500).send(e.message); }
});

app.get('/api/get-all-data', async (req, res) => {
  try {
    const [reports] = await pool.execute('SELECT * FROM reports ORDER BY date DESC');
    const [announcements] = await pool.execute('SELECT * FROM announcements ORDER BY publishDate DESC');
    const [projects] = await pool.execute('SELECT * FROM projects');
    const [users] = await pool.execute('SELECT * FROM users');
    const [attendance] = await pool.execute('SELECT * FROM attendance ORDER BY time DESC LIMIT 500');
    res.json({ reports, announcements, projects, users, attendance });
  } catch (e) { res.status(500).send(e.message); }
});

app.post('/api/save-report', async (req, res) => {
  const r = req.body;
  try {
    await pool.execute(
      'INSERT INTO reports (id, type, projectId, authorId, authorName, content, details, date, status, isImportant) VALUES (?,?,?,?,?,?,?,?,?,?) ON DUPLICATE KEY UPDATE status=VALUES(status), content=VALUES(content), details=VALUES(details)',
      [r.id, r.type, r.projectId, r.authorId, r.authorName, r.content, JSON.stringify(r.details), r.date, r.status, r.isImportant ? 1 : 0]
    );
    res.json({ status: 'ok' });
  } catch (e) { res.status(500).send(e.message); }
});

app.post('/api/save-attendance', async (req, res) => {
  const a = req.body;
  try {
    await pool.execute(
      'INSERT INTO attendance (id, userId, userName, projectId, projectName, type, time, location) VALUES (?,?,?,?,?,?,?,?)',
      [a.id, a.userId, a.userName, a.projectId, a.projectName, a.type, a.time, a.location]
    );
    res.json({ status: 'ok' });
  } catch (e) { res.status(500).send(e.message); }
});

app.post('/api/save-user', async (req, res) => {
  const u = req.body;
  try {
    await pool.execute(
      'INSERT INTO users (id, name, username, password, role, projectId) VALUES (?,?,?,?,?,?) ON DUPLICATE KEY UPDATE name=VALUES(name), password=VALUES(password), role=VALUES(role), projectId=VALUES(projectId)',
      [u.id, u.name, u.username, u.password, u.role, u.projectId || null]
    );
    res.json({ status: 'ok' });
  } catch (e) { res.status(500).send(e.message); }
});

app.post('/api/save-project', async (req, res) => {
  const p = req.body;
  try {
    await pool.execute(
      'INSERT INTO projects (id, name, location, status) VALUES (?,?,?,?) ON DUPLICATE KEY UPDATE name=VALUES(name), location=VALUES(location), status=VALUES(status)',
      [p.id, p.name, p.location, p.status]
    );
    res.json({ status: 'ok' });
  } catch (e) { res.status(500).send(e.message); }
});

app.post('/api/save-announcement', async (req, res) => {
  const n = req.body;
  try {
    await pool.execute(
      'INSERT INTO announcements (id, title, content, publishDate, author, images) VALUES (?,?,?,?,?,?)',
      [n.id, n.title, n.content, n.publishDate, n.author, JSON.stringify(n.images || [])]
    );
    res.json({ status: 'ok' });
  } catch (e) { res.status(500).send(e.message); }
});

app.delete('/api/delete-announcement/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.execute('DELETE FROM announcements WHERE id = ?', [id]);
    res.json({ status: 'ok' });
  } catch (e) { res.status(500).send(e.message); }
});

const PORT = 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`成汇数字平台后台已启动：http://0.0.0.0:${PORT}`);
});