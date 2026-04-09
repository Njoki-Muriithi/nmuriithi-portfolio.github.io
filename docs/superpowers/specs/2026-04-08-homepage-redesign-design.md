# Homepage Redesign: Full-Page Sections with Stepping Arrow

## Context

The homepage currently has a hero banner and an empty `{{ content }}` area below it. The down arrow scrolls to that empty area. The goal is to make the homepage a self-contained showcase: the landing fills the viewport, then scrolling reveals Projects and Publications sections (each at least full-viewport height), and finally a redesigned footer that serves as a "Get in Touch" destination. The down arrow becomes a section stepper that advances through each section on click.

## Summary of Changes

| File | Change |
|------|--------|
| `_layouts/home.html` | Replace `{{ content }}` block with inline Projects and Publications sections |
| `_includes/footer.html` | Redesign as "Get in Touch" section with contact CTA and socials |
| `assets/css/layout-helpers.css` | Add `.homepage-section`, `.homepage-section-header` styles |
| `assets/css/templatemo-breezed.css` | Update `.scroll-down` to fixed positioning; update `footer` styles |
| `assets/js/custom.js` | Replace static scroll target with section-stepping logic |
| `index.html` | No body content changes (front matter stays, body remains empty) |

## 1. Homepage Layout (`_layouts/home.html`)

Replace the current `<div id="portfolio-content">{{ content }}</div>` block with two new sections. Keep the hero banner as-is (already ~95vh). Change the existing `id="top"` on the `.main-banner` div to `id="hero"`. Update the one reference to `#top` in `_includes/header.html:46` (the home nav link appends `#top` to the URL) to `#hero`.

### Projects Section

```html
<section id="projects-section" class="homepage-section">
  <div class="container">
    <div class="homepage-section-header">
      <i class="fa fa-folder-open" aria-hidden="true"></i>
      <h2>Projects</h2>
    </div>
    <div class="row">
      {% assign sorted_projects = site.projects | sort: "display_order" %}
      {% for project in sorted_projects %}
      <div class="col-lg-6 col-md-6 col-12 card-spacing">
        <!-- Same card markup as projects/index.html -->
        <div class="project-card">
          <a href="{{ project.url }}">
            {% if project.images.first %}
            <img src="{{ site.baseurl }}{{ project.images.first.src }}" alt="{{ project.title }}" class="card-thumbnail" loading="lazy">
            {% else %}
            <div class="card-thumbnail-placeholder">
              <i class="fa fa-map" aria-hidden="true"></i>
            </div>
            {% endif %}
          </a>
          <div class="card-body-content">
            <span class="card-category">{{ project.categories | first }}</span>
            <h4 class="card-title">
              <a href="{{ project.url }}">{{ project.title }}</a>
            </h4>
            <p class="card-description">{{ project.description | truncate: 120 }}</p>
            {% if project.technologies %}
            <div class="tech-pills">
              {% for tech in project.technologies limit: 3 %}
              <span class="tech-pill">{{ tech }}</span>
              {% endfor %}
            </div>
            {% endif %}
            <a href="{{ project.url }}" class="card-link">View Project <i class="fa fa-arrow-right"></i></a>
          </div>
        </div>
      </div>
      {% endfor %}
    </div>
    {% if site.projects.size == 0 %}
    <div class="text-center">
      <p class="empty-state">Projects coming soon. Check back later!</p>
    </div>
    {% endif %}
  </div>
</section>
```

### Publications Section

Same structure, using `site.publications`, `publication-card` class, publication date field, and `fa-book` icon. Background alternated to `#f8f9fa`.

