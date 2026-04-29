
fetch("/components/front_nav.html")
  .then(res => res.text())
  .then(data => {
    document.getElementById("front_nav").innerHTML = data;
  });

