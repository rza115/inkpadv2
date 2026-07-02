// js/modules/epub-library-page.js

function initEpubLibraryPage() {
  const grid = document.getElementById('epub-grid');
  const uploadInput = document.getElementById('epub-upload');
  const overlay = document.getElementById('uploading-overlay');
  const uploadLabel = document.getElementById('uploading-label');
  const progressFill = document.getElementById('upload-progress');
  const uploadingFile = document.getElementById('uploading-file');

  let books = [];

  loadBooks();

  uploadInput.addEventListener('change', handleUpload);

  // drag & drop ke halaman
  document.addEventListener('dragover', (e) => e.preventDefault());
  document.addEventListener('drop', (e) => {
    e.preventDefault();
    const files = [...e.dataTransfer.files].filter((f) =>
      f.name.toLowerCase().endsWith('.epub') || f.type === 'application/epub+zip'
    );
    if (files.length > 0) processFiles(files);
  });

  async function loadBooks() {
    grid.innerHTML = '';
    grid.appendChild(buildUploadCard());
    try {
      books = await EpubBooksAPI.list();
      books.forEach((b) => grid.appendChild(buildBookCard(b)));
      if (books.length === 0) {
        const empty = document.createElement('p');
        empty.className = 'muted';
        empty.style.cssText = 'grid-column:1/-1; padding:32px 0; text-align:center;';
        empty.textContent = 'Belum ada buku. Upload file .epub buat mulai.';
        grid.appendChild(empty);
      }
    } catch (err) {
      console.error('Gagal load:', err.message);
    }
  }

  function buildUploadCard() {
    const card = document.createElement('label');
    card.className = 'epub-card epub-upload-card';
    card.setAttribute('for', 'epub-upload');
    card.innerHTML = `
      <div class="epub-cover">
        <i class="ti ti-book-upload" aria-hidden="true"></i>
        <span>Upload EPUB</span>
      </div>
    `;
    return card;
  }

  function buildBookCard(book) {
    const card = document.createElement('div');
    card.className = 'epub-card';
    const cover = document.createElement('div');
    cover.className = 'epub-cover';
    if (book.cover_url) {
      const img = document.createElement('img');
      img.src = book.cover_url;
      img.alt = book.title;
      img.loading = 'lazy';
      cover.appendChild(img);
    } else {
      cover.innerHTML = '<i class="ti ti-book-2" aria-hidden="true"></i>';
    }

    const delBtn = document.createElement('button');
    delBtn.className = 'epub-delete-btn';
    delBtn.title = 'Hapus buku';
    delBtn.innerHTML = '<i class="ti ti-trash" aria-hidden="true"></i>';
    delBtn.addEventListener('click', async (e) => {
      e.stopPropagation();
      if (!confirm(`Hapus "${book.title}"?`)) return;
      try {
        await EpubBooksAPI.remove(book.id);
        loadBooks();
      } catch (err) {
        alert('Gagal hapus: ' + err.message);
      }
    });

    card.appendChild(cover);
    card.appendChild(delBtn);
    card.innerHTML += `
      <p class="epub-book-title">${escHtml(book.title)}</p>
      ${book.author ? `<p class="epub-book-author">${escHtml(book.author)}</p>` : ''}
    `;
    card.insertBefore(delBtn, card.querySelector('.epub-book-title'));

    card.addEventListener('click', () => {
      window.location.href = `/pages/epub-reader.html?id=${book.id}`;
    });

    return card;
  }

  async function handleUpload() {
    const files = [...uploadInput.files];
    uploadInput.value = '';
    if (files.length === 0) return;
    await processFiles(files);
  }

  async function processFiles(files) {
    overlay.style.display = 'flex';

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const pct = Math.round((i / files.length) * 100);
      progressFill.style.width = pct + '%';
      uploadingFile.textContent = `${i + 1} / ${files.length}: ${file.name}`;
      uploadLabel.textContent = 'Mengekstrak metadata…';

      try {
        // 1. Ekstrak metadata
        const meta = await EpubMeta.extract(file);

        uploadLabel.textContent = 'Mengupload EPUB…';

        // 2. Upload file EPUB
        const epubUrl = await StorageAPI.upload('epubs', file);
        progressFill.style.width = Math.round(((i + 0.6) / files.length) * 100) + '%';

        // 3. Upload cover (kalau ada)
        let coverUrl = null;
        if (meta.coverBlob) {
          uploadLabel.textContent = 'Mengupload cover…';
          const coverFile = new File([meta.coverBlob], 'cover.jpg', { type: meta.coverBlob.type });
          coverUrl = await StorageAPI.upload('epub-covers', coverFile);
        }
        progressFill.style.width = Math.round(((i + 0.9) / files.length) * 100) + '%';

        // 4. Simpan ke DB
        await EpubBooksAPI.create({
          title: meta.title,
          author: meta.author,
          cover_url: coverUrl,
          epub_url: epubUrl,
          file_size: file.size,
        });
      } catch (err) {
        console.error(`Gagal upload ${file.name}:`, err.message);
        // Lanjut ke file berikutnya, jangan stop semua
      }
    }

    progressFill.style.width = '100%';
    setTimeout(() => {
      overlay.style.display = 'none';
      progressFill.style.width = '0%';
      loadBooks();
    }, 400);
  }

  function escHtml(str) {
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
  }
}

pageInit.register('epub-library', initEpubLibraryPage);
