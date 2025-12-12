# build_suggested.ps1
Write-Host "Building all ISL sentences..."

$sentmap = "video-pipeline/sentences_isl_mapping.json"
$wordsRoot = "video-pipeline/words"
$outDir = "video-pipeline/output/sentences"

if (!(Test-Path $outDir)) {
    New-Item -ItemType Directory -Path $outDir | Out-Null
}

# Load sentences JSON
$sentences = Get-Content $sentmap | ConvertFrom-Json

foreach ($s in $sentences) {
    $id = $s.id
    Write-Host "---- Building sentence $id ----"

    $cmd = "python video-pipeline/merge_sentence.py --sentmap $sentmap --id $id --words-root $wordsRoot --out-dir $outDir"

    $result = cmd.exe /c $cmd

    if ($LASTEXITCODE -ne 0) {
        Write-Host "Sentence $id skipped/failed (exit $LASTEXITCODE)."
    } else {
        Write-Host "Sentence $id built successfully."
    }
}
