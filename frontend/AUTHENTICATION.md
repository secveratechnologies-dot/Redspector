# Authentication Guide - RedSpecter Dashboard

## 🔐 Authentication Features

The dashboard now includes a complete authentication system with Login and Signup pages.

### Features

✅ **Login Page**
- Email and password validation
- Remember me checkbox
- Forgot password link
- Demo credentials display
- Error messaging with validation feedback
- Loading state on form submission

✅ **Signup Page**
- Full name input
- Email and company name
- Password confirmation
- Terms of Service acceptance
- Form validation
- Feature highlights showcase
- Smooth transitions between Login/Signup

✅ **Session Management**
- User data persistence with localStorage
- Automatic session recovery on page refresh
- Logout with session clearing
- Protected dashboard access

✅ **User Header**
- Display user name and company
- User avatar with initial
- Logout button
- Clean, professional UI

## 📁 New Files Created

```
src/
├── pages/
│   ├── Login.jsx              # Login form component
│   └── Signup.jsx             # Signup form component
├── hooks/
│   └── useAuth.js             # Authentication state management hook
└── layouts/
    └── AuthLayout.jsx         # Dashboard layout with user menu
```

## 🔄 Updated Files

- `src/App.jsx` - Added authentication flow and conditional rendering
- `src/App.jsx` - Integrated useAuth hook for session management

## 🎯 Authentication Flow

### Initial Load
1. App checks localStorage for stored user session
2. If user found → Load dashboard
3. If no user → Load login page

### Login Flow
```
User enters email/password
         ↓
Form validation
         ↓
Simulate API call (1.5s delay)
         ↓
Store user data in state & localStorage
         ↓
Redirect to dashboard
         ↓
Show welcome notification
```

### Signup Flow
```
User enters registration details
         ↓
Form validation (name, email, company, passwords)
         ↓
Check password confirmation match
         ↓
Check terms acceptance
         ↓
Simulate API call (1.5s delay)
         ↓
Store user data in state & localStorage
         ↓
Redirect to dashboard
         ↓
Show welcome notification
```

### Logout Flow
```
User clicks Logout button
         ↓
Clear user data from state
         ↓
Clear localStorage
         ↓
Redirect to login page
         ↓
Show logout confirmation
```

## 🔑 Demo Credentials

```
Email:    demo@redspecter.com
Password: demo123
```

These credentials are displayed on the login page for testing purposes.

## 📝 useAuth Hook

The custom `useAuth` hook manages all authentication logic:

```javascript
const { user, isAuthenticated, login, signup, logout, checkAuth } = useAuth();
```

### Hook Methods

- **`login(userData)`** - Authenticate user and store session
- **`signup(userData)`** - Create new user account
- **`logout()`** - Clear session and redirect to login
- **`checkAuth()`** - Check for existing session on app load

### Hook State

- **`user`** - Current user object with name, email, company, role
- **`isAuthenticated`** - Boolean indicating authentication status
- **`loading`** - Boolean for async operations

## 🎨 Form Validation

### Login Validation
- ✓ Email is required
- ✓ Valid email format
- ✓ Password is required
- ✓ Password minimum 6 characters

### Signup Validation
- ✓ Full name is required
- ✓ Email is required
- ✓ Valid email format
- ✓ Company name is required
- ✓ Password is required
- ✓ Password minimum 6 characters
- ✓ Passwords must match
- ✓ Terms must be accepted

## 💾 Data Persistence

User data is stored in localStorage with key `user`:

```json
{
  "email": "john.smith@techcorp.com",
  "fullName": "John Smith",
  "companyName": "TechCorp Security",
  "role": "admin"
}
```

This allows users to remain logged in even after page refresh.

## 🎯 AuthLayout Component

The `AuthLayout` component wraps the dashboard and provides:

- Professional header with user info
- Dropdown user menu with logout
- User avatar with initial
- Responsive design
- Consistent styling with dashboard

## 🚀 Integration with API

To connect to a real backend API:

1. **Login** - Replace mock API call in `Login.jsx`:
```javascript
// Replace this:
setTimeout(() => {
  setLoading(false);
  onLoginSuccess({ email, role: 'admin' });
}, 1500);

// With this:
const response = await fetch('/api/login', {
  method: 'POST',
  body: JSON.stringify({ email, password })
});
const userData = await response.json();
onLoginSuccess(userData);
```

2. **Signup** - Replace mock API call in `Signup.jsx`:
```javascript
const response = await fetch('/api/signup', {
  method: 'POST',
  body: JSON.stringify(formData)
});
const userData = await response.json();
onSignupSuccess(userData);
```

3. **Update useAuth** - Add real API calls for session validation

## 🔒 Security Notes

- **Current Setup**: Demo/client-side authentication for testing
- **Production**: Implement server-side authentication with:
  - JWT tokens
  - Secure cookies
  - Password hashing
  - CORS configuration
  - Rate limiting on auth endpoints

## 📱 Responsive Design

Both login and signup pages are fully responsive:
- Mobile-first design
- Adjusts gracefully to all screen sizes
- Touch-friendly buttons and inputs
- Readable on all devices

## 🎨 Styling

All auth pages use:
- Dark gradient background (`from-slate-900 via-slate-800 to-slate-900`)
- Orange accent color for CTAs
- Glass-morphism effects with backdrop blur
- Smooth transitions and hover states
- Consistent with dashboard branding

## 🔧 Customization

### Change Colors
Edit Tailwind classes in auth page files:
- `orange-500` → Your primary color
- `slate-900` → Your background color
- `gradient-to-br` → Your gradient direction

### Add OAuth
- Google OAuth
- GitHub OAuth
- Azure AD
- Custom SSO

### Add Password Reset
- Email verification flow
- Reset token generation
- New password confirmation

### Add 2FA
- SMS verification
- Authenticator app
- Email OTP

## 📚 Related Documentation

- [README.md](./README.md) - Project overview
- [QUICKSTART.md](./QUICKSTART.md) - Getting started guide
- [Tailwind CSS](https://tailwindcss.com) - Styling framework
- [React Documentation](https://react.dev) - React concepts

## 🐛 Troubleshooting

### Session not persisting
- Check if localStorage is enabled in browser
- Clear browser cache and try again
- Check browser console for errors

### Form validation not working
- Verify input names match in formData state
- Check console for validation error messages
- Test with valid data format

### CSS not applying
- Clear Tailwind cache: `rm -rf .next/`
- Restart dev server: `npm run dev`
- Check tailwind.config.js paths

## 📞 Support

For issues or questions:
1. Check the troubleshooting section above
2. Review the component code comments
3. Check browser console for error messages
4. Verify all dependencies are installed: `npm install`

---

**Happy Securing! 🛡️**
