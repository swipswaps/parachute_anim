# Security Guide for Parachute 3D Pipeline

This guide provides best practices for securing your Parachute 3D Pipeline installation.

## Handling Secrets

### Environment Variables

The application uses environment variables to store sensitive information such as API keys and credentials. These are stored in a `.env` file in the root directory of the application.

**Best Practices:**

1. **Never commit the `.env` file to version control**
   - The `.env` file is included in `.gitignore` to prevent accidental commits
   - Always use `.env.example` as a template without real secrets

2. **Generate secure secrets**
   - Use the provided `generate_secrets.sh` script to create secure random keys
   - Change default admin credentials immediately

3. **Restrict access to the `.env` file**
   - Set appropriate file permissions: `chmod 600 .env`
   - Only the application user should be able to read this file

### API Keys

The application uses API keys for various services. These should be handled with care:

1. **Rotate compromised keys immediately**
   - If you suspect a key has been exposed, rotate it immediately in your service provider's console
   - Update the `.env` file with the new key

2. **Use key restrictions**
   - When possible, restrict API keys to specific IP addresses
   - Set usage quotas to limit potential abuse

3. **Use environment variables**
   - Store API keys as environment variables
   - Use the pattern `${ENV_VAR_NAME:-default_value}` in your .env file

## GitHub Authentication

When using GitHub CLI for repository operations:

1. **Use a dedicated GitHub account or token with limited scope**
   - Create a token with only the necessary permissions
   - Do not use your personal GitHub account for automated operations

2. **Store GitHub tokens securely**
   - Do not hardcode tokens in scripts
   - Use environment variables or a secure credential store

3. **Rotate tokens regularly**
   - Create a schedule for rotating GitHub tokens
   - Revoke unused or old tokens

## Secure Deployment

When deploying the application:

1. **Use HTTPS**
   - Always use HTTPS in production
   - Set up proper SSL/TLS certificates

2. **Implement proper authentication**
   - Change default admin credentials
   - Use strong passwords or, preferably, OAuth or other modern authentication methods

3. **Regular security audits**
   - Regularly check for exposed secrets
   - Use tools like GitGuardian to monitor for secret exposure

## What to Do If Secrets Are Exposed

If you discover that secrets have been exposed:

1. **Revoke and rotate**
   - Immediately revoke the exposed secrets
   - Generate new secrets

2. **Assess the impact**
   - Determine what could have been accessed with the exposed secrets
   - Check for any unauthorized access or usage

3. **Notify affected parties**
   - If user data could have been compromised, notify affected users
   - Follow any applicable data breach notification laws

4. **Prevent future exposure**
   - Review and improve security practices
   - Implement additional safeguards as needed

## Using the Secret Generator

The repository includes a script to generate secure secrets:

```bash
./generate_secrets.sh
```

This script will:
1. Create a `.env` file from the `.env.example` template
2. Generate a secure random key for the `SECRET_KEY`
3. Prompt for admin credentials
4. Update the `.env` file with the new secrets
5. Set proper file permissions (600) on the .env file

Run this script when setting up a new installation or when rotating secrets.
