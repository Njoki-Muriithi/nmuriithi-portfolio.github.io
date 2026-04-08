/**
 * Supabase Client - Authentication & GitHub Content Management
 * Uses Supabase for GitHub OAuth, GitHub API for content CRUD.
 */

(function () {
  'use strict';

  // ─── Configuration ───────────────────────────────────────────────
  const SUPABASE_URL = window.__SUPABASE_URL__ || '';
  const SUPABASE_ANON_KEY = window.__SUPABASE_ANON_KEY__ || '';
  const ADMIN_REDIRECT_URL = window.__ADMIN_REDIRECT_URL__ || '';
  const GITHUB_OWNER = window.__GITHUB_OWNER__ || '';
  const GITHUB_REPO = window.__GITHUB_REPO__ || '';
  const GITHUB_BRANCH = window.__GITHUB_BRANCH__ || 'main';

  // Dev bypass: skip Supabase entirely when running locally with a PAT
  const DEV_BYPASS = !!(window.__DEV_BYPASS__ && window.__GITHUB_PAT__);

  let supabase = null;
  if (!DEV_BYPASS) {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      console.error('Supabase URL or anon key not configured. Check _config.yml.');
      return;
    }
    supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }

  // ─── State ───────────────────────────────────────────────────────
  const state = {
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
    const toast = $('#toast');
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
    if (window.__DEV_BYPASS__) {
      state.user = null;
      switchView('login');
      return Promise.resolve();
    }
    return supabase.auth.signOut();
  }

  function checkSession() {
    return supabase.auth.getSession();
  }

  function getGitHubToken() {
    return state.providerToken || localStorage.getItem('github_provider_token') || '';
  }

  // ─── GitHub API Functions ────────────────────────────────────────

  const GITHUB_API = 'https://api.github.com';

  function githubFetch(path, options) {
    const token = getGitHubToken();
    if (!token) {
      return Promise.reject(new Error('No GitHub token available. Please log in again.'));
    }
    const url = GITHUB_API + '/repos/' + GITHUB_OWNER + '/' + GITHUB_REPO + path;
    const defaults = {
      headers: {
        'Authorization': 'token ' + token,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
      }
    };
    const merged = Object.assign({}, defaults, options || {});
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
    const dirPath = '_' + collection;
    return githubFetch('/contents/' + dirPath + '?ref=' + GITHUB_BRANCH);
  }

  /** Get a single file's content and SHA */
  function getFile(collection, filename) {
    const filePath = '_' + collection + '/' + filename;
    return githubFetch('/contents/' + filePath + '?ref=' + GITHUB_BRANCH);
  }

  /** Create or update a file */
  function putFile(collection, filename, content, sha) {
    const filePath = '_' + collection + '/' + filename;
    const body = {
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
    const filePath = '_' + collection + '/' + filename;
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
    const match = rawContent.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
    if (!match) {
      return { frontMatter: {}, body: rawContent };
    }
    let fm;
    try {
      fm = window.jsyaml.load(match[1], { json: true }) || {};
    } catch (e) {
      console.warn('YAML parse warning:', e.message);
      fm = {};
    }
    return { frontMatter: fm, body: match[2] || '' };
  }

  /** Generate a markdown file from front matter object and body string */
  function generateMarkdown(frontMatter, body) {
    const yaml = window.jsyaml.dump(frontMatter, {
      lineWidth: -1,
      quotingType: '"',
      forceQuotes: false
    });
    let result = '---\n' + yaml + '---\n';
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

    const nav = $('#admin-nav');
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
    loadDashboardData();
  }

  // ─── Dashboard Data ───────────────────────────────────────────────

  async function fetchCollectionItems(collection) {
    try {
      const files = await listFiles(collection);
      const mdFiles = files.filter(function (f) { return f.name.endsWith('.md'); });
      const items = [];
      for (let i = 0; i < mdFiles.length; i++) {
        try {
          const fileData = await getFile(collection, mdFiles[i].name);
          const raw = decodeURIComponent(escape(atob(fileData.content.replace(/\n/g, ''))));
          const parsed = parseMarkdown(raw);
          items.push(Object.assign({}, parsed.frontMatter, {
            _filename: mdFiles[i].name,
            _collection: collection,
            _sha: fileData.sha
          }));
        } catch (e) {
          console.error('Error parsing ' + collection + '/' + mdFiles[i].name, e);
        }
      }
      return items;
    } catch (err) {
      console.error('Failed to list ' + collection, err);
      return [];
    }
  }

  function detectHealthIssues(items) {
    const issues = [];
    items.forEach(function (item) {
      const label = item.menu_label || item.title || item._filename;
      const collection = item._collection;

      if (!item.images || item.images.length === 0) {
        issues.push({ item: item, label: label, collection: collection, message: 'No images' });
      }
      if (item.demo_url === '#' || item.demo_url === '') {
        issues.push({ item: item, label: label, collection: collection, message: 'Placeholder demo URL' });
      }
      if (item.github_url === '#' || item.github_url === '') {
        issues.push({ item: item, label: label, collection: collection, message: 'Placeholder GitHub URL' });
      }
      if (!item.description || !item.description.trim()) {
        issues.push({ item: item, label: label, collection: collection, message: 'Missing description' });
      }
    });
    return issues;
  }

  async function fetchRecentCommits() {
    try {
      const commits = await githubFetch('/commits?sha=' + GITHUB_BRANCH + '&per_page=20');
      const edited = [];
      const seen = {};

      for (let i = 0; i < commits.length; i++) {
        const commit = commits[i];
        const message = commit.commit.message || '';
        // Match commit messages from the admin (e.g. "Update project: file.md" or "Create publication: file.md")
        const match = message.match(/^(Update|Create|Delete)\s+(project|publication):\s+(.+\.md)$/i);
        if (match && !seen[match[3]]) {
          seen[match[3]] = true;
          const collection = match[2].toLowerCase() === 'project' ? 'projects' : 'publications';
          edited.push({
            filename: match[3],
            collection: collection,
            date: new Date(commit.commit.committer.date),
            action: match[1]
          });
          if (edited.length >= 5) break;
        }
      }
      return edited;
    } catch (err) {
      console.error('Failed to fetch recent commits', err);
      return [];
    }
  }

  async function loadDashboardData() {
    // Fetch projects and publications in parallel
    const projectsPromise = fetchCollectionItems('projects');
    const publicationsPromise = fetchCollectionItems('publications');
    const recentPromise = fetchRecentCommits();

    const projects = await projectsPromise;
    const publications = await publicationsPromise;
    const recentEdits = await recentPromise;

    // Update counts
    const statProjects = $('#stat-projects');
    const statPubs = $('#stat-publications');
    if (statProjects) statProjects.textContent = projects.length;
    if (statPubs) statPubs.textContent = publications.length;

    // Health warnings
    const allItems = projects.concat(publications);
    const issues = detectHealthIssues(allItems);
    const healthEl = $('#health-warnings');
    if (healthEl) {
      if (issues.length === 0) {
        healthEl.innerHTML = '<div class="health-all-good">All content looks good!</div>';
      } else {
        let html = '';
        issues.forEach(function (issue) {
          html += '<div class="health-item">' +
            '<span class="health-icon">!</span>' +
            '<span class="health-item-text">' +
              '<a href="#" class="health-link" data-collection="' + escapeAttr(issue.collection) + '" data-filename="' + escapeAttr(issue.item._filename) + '">' +
                escapeHtml(issue.label) +
              '</a> — ' + escapeHtml(issue.message) +
            '</span>' +
          '</div>';
        });
        healthEl.innerHTML = html;

        // Bind click-to-edit on health links
        healthEl.querySelectorAll('.health-link').forEach(function (link) {
          link.addEventListener('click', function (e) {
            e.preventDefault();
            openCollection(link.dataset.collection).then(function () {
              const target = state.items.find(function (it) { return it._filename === link.dataset.filename; });
              if (target) selectItem(target);
            });
          });
        });
      }
    }

    // Recent edits
    const recentEl = $('#recent-edits');
    if (recentEl) {
      if (recentEdits.length === 0) {
        recentEl.innerHTML = '<p style="color: var(--admin-text-muted); font-size: 14px; text-align: center; padding: 16px 0;">No recent edits found.</p>';
      } else {
        let html = '';
        recentEdits.forEach(function (edit) {
          const dateStr = edit.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
          const displayName = edit.filename.replace('.md', '').replace(/-/g, ' ');
          html += '<div class="recent-item" data-collection="' + escapeAttr(edit.collection) + '" data-filename="' + escapeAttr(edit.filename) + '">' +
            '<div>' +
              '<span class="recent-item-name">' + escapeHtml(displayName) + '</span><br>' +
              '<span class="recent-item-collection">' + escapeHtml(edit.collection) + '</span>' +
            '</div>' +
            '<span class="recent-item-date">' + escapeHtml(dateStr) + '</span>' +
          '</div>';
        });
        recentEl.innerHTML = html;

        // Bind click-to-edit on recent items
        recentEl.querySelectorAll('.recent-item').forEach(function (item) {
          item.addEventListener('click', function () {
            openCollection(item.dataset.collection).then(function () {
              const target = state.items.find(function (it) { return it._filename === item.dataset.filename; });
              if (target) selectItem(target);
            });
          });
        });
      }
    }
  }

  // ─── Sidebar ─────────────────────────────────────────────────────

  function renderSidebar() {
    const list = $('#sidebar-list');
    if (!list) return;
    list.innerHTML = '';

    state.items.forEach(function (item) {
      const li = document.createElement('li');
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
    const sidebar = $('#editor-sidebar');
    const main = $('#editor-main');
    const toggle = $('#sidebar-toggle');
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

  const TAG_FIELDS = ['categories', 'technologies'];

  function getFormData() {
    const data = {};
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

    const bodyField = $('#field-body');
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
    const container = $('#tags-' + field);
    if (!container) return;
    container.innerHTML = '';
    (values || []).forEach(function (val) {
      addTagElement(container, field, val);
    });
  }

  function addTagElement(container, field, value) {
    const tag = document.createElement('span');
    tag.className = 'tag';
    tag.innerHTML = '<span class="tag-text">' + escapeHtml(value) + '</span><button type="button" class="tag-remove" aria-label="Remove ' + escapeHtml(value) + '">&times;</button>';
    tag.querySelector('.tag-remove').addEventListener('click', function () {
      tag.remove();
      markDirty();
    });
    container.appendChild(tag);
  }

  function addTag(field) {
    const input = $('#tag-input-' + field);
    if (!input) return;
    const val = input.value.trim();
    if (!val) return;
    const container = $('#tags-' + field);
    addTagElement(container, field, val);
    input.value = '';
    markDirty();
  }

  function getTagValues(field) {
    const container = $('#tags-' + field);
    if (!container) return [];
    const tags = container.querySelectorAll('.tag-text');
    const values = [];
    tags.forEach(function (t) { values.push(t.textContent); });
    return values;
  }

  // ─── Images Array ────────────────────────────────────────────────

  function renderImages(images) {
    const container = $('#images-list');
    if (!container) return;
    container.innerHTML = '';
    (images || []).forEach(function (img, idx) {
      addImageEntry(container, img, idx);
    });
  }

  function addImageEntry(container, img, idx) {
    const div = document.createElement('div');
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
    const container = $('#images-list');
    if (!container) return;
    addImageEntry(container, null);
    markDirty();
  }

  function renumberImages() {
    const entries = $$('#images-list .image-entry');
    entries.forEach(function (entry, i) {
      entry.querySelector('strong').textContent = 'Image ' + (i + 1);
    });
  }

  function getImagesData() {
    const entries = $$('#images-list .image-entry');
    const images = [];
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
    const current = JSON.stringify(getFormData()) + '|||' + getBodyContent();
    state.isDirty = current !== state.savedSnapshot;
    updateActionButtons();
  }

  function updateActionButtons() {
    const btnDelete = $('#btn-delete');
    const btnCancel = $('#btn-cancel');
    const btnSave = $('#btn-save');

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
    const formData = getFormData();
    const body = getBodyContent();
    const collection = state.currentCollection;

    if (!formData.title) {
      showToast('Title is required.', 'error');
      return;
    }

    // Build front matter object (exclude internal fields)
    const frontMatter = Object.assign({}, formData);

    // Generate filename
    let filename;
    if (state.isNewItem) {
      filename = slugify(formData.title || 'untitled') + '.md';
    } else {
      filename = state.selectedItem._filename;
    }

    const content = generateMarkdown(frontMatter, body);
    const sha = state.isNewItem ? null : state.selectedItem._sha;

    try {
      const result = await putFile(collection, filename, content, sha);

      showToast('Saved successfully!', 'success');

      // Update state with new SHA and filename
      const savedItem = Object.assign({}, formData, {
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
      const files = await listFiles(state.currentCollection);
      // Filter to .md files only
      const mdFiles = files.filter(function (f) { return f.name.endsWith('.md'); });

      // Fetch and parse each file
      const items = [];
      for (let i = 0; i < mdFiles.length; i++) {
        try {
          const fileData = await getFile(state.currentCollection, mdFiles[i].name);
          const raw = decodeURIComponent(escape(atob(fileData.content.replace(/\n/g, ''))));
          const parsed = parseMarkdown(raw);
          const item = Object.assign({}, parsed.frontMatter, {
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

    const heading = $('#editor-heading');
    if (heading) heading.textContent = collection === 'projects' ? 'Projects' : 'Publications';

    $$('.nav-collection').forEach(function (el) {
      el.classList.toggle('active', el.dataset.collection === collection);
    });

    switchView('editor');
    await refreshSidebar();
  }

  // ─── Utility ─────────────────────────────────────────────────────

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.appendChild(document.createTextNode(str || ''));
    return div.innerHTML;
  }

  function escapeAttr(str) {
    return (str || '').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  // ─── Init ────────────────────────────────────────────────────────

  async function init() {
    // Check for error in URL hash (e.g. expired token)
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const hashError = hashParams.get('error_description');
    if (hashError) {
      showToast(hashError, 'error');
      history.replaceState(null, '', window.location.pathname);
    }

    if (DEV_BYPASS) {
      // Dev bypass: skip Supabase auth when running locally with a PAT
      state.user = { email: 'dev@localhost' };
      state.providerToken = window.__GITHUB_PAT__;
      localStorage.setItem('github_provider_token', window.__GITHUB_PAT__);
      showDashboard();
    } else {
      // Check for existing session
      const sessionResult = await checkSession();
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
    }

    // ─── Event Bindings ────────────────────────────────────────────

    // GitHub OAuth login
    const btnGitHub = $('#btn-github-login');
    if (btnGitHub) {
      btnGitHub.addEventListener('click', async function () {
        btnGitHub.disabled = true;
        btnGitHub.textContent = 'Redirecting...';
        const result = await loginWithGitHub();
        if (result.error) {
          showToast('Login error: ' + result.error.message, 'error');
          btnGitHub.disabled = false;
          btnGitHub.textContent = 'Sign in with GitHub';
        }
      });
    }

    // Logout
    const btnLogout = $('#btn-logout');
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
    const btnBack = $('#btn-back-dashboard');
    if (btnBack) {
      btnBack.addEventListener('click', function () {
        showDashboard();
      });
    }

    // Sidebar toggle
    const sidebarToggle = $('#sidebar-toggle');
    if (sidebarToggle) {
      sidebarToggle.addEventListener('click', toggleSidebar);
    }

    // Create new
    const btnCreate = $('#btn-create-new');
    if (btnCreate) {
      btnCreate.addEventListener('click', createNewItem);
    }

    // Save
    const btnSave = $('#btn-save');
    if (btnSave) {
      btnSave.addEventListener('click', saveItem);
    }

    // Delete
    const btnDelete = $('#btn-delete');
    if (btnDelete) {
      btnDelete.addEventListener('click', deleteCurrentItem);
    }

    // Cancel
    const btnCancel = $('#btn-cancel');
    if (btnCancel) {
      btnCancel.addEventListener('click', cancelEdit);
    }

    // Add image
    const btnAddImage = $('#btn-add-image');
    if (btnAddImage) {
      btnAddImage.addEventListener('click', addNewImage);
    }

    // Tag input handlers
    TAG_FIELDS.forEach(function (field) {
      const btn = $('#btn-add-tag-' + field);
      const input = $('#tag-input-' + field);
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

    // Prevent form submission (replaces inline onsubmit)
    const editorForm = $('#editor-form');
    if (editorForm) {
      editorForm.addEventListener('submit', function (e) { e.preventDefault(); });
    }

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
