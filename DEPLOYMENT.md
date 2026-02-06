# Deployment Checklist - FinanceTracker

Use this checklist when deploying to production.

## Pre-Deployment (Local Testing)

- [ ] All dependencies installed: `pnpm install`
- [ ] Development server runs: `pnpm dev`
- [ ] Can log in with authorized email
- [ ] Dashboard displays correctly
- [ ] Can upload and parse transactions
- [ ] Transactions save to Google Sheet
- [ ] Mobile responsive design works
- [ ] Settings page works
- [ ] Budget modifications save
- [ ] No console errors (F12)
- [ ] No warnings in terminal

## Environment Configuration

### Production Environment Variables

- [ ] `GOOGLE_CLIENT_ID` - Set and verified
- [ ] `GOOGLE_CLIENT_SECRET` - Set and kept secret
- [ ] `NEXTAUTH_URL` - Set to production domain (e.g., https://yourdomain.com)
- [ ] `NEXTAUTH_SECRET` - Generated with: `openssl rand -base64 32`
- [ ] `GOOGLE_SHEETS_SPREADSHEET_ID` - Set to correct sheet ID
- [ ] `GOOGLE_SERVICE_ACCOUNT_EMAIL` - Set correctly
- [ ] `GOOGLE_PRIVATE_KEY` - Set with proper escaping (`\n` for newlines)
- [ ] `GOOGLE_SHEETS_API_KEY` - Set and verified
- [ ] `OPENAI_API_KEY` - Set and verified
- [ ] `ALLOWED_EMAILS` - Contains only authorized users
- [ ] No environment variables hardcoded in code

### Google OAuth Setup

- [ ] Redirect URI includes: `https://yourdomain.com/api/auth/callback/google`
- [ ] Both development AND production URIs registered
- [ ] Client ID and Secret are unique per environment
- [ ] OAuth consent screen configured
- [ ] Scopes are minimal (only needed permissions)

### Google Sheets Verification

- [ ] Service account email has EDITOR access to production sheet
- [ ] Spreadsheet headers are in Row 1
- [ ] Sheet named "Transactions" exists
- [ ] Share settings verified
- [ ] Backup sheet exists (optional but recommended)

### OpenAI Verification

- [ ] API key is active and has available credits
- [ ] Usage limits are set if needed
- [ ] API key not used elsewhere (or tracking enabled)
- [ ] GPT-4 Vision model is accessible

## Build & Deployment (Vercel)

- [ ] Code pushed to main branch
- [ ] All tests passing (if applicable)
- [ ] No pending changes in git
- [ ] Project created in Vercel dashboard
- [ ] Repository connected to Vercel
- [ ] All environment variables added in Vercel project settings
- [ ] Build succeeds: `vercel build`
- [ ] Preview deployment successful
- [ ] Production domain configured
- [ ] SSL certificate active
- [ ] Domain DNS records updated (if using custom domain)

## Post-Deployment Testing

### Core Functionality

- [ ] Website loads at production domain
- [ ] Can reach login page
- [ ] Google OAuth redirect works
- [ ] Can log in with authorized email
- [ ] Unauthorized email is rejected with appropriate message
- [ ] Dashboard loads without errors
- [ ] Transactions display from Google Sheet
- [ ] Can navigate all pages

### Upload Feature

- [ ] Upload page accessible
- [ ] Can select and upload files
- [ ] AI parsing completes
- [ ] Transactions appear in preview
- [ ] Can save to Google Sheet
- [ ] Data appears in production Google Sheet within 30 seconds

### Performance

- [ ] Page load times acceptable (< 3 seconds)
- [ ] No 404 errors in console
- [ ] API responses are fast
- [ ] Images load properly
- [ ] Mobile responsive (test on actual device if possible)

### Security

- [ ] HTTPS active on all pages
- [ ] No sensitive data in network requests
- [ ] Cookies sent securely (Secure flag)
- [ ] CSRF tokens present
- [ ] Session invalidates on sign out
- [ ] Private key not exposed in logs
- [ ] API keys not visible in client-side code

## Monitoring & Maintenance

### Post-Launch

- [ ] Set up error monitoring (Sentry, etc.)
- [ ] Set up analytics (Google Analytics)
- [ ] Monitor API quotas daily first week
- [ ] Monitor error logs
- [ ] Check uptime monitoring
- [ ] Set up alerts for errors

### Ongoing

- [ ] Review OpenAI API costs weekly
- [ ] Check Google API quotas
- [ ] Monitor session counts
- [ ] Review error logs monthly
- [ ] Update dependencies monthly
- [ ] Rotate API keys quarterly
- [ ] Review authorized users list

## Rollback Plan

If deployment has issues:

1. [ ] Identify the problem
2. [ ] Check error logs
3. [ ] Revert to last stable commit: `git revert <commit>`
4. [ ] Deploy rollback version
5. [ ] Test in production
6. [ ] Document what went wrong
7. [ ] Fix issue locally
8. [ ] Test thoroughly before re-deploying

## Deployment Platforms (Choose One)

### Vercel (Recommended)
```bash
npm i -g vercel
vercel --prod
```

### AWS Amplify
```bash
amplify publish
```

### Heroku
```bash
git push heroku main
```

### Azure
- Follow Azure App Service deployment guide
- Connect GitHub repository
- Set environment variables in portal

### DigitalOcean App Platform
- Connect GitHub repo
- Configure environment variables
- Deploy from dashboard

## Security Audit Checklist

- [ ] No console.log() statements in production
- [ ] Error messages don't expose sensitive info
- [ ] API keys not in error messages
- [ ] CORS headers properly configured
- [ ] Rate limiting considered
- [ ] SQL injection prevention (if using DB)
- [ ] XSS prevention (Tailwind/React handles most)
- [ ] CSRF tokens working
- [ ] Sensitive routes require auth
- [ ] Session timeout set (default: 30 days)

## Performance Optimization

- [ ] Code minified in production build
- [ ] Images optimized
- [ ] CSS purged of unused styles
- [ ] API responses cached where appropriate
- [ ] Database queries optimized
- [ ] No N+1 queries
- [ ] Bundle size checked: `pnpm build`

## Documentation Updates

- [ ] README updated with production URL
- [ ] SETUP.md updated if process changed
- [ ] Deployment docs added to repo
- [ ] Team notified of production deployment
- [ ] Runbook created for common issues
- [ ] Escalation contacts documented

## Communication

- [ ] Stakeholders notified of launch
- [ ] Team briefed on production support
- [ ] Support email/Slack channel set up
- [ ] Incident response plan documented
- [ ] On-call rotation established

## Final Sign-Off

- [ ] Product owner approves production deployment
- [ ] All team members aware of changes
- [ ] Backup of Google Sheets created
- [ ] Backup of environment variables stored securely
- [ ] Team trained on new system
- [ ] Ready for users!

---

## Deployment Troubleshooting

### Build Fails
```bash
# Clear cache
rm -rf .next
pnpm install
pnpm build
```

### Environment Variables Not Working
- Verify variables are in hosting platform settings (not in .env.local)
- Redeploy after adding/changing variables
- Check variable names for typos
- Ensure values don't have extra quotes

### OAuth Not Working
- Verify redirect URI matches exactly (including https://)
- Check domain isn't in Google's redirect_uris restrictions
- Clear browser cookies and try again
- Verify time sync between server and Google

### Google Sheets Not Syncing
- Verify service account email has access
- Check API quotas at Google Cloud Console
- Verify private key formatting
- Test API key with API Explorer first

### Performance Issues
- Check OpenAI API response times
- Monitor Google Sheets API quota usage
- Enable caching where possible
- Consider CDN for static assets
- Monitor database connection pooling

## Need Help?

1. Check deployment platform documentation
2. Review error logs in real-time
3. Test locally with production environment variables
4. Check API service status pages
5. Review SETUP.md troubleshooting section

---

**Deployed successfully? Great! 🎉 Start monitoring and be ready to support your users.**
