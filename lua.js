const outputDiv = document.createElement("div");
outputDiv.style.cssText = "background:#111;color:#0f0;padding:10px;min-height:150px;white-space:pre-wrap;margin-top:10px";
document.body.appendChild(outputDiv);

const uiContainer = document.createElement("div");
document.body.appendChild(uiContainer);

window.website = {
  AddUI: (type, props = {}) => {
    let elem;
    if (type === "frame") elem = document.createElement("div");
    else if (type === "button") elem = document.createElement("button");
    else if (type === "label") elem = document.createElement("span");
    else if (type === "slider") elem = document.createElement("input");
    else if (type === "dropdown") elem = document.createElement("select");
    else return;

    elem.className = "ui-frame";

    if (props.Text) elem.textContent = props.Text;
    if (props.Size) {
      const [w, h] = props.Size.split("x");
      elem.style.width = w + "px";
      elem.style.height = h + "px";
    }
    if (props.Position) {
      const [x, y] = props.Position.split("x");
      elem.style.position = "absolute";
      elem.style.left = x + "px";
      elem.style.top = y + "px";
    }

    if (type === "slider" && props.Min != null && props.Max != null) {
      elem.type = "range";
      elem.min = props.Min;
      elem.max = props.Max;
      if (props.Value != null) elem.value = props.Value;
      if (props.Callback) elem.oninput = e => props.Callback(Number(e.target.value));
    }

    if (type === "dropdown" && Array.isArray(props.Options)) {
      props.Options.forEach(o => {
        const option = document.createElement("option");
        option.value = o;
        option.textContent = o;
        elem.appendChild(option);
      });
      if (props.Callback) elem.onchange = e => props.Callback(e.target.value);
    }

    if (type === "button" && props.Callback) elem.onclick = props.Callback;
    uiContainer.appendChild(elem);
    return elem;
  },
  RemoveUI: elem => { if (elem && elem.parentElement) elem.parentElement.removeChild(elem); },
  SetText: (elem, text) => { if (elem) elem.textContent = text; },
  SetColor: (elem, color) => { if (elem) elem.style.background = color; },
  Tween: (elem, props, duration = 500) => {
    if (!elem) return;
    Object.keys(props).forEach(k => {
      elem.style.transition = k + " " + duration + "ms";
      elem.style[k] = props[k];
    });
  },
  Fade: (elem, duration = 500, to = 0) => {
    if (!elem) return;
    elem.style.transition = "opacity " + duration + "ms";
    elem.style.opacity = to;
  },
  Move: (elem, x, y, duration = 500) => {
    if (!elem) return;
    elem.style.transition = "left " + duration + "ms, top " + duration + "ms";
    elem.style.left = x + "px";
    elem.style.top = y + "px";
  },
  Wait: s => new Promise(r => setTimeout(r, s * 1000)),
  Random: (min, max) => Math.floor(Math.random() * (max - min + 1) + min),
  Clamp: (v, min, max) => Math.min(Math.max(v, min), max),
  Round: v => Math.round(v),
  OnKey: (key, callback) => document.addEventListener("keydown", e => { if (e.key === key) callback(); }),
  OnMouseClick: callback => document.addEventListener("click", callback),
  GetMousePosition: () => ({ x: event.clientX, y: event.clientY }),
  Save: (k, v) => localStorage.setItem(k, JSON.stringify(v)),
  Load: k => JSON.parse(localStorage.getItem(k)),
  Delete: k => localStorage.removeItem(k),
  Log: msg => { console.log(msg); outputDiv.textContent += msg + "\n"; },
  ClearOutput: () => { outputDiv.textContent = ""; },
  Return: val => val
};

window.print = text => { outputDiv.textContent += text + "\n"; };

const transformCode = code => {
  let js = code;

  // Remove local keywords
  js = js.replace(/\blocal\s+/g, "");

  // Replace Lua string concatenation with JS +
  js = js.replace(/\.\./g, "+");

  // Replace print
  js = js.replace(/print\s*\(([^)]*)\)/g, "print($1)");

  // Replace website:Func(...) with website.Func(...)
  js = js.replace(/website:([a-zA-Z_]+)\(([^)]*)\)/g, "website.$1($2)");

  // Replace for loops i=1,n do ... end
  js = js.replace(/for\s+(\w+)\s*=\s*([0-9]+)\s*,\s*([0-9]+)\s*do([\s\S]*?)end/g, "for(let $1=$2;$1<=$3;$1++){ $4 }");

  // Replace if ... then ... end
  js = js.replace(/if\s+(.*?)\s+then([\s\S]*?)end/g, "if($1){ $2 }");

  // Replace simple function definitions
  js = js.replace(/function\s+(\w+)\s*\((.*?)\)([\s\S]*?)end/g, "function $1($2){ $3 }");

  return js;
};

function loadLuaScripts() {
  document.querySelectorAll('script[type="text/lua"]').forEach(s => {
    const code = s.src ? fetch(s.src).then(r => r.text()) : Promise.resolve(s.textContent);
    code.then(t => {
      try { eval(transformCode(t)); } catch (e) { outputDiv.textContent += "Error: " + e + "\n"; }
    });
  });
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", loadLuaScripts);
else loadLuaScripts();
