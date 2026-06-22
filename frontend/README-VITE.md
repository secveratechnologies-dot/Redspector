# RedSpecter - Security Dashboard

A modern, fully-featured security and compliance scanning dashboard built with React, Tailwind CSS, and Lucide icons.

## Features

- **Dashboard**: Overview of active campaigns, findings, risk scores, and system health
- **Campaigns**: Manage autonomous security scanning campaigns with progress tracking
- **Assets**: Track and manage security assets across your infrastructure
- **Findings**: View and manage security findings with severity levels
- **Integrations**: Connect external security and monitoring tools
- **Real-time Notifications**: Toast notifications for user actions

## Project Structure

```
frontend/
├── public/
│   └── index.html                 # Main HTML file
├── src/
│   ├── components/
│   │   ├── Badge.jsx              # Reusable badge component
│   │   ├── Header.jsx             # Top navigation header
│   │   ├── Notification.jsx       # Toast notification component
│   │   └── Sidebar.jsx            # Left sidebar navigation
│   ├── pages/
│   │   ├── Dashboard.jsx          # Dashboard page
│   │   ├── Campaigns.jsx          # Campaigns management page
│   │   ├── Assets.jsx             # Assets inventory page
│   │   ├── Findings.jsx           # Security findings page
│   │   └── Integrations.jsx       # Third-party integrations page
│   ├── hooks/
│   │   └── useNotification.js     # Custom hook for notifications
│   ├── utils/
│   │   └── constants.js           # App constants and initial data
│   ├── App.jsx                    # Main application component
│   ├── main.jsx                   # React entry point
│   └── index.css                  # Global styles with Tailwind
├── package.json                   # Project dependencies
├── vite.config.js                 # Vite configuration
├── tailwind.config.js             # Tailwind CSS configuration
├── postcss.config.js              # PostCSS configuration
├── .gitignore                     # Git ignore rules
└── README.md                      # This file
```

## Installation

1. Install dependencies:
```bash
npm install
```

## Development

Start the development server:
```bash
npm run dev
```

The application will open at `http://localhost:3000` in your browser.

## Build

Build for production:
```bash
npm run build
```

Preview production build:
```bash
npm run preview
```

## Tech Stack

- **React 18.2**: UI library
- **Vite 4.4**: Build tool and dev server
- **Tailwind CSS 3.3**: Utility-first CSS framework
- **Lucide React 0.263**: Beautiful icon library
- **PostCSS 8**: CSS processing tool

## Component Overview

### Sidebar (`src/components/Sidebar.jsx`)
Navigation component with RedSpecter branding and menu items for different sections.

### Header (`src/components/Header.jsx`)
Top bar with search, notifications, and user profile avatar.

### Badge (`src/components/Badge.jsx`)
Reusable badge component for status indicators with color variants (green, red, blue).

### Notification (`src/components/Notification.jsx`)
Toast notification that appears at bottom-right corner of the screen.

### Pages

- **Dashboard**: Stats overview and critical recent activity
- **Campaigns**: Table of security scanning campaigns with status and progress
- **Assets**: Asset inventory with risk levels
- **Findings**: Security findings with severity and status
- **Integrations**: Connected external services

## Hooks

### useNotification
Custom hook for managing notification state:
```javascript
const { showNotification, notifMessage, triggerNotif } = useNotification();
triggerNotif('Your message here');
```

## Customization

### Adding New Pages

1. Create a new component in `src/pages/`
2. Import it in `src/App.jsx`
3. Add a case to the `renderPage()` switch statement
4. Update `SIDEBAR_ITEMS` in `src/utils/constants.js`

### Modifying Colors

Edit Tailwind classes in components or update `tailwind.config.js` for theme customization.

### Updating Initial Data

Modify the data in `src/utils/constants.js`:
- `INITIAL_CAMPAIGNS`
- `INITIAL_ASSETS`
- `INITIAL_FINDINGS`

## License

MIT
