# Troubleshooting Guide

This document provides solutions for common issues encountered in the application.

## OpenFOAM Configuration Issues

### Problem

You may see the following error in your terminal when starting the application:

```
bash: /opt/openfoam*/etc/bashrc: No such file or directory
[+] Loading OpenFOAM from /opt/OpenFOAM-10/etc/bashrc
```

This error occurs because the `.bashrc` file is trying to load OpenFOAM using a wildcard path (`/opt/openfoam*/etc/bashrc`), which is not a best practice and can cause issues.

### Solution

We've provided two scripts to fix this issue:

1. **For the application only**: Use the `openfoam-config.sh` script to properly load OpenFOAM when running the application:

   ```bash
   ./start-dev-with-openfoam.sh
   ```

2. **For your entire system**: Use the `bashrc-fix.sh` script to fix your `.bashrc` file:

   ```bash
   ./bashrc-fix.sh
   ```

   After running this script, restart your terminal or run `source ~/.bashrc` to apply the changes.

## Development Server Connection Issues

### Problem

If you see the following error when trying to access the application:

```
This site can't be reached
localhost refused to connect.
```

This means the development server is not running or is not accessible.

### Solution

1. Start the development server:

   ```bash
   cd /home/owner/Documents/scripts/AI/swipswaps/skydiveu/parachute_anim/frontend
   npm run dev
   ```

2. Check if the server is running:

   ```bash
   netstat -tuln | grep 5173
   ```

3. If the server is running but you still can't access it, check your firewall settings:

   ```bash
   sudo ufw status
   ```

## Dependency Issues

### Problem

If you see errors related to missing dependencies or vulnerabilities:

```
3 high severity vulnerabilities
```

### Solution

1. Install dependencies:

   ```bash
   cd /home/owner/Documents/scripts/AI/swipswaps/skydiveu/parachute_anim/frontend
   npm install
   ```

2. Fix vulnerabilities:

   ```bash
   cd /home/owner/Documents/scripts/AI/swipswaps/skydiveu/parachute_anim/frontend
   npm audit fix
   ```

3. If that doesn't work, try:

   ```bash
   cd /home/owner/Documents/scripts/AI/swipswaps/skydiveu/parachute_anim/frontend
   npm audit fix --force
   ```

   Note: Use `--force` with caution as it may update dependencies to versions that are not compatible with your application.

## Error Logging Issues

### Problem

If you're having trouble capturing errors or the error capture tool is not working properly:

### Solution

1. Use the robust error capture tool:

   ```
   http://localhost:5173/robust-error-capture.html
   ```

2. Check the server logs:

   ```bash
   cd /home/owner/Documents/scripts/AI/swipswaps/skydiveu/parachute_anim/frontend/logs
   cat error.log
   ```

3. Start the error logging server:

   ```bash
   cd /home/owner/Documents/scripts/AI/swipswaps/skydiveu/parachute_anim/frontend/server
   node index.js
   ```

## Best Practices

To avoid similar issues in the future, follow these best practices:

1. **Avoid Wildcards in Configuration Paths**: Always use explicit paths instead of wildcards.

2. **Check for Existence Before Using**: Always check if files/directories exist before trying to use them.

3. **Use Environment Variables**: Use environment variables to store paths that might change.

4. **Avoid Duplicate Dependency Installations**: Install dependencies once and use package.json to manage them.

5. **Fix Vulnerabilities Promptly**: Regularly run `npm audit` and fix vulnerabilities.

6. **Use Case-Insensitive Searches**: When searching for files, use case-insensitive searches (`-i` flag with grep) to avoid missing files due to capitalization differences.

7. **Implement Proper Error Handling**: Always implement proper error handling in your code.

8. **Use Logging**: Implement comprehensive logging to help diagnose issues.

## Contact

If you continue to experience issues, please contact the development team.