```html
<section id="publications-section" class="homepage-section homepage-section-alt">
  <div class="container">
    <div class="homepage-section-header">
      <i class="fa fa-book" aria-hidden="true"></i>
      <h2>Publications</h2>
    </div>
    <div class="row">
      {% assign sorted_pubs = site.publications | sort: "display_order" %}
      {% for publication in sorted_pubs %}
      <div class="col-lg-6 col-md-6 col-12 card-spacing">
        <div class="publication-card">
          {% if publication.images.first %}
          <a href="{{ publication.url }}">
            <img src="{{ site.baseurl }}{{ publication.images.first.src }}" alt="{{ publication.title }}" class="card-thumbnail" loading="lazy">
          </a>
          {% endif %}
          <div class="card-body-content">
            <span class="card-category">{{ publication.categories | first }}</span>
            <h4 class="card-title">
              <a href="{{ publication.url }}">{{ publication.title }}</a>
            </h4>
            <p class="card-description">{{ publication.description | truncate: 120 }}</p>
            <p class="card-date">
              <i class="fa fa-calendar"></i> {{ publication.date | date: "%B %Y" }}
            </p>
            <a href="{{ publication.url }}" class="card-link">Read More <i class="fa fa-arrow-right"></i></a>
          </div>
        </div>
      </div>
      {% endfor %}
    </div>
    {% if site.publications.size == 0 %}
    <div class="text-center" style="padding: 60px 0;">
      <i class="fa fa-book" style="font-size: 3rem; color: var(--color-primary); margin-bottom: 1rem;"></i>
      <h3>Publications Coming Soon</h3>
      <p class="empty-state">Research publications and articles will be shared here as they become available.</p>
    </div>
    {% endif %}
  </div>
</section>
```

### Scroll-Down Button

Change from absolute-positioned below hero to fixed at bottom center of viewport:

```html
<div class="scroll-down" id="section-stepper">
  <a href="#projects-section" aria-label="Scroll to next section">
    <i class="fa fa-arrow-down"></i>
  </a>
</div>
```

Remove the `scroll-to-section` class (the old static behavior). The `id="section-stepper"` is used by the new JS logic.

## 2. Redesigned Footer (`_includes/footer.html`)

Replace the current two-column copyright + socials layout with a centered "Get in Touch" section.

```html
<footer id="site-footer">
  <div class="container">
    <div class="footer-cta">
      <h2 class="footer-heading">Get In Touch</h2>
      <p class="footer-subheading">Want to collaborate? Have questions?</p>
      <a href="{{ site.baseurl }}/contact/" class="footer-contact-btn">Contact Me <i class="fa fa-arrow-right"></i></a>
    </div>
    <div class="footer-socials">
      <p class="footer-socials-label">Find me on</p>
      <ul class="social-icons">
        {% for social in site.data.social %}
        <li>
          <a rel="nofollow noopener noreferrer" href="{{ social.url }}" target="_blank" aria-label="{{ social.name }}">
            <i class="fa {{ social.icon }}" aria-hidden="true"></i>
          </a>
        </li>
        {% endfor %}
      </ul>
    </div>
    <div class="footer-copyright">
      <p>Copyright &copy; {{ 'now' | date: "%Y" }} {{ site.author }}</p>
    </div>
  </div>
</footer>
```

### Footer Styles (in `templatemo-breezed.css`, replacing existing footer block at lines 1403-1465)

- Dark background: `background: linear-gradient(145deg, #1a1a2e, #16213e)`
- All text white/muted white
- Centered layout, generous padding (`padding: 80px 0 40px`)
- `.footer-heading`: large, white, font-weight 700
- `.footer-subheading`: muted white (`rgba(255,255,255,0.7)`), margin-bottom
- `.footer-contact-btn`: pill button, `var(--color-primary)` background, white text, hover brightens
- `.footer-socials`: horizontal row of icon circles (keep existing 32x32 icon style but white border on dark bg)
- `.footer-socials-label`: small uppercase label above icons
- `.footer-copyright`: small, `rgba(255,255,255,0.3)`, bottom

## 3. CSS Changes

### `assets/css/layout-helpers.css` (append new classes)

```css
/* Homepage full-viewport sections */
.homepage-section {
  min-height: 100vh;
  display: flex;
  align-items: center;
  padding: 80px 0;
}

.homepage-section-alt {
  background: #f8f9fa;
}

.homepage-section-header {
  text-align: center;
  margin-bottom: 40px;
}

.homepage-section-header i {
  font-size: 2rem;
  color: var(--color-primary);
  display: block;
  margin-bottom: 10px;
}

.homepage-section-header h2 {
  font-size: var(--font-size-3xl);
  font-weight: 700;
  color: var(--color-text);
}
```

