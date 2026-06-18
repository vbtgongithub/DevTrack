# DevTrack Development Environment Starter
# Usage: .\start-dev.ps1

param(
    [switch]$SkipDocker,
    [switch]$StopAll,
    [switch]$ShowStatus
)

$ErrorActionPreference = "Continue"
$ProjectRoot = $PSScriptRoot

function Write-Banner {
    param([string]$Text)
    Write-Host ""
    Write-Host "============================================" -ForegroundColor Cyan
    Write-Host " $Text" -ForegroundColor Cyan
    Write-Host "============================================" -ForegroundColor Cyan
}

function Write-Success {
    param([string]$Text)
    Write-Host "[OK] $Text" -ForegroundColor Green
}

function Write-Info {
    param([string]$Text)
    Write-Host "[INFO] $Text" -ForegroundColor Yellow
}

function Write-Error {
    param([string]$Text)
    Write-Host "[ERROR] $Text" -ForegroundColor Red
}

function Write-Warn {
    param([string]$Text)
    Write-Host "[WARN] $Text" -ForegroundColor Magenta
}

function Get-DockerComposeCommand {
    if (Get-Command docker -ErrorAction SilentlyContinue) {
        return @('docker', 'compose')
    }

    if (Get-Command docker-compose -ErrorAction SilentlyContinue) {
        return @('docker-compose')
    }

    return $null
}

function Invoke-DockerCompose {
    param([string[]]$Arguments)

    $dockerCommand = Get-DockerComposeCommand
    if (-not $dockerCommand) {
        throw "Docker CLI was not found on PATH. Start Docker Desktop and retry."
    }

    if ($dockerCommand.Count -eq 2) {
        return & $dockerCommand[0] $dockerCommand[1] @Arguments 2>&1
    }

    return & $dockerCommand[0] @Arguments 2>&1
}

# Stop all services
if ($StopAll) {
    Write-Banner "Stopping All Services"

    Write-Info "Stopping node processes..."
    taskkill /F /IM node.exe /T 2>$null

    if (-not $SkipDocker) {
        Write-Info "Stopping Docker containers..."
        try {
            Invoke-DockerCompose -Arguments @('down', '--remove-orphans') | Out-Null
        } catch {
            Write-Warn "Docker shutdown command failed: $($_.Exception.Message)"
        }
    }

    Write-Success "All services stopped"
    exit 0
}

# Show status
if ($ShowStatus) {
    Write-Banner "DevTrack Service Status"

    # Node processes
    Write-Host "`nDevTrack Processes:" -ForegroundColor Magenta
    $nodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue
    if ($nodeProcesses) {
        foreach ($proc in $nodeProcesses) {
            $port = "unknown"
            $port = switch -Regex ($proc.Id) {
                # Try to find ports from process info
                default { "running" }
            }
            Write-Host "  PID $($proc.Id) - $port"
        }
    } else {
        Write-Host "  No node processes running" -ForegroundColor DarkGray
    }

    # Ports
    Write-Host "`nPort Status:" -ForegroundColor Magenta
    $frontendPort = if ((Get-NetTCPConnection -LocalPort 5173 -ErrorAction SilentlyContinue).Count -gt 0) { 'In Use' } else { 'Free' }
    $frontendPortAlt = if ((Get-NetTCPConnection -LocalPort 5174 -ErrorAction SilentlyContinue).Count -gt 0) { 'In Use' } else { 'Free' }
    Write-Host "  Frontend: $frontendPort (5173), $frontendPortAlt (5174)"
    $backendPort = if ((Get-NetTCPConnection -LocalPort 3001 -ErrorAction SilentlyContinue).Count -gt 0) { 'In Use' } else { 'Free' }
    Write-Host "  Backend:  $backendPort (3001)"
    $mongoPort = if ((Get-NetTCPConnection -LocalPort 27017 -ErrorAction SilentlyContinue).Count -gt 0) { 'In Use' } else { 'Free' }
    Write-Host "  MongoDB:  $mongoPort (27017)"

    # Check connectivity
    Write-Host "`nService Connectivity:" -ForegroundColor Magenta

    # Backend health
    try {
        $health = Invoke-WebRequest -Uri "http://localhost:3001/health" -UseBasicParsing -TimeoutSec 3 -ErrorAction Stop
        $healthJson = $health.Content | ConvertFrom-Json
        $degraded = if ($healthJson.degraded) { " (DEGRADED)" } else { "" }
        Write-Host "  Backend:   Connected$degraded" -ForegroundColor Green
    } catch {
        Write-Host "  Backend:   Not Reachable" -ForegroundColor Red
    }

    # MongoDB connectivity
    try {
        $mongoCheck = New-Object System.Net.Sockets.TcpClient
        $mongoCheck.Connect("localhost", 27017)
        $mongoCheck.Close()
        Write-Host "  MongoDB:   Connected" -ForegroundColor Green
    } catch {
        Write-Host "  MongoDB:   Not Reachable" -ForegroundColor Red
    }

    # Docker containers
    Write-Host "`nDocker Containers:" -ForegroundColor Magenta
    docker ps --filter "name=devtrack" --format "table {{.Names}}\t{{.Status}}" 2>$null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "  Docker not available or not running" -ForegroundColor DarkGray
    }

    exit 0
}

