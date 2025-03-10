FROM node:18 AS frontend-build
WORKDIR /src
COPY data-grid-system/package.json data-grid-system/package-lock.json ./data-grid-system/
RUN cd data-grid-system && npm install
COPY data-grid-system ./data-grid-system
RUN cd data-grid-system && npm run build

# Build the backend
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS backend-build
WORKDIR /src
COPY DataGridSystem/DataGridSystem.csproj ./DataGridSystem/
RUN dotnet restore "./DataGridSystem/DataGridSystem.csproj"
COPY . .
RUN dotnet build "./DataGridSystem/DataGridSystem.csproj" -c Release -o /app/build

# Publish the backend
FROM backend-build AS backend-publish
RUN dotnet publish "./DataGridSystem/DataGridSystem.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app

COPY --from=backend-publish /app/publish .

COPY --from=frontend-build /src/data-grid-system/build ./wwwroot

# Set the entry point
ENTRYPOINT ["dotnet", "DataGridSystem.dll"]