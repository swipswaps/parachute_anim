#!/bin/bash

# Create a .gitignore file to exclude node_modules and build artifacts
cat > .gitignore << 'EOF'
# Dependencies
/app/node_modules
/app/app/node_modules
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

# Stage the .gitignore file first
git add .gitignore

# Add all important files but exclude node_modules
git add app/app/src app/app/public app/app/package.json

# Add any README files and other important config files
git add README.md
git add app/app/*.json app/app/*.js

# Commit these changes
git commit -m "Organize repository and add .gitignore"