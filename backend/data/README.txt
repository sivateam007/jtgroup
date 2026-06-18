JT GROUP OF INSTITUTION - DATABASE INFO
=========================================

Documentation created by Sivateam

DATA FOLDER LOCATION:
----------------------
/var/www/jtgroupofinstitution/backend/data/

WHAT'S IN THE DATA FOLDER:
--------------------------
✅ EMPTY (no user data yet)

WHAT HAPPENS ON FIRST SIGNUP:
------------------------------
1. First user signs up → SQLite database (app.db) is created automatically
2. Tables created: users, subscriptions, progress
3. Database file grows as users sign up

WHERE USER DATA IS STORED:
------------------------
- File: backend\data\app.db
- Type: SQLite database (single file)
- Contains: 
  • User accounts (email, password hash, name)
  • Payment history (Razorpay order IDs, payment IDs)
  • Course progress (time spent, last accessed)

BACKUP LOCATION (After Server Starts):
------------------------------
- Automated backup: /var/backups/jtgroup/ (setup by client)
- Manual backup: copy app.db to safe location
- Backup script: scripts\backup.sh (ready to use)

IMPORTANT NOTES:
----------------
✅ Data is stored in SQLite (not MySQL/PostgreSQL)
✅ Single file database (easy to backup)
✅ If VPS expires → data gone (unless backed up!)
✅ Client MUST setup automated backups (see scripts\backup.sh)

FOR CLIENT:
-----------
1. Upload project to VPS: /var/www/jtgroupofinstitution
2. Start server: pm2 start backend/src/server.js --name jtgroup
3. First user signup → app.db created automatically
4. Setup backups: chmod +x scripts/backup.sh, add to cron

DATABASE SIZE ESTIMATE:
---------------------
- 1 user ≈ 1 KB in users table
- 1000 users ≈ 1 MB
- 100,000 users ≈ 100 MB
- Free space on Hostinger KVM1 (80 GB) = plenty!

STATUS: ✅ READY FOR HANDOVER (no user data yet)
