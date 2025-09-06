#!/bin/bash

# BrainBerry Keep-Alive Script
# This script pings your BrainBerry app to prevent cold starts
# Run this on any server/computer with cron jobs

APP_URL="https://brainberry.vercel.app"
HEALTH_ENDPOINT="$APP_URL/api/health"
LOG_FILE="brainberry-keepalive.log"

# Function to log with timestamp
log_message() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" >> "$LOG_FILE"
}

# Ping the health endpoint
echo "Pinging BrainBerry app..."
log_message "Pinging $HEALTH_ENDPOINT"

response=$(curl -s -L -w "%{http_code}" -o /tmp/health_response.json "$HEALTH_ENDPOINT")
http_code="${response: -3}"

if [ "$http_code" = "200" ]; then
    status=$(cat /tmp/health_response.json | grep -o '"status":"[^"]*"' | cut -d'"' -f4)
    log_message "✅ SUCCESS - HTTP $http_code, Status: $status"
    echo "✅ App is healthy!"
else
    log_message "❌ ERROR - HTTP $http_code"
    echo "❌ App may be down or having issues"
fi

# Cleanup
rm -f /tmp/health_response.json

# To set up as cron job, add this line to your crontab:
# */5 * * * * /path/to/this/script/keep-alive.sh >/dev/null 2>&1
