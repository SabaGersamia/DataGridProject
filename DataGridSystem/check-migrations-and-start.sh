#!/bin/sh

echo "Applying migrations (if needed)..."
dotnet ef migrations add InitialCreate && dotnet ef database update || { echo "Failed to apply migrations.";}

# Start the application
echo "Starting the application..."
exec dotnet /app/publish/DataGridSystem.dll