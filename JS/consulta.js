document.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  const propiedad = params.get("propiedad");
  const tipo = params.get("tipo") || "Departamento";
  const ingresoInput = document.getElementById("ingreso");
  const egresoInput = document.getElementById("egreso");

  
    if (propiedad) {
    document.getElementById("titulo-propiedad").textContent = `${tipo} ${propiedad}`;
  }

 

  let egresoPicker;
  let info = {};
  const fechasOcupadas = [];
  const totalContainer = document.getElementById("total");
// IDs de calendarios de Google para cada propiedad
  const calendarIds = {
    Brisa: "e50a4bf3b263eb7955e81ba93a8ca17795da344c6c59587afbcf17f36eeeb64a@group.calendar.google.com",
    Coral: "4cd0e35e1a0b2c09f2bb18ac4caf0e613ea528dc1d899dfce6018a3b3bb1b5e4@group.calendar.google.com",
    Belen: "30ed9d4620e85a878a620f239e818bde2af8dc5f1d2ddc19fbf4241c82aac070@group.calendar.google.com",
    Benteveo: "h3sjromhjot8nmajtp54ubuchajtnet5@import.calendar.google.com"
    //nteveo: "d7d12046e12d045e55c41b218b0b67261b125711925bc5d8177b00752bc73d11@group.calendar.google.com"
  };

  const apiKey = "AIzaSyDUkc_gvy-Z5WrXZLXeaUkkiKGkdFN0mNg";



    // ✅ Generar opciones de huéspedes
    const maxHuespedes = {
      Benteveo: 5,
      Belen: 4,
      Coral: 4,
      Brisa: 3
    };

    const huespedesSelect = document.getElementById("huespedes");
    if (huespedesSelect && maxHuespedes[propiedad]) {
      huespedesSelect.innerHTML = '<option value="">Seleccionar</option>';
      for (let i = 1; i <= maxHuespedes[propiedad]; i++) {
        huespedesSelect.innerHTML += `<option value="${i}">${i} huésped${i > 1 ? 'es' : ''}</option>`;
      }
    }

  const cargarFechasOcupadas = () => {
    return new Promise(resolve => {
      if (!calendarIds[propiedad]) return resolve();

        fetch(`https://www.googleapis.com/calendar/v3/calendars/${calendarIds[propiedad]}/events?key=${apiKey}`)
          .then(res => res.json())
          .then(data => {
            const eventos = data.items || [];
            eventos.forEach(evento => {
              const inicio = new Date(evento.start.date || evento.start.dateTime);
              const fin = new Date(evento.end.date || evento.end.dateTime);
              let actual = new Date(inicio);
              while (actual < fin) {
                fechasOcupadas.push(new Date(actual));
                actual.setDate(actual.getDate() + 1);
              }
            });
            resolve();
          })
          .catch(error => {
            console.error("Error al cargar fechas ocupadas:", error);
            resolve();
          });
      });
    };

      document.getElementById("loader-overlay").style.display = "flex";
      //Esta URL se saca de la imlementación del App Script de Google
      fetch("https://script.google.com/macros/s/AKfycbydV_8lJDQJYFHQ8s93saUmtRiFnT_oY75NginyZOv8YOCVSwsyEWhjvvZ6mdyMo1N8oQ/exec?modo=datos")
      
        .then(res => res.json())
        .then(precios => {
          info = precios[propiedad];
          if (!info) {
            console.warn("No se encontraron datos para la propiedad:", propiedad);
            return;
          }

          // Mostrar condiciones visuales
          const condiciones = document.getElementById("condiciones");
          let textoCondiciones = `<div class="alert alert-info mt-4"><p class="mb-1"><strong>Estadía mínima:</strong></p><ul class="mb-3 ps-3">`;

          if (info.minimosPorRango && info.minimosPorRango.length) {
            info.minimosPorRango.forEach(r => {
              textoCondiciones += `<li>${r.minimo} noche${r.minimo > 1 ? 's' : ''} entre ${formatearFecha(r.desde)} y ${formatearFecha(r.hasta)}</li>`;
            });
          }

          // Mostrar siempre el mínimo base como referencia
          textoCondiciones += `<li>${info.minimoNoches || 3} noche${info.minimoNoches > 1 ? 's' : ''} fuera de los rangos anteriores</li>`;
          textoCondiciones += `</ul>`;

          if (info.descuentos && info.descuentos.length) {
            textoCondiciones += `<p class="mb-1"><strong>Descuentos:</strong></p><ul class="ps-3">`;
            info.descuentos.forEach(d => {
              textoCondiciones += `<li>${d.porcentaje}% desde ${d.noches} noche${d.noches > 1 ? 's' : ''}</li>`;
            });
            textoCondiciones += `</ul>`;
          }

          textoCondiciones += `</div>`;
          condiciones.innerHTML = textoCondiciones;

          // 🔁 Ahora sí: cargar fechas ocupadas
          return cargarFechasOcupadas();
        })
        .then(() => {
          // ✅ Inicializar flatpickr con fechas y precios ya disponibles
          flatpickr(ingresoInput, {
            locale: "es",
            dateFormat: "Y-m-d",
            minDate: "today",
            disable: fechasOcupadas,
            disableMobile: true,

            onChange: function (selectedDates) {
              if (selectedDates.length) {
                egresoPicker.set("minDate", selectedDates[0]);
                calcularTotal();
                
              }
            },
            onDayCreate: function (dObj, dStr, fp, dayElem) {
              agregarPrecioPorDia(dayElem);
            }
          });

          egresoPicker = flatpickr(egresoInput, {
            locale: "es",
            dateFormat: "Y-m-d",
            minDate: "today",
            disable: fechasOcupadas,
            disableMobile: true,
            onChange: calcularTotal,
            onDayCreate: function (dObj, dStr, fp, dayElem) {
              agregarPrecioPorDia(dayElem);
            }
          });

          document.getElementById("loader-overlay").style.display = "none";
        });

    const formatearFecha = iso => {
    const fecha = new Date(iso);
    const dia = String(fecha.getDate()).padStart(2, "0");
    const mes = String(fecha.getMonth() + 1).padStart(2, "0");
    const año = fecha.getFullYear();
    return `${dia}/${mes}/${año}`;
  };

  const normalizar = fecha => new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate());

  const obtenerPrecio = fecha => {
    const fechaNormalizada = normalizar(fecha);
    for (const r of info.rangos || []) {
      const desde = normalizar(new Date(r.desde));
      const hasta = normalizar(new Date(r.hasta));
      if (fechaNormalizada >= desde && fechaNormalizada <= hasta) return r.precio;
    }
    return info.base;
  };

  const obtenerDescuento = noches => {
    let mejorDescuento = 0;
    for (const d of info.descuentos || []) {
      if (noches >= d.noches && d.porcentaje > mejorDescuento) {
        mejorDescuento = d.porcentaje;
      }
    }
    return mejorDescuento;
  };

