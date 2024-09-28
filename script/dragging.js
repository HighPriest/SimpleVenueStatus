let _startX = 0,
    _startY = 0,
    _scrollTop = 0,
    _scrollLeft = 0,
    _scale = 1;
    

const el = document.querySelector("main");
el.onwheel = zoom;
document.onmousedown = OnMouseDown;
document.onmouseup = OnMouseUp;

/*document.onkeydown = OnKeyDown;

function OnKeyDown(event) {
    if (event.ctrlKey) {
        alert('hi.')
      }
}*/

function zoom(event) {
    event.preventDefault();

    _scale += event.deltaY * -0.001;

    // Restrict scale
    _scale = Math.min(Math.max(0.125, _scale), 4);

    // Apply scale transform
    el.style.width = `${_scale*100}%`;
    //el.style.transform = `scale(${_scale})`;
}

function OnMouseDown(event) {
    if (event.ctrlKey) {
        document.onmousemove = OnMouseMove;
        _startX = event.clientX;
        _startY = event.clientY;
        _scrollTop = document.documentElement.scrollTop;
        _scrollLeft = document.documentElement.scrollLeft;
    }
}

function OnMouseMove(event) {
    window.scrollTo({
        left: _scrollLeft + (_startX - event.clientX),
        top: _scrollTop + (_startY - event.clientY)
    });
}

function OnMouseUp() {
    document.onmousemove = null;
}


// Zooming setup
let oldValue=window.devicePixelRatio;
window.addEventListener('resize',function(e){
  let newValue=window.devicePixelRatio;
  if(newValue!==oldValue){
    let event=new Event('devicepixelratiochange');
    event.oldValue=oldValue;
    event.newValue=newValue;
    oldValue=newValue;
    window.dispatchEvent(event);
  }
});

// usage
window.addEventListener('devicepixelratiochange',function(e){
  // note: browsers will change devicePixelRatio when page zoom changed or system display scale changed
  console.log('devicePixelRatio changed from '+e.oldValue+' to '+e.newValue);
});