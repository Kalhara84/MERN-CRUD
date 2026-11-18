# Optional Windows development database, isolated from WAMP's existing databases.
$projectRoot = Split-Path -Parent $PSScriptRoot
$mysqlBinary = 'C:/wamp64/bin/mysql/mysql5.7.26/bin/mysqld.exe'
$mysqlData = Join-Path $projectRoot '.local-mysql/data'
if (-not (Test-Path -LiteralPath $mysqlBinary)) { throw 'MySQL was not found. Start your own MySQL server and configure backend/.env.' }
if (-not (Test-Path -LiteralPath (Join-Path $mysqlData 'mysql'))) { throw 'The local database has not been initialized. See README.md for normal MySQL setup.' }
$mysqlArguments = @('--no-defaults', '--standalone', '--log_syslog=0', '--explicit_defaults_for_timestamp', '--bind-address=127.0.0.1', '--port=3307', '--basedir="C:/wamp64/bin/mysql/mysql5.7.26"', "--datadir=`"$mysqlData`"")
Start-Process -FilePath $mysqlBinary -ArgumentList $mysqlArguments -WindowStyle Hidden
Write-Output 'Local MySQL starting on 127.0.0.1:3307.'