const obtenerMinimoPorEstadia = (ingreso, egreso) => {
  const inicio = new Date(ingreso);
  const fin = new Date(egreso);

  for (const r of info.minimosPorRango || []) {
    const desde = new Date(r.desde);
    const hasta = new Date(r.hasta);
    if (inicio >= desde && fin <= hasta) {
      return r.minimo;
    }
  }

  return info.minimoNoches || 3;
};

  const agregarPrecioPorDia = (dayElem) => {
    const fechaISO = dayElem.dateObj.toISOString().split("T")[0];
    const fecha = new Date(fechaISO);
    if (dayElem.classList.contains("flatpickr-disabled")) return;
    const precio = obtenerPrecio(fecha);
    if (precio) {
      const etiqueta = document.createElement("span");
      etiqueta.textContent = `$${precio}`;
      etiqueta.className = "precio-dia";
      dayElem.appendChild(etiqueta);
    }
  };

  const calcularTotal = () => {
    const ingreso = ingresoInput.value;
    const egreso = egresoInput.value;
    if (!ingreso || !egreso) return totalContainer.textContent = "";

    const inicio = new Date(ingreso);
    const fin = new Date(egreso);
    if (fin <= inicio) {
      totalContainer.innerHTML = `<span class="text-danger">La fecha de egreso debe ser posterior a la de ingreso.</span>`;
      return;
    }

    let actual = new Date(inicio);
    let total = 0;
    let noches = 0;

    while (actual < fin) {
      total += obtenerPrecio(actual);
      noches++;
      actual.setDate(actual.getDate() + 1);
    }

    const minimoRequerido = obtenerMinimoPorEstadia(ingreso, egreso);


    if (noches < minimoRequerido) {
      totalContainer.innerHTML = `<span class="text-danger">La estadía seleccionada requiere al menos ${minimoRequerido} noche${minimoRequerido > 1 ? 's' : ''} por las fechas elegidas.</span>`;
      return;
    }

    const descuentoAplicado = obtenerDescuento(noches);
    const totalFinal = descuentoAplicado ? total * (1 - descuentoAplicado / 100) : total;

    totalContainer.innerHTML = `<strong>Total estimado:</strong> U$S${totalFinal.toFixed(2)}<br><small>${noches} noche${noches > 1 ? 's' : ''}${descuentoAplicado ? ` con ${descuentoAplicado}% de descuento` : ''}</small>`;
  };

    const esEmailValido = email => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const mostrarError = (id, mensaje) => {
    const campo = document.getElementById(id);
    const error = document.getElementById("error-" + id);
      if (campo) {
        campo.classList.remove("is-valid");
        campo.classList.add("is-invalid");
      }
      if (error) error.textContent = mensaje;
    };
    const limpiarError = id => {
    const campo = document.getElementById(id);
    const error = document.getElementById("error-" + id);
      if (campo) {
        campo.classList.remove("is-invalid");
        campo.classList.add("is-valid");
      }

      
      if (error) error.textContent = "";
    };;

  const validarCampos = ({ nombre, email, ingreso, egreso, huespedes }) => {
    let valido = true;
    if (!nombre.trim()) { mostrarError("nombre", "Este campo es obligatorio."); valido = false; } else { limpiarError("nombre"); }
    if (!email.trim()) { mostrarError("email", "Este campo es obligatorio."); valido = false; }
    else if (!esEmailValido(email)) { mostrarError("email", "El formato del correo no es válido."); valido = false; } else { limpiarError("email"); }
    if (!ingreso.trim()) { mostrarError("ingreso", "Indicá la fecha de ingreso."); valido = false; } else { limpiarError("ingreso"); }
    if (!egreso.trim()) { mostrarError("egreso", "Indicá la fecha de egreso."); valido = false; } else { limpiarError("egreso"); }
    if (!huespedes.trim()) { mostrarError("huespedes", "Indicá la cantidad de huéspedes."); valido = false; } else { limpiarError("huespedes"); }
    return valido;
  };

