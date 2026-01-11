<#
.SYNOPSIS
    Raya Home Services - Development Startup Script
    ASCII Version to avoid encoding issues.
#>

$ErrorActionPreference = "Continue"

# --- Configuration ---
$PortsToCheck = @(3000, 5001, 27017)
$LogDir = "logs"
$BackendPort = 5000
$FrontendPort = 5001
$MongoPort = 27017

# Get Local IP (Trying to find the primary Wi-Fi/Ethernet IP)
$IPs = Get-NetIPAddress -AddressFamily IPv4 | Where-Object { 
    $_.InterfaceAlias -notlike "*Loopback*" -and 
    $_.IPv4Address -notlike "169.254.*" -and
    $_.InterfaceAlias -notlike "*vEthernet*" -and
    $_.InterfaceAlias -notlike "*Docker*" 
}
$LocalIP = ($IPs | Select-Object -First 1).IPv4Address
if (-not $LocalIP) { $LocalIP = "localhost" }

# --- Colors ---
function Write-Green($msg) { Write-Host $msg -ForegroundColor Green }
function Write-Yellow($msg) { Write-Host $msg -ForegroundColor Yellow }
function Write-Red($msg) { Write-Host $msg -ForegroundColor Red }
function Write-Blue($msg) { Write-Host $msg -ForegroundColor Cyan }

# --- Helpers ---

function Kill-Port {
    param([int]$port)
    $conn = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
    if ($conn) {
        Write-Yellow "-> Cleaning port $port..."
        foreach ($c in $conn) {
            try {
                Stop-Process -Id $c.OwningProcess -Force -ErrorAction SilentlyContinue
            }
            catch {}
        }
        Start-Sleep -Milliseconds 500
    }
}

function Wait-For-Port {
    param([int]$port, [string]$name)
    Write-Yellow ".. Waiting for $name (Port $port)..."
    $retries = 0
    while ($retries -lt 30) {
        # Using 127.0.0.1 explicitly to avoid IPv6/localhost issues
        $check = Test-NetConnection -ComputerName 127.0.0.1 -Port $port -WarningAction SilentlyContinue -InformationLevel Quiet
        if ($check) {
            Write-Green "OK $name is ready!"
            return $true
        }
        Start-Sleep -Seconds 1
        $retries++
    }
    Write-Red "!! Timeout waiting for $name"
    return $false
}

# --- Main ---

Clear-Host
Write-Green "======================================================"
Write-Green ">> Raya Home Services - Development Launcher"
Write-Green "======================================================"

if (-not (Test-Path $LogDir)) { New-Item -ItemType Directory -Path $LogDir | Out-Null }

Write-Blue ":: Step 1: Cleaning Ports"
foreach ($p in $PortsToCheck) { Kill-Port $p }
Write-Green "OK Ports clean."

Write-Blue ":: Step 2: MongoDB Check"
$MongoLive = Test-NetConnection -ComputerName localhost -Port $MongoPort -WarningAction SilentlyContinue -InformationLevel Quiet
if (-not $MongoLive) {
    Write-Yellow "   MongoDB not detected. Attempting to find mongod.exe..."
    $ProgFiles = "C:\Program Files\MongoDB\Server"
    if (Test-Path $ProgFiles) {
        $exe = Get-ChildItem -Path $ProgFiles -Filter "mongod.exe" -Recurse -ErrorAction SilentlyContinue | Select-Object -First 1
        if ($exe) {
            Write-Green "   Found: $($exe.FullName)"
            if (-not (Test-Path "data\db")) { New-Item -ItemType Directory -Path "data\db" | Out-Null }
            $MongoProc = Start-Process -FilePath $exe.FullName -ArgumentList "--dbpath data\db --port $MongoPort" -PassThru -WindowStyle Minimized
            Wait-For-Port $MongoPort "MongoDB"
        }
        else {
            Write-Red "   !! Could not find MongoDB. Please start it manually."
        }
    }
    else {
        Write-Red "   !! MongoDB folder not found. Please start it manually."
    }
}
else {
    Write-Green "OK MongoDB is running."
}

Write-Blue ":: Step 3: Starting Backend"
Write-Yellow ">> Starting Backend on Port $BackendPort..."
$BEnv = "set PORT=$BackendPort && npm run dev > $LogDir\backend.log 2>&1"
$BackendProc = Start-Process -FilePath "cmd.exe" -ArgumentList "/c $BEnv" -PassThru -WindowStyle Minimized
Wait-For-Port $BackendPort "Backend"

Write-Blue ":: Step 4: Starting Frontend"
Write-Yellow ">> Starting Frontend on Port $FrontendPort..."
if (-not (Test-Path "public\index.html") -and (Test-Path "public\pro!.html")) {
    Copy-Item "public\pro!.html" -Destination "public\index.html"
}
$FEnv = "npx serve public -p $FrontendPort -l tcp://0.0.0.0 > $LogDir\frontend.log 2>&1"
$FrontendProc = Start-Process -FilePath "cmd.exe" -ArgumentList "/c $FEnv" -PassThru -WindowStyle Minimized

Write-Green "======================================================"
Write-Green "OK All services started."
Write-Host "   - Frontend (Local):  http://localhost:$FrontendPort"
Write-Host "   - Backend (Local):   http://localhost:$BackendPort"
Write-Host ""
Write-Blue "   - Mobile Access (Wifi):"
Write-Host "     Frontend: http://$($LocalIP):$FrontendPort"
Write-Host "     Backend:  http://$($LocalIP):$BackendPort"
Write-Green "======================================================"
Write-Yellow ">> Press ENTER to stop all and exit."
Read-Host

Write-Yellow "Shutting down..."
if ($BackendProc -and -not $BackendProc.HasExited) { Stop-Process -Id $BackendProc.Id -Force }
if ($FrontendProc -and -not $FrontendProc.HasExited) { Stop-Process -Id $FrontendProc.Id -Force }
if ($MongoProc -and -not $MongoProc.HasExited) { Stop-Process -Id $MongoProc.Id -Force }
foreach ($p in @($BackendPort, $FrontendPort)) { Kill-Port $p }
Write-Green "OK Shutdown complete."
