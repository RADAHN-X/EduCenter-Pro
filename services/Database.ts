import initSqlJs from 'sql.js';
import bcrypt from 'bcryptjs';
import { Student, Teacher, Group, Session, AttendanceRecord, Transaction, UserProfile, UserRole } from '../types';

class DatabaseService {
  db: any = null;
  private STORAGE_KEY = 'educenter_sqlite_db';

  async init() {
    if (this.db) return;

    try {
      // Fetch the WASM binary manually to avoid "fs.readFileSync is not implemented" errors
      // For a Desktop App (Electron), you would bundle this file locally.
      const wasmUrl = 'https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.11.0/sql-wasm.wasm';
      const response = await fetch(wasmUrl);
      
      if (!response.ok) {
        throw new Error(`Failed to load WASM: ${response.statusText}`);
      }
      
      const wasmBinary = await response.arrayBuffer();

      const SQL = await initSqlJs({
        wasmBinary
      });

      // Load from local storage if exists
      const savedDb = localStorage.getItem(this.STORAGE_KEY);
      
      if (savedDb) {
        const binaryArray = this.base64ToUint8Array(savedDb);
        this.db = new SQL.Database(binaryArray);
        
        // Check for migration (ensure users table exists if loading old DB)
        this.createTables();
        const userCheck = this.db.exec("SELECT count(*) FROM users");
        if (!userCheck.length || userCheck[0].values[0][0] === 0) {
            this.seedUsers();
        }

        console.log("Database loaded from LocalStorage");
      } else {
        this.db = new SQL.Database();
        this.createTables();
        this.seedUsers();
        this.save();
        console.log("New Database created and seeded");
      }
    } catch (error) {
      console.error("Failed to initialize database:", error);
    }
  }

  private createTables() {
    const sql = `
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE,
        password TEXT,
        name TEXT,
        role TEXT,
        avatar TEXT
      );

      CREATE TABLE IF NOT EXISTS students (
        id TEXT PRIMARY KEY,
        name TEXT,
        phone TEXT,
        parentPhone TEXT,
        grade TEXT,
        balance REAL,
        joinedAt TEXT,
        subscriptionExpiryDate TEXT
      );

      CREATE TABLE IF NOT EXISTS teachers (
        id TEXT PRIMARY KEY,
        name TEXT,
        subject TEXT,
        percentage REAL,
        phone TEXT,
        avatar TEXT
      );

      CREATE TABLE IF NOT EXISTS groups (
        id TEXT PRIMARY KEY,
        name TEXT,
        subject TEXT,
        teacherId TEXT,
        schedule TEXT,
        studentIds TEXT -- JSON string
      );

      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        groupId TEXT,
        date TEXT,
        startTime TEXT,
        status TEXT,
        topic TEXT
      );

      CREATE TABLE IF NOT EXISTS attendance (
        id TEXT PRIMARY KEY,
        sessionId TEXT,
        studentId TEXT,
        status TEXT,
        timestamp TEXT
      );

      CREATE TABLE IF NOT EXISTS transactions (
        id TEXT PRIMARY KEY,
        type TEXT,
        amount REAL,
        category TEXT,
        date TEXT,
        description TEXT,
        studentId TEXT,
        notes TEXT,
        teacherId TEXT
      );
    `;
    this.db.exec(sql);
    
    // Migration check: Ensure teacherId column exists for existing dbs
    try {
        this.db.exec("SELECT teacherId FROM transactions LIMIT 1");
    } catch (e) {
        console.log("Migrating transactions table: adding teacherId");
        this.db.exec("ALTER TABLE transactions ADD COLUMN teacherId TEXT");
        this.save();
    }

    // Migration check: Ensure avatar column exists in teachers table
    try {
        this.db.exec("SELECT avatar FROM teachers LIMIT 1");
    } catch (e) {
        console.log("Migrating teachers table: adding avatar");
        this.db.exec("ALTER TABLE teachers ADD COLUMN avatar TEXT");
        this.save();
    }
  }

  private seedUsers() {
      // 1. Admin User
      const adminHash = bcrypt.hashSync('123456', 10);
      this.db.run("INSERT OR IGNORE INTO users VALUES (?, ?, ?, ?, ?, ?)", [
          '1',
          'admin',
          adminHash,
          'admin',
          UserRole.ADMIN,
          'https://ui-avatars.com/api/?name=Admin&background=0D8ABC&color=fff'
      ]);

      // 2. Teacher User (Example)
      const teacherHash = bcrypt.hashSync('123456', 10);
      this.db.run("INSERT OR IGNORE INTO users VALUES (?, ?, ?, ?, ?, ?)", [
          '2',
          'teacher',
          teacherHash,
          'أ. محمد صلاح',
          UserRole.TEACHER,
          'https://ui-avatars.com/api/?name=Teacher&background=10b981&color=fff'
      ]);
      this.save();
  }