### `assets/css/templatemo-breezed.css` (modify existing)

**`.scroll-down` (lines 905-923):** Change to fixed positioning:

```css
.scroll-down {
  position: fixed;
  bottom: 30px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 100;
  transition: opacity 0.3s ease;
}

.scroll-down.hidden {
  opacity: 0;
  pointer-events: none;
}
```

Keep the existing `a` styles (60px circle, primary bg, white icon).

**`footer` (lines 1403-1465):** Replace with dark-themed centered layout as described in Section 2.

## 4. JavaScript Changes (`assets/js/custom.js`)

### Section Stepper Logic

Replace the static `href="#portfolio-content"` scroll behavior with a stepper. Add this logic (can replace or augment the existing `.scroll-to-section` click handler):

```javascript
(function() {
  var sections = ['#hero', '#projects-section', '#publications-section', '#site-footer'];
  var stepper = document.getElementById('section-stepper');
  if (!stepper) return;

  var stepperLink = stepper.querySelector('a');

  // Determine which section is currently in view
  function getCurrentSectionIndex() {
    var scrollPos = window.scrollY || window.pageYOffset;
    var headerHeight = document.querySelector('.header-area') ? document.querySelector('.header-area').offsetHeight : 80;
    for (var i = sections.length - 1; i >= 0; i--) {
      var el = document.querySelector(sections[i]);
      if (el && el.offsetTop - headerHeight - 100 <= scrollPos) {
        return i;
      }
    }
    return 0;
  }

  // Update arrow href and visibility on scroll
  function updateStepper() {
    var idx = getCurrentSectionIndex();
    var nextIdx = idx + 1;
    if (nextIdx < sections.length) {
      stepperLink.setAttribute('href', sections[nextIdx]);
      stepper.classList.remove('hidden');
    } else {
      stepper.classList.add('hidden');
    }
  }

  // Smooth scroll on click
  stepperLink.addEventListener('click', function(e) {
    e.preventDefault();
    var target = document.querySelector(stepperLink.getAttribute('href'));
    if (target) {
      var headerHeight = document.querySelector('.header-area') ? document.querySelector('.header-area').offsetHeight : 80;
      $('html, body').animate({
        scrollTop: target.offsetTop - headerHeight
      }, 700);
    }
  });

  // Throttle scroll updates with RAF
  var ticking = false;
  window.addEventListener('scroll', function() {
    if (!ticking) {
      requestAnimationFrame(function() {
        updateStepper();
        ticking = false;
      });
      ticking = true;
    }
  });

  updateStepper(); // Initial state
})();
```

### Cleanup

- Remove the old `.scroll-to-section` click handler if it only served the homepage arrow (check if other pages use it first; if shared, keep it and just skip for the stepper element)
- The existing header background-on-scroll logic (lines 8-28 of `custom.js`) remains unchanged

## 5. Verification Plan

1. **Build and serve locally:** `bundle exec jekyll serve --livereload`
2. **Visual check:**
   - Hero fills viewport, arrow visible at bottom center
   - Click arrow: smooth scroll to Projects section
   - Projects section shows full card grid with icon + title header, min 100vh
   - Click arrow again: smooth scroll to Publications section (alt background)
   - Publications section shows cards with icon + title header, min 100vh
   - Click arrow again: smooth scroll to footer
   - Arrow hides at footer
   - Scroll back up: arrow reappears
3. **Footer check:**
   - Dark background, "Get in Touch" heading, "Contact Me" button links to `/contact/`
   - Social icons display correctly
   - Copyright line at bottom
4. **Responsive check:**
   - Mobile: cards stack to single column, arrow still works, footer centered
   - Tablet: 2-column cards
5. **Existing pages unaffected:**
   - `/projects/` and `/publications/` pages still work independently
   - Navigation dropdowns still function
   - Header solid style on inner pages unchanged
6. **Run Playwright tests:** `PW_NO_SERVER=1 npx playwright test` (with server already running)
