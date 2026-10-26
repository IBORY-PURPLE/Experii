param(
    [Parameter(Mandatory)][string[]]$Brief,
    [ValidateSet('auto', 'acceptEdits', 'default', 'plan')][string]$Mode = 'auto'
)
$ErrorActionPreference = 'Stop'

foreach ($b in $Brief) {
    $path = (Resolve-Path -LiteralPath $b).Path
    $slug = [IO.Path]::GetFileNameWithoutExtension($path)
    if ($slug -notmatch '^[a-z0-9][a-z0-9-]*$') { throw "브리프 파일 이름은 영문 소문자·숫자·하이픈만: $slug" }

    # 브리프 본문을 인자로 넘기면 줄바꿈·따옴표가 깨질 수 있어 경로만 넘긴다
    $prompt = "/pstack:poteto-mode 브리프 파일 $path 을 읽고 그 완료 조건을 만족할 때까지 수행해. " +
              "결정 로그는 이 worktree의 .audit/$slug.tsv 에 남겨. push·PR·main 병합은 하지 마."

    Write-Host "spawn: $slug"
    claude --bg -w $slug -n $slug --permission-mode $Mode $prompt
}
