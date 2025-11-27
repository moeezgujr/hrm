# Social Media OAuth Setup Guide

This guide explains how to connect your real social media accounts to the Business Management System using OAuth authentication.

## Overview

The system now supports authentic social media integrations through OAuth 2.0. Instead of demo accounts, you can connect your actual Facebook, Instagram, Twitter, LinkedIn, YouTube, and TikTok accounts to get real analytics data.

## Required Environment Variables

For each platform you want to connect, you'll need to obtain developer credentials and add them to your `.env` file:

```env
# Facebook/Instagram
FACEBOOK_APP_ID=your_facebook_app_id
FACEBOOK_APP_SECRET=your_facebook_app_secret

# Twitter/X
TWITTER_CLIENT_ID=your_twitter_client_id
TWITTER_CLIENT_SECRET=your_twitter_client_secret

# LinkedIn
LINKEDIN_CLIENT_ID=your_linkedin_client_id
LINKEDIN_CLIENT_SECRET=your_linkedin_client_secret

# Google/YouTube
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# TikTok
TIKTOK_CLIENT_KEY=your_tiktok_client_key
TIKTOK_CLIENT_SECRET=your_tiktok_client_secret
```

## Platform Setup Instructions

### 1. Facebook & Instagram

**Step 1: Create Facebook App**
1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Click "Create App" → "Consumer" → "Next"
3. Enter your app name and contact email
4. Add Facebook Login and Instagram Basic Display products

**Step 2: Configure OAuth**
1. In Facebook Login settings, add OAuth redirect URI:
   - `https://your-domain.replit.app/api/auth/facebook/callback`
2. For Instagram, add redirect URI:
   - `https://your-domain.replit.app/api/auth/instagram/callback`

**Step 3: Get Credentials**
1. Copy App ID and App Secret from Settings → Basic
2. Add to your environment variables

### 2. Twitter/X

**Step 1: Create Twitter App**
1. Go to [Twitter Developer Portal](https://developer.twitter.com/)
2. Create a new project and app
3. Enable OAuth 2.0

**Step 2: Configure OAuth**
1. Add callback URL: `https://your-domain.replit.app/api/auth/twitter/callback`
2. Set scopes: `tweet.read`, `users.read`, `follows.read`

**Step 3: Get Credentials**
1. Copy Client ID and Client Secret
2. Add to your environment variables

### 3. LinkedIn

**Step 1: Create LinkedIn App**
1. Go to [LinkedIn Developers](https://www.linkedin.com/developers/)
2. Create a new app
3. Select LinkedIn Pages for company page access

**Step 2: Configure OAuth**
1. Add OAuth 2.0 redirect URL: `https://your-domain.replit.app/api/auth/linkedin/callback`
2. Request access to necessary APIs

**Step 3: Get Credentials**
1. Copy Client ID and Client Secret from Auth tab
2. Add to your environment variables

### 4. YouTube (Google)

**Step 1: Create Google Cloud Project**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Enable YouTube Data API v3

**Step 2: Create OAuth Credentials**
1. Go to APIs & Services → Credentials
2. Create OAuth 2.0 Client ID
3. Add authorized redirect URI: `https://your-domain.replit.app/api/auth/youtube/callback`

**Step 3: Get Credentials**
1. Copy Client ID and Client Secret
2. Add to your environment variables

### 5. TikTok

**Step 1: Create TikTok App**
1. Go to [TikTok for Developers](https://developers.tiktok.com/)
2. Create a new app
3. Add Display API and Video API

**Step 2: Configure OAuth**
1. Add redirect URI: `https://your-domain.replit.app/api/auth/tiktok/callback`
2. Request necessary scopes

**Step 3: Get Credentials**
1. Copy Client Key and Client Secret
2. Add to your environment variables

## Testing Your Setup

1. **Add Environment Variables**: Update your `.env` file with the credentials
2. **Restart Application**: The system will detect the new credentials
3. **Connect Account**: Click the platform in the Social Media Hub
4. **Authorize Access**: You'll be redirected to the platform's OAuth flow
5. **View Analytics**: Return to see your real account data

## Current Status

**✅ OAuth Infrastructure**: Complete - All endpoints and routes are ready
**🔧 Platform Credentials**: Required - You need to obtain API credentials for each platform
**📊 Real Data Integration**: Ready - System will fetch actual analytics once credentials are configured

## Fallback Mode

If OAuth credentials aren't configured, the system will show setup instructions and requirements for each platform. You can still use demo mode for testing while setting up your OAuth apps.

## Security Notes

- Never commit your OAuth credentials to version control
- Use environment variables for all sensitive data  
- Regularly rotate your API keys and secrets
- Monitor your API usage limits for each platform

## Support

Each platform has different requirements and approval processes:
- **Facebook/Instagram**: May require business verification
- **Twitter**: Different access levels available
- **LinkedIn**: Company page access requires approval
- **YouTube**: Standard Google OAuth process
- **TikTok**: Business account may be required

Refer to each platform's developer documentation for specific requirements and limitations.