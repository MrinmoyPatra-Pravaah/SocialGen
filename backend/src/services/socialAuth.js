import { 
  LINKEDIN_CLIENT_ID, 
  LINKEDIN_CLIENT_SECRET, 
  LINKEDIN_REDIRECT_URI,
  TWITTER_CLIENT_ID, 
  TWITTER_CLIENT_SECRET, 
  TWITTER_REDIRECT_URI,
  META_CLIENT_ID, 
  META_CLIENT_SECRET, 
  META_REDIRECT_URI
} from '../config/index.js';

/**
 * Checks if the system should run OAuth in sandbox/simulated mode for a specific platform.
 * Sandbox mode triggers if client credentials are not configured in the backend environment.
 */
export function isPlatformInSandbox(platform) {
  if (platform === 'LinkedIn') {
    return !LINKEDIN_CLIENT_ID || !LINKEDIN_CLIENT_SECRET;
  }
  if (platform === 'Twitter') {
    return !TWITTER_CLIENT_ID || !TWITTER_CLIENT_SECRET;
  }
  if (platform === 'Facebook' || platform === 'Instagram') {
    return !META_CLIENT_ID || !META_CLIENT_SECRET;
  }
  return true;
}

/**
 * Builds the official authorization redirect URL for OAuth 2.0.
 * If credentials are not configured, it returns a local redirect URL that immediately
 * routes back to the callback handler in sandbox mode.
 */
export function getAuthorizeUrl(platform, state) {
  const isSandbox = isPlatformInSandbox(platform);

  if (isSandbox) {
    // If credentials are omitted, mock the redirection directly to our local callback API
    console.log(`[socialAuth] Initiating sandbox OAuth redirection for ${platform}`);
    return `http://localhost:8000/api/social/auth/callback?code=sandbox_auth_code&state=${encodeURIComponent(state)}`;
  }

  // Build standard production authorization redirection links
  if (platform === 'LinkedIn') {
    return `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${encodeURIComponent(LINKEDIN_CLIENT_ID)}&redirect_uri=${encodeURIComponent(LINKEDIN_REDIRECT_URI)}&state=${encodeURIComponent(state)}&scope=r_liteprofile%20w_member_social`;
  }
  
  if (platform === 'Twitter') {
    // Twitter v2 OAuth 2.0 User Context authorization (requires PKCE challenge - simple plaintext challenge for demo integration)
    return `https://twitter.com/i/oauth2/authorize?response_type=code&client_id=${encodeURIComponent(TWITTER_CLIENT_ID)}&redirect_uri=${encodeURIComponent(TWITTER_REDIRECT_URI)}&state=${encodeURIComponent(state)}&code_challenge=challenge&code_challenge_method=plain&scope=tweet.read%20tweet.write%20users.read`;
  }
  
  if (platform === 'Facebook' || platform === 'Instagram') {
    // Meta Graph API Page and Instagram permission authorization scopes
    return `https://www.facebook.com/v19.0/dialog/oauth?client_id=${encodeURIComponent(META_CLIENT_ID)}&redirect_uri=${encodeURIComponent(META_REDIRECT_URI)}&state=${encodeURIComponent(state)}&scope=pages_manage_posts%20pages_read_engagement%20instagram_basic%20instagram_content_publish`;
  }

  throw new Error(`Unsupported OAuth platform: ${platform}`);
}

/**
 * Performs token exchange for authorization code and queries user profile details.
 * Communicates with the official social network endpoints.
 */
