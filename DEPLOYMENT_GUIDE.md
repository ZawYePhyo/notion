# DZN-Timme Firebase Deployment Guide

Follow these steps to deploy your app to Firebase Hosting and get a public URL.

---

## Step 1: Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **"Add project"** or **"Create a project"**
3. Enter project name: `dzn-timme` (or any name you prefer)
4. Follow the setup wizard:
   - Enable Google Analytics (optional)
   - Choose your Google account
5. Click **"Create project"**
6. Wait for project creation to complete

---

## Step 2: Login to Firebase CLI

Open your terminal in this directory and run:

```bash
firebase login
```

This will:
- Open a browser window
- Ask you to sign in with your Google account
- Grant Firebase CLI access to your account

**Note:** If you're in a remote environment without a browser, use:
```bash
firebase login --no-localhost
```

---

## Step 3: Initialize Firebase in Your Project

Run this command in the project root:

```bash
firebase init
```

You'll see an interactive prompt. Select the following:

### 3a. Select Features
Use spacebar to select, enter to confirm:
- ✅ **Firestore** (Database rules and indexes)
- ✅ **Functions** (Cloud Functions for backend)
- ✅ **Hosting** (Web app hosting)
- ✅ **Storage** (File storage rules)

Press Enter to continue.

### 3b. Associate with Firebase Project
- Choose: **"Use an existing project"**
- Select the project you created in Step 1

### 3c. Firestore Setup
- **Firestore rules file**: Press Enter (use default: `firestore.rules`)
- **Firestore indexes file**: Press Enter (use default: `firestore.indexes.json`)

### 3d. Functions Setup
- **Language**: Select **TypeScript**
- **ESLint**: Choose **No** (we already have it)
- **Install dependencies**: Choose **Yes**

### 3e. Hosting Setup
- **Public directory**: Type `dist` and press Enter
- **Configure as single-page app**: Choose **Yes**
- **Set up automatic builds with GitHub**: Choose **No**
- **Overwrite index.html**: Choose **No**

### 3f. Storage Setup
- **Storage rules file**: Press Enter (use default: `storage.rules`)

---

## Step 4: Get Firebase Configuration

1. In [Firebase Console](https://console.firebase.google.com/), select your project
2. Click the **gear icon** ⚙️ next to "Project Overview"
3. Select **"Project settings"**
4. Scroll down to **"Your apps"** section
5. Click the **Web icon** `</>` to add a web app
6. Register app with nickname: `dzn-timme-web`
7. **Copy the Firebase config object** that looks like this:

```javascript
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
```

8. Update your `.env` file with these values:

```bash
VITE_FIREBASE_API_KEY=AIza...
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123
```

---

## Step 5: Enable Firebase Services

### 5a. Enable Authentication

1. In Firebase Console, go to **Authentication**
2. Click **"Get started"**
3. Go to **"Sign-in method"** tab
4. Enable **"Email/Password"**:
   - Click on it
   - Toggle "Enable"
   - Save
5. Enable **"Google"**:
   - Click on it
   - Toggle "Enable"
   - Select a support email
   - Save

### 5b. Create Firestore Database

1. In Firebase Console, go to **Firestore Database**
2. Click **"Create database"**
3. Choose **Production mode** (we already have security rules)
4. Select a location (closest to your users)
5. Click **"Enable"**

### 5c. Enable Storage

1. In Firebase Console, go to **Storage**
2. Click **"Get started"**
3. Use default security rules (we'll deploy our custom rules)
4. Select same location as Firestore
5. Click **"Done"**

---

## Step 6: Deploy Firestore Rules & Indexes

```bash
firebase deploy --only firestore:rules,firestore:indexes
```

This deploys:
- Security rules for role-based access control
- Database indexes for optimized queries

---

## Step 7: Deploy Cloud Functions

First, build the functions:

```bash
cd functions
npm run build
cd ..
```

Then deploy:

```bash
firebase deploy --only functions
```

**Note:** This may take 5-10 minutes. The following functions will be deployed:
- `createJob`
- `applyForJob`
- `checkIn`
- `checkOut`
- `autoCloseJobs`
- `exportToCSV`

---

## Step 8: Build the Production App

```bash
npm run build
```

This creates an optimized production build in the `dist/` folder.

---

## Step 9: Deploy to Firebase Hosting

```bash
firebase deploy --only hosting
```

After deployment completes, you'll see:

```
✔  Deploy complete!

Hosting URL: https://your-project.web.app
```

🎉 **Your app is now live!**

---

## Step 10: Seed Initial Data (Important!)

Your app needs initial data to work. Go to Firebase Console:

### Create a Site

1. Go to **Firestore Database**
2. Click **"Start collection"**
3. Collection ID: `sites`
4. Add document with auto-ID:
   ```
   name: "Tokyo Office"
   address: "1-1-1 Shibuya, Tokyo"
   region: "tokyo"
   ```

### Create an Admin User

1. First, register a user in your app at the hosting URL
2. Go to **Authentication** in Firebase Console
3. Copy the user's **UID**
4. Go to **Firestore Database**
5. Create collection: `employees`
6. Add document with ID = the UID you copied:
   ```
   uid: "paste-the-uid-here"
   name: {
     first: "Admin"
     last: "User"
   }
   email: "your-email@example.com"
   role: "admin"
   employmentType: "full_time"
   createdAt: [Click "Add field" > Type: "timestamp"]
   ```

---

## Step 11: Test Your App

1. Open your hosting URL: `https://your-project.web.app`
2. Login with the admin account
3. Go to Admin → Settings
4. Add more sites as needed
5. Create employee/manager accounts

---

## Troubleshooting

### Build Errors
```bash
# Clear cache and rebuild
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Function Deployment Issues
```bash
# Redeploy specific function
firebase deploy --only functions:createJob
```

### View Function Logs
```bash
firebase functions:log
```

### Update Environment Variables
If you change `.env`, rebuild and redeploy:
```bash
npm run build
firebase deploy --only hosting
```

---

## Quick Redeploy Commands

After making changes:

```bash
# Redeploy everything
npm run build && firebase deploy

# Just frontend
npm run build && firebase deploy --only hosting

# Just functions
cd functions && npm run build && cd .. && firebase deploy --only functions

# Just rules
firebase deploy --only firestore:rules,storage:rules
```

---

## Your Deployment URLs

After deployment, you'll have:
- **Public URL**: `https://your-project.web.app`
- **Firebase Console**: `https://console.firebase.google.com/project/your-project`
- **Firestore Dashboard**: Console → Firestore Database
- **Function Logs**: Console → Functions

---

## Next Steps

1. Test all features
2. Invite users (create employee/manager accounts)
3. Monitor usage in Firebase Console
4. Set up custom domain (optional)
5. Configure backup policies

---

## Support

If you encounter issues:
1. Check Firebase Console for errors
2. View function logs: `firebase functions:log`
3. Check browser console for frontend errors
4. Review the README.md for feature documentation

Good luck with your deployment! 🚀
