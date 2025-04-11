#!/bin/bash

# Script to set up Git hooks for preventing accidental commits of sensitive files

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Parachute 3D Pipeline - Git Hooks Setup${NC}"
echo "This script will set up Git hooks to prevent accidental commits of sensitive files."
echo ""

# Check if .git directory exists
if [ ! -d ".git" ]; then
  echo -e "${RED}Error: .git directory not found.${NC}"
  echo "Please run this script from the root of your Git repository."
  exit 1
fi

# Create hooks directory if it doesn't exist
mkdir -p .git/hooks

# Create pre-commit hook
cat > .git/hooks/pre-commit << 'EOF'
#!/bin/bash

# Pre-commit hook to prevent committing sensitive files

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

# Files to check
FILES_PATTERN="\.(env|pem|key|crt|p12|pfx|jks|keystore|password|secret|token)$"
KEYWORDS="password|secret|key|token|credential|api.?key"

# Check for sensitive files
echo "Checking for sensitive files..."
SENSITIVE_FILES=$(git diff --cached --name-only | grep -E "$FILES_PATTERN" || true)
if [ -n "$SENSITIVE_FILES" ]; then
  echo -e "${RED}Error: Attempting to commit sensitive files:${NC}"
  echo "$SENSITIVE_FILES"
  echo -e "${RED}Please remove these files from your commit.${NC}"
  echo "If you're sure you want to commit these files, use --no-verify to bypass this check."
  exit 1
fi

# Check for sensitive keywords in files
echo "Checking for sensitive keywords in files..."
SENSITIVE_CONTENT=$(git diff --cached -U0 | grep -E "^\+" | grep -v "^\+\+\+" | grep -E "$KEYWORDS" || true)
if [ -n "$SENSITIVE_CONTENT" ]; then
  echo -e "${RED}Error: Attempting to commit content with sensitive keywords:${NC}"
  echo "$SENSITIVE_CONTENT"
  echo -e "${RED}Please remove these sensitive keywords from your commit.${NC}"
  echo "If you're sure you want to commit this content, use --no-verify to bypass this check."
  exit 1
fi

echo -e "${GREEN}No sensitive files or content found.${NC}"
exit 0
EOF

# Make the hook executable
chmod +x .git/hooks/pre-commit

echo -e "${GREEN}Git hooks set up successfully.${NC}"
echo "The pre-commit hook will prevent accidental commits of sensitive files."
echo "To bypass the hook in special cases, use the --no-verify flag with git commit."
