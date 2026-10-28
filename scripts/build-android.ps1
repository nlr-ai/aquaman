$ErrorActionPreference = 'Stop'
Set-Location (Split-Path $PSScriptRoot -Parent)
if (!$env:JAVA_HOME) { $env:JAVA_HOME = 'C:\Program Files\Android\Android Studio\jbr' }
if (!$env:ANDROID_HOME) { $env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk" }
function Checked([string]$Command, [string[]]$Arguments) {
    & $Command @Arguments
    if ($LASTEXITCODE -ne 0) { throw "$Command failed ($LASTEXITCODE)" }
}
# Native apps require the remote backend; never package local development endpoints.
if (!(Test-Path '.env.local') -or !(Select-String -Path '.env.local' -Pattern '^VITE_DATA_BACKEND=supabase\s*$' -Quiet)) { throw 'Configure Supabase in .env.local first (see .env.example).' }
Checked 'npm.cmd' @('run', 'android:sync')
Push-Location android
try { Checked '.\gradlew.bat' @('assembleRelease') } finally { Pop-Location }
$signing = Join-Path (Get-Location) 'data/android-signing'
New-Item -ItemType Directory -Force $signing | Out-Null
$key = Join-Path $signing 'aquaman-release.jks'
$password = Join-Path $signing 'password.txt'
if (!(Test-Path $key)) {
    if (Test-Path $password) { throw 'Incomplete signing setup: inspect existing password file.' }
    $bytes = New-Object byte[] 48
    $rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
    $rng.GetBytes($bytes)
    $rng.Dispose()
    $secret = [Convert]::ToBase64String($bytes)
    [System.IO.File]::WriteAllText($password, $secret)
    Checked "$env:JAVA_HOME/bin/keytool.exe" @('-genkeypair','-keystore',$key,'-storepass:file',$password,'-keypass:file',$password,'-alias','aquaman','-keyalg','RSA','-keysize','3072','-validity','10000','-dname','CN=Aquaman Android, O=Aquaman')
}
$tools = Join-Path $env:ANDROID_HOME 'build-tools/36.0.0'
$output = Join-Path (Get-Location) 'data/android-release'
New-Item -ItemType Directory -Force $output | Out-Null
$apk = Join-Path $output 'aquaman-1.0.0-pilot.1.apk'
$aligned = Join-Path $output 'aligned.apk'
Checked "$tools/zipalign.exe" @('-f','-p','4','android/app/build/outputs/apk/release/app-release-unsigned.apk',$aligned)
Checked "$tools/apksigner.bat" @('sign','--ks',$key,'--ks-key-alias','aquaman','--ks-pass',"file:$password",'--out',$apk,$aligned)
Checked "$tools/apksigner.bat" @('verify','--verbose','--print-certs',$apk)
$hash = (Get-FileHash $apk -Algorithm SHA256).Hash.ToLowerInvariant()
[System.IO.File]::WriteAllText("$apk.sha256", "$hash  $([System.IO.Path]::GetFileName($apk))`n")
Write-Output "APK: $apk"
Write-Output 'Back up data/android-signing privately; the same key is required for updates.'
