# 🚀 Deployment Guide

## Quick Start

### Local Development
```bash
npm install
npm run dev
```

Visit http://localhost:3000

---

## Production Deployment

### Option 1: Vercel (Recommended - Easiest)

**Why Vercel?**
- Zero configuration needed
- Automatic deployments on git push
- Built-in CDN and performance optimization
- Free tier available

**Steps:**
1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Click "Import Project"
4. Select your repository
5. Click "Deploy"

**Environment Variables in Vercel:**
- `NEXT_PUBLIC_BASE_URL`: Your production URL (auto-detected)
- `NEXT_PUBLIC_GA_MEASUREMENT_ID`: Your Google Analytics ID (optional)

---

### Option 2: GitHub Pages (Static Export)

**Steps:**

1. **Update your repository settings:**
   - Go to Settings → Pages
   - Source: GitHub Actions (or Deploy from branch)

2. **Set environment variables:**
   ```bash
   # In your CI/CD or locally:
   export GITHUB_PAGES=true
   export GITHUB_REPOSITORY=username/repository-name
   ```

3. **Build:**
   ```bash
   npm run build:gh-pages
   ```

4. **Deploy:**
   - Commit the `out/` directory to `gh-pages` branch, OR
   - Use GitHub Actions (see workflow below)

**GitHub Actions Workflow:**
Create `.github/workflows/deploy.yml`:
```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run build:gh-pages
        env:
          GITHUB_PAGES: true
          GITHUB_REPOSITORY: ${{ github.repository }}
      - uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./out
```

---

### Option 3: Netlify (Simple Drag & Drop)

**Steps:**

1. **Build locally:**
   ```bash
   npm run build
   ```

2. **Go to [netlify.com](https://netlify.com)**

3. **Drag & drop the `out/` folder**

**Or use Netlify CLI:**
```bash
npm install -g netlify-cli
netlify deploy --prod --dir=out
```

---

### Option 4: Cloudflare Pages

**Steps:**

1. Go to [pages.cloudflare.com](https://pages.cloudflare.com)
2. Connect your GitHub repository
3. Configure build:
   - Build command: `npm run build`
   - Build output directory: `out`
4. Deploy

---

### Option 5: AWS S3 + CloudFront

**Steps:**

1. **Build:**
   ```bash
   npm run build
   ```

2. **Create S3 bucket:**
   ```bash
   aws s3 mb s3://your-bucket-name
   aws s3 website s3://your-bucket-name --index-document index.html --error-document 404.html
   ```

3. **Upload:**
   ```bash
   aws s3 sync out/ s3://your-bucket-name --delete
   ```

4. **Create CloudFront distribution** pointing to your S3 bucket

---

## Environment Variables

### Required
- `NEXT_PUBLIC_BASE_URL`: Your production URL
  - Example: `https://csdiversity.com`

### Optional
- `NEXT_PUBLIC_GA_MEASUREMENT_ID`: Google Analytics ID
  - Example: `G-XXXXXXXXXX`

### For GitHub Pages Only
- `GITHUB_PAGES`: Set to `true`
- `GITHUB_REPOSITORY`: Format `username/repo-name`

---

## Building

### Standard Build
```bash
npm run build
```
Output: `out/` directory

### GitHub Pages Build
```bash
npm run build:gh-pages
```
Output: `out/` directory with correct base path

### Preview Build Locally
```bash
npm run preview
```

---

## Performance Tips

### 1. Enable Compression
Most hosting providers enable gzip/brotli automatically. Verify:
```bash
curl -H "Accept-Encoding: gzip" -I https://yourdomain.com
```

### 2. Set Cache Headers
For static assets in `_next/static/`:
```
Cache-Control: public, max-age=31536000, immutable
```

### 3. Enable HTTP/2
Most modern hosting providers support this by default.

---

## Custom Domain

### Vercel
1. Go to Project Settings → Domains
2. Add your domain
3. Update DNS records as instructed

### GitHub Pages
1. Go to Settings → Pages
2. Enter your custom domain
3. Add CNAME record pointing to `username.github.io`

### Netlify
1. Go to Domain Settings
2. Add custom domain
3. Update DNS records

---

## SSL/HTTPS

All recommended hosting providers provide free SSL certificates via Let's Encrypt:
- ✅ Vercel: Automatic
- ✅ Netlify: Automatic
- ✅ Cloudflare Pages: Automatic
- ✅ GitHub Pages: Automatic (after DNS propagation)

---

## Monitoring & Analytics

### Google Analytics
1. Get your measurement ID from Google Analytics
2. Set environment variable: `NEXT_PUBLIC_GA_MEASUREMENT_ID`
3. Redeploy

Events tracked:
- Page views
- Filter changes
- User interactions
- Chart interactions

### Performance Monitoring
Consider adding:
- [Vercel Analytics](https://vercel.com/analytics)
- [Google PageSpeed Insights](https://pagespeed.web.dev/)
- [Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci)

---

## Troubleshooting

### Issue: Build fails with "Module not found"
**Solution:** Run `npm ci` to ensure clean install

### Issue: Charts not displaying
**Solution:** Check console for errors, ensure data files are in `data/` directory

### Issue: 404 on page refresh (SPA routing)
**Solution:** This shouldn't happen with `output: 'export'`. Verify your hosting supports static exports.

### Issue: Base path issues on GitHub Pages
**Solution:** Ensure `GITHUB_PAGES=true` and `GITHUB_REPOSITORY` is set correctly

---

## Checklist Before Deploying

- [ ] All environment variables set
- [ ] Build succeeds locally (`npm run build`)
- [ ] Preview works locally (`npm run preview`)
- [ ] All pages load correctly
- [ ] Charts display data
- [ ] Dark/light mode works
- [ ] Mobile responsive
- [ ] Analytics configured (optional)
- [ ] Custom domain configured (if applicable)
- [ ] SSL certificate active

---

## Support

For issues or questions:
- Check the [README.md](./README.md)
- Review [Next.js Static Export docs](https://nextjs.org/docs/app/building-your-application/deploying/static-exports)
- Open an issue on GitHub






