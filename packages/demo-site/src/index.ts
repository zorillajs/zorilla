import { detectBotFromRequest } from './detection/server-side';
import detectorJS from './static/detector';
import stylesCSS from './static/styles';
import blockedHTML from './templates/blocked';
import landingHTML from './templates/landing';
import protectedHTML from './templates/protected';

export default {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    // Handle static assets first
    if (url.pathname === '/styles.css') {
      return new Response(stylesCSS, {
        headers: { 'content-type': 'text/css' },
      });
    }

    if (url.pathname === '/detector.js') {
      return new Response(detectorJS, {
        headers: { 'content-type': 'application/javascript' },
      });
    }

    // Server-side bot detection
    const serverDetection = detectBotFromRequest(request);

    // Log detection results (visible in wrangler dev)
    console.log('Server Detection:', {
      isBot: serverDetection.isBot,
      confidence: serverDetection.confidence,
      failedChecks: serverDetection.failedChecks.length,
    });

    // Route handling
    switch (url.pathname) {
      case '/':
        return serveLandingPage();

      case '/api/secret':
        // If server-side detection is confident it's a bot, block immediately
        if (serverDetection.isBot && serverDetection.confidence > 0.6) {
          console.log('🚫 Blocked by server-side detection');
          return serveBlockedPage(
            serverDetection.failedChecks.map(c => c.name)
          );
        }
        // Otherwise, serve the page with client-side detection
        return serveProtectedPage();

      case '/blocked':
        return serveBlockedPage([]);

      default:
        return new Response('Not Found', { status: 404 });
    }
  },
};

function serveLandingPage(): Response {
  return new Response(landingHTML, {
    headers: {
      'content-type': 'text/html;charset=UTF-8',
      'cache-control': 'public, max-age=3600',
    },
  });
}

function serveProtectedPage(): Response {
  return new Response(protectedHTML, {
    headers: {
      'content-type': 'text/html;charset=UTF-8',
      'cache-control': 'no-store',
    },
  });
}

function serveBlockedPage(_failedChecks: string[]): Response {
  // Could inject failed checks into the HTML here if needed
  // For now, the blocked page reads from sessionStorage set by client-side JS

  return new Response(blockedHTML, {
    status: 403,
    headers: {
      'content-type': 'text/html;charset=UTF-8',
      'cache-control': 'no-store',
    },
  });
}