export async function exchangeCodeAndFetchProfile(platform, code) {
  // Graceful fallback for local developers without credentials
  if (code === 'sandbox_auth_code') {
    console.log(`[socialAuth] Processing Sandbox token issuance for ${platform}`);
    let username = `sandbox_${platform.toLowerCase()}_user`;
    let avatar_url = `https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=120&h=120&q=80`;
    try {
      const res = await fetch('https://randomuser.me/api/');
      const data = await res.json();
      const user = data.results?.[0];
      if (user) {
        username = `@${user.login.username}`;
        avatar_url = user.picture.medium || user.picture.thumbnail || avatar_url;
      }
    } catch (e) {
      console.warn('[socialAuth] Failed to seed sandbox profile from randomuser.me API:', e);
    }
    return {
      username: username,
      avatar_url: avatar_url,
      access_token: 'sandbox_access_token_demo_12345',
      refresh_token: 'sandbox_refresh_token_demo_12345',
      expires_at: Date.now() + 30 * 24 * 60 * 60 * 1000 // 30 days
    };
  }

  if (platform === 'LinkedIn') {
    // 1. Exchange auth code for active access token
    const tokenRes = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: LINKEDIN_REDIRECT_URI,
        client_id: LINKEDIN_CLIENT_ID,
        client_secret: LINKEDIN_CLIENT_SECRET
      })
    });
    
    if (!tokenRes.ok) {
      const errText = await tokenRes.text();
      throw new Error(`LinkedIn token exchange failed: ${errText}`);
    }
    const tokenData = await tokenRes.json();

    // 2. Query user identity profile to fetch name and avatar
    const profileRes = await fetch('https://api.linkedin.com/v2/userinfo', {
      headers: { 'Authorization': `Bearer ${tokenData.access_token}` }
    });
    
    if (!profileRes.ok) {
      throw new Error('Failed to retrieve LinkedIn profile information');
    }
    const profileData = await profileRes.json();

    return {
      username: profileData.name || profileData.given_name || 'LinkedIn User',
      avatar_url: profileData.picture || null,
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token || null,
      expires_at: tokenData.expires_in ? Date.now() + tokenData.expires_in * 1000 : null
    };
  }

  if (platform === 'Twitter') {
    // 1. Exchange auth code for active access token
    const credentialsBase64 = Buffer.from(`${TWITTER_CLIENT_ID}:${TWITTER_CLIENT_SECRET}`).toString('base64');
    const tokenRes = await fetch('https://api.twitter.com/2/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${credentialsBase64}`
      },
      body: new URLSearchParams({
        code: code,
        grant_type: 'authorization_code',
        redirect_uri: TWITTER_REDIRECT_URI,
        code_verifier: 'challenge' // Plain challenge verifier corresponding to code_challenge in authorization URL
      })
    });

    if (!tokenRes.ok) {
      const errText = await tokenRes.text();
      throw new Error(`Twitter token exchange failed: ${errText}`);
    }
    const tokenData = await tokenRes.json();

    // 2. Query authenticated user details to extract screen handle
    const profileRes = await fetch('https://api.twitter.com/2/users/me?user.fields=profile_image_url', {
      headers: { 'Authorization': `Bearer ${tokenData.access_token}` }
    });

    if (!profileRes.ok) {
      throw new Error('Failed to retrieve Twitter profile information');
    }
    const profileData = await profileRes.json();

    return {
      username: profileData.data?.username || profileData.data?.name || 'Twitter User',
      avatar_url: profileData.data?.profile_image_url || null,
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token || null,
      expires_at: tokenData.expires_in ? Date.now() + tokenData.expires_in * 1000 : null
    };
  }

  if (platform === 'Facebook' || platform === 'Instagram') {
    // 1. Exchange auth code for active access token
    const tokenRes = await fetch(`https://graph.facebook.com/v19.0/oauth/access_token?client_id=${encodeURIComponent(META_CLIENT_ID)}&redirect_uri=${encodeURIComponent(META_REDIRECT_URI)}&client_secret=${encodeURIComponent(META_CLIENT_SECRET)}&code=${encodeURIComponent(code)}`);

    if (!tokenRes.ok) {
      const errText = await tokenRes.text();
      throw new Error(`Meta token exchange failed: ${errText}`);
    }
    const tokenData = await tokenRes.json();

    // 2. Query user or page attributes
    const profileRes = await fetch(`https://graph.facebook.com/v19.0/me?fields=id,name,picture&access_token=${tokenData.access_token}`);
    if (!profileRes.ok) {
      throw new Error('Failed to retrieve Meta profile information');
    }
    const profileData = await profileRes.json();

    return {
      username: profileData.name || 'Meta Page Manager',
      avatar_url: profileData.picture?.data?.url || null,
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token || null,
      expires_at: tokenData.expires_in ? Date.now() + tokenData.expires_in * 1000 : null
    };
  }

  throw new Error(`Unsupported token exchange platform: ${platform}`);
}
