# Use the SDK image to build the app
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
ARG BUILD_CONFIGURATION=Release
WORKDIR /src
COPY ["DataGridSystem/DataGridSystem.csproj", "DataGridSystem/"]
RUN dotnet restore "./DataGridSystem/DataGridSystem.csproj"
COPY . .
WORKDIR "/src/DataGridSystem"
RUN dotnet build "./DataGridSystem.csproj" -c $BUILD_CONFIGURATION -o /app/build

# Publish the app
FROM build AS publish
ARG BUILD_CONFIGURATION=Release
RUN dotnet publish "./DataGridSystem.csproj" -c $BUILD_CONFIGURATION -o /app/publish /p:UseAppHost=false

# Use the ASP.NET runtime image to run the app
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "DataGridSystem.dll"]