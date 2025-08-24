#!/bin/bash

# Script to clear the database for the Kid Videos App

echo "🗑️  Clearing Kid Videos App Database..."

# macOS path
MAC_DB="$HOME/Library/Application Support/com.kidvideos.app/app.db"

# Linux path
LINUX_DB="$HOME/.config/com.kidvideos.app/app.db"

# Check which OS we're on and clear the appropriate database
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    if [ -f "$MAC_DB" ]; then
        rm "$MAC_DB"
        echo "✅ Database cleared on macOS: $MAC_DB"
    else
        echo "ℹ️  No database found at: $MAC_DB"
    fi
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux
    if [ -f "$LINUX_DB" ]; then
        rm "$LINUX_DB"
        echo "✅ Database cleared on Linux: $LINUX_DB"
    else
        echo "ℹ️  No database found at: $LINUX_DB"
    fi
else
    echo "⚠️  Unsupported OS: $OSTYPE"
fi

echo "🔄 The database will be recreated with the correct schema when you run the app next time."