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

# OpenFOAM temp files
*.foam
processor*/
*[0-9].[0-9]*/
*[0-9]/
!0/
!system/
!constant/
EOF

# Stage the .gitignore file first
git add .gitignore

# Then add other important files selectively
git add app/package.json app/src app/public
git add setup_react_app.sh
git add README.md

# Commit these changes
git commit -m "Set up React app structure and add .gitignore"