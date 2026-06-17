# Quick Start Guide - RedSpecter Dashboard

## 🚀 Getting Started

### Prerequisites
- Node.js (v14+)
- npm or yarn

### Installation Steps

1. **Navigate to the project directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

4. **Open in browser:**
   The app will automatically open at `http://localhost:3000`

## 📂 Project Structure Explained

```
src/
├── App.jsx                 - Main application logic and state management
├── main.jsx                - React entry point
├── index.css               - Global styles with Tailwind directives
│
├── components/             - Reusable UI components
│   ├── Badge.jsx           - Status badge with color variants
│   ├── Header.jsx          - Top navigation bar
│   ├── Notification.jsx    - Toast notifications
│   └── Sidebar.jsx         - Left sidebar with navigation
│
├── pages/                  - Page components (full page views)
│   ├── Dashboard.jsx       - Main dashboard overview
│   ├── Campaigns.jsx       - Security campaigns management
│   ├── Assets.jsx          - Asset inventory
│   ├── Findings.jsx        - Security findings
│   └── Integrations.jsx    - Third-party integrations
│
├── hooks/                  - Custom React hooks
│   └── useNotification.js  - Notification management hook
│
└── utils/                  - Utility functions and constants
    └── constants.js        - Initial data and configuration
```

## 🎨 Key Features

### 1. **Responsive Design**
- Flexbox layout
- Tailwind CSS utility classes
- Dark sidebar with light main content

### 2. **Navigation**
- Click sidebar items to switch pages
- Active page highlighted in orange

### 3. **Data Management**
- State managed with React hooks
- Initial data in `constants.js`
- Easy to integrate with API

### 4. **Components**

#### Badge Component
Used for status indicators:
```jsx
<Badge color="red">High</Badge>
<Badge color="green">Completed</Badge>
<Badge color="blue">Pending</Badge>
```

#### useNotification Hook
Display toast notifications:
```jsx
const { triggerNotif } = useNotification();
triggerNotif('Campaign started successfully');
```

## 🔧 Common Customizations

### Change Colors
Edit Tailwind color classes in components. For example:
```jsx
// Change orange-500 to blue-500
className="bg-orange-500" → className="bg-blue-500"
```

### Update Initial Data
Modify `src/utils/constants.js`:
```javascript
export const INITIAL_CAMPAIGNS = [
  // Add or modify campaign data here
];
```

### Add New Page
1. Create new file in `src/pages/`
2. Import in `App.jsx`
3. Add to sidebar in `Sidebar.jsx`
4. Add switch case in `App.jsx` renderPage()

## 📦 Build & Deploy

### Development
```bash
npm run dev
```

### Production Build
```bash
npm run build
```
Creates optimized files in `dist/` folder

### Preview Production Build
```bash
npm run preview
```

## 🚀 Deploy to Vercel (Recommended)

1. Push code to GitHub
2. Connect repo to Vercel
3. Vercel auto-detects Vite and deploys
4. Environment variables can be set in Vercel dashboard

## 🐛 Troubleshooting

### Port 3000 already in use
Edit `vite.config.js`:
```javascript
server: {
  port: 3001,  // Change port number
}
```

### Missing dependencies
```bash
npm install
npm update
```

### CSS not applying
Make sure Tailwind is built correctly:
```bash
npm run dev
```

## 📱 Responsive Breakpoints

The dashboard is responsive with these Tailwind breakpoints:
- `sm`: 640px
- `md`: 768px
- `lg`: 1024px
- `xl`: 1280px
- `2xl`: 1536px

## 💡 Tips

- Use the browser DevTools to inspect components
- React Developer Tools extension helpful for debugging
- Tailwind CSS IntelliSense extension for better editor support
- Check `README.md` for detailed documentation

## 🔗 Useful Links

- [React Documentation](https://react.dev)
- [Tailwind CSS](https://tailwindcss.com)
- [Vite Documentation](https://vitejs.dev)
- [Lucide Icons](https://lucide.dev)

## ❓ Need Help?

Check these resources:
1. README.md - Detailed project documentation
2. Component files - Well-commented code
3. constants.js - All initial data in one place

---

**Happy coding! 🎉**
