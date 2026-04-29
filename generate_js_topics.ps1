cd "C:\Users\siva\Desktop\jtgroupofinstitution\public\courses\tamil\programming-languages\JAVASCRIPT"
$files = Get-ChildItem -File -Filter "*.html" | Where-Object { $_.Name -ne "index.html" } | Sort-Object Name

$html = ""
foreach($f in $files) {
    $topic = $f.Name.Replace('.html','')
    $html += "            <div class=`"topic-card`">`n"
    $html += "                <div class=`"topic-icon`">`n"
    $html += "                    <i class=`"fab fa-js-square`"></i>`n"
    $html += "                </div>`n"
    $html += "                <h3>$topic</h3>`n"
    $html += "                <p>Learn $topic</p>`n"
    $html += "                <a href=`"$($f.Name)`">Start Learning <i class=`"fas fa-arrow-right`"></i></a>`n"
    $html += "            </div>`n"
}

$html | Out-File -FilePath "C:\Users\siva\Desktop\jtgroupofinstitution\js_topics.txt" -Encoding UTF8
Write-Output "Generated topics HTML"
