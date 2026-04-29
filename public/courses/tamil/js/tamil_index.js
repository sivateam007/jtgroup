
fetch("/components/tamil_nav.html")
  .then(res => res.text())
  .then(data => {
    document.getElementById("tamil_nav").innerHTML = data;
  });

