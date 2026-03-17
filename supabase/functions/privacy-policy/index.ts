const HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Mise — Privacy Policy</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 640px; margin: 0 auto; padding: 24px; color: #333; line-height: 1.6; }
    h1 { font-size: 1.5rem; }
    h2 { font-size: 1.15rem; margin-top: 1.5em; }
    p, li { font-size: 0.95rem; }
    .date { color: #888; font-size: 0.85rem; }
  </style>
</head>
<body>
  <h1>Privacy Policy</h1>
  <p class="date">Last updated: March 15, 2026</p>

  <p>Mise ("we", "our", or "the app") is a recipe management app. Your privacy matters to us. This policy explains what data we collect, how we use it, and your rights.</p>

  <h2>1. Data We Collect</h2>
  <ul>
    <li><strong>Account information</strong> — If you sign in, we store your email address and authentication credentials via Supabase Auth. If you use Google or Apple sign-in, we receive only the information you authorize (typically name and email).</li>
    <li><strong>Recipes</strong> — Recipes you create or import are stored in our database so you can access them across devices.</li>
    <li><strong>Photos</strong> — If you attach a photo to a recipe (from your photo library or via a URL), it is uploaded to our secure storage.</li>
  </ul>

  <h2>2. How We Use Your Data</h2>
  <ul>
    <li>To provide and improve the app's functionality.</li>
    <li>To extract recipe information from URLs or images using AI services (Anthropic Claude and Google Gemini). The content you submit for extraction is sent to these services for processing only — it is not used to train AI models.</li>
    <li>We do <strong>not</strong> sell your personal data to third parties.</li>
  </ul>

  <h2>3. Third-Party Services</h2>
  <p>We use the following third-party services:</p>
  <ul>
    <li><strong>Supabase</strong> — authentication, database, and file storage.</li>
    <li><strong>Anthropic (Claude)</strong> — recipe text extraction from URLs.</li>
    <li><strong>Google (Gemini)</strong> — recipe extraction from images.</li>
    <li><strong>Expo / EAS</strong> — app build and update delivery.</li>
  </ul>

  <h2>4. Permissions</h2>
  <ul>
    <li><strong>Photo Library</strong> — Used only to let you pick images for your recipes. We do not access your photo library without your explicit action.</li>
  </ul>

  <h2>5. Data Retention</h2>
  <p>Your data is retained as long as your account is active. You can delete your account and all associated data by contacting us.</p>

  <h2>6. Children's Privacy</h2>
  <p>Mise is not directed at children under 13. We do not knowingly collect personal information from children.</p>

  <h2>7. Changes to This Policy</h2>
  <p>We may update this policy from time to time. Changes will be reflected by the "Last updated" date above.</p>

  <h2>8. Contact</h2>
  <p>If you have questions about this privacy policy, contact us at <strong>privacy@mise-app.com</strong>.</p>
</body>
</html>`;

Deno.serve((_req) => {
  return new Response(HTML, {
    headers: { 'content-type': 'text/html; charset=utf-8' },
  });
});
