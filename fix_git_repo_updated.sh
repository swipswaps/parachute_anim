#!/bin/bash

# Create a .gitignore file to exclude node_modules and build artifacts
cat > .gitignore << 'EOF'
# Dependencies
node_modules
/.pnp
.pnp.js

# Testing
/coverage

# Production
/build
/dist

# Misc
.DS_Store
.env.local
.env.development.local
.env.test.local
.env.production.local

npm-debug.log*
yarn-debug.log*
yarn-error.log*
EOF

# First, let's see what files we have
echo "Current directory structure:"
find . -type f -not -path "*/node_modules/*" -not -path "*/\.*" | sort

# Stage the .gitignore file first
git add .gitignore

# Add all source files but exclude node_modules
git add app/src app/public

# Add package.json and other config files
find . -name "package.json" -o -name "package-lock.json" -o -name "*.config.js" | xargs git add

# Add any README files
find . -name "README.md" | xargs git add

# Commit these changes
git commit -m "Organize repository and add .gitignore"