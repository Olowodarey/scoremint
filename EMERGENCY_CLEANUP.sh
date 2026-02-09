#!/bin/bash
# Emergency script to remove sensitive data from git history

echo "⚠️  EMERGENCY: Removing exposed private key from git history"
echo ""
echo "This will rewrite git history. All collaborators will need to re-clone."
echo ""

# The exposed private key to remove
EXPOSED_KEY="9238a857a5b64b9b2b95e8c3cdd70dd242c8bab59666552389b888ef5034e57d"
EXPOSED_API_KEY="e25ccd2f8868107af61fb020bfb98e43"

# Create a backup
echo "Creating backup branch..."
git branch backup-before-cleanup

# Method 1: Using git filter-repo (recommended if installed)
if command -v git-filter-repo &> /dev/null; then
    echo "Using git-filter-repo..."
    git filter-repo --replace-text <(echo "${EXPOSED_KEY}==>REMOVED_PRIVATE_KEY")
    git filter-repo --replace-text <(echo "${EXPOSED_API_KEY}==>REMOVED_API_KEY")
else
    # Method 2: Using BFG (if installed)
    if command -v bfg &> /dev/null; then
        echo "Using BFG Repo-Cleaner..."
        echo "${EXPOSED_KEY}" > /tmp/secrets.txt
        echo "${EXPOSED_API_KEY}" >> /tmp/secrets.txt
        bfg --replace-text /tmp/secrets.txt
        git reflog expire --expire=now --all
        git gc --prune=now --aggressive
    else
        echo "❌ Neither git-filter-repo nor BFG is installed."
        echo ""
        echo "Install one of these tools:"
        echo "  - git-filter-repo: pip install git-filter-repo"
        echo "  - BFG: https://rtyley.github.io/bfg-repo-cleaner/"
        echo ""
        echo "Or use manual method below..."
        exit 1
    fi
fi

echo ""
echo "✅ Git history cleaned locally"
echo ""
echo "⚠️  NEXT STEPS:"
echo "1. Force push to remote: git push origin --force --all"
echo "2. Contact GitHub support to purge cached data"
echo "3. All collaborators must re-clone the repository"
