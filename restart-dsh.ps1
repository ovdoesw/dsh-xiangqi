<#
  restart-dsh.ps1 — 重启 DSH web 并重新加载 dsh-xiangqi 插件

  用法：在 PowerShell 中运行
      .\restart-dsh.ps1

  它做什么：
    1. 停止占用 3080 端口的 DSH 进程
    2. 停止残留的 dsh node 进程
    3. 重新启动 DSH web（后台，日志写入本目录）
    4. 轮询等待启动，并验证 dsh-xiangqi 是否被注入 boot graph / bundle 是否可访问
#>

$ErrorActionPreference = 'Continue'
$scriptDir = $PSScriptRoot
$binJs     = "E:\nodejs\node_cache\_npx\1e7f6d9597241db0\node_modules\@deepseek-ai\dsh\lib\bin.js"
$outLog    = Join-Path $scriptDir 'dsh-restart.out.log'
$errLog    = Join-Path $scriptDir 'dsh-restart.err.log'
$port      = 3080
$url       = "http://127.0.0.1:$port"

Write-Host "`n=================================================" -ForegroundColor Cyan
Write-Host "  DSH 重启脚本 - 重新加载 dsh-xiangqi 插件"
Write-Host "=================================================" -ForegroundColor Cyan

# ---------- 1. 停止占用端口的进程 ----------
Write-Host "`n[1/4] 停止占用 ${port} 端口的进程..." -ForegroundColor Yellow
$conns = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
if ($conns) {
    foreach ($c in $conns) {
        $owner = $c.OwningProcess
        try {
            $p = Get-Process -Id $owner -ErrorAction Stop
            Write-Host ("  停止 PID {0} ({1})" -f $owner, $p.ProcessName)
            Stop-Process -Id $owner -Force
        } catch {
            Write-Host "  PID $owner 已不存在"
        }
    }
} else {
    Write-Host "  ${port} 无监听进程（可能已崩溃）"
}

# ---------- 2. 停止残留 dsh 进程 ----------
Write-Host "`n[2/4] 停止残留的 dsh node 进程..." -ForegroundColor Yellow
$found = $false
Get-CimInstance Win32_Process -Filter "name like 'node%'" -ErrorAction SilentlyContinue |
    Where-Object { $_.CommandLine -match 'dsh' } |
    ForEach-Object {
        $found = $true
        Write-Host "  停止 PID $($_.ProcessId)"
        Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue
    }
if (-not $found) { Write-Host "  无残留 dsh 进程" }

# ---------- 3. 等待端口释放 ----------
Write-Host "`n[3/4] 等待端口释放..." -ForegroundColor Yellow
for ($i = 0; $i -lt 10; $i++) {
    Start-Sleep -Milliseconds 500
    if (-not (Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue)) { break }
}

# ---------- 4. 启动 DSH ----------
Write-Host "`n[4/4] 启动 DSH web..." -ForegroundColor Yellow
if (-not (Test-Path $binJs)) {
    Write-Host "  X 找不到 bin.js: $binJs" -ForegroundColor Red
    Write-Host "  请手动运行: dsh web" -ForegroundColor Red
    exit 1
}

# 清空旧日志
Remove-Item $outLog, $errLog -ErrorAction SilentlyContinue

Write-Host "  命令: node $binJs web"
Write-Host "  stdout -> $outLog"
Write-Host "  stderr -> $errLog"

# 解析 node 可执行文件（优先 PATH，回退到已知位置）
$nodeExe = (Get-Command node -ErrorAction SilentlyContinue).Source
if (-not $nodeExe) { $nodeExe = "F:\java\node\node.exe" }
if (-not (Test-Path $nodeExe)) {
    Write-Host "  X 找不到 node 可执行文件" -ForegroundColor Red
    exit 1
}
Write-Host "  node: $nodeExe"

$proc = Start-Process -FilePath $nodeExe -ArgumentList @($binJs, "web") `
    -WorkingDirectory $scriptDir `
    -RedirectStandardOutput $outLog `
    -RedirectStandardError $errLog `
    -WindowStyle Hidden -PassThru

Write-Host "  已启动 PID $($proc.Id)"

# ---------- 5. 等待启动并验证 ----------
Write-Host "`n等待 DSH 启动（最多 40 秒）..."
$ok = $false
for ($i = 0; $i -lt 40; $i++) {
    Start-Sleep -Seconds 1
    if ($proc.HasExited) {
        Write-Host "  进程提前退出 (exit $($proc.ExitCode))" -ForegroundColor Red
        break
    }
    try {
        $r = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 2
        if ($r.StatusCode -eq 200) { $ok = $true; break }
    } catch {}
}

Write-Host ""
if ($ok) {
    Write-Host "[OK] DSH 已启动: $url" -ForegroundColor Green

    # 验证插件注入 boot graph
    try {
        $html = (Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 5).Content
        if ($html -match 'dsh-xiangqi') {
            Write-Host "[OK] 插件已注入 boot graph" -ForegroundColor Green
        } else {
            Write-Host "[!!] 插件未注入 boot graph" -ForegroundColor Red
        }
    } catch {
        Write-Host "[!!] 读取 index.html 失败" -ForegroundColor Red
    }

    # 验证 bundle 端点
    try {
        $b = Invoke-WebRequest -Uri "$url/plugins/@deepseek-ai/dsh-xiangqi/client.js" -UseBasicParsing -TimeoutSec 5
        Write-Host "[OK] client bundle 可访问 (HTTP $($b.StatusCode), $($b.Content.Length) bytes)" -ForegroundColor Green
    } catch {
        Write-Host "[!!] client bundle 不可访问" -ForegroundColor Red
    }

    Write-Host ""
    Write-Host "  >> 请刷新浏览器 $url ，看右下角是否出现抱'象'字的小宠物。" -ForegroundColor Cyan
    Write-Host "  >> 若仍未出现，请查看浏览器 Console 和下面日志：" -ForegroundColor Cyan
    Write-Host "     $errLog" -ForegroundColor Cyan
} else {
    Write-Host "[!!] DSH 启动失败或超时" -ForegroundColor Red
}

# 打印日志尾部（无论成败都看）
Write-Host ""
if (Test-Path $errLog) {
    $errTail = Get-Content $errLog -Tail 40
    if ($errTail) {
        Write-Host "--- stderr 尾部 ---" -ForegroundColor Red
        $errTail | ForEach-Object { Write-Host $_ -ForegroundColor Red }
    }
}
if (Test-Path $outLog) {
    $outTail = Get-Content $outLog -Tail 15
    if ($outTail) {
        Write-Host "--- stdout 尾部 ---" -ForegroundColor Yellow
        $outTail | ForEach-Object { Write-Host $_ -ForegroundColor Yellow }
    }
}
Write-Host ""
