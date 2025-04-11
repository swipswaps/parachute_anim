#!/bin/bash
cd app

# Update dependencies to fix vulnerabilities
npm audit fix

# If that doesn't fix everything, we can force updates
# (only use if necessary as it might break compatibility)
# npm audit fix --force

# Add a .npmrc file to suppress deprecation warnings
echo "loglevel=error" > .npmrc