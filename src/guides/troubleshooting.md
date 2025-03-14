# Troubleshooting Guide for Captain Quizzardo

## Common Issues

### Firebase Setup
- Ensure you have the correct Firebase configuration in your environment variables.
- Check if the Firestore rules are set to allow read/write for authenticated users.

### Vercel Deployment
- Verify that all necessary environment variables are set in Vercel.
- Check the build logs for any errors during deployment.

### GitHub Repository Management
- Ensure your local repository is up to date with the remote.
- Use `git pull` to fetch the latest changes before pushing your updates.

### Debugging Steps
- Check console logs for errors during runtime.
- Review network requests in the browser's developer tools for any failed API calls.
- If encountering TypeScript errors, ensure all types are correctly defined and imported.
