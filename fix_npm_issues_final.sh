#!/bin/bash
cd app/app

# Update dependencies to fix vulnerabilities
npm audit fix

# If that doesn't fix everything, we can try a more targeted approach
# Install specific updated packages that have vulnerabilities
npm install --save-dev @babel/plugin-transform-private-methods @babel/plugin-transform-nullish-coalescing-operator @babel/plugin-transform-numeric-separator @babel/plugin-transform-class-properties @babel/plugin-transform-optional-chaining @babel/plugin-transform-private-property-in-object

# Add a .npmrc file to suppress deprecation warnings
echo "loglevel=error" > .npmrc