#!/bin/bash

# Script to generate secure secrets for the Parachute 3D Pipeline
# This script generates a secure random key and prompts for admin credentials

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Parachute 3D Pipeline - Secure Secret Generator${NC}"
echo "This script will help you generate secure secrets for your application."
echo ""

# Check if .env file exists
if [ -f .env ]; then
  echo -e "${YELLOW}Warning: .env file already exists.${NC}"
  read -p "Do you want to overwrite it? (y/n): " overwrite
  if [[ $overwrite != "y" && $overwrite != "Y" ]]; then
    echo "Operation cancelled."
    exit 0
  fi
  # Backup the existing .env file
  cp .env .env.backup.$(date +%Y%m%d%H%M%S)
  echo "Existing .env file backed up."
fi

# Copy the example file if it exists
if [ -f .env.example ]; then
  cp .env.example .env
  echo "Created .env file from .env.example template."
else
  echo -e "${RED}Error: .env.example file not found.${NC}"
  exit 1
fi

# Generate a secure random key
echo "Generating a secure random key..."
if command -v python3 &> /dev/null; then
  SECRET_KEY=$(python3 -c 'import secrets; print(secrets.token_hex(32))')
elif command -v python &> /dev/null; then
  SECRET_KEY=$(python -c 'import secrets; print(secrets.token_hex(32))')
else
  SECRET_KEY=$(openssl rand -hex 32)
fi

# Prompt for admin credentials
echo ""
echo "Please enter admin credentials:"
read -p "Admin Username (default: admin): " ADMIN_USERNAME
ADMIN_USERNAME=${ADMIN_USERNAME:-admin}

read -s -p "Admin Password: " ADMIN_PASSWORD
echo ""
if [ -z "$ADMIN_PASSWORD" ]; then
  echo -e "${RED}Warning: Empty password provided. Using default 'admin' password.${NC}"
  echo -e "${RED}This is insecure and should be changed in production.${NC}"
  ADMIN_PASSWORD="admin"
fi

# Update the .env file with the new secrets
sed -i "s|SECRET_KEY=.*|SECRET_KEY=$SECRET_KEY|g" .env
sed -i "s|ADMIN_USERNAME=.*|ADMIN_USERNAME=$ADMIN_USERNAME|g" .env
sed -i "s|ADMIN_PASSWORD=.*|ADMIN_PASSWORD=$ADMIN_PASSWORD|g" .env

# Set proper permissions on the .env file
chmod 600 .env

echo -e "${GREEN}Secrets generated and saved to .env file.${NC}"
echo "File permissions set to 600 (readable only by owner)."
echo ""
echo "To use these secrets in your application:"
echo "1. Make sure the .env file is in the root directory of your application."
echo "2. Load the environment variables in your application."
echo "3. Keep the .env file secure and do not commit it to version control."
echo ""
echo -e "${YELLOW}Important: The .env file contains sensitive information.${NC}"
echo -e "${YELLOW}Make sure it is included in your .gitignore file.${NC}"