  private save() {
    if (!this.db) return;
    const data = this.db.export();
    
    // In a Web Environment: Save to LocalStorage
    const base64 = this.uint8ArrayToBase64(data);
    localStorage.setItem(this.STORAGE_KEY, base64);
    
    // In an Electron Environment (Desktop App):
    // You would use IPC to send 'data' to the main process and write to disk:
    // const fs = require('fs'); fs.writeFileSync('db.sqlite', data);
  }

  // --- System Management Methods ---

  public exportDatabase(): Uint8Array | null {
    if (!this.db) return null;
    return this.db.export();
  }

  public async importDatabase(file: File): Promise<void> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const u8 = new Uint8Array(reader.result as ArrayBuffer);
          const base64 = this.uint8ArrayToBase64(u8);
          localStorage.setItem(this.STORAGE_KEY, base64);
          resolve();
        } catch (e) {
          reject(e);
        }
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  }

  public resetDatabase() {
    localStorage.removeItem(this.STORAGE_KEY);
    window.location.reload();
  }

  // --- AUTH Operations (SQL) ---
  
  loginUser(username: string, password: string): UserProfile | null {
      if (!this.db) return null;
      // Note: Use parameterized queries to prevent SQL Injection
      const stmt = this.db.prepare("SELECT * FROM users WHERE username = ?");
      stmt.bind([username]);
      
      if (stmt.step()) {
          const row = stmt.get();
          stmt.free();
          
          const storedHash = row[2] as string;
          let isValid = false;
          
          if (storedHash && storedHash.startsWith('$2a$')) {
              isValid = bcrypt.compareSync(password, storedHash);
          } else {
              // Fallback for existing unhashed passwords during migration
              isValid = (password === storedHash);
              if (isValid) {
                  const newHash = bcrypt.hashSync(password, 10);
                  this.db.run("UPDATE users SET password = ? WHERE id = ?", [newHash, row[0]]);
                  this.save();
              }
          }

          if (isValid) {
              return {
                  id: row[0],
                  username: row[1],
                  // password is row[2], don't return it
                  name: row[3],
                  role: row[4] as UserRole,
                  avatar: row[5]
              };
          }
      } else {
          stmt.free();
      }
      return null;
  }

  updateUserPassword(userId: string, currentPassword: string, newPassword: string): boolean {
      if (!this.db) return false;
      
      const stmt = this.db.prepare("SELECT password FROM users WHERE id = ?");
      stmt.bind([userId]);
      
      if (stmt.step()) {
          const row = stmt.get();
          stmt.free();
          
          const storedHash = row[0] as string;
          let isValid = false;
          
          if (storedHash && storedHash.startsWith('$2a$')) {
              isValid = bcrypt.compareSync(currentPassword, storedHash);
          } else {
              isValid = (currentPassword === storedHash);
          }
          
          if (isValid) {
              const newHash = bcrypt.hashSync(newPassword, 10);
              this.db.run("UPDATE users SET password = ? WHERE id = ?", [newHash, userId]);
              this.save();
              return true;
          }
      } else {
          stmt.free();
      }
      
      return false;
  }

  updateUser(user: UserProfile) {
      if (!this.db) return;
      this.db.run("UPDATE users SET name = ?, avatar = ? WHERE id = ?", [
          user.name,
          user.avatar || null,
          user.id
      ]);
      this.save();
  }

  // --- CRUD Operations ---

  // Students
  getAllStudents(): Student[] {
    if (!this.db) return [];
    const res = this.db.exec("SELECT * FROM students");
    if (!res.length) return [];
    
    return res[0].values.map((row: any) => ({
      id: row[0],
      name: row[1],
      phone: row[2],
      parentPhone: row[3],
      grade: row[4],
      balance: row[5],
      joinedAt: row[6],
      subscriptionExpiryDate: row[7]
    }));
  }

  addStudent(student: Student, autoSave = true) {
    this.db.run("INSERT OR REPLACE INTO students VALUES (?, ?, ?, ?, ?, ?, ?, ?)", [
      student.id ?? null, 
      student.name ?? null, 
      student.phone ?? null, 
      student.parentPhone ?? null, 
      student.grade ?? null, 
      student.balance ?? 0, 
      student.joinedAt ?? null,
      student.subscriptionExpiryDate ?? null
    ]);
    if (autoSave) this.save();
  }

  deleteStudent(id: string) {
      this.db.run("DELETE FROM students WHERE id = ?", [id]);
      this.save();
  }

  updateStudentBalance(id: string, newBalance: number) {
      this.db.run("UPDATE students SET balance = ? WHERE id = ?", [newBalance, id]);
      this.save();
  }

  // Teachers
  getAllTeachers(): Teacher[] {
    if (!this.db) return [];
    const res = this.db.exec("SELECT * FROM teachers");
    if (!res.length) return [];
    return res[0].values.map((row: any) => ({
      id: row[0], name: row[1], subject: row[2], percentage: row[3], phone: row[4], avatar: row[5]
    }));
  }

  addTeacher(teacher: Teacher, autoSave = true) {
    this.db.run("INSERT OR REPLACE INTO teachers VALUES (?, ?, ?, ?, ?, ?)", [
        teacher.id ?? null, 
        teacher.name ?? null, 
        teacher.subject ?? null, 
        teacher.percentage ?? 0, 
        teacher.phone ?? null,
        teacher.avatar ?? null
    ]);
    if (autoSave) this.save();
  }

  deleteTeacher(id: string) {
    this.db.run("DELETE FROM teachers WHERE id = ?", [id]);
    this.save();
  }

  // Groups
  getAllGroups(): Group[] {
      if (!this.db) return [];
      const res = this.db.exec("SELECT * FROM groups");
      if (!res.length) return [];
      return res[0].values.map((row: any) => ({
          id: row[0],
          name: row[1],
          subject: row[2],
          teacherId: row[3],
          schedule: row[4],
          studentIds: JSON.parse(row[5] || '[]')
      }));
  }

  addGroup(group: Group, autoSave = true) {
      this.db.run("INSERT OR REPLACE INTO groups VALUES (?, ?, ?, ?, ?, ?)", [
          group.id ?? null, 
          group.name ?? null, 
          group.subject ?? null, 
          group.teacherId ?? null, 
          group.schedule ?? null, 
          JSON.stringify(group.studentIds ?? [])
      ]);
      if (autoSave) this.save();
  }

  deleteGroup(id: string) {
      this.db.run("DELETE FROM groups WHERE id = ?", [id]);
      // Optional: Delete sessions associated with this group?
      // For now, we'll assume manual cleanup or just keep them (they won't show if group is gone in most views)
      // But let's be clean and delete sessions
      this.db.run("DELETE FROM sessions WHERE groupId = ?", [id]);
      this.save();
  }

  // Sessions
  getAllSessions(): Session[] {
      if (!this.db) return [];
      const res = this.db.exec("SELECT * FROM sessions");
      if (!res.length) return [];
      return res[0].values.map((row: any) => ({
          id: row[0], groupId: row[1], date: row[2], startTime: row[3], status: row[4], topic: row[5]
      }));
  }

  addSession(session: Session, autoSave = true) {
      this.db.run("INSERT OR REPLACE INTO sessions VALUES (?, ?, ?, ?, ?, ?)", [
          session.id ?? null, 
          session.groupId ?? null, 
          session.date ?? null, 
          session.startTime ?? null, 
          session.status ?? null, 
          session.topic ?? null 
      ]);
      if (autoSave) this.save();
  }

  deleteSession(id: string) {
      this.db.run("DELETE FROM sessions WHERE id = ?", [id]);
      // Also clean up attendance records for this session
      this.db.run("DELETE FROM attendance WHERE sessionId = ?", [id]);
      this.save();
  }

  // Attendance
  getAllAttendance(): AttendanceRecord[] {
      if (!this.db) return [];
      const res = this.db.exec("SELECT * FROM attendance");
      if (!res.length) return [];
      return res[0].values.map((row: any) => ({
          id: row[0], sessionId: row[1], studentId: row[2], status: row[3], timestamp: row[4]
      }));
  }

  addAttendance(record: AttendanceRecord, autoSave = true) {
      // Remove existing for same session/student to avoid duplicates
      this.db.run("DELETE FROM attendance WHERE sessionId = ? AND studentId = ?", [record.sessionId, record.studentId]);
      
      this.db.run("INSERT INTO attendance VALUES (?, ?, ?, ?, ?)", [
          record.id ?? null, 
          record.sessionId ?? null, 
          record.studentId ?? null, 
          record.status ?? null, 
          record.timestamp ?? null
      ]);
      if (autoSave) this.save();
  }

  // Transactions
  getAllTransactions(): Transaction[] {
      if (!this.db) return [];
      const res = this.db.exec("SELECT * FROM transactions");
      if (!res.length) return [];
      return res[0].values.map((row: any) => ({
          id: row[0], 
          type: row[1], 
          amount: row[2], 
          category: row[3], 
          date: row[4], 
          description: row[5], 
          studentId: row[6], 
          notes: row[7],
          teacherId: row[8]
      }));
  }

  addTransaction(t: Transaction, autoSave = true) {
      this.db.run("INSERT OR REPLACE INTO transactions VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)", [
          t.id ?? null, 
          t.type ?? null, 
          t.amount ?? 0, 
          t.category ?? null, 
          t.date ?? null, 
          t.description ?? null, 
          t.studentId ?? null, 
          t.notes ?? null,
          t.teacherId ?? null
      ]);
      if (autoSave) this.save();
  }

  deleteTransaction(id: string) {
      this.db.run("DELETE FROM transactions WHERE id = ?", [id]);
      this.save();
  }

  // --- Helpers for Binary Storage ---
  private uint8ArrayToBase64(u8Arr: Uint8Array): string {
    let chunk = 0x8000;
    let index = 0;
    let length = u8Arr.length;
    let result = '';
    while (index < length) {
        let slice = u8Arr.subarray(index, Math.min(index + chunk, length));
        result += String.fromCharCode.apply(null, slice as unknown as number[]);
        index += chunk;
    }
    return btoa(result);
  }

  private base64ToUint8Array(base64: string): Uint8Array {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  }
}

export const db = new DatabaseService();
