
fetch("/components/full_nav.html")
  .then(res => res.text())
  .then(data => {
    document.getElementById("full_nav").innerHTML = data;
  });

