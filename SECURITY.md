# 🔒 Security Guidelines for RAG Pipeline Educator

## 🚨 Critical Security Information

**⚠️ NEVER commit AWS credentials or API keys to version control!**

## 🛡️ Protected Files

The following files contain sensitive information and are automatically excluded from git:

### 🔑 Credentials & Environment Files
- `python_backend/.env` - **Contains AWS credentials**
- `python_backend/.env.*` - Any environment variants
- `.aws/` - AWS CLI configuration
- `*.pem`, `*.key` - Private keys
- `credentials.json` - Any credential files

### 📁 Directories with Sensitive Data
- `python_backend/venv_*/` - Virtual environments (may contain cached credentials)
- `python_backend/__pycache__/` - Python cache files
- `.vscode/` - IDE settings (may contain paths)

## ✅ Safe to Commit

These files are safe and should be committed:
- `python_backend/.env.example` - Template without real credentials
- `README.md` - Documentation
- `SECURITY.md` - This security guide
- All source code files (`.py`, `.tsx`, `.ts`, etc.)

## 🔧 Setup Instructions

### 1. Configure AWS Credentials Safely

```bash
# Copy the example file
cp python_backend/.env.example python_backend/.env

# Edit with your real credentials (NEVER commit this file)
nano python_backend/.env
```

### 2. Verify .gitignore Protection

```bash
# Check that .env files are ignored
git status
# Should NOT show python_backend/.env as a new file

# Verify .gitignore is working
git check-ignore python_backend/.env
# Should output: python_backend/.env
```

### 3. Remove Accidentally Committed Credentials

If you accidentally committed credentials:

```bash
# Remove from git history (DANGER: rewrites history)
git filter-branch --force --index-filter \
  'git rm --cached --ignore-unmatch python_backend/.env' \
  --prune-empty --tag-name-filter cat -- --all

# Force push (only if repository is private and you're sure)
git push origin --force --all
```

## 🔍 Security Checklist

Before committing, always verify:

- [ ] No `.env` files in git status
- [ ] No AWS credentials in any files
- [ ] No API keys or tokens in code
- [ ] No private keys or certificates
- [ ] No database passwords or connection strings
- [ ] No hardcoded secrets in source code

## 🚀 Safe Development Practices

### ✅ DO:
- Use environment variables for all secrets
- Keep `.env.example` updated with variable names (no values)
- Use placeholder values in documentation
- Regularly rotate AWS credentials
- Use AWS IAM roles with minimal permissions

### ❌ DON'T:
- Hardcode credentials in source code
- Commit `.env` files
- Share credentials in chat/email
- Use production credentials in development
- Store credentials in comments or documentation

## 🔧 Environment Variables Template

Your `python_backend/.env` should look like:

```bash
# AWS Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=AKIA...your_key_here
AWS_SECRET_ACCESS_KEY=your_secret_here

# Bedrock Configuration  
BEDROCK_REGION=us-east-1

# Default Models
DEFAULT_EMBEDDING_MODEL=amazon.titan-embed-text-v1
DEFAULT_GENERATION_MODEL=anthropic.claude-3-haiku-20240307-v1:0

# Logging
LOG_LEVEL=INFO
```

## 🆘 Emergency Response

If credentials are accidentally exposed:

1. **Immediately rotate AWS credentials**
2. **Remove from git history** (see commands above)
3. **Check AWS CloudTrail** for unauthorized usage
4. **Update all team members**
5. **Review and improve security practices**

## 📞 Support

For security questions or incidents:
- Review AWS security best practices
- Check git history for sensitive data
- Use `git secrets` tool for automated scanning
- Consider using AWS Secrets Manager for production

---

**🔒 Remember: Security is everyone's responsibility!**