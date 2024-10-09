import { openDB } from 'idb';

const dbName = 'avatarDB';
const storeName = 'avatars';

async function initDB() {
  const db = await openDB(dbName, 1, {
    upgrade(db) {
      db.createObjectStore(storeName);
    },
  });
  return db;
}

export async function getAvatar(url) {
  const db = await initDB();
  return db.get(storeName, url);
}

export async function setAvatar(url, base64) {
  const db = await initDB();
  await db.put(storeName, base64, url);
}