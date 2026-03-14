# Build Stage
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /source

# Copy csproj and restore as distinct layers
COPY ["FoodCare.API.csproj", "./"]
RUN dotnet restore "FoodCare.API.csproj"

# Copy everything else and build app
COPY . .
RUN dotnet publish "FoodCare.API.csproj" -c Release -o /app

# Final Stage
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
COPY --from=build /app .

# Expose the port the app runs on
EXPOSE 8080
ENV ASPNETCORE_URLS=http://+:8080

ENTRYPOINT ["dotnet", "FoodCare.API.dll"]
