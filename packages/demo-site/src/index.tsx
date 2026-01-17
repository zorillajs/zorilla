import { Hono } from 'hono';
import { detectBotFromRequest } from './detection/server-side';
import detectorJS from './static/detector';
import stylesCSS from './static/styles';
import { BlockedPage } from './templates/blocked';
import { LandingPage } from './templates/landing';
import { ProtectedPage } from './templates/protected';

const app = new Hono();

// Serve static assets
app.get('/styles.css', c => {
  return c.text(stylesCSS, 200, {
    'content-type': 'text/css',
  });
});

app.get('/detector.js', c => {
  return c.text(detectorJS, 200, {
    'content-type': 'application/javascript',
  });
});

// Landing page
app.get('/', c => {
  return c.html(<LandingPage />, 200, {
    'cache-control': 'public, max-age=3600',
  });
});

// Challenge page with bot detection
app.get('/challenge', c => {
  // Server-side bot detection
  const serverDetection = detectBotFromRequest(c.req.raw);

  // Log detection results (visible in wrangler dev)
  console.log('Server Detection:', {
    isBot: serverDetection.isBot,
    confidence: serverDetection.confidence,
    failedChecks: serverDetection.failedChecks.length,
  });

  // If server-side detection is confident it's a bot, block immediately
  if (serverDetection.isBot && serverDetection.confidence > 0.6) {
    console.log('🚫 Blocked by server-side detection');
    return c.html(<BlockedPage />, 403, {
      'cache-control': 'no-store',
    });
  }

  // Otherwise, serve the page with client-side detection
  return c.html(<ProtectedPage />, 200, {
    'cache-control': 'no-store',
  });
});

// Blocked page
app.get('/blocked', c => {
  return c.html(<BlockedPage />, 403, {
    'cache-control': 'no-store',
  });
});

// 404 handler
app.notFound(c => {
  return c.text('Not Found', 404);
});

export default app;
