/**
 * Production-ready publishing clients for social networks (LinkedIn, Twitter, Meta).
 * Connects directly to official APIs or falls back to standard sandbox logging.
 */

/**
 * Publishes content to LinkedIn via UGC share API.
 */
export async function publishToLinkedIn(accessToken, title, content, imageUrl) {
  if (accessToken === 'sandbox_access_token_demo_12345') {
    console.log(`[LinkedIn Sandbox Publisher] Post published: "${title}". Image: ${imageUrl}`);
    return { success: true, platform_post_id: `li_sandbox_${Date.now()}` };
  }

  // 1. Fetch user profile URN identifier required for author association
  const profileRes = await fetch('https://api.linkedin.com/v2/userinfo', {
    headers: { 'Authorization': `Bearer ${accessToken}` }
  });
  if (!profileRes.ok) {
    throw new Error('Failed to retrieve LinkedIn author URN for publishing');
  }
  const profileData = await profileRes.json();
  const authorUrn = `urn:li:person:${profileData.sub || profileData.id}`;

  // 2. Build UGC shares payload
  const sharePayload = {
    owner: authorUrn,
    subject: title,
    text: {
      text: content
    },
    distribution: {
      linkedInDistributionTarget: {
        visibleToGuest: true
      }
    }
  };

  // If a creative poster image was generated, attach it as rich media to the post
  if (imageUrl) {
    sharePayload.content = {
      contentEntities: [{
        entity_loc: imageUrl,
        thumbnails: [{
          resolvedImage: imageUrl
        }]
      }],
      title: title,
      description: 'Automated creative poster via SocialGen SaaS',
      shareMediaCategory: 'IMAGE'
    };
  }

  const publishRes = await fetch('https://api.linkedin.com/v2/shares', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'X-Restli-Protocol-Version': '2.0.0'
    },
    body: JSON.stringify(sharePayload)
  });

  if (!publishRes.ok) {
    const errText = await publishRes.text();
    throw new Error(`LinkedIn publishing endpoint rejected payload: ${errText}`);
  }

  const publishData = await publishRes.json();
  return { success: true, platform_post_id: publishData.id };
}

/**
 * Publishes content to Twitter / X via Twitter API v2.
 */
export async function publishToTwitter(accessToken, content) {
  if (accessToken === 'sandbox_access_token_demo_12345') {
    console.log(`[Twitter Sandbox Publisher] Tweet published: "${content.slice(0, 50)}..."`);
    return { success: true, platform_post_id: `tw_sandbox_${Date.now()}` };
  }

  const publishRes = await fetch('https://api.twitter.com/2/tweets', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      text: content
    })
  });

  if (!publishRes.ok) {
    const errText = await publishRes.text();
    throw new Error(`Twitter publishing endpoint rejected payload: ${errText}`);
  }

  const publishData = await publishRes.json();
  return { success: true, platform_post_id: publishData.data?.id };
}

/**
 * Publishes content to Meta (Facebook Pages / Instagram feed).
 */
export async function publishToMeta(accessToken, content, imageUrl) {
  if (accessToken === 'sandbox_access_token_demo_12345') {
    console.log(`[Meta Sandbox Publisher] Post published: "${content.slice(0, 50)}...". Image: ${imageUrl}`);
    return { success: true, platform_post_id: `meta_sandbox_${Date.now()}` };
  }

  // Meta Graph API Feed path (posts text/message and optional image link)
  let url = 'https://graph.facebook.com/v19.0/me/feed';
  const params = new URLSearchParams({
    message: content,
    access_token: accessToken
  });

  if (imageUrl) {
    // If image is supplied, utilize the photo node instead
    url = 'https://graph.facebook.com/v19.0/me/photos';
    params.append('url', imageUrl);
  }

  const publishRes = await fetch(`${url}?${params.toString()}`, {
    method: 'POST'
  });

  if (!publishRes.ok) {
    const errText = await publishRes.text();
    throw new Error(`Meta publishing endpoint rejected payload: ${errText}`);
  }

  const publishData = await publishRes.json();
  return { success: true, platform_post_id: publishData.post_id || publishData.id };
}

/**
 * Routing publisher that matches platform type and routes token credentials accordingly.
 */
export async function publishToSocialChannel(platform, accessToken, title, content, imageUrl) {
  try {
    if (platform === 'LinkedIn') {
      return await publishToLinkedIn(accessToken, title, content, imageUrl);
    }
    if (platform === 'Twitter') {
      return await publishToTwitter(accessToken, content);
    }
    if (platform === 'Facebook' || platform === 'Instagram') {
      return await publishToMeta(accessToken, content, imageUrl);
    }
    throw new Error(`Unknown publishing target platform: ${platform}`);
  } catch (err) {
    console.error(`[socialPublishers] Error during channel publishing on ${platform}:`, err);
    // Log details and return fallback indicator so database writes still proceed locally
    return { success: false, error: err.message };
  }
}
