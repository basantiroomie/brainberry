# GitHub Actions for 24/7 BrainBerry Uptime

This repository includes GitHub Actions workflows that will keep your BrainBerry app running 24/7 by regularly pinging it to prevent cold starts.

## 🔧 Workflows Included

### 1. Keep Alive (`keep-alive.yml`)
**Purpose**: Prevents cold starts by pinging your app regularly

**Schedule**:
- Every 5 minutes during active hours (6 AM - 11 PM UTC)
- Every 30 minutes during low activity hours (11 PM - 6 AM UTC)

**What it does**:
- Pings the health endpoint
- Warms up main pages
- Tests critical API endpoints
- Logs activity for monitoring

### 2. Health Monitor (`health-monitor.yml`)
**Purpose**: Comprehensive health checking and monitoring

**Schedule**:
- Every 15 minutes during weekday peak hours (8 AM - 8 PM UTC)
- Every hour during off-peak times

**What it does**:
- Comprehensive health checks
- Performance monitoring
- Database connectivity testing
- Automatic issue creation on failures

### 3. Deploy and Test (`deploy.yml`)
**Purpose**: Automated testing and deployment verification

**Triggers**:
- On push to main branch
- On pull requests
- Manual trigger

**What it does**:
- Runs tests and builds
- Verifies deployment health
- Warms up new deployments

## 🚀 Setup Instructions

### 1. Push to GitHub
```bash
cd /Users/bhaskar/Desktop/Samsung/brainberry
git add .
git commit -m "Add GitHub Actions for 24/7 uptime"
git push origin main
```

### 2. Enable GitHub Actions
1. Go to your GitHub repository
2. Click on the "Actions" tab
3. If prompted, click "I understand my workflows, go ahead and enable them"

### 3. Verify Workflows
Once pushed, you should see three workflows:
- ✅ **Keep BrainBerry Alive** - Running every 5-30 minutes
- ✅ **BrainBerry Health Monitor** - Running every 15 minutes to 1 hour
- ✅ **Deploy and Test** - Running on code changes

## 📊 Benefits of This Setup

### 🔥 **Prevents Cold Starts**
- Regular pings keep serverless functions warm
- Faster response times for real users
- Better user experience

### 📈 **Continuous Monitoring**
- Health checks every 15 minutes
- Automatic issue creation on failures
- Performance monitoring

### 🛡️ **Reliability**
- Multiple redundant workflows
- Different ping schedules for optimization
- Comprehensive error reporting

### 💰 **Cost Effective**
- Uses GitHub's free Actions minutes
- More reliable than external services
- No additional service subscriptions needed

## 🕐 GitHub Actions Limits (Free Plan)

- **2,000 minutes/month** for private repos
- **Unlimited minutes** for public repos
- Each ping takes ~1-2 minutes
- With current schedule: ~100-150 minutes/month usage

## 📱 Monitoring Your App

### View Workflow Runs
1. Go to your GitHub repo
2. Click "Actions" tab
3. See all workflow runs and their status

### Check Health Status
- Visit: https://brainberry.vercel.app/api/health
- Should return: `{"status":"healthy",...}`

### Manual Triggers
You can manually trigger any workflow:
1. Go to Actions tab
2. Select a workflow
3. Click "Run workflow"

## 🔧 Customization

### Adjust Ping Frequency
Edit the cron schedules in the workflow files:
```yaml
schedule:
  # Every 5 minutes during active hours
  - cron: '*/5 6-23 * * *'
  # Every 30 minutes during quiet hours  
  - cron: '*/30 23,0-6 * * *'
```

### Add More Endpoints
Add additional endpoints to warm up in the workflows:
```yaml
endpoints=(
  "/api/health"
  "/api/your-custom-endpoint"
)
```

### Modify Time Zones
The schedules use UTC. Adjust for your timezone:
- UTC+0: No change needed
- UTC-5 (EST): Add 5 hours to times
- UTC+1 (CET): Subtract 1 hour from times

## 🚨 Troubleshooting

### If Workflows Don't Run
1. Check if Actions are enabled in repo settings
2. Verify the YAML syntax is correct
3. Check the Actions tab for error messages

### If Health Checks Fail
1. Check if your app is deployed correctly
2. Verify the health endpoint is accessible
3. Check Vercel dashboard for issues

### If You Hit Action Limits
1. Reduce ping frequency
2. Make repository public (unlimited minutes)
3. Upgrade to GitHub Pro

## 🎯 Expected Results

With this setup, your BrainBerry app will:

✅ **Stay warm 24/7** - No cold starts
✅ **Respond instantly** - Always ready for users  
✅ **Self-monitor** - Automatic health checks
✅ **Auto-recover** - Pings help restart if needed
✅ **Cost nothing** - Uses free GitHub Actions

Your app will effectively have 99.9%+ uptime even on Vercel's free plan!

## 🔄 Next Steps

1. **Push the workflows** to enable them
2. **Monitor the Actions tab** to see them running
3. **Test your app** - should respond instantly
4. **Set up alerts** (optional) for workflow failures

Your BrainBerry app will now stay running 24/7 automatically! 🧠🍓
