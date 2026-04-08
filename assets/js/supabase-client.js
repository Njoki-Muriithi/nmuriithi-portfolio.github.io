/**
 * Supabase Client - Authentication & GitHub Content Management
 * Uses Supabase for GitHub OAuth, GitHub API for content CRUD.
 */

(function () {
  'use strict';

  // ─── Configuration ───────────────────────────────────────────────
  var SUPABASE_URL = window.__SUPABASE_URL__ || '';
  var SUPABASE_ANON_KEY = window.__SUPABASE_ANON_KEY__ || '';
  var ADMIN_REDIRECT_URL = window.__ADMIN_REDIRECT_URL__ || '';
  var GITHUB_OWNER = window.__GITHUB_OWNER__ || '';
  var GITHUB_REPO = window.__GITHUB_REPO__ || '';
  var GITHUB_BRANCH = window.__GITHUB_BRANCH__ || 'main';

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error('Supabase URL or anon key not configured. Check _config.yml.');
    return;
  }

  var supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  // ─── State ───────────────────────────────────────────────────────
  var state = {
    user: null,
    providerToken: null,
    currentView: 'login',
    currentCollection: null,
    items: [],
    selectedItem: null,
    isNewItem: false,
    isDirty: false,
    savedSnapshot: null,
    sidebarCollapsed: false
  };

  // ─── DOM Helpers ─────────────────────────────────────────────────
  function $(selector) { return document.querySelector(selector); }
  function $$(selector) { return document.querySelectorAll(selector); }
  function show(el) { if (el) el.style.display = ''; }
  function hide(el) { if (el) el.style.display = 'none'; }

  function showToast(message, type) {
    var toast = $('#toast');
    if (!toast) return;
    toast.textContent = message;
    toast.className = 'toast toast-' + (type || 'info') + ' toast-visible';
    setTimeout(function () {
      toast.className = 'toast';
    }, 3500);
  }

  // ─── Auth Functions ──────────────────────────────────────────────

  function loginWithGitHub() {
    return supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: ADMIN_REDIRECT_URL,
        scopes: 'repo'
      }
    });
  }

  function logout() {
    state.providerToken = null;
    localStorage.removeItem('github_provider_token');
    return supabase.auth.signOut();
  }

  function checkSession() {
    return supabase.auth.getSession();
  }

  function getGitHubToken() {
    return state.providerToken || localStorage.getItem('github_provider_token') || '';
  }

  // ─── GitHub API Functions ────────────────────────────────────────

  var GITHUB_API = 'https://api.github.com';

  function githubFetch(path, options) {
    var token = getGitHubToken();
    if (!token) {
      return Promise.reject(new Error('No GitHub token available. Please log in again.'));
    }
    var url = GITHUB_API + '/repos/' + GITHUB_OWNER + '/' + GITHUB_REPO + path;
    var defaults = {
      headers: {
        'Authorization': 'token ' + token,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
      }
    };
    var merged = Object.assign({}, defaults, options || {});
    merged.headers = Object.assign({}, defaults.headers, (options && options.headers) || {});
    return fetch(url, merged).then(function (res) {
      if (!res.ok) {
        return res.json().then(function (err) {
          throw new Error(err.message || 'GitHub API error: ' + res.status);
        });
      }
      if (res.status === 204) return null;
      return res.json();
    });
  }

  /** List files in a collection directory (_projects/ or _publications/) */
  function listFiles(collection) {
    var dirPath = '_' + collection;
    return githubFetch('/contents/' + dirPath + '?ref=' + GITHUB_BRANCH);
  }

  /** Get a single file's content and SHA */
  function getFile(collection, filename) {
    var filePath = '_' + collection + '/' + filename;
    return githubFetch('/contents/' + filePath + '?ref=' + GITHUB_BRANCH);
  }

  /** Create or update a file */
  function putFile(collection, filename, content, sha) {
    var filePath = '_' + collection + '/' + filename;
    var body = {
      message: (sha ? 'Update' : 'Create') + ' ' + collection.slice(0, -1) + ': ' + filename,
      content: btoa(unescape(encodeURIComponent(content))),
      branch: GITHUB_BRANCH
    };
    if (sha) body.sha = sha;
    return githubFetch('/contents/' + filePath, {
      method: 'PUT',
      body: JSON.stringify(body)
    });
  }

  /** Delete a file */
  function removeFile(collection, filename, sha) {
    var filePath = '_' + collection + '/' + filename;
    return githubFetch('/contents/' + filePath, {
      method: 'DELETE',
      body: JSON.stringify({
        message: 'Delete ' + collection.slice(0, -1) + ': ' + filename,
        sha: sha,
        branch: GITHUB_BRANCH
      })
    });
  }

  // ─── YAML Front Matter Parsing ───────────────────────────────────

  /** Parse a markdown file into { frontMatter, body } */
  function parseMarkdown(rawContent) {
    var match = rawContent.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
    if (!match) {
      return { frontMatter: {}, body: rawContent };
    }
    var fm;
    try {
      fm = window.jsyaml.load(match[1]) || {};
    } catch (e) {
      console.error('YAML parse error:', e);
      fm = {};
    }
    return { frontMatter: fm, body: match[2] || '' };
  }

  /** Generate a markdown file from front matter object and body string */
  function generateMarkdown(frontMatter, body) {
    var yaml = window.jsyaml.dump(frontMatter, {
      lineWidth: -1,
      quotingType: '"',
      forceQuotes: false
    });
    var result = '---\n' + yaml + '---\n';
    if (body && body.trim()) {
      result += '\n' + body.trim() + '\n';
    }
    return result;
  }

  /** Convert a title to a filename slug */
  function slugify(text) {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  // ─── View Management ────────────────────────────────────────────

  function switchView(view) {
    state.currentView = view;
    hide($('#view-login'));
    hide($('#view-dashboard'));
    hide($('#view-editor'));

    if (view === 'login') show($('#view-login'));
    else if (view === 'dashboard') show($('#view-dashboard'));
    else if (view === 'editor') show($('#view-editor'));

    var nav = $('#admin-nav');
    if (nav) {
      if (view === 'login') hide(nav);
      else show(nav);
    }
  }

  function showDashboard() {
    state.currentCollection = null;
    state.items = [];
    state.selectedItem = null;
    state.isNewItem = false;
    state.isDirty = false;
    switchView('dashboard');
  }

  // ─── Sidebar ─────────────────────────────────────────────────────

  function renderSidebar() {
    var list = $('#sidebar-list');
    if (!list) return;
    list.innerHTML = '';

    state.items.forEach(function (item) {
      var li = document.createElement('li');
      li.className = 'sidebar-item' + (state.selectedItem && state.selectedItem._filename === item._filename ? ' active' : '');
      li.textContent = item.menu_label || item.title || '(Untitled)';
      li.dataset.filename = item._filename;
      li.addEventListener('click', function () {
        selectItem(item);
      });
      list.appendChild(li);
    });
  }

  function toggleSidebar() {
    state.sidebarCollapsed = !state.sidebarCollapsed;
    var sidebar = $('#editor-sidebar');
    var main = $('#editor-main');
    var toggle = $('#sidebar-toggle');
    if (state.sidebarCollapsed) {
      sidebar.classList.add('collapsed');
      main.classList.add('expanded');
      if (toggle) toggle.textContent = '☰';
    } else {
      sidebar.classList.remove('collapsed');
      main.classList.remove('expanded');
      if (toggle) toggle.textContent = '◀';
    }
  }

  // ─── Editor Form ─────────────────────────────────────────────────

  var TAG_FIELDS = ['categories', 'technologies'];

  function getFormData() {
    var data = {};
    data.menu_label = $('#field-menu_label').value.trim();
    data.title = $('#field-title').value.trim();
    data.description = $('#field-description').value.trim();
    data.date = $('#field-date').value.trim();
    data.demo_url = $('#field-demo_url').value.trim();
    data.github_url = $('#field-github_url').value.trim();
    data.display_order = parseInt($('#field-display_order').value, 10) || 0;

    TAG_FIELDS.forEach(function (field) {
      data[field] = getTagValues(field);
    });

    data.images = getImagesData();

    return data;
  }

  function getBodyContent() {
    return ($('#field-body') && $('#field-body').value) || '';
  }

  function populateForm(item) {
    $('#field-menu_label').value = (item && item.menu_label) || '';
    $('#field-title').value = (item && item.title) || '';
    $('#field-description').value = (item && item.description) || '';
    $('#field-date').value = (item && item.date) || '';
    $('#field-demo_url').value = (item && item.demo_url) || '';
    $('#field-github_url').value = (item && item.github_url) || '';
    $('#field-display_order').value = (item && item.display_order) || 0;

    TAG_FIELDS.forEach(function (field) {
      renderTags(field, (item && item[field]) || []);
    });

    renderImages((item && item.images) || []);

    var bodyField = $('#field-body');
    if (bodyField) {
      bodyField.value = (item && item._body) || '';
    }

    state.savedSnapshot = JSON.stringify(getFormData()) + '|||' + getBodyContent();
    state.isDirty = false;
    updateActionButtons();
  }

  function clearForm() {
    populateForm(null);
  }

  // ─── Multi-value Tags ────────────────────────────────────────────

  function renderTags(field, values) {
    var container = $('#tags-' + field);
    if (!container) return;
    container.innerHTML = '';
    (values || []).forEach(function (val) {
      addTagElement(container, field, val);
    });
  }

  function addTagElement(container, field, value) {
    var tag = document.createElement('span');
    tag.className = 'tag';
    tag.innerHTML = '<span class="tag-text">' + escapeHtml(value) + '</span><button type="button" class="tag-remove" aria-label="Remove ' + escapeHtml(value) + '">&times;</button>';
    tag.querySelector('.tag-remove').addEventListener('click', function () {
      tag.remove();
      markDirty();
    });
    container.appendChild(tag);
  }

  function addTag(field) {
    var input = $('#tag-input-' + field);
    if (!input) return;
    var val = input.value.trim();
    if (!val) return;
    var container = $('#tags-' + field);
    addTagElement(container, field, val);
    input.value = '';
    markDirty();
  }

  function getTagValues(field) {
    var container = $('#tags-' + field);
    if (!container) return [];
    var tags = container.querySelectorAll('.tag-text');
    var values = [];
    tags.forEach(function (t) { values.push(t.textContent); });
    return values;
  }

  // ─── Images Array ────────────────────────────────────────────────

  function renderImages(images) {
    var container = $('#images-list');
    if (!container) return;
    container.innerHTML = '';
    (images || []).forEach(function (img, idx) {
      addImageEntry(container, img, idx);
    });
  }

  function addImageEntry(container, img, idx) {
    var div = document.createElement('div');
    div.className = 'image-entry';
    div.innerHTML =
      '<div class="image-entry-header">' +
        '<strong>Image ' + ((container.children.length || 0) + 1) + '</strong>' +
        '<button type="button" class="btn-remove-image" aria-label="Remove image">&times;</button>' +
      '</div>' +
      '<label>Src <input type="text" class="img-src" value="' + escapeAttr((img && img.src) || '') + '"></label>' +
      '<label>Alt <input type="text" class="img-alt" value="' + escapeAttr((img && img.alt) || '') + '"></label>' +
      '<label>Title <input type="text" class="img-title" value="' + escapeAttr((img && img.title) || '') + '"></label>' +
      '<label>Caption <input type="text" class="img-caption" value="' + escapeAttr((img && img.caption) || '') + '"></label>';

    div.querySelector('.btn-remove-image').addEventListener('click', function () {
      div.remove();
      renumberImages();
      markDirty();
    });

    div.querySelectorAll('input').forEach(function (inp) {
      inp.addEventListener('input', markDirty);
    });

    container.appendChild(div);
  }

  function addNewImage() {
    var container = $('#images-list');
    if (!container) return;
    addImageEntry(container, null);
    markDirty();
  }

  function renumberImages() {
    var entries = $$('#images-list .image-entry');
    entries.forEach(function (entry, i) {
      entry.querySelector('strong').textContent = 'Image ' + (i + 1);
    });
  }

  function getImagesData() {
    var entries = $$('#images-list .image-entry');
    var images = [];
    entries.forEach(function (entry) {
      images.push({
        src: entry.querySelector('.img-src').value.trim(),
        alt: entry.querySelector('.img-alt').value.trim(),
        title: entry.querySelector('.img-title').value.trim(),
        caption: entry.querySelector('.img-caption').value.trim()
      });
    });
    return images;
  }

  // ─── Dirty State ─────────────────────────────────────────────────

  function markDirty() {
    var current = JSON.stringify(getFormData()) + '|||' + getBodyContent();
    state.isDirty = current !== state.savedSnapshot;
    updateActionButtons();
  }

  function updateActionButtons() {
    var btnDelete = $('#btn-delete');
    var btnCancel = $('#btn-cancel');
    var btnSave = $('#btn-save');

    if (btnDelete) {
      if (state.isNewItem) hide(btnDelete);
      else show(btnDelete);
    }
    if (btnCancel) {
      if (state.isDirty || state.isNewItem) show(btnCancel);
      else hide(btnCancel);
    }
    if (btnSave) show(btnSave);
  }

  // ─── Item Selection ──────────────────────────────────────────────

  function selectItem(item) {
    state.selectedItem = item;
    state.isNewItem = false;
    populateForm(item);
    renderSidebar();
    show($('#editor-form-container'));
    hide($('#editor-placeholder'));
  }

  function createNewItem() {
    state.selectedItem = null;
    state.isNewItem = true;
    clearForm();
    renderSidebar();
    show($('#editor-form-container'));
    hide($('#editor-placeholder'));
  }

  // ─── CRUD Actions ────────────────────────────────────────────────

  async function saveItem() {
    var formData = getFormData();
    var body = getBodyContent();
    var collection = state.currentCollection;

    if (!formData.title) {
      showToast('Title is required.', 'error');
      return;
    }

    // Build front matter object (exclude internal fields)
    var frontMatter = Object.assign({}, formData);

    // Generate filename
    var filename;
    if (state.isNewItem) {
      filename = slugify(formData.title || 'untitled') + '.md';
    } else {
      filename = state.selectedItem._filename;
    }

    var content = generateMarkdown(frontMatter, body);
    var sha = state.isNewItem ? null : state.selectedItem._sha;

    try {
      var result = await putFile(collection, filename, content, sha);

      showToast('Saved successfully!', 'success');

      // Update state with new SHA and filename
      var savedItem = Object.assign({}, formData, {
        _filename: filename,
        _sha: result.content.sha,
        _body: body
      });
      state.isNewItem = false;
      state.selectedItem = savedItem;
      state.savedSnapshot = JSON.stringify(getFormData()) + '|||' + getBodyContent();
      state.isDirty = false;
      await refreshSidebar();
      updateActionButtons();
    } catch (err) {
      showToast('Save error: ' + err.message, 'error');
    }
  }

  async function deleteCurrentItem() {
    if (state.isNewItem || !state.selectedItem) return;

    if (!confirm('Are you sure you want to delete "' + (state.selectedItem.title || 'this item') + '"?')) {
      return;
    }

    try {
      await removeFile(state.currentCollection, state.selectedItem._filename, state.selectedItem._sha);

      showToast('Deleted successfully.', 'success');
      state.selectedItem = null;
      state.isNewItem = false;
      hide($('#editor-form-container'));
      show($('#editor-placeholder'));
      clearForm();
      await refreshSidebar();
    } catch (err) {
      showToast('Delete error: ' + err.message, 'error');
    }
  }

  function cancelEdit() {
    if (state.isNewItem) {
      state.isNewItem = false;
      state.selectedItem = null;
      hide($('#editor-form-container'));
      show($('#editor-placeholder'));
      clearForm();
      renderSidebar();
    } else if (state.selectedItem) {
      populateForm(state.selectedItem);
    }
  }

  async function refreshSidebar() {
    try {
      var files = await listFiles(state.currentCollection);
      // Filter to .md files only
      var mdFiles = files.filter(function (f) { return f.name.endsWith('.md'); });

      // Fetch and parse each file
      var items = [];
      for (var i = 0; i < mdFiles.length; i++) {
        try {
          var fileData = await getFile(state.currentCollection, mdFiles[i].name);
          var raw = decodeURIComponent(escape(atob(fileData.content.replace(/\n/g, ''))));
          var parsed = parseMarkdown(raw);
          var item = Object.assign({}, parsed.frontMatter, {
            _filename: mdFiles[i].name,
            _sha: fileData.sha,
            _body: parsed.body
          });
          items.push(item);
        } catch (e) {
          console.error('Error parsing file:', mdFiles[i].name, e);
        }
      }

      // Sort by display_order
      items.sort(function (a, b) {
        return (a.display_order || 0) - (b.display_order || 0);
      });

      state.items = items;
      renderSidebar();
    } catch (err) {
      showToast('Failed to load items: ' + err.message, 'error');
    }
  }

  // ─── Collection View ─────────────────────────────────────────────

  async function openCollection(collection) {
    state.currentCollection = collection;
    state.selectedItem = null;
    state.isNewItem = false;
    state.isDirty = false;
    hide($('#editor-form-container'));
    show($('#editor-placeholder'));

    var heading = $('#editor-heading');
    if (heading) heading.textContent = collection === 'projects' ? 'Projects' : 'Publications';

    $$('.nav-collection').forEach(function (el) {
      el.classList.toggle('active', el.dataset.collection === collection);
    });

    switchView('editor');
    await refreshSidebar();
  }

  // ─── Utility ─────────────────────────────────────────────────────

  function escapeHtml(str) {
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(str || ''));
    return div.innerHTML;
  }

  function escapeAttr(str) {
    return (str || '').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  // ─── Init ────────────────────────────────────────────────────────

  async function init() {
    // Check for error in URL hash (e.g. expired token)
    var hashParams = new URLSearchParams(window.location.hash.substring(1));
    var hashError = hashParams.get('error_description');
    if (hashError) {
      showToast(hashError, 'error');
      history.replaceState(null, '', window.location.pathname);
    }

    // Check for existing session
    var sessionResult = await checkSession();
    if (sessionResult.data.session) {
      state.user = sessionResult.data.session.user;
      // Restore provider token if available
      if (sessionResult.data.session.provider_token) {
        state.providerToken = sessionResult.data.session.provider_token;
        localStorage.setItem('github_provider_token', state.providerToken);
      }
      showDashboard();
    } else {
      switchView('login');
    }

    // Listen for auth state changes
    supabase.auth.onAuthStateChange(function (event, session) {
      if (event === 'SIGNED_IN' && session) {
        state.user = session.user;
        if (session.provider_token) {
          state.providerToken = session.provider_token;
          localStorage.setItem('github_provider_token', state.providerToken);
        }
        showDashboard();
      } else if (event === 'SIGNED_OUT') {
        state.user = null;
        state.providerToken = null;
        localStorage.removeItem('github_provider_token');
        switchView('login');
      }
    });

    // ─── Event Bindings ────────────────────────────────────────────

    // GitHub OAuth login
    var btnGitHub = $('#btn-github-login');
    if (btnGitHub) {
      btnGitHub.addEventListener('click', async function () {
        btnGitHub.disabled = true;
        btnGitHub.textContent = 'Redirecting...';
        var result = await loginWithGitHub();
        if (result.error) {
          showToast('Login error: ' + result.error.message, 'error');
          btnGitHub.disabled = false;
          btnGitHub.textContent = 'Sign in with GitHub';
        }
      });
    }

    // Logout
    var btnLogout = $('#btn-logout');
    if (btnLogout) {
      btnLogout.addEventListener('click', async function () {
        await logout();
        showToast('Logged out.', 'info');
      });
    }

    // Collection navigation
    $$('.nav-collection').forEach(function (el) {
      el.addEventListener('click', function (e) {
        e.preventDefault();
        openCollection(el.dataset.collection);
      });
    });

    // Back to dashboard
    var btnBack = $('#btn-back-dashboard');
    if (btnBack) {
      btnBack.addEventListener('click', function () {
        showDashboard();
      });
    }

    // Sidebar toggle
    var sidebarToggle = $('#sidebar-toggle');
    if (sidebarToggle) {
      sidebarToggle.addEventListener('click', toggleSidebar);
    }

    // Create new
    var btnCreate = $('#btn-create-new');
    if (btnCreate) {
      btnCreate.addEventListener('click', createNewItem);
    }

    // Save
    var btnSave = $('#btn-save');
    if (btnSave) {
      btnSave.addEventListener('click', saveItem);
    }

    // Delete
    var btnDelete = $('#btn-delete');
    if (btnDelete) {
      btnDelete.addEventListener('click', deleteCurrentItem);
    }

    // Cancel
    var btnCancel = $('#btn-cancel');
    if (btnCancel) {
      btnCancel.addEventListener('click', cancelEdit);
    }

    // Add image
    var btnAddImage = $('#btn-add-image');
    if (btnAddImage) {
      btnAddImage.addEventListener('click', addNewImage);
    }

    // Tag input handlers
    TAG_FIELDS.forEach(function (field) {
      var btn = $('#btn-add-tag-' + field);
      var input = $('#tag-input-' + field);
      if (btn) {
        btn.addEventListener('click', function () { addTag(field); });
      }
      if (input) {
        input.addEventListener('keydown', function (e) {
          if (e.key === 'Enter') {
            e.preventDefault();
            addTag(field);
          }
        });
      }
    });

    // Track dirty state on form inputs (including body)
    $$('#editor-form input, #editor-form textarea').forEach(function (el) {
      el.addEventListener('input', markDirty);
    });
  }

  // Start when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
