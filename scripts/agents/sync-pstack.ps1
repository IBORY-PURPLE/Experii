param(
    [string]$Marketplace = "$env:USERPROFILE\.claude\plugins\marketplaces\cursor-plugins"
)
$ErrorActionPreference = 'Stop'

# 클라우드 세션은 플러그인을 설치하지 않아서 pstack을 레포에 복사해 둔다
$root = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$src = Join-Path $Marketplace 'harness\pstack\claude-code'
$dst = Join-Path $root '.agents\pstack'
if (-not (Test-Path (Join-Path $src 'plugin.json'))) { throw "pstack 생성 트리가 없다: $src" }

$version = (Get-Content (Join-Path $src 'plugin.json') -Raw | ConvertFrom-Json).version
$sha = git -C $Marketplace rev-parse HEAD

robocopy $src $dst /MIR /XF .in_use /NFL /NDL /NJH /NJS | Out-Null
if ($LASTEXITCODE -ge 8) { throw "robocopy 실패: $LASTEXITCODE" }
Copy-Item (Join-Path $dst 'agents\poteto-agent.md'), (Join-Path $dst 'agents\comment-sicko.md') (Join-Path $root '.claude\agents') -Force
"pstack $version`ncursor/plugins@$sha harness/pstack/claude-code`n" | Set-Content -NoNewline -Encoding utf8 (Join-Path $dst 'VERSION')

Write-Host "pstack $version ($sha)"
git -C $root status --short -- .agents/pstack .claude/agents
