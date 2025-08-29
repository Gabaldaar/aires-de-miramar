document.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  const propiedad = params.get("propiedad");
  const tipo = params.get("tipo") || "Departamento";

const maxHuespedes = {
  Benteveo: 5,
  Belen: 4,
  Coral: 4,
  Brisa: 3
};

const form = document.getElementById("form-consulta");

form.addEventListener("submit", (e) => {
  e.preventDefault();

  const nombre = document.getElementById("nombre").value.trim();
  const email = document.getElementById("email").value.trim();
  const rango = document.getElementById("rango").value.trim();
  const huespedes = document.getElementById("huespedes").value.trim();

  const valido = validarCampos({ nombre, email, rango, huespedes });

  if (!valido) {
    // Si hay errores, no hacemos nada más
    return;
  }

  // Si todo está bien, simulamos el clic en el botón
  document.getElementById("btn-enviar").click();
});


const huespedesSelect = document.getElementById("huespedes");
if (huespedesSelect && maxHuespedes[propiedad]) {
  huespedesSelect.innerHTML = '<option value="">Seleccionar</option>';
  for (let i = 1; i <= maxHuespedes[propiedad]; i++) {
    huespedesSelect.innerHTML += `<option value="${i}">${i} huésped${i > 1 ? 'es' : ''}</option>`;
  }
}

  if (!propiedad) return;

  document.getElementById("titulo-propiedad").textContent = `${tipo} ${propiedad}`;

  const esEmailValido = email => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const mostrarError = (id, mensaje) => {
  const campo = document.getElementById(id);
  const error = document.getElementById("error-" + id);
  if (campo) {
    campo.classList.add("is-invalid");
    campo.classList.add("campo-error"); // 🔴 Marca visual
  }
  if (error) error.textContent = mensaje;
};

const limpiarError = id => {
  const campo = document.getElementById(id);
  const error = document.getElementById("error-" + id);
  if (campo) {
    campo.classList.remove("is-invalid");
    campo.classList.remove("campo-error"); // 🔴 Limpia marca visual
  }
  if (error) error.textContent = "";
};

  const validarCampos = ({ nombre, email, rango, huespedes }) => {
    let valido = true;
    if (!nombre.trim()) { mostrarError("nombre", "Este campo es obligatorio."); valido = false; } else { limpiarError("nombre"); }
    if (!email.trim()) { mostrarError("email", "Este campo es obligatorio."); valido = false; }
    else if (!esEmailValido(email)) { mostrarError("email", "El formato del correo no es válido."); valido = false; } else { limpiarError("email"); }
    if (!rango.trim()) { mostrarError("rango", "Seleccioná las fechas."); valido = false; } else { limpiarError("rango"); }
    if (!huespedes.trim()) { mostrarError("huespedes", "Indicá la cantidad de huéspedes."); valido = false; } else { limpiarError("huespedes"); }
    return valido;
  };

  const calendarIds = {
    Brisa: "e50a4bf3b263eb7955e81ba93a8ca17795da344c6c59587afbcf17f36eeeb64a@group.calendar.google.com",
    Coral: "4cd0e35e1a0b2c09f2bb18ac4caf0e613ea528dc1d899dfce6018a3b3bb1b5e4@group.calendar.google.com",
    Belen: "30ed9d4620e85a878a620f239e818bde2af8dc5f1d2ddc19fbf4241c82aac070@group.calendar.google.com",
    Benteveo: "d7d12046e12d045e55c41b218b0b67261b125711925bc5d8177b00752bc73d11@group.calendar.google.com"
  };

  const apiKey = "AIzaSyDUkc_gvy-Z5WrXZLXeaUkkiKGkdFN0mNg";
  const fechasOcupadas = [];
