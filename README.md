# Njoki Muriithi Portfolio

A Jekyll-based portfolio website showcasing projects and publications. Built for GitHub Pages with a focus on clean design, accessibility, and easy content management.

## Getting Started

### Prerequisites

- **Ruby** (version 2.7 or higher)
  - Download from [rubyinstaller.org](https://rubyinstaller.org/) (use Ruby+Devkit version for Windows)
  - Make sure to select "Add Ruby to PATH" during installation
- **Bundler** (install after Ruby is set up)

### Installation

1. Clone this repository:
   ```bash
   git clone https://github.com/Njoki-Muriithi/nmuriithi-portfolio.github.io.git
   cd nmuriithi-portfolio.github.io
   ```

2. Install dependencies:
   ```bash
   bundle install
   ```

### Running Locally

Start the development server:
```bash
bundle exec jekyll serve
```

Your site will be available at:
```
http://localhost:4000/nmuriithi-portfolio.github.io
```

The site will automatically rebuild when you make changes to files.

### Other Useful Commands

- **Build the site** (generates static files in `_site/`):
  ```bash
  bundle exec jekyll build
  ```

- **Clean build files:**
  ```bash
  bundle exec jekyll clean
  ```

## Adding New Content

### Adding a New Project

1. Create a new Markdown file in the `_projects/` folder:
   ```
   _projects/my-new-project.md
   ```

2. Add the front matter and content:
   ```yaml
   ---
   menu_label: "Project 1"  # Short name for navigation menu
   title: "Project Title"
   description: "A brief description of your project that will appear on the projects listing page."
   date: April 2024 - May 2025
   categories:
     - Category 1
     - Category 2
     - Category 3
   technologies:
     - Technology 1
     - Technology 2
     - Technology 3
   demo_url: "https://your-demo-link.com"  # or "#" if no demo
   github_url: "https://github.com/username/repo"  # or "#" if no repo
   images:
     - src: "/assets/images/project-folder/image1.jpg"
       alt: "Image description"
       title: "Image Title"
       caption: "Caption text that appears on the image"
     - src: "/assets/images/project-folder/image2.jpg"
       alt: "Image description"
       title: "Image Title"
       caption: "Caption text"
   ---

   Your project content goes here. You can use Markdown formatting.
   ```

3. Add your project images to the `assets/images/` folder (create a subfolder for your project)

4. The project will automatically appear on the projects page at `/projects/`

### Adding a New Publication

1. Create a new Markdown file in the `_publications/` folder:
   ```
   _publications/my-publication.md
   ```

2. Add the front matter and content:
   ```yaml
   ---
   menu_label: "Publication 1"  # Short name for navigation menu
   title: "Publication Title"
   description: "A brief description of your publication."
   date: 2024-02-10
   categories:
     - Research
     - Academic
   technologies:
     - Python
     - R
     - MATLAB
   demo_url: "https://link-to-paper.com"  # or "#"
   github_url: "https://github.com/username/research-repo"  # or "#"
   images:
     - src: "/assets/images/publication-folder/figure1.jpg"
       alt: "Figure description"
       title: "Figure Title"
       caption: "Figure caption"
   ---

   ## Abstract

   Your abstract here...

   ## Key Findings

   - Finding 1
   - Finding 2
   ```

3. Add any figures or images to the `assets/images/` folder

4. The publication will automatically appear on the publications page

## Automatic Navigation Menus

The navigation menu automatically updates when you add new projects or publications. Each item appears in the dropdown menu using its `menu_label` field.

### How It Works

- **Projects Menu**: Automatically populated from all files in `_projects/` folder
- **Publications Menu**: Automatically populated from all files in `_publications/` folder
- **Menu Label**: Uses the `menu_label` front matter field (falls back to `title` if not set)

### Benefits

- No need to manually update `_data/navigation.yml` when adding content
- Consistent navigation structure
- Menu items are automatically linked to the correct pages

**Example**: When you add a new project file `_projects/my-project.md` with `menu_label: "Project 3"`, it will automatically appear in the Projects dropdown menu.

## Project Structure

```
.
├── _config.yml           # Site configuration
├── _includes/            # Reusable HTML components
├── _layouts/             # Page templates
│   ├── default.html      # Base layout
│   ├── page.html         # Standard page layout
│   └── project.html      # Project/publication layout
├── _projects/            # Project markdown files
├── _publications/        # Publication markdown files
├── assets/
│   ├── css/              # Stylesheets
│   ├── js/               # JavaScript files
│   └── images/           # Image assets
├── projects/
│   └── index.html        # Projects listing page
├── publications/
│   └── index.html        # Publications listing page
└── index.html            # Homepage
```

## Front Matter Fields Explained

### Required Fields
- `title`: The title of your project/publication
- `description`: Brief summary (appears in listing pages)
- `date`: Project date or date range

### Optional Fields
- `menu_label`: Short name displayed in navigation menu (falls back to `title` if not provided)
- `categories`: Array of category tags (used for filtering)
- `technologies`: Array of technologies used
- `demo_url`: Link to live demo or publication
- `github_url`: Link to GitHub repository
- `images`: Array of image objects with `src`, `alt`, `title`, and `caption`

## Site Configuration

Edit `_config.yml` to update:
- Site title and description
- Author information
- Email address
- Base URL and site URL
- Navigation and other settings

## Deployment

This site is configured for GitHub Pages. To deploy:

1. Push your changes to the `main` branch:
   ```bash
   git add .
   git commit -m "Your commit message"
   git push origin main
   ```

2. Your site will be automatically built and deployed to:
   ```
   https://njoki-muriithi.github.io/nmuriithi-portfolio.github.io
   ```

## Features

- Responsive design (mobile-friendly)
- Automatic navigation menu generation from projects and publications
- Image galleries with captions
- Category-based organization
- Technology tags
- Accessibility features (ARIA labels, keyboard navigation)
- SEO optimization (via jekyll-seo-tag)
- Sitemap generation (via jekyll-sitemap)

## Technologies

- Jekyll 4.3
- Bootstrap (grid system)
- Font Awesome (icons)
- Liquid (templating)
- SCSS/CSS
- JavaScript (ES6)

## License

This is a personal portfolio website. All content is © Njoki Muriithi.

## Contact

For questions or collaboration opportunities, reach out at [njokimuriithi@alumni.trentu.ca](mailto:njokimuriithi@alumni.trentu.ca)
