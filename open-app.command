#!/bin/bash
# Guardian Pay - Double click to launch the application
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$DIR"

echo "=================================================="
echo "          Launching Guardian Pay                  "
echo "=================================================="
echo ""
echo "Starting local server at http://localhost:3000..."
echo "Opening browser in 3 seconds..."

# Open browser after short delay
(sleep 3 && open "http://localhost:3000") &

# Start Next.js development server
npm run dev

