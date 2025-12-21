# Join-Team-Work – Kanban Web App

Welcome to **Join-Team-Work**, a modern web-based Kanban app for efficient task management and team collaboration.

## 🔍 Project Overview

**Join-Team-Work** is a task-oriented project management application inspired by the Kanban principle. Users can create tasks, move them between status columns (e.g., "To Do", "In Progress", "Done"), and collaborate with team members. The project was developed as a group exercise and is designed to be user-friendly, responsive, and functional on both desktop and mobile devices.

## 💡 Features

- Create, edit, and delete tasks
- Drag-and-drop for changing task status
- Assign tasks to team members
- Upload profile pictures (PNG/JPG) for contacts with image viewer
- Categories and priorities for tasks
- Search and filter functionality
- Responsive design for desktop & mobile
- Local storage or backend integration (Firebase)

## 🛠️ Tech Stack

- **HTML5**, **CSS3**, **JavaScript (ES6+)**
- **Frontend:** Vanilla JS (no framework)
- **Storage:** LocalStorage and/or Firebase backend
- **Deployment:** GitHub Pages (optional)

## 🚀 Getting Started

### 1. Clone the project

```bash
git clone https://github.com/<your-username>/Join-Team-Work.git
cd Join-Team-Work
```

### 2. Open in your browser

You can open `index.html` directly in your browser, or use a local server for development.

### 3. Project Structure

- `index.html`, `main.js` – Entry point and main logic
- `html/` – App pages (board, summary, contacts, help, legal notice, privacy policy, etc.)
- `js/` – JavaScript modules (events, pages, templates, ui, utils, data)
  - `js/vendor/` – External libraries (not part of our codebase)
- `styles/` – CSS files for layout and components
- `assets/` – Fonts, icons, images
- `json/` – Data files for testing and reset functionality

### 4. Usage

1. Log in or sign up to start using the app
2. Create new tasks and assign them to team members
3. Move tasks between columns using drag-and-drop
4. Use the search bar to filter tasks
5. View summary metrics and deadlines on the summary page
6. Manage contacts for collaboration

### 5. Development & Customization

- All logic is written in modular JavaScript files under `js/`
- Customize styles in the `styles/` folder
- Backend integration is handled via Firebase (see `js/data/task-to-firbase.js`)

### 6. External Libraries

This project uses the following external libraries (located in `js/vendor/`):

- **Viewer.js v1.11.7** – Image viewer for contact avatars and task attachments
  - Source: https://fengyuanchen.github.io/viewerjs
  - License: MIT
  - Files: `js/vendor/viewer.js` and `styles/viewer.css`

### 7. Sample Data & Reset

To reset the app to default state with sample data:

- **Location:** `json/total/TOTAL-RESET.json`
- **Contains:** Sample tasks, contacts, and board configuration
- **Usage:** Use Firebase import or local storage reset functionality

## 📄 License & Credits

This project was developed as part of a group exercise at Developer Akademie GmbH. See `legal-notice.html` for details.

## 📬 Contact

For questions or feedback, contact the team at [info@birich.it](mailto:info@birich.it).
