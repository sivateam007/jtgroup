

fetch("/components/bengali_nav.html")
  .then(res => res.text())
  .then(data => {
    document.getElementById("bengali_nav").innerHTML = data;
  });

