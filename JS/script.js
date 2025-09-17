document.addEventListener('DOMContentLoaded', () => {
  // 🌊 Animación suave al hacer scroll
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      e.preventDefault();
      document.querySelector(this.getAttribute('href')).scrollIntoView({ behavior: 'smooth' });
    });
  });


  // 🧩 Función para mostrar extras
  window.toggleExtras = function(propiedad) {
    const lista = document.getElementById(`extras-${propiedad}`);
    const boton = document.getElementById(`btn-extras-${propiedad}`);
    const visible = lista.style.display === 'block';
    lista.style.display = visible ? 'none' : 'block';
    boton.innerHTML = visible
      ? '<i class="bi bi-chevron-down me-1"></i> Mostrar más'
      : '<i class="bi bi-chevron-up me-1"></i> Ocultar';
  };


  // 📤 Redirigir a formulario con datos
  window.redirigirConsulta = function(propiedad) {
    const rango = document.getElementById(`rango-${propiedad}`).value;
    const guests = document.getElementById(`guests-${propiedad}`).value;
    if (!rango || !guests) {
      alert("Por favor completá las fechas y la cantidad de huéspedes antes de consultar.");
      return;
    }
    const fechas = rango.split(" to ");
    if (fechas.length !== 2) {
      alert("Seleccioná un rango válido de fechas.");
      return;
    }
    const checkin = fechas[0];
    const checkout = fechas[1];
    const ingreso = new Date(checkin);
    const egreso = new Date(checkout);
    const noches = Math.ceil((egreso - ingreso) / (1000 * 60 * 60 * 24));
    const totalTexto = document.getElementById(`total-${propiedad}`).textContent;
    const totalMatch = totalTexto.match(/U\$S(\d+(\.\d+)?)/);
    const total = totalMatch ? totalMatch[1] : "0.00";
    const url = `formulario.html?propiedad=${propiedad}&ingreso=${checkin}&egreso=${checkout}&huespedes=${guests}&noches=${noches}&total=${total}`;
    window.location.href = url;
  };


  const apiKey = "AIzaSyDUkc_gvy-Z5WrXZLXeaUkkiKGkdFN0mNg"; // ← tu clave de Google Calendar

  // 🧠 Cargar precios y bloquear fechas
  fetch('precios.json')
    .then(response => response.json())
    .then(preciosData => {
      Object.keys(preciosData).forEach(nombre => {
        const precios = preciosData[nombre];
        const base = precios.base;
        const rangos = precios.rangos.map(r => ({
          desde: new Date(r.desde),
          hasta: new Date(r.hasta),
          precio: r.precio
        }));

        const inputId = `rango-${nombre}`;
        const totalId = `total-${nombre}`;
        const input = document.getElementById(inputId);
        const totalContainer = document.getElementById(totalId);
        if (!input || !totalContainer) return;

        const obtenerPrecio = fecha => {
          for (const rango of rangos) {
            if (fecha >= rango.desde && fecha <= rango.hasta) return rango.precio;
          }
          return base;
        };

        const calcularTotalDesdeRango = fechas => {
          if (fechas.length !== 2) {
            totalContainer.innerHTML = '';
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
          totalContainer.innerHTML = `Estadía de <strong>${noches}</strong> noche${noches > 1 ? 's' : ''} · Total estimado: <strong>U$S${total.toFixed(2)}</strong>`;
        };

        // 🔒 Obtener fechas ocupadas desde Google Calendar
        const fechasOcupadas = [];
        if (calendarIds[nombre]) {
          fetch(`https://www.googleapis.com/calendar/v3/calendars/${calendarIds[nombre]}/events?key=${apiKey}`)
            .then(response => response.json())
            .then(data => {
              const eventos = data.items || [];
              eventos.forEach(evento => {
                if (evento.start && evento.end) {
                  const inicio = new Date(evento.start.date || evento.start.dateTime);
                  const fin = new Date(evento.end.date || evento.end.dateTime);
                  let actual = new Date(inicio);
                  while (actual < fin) {
                    fechasOcupadas.push(new Date(actual));
                    actual.setDate(actual.getDate() + 1);
                  }
                }
              });

              // Inicializar Flatpickr con fechas bloqueadas
              flatpickr(input, {
                mode: "range",
                dateFormat: "Y-m-d",
                minDate: "today",
                disable: fechasOcupadas,
                showMonths: 2,
                onDayCreate: (_, __, ___, dayElem) => {
                  const fecha = dayElem.dateObj;
                  const precio = obtenerPrecio(fecha);
                  const etiqueta = document.createElement("span");
                  etiqueta.textContent = `U$S${precio}`;
                  etiqueta.style.fontSize = "0.65em";
                  etiqueta.style.position = "absolute";
                  etiqueta.style.bottom = "2px";
                  etiqueta.style.right = "2px";
                  etiqueta.style.color = "#198754";
                  etiqueta.style.backgroundColor = "transparent";
                  etiqueta.style.borderRadius = "4px";
                  etiqueta.style.padding = "1px 3px";
                  etiqueta.style.borderRadius = "3px";
                  etiqueta.style.pointerEvents = "none";
                  etiqueta.style.boxShadow = "none";
                  dayElem.style.position = "relative";

                  // Si el día está bloqueado, aplicar estilo tachado
                  if (dayElem.classList.contains("flatpickr-disabled")) {
                    etiqueta.style.color = "transparent";
                    etiqueta.style.textDecoration = "line-through";
                    etiqueta.style.backgroundColor = "transparent";
                    etiqueta.style.boxShadow = "none";
                  }

                  dayElem.appendChild(etiqueta);
                },
                onChange: calcularTotalDesdeRango
              });
            });
        } else {
          // Si no hay calendario, inicializar sin bloqueo
          flatpickr(input, {
            mode: "range",
            dateFormat: "Y-m-d",
            minDate: "today",
            showMonths: 2,
            onDayCreate: (_, __, ___, dayElem) => {
              const fecha = dayElem.dateObj;
              const precio = obtenerPrecio(fecha);
              const etiqueta = document.createElement("span");
              etiqueta.textContent = `U$S${precio}`;
              etiqueta.style.fontSize = "0.7em";
              etiqueta.style.color = "#198754";
              etiqueta.style.position = "absolute";
              etiqueta.style.bottom = "2px";
              etiqueta.style.right = "4px";
              dayElem.style.position = "relative";
              dayElem.appendChild(etiqueta);
            },
            onChange: calcularTotalDesdeRango
          });
        }
      });
    });
});




    document.getElementById('btn-elegi-destino').addEventListener('click', function() {
    const ficha = document.getElementById('nuestras-propiedades');
    if (ficha) {
      ficha.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });

    document.getElementById('btn-nosotros').addEventListener('click', function() {
    const ficha = document.getElementById('nosotros');
    if (ficha) {
      ficha.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });