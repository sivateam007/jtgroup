
fetch("/components/courses_nav.html")
  .then(res => res.text())
  .then(data => {
    document.getElementById("courses_nav").innerHTML = data;
  });