# Kill any existing DevTrack processes to avoid port conflicts
Write-Banner "Checking for Existing Processes"
$existingProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue
if ($existingProcesses) {
    Write-Info "Stopping $(@($existingProcesses).Count) existing node process(es)..."
    taskkill /F /IM node.exe /T 2>$null
    Start-Sleep -Seconds 2
    Write-Success "Cleaned up existing processes"
}

# Start all services
Write-Banner "DevTrack Development Environment"

# Step 1: Docker (MongoDB + Redis)
if (-not $SkipDocker) {
    Write-Info "Checking Docker..."
    $dockerRunning = $false
    try {
        $null = docker info 2>$null
        $dockerRunning = $true
    } catch {}

    if (-not $dockerRunning) {
        Write-Host ""
        Write-Warn "Docker is not running!"
        Write-Host "  Option 1: Start Docker Desktop and run this script again"
        Write-Host "  Option 2: Run with -SkipDocker if MongoDB is installed locally"
        Write-Host ""

        $continue = Read-Host "Continue without Docker? Backend will run in DEGRADED mode without MongoDB. (y/N)"
        if ($continue -ne 'y' -and $continue -ne 'Y') {
            exit 0
        }
        $SkipDocker = $true
    }

    if (-not $SkipDocker) {
        Write-Success "Docker is running"

        Write-Info "Starting MongoDB and Redis containers..."
        $dockerOutput = Invoke-DockerCompose -Arguments @('up', '-d', 'mongo', 'redis') 2>&1
        if ($LASTEXITCODE -ne 0) {
            Write-Warn "Docker compose failed: $dockerOutput"
            Write-Host "Trying to continue anyway..."
            $SkipDocker = $true
        } else {
            Write-Info "Waiting for MongoDB to be healthy..."
            $maxRetries = 30
            $retry = 0
            while ($retry -lt $maxRetries) {
                $status = docker inspect --format='{{.State.Health.Status}}' devtrack-mongodb 2>$null
                if ($status -eq "healthy") {
                    Write-Success "MongoDB is ready"
                    break
                }
                Write-Info "Waiting for MongoDB... ($($retry + 1)/$maxRetries)"
                Start-Sleep -Seconds 2
                $retry++
            }
            if ($retry -eq $maxRetries) {
                Write-Warn "MongoDB health check timed out. Starting services anyway..."
                Start-Sleep -Seconds 2
            }

            Write-Info "Waiting for Redis to be ready..."
            Start-Sleep -Seconds 2
            Write-Success "Redis should be ready"
        }
    }
}

# Step 2: Install dependencies if needed
Write-Banner "Preparing Dependencies"
$rootHasModules = Test-Path (Join-Path $ProjectRoot "node_modules")
$backendHasModules = Test-Path (Join-Path $ProjectRoot "backend\node_modules")
$frontendHasModules = Test-Path (Join-Path $ProjectRoot "frontend\node_modules")
$orchestratorHasModules = Test-Path (Join-Path $ProjectRoot "dev-orchestrator\node_modules")

if (-not ($rootHasModules -and $backendHasModules -and $frontendHasModules -and $orchestratorHasModules)) {
    Write-Info "Installing workspace dependencies..."
    Push-Location $ProjectRoot
    npm run install-all 2>$null
    Pop-Location
}

# Step 3: Backend
Write-Banner "Starting Backend"
Write-Info "Starting backend server (http://localhost:3001)..."
Push-Location $ProjectRoot
Start-Process -FilePath "cmd.exe" -ArgumentList "/c npm run dev:backend" -NoNewWindow -PassThru | Out-Null
Pop-Location

