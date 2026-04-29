# Add Start Learning button and Tutorial (Start Here) to all course index pages

$files = @(
    "C:\Users\siva\Desktop\jtgroupofinstitution\public\courses\tamil\programming-languages\ANGULAR\index.html",
    "C:\Users\siva\Desktop\jtgroupofinstitution\public\courses\tamil\programming-languages\ANGULAR_JS\index.html",
    "C:\Users\siva\Desktop\jtgroupofinstitution\public\courses\tamil\programming-languages\CSS\index.html",
    "C:\Users\siva\Desktop\jtgroupofinstitution\public\courses\tamil\programming-languages\GIT\index.html",
    "C:\Users\siva\Desktop\jtgroupofinstitution\public\courses\tamil\programming-languages\HTML\index.html",
    "C:\Users\siva\Desktop\jtgroupofinstitution\public\courses\tamil\full stack development\ANGULAR\index.html",
    "C:\Users\siva\Desktop\jtgroupofinstitution\public\courses\tamil\full stack development\ANGULAR_JS\index.html",
    "C:\Users\siva\Desktop\jtgroupofinstitution\public\courses\tamil\full stack development\CSS\index.html",
    "C:\Users\siva\Desktop\jtgroupofinstitution\public\courses\tamil\full stack development\HTML\index.html",
    "C:\Users\siva\Desktop\jtgroupofinstitution\public\courses\tamil\full stack development\JAVASCRIPT\index.html",
    "C:\Users\siva\Desktop\jtgroupofinstitution\public\courses\tamil\full stack development\MONGO_DB\index.html",
    "C:\Users\siva\Desktop\jtgroupofinstitution\public\courses\tamil\full stack development\NODE_JS\index.html"
)

foreach ($file in $files) {
    if (-not (Test-Path $file)) {
        Write-Host "Skipping: $file (not found)" -ForegroundColor Yellow
        continue
    }

    Write-Host "Processing: $file"

    $content = Get-Content -Path $file -Raw

    # Get course name from folder path
    $folderPath = Split-Path $file | Select-Object -ExpandProperty Directory
    $courseName = Split-Path $folderPath | Select-Object -ExpandProperty Leaf

    # Determine icon class based on course
    $iconClass = "fas fa-file-code"
    switch -Wildcard ($courseName) {
        "*HTML*" { $iconClass = "fab fa-html5" }
        "*CSS*" { $iconClass = "fab fa-css3-alt" }
        "*JS*" { $iconClass = "fab fa-js-square" }
        "*ANGULAR*" { $iconClass = "fab fa-angular" }
        "*NODE*" { $iconClass = "fab fa-node-js" }
        "*MONGO*" { $iconClass = "fas fa-database" }
        "*GIT*" { $iconClass = "fab fa-git-alt" }
        "*PYTHON*" { $iconClass = "fab fa-python" }
    }

    # Add start-learning-btn CSS if not present
    if ($content -notmatch '\.start-learning-btn \{') {
        $startBtnStyle = @'
        .start-learning-btn {
            display: inline-flex;
            align-items: center;
            gap: 10px;
            padding: 15px 40px;
            background: white;
            color: var(--git-color);
            text-decoration: none;
            border-radius: 50px;
            font-size: 1.2rem;
            font-weight: 600;
            transition: all 0.3s;
            box-shadow: 0 5px 20px rgba(0,0,0,0.2);
        }
        .start-learning-btn:hover {
            transform: translateY(-3px);
            box-shadow: 0 8px 30px rgba(0,0,0,0.3);
            background: #f8f9fa;
        }
'@
        $content = $content -replace '(?<=body \{[^}]+\})', '$1' + $startBtnStyle
    }

    # Add Start Learning button to hero section
    $content = $content -replace '(<div class="course-hero-content">[^<]+<h1>[^<]+</h1>\s*<p>[^<]+</p>)', '$1
            <a href="' + $courseName + ' Tutorial.html" class="start-learning-btn">
                <i class="fas fa-play-circle"></i> Start Learning
            </a>'

    # Add Tutorial (Start Here) as first topic card
    $tutorialCard = @'
            <div class="topic-card" style="border-top: 5px solid #e74c3c;">
                <div class="topic-icon">
                    <i class="' + $iconClass + '"></i>
                </div>
                <h3>' + $courseName + ' Tutorial (Start Here)</h3>
                <p>Begin your ' + $courseName + ' journey with this introductory tutorial</p>
                <a href="' + $courseName + ' Tutorial.html">Start Learning <i class="fas fa-arrow-right"></i></a>
            </div>            '

    $content = $content -replace '(<div class="topics-grid">)', '$1
            ' + $tutorialCard

    # Remove duplicate .user-btn styles
    $content = $content -replace '\.user-btn \{[^}]+\}\s*\.user-btn:hover \{[^}]+\}', ''

    Set-Content -Path $file -Value $content -Encoding UTF8
    Write-Host "  Updated successfully" -ForegroundColor Green
}

Write-Host "All pages updated!" -ForegroundColor Cyan
