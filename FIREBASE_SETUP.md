# Firebase Setup Guide for HBReader

This guide will walk you through setting up Firebase for user authentication and data storage in HBReader.

## Overview

The experimental Firebase integration adds:
- **User Authentication** with Google OAuth
- **Saved Questions** that sync across devices
- **Preferences Sync** (theme, reading speed)
- **Free Tier** - No cost for personal use

---

## Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **"Add project"**
3. Enter project name: `hbreader` (or your preferred name)
4. **Disable** Google Analytics (not needed for this project)
5. Click **"Create project"**
6. Wait for project to be created (~30 seconds)
7. Click **"Continue"**

---

## Step 2: Register Your Web App

1. In Firebase Console, click the **Web icon** (`</>`) to add a web app
2. Enter app nickname: `HBReader`
3. **Check** "Also set up Firebase Hosting" (optional but recommended)
4. Click **"Register app"**
5. **Copy the Firebase configuration** - you'll need this soon
6. Click **"Continue to console"**

The config will look like this:
```javascript
const firebaseConfig = {
  apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "hbreader-xxxxx.firebaseapp.com",
  projectId: "hbreader-xxxxx",
  storageBucket: "hbreader-xxxxx.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdefghijklmnop"
};
```

---

## Step 3: Enable Authentication

1. In Firebase Console sidebar, click **"Authentication"**
2. Click **"Get started"**
3. Click on **"Google"** provider
4. Toggle **"Enable"**
5. Select your Google account email for "Project support email"
6. Click **"Save"**

That's it for authentication! Google OAuth is now enabled.

### Optional: Add More Providers

To add Facebook or Microsoft login:

**Facebook:**
1. Create a Facebook App at [developers.facebook.com](https://developers.facebook.com/)
2. Copy App ID and App Secret
3. Enable Facebook provider in Firebase Authentication
4. Paste credentials and save

**Microsoft:**
1. Register app at [Azure Portal](https://portal.azure.com/)
2. Copy Application ID and Client Secret
3. Enable Microsoft provider in Firebase Authentication
4. Paste credentials and save

---

## Step 4: Enable Firestore Database

1. In Firebase Console sidebar, click **"Firestore Database"**
2. Click **"Create database"**
3. Select **"Start in production mode"** (we'll add security rules next)
4. Choose a Cloud Firestore location:
   - `us-central` (Iowa) - recommended for US users
   - Or choose closest region
5. Click **"Enable"**

### Set Up Security Rules

1. Click **"Rules"** tab in Firestore
2. Replace the default rules with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only read/write their own data
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // Deny all other access
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

3. Click **"Publish"**

These rules ensure:
- Users can only access their own data
- Must be logged in to read/write
- No one can access other users' saved questions or preferences

---

## Step 5: Update Your Code with Firebase Config

1. Open `index.html` in your code editor
2. Find lines **874-881** (the Firebase config section):

```javascript
// TODO: Replace with your Firebase config from Firebase Console
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};
```

3. Replace with **your actual Firebase config** from Step 2
4. Save the file

---

## Step 6: Test Locally

1. Start local server:
   ```bash
   python3 -m http.server 8000
   ```

2. Open `http://localhost:8000` in your browser

3. Test the features:
   - Click **"Login"** button in top right
   - Sign in with your Google account
   - Your name and avatar should appear
   - Load a question and click **"⭐ Save"**
   - Check the "Saved Questions" section
   - Toggle dark mode - it should sync
   - Open in another browser tab - settings should persist

4. Check browser console (F12) for any errors

---

## Step 7: Deploy to GitHub Pages

Once everything works locally:

```bash
# Switch back to main branch
git checkout main

# Merge the experimental branch
git merge firebase-auth-experimental

# Push to GitHub
git push origin main
```

GitHub Pages will rebuild automatically. Your site with authentication will be live in 1-2 minutes at:
**https://mglass222.github.io/HBReader/**

---

## Troubleshooting

### "Firebase initialization error"
- Check that your config values are correct (no quotes around values needed)
- Verify you copied the entire config object

### "Sign-in failed: auth/unauthorized-domain"
1. Go to Firebase Console → Authentication → Settings
2. Scroll to "Authorized domains"
3. Add your GitHub Pages domain: `mglass222.github.io`
4. Also add `localhost` for local testing

### "Permission denied" in Firestore
- Verify security rules are published correctly
- Make sure you're logged in
- Check browser console for detailed error

### Google Sign-In popup blocked
- Allow popups for your domain in browser settings
- Try signing in with redirect instead (requires code change)

### Data not syncing
- Open browser console to check for errors
- Verify Firestore rules allow read/write
- Check that authentication is working (user should be visible in Firebase Console)

---

## Firebase Free Tier Limits

Your free tier includes:
- **Authentication**: Unlimited OAuth logins
- **Firestore**:
  - 1 GB storage
  - 50,000 reads/day
  - 20,000 writes/day
  - 20,000 deletes/day
- **Hosting** (if enabled): 10 GB storage, 360 MB/day bandwidth

This is **plenty** for personal use. You'd need thousands of users to hit these limits.

---

## Monitoring Usage

1. Go to Firebase Console → Usage and billing
2. View authentication, database, and hosting metrics
3. Set up budget alerts if desired (optional)

---

## Next Steps

### Optional Enhancements

1. **Add More OAuth Providers**
   - Facebook, Microsoft, GitHub
   - Follow provider-specific setup in Step 3

2. **Add Email/Password Login**
   - Enable in Firebase Authentication
   - Add email/password form to auth modal
   - Handle email verification

3. **Add Practice Statistics**
   - Track correct/incorrect answers
   - Store in Firestore per user
   - Display stats in sidebar

4. **Add Question Notes**
   - Let users add personal notes to saved questions
   - Store in Firestore with each saved question
   - Display in saved question view

5. **Add Study Sessions**
   - Review only saved questions
   - Spaced repetition algorithm
   - Track review dates

---

## Security Best Practices

✅ **Do:**
- Keep Firestore security rules restrictive
- Only allow users to access their own data
- Use HTTPS (GitHub Pages handles this)
- Validate data on the client before saving

❌ **Don't:**
- Expose API keys publicly (they're meant to be in client code)
- Allow public read/write access in Firestore
- Store sensitive personal information
- Share your Firebase project with untrusted users

---

## Need Help?

- [Firebase Documentation](https://firebase.google.com/docs)
- [Firebase Authentication Docs](https://firebase.google.com/docs/auth)
- [Firestore Documentation](https://firebase.google.com/docs/firestore)
- [Firebase Free Tier Pricing](https://firebase.google.com/pricing)

---

## Summary

✅ You now have:
- User authentication with Google OAuth
- Saved questions that sync across devices
- Preferences (theme, speed) that persist
- All on Firebase's free tier
- Hosted on GitHub Pages for free

The experimental branch is now ready to test. Once you verify it works, merge to main and deploy!