const cumpleMinimoEstadia = () => {
  const ingreso = ingresoInput.value;
  const egreso = egresoInput.value;
  if (!ingreso || !egreso) return false;

  const inicio = new Date(ingreso);
  const fin = new Date(egreso);
  if (fin <= inicio) return false;

  const noches = Math.ceil((fin - inicio) / (1000 * 60 * 60 * 24));
  const minimoRequerido = obtenerMinimoPorEstadia(ingreso, egreso);

  return noches >= minimoRequerido;
};


  const btnEnviar = document.getElementById("btn-enviar");
  const camposObligatorios = ["nombre", "email", "ingreso", "egreso", "huespedes"];

  const validarCamposObligatoriosEnTiempoReal = () => {
    let todosCompletos = true;
    camposObligatorios.forEach(id => {
      const campo = document.getElementById(id);
      const valor = campo.value.trim();
      if (!valor) {
        mostrarError(id, "Este campo es obligatorio.");
        todosCompletos = false;
      } else {
        if (id === "email" && !esEmailValido(valor)) {
          mostrarError("email", "El formato del correo no es válido.");
          todosCompletos = false;
        } else {
          limpiarError(id);
        }
      }
    });

    if (todosCompletos && cumpleMinimoEstadia()) {
      btnEnviar.disabled = false;
      btnEnviar.textContent = "Listo para enviar";
      btnEnviar.classList.remove("btn-outline-primary");
      btnEnviar.classList.add("btn-success");
      calcularTotal();
    } else {
      btnEnviar.disabled = true;
      btnEnviar.textContent = "Enviar Consulta";
      btnEnviar.classList.remove("btn-success");
      btnEnviar.classList.add("btn-outline-primary");
    }
  };

  validarCamposObligatoriosEnTiempoReal();

  camposObligatorios.forEach(id => {
    const campo = document.getElementById(id);
    campo.addEventListener("input", validarCamposObligatoriosEnTiempoReal);
    campo.addEventListener("change", validarCamposObligatoriosEnTiempoReal);
  });

  btnEnviar.addEventListener("click", () => {
    if (btnEnviar.disabled) return;

    const nombre = document.getElementById("nombre").value.trim();
    const email = document.getElementById("email").value.trim();
    const telefono = document.getElementById("telefono").value.trim();
    const comentarios = document.getElementById("comentarios").value.trim();
    const ingreso = document.getElementById("ingreso").value.trim();
    const egreso = document.getElementById("egreso").value.trim();
    const huespedes = document.getElementById("huespedes").value;
    const total = totalContainer.textContent;
    const rango = `${ingreso} to ${egreso}`;

    if (!validarCampos({ nombre, email, ingreso, egreso, huespedes })) return;

    const fechaHora = new Date().toLocaleString("es-AR", {
      dateStyle: "full",
      timeStyle: "short"
    });

    const loader = document.getElementById("loader-overlay");
    const loaderText = loader.querySelector("p");
    loaderText.textContent = "Estamos procesando tu consulta...";
    loader.style.display = "flex";
// Esto se sca de la implementacion en App Script para el envío de consultas
//    fetch("https://script.google.com/macros/s/AKfycbxGCmYtM_zmtDAWQlbByLLpngZ50AQcxRb8oUA8KGNqSJq3JCUe1VQhje5uUFWuqDswQg/exec", {
    fetch(`https://script.google.com/macros/s/AKfycbxjsDXt3zPP8xP-hG__8XiF7vpDWmjmE8wiikQjFi1SDt-EvGSGnmddgwUBani0awT0/exec?nocache=${Date.now()}`, {
  
      method: "POST",
      headers: {
        "Content-Type": "text/plain;charset=utf-8"
      },
      body: JSON.stringify({
        propiedad: `${tipo} ${propiedad}`,
        nombre,
        email,
        telefono,
        rango,
        huespedes,
        total,
        comentarios,
        fechaHora,
        imagen: obtenerImagen(propiedad, tipo) // ← función que devuelve la URL
      })
    })
    .then(res => res.text())
    .then(seguimiento => {
      if (seguimiento.startsWith("CM-")) {
        document.querySelector("section.container").innerHTML = `
          <div class="alert alert-success text-center mt-5">
            <img src="assets/logoA.png" alt="Aires de Miramar" style="max-width: 150px; margin-bottom: 1rem;">
            <h4 class="mb-3">¡Consulta enviada!</h4>
            <p>Gracias por contactarte. Te responderemos pronto con la disponibilidad y precios.</p>
            <div class="mt-4">
              <p><strong>Número de seguimiento:</strong></p>
              <p id="codigo-seguimiento" class="text-primary fw-bold fs-5">${seguimiento}</p>
              <button class="btn btn-outline-secondary btn-sm mt-2" onclick="navigator.clipboard.writeText('${seguimiento}')">
                <i class="bi bi-clipboard"></i> Copiar código
              </button>
            </div>
            <div class="mt-4">
              <a href="index.html" class="btn btn-success">Volver al inicio</a>
            </div>
          </div>
        `;
      } else {
        alert("El servidor respondió, pero no se pudo confirmar el envío.");
      }
      loader.style.display = "none";
    })
    .catch(error => {
      console.error("Error al enviar la consulta:", error);
      loaderText.textContent = "Hubo un problema al enviar la consulta.";
      setTimeout(() => loader.style.display = "none", 3000);
    });
  });

  document.getElementById("btn-limpiar").addEventListener("click", () => {
    ["nombre", "email", "telefono", "comentarios", "ingreso", "egreso"].forEach(id => {
      document.getElementById(id).value = "";
    });

    if (ingresoInput._flatpickr) ingresoInput._flatpickr.clear();
    if (egresoInput._flatpickr) egresoInput._flatpickr.clear();

    document.getElementById("huespedes").value = "";
    totalContainer.textContent = "";

    ["nombre", "email", "ingreso", "egreso", "huespedes"].forEach(limpiarError);

    btnEnviar.disabled = true;
    btnEnviar.textContent = "Enviar Consulta";
    btnEnviar.classList.remove("btn-success");
    btnEnviar.classList.add("btn-outline-primary");

    validarCamposObligatoriosEnTiempoReal();
  });

  document.getElementById("btn-volver").addEventListener("click", () => {
    window.location.href = "index.html";
  });
});


// Obtener parámetros de la URL
const params = new URLSearchParams(window.location.search);
const propiedad = params.get("propiedad"); // "Belen"
const tipo = params.get("tipo");           // "Casa"

const titulo = `${tipo} ${propiedad}`; // "Casa Belen"
document.getElementById("titulo-propiedad").textContent = titulo;

// Ruta basada en nombre de propiedad
const carpeta = propiedad.toLowerCase(); // "belen"
const imagenSrc = `img/${carpeta}/${carpeta}01.jpg`;

const img = document.getElementById("imagen-propiedad");
img.src = imagenSrc;
img.alt = `Imagen de ${titulo}`;

// Imagen por defecto si no se encuentra
img.onerror = () => {
  img.src = "img/propiedades/default.jpg";
  img.alt = "Imagen no disponible";
};

function obtenerImagen(propiedad, tipo) {
  const clave = `${tipo} ${propiedad}`;
  const imagenes = {
    "Casa Belen": "https://www.airesdemiramar.com.ar/img/belen/belen01.jpg",
    "Casa Benteveo": "https://www.airesdemiramar.com.ar/img/benteveo/benteveo01.jpg",
    "Departamento Brisa": "https://www.airesdemiramar.com.ar/img/brisa/brisa01.jpg",
    "Departamento Coral": "https://www.airesdemiramar.com.ar/img/coral/coral01.jpg"
  };
  return imagenes[clave] || "";
}

