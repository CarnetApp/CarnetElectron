if (right == undefined)
    var right = document.getElementById("right-bar");
const settings = document.getElementById("settings");
settings.parentNode.removeChild(settings)
right.appendChild(settings)
const header = document.getElementById("header")
header.parentNode.removeChild(header)
document.getElementById("content-wrapper").style.paddingTop = "0px"
const ex = document.getElementById("expanddiv")
ex.style.top = "55px";
ex.style.position = "absolute";