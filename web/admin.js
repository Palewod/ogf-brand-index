(function () {
  'use strict';

  var TOKEN_KEY = 'ogf-gh-token';
  var API = 'https://api.github.com/repos/';

  var state = {
    token: '',
    repo: '',
    branch: 'main',
    brands: [],
    manifest: { version: 1, logos: {} },
    selected: '',
    blob: null
  };

  var els = {
    token: document.getElementById('token'),
    repo: document.getElementById('repo'),
    branch: document.getElementById('branch'),
    remember: document.getElementById('remember'),
    connect: document.getElementById('connect'),
    authStatus: document.getElementById('authStatus'),
    pickCard: document.getElementById('pickCard'),
    search: document.getElementById('search'),
    results: document.getElementById('results'),
    pickHint: document.getElementById('pickHint'),
    editCard: document.getElementById('editCard'),
    preview: document.getElementById('preview'),
    brandName: document.getElementById('brandName'),
    logoState: document.getElementById('logoState'),
    drop: document.getElementById('drop'),
    file: document.getElementById('file'),
    upload: document.getElementById('upload'),
    remove: document.getElementById('remove'),
    status: document.getElementById('status'),
    result: document.getElementById('result')
  };

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function firstChar(name) {
    return Array.from(String(name || '').trim())[0] || '?';
  }

  function monoStyle(name) {
    var h = 0;
    for (var i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % 360;
    return 'background:hsl(' + h + ',24%,88%);color:hsl(' + h + ',30%,28%)';
  }

  function logoHtml(name, cls) {
    var entry = state.manifest.logos && state.manifest.logos[name];
    var mono = '<span class="mono" style="' + monoStyle(name) + '">' + esc(firstChar(name)) + '</span>';
    if (!entry || !entry.file) return '<span class="logo ' + cls + '">' + mono + '</span>';
    var v = entry.updatedAt ? '?v=' + encodeURIComponent(entry.updatedAt) : '';
    return '<span class="logo ' + cls + '">' + mono +
      '<img src="logos/' + encodeURIComponent(entry.file) + v + '" alt="" onerror="this.remove()"></span>';
  }

  function setStatus(node, text, kind) {
    node.textContent = text || '';
    node.className = 'astatus' + (kind ? ' ' + kind : '');
  }

  function b64encode(text) {
    var bytes = new TextEncoder().encode(text);
    var bin = '';
    for (var i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    return btoa(bin);
  }

  function b64decode(text) {
    var bin = atob(String(text).replace(/\s/g, ''));
    var bytes = Uint8Array.from(bin, function (c) { return c.charCodeAt(0); });
    return new TextDecoder().decode(bytes);
  }

  function blobToBase64(blob) {
    return new Promise(function (resolve, reject) {
      var reader = new FileReader();
      reader.onload = function () {
        resolve(String(reader.result).split(',')[1]);
      };
      reader.onerror = function () { reject(new Error('读取图片失败')); };
      reader.readAsDataURL(blob);
    });
  }

  async function hashName(name) {
    var digest = await crypto.subtle.digest('SHA-1', new TextEncoder().encode(name));
    return Array.from(new Uint8Array(digest)).slice(0, 6)
      .map(function (b) { return b.toString(16).padStart(2, '0'); }).join('');
  }

  function decodeSvg(file) {
    return new Promise(function (resolve, reject) {
      var url = URL.createObjectURL(file);
      var img = new Image();
      img.onload = function () {
        URL.revokeObjectURL(url);
        resolve({ source: img, width: img.naturalWidth || 512, height: img.naturalHeight || 512 });
      };
      img.onerror = function () {
        URL.revokeObjectURL(url);
        reject(new Error('SVG 无法解析'));
      };
      img.src = url;
    });
  }

  async function toWebp(file) {
    var isSvg = file.type === 'image/svg+xml' || /\.svg$/i.test(file.name || '');
    var decoded = isSvg ? await decodeSvg(file) : null;
    var bitmap = isSvg ? null : await createImageBitmap(file);
    var srcW = isSvg ? decoded.width : bitmap.width;
    var srcH = isSvg ? decoded.height : bitmap.height;
    var source = isSvg ? decoded.source : bitmap;
    var size = 128;
    var canvas = document.createElement('canvas');
    canvas.width = canvas.height = size;
    var ctx = canvas.getContext('2d');
    var scale = Math.min(size / srcW, size / srcH);
    var w = Math.max(1, Math.round(srcW * scale));
    var h = Math.max(1, Math.round(srcH * scale));
    ctx.drawImage(source, 0, 0, srcW, srcH, Math.round((size - w) / 2), Math.round((size - h) / 2), w, h);
    if (bitmap) bitmap.close();
    var blob = await new Promise(function (resolve) { canvas.toBlob(resolve, 'image/webp', 0.92); });
    if (!blob) throw new Error('当前浏览器无法编码 WebP');
    return blob;
  }

  function apiUrl(path) {
    var repo = state.repo.split('/').map(encodeURIComponent).join('/');
    return API + repo + (path ? '/' + path : '');
  }

  async function gh(path, opts) {
    opts = opts || {};
    var url = apiUrl(path);
    if (opts.ref) url += (path.indexOf('?') >= 0 ? '&' : '?') + 'ref=' + encodeURIComponent(opts.ref);
    var headers = {
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28'
    };
    if (state.token) headers.Authorization = 'Bearer ' + state.token;
    if (opts.body) headers['Content-Type'] = 'application/json';
    var res = await fetch(url, {
      method: opts.method || 'GET',
      headers: headers,
      body: opts.body ? JSON.stringify(opts.body) : undefined
    });
    if (opts.allow404 && res.status === 404) return null;
    var data = null;
    try { data = await res.json(); } catch (e) { /* empty body */ }
    if (!res.ok) {
      var msg = (data && data.message) || ('HTTP ' + res.status);
      if (res.status === 401) msg = 'Token 无效或已过期';
      else if (res.status === 403) msg = 'Token 权限不足，需要 Contents: Read and write';
      else if (res.status === 404) msg = '找不到仓库或分支，检查仓库名和分支';
      else if (res.status === 409) msg = '文件刚被改动过，请再试一次';
      throw new Error(msg);
    }
    return data;
  }

  async function readManifest() {
    var data = await gh('contents/web/data/logos.json', { ref: state.branch, allow404: true });
    if (!data) return { data: { version: 1, logos: {} }, sha: '' };
    var json;
    try {
      json = JSON.parse(b64decode(data.content));
    } catch (e) {
      throw new Error('web/data/logos.json 不是合法 JSON');
    }
    if (!json.logos) json.logos = {};
    return { data: json, sha: data.sha };
  }

  async function loadBrands() {
    if (state.brands.length) return;
    var res = await fetch('data/brands.json');
    if (!res.ok) throw new Error('无法载入 data/brands.json（HTTP ' + res.status + '）');
    state.brands = await res.json();
  }

  function renderResults(query) {
    var q = String(query || '').trim().toLowerCase();
    var list = state.brands.filter(function (b) {
      return !q || b.name.toLowerCase().indexOf(q) >= 0;
    }).slice(0, 40);
    els.pickHint.textContent = q
      ? '匹配 ' + list.length + ' 个（最多显示 40 个）'
      : '共 ' + state.brands.length + ' 个品牌，输入关键字筛选';
    els.results.innerHTML = list.map(function (b) {
      return '<li><button type="button" data-name="' + esc(b.name) + '">' +
        logoHtml(b.name, 'logo-sm') +
        '<span class="aname">' + esc(b.name) + '</span>' +
        '<span class="acount">' + Number(b.count).toLocaleString('zh-CN') + '</span>' +
        '</button></li>';
    }).join('');
  }

  function renderPreview(blobUrl) {
    var name = state.selected;
    var entry = state.manifest.logos[name];
    var html = '<span class="mono" style="' + monoStyle(name) + '">' + esc(firstChar(name)) + '</span>';
    if (blobUrl) {
      html += '<img src="' + blobUrl + '" alt="">';
    } else if (entry) {
      html += '<img src="logos/' + encodeURIComponent(entry.file) +
        (entry.updatedAt ? '?v=' + encodeURIComponent(entry.updatedAt) : '') + '" alt="" onerror="this.remove()">';
    }
    els.preview.innerHTML = html;
  }

  function selectBrand(name) {
    state.selected = name;
    state.blob = null;
    els.file.value = '';
    els.upload.disabled = true;
    els.result.innerHTML = '';
    setStatus(els.status, '');
    els.brandName.textContent = name;
    els.editCard.hidden = false;
    var entry = state.manifest.logos[name];
    els.logoState.textContent = entry ? '已有 logo：' + entry.file : '暂无 logo，显示首字占位';
    els.remove.hidden = !entry;
    renderPreview(null);
    els.editCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  async function connect() {
    state.token = els.token.value.trim();
    state.repo = els.repo.value.trim()
      .replace(/^https?:\/\/github\.com\//i, '')
      .replace(/\.git$/i, '');
    state.branch = els.branch.value.trim() || 'main';
    if (!state.token) { setStatus(els.authStatus, '请先粘贴 Token', 'err'); return; }
    if (!/^[A-Za-z0-9._-]+\/[A-Za-z0-9._-]+$/.test(state.repo)) {
      setStatus(els.authStatus, '仓库要写成 owner/name', 'err');
      return;
    }
    els.connect.disabled = true;
    setStatus(els.authStatus, '验证中…');
    try {
      await gh('');
      var man = await readManifest();
      state.manifest = man.data;
      await loadBrands();
      storeToken();
      els.pickCard.hidden = false;
      renderResults(els.search.value);
      setStatus(els.authStatus, '已连接 ' + state.repo + ' · ' + state.brands.length + ' 个品牌', 'ok');
      els.pickCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (err) {
      setStatus(els.authStatus, err.message, 'err');
    } finally {
      els.connect.disabled = false;
    }
  }

  function storeToken() {
    try {
      if (els.remember.checked) {
        localStorage.setItem(TOKEN_KEY, state.token);
        sessionStorage.removeItem(TOKEN_KEY);
      } else {
        sessionStorage.setItem(TOKEN_KEY, state.token);
        localStorage.removeItem(TOKEN_KEY);
      }
    } catch (e) { /* storage blocked */ }
  }

  function handleFile(file) {
    if (!file) return;
    if (!/^image\/(png|jpeg|webp|svg\+xml)$/.test(file.type) && !/\.svg$/i.test(file.name || '')) {
      state.blob = null;
      els.upload.disabled = true;
      setStatus(els.status, '只支持 PNG / JPG / WebP / SVG', 'err');
      return;
    }
    setStatus(els.status, '处理图片…');
    toWebp(file).then(function (blob) {
      state.blob = blob;
      renderPreview(URL.createObjectURL(blob));
      els.upload.disabled = false;
      setStatus(els.status, '已就绪 · ' + Math.round(blob.size / 1024) + ' KB，点击上传并提交');
    }).catch(function (err) {
      state.blob = null;
      els.upload.disabled = true;
      setStatus(els.status, '图片处理失败：' + err.message, 'err');
    });
  }

  async function upload() {
    if (!state.blob || !state.selected) return;
    els.upload.disabled = true;
    els.remove.disabled = true;
    els.result.innerHTML = '';
    setStatus(els.status, '提交中…');
    try {
      var filename = 'logo-' + (await hashName(state.selected)) + '.webp';
      var content = await blobToBase64(state.blob);
      var existing = await gh('contents/web/logos/' + filename, { ref: state.branch, allow404: true });
      var imagePut = await gh('contents/web/logos/' + filename, {
        method: 'PUT',
        body: {
          message: (existing ? 'Update' : 'Add') + ' logo for ' + state.selected,
          content: content,
          branch: state.branch,
          sha: existing ? existing.sha : undefined
        }
      });

      var now = new Date().toISOString();
      var fresh = await readManifest();
      fresh.data.logos[state.selected] = { file: filename, updatedAt: now };
      fresh.data.updatedAt = now;
      var manifestPut = await gh('contents/web/data/logos.json', {
        method: 'PUT',
        body: {
          message: 'Update logo manifest for ' + state.selected,
          content: b64encode(JSON.stringify(fresh.data, null, 2) + '\n'),
          branch: state.branch,
          sha: fresh.sha || undefined
        }
      });

      state.manifest = fresh.data;
      els.logoState.textContent = '已有 logo：' + filename;
      els.remove.hidden = false;
      setStatus(els.status, '已提交 · Pages 约 1 分钟后生效', 'ok');
      els.result.innerHTML =
        '<a href="' + esc(imagePut.commit.html_url) + '" target="_blank" rel="noopener">图片提交</a> · ' +
        '<a href="' + esc(manifestPut.commit.html_url) + '" target="_blank" rel="noopener">清单提交</a>' +
        '<img src="' + URL.createObjectURL(state.blob) + '" alt="预览">';
      renderResults(els.search.value);
    } catch (err) {
      setStatus(els.status, err.message, 'err');
    } finally {
      els.upload.disabled = !state.blob;
      els.remove.disabled = false;
    }
  }

  async function removeLogo() {
    var name = state.selected;
    var entry = state.manifest.logos[name];
    if (!entry) return;
    if (!confirm('删除「' + name + '」的 logo？')) return;
    els.upload.disabled = true;
    els.remove.disabled = true;
    setStatus(els.status, '删除中…');
    try {
      var file = await gh('contents/web/logos/' + entry.file, { ref: state.branch, allow404: true });
      if (file) {
        await gh('contents/web/logos/' + entry.file, {
          method: 'DELETE',
          body: { message: 'Remove logo for ' + name, branch: state.branch, sha: file.sha }
        });
      }
      var now = new Date().toISOString();
      var fresh = await readManifest();
      delete fresh.data.logos[name];
      fresh.data.updatedAt = now;
      await gh('contents/web/data/logos.json', {
        method: 'PUT',
        body: {
          message: 'Remove logo manifest entry for ' + name,
          content: b64encode(JSON.stringify(fresh.data, null, 2) + '\n'),
          branch: state.branch,
          sha: fresh.sha || undefined
        }
      });
      state.manifest = fresh.data;
      els.remove.hidden = true;
      els.logoState.textContent = '已删除，显示首字占位';
      els.result.innerHTML = '';
      state.blob = null;
      els.file.value = '';
      renderPreview(null);
      renderResults(els.search.value);
      setStatus(els.status, '已删除 · Pages 约 1 分钟后生效', 'ok');
    } catch (err) {
      setStatus(els.status, err.message, 'err');
    } finally {
      els.remove.disabled = false;
      els.upload.disabled = !state.blob;
    }
  }

  els.connect.addEventListener('click', connect);
  els.search.addEventListener('input', function () { renderResults(els.search.value); });
  els.results.addEventListener('click', function (e) {
    var btn = e.target.closest('button[data-name]');
    if (btn) selectBrand(btn.dataset.name);
  });
  els.file.addEventListener('change', function () { handleFile(els.file.files[0]); });
  els.upload.addEventListener('click', upload);
  els.remove.addEventListener('click', removeLogo);

  ['dragenter', 'dragover'].forEach(function (type) {
    els.drop.addEventListener(type, function (e) {
      e.preventDefault();
      els.drop.classList.add('over');
    });
  });
  ['dragleave', 'drop'].forEach(function (type) {
    els.drop.addEventListener(type, function (e) {
      e.preventDefault();
      els.drop.classList.remove('over');
    });
  });
  els.drop.addEventListener('drop', function (e) {
    if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  });

  try {
    var saved = localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY) || '';
    if (saved) {
      els.token.value = saved;
      els.remember.checked = !!localStorage.getItem(TOKEN_KEY);
    }
  } catch (e) { /* storage blocked */ }
})();
