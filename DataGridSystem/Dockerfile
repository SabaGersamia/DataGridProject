# Use .NET SDK 8.0 for development
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS development

WORKDIR /app

# Install dotnet-ef tool to run migrations
RUN dotnet tool install --global dotnet-ef

# Add dotnet tools to PATH
ENV PATH="${PATH}:/root/.dotnet/tools"

# Copy the project file and restore dependencies
COPY *.csproj ./
RUN dotnet restore

# Copy the entire source code to the container
COPY . . 

# Build the application
RUN dotnet build -c Release

# Publish the application to the /app/publish directory
RUN dotnet publish -c Release -o /app/publish

# Set environment variables for development
ENV ASPNETCORE_ENVIRONMENT=Development
ENV DOTNET_USE_POLLING_FILE_WATCHER=1

# Apply migrations to PostgreSQL (Optional, if needed)
# RUN dotnet ef database update

# Expose the application port
EXPOSE 8080

# Start the application
CMD ["dotnet", "/app/publish/DataGridSystem.dll"]
