# Update all course index pages to have matching home-link and dashboard-link styles

$files = Get-ChildItem -Path "C:\Users\siva\Desktop\jtgroupofinstitution\public\courses\tamil" -Recurse -Filter "index.html" | Where-Object { $_.FullName -notlike "*components*" }

foreach ($file in $files) {
    Write-Host "Processing: $($file.FullName)"

    $content = Get-Content -Path $file.FullName -Raw

    # Replace logout-btn style with dashboard-link style (matching home-link)
    $content = $content -replace '\.logout-btn \{', '.dashboard-link {'
    $content = $content -replace '\.logout-btn:hover \{', '.dashboard-link:hover {'

    # Add dashboard-link to the same style as home-link
    $content = $content -replace '(\.home-link \{)', '$1
        .dashboard-link {'
    $content = $content -replace '(\.home-link:hover \{)', '$1
        .dashboard-link:hover {'

    # Make sure dashboard-link has same properties as home-link
    if ($content -match '\.dashboard-link \{[^}]+\}') {
        # Already has style, skip
    } else {
        # Add dashboard-link style after home-link:hover
        $content = $content -replace '(\.home-link:hover \{[^}]+\})', '$1
        .dashboard-link {
            color: white;
            text-decoration: none;
            font-size: 1.1rem;
            display: flex;
            align-items: center;
            gap: 5px;
            transition: opacity 0.3s;
            font-weight: 600;
        }
        .dashboard-link:hover {
            opacity: 0.8;
        }'
    }

    Set-Content -Path $file.FullName -Value $content -Encoding UTF8
    Write-Host "  Updated successfully" -ForegroundColor Green
}

Write-Host "All pages updated with matching dashboard button style!" -ForegroundColor Cyan