# Wait for backend to be ready
Write-Info "Waiting for backend to start..."
$maxRetries = 30
$retry = 0
$backendStarted = $false
while ($retry -lt $maxRetries) {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3001/health" -UseBasicParsing -TimeoutSec 2 -ErrorAction SilentlyContinue
        if ($response.StatusCode -eq 200) {
            $backendStarted = $true
            Write-Success "Backend is ready"
            break
        }
    } catch {}
    Start-Sleep -Seconds 1
    $retry++
}
if (-not $backendStarted) {
    Write-Warn "Backend may still be starting up or is unreachable..."
}

# Step 4: Workers
Write-Banner "Starting Background Workers"
Write-Info "Starting BullMQ / background workers..."
Push-Location $ProjectRoot
Start-Process -FilePath "cmd.exe" -ArgumentList "/c npm run dev:workers" -NoNewWindow -PassThru | Out-Null
Pop-Location

# Step 5: Frontend
Write-Banner "Starting Frontend"
Write-Info "Starting frontend server..."
Push-Location $ProjectRoot
Start-Process -FilePath "cmd.exe" -ArgumentList "/c npm run dev:frontend" -NoNewWindow -PassThru | Out-Null
Pop-Location

# Wait for frontend to be ready
Write-Info "Waiting for frontend to start..."
Start-Sleep -Seconds 5
$retry = 0
$frontendPort = 5173
while ($retry -lt 10) {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:$frontendPort" -UseBasicParsing -TimeoutSec 2 -ErrorAction SilentlyContinue
        if ($response.StatusCode -eq 200) {
            Write-Success "Frontend is ready at http://localhost:$frontendPort"
            break
        }
    } catch {}
    $frontendPort++
    $retry++
}
if ($retry -eq 10) {
    Write-Warn "Frontend may still be starting..."
    $frontendPort = "5173+"
}

# Final connectivity check
Write-Banner "Connectivity Check"
$allHealthy = $true

# Backend check
try {
    $health = Invoke-WebRequest -Uri "http://localhost:3001/health" -UseBasicParsing -TimeoutSec 3 -ErrorAction Stop
    $healthJson = $health.Content | ConvertFrom-Json
    if ($healthJson.degraded) {
        Write-Warn "Backend is running in DEGRADED mode"
        Write-Host "  Degraded components: $($healthJson.degradedComponents -join ', ')"
        $allHealthy = $false
    } else {
        Write-Success "Backend: Healthy"
    }
} catch {
    Write-Error "Backend: Not reachable at http://localhost:3001"
    $allHealthy = $false
}

# MongoDB check (only if not skipped)
if (-not $SkipDocker) {
    try {
        $mongoCheck = New-Object System.Net.Sockets.TcpClient
        $mongoCheck.Connect("localhost", 27017)
        $mongoCheck.Close()
        Write-Success "MongoDB: Connected"
    } catch {
        Write-Error "MongoDB: Not reachable at localhost:27017"
        Write-Host "  Make sure Docker is running with MongoDB container"
        $allHealthy = $false
    }
}

# Done!
Write-Banner "DevTrack is Running!"
Write-Host ""
Write-Host "  Frontend:  http://localhost:$frontendPort" -ForegroundColor Green
Write-Host "  Backend:   http://localhost:3001" -ForegroundColor Green
Write-Host "  Workers:   background BullMQ workers (started with npm run dev:workers)" -ForegroundColor Green
Write-Host "  MongoDB:   mongodb://localhost:27017/devtrack" -ForegroundColor Green
Write-Host "  Redis:     redis://localhost:6379" -ForegroundColor Green
Write-Host ""

if (-not $allHealthy) {
    Write-Warn "Some services are not healthy. Run .\start-dev.ps1 -ShowStatus for details"
    Write-Host ""
}

Write-Host "Press Ctrl+C to stop all services" -ForegroundColor Cyan
Write-Host "Or run: .\start-dev.ps1 -StopAll" -ForegroundColor Cyan
Write-Host "Check status: .\start-dev.ps1 -ShowStatus" -ForegroundColor Cyan
Write-Host ""

# Wait for user interrupt
try {
    while ($true) { Start-Sleep -Seconds 1 }
} finally {
    Write-Host "`nShutting down..."
}