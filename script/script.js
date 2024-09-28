//--Zbiór obiektów interaktywnych

    var sideMenu = document.getElementsByTagName("aside")[0];
    var racks = document.getElementById("racks");
    var map = document.getElementsByTagName("svg")[0];
    var camerasObj; // JSON object containing camera data from cameras.json
    var idf, idfs, APs, fibre, cameras0, cameras1;
    idf = map.getElementById("idf");
    idfs = idf.children;
    APs = map.getElementById("APs");
    fibre = map.getElementById("fibre");
    cameras0 = map.getElementById("cameras0");
    cameras1 = map.getElementById("cameras1");

    var camerasMenu = document.getElementById("cameras");

//--Koniec Zbiór obiektów interaktywnych

//--Funkcja od kamer (Wykrywanie wielu warstw obiektów pod kursorem myszy)

map.onmousedown = () => {
    var rpos = map.createSVGRect();
    
    rpos.x = window.event.clientX - map.getBoundingClientRect().left;
    rpos.y = window.event.clientY - map.getBoundingClientRect().top;
    rpos.width = rpos.height = 1;
    var list = map.getIntersectionList(rpos,null);
    for(var i = 0; i < list.length; i++)
    {
        if(list[i] != window.event.target)
        {
            console.log(list[i]);
            list[i].dispatchEvent(new Event('mouseup'));
        }
    }
}

//--Koniec Funkcja od kamer

//--Async-Fetch racks.json
    var racksObj;
    var racksObjPromise = fetch("data/racks.json")
        .then(response => response.json())
        .then(data => racksObj = data)
        .then(function () {
            for (const k in idfs) {
                idfs[k].addEventListener("click",function () {show_sideMenu(idfs[k].id)});
            }
        });
//--Async-Fetch cameras.json
    var camerasObjPromise = fetch("data/cameras.json")
        .then(response => response.json())
        .then(data => camerasObj = data)
        .then(function () {
            for (const k in cameras0.children) {
                cameras0.children[k].onmouseup = () => show_camerasMenu(cameras0.children[k].id);
            }
            for (const k in cameras1.children) {
                cameras1.children[k].onmouseup = () => show_camerasMenu(cameras1.children[k].id);
            }
        })

//--Funkcje od interakcji

    function show_camerasMenu(id) {
        var camera_node = document.createElement("div");
        var preview_node = document.createElement("img");
        var info_node = document.createElement("p");
        sideMenu.style.visibility = "visible";
        info_node.textContent = camerasObj[0][id].Network.Hostname + " " + camerasObj[0][id].Model;
        camera_node.appendChild(preview_node);
        camera_node.appendChild(info_node);
        camerasMenu.appendChild(camera_node);
        console.log("camera");
    }

    function clear_camerasMenu() {
        camerasMenu.innerHTML = "";
    }

    function clear_racksMenu() {
        racks.innerHTML = "";
    }

    function show_sideMenu(id) {
        let lan_switch_ports = 0, lan_panel_ports = 0, cctv_switch_ports = 0, cctv_panel_ports = 0;
        sideMenu.style.visibility = "visible";
        racks.innerHTML = "";
        for (key in racksObj[id]){
            var rack_node = document.createElement("div");
            rack_node.className = "rack";
            rack_node.innerHTML = "<p class='ports_ratio'></p><img src='RACK 42u.svg'><div class='devices'></div>";
            racksObj[id][key].forEach(device => {
                var device_node = document.createElement("div");
                device_node.className = "device " + device.type;
                device_node.style.top = (42 - device.unit) * 12.5 + "px";
                device_node.textContent = device.name + " " + (device.model == null ? "" : device.model);
                rack_node["lastChild"].appendChild(device_node);
                if (device.type == "switch") { lan_switch_ports += device.ports }
                else if (device.type == "panel_lan") { lan_panel_ports += device.ports }
                else if (device.type == "switch_cctv") { cctv_switch_ports += device.ports }
                else if (device.type == "panel_cctv") { cctv_panel_ports += device.ports }
            });
            rack_node.insertAdjacentHTML("beforeend","<div class='location_name'>" + id + "</div>");
            rack_node["firstChild"].innerHTML = lan_switch_ports + " / " + lan_panel_ports + " LAN | CCTV " + cctv_switch_ports + " / " + cctv_panel_ports;
            racks.appendChild(rack_node);
        }
    }

    function close_nav() {
        sideMenu.style.visibility = "hidden";
        racks.innerHTML = "";
    }

    function toggle_visibility(id) {
        if (window[id].style.display === "none") {
            window[id].style.display = "block";
        } else {
            window[id].style.display = "none";
        }
    }

//-- Funkcje od wskazywania statusu

// Function for updating visual status of a device
function updateStatus(device, status) {
    if (status == "1") {
        device.style.fill = "green";
    } else if (status == "0") {
        // make the fill change on an interval to look like it's flashing
        if (!device.intervalId) {
            device.intervalId = setInterval(() => {
                if (device.style.fill == "red") {
                    device.style.fill = "white";
                } else {
                    device.style.fill = "red";
                }
            }, 500);
        }
    } else {
        device.style.fill = "white";
        clearInterval(device.intervalId);
        device.intervalId = null;
    }
}


// Asynchronous function querying Prometheus instance on a repeating interval
async function queryPrometheus() {
    const response = await fetch('http://pi:9090/api/v1/query?query=probe_success');
    const data = await response.json();
    console.log(data);
    // Go through each data -> result -> metric -> instance and through Network -> IP in camerasObj to associate each result with a camera
    for (const k in data.data.result) {
        for (const l in camerasObj[0]) {
            if (data.data.result[k].metric.instance == camerasObj[0][l].Network.IP) {
                camerasObj[0][l].Status = data.data.result[k].value[1];
                try {
                    updateStatus(cameras0.children[l], camerasObj[0][l].Status);   
                } catch (error) {
                    try {
                        updateStatus(cameras1.children[l], camerasObj[0][l].Status);   
                    } catch (error) {
                        console.log(l + " is not a valid camera ID or does not exist on the map. Status: " + camerasObj[0][l].Status);
                    }
                }
            }
        }
    }
}

/*
try {
    queryPrometheus();   
} catch (error) {
    
} finally {
    setInterval(queryPrometheus, 6000); // repeat every minute
}
*/