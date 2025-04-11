# Guide to Linting Proposed but Unimplemented Changes

This guide explains how to identify and "lint" (remove or properly document) proposed but unimplemented changes from the repository to maintain code integrity and prevent false assertions.

## What Are False Assertions?

False assertions occur when documentation or comments claim that certain features or fixes have been implemented when they actually haven't been. These can lead to:

1. Confusion for developers working on the codebase
2. False expectations about the functionality of the application
3. Wasted time debugging "missing" features that were never actually implemented
4. Decreased trust in the documentation and codebase

## How to Lint False Assertions

### 1. Identify False Assertions

First, identify where false assertions exist:

- **Documentation files**: README.md, CHANGELOG.md, etc.
- **Code comments**: Comments claiming functionality that doesn't exist
- **Compliance tables**: Tables like the original REQUEST_COMPLIANCE_TABLE.md
- **Issue trackers**: Closed issues that claim fixes were implemented

### 2. Categorize the Assertions

Categorize each assertion as:

- **Fully implemented**: The code matches the assertion
- **Partially implemented**: Some aspects of the assertion are implemented
- **Not implemented**: The assertion is completely false
- **Proposed solution**: The assertion describes a proposed solution, not an actual implementation

### 3. Lint the False Assertions

For each false assertion, take one of the following actions:

#### For Documentation Files

```bash
# Find all documentation files
find /home/owner/Documents/scripts/AI/swipswaps/skydiveu/parachute_anim -name "*.md" -type f

# Edit each file to correct false assertions
# For example:
# - Change "Implemented feature X" to "Proposed feature X"
# - Change "Fixed issue Y" to "Identified issue Y"
# - Add "TODO:" prefixes to unimplemented features
```

#### For Code Comments

```bash
# Find files with potentially misleading comments
grep -r "implemented" --include="*.js" --include="*.jsx" /home/owner/Documents/scripts/AI/swipswaps/skydiveu/parachute_anim
grep -r "fixed" --include="*.js" --include="*.jsx" /home/owner/Documents/scripts/AI/swipswaps/skydiveu/parachute_anim

# Edit each file to correct false assertions in comments
# For example:
# - Change "// Implemented feature X" to "// TODO: Implement feature X"
# - Change "// Fixed issue Y" to "// TODO: Fix issue Y"
```

#### For Configuration Files

For configuration files like vite.config.js where the proposed changes differ from the actual implementation:

```javascript
// Current vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://localhost:8000',
      '/token': 'http://localhost:8000',
      '/launch': 'http://localhost:8000',
      '/exports': 'http://localhost:8000',
      '/health': 'http://localhost:8000',
    }
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true
  }
})

// Add comments for proposed enhancements:
/*
TODO: Consider enhancing this configuration with:
1. Path aliases for easier imports:
   resolve: {
     alias: {
       '@': path.resolve(__dirname, './src'),
     },
   }
2. More detailed proxy configuration:
   '/api': {
     target: 'http://localhost:8000',
     changeOrigin: true,
     secure: false,
   }
*/
```

### 4. Create a "Proposed Enhancements" Document

Create a separate document for proposed enhancements that haven't been implemented yet:

```markdown
# Proposed Enhancements

This document lists enhancements that have been proposed but not yet implemented.

## Configuration Enhancements

### vite.config.js

```javascript
// Proposed enhancement to add path aliases
resolve: {
  alias: {
    '@': path.resolve(__dirname, './src'),
  },
},
```

### postcss.config.js

No specific enhancements proposed.

## Component Enhancements

### ModelViewer.jsx

- Add support for model annotations
- Implement model comparison feature
```

### 5. Update the Compliance Table

Replace the original compliance table with the updated one that accurately reflects the state of the codebase.

## Best Practices to Prevent False Assertions

1. **Use TODO comments**: Clearly mark unimplemented features with TODO comments
2. **Maintain a separate proposals document**: Keep proposed changes separate from documentation of actual implementations
3. **Version your documentation**: Clearly indicate which version of the application the documentation applies to
4. **Regular audits**: Regularly audit the codebase to ensure documentation matches reality
5. **Automated testing**: Implement tests that verify the existence and functionality of documented features

## Conclusion

By linting false assertions from your codebase and documentation, you create a more trustworthy and maintainable project. This process helps ensure that developers and users have accurate expectations about the functionality of the application and can more easily identify areas for improvement.
