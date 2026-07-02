// js/core/offline-queue.js
// Antrian sync sederhana pake IndexedDB.
//
// Dipakai sama modul (chapters.js dkk) pas write ke Supabase gagal karena offline:
// operasi disimpen dulu di sini, lalu di-flush otomatis pas event 'online' nyala.
//
// Desain penting: key antrian = "table:recordId", BUKAN auto-increment.
// Jadi kalau user ngetik 10x sambil offline (masing-masing debounce nge-trigger update),
// itu numpuk jadi SATU entri antrian per chapter (field terbaru menang) — bukan 10 entri
// terpisah yang bisa kepush balapan dan bikin race condition pas di-flush.

const OfflineQueue = (() => {
  const DB_NAME = 'inkpad-offline';
  const STORE_NAME = 'pending_writes';
  const DB_VERSION = 1;

  function openDB() {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'key' });
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  async function enqueue(table, recordId, fields) {
    const db = await openDB();
    const key = `${table}:${recordId}`;
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const getReq = store.get(key);
      getReq.onsuccess = () => {
        const existing = getReq.result;
        store.put({
          key,
          table,
          recordId,
          fields: { ...(existing ? existing.fields : {}), ...fields },
          queuedAt: new Date().toISOString(),
        });
      };
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async function getAll() {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const req = tx.objectStore(STORE_NAME).getAll();
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  async function remove(key) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).delete(key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async function count() {
    const all = await getAll();
    return all.length;
  }

  // Proses semua antrian satu-satu (bukan paralel — biar nggak ada race
  // condition kalau dua entri kebetulan saling terkait). Entri yang masih
  // gagal (misal koneksi putus lagi di tengah jalan) dibiarin di antrian
  // buat dicoba lagi di kesempatan berikutnya.
  async function flush() {
    const pending = await getAll();
    if (pending.length === 0) return;

    for (const item of pending) {
      try {
        const { error } = await supabaseClient.from(item.table).update(item.fields).eq('id', item.recordId);
        if (error) throw error;
        await remove(item.key);
      } catch (err) {
        console.warn('Gagal flush antrian buat', item.key, err.message || err);
      }
    }

    const remaining = await count();
    document.dispatchEvent(new CustomEvent('offline-queue-flushed', { detail: { remaining } }));
  }

  window.addEventListener('online', flush);

  return { enqueue, getAll, remove, count, flush };
})();
