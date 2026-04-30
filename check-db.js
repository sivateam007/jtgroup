const db = require('better-sqlite3')('C:\\Users\\siva\\Desktop\\jtgroupofinstitution\\data\\users.db');
try {
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
  console.log('Tables:', tables);
  
  if (tables.length > 0) {
    tables.forEach(t => {
      const rows = db.prepare(`SELECT * FROM ${t.name}`).all();
      console.log(`\n${t.name}:`, rows);
    });
  }
} catch(e) {
  console.error(e.message);
}
db.close();
