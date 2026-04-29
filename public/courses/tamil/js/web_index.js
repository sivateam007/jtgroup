
fetch("/components/web_nav.html")
  .then(res => res.text())
  .then(data => {
    document.getElementById("web_nav").innerHTML = data;
  });

