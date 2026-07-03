param (
    [Parameter(Mandatory=$true)]
    [string]$IP,

    [Parameter(Mandatory=$false)]
    [string]$Domain,

    [Parameter(Mandatory=$false)]
    [string]$SSHKeyPath
)

$ErrorActionPreference = "Stop"

# Determine API URL
if ($Domain) {
    # Remove protocol prefix if user accidentally included it
    $cleanDomain = $Domain -replace "^https?://", ""
    $apiUrl = "https://$cleanDomain"
    Write-Host "Deploying with Domain: $cleanDomain (API URL: $apiUrl)" -ForegroundColor Cyan
} else {
    $apiUrl = "http://$IP"
    Write-Host "Deploying with IP: $IP (API URL: $apiUrl)" -ForegroundColor Cyan
}

# 1. Package the Codebase
Write-Host "Step 1: Packaging codebase (excluding build dirs, node_modules, etc.)..." -ForegroundColor Yellow

$tempDir = Join-Path $env:TEMP "kalindi_deploy"
if (Test-Path $tempDir) {
    Remove-Item -Recurse -Force $tempDir
}
New-Item -ItemType Directory -Path $tempDir | Out-Null

# Robocopy is built-in on Windows and handles exclusions perfectly
Write-Host "Running Robocopy to stage files..." -ForegroundColor Gray
$robocopyArgs = @(
    ".",
    "`"$tempDir`"",
    "/E",
    "/XD", ".git", ".next", "node_modules", ".venv", "terraform", "pgdata",
    "/XF", "deploy.zip", "database.db", "*.pyc", ".env", "setup_server.sh"
)
$process = Start-Process robocopy -ArgumentList $robocopyArgs -Wait -NoNewWindow -PassThru
# Robocopy exit codes 0-7 are successful copy operations
if ($process.ExitCode -gt 7) {
    Write-Error "Robocopy failed with exit code $($process.ExitCode)"
}

# Generate the server setup bash script dynamically
# Using single quotes @' ... '@ so PowerShell does not evaluate bash variables locally on Windows
$setupScriptContent = @'
#!/bin/bash
set -e

API_URL="$1"
echo "Starting deployment on server..."
echo "Target API URL: $API_URL"

# Ensure system packages are updated
echo "Updating package lists..."
apt-get update -y

# Check and install unzip
if ! command -v unzip &> /dev/null; then
    echo "Installing unzip..."
    apt-get install -y unzip
fi

# Check and install Docker + Compose plugin (if cloud-init hasn't finished yet)
if ! command -v docker &> /dev/null; then
    echo "Installing Docker..."
    apt-get install -y apt-transport-https ca-certificates curl software-properties-common
    mkdir -p /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
    apt-get update -y
    apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
    echo "Docker installed successfully!"
fi

# Ensure ubuntu user is in docker group
usermod -aG docker ubuntu || true

# Configure 4GB Swap Space if it doesn't exist (critical for Next.js builds on low-RAM VMs)
if [ ! -f /swapfile ]; then
    echo "Creating 4GB swap file to prevent Out of Memory crashes..."
    fallocate -l 4G /swapfile
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile
    echo '/swapfile none swap sw 0 0' >> /etc/fstab
    echo "Swap space configured!"
else
    echo "Swap space already configured."
fi

# Stop existing containers if running to release bind mounts
if [ -d /home/ubuntu/app ]; then
    echo "Stopping existing containers to release static uploads..."
    cd /home/ubuntu/app
    docker compose down --remove-orphans || true
    cd /home/ubuntu
fi

# Backup uploads if they exist to prevent deployment from deleting customer uploads
if [ -d /home/ubuntu/app/backend/static/uploads ]; then
    echo "Backing up uploaded images..."
    rm -rf /home/ubuntu/uploads_backup
    cp -r /home/ubuntu/app/backend/static/uploads /home/ubuntu/uploads_backup
fi

# Recreate application folder
echo "Extracting new application zip..."
rm -rf /home/ubuntu/app
mkdir -p /home/ubuntu/app
unzip -q /home/ubuntu/deploy.zip -d /home/ubuntu/app || true

# Restore uploads
if [ -d /home/ubuntu/uploads_backup ]; then
    echo "Restoring uploaded images..."
    rm -rf /home/ubuntu/app/backend/static/uploads
    cp -r /home/ubuntu/uploads_backup /home/ubuntu/app/backend/static/uploads
    rm -rf /home/ubuntu/uploads_backup
fi

# Ensure correct permissions on static and uploads directories
echo "Setting permissions on static files directory..."
chmod -R 755 /home/ubuntu/app/backend/static || true

# Place backend env file in both backend and root directory for Docker Compose build args
if [ -f /home/ubuntu/.env.backend ]; then
    cp /home/ubuntu/.env.backend /home/ubuntu/app/backend/.env
    cp /home/ubuntu/.env.backend /home/ubuntu/app/.env
    rm /home/ubuntu/.env.backend
    echo "Environment files loaded."
else
    echo "WARNING: /home/ubuntu/.env.backend not found!"
fi

# Ensure user permissions are correct
chown -R ubuntu:ubuntu /home/ubuntu/app

# Launch Docker Compose services
cd /home/ubuntu/app
echo "Running docker compose build and up..."
export API_URL="$API_URL"
docker compose up -d --build

# Cleanup setup artifacts
rm -f /home/ubuntu/deploy.zip
rm -f /home/ubuntu/setup_server.sh
echo "--------------------------------------------------------"
echo "Deployment Finished Successfully!"
echo "Your app is running and managed by Docker Compose."
echo "Access Frontend at: $API_URL"
echo "Access Backend API at: $API_URL/api"
echo "Access Docs at: $API_URL/docs"
echo "--------------------------------------------------------"
'@

# Write the shell script locally in the root directory so we can upload it directly
$setupScriptPath = "setup_server.sh"
[System.IO.File]::WriteAllText($setupScriptPath, $setupScriptContent, (New-Object System.Text.UTF8Encoding($false)))

# Compress the temp directory into deploy.zip
Write-Host "Creating deploy.zip..." -ForegroundColor Gray
if (Test-Path "deploy.zip") {
    Remove-Item "deploy.zip" -Force
}
Compress-Archive -Path "$tempDir\*" -DestinationPath "deploy.zip" -Force
Remove-Item -Recurse -Force $tempDir

# 2. Upload Files to VPS
Write-Host "Step 2: Copying files to AWS instance ($IP)..." -ForegroundColor Yellow

$sshArgs = @()
if ($SSHKeyPath) {
    $sshArgs += "-i", "`"$SSHKeyPath`""
}
$sshArgs += "-o", "StrictHostKeyChecking=no"