//Muestra el cartel de cargando datos...
  document.getElementById("loader-overlay").style.display = "flex";


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
        .catch(() => resolve());
    });
  };

  
  fetch("https://script.google.com/macros/s/AKfycbzpuEP62QgEHg4rL-MYUFkXE2gN0zKI6zs9ZjFeRkuAi6-IqucbdSXOE-jlD3n0qlji2A/exec")
    .then(res => res.json())
    .then(precios => {
      const info = precios[propiedad];
      if (!info) return;

      const base = info.base;
      const rangos = info.rangos || [];
      const minimo = info.minimoNoches || 1;
      const descuentos = info.descuentos || [];

      const normalizar = fecha => new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate());

      const obtenerPrecio = fecha => {
        const fechaNormalizada = normalizar(fecha);
        for (const r of rangos) {
          const desde = normalizar(new Date(r.desde));
          const hasta = normalizar(new Date(r.hasta));
          if (fechaNormalizada >= desde && fechaNormalizada <= hasta) return r.precio;
        }
        return base;
      };

        const condiciones = document.getElementById("condiciones");
        let textoMinimos = `<strong>Estadía mínima:</strong><ul>`;

        // Mostrar rangos especiales si existen
        if (info.minimosPorRango && info.minimosPorRango.length) {
          const formatearFecha = iso => {
            const f = new Date(iso);
            const dia = String(f.getDate()).padStart(2, '0');
            const mes = String(f.getMonth() + 1).padStart(2, '0');
            const anio = f.getFullYear();
            return `${dia}-${mes}-${anio}`;
          };

          info.minimosPorRango.forEach(r => {
            textoMinimos += `<li>${r.minimo} noche${r.minimo > 1 ? 's' : ''} entre ${formatearFecha(r.desde)} y ${formatearFecha(r.hasta)}</li>`;
          });

        }

        // Mostrar mínimo estándar como "fuera de temporada"
        textoMinimos += `<li>${info.minimoNoches || 1} noche${(info.minimoNoches || 1) > 1 ? 's' : ''} fuera de los rangos anteriores</li>`;
        textoMinimos += `</ul>`;

        condiciones.innerHTML = textoMinimos;



      if (descuentos.length) {
        condiciones.innerHTML += `<strong>Descuentos:</strong><ul>`;
        descuentos.forEach(d => {
          condiciones.innerHTML += `<li>${d.porcentaje}% desde ${d.noches} noche${d.noches > 1 ? 's' : ''}</li>`;
        });
        condiciones.innerHTML += `</ul>`;
      }

      const totalContainer = document.getElementById("total");
      const input = document.getElementById("rango");

      const calcularTotal = fechas => {
        if (fechas.length !== 2) {
          totalContainer.textContent = "";
          return;
        }
        let actual = new Date(fechas[0]);
        const checkout = new Date(fechas[1]);
        let total = 0;
        let noches = 0;
        while (actual < checkout) {
          total += obtenerPrecio(actual);
          noches++;
          actual.setDate(actual.getDate() + 1);
        }

          let minimoFinal = minimo;

          if (info.minimosPorRango && fechas.length === 2) {
            const inicio = new Date(fechas[0]);
            for (const r of info.minimosPorRango) {
              const desde = new Date(r.desde);
              const hasta = new Date(r.hasta);
              if (inicio >= desde && inicio <= hasta) {
                minimoFinal = r.minimo;
                break;
              }
            }
          }

        if (noches < minimoFinal) {
          totalContainer.innerHTML = `<span class="text-danger">La estadía mínima es de ${minimoFinal} noche${minimoFinal > 1 ? 's' : ''}.</span>`;

          return;
        }

        let descuentoAplicado = 0;
        descuentos.forEach(d => {
          if (noches >= d.noches && d.porcentaje > descuentoAplicado) {
            descuentoAplicado = d.porcentaje;
          }
        });

        const totalFinal = total * (1 - descuentoAplicado / 100);
        totalContainer.innerHTML = `Estadía de <strong>${noches}</strong> noche${noches > 1 ? 's' : ''} · Total estimado: <strong>U$S${totalFinal.toFixed(2)}</strong>` +
          (descuentoAplicado ? ` <span class="text-muted">(incluye ${descuentoAplicado}% de descuento)</span>` : "");
      };

      cargarFechasOcupadas().then(() => {
        flatpickr(input, {
          mode: "range",
          dateFormat: "Y-m-d",
          minDate: "today",
          disable: fechasOcupadas,
          showMonths: 2,
          onChange: calcularTotal,
          onDayCreate: function (dObj, dStr, fp, dayElem) {
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
          }
        });
      });


      
// Oculta el cartel de cargando datos...
     document.getElementById("loader-overlay").style.display = "none";


      document.getElementById("btn-limpiar").addEventListener("click", () => {
        ["nombre", "email", "telefono", "comentarios"].forEach(id => {
          document.getElementById(id).value = "";
        });
        input._flatpickr.clear();
        document.getElementById("huespedes").value = "";
        totalContainer.textContent = "";
        ["nombre", "email", "rango", "huespedes"].forEach(limpiarError);
      });

      document.getElementById("btn-volver").addEventListener("click", () => {
        window.location.href = "index.html";
      });

//Monitoreo de campos en tiempo real
const btnEnviar = document.getElementById("btn-enviar");
const camposObligatorios = ["nombre", "email", "rango", "huespedes"];

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

  btnEnviar.disabled = !todosCompletos;
};


// Ejecutar al cargar
validarCamposObligatoriosEnTiempoReal();

// Escuchar cambios en los campos
camposObligatorios.forEach(id => {
  const campo = document.getElementById(id);
  campo.addEventListener("input", validarCamposObligatoriosEnTiempoReal);
  campo.addEventListener("change", validarCamposObligatoriosEnTiempoReal);
});




//Fin monitoreo
btnEnviar.addEventListener("click", () => {
  const nombre = document.getElementById("nombre").value.trim();
  const email = document.getElementById("email").value.trim();
  const telefono = document.getElementById("telefono").value.trim();
  const comentarios = document.getElementById("comentarios").value.trim();
  const rango = document.getElementById("rango").value.trim();
  const huespedes = document.getElementById("huespedes").value;
  const total = totalContainer.textContent;

  const esValido = validarCampos({ nombre, email, rango, huespedes });

  if (!esValido) {
    // Mostrar errores visuales, no enviar
    return;
  }

  const ahora = new Date();
  const fechaHora = ahora.toLocaleString("es-AR", {
    dateStyle: "full",
    timeStyle: "short"
  });

  const loader = document.getElementById("loader-overlay");
  const loaderText = loader.querySelector("p");
  loaderText.textContent = "Estamos procesando tu consulta...";
  loader.style.display = "flex";

  fetch("https://script.google.com/macros/s/AKfycbydWYJGj60EggNpLKvRelwzyd9YbHLgCrrfZT-TKl2zfTUX85TqHCNmhx1Q3rvjxrYQog/exec", {
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
      fechaHora
    })
  })
  .then(res => res.text())
  .then(seguimiento => {
    if (seguimiento.startsWith("CM-")) {
      document.querySelector("section.container").innerHTML = `
        <div class="alert alert-success text-center mt-5">
          <img src="assets/logo.png" alt="Aires de Miramar" style="max-width: 150px; margin-bottom: 1rem;">
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
            <a href="index.html" class="btn btn-primary">Volver al inicio</a>
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


    });
});
