# Deployment Guide for GitHub Pages

## Quick Summary

Your History Bee Question Generator is ready to deploy! Here's what we've created:

### ✅ Completed Tasks

1. **Extracted 12,062 questions** from 178 PDF files
   - 9,652 Preliminary questions
   - 2,410 Finals questions
   - Preserved all formatting (bold, italic, underline)

2. **Built a responsive web application** with:
   - Streaming text display (LLM-style character-by-character)
   - Adjustable speed control (Very Fast to Very Slow)
   - Category selection (Preliminary/Finals)
   - Pause/Resume functionality
   - Modern, mobile-friendly design

3. **Set up Git repository** with all files committed

## Local Testing

Your website is currently running at: **http://localhost:8000**

Open this URL in your browser to test the application locally before deploying.

## Deploy to GitHub Pages

### Step 1: Create GitHub Repository

1. Go to https://github.com/new
2. Repository name: `nathistbee` (or your preferred name)
3. Description: "History Bee Question Generator with streaming text display"
4. Make it **Public** (required for free GitHub Pages)
5. **DO NOT** initialize with README, .gitignore, or license (we already have these)
6. Click "Create repository"

### Step 2: Push Your Code

Run these commands in your terminal:

```bash
cd "/Users/matthew/Documents/Code/Python/IAC Website/NatHistBee"

# Add your GitHub repository as remote (replace USERNAME and REPO)
git remote add origin https://github.com/USERNAME/nathistbee.git

# Push your code
git push -u origin main
```

**Note:** Replace `USERNAME` with your GitHub username and `nathistbee` with your repository name if different.

### Step 3: Enable GitHub Pages

1. Go to your repository on GitHub
2. Click **Settings** (top right)
3. Scroll down to **Pages** section (left sidebar)
4. Under "Source", select:
   - Branch: **main**
   - Folder: **/ (root)**
5. Click **Save**

### Step 4: Wait and Access

1. GitHub will build your site (takes 1-2 minutes)
2. Your site will be available at:
   ```
   https://USERNAME.github.io/nathistbee/
   ```
3. Update the link in your README.md once live

## Custom Domain (Optional)

To use a custom domain like `nathistbee.com`:

1. Buy a domain from any registrar
2. In your repository settings → Pages → Custom domain
3. Enter your domain and click Save
4. Add DNS records at your registrar:
   - Type: CNAME
   - Name: www (or @)
   - Value: USERNAME.github.io

## Troubleshooting

### Site Not Loading

- Wait 2-3 minutes after enabling GitHub Pages
- Check that the repository is Public
- Verify the branch name is `main`
- Clear your browser cache

### Questions Not Appearing

- Check browser console for errors (F12)
- Verify `questions.json` was pushed to GitHub
- Ensure file size is under GitHub's 100MB limit (it should be ~25MB)

### Formatting Issues

- Make sure the HTML file has been pushed correctly
- Check that bold/italic text appears in the JSON file
- View page source to verify the HTML is correct

## Files Overview

```
NatHistBee/
├── index.html             # Main webpage (open this)
├── questions.json         # All questions (25MB, 12K questions)
├── extract_questions.py   # Script to regenerate questions
├── README.md             # Project documentation
├── DEPLOYMENT.md         # This file
├── .gitignore            # Excludes PDFs from Git
└── *.pdf                 # Source files (NOT in Git)
```

## Updating Questions

To add new PDF files and regenerate questions:

```bash
# 1. Add PDF files to the directory
# 2. Run the extraction script
python3 extract_questions.py

# 3. Commit and push updates
git add questions.json
git commit -m "Update questions database"
git push origin main
```

GitHub Pages will automatically rebuild your site.

## Maintenance

### Regular Updates

- Add new PDF files as they become available
- Run `extract_questions.py` to update the database
- Commit and push changes

### Monitoring

- Check GitHub Actions tab for build status
- Monitor repository Insights → Traffic for visitors
- Review Issues for user feedback

## Features to Add (Future Enhancements)

Consider adding these features:
- [ ] Difficulty rating for questions
- [ ] User accounts and progress tracking
- [ ] Quiz mode with scoring
- [ ] Search functionality
- [ ] Filter by year/topic
- [ ] Export wrong answers for review
- [ ] Dark mode toggle
- [ ] Keyboard shortcuts

## Support

If you encounter issues:
1. Check the browser console (F12) for errors
2. Verify all files were pushed to GitHub
3. Review GitHub Pages deployment logs
4. Clear browser cache and try again

## Success! 🎉

Your History Bee Question Generator is ready to help students practice! Share the link once it's live.

Good luck with your studying!