# Upload application zip
Write-Host "Uploading deploy.zip..." -ForegroundColor Gray
$scpArgs = $sshArgs + "deploy.zip", "ubuntu@${IP}:/home/ubuntu/deploy.zip"
Start-Process scp -ArgumentList $scpArgs -NoNewWindow -Wait

# Upload setup script
Write-Host "Uploading setup_server.sh..." -ForegroundColor Gray
$scpScriptArgs = $sshArgs + "setup_server.sh", "ubuntu@${IP}:/home/ubuntu/setup_server.sh"
Start-Process scp -ArgumentList $scpScriptArgs -NoNewWindow -Wait

# Upload backend .env file
if (Test-Path "backend\.env") {
    Write-Host "Uploading backend .env..." -ForegroundColor Gray
    $scpEnvArgs = $sshArgs + "backend\.env", "ubuntu@${IP}:/home/ubuntu/.env.backend"
    Start-Process scp -ArgumentList $scpEnvArgs -NoNewWindow -Wait
} else {
    Write-Host "WARNING: backend\.env file not found. Skipping .env upload." -ForegroundColor Red
}

# 3. Remote Setup Command
Write-Host "Step 3: Executing remote configuration script on AWS..." -ForegroundColor Yellow

$remoteCommand = "chmod +x /home/ubuntu/setup_server.sh && sudo bash /home/ubuntu/setup_server.sh '$apiUrl'"
$sshCommandArgs = $sshArgs + "ubuntu@${IP}", $remoteCommand

Write-Host "Connecting to SSH..." -ForegroundColor Gray
Start-Process ssh -ArgumentList $sshCommandArgs -NoNewWindow -Wait

# Cleanup local files
if (Test-Path "deploy.zip") {
    Remove-Item "deploy.zip" -Force
}
if (Test-Path "setup_server.sh") {
    Remove-Item "setup_server.sh" -Force
}

Write-Host "Done! Deployment process complete." -ForegroundColor Green
