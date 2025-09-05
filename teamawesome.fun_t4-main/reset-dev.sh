if [ ! -f ./backend/.env ]; then
  echo "❌ Missing ./backend/.env file! Aborting."
  exit 1
fi

#!/bin/bash

echo "🛑 Stopping and removing containers + volumes..."
docker-compose down -v

echo "🧹 Pruning all unused Docker volumes..."
docker volume prune -f

echo "🚀 Rebuilding and restarting all services..."
docker-compose up --build