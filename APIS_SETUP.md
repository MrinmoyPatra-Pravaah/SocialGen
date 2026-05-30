# Production API Setup Guide

This guide details how to obtain the developer client credentials for LinkedIn, Twitter (X), and Meta (Facebook/Instagram) to authenticate and auto-publish content from your SocialGen SaaS platform.

Copy the credentials into the `backend/.env` file:
```env
LINKEDIN_CLIENT_ID=your_linkedin_client_id
LINKEDIN_CLIENT_SECRET=your_linkedin_client_secret
LINKEDIN_REDIRECT_URI=http://localhost:8000/api/social/auth/callback

TWITTER_CLIENT_ID=your_twitter_client_id
TWITTER_CLIENT_SECRET=your_twitter_client_secret
TWITTER_REDIRECT_URI=http://localhost:8000/api/social/auth/callback

META_CLIENT_ID=your_meta_app_id
META_CLIENT_SECRET=your_meta_app_secret
META_REDIRECT_URI=http://localhost:8000/api/social/auth/callback
```

---

## 1. LinkedIn API Credentials

1. Go to the [LinkedIn Developer Portal](https://developer.linkedin.com/).
2. Click **Create App** and fill in your company/product details.
3. Once the app is created, navigate to the **Products** tab and request access to:
   * **Share on LinkedIn** (for publishing posts).
   * **Sign In with LinkedIn** (for user profile sync).
4. Go to the **Auth** tab:
   * Locate your **Client ID** and **Client Secret**.
   * Under **Authorized Redirect URLs**, add:
     `http://localhost:8000/api/social/auth/callback`
5. Copy the Client ID and Client Secret into your `backend/.env` file.

---

## 2. Twitter / X API Credentials

1. Go to the [Twitter Developer Portal](https://developer.twitter.com/).
2. Create a new **Project** and an **App** inside it (choose **Free** or **Basic** tier).
3. Navigate to **User Authentication Settings** (inside your app settings) and click **Set up**:
   * **App permissions**: Select **Read and write** (mandatory to post tweets).
   * **Type of App**: Select **Web App, Automated App or Bot**.
   * **Callback URI / Redirect URL**: Add `http://localhost:8000/api/social/auth/callback`.
   * **Website URL**: Add `http://localhost:5173`.
4. Save the settings. You will be shown your **OAuth 2.0 Client ID** and **Client Secret**.
5. Copy these credentials into your `backend/.env` file.

---

## 3. Meta (Facebook & Instagram) API Credentials

1. Go to the [Meta Developer Portal](https://developers.facebook.com/).
2. Click **My Apps** -> **Create App**.
3. Choose **Business** or **Consumer** type.
4. Under **Add products to your app**, set up **Facebook Login for Business**.
5. Go to **Facebook Login** -> **Settings**:
   * Under **Valid OAuth Redirect URIs**, enter:
     `http://localhost:8000/api/social/auth/callback`
6. Navigate to **Settings** -> **Basic** to find your **App ID** and **App Secret**.
7. Copy the App ID to `META_CLIENT_ID` and the App Secret to `META_CLIENT_SECRET` in your `backend/.env` file.
