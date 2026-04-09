#!/bin/bash
# Aethera website — one-command deploy to Vercel
# Run from: D:\Soulverse\website\
# Usage: bash deploy.sh

set -e

echo "✦ Aethera Deploy Script"
echo "========================"

# 1. Check vercel CLI
if ! command -v vercel &> /dev/null; then
  echo "Installing Vercel CLI..."
  npm install -g vercel
fi

# 2. Add Resend secret to Vercel (will prompt if not exists)
echo ""
echo "Setting RESEND_API_KEY secret..."
echo "re_TynMGtqa_BcmfS6b4Rdz5WmRAna4DS3Sk" | vercel env add RESEND_API_KEY production --force 2>/dev/null || \
  vercel secrets add resend_api_key "re_TynMGtqa_BcmfS6b4Rdz5WmRAna4DS3Sk" 2>/dev/null || \
  echo "  (secret may already exist — continuing)"

# 3. Deploy
echo ""
echo "Deploying to production..."
vercel --prod

echo ""
echo "✦ Done! aethera.pl is live."
echo "Test: open https://aethera.pl → click 'Create Account' → enter email → check inbox."
