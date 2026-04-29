

fetch("/components/hindi_nav.html")
  .then(res => res.text())
  .then(data => {
    document.getElementById("hindi_nav").innerHTML = data;
  });

