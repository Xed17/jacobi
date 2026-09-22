/**
 * app.js
 * Coordinador de eventos de la interfaz de usuario, renderizado matemático (KaTeX)
 * y presentación de resultados para el método de Jacobi.
 */

// Estado global de la aplicación
const estado = {
  n: 4,
  decimales: 6,
  ultimoResultado: null,
  A_actual: null,
  b_actual: null
};

// ==========================================================================
// Funciones de formateo y renderizado matemático seguro (KaTeX)
// ==========================================================================

function formatearNumero(valor, decimales = estado.decimales) {
  if (valor === null || valor === undefined) return '—';
  const num = Number(valor);
  if (isNaN(num)) return 'NaN';
  return num.toFixed(decimales);
}

function formatearError(error, decimales = estado.decimales) {
  if (error === null || error === undefined) return '—';
  const num = Number(error);
  if (isNaN(num)) return 'NaN';
  if (num > 0 && num < Math.pow(10, -decimales + 1)) {
    return num.toExponential(4);
  }
  return num.toFixed(decimales);
}

function renderizarKaTeX(latex, elementoId, displayMode = true) {
  const el = document.getElementById(elementoId);
  if (!el) return;

  if (window.katex) {
    try {
      window.katex.render(latex, el, {
        displayMode,
        throwOnError: false
      });
    } catch (e) {
      el.textContent = latex;
    }
  } else {
    el.textContent = latex;
  }
}

// ==========================================================================
// Generación y gestión de la cuadrícula de entrada
// ==========================================================================

function renderizarCuadricula(n, datos = null) {
  estado.n = n;
  const contenedorEq = document.getElementById('contenedorEcuaciones');
  const contenedorX0 = document.getElementById('contenedorX0');
  if (!contenedorEq || !contenedorX0) return;

  contenedorEq.innerHTML = '';
  contenedorX0.innerHTML = '';

  for (let i = 0; i < n; i++) {
    const filaDiv = document.createElement('div');
    filaDiv.className = 'system-equation-row';

    for (let j = 0; j < n; j++) {
      const valA = datos ? (datos.A[i] ? datos.A[i][j] : 0) : (i === j ? 1 : 0);
      const inputA = document.createElement('input');
      inputA.type = 'number';
      inputA.step = 'any';
      inputA.id = `a_${i}_${j}`;
      inputA.className = 'coeff-input';
      inputA.value = valA;
      filaDiv.appendChild(inputA);

      const spanVar = document.createElement('span');
      spanVar.className = 'var-label';
      spanVar.innerHTML = `x<sub>${j + 1}</sub>${j < n - 1 ? ' +' : ''}`;
      filaDiv.appendChild(spanVar);
    }

    const spanEqual = document.createElement('span');
    spanEqual.className = 'equal-sign';
    spanEqual.textContent = '=';
    filaDiv.appendChild(spanEqual);

    const valB = datos ? (datos.b[i] !== undefined ? datos.b[i] : 0) : 0;
    const inputB = document.createElement('input');
    inputB.type = 'number';
    inputB.step = 'any';
    inputB.id = `b_${i}`;
    inputB.className = 'indep-input';
    inputB.value = valB;
    filaDiv.appendChild(inputB);

    contenedorEq.appendChild(filaDiv);

    // Vector Inicial x0
    const valX0 = datos ? (datos.x0[i] !== undefined ? datos.x0[i] : 0) : 0;
    const divX0 = document.createElement('div');
    divX0.className = 'x0-group';
    divX0.innerHTML = `
      <label for="x0_${i}" style="font-size: 12px; color: var(--text-muted);">x<sub>${i + 1}</sub><sup>(0)</sup>:</label>
      <input type="number" step="any" id="x0_${i}" class="coeff-input" style="width: 58px;" value="${valX0}">
    `;
    contenedorX0.appendChild(divX0);
  }

  if (datos) {
    if (datos.tolerancia !== undefined) {
      document.getElementById('inputTolerancia').value = datos.tolerancia;
    }
    if (datos.maxIteraciones !== undefined) {
      document.getElementById('inputMaxIter').value = datos.maxIteraciones;
    }
  }

  // Ocultar resultados previos si se redimensiona
  ocultarSeccionesResultados();
}

function ocultarSeccionesResultados() {
  document.getElementById('seccionAnalisis').classList.add('hidden');
  document.getElementById('seccionDespejes').classList.add('hidden');
  document.getElementById('seccionResultados').classList.add('hidden');
  estado.ultimoResultado = null;
}

// ==========================================================================
// Generación de despejes algebraicos de Jacobi en LaTeX
// ==========================================================================

function generarLatexDespejes(A, b) {
  const n = A.length;
  let latex = '\\begin{aligned}\n';

  for (let i = 0; i < n; i++) {
    const diag = A[i][i];
    let numerador = `${b[i]}`;

    for (let j = 0; j < n; j++) {
      if (i !== j) {
        const coef = A[i][j];
        if (coef !== 0) {
          const signo = coef > 0 ? '-' : '+';
          const coefAbs = Math.abs(coef);
          const factor = coefAbs === 1 ? '' : `${coefAbs}`;
          numerador += ` ${signo} ${factor} x_{${j + 1}}^{(k)}`;
        }
      }
    }

    latex += `x_{${i + 1}}^{(k+1)} &= \\frac{${numerador}}{${diag}} \\\\[6pt]\n`;
  }

  latex += '\\end{aligned}';
  return latex;
}

// ==========================================================================
// Renderizado de Resultados y Tabla
// ==========================================================================

function renderizarTablaHistorial(historial, n) {
  const cabecera = document.getElementById('cabeceraTablaHistorial');
  const cuerpo = document.getElementById('cuerpoTablaHistorial');
  if (!cabecera || !cuerpo) return;

  // Cabecera dinámica
  let thHtml = '<tr><th class="center" style="width: 60px;">Iteración (k)</th>';
  for (let j = 0; j < n; j++) {
    thHtml += `<th>x<sub>${j + 1}</sub></th>`;
  }
  thHtml += '<th>Error Relativo ||&Delta;x||<sub>&infin;</sub> / ||x||<sub>&infin;</sub></th></tr>';
  cabecera.innerHTML = thHtml;

  // Filas del historial
  let tbodyHtml = '';
  historial.forEach((item, index) => {
    const esFinal = index === historial.length - 1 && item.iteracion > 0;
    const claseTr = esFinal ? 'highlight-final' : '';
    
    tbodyHtml += `<tr class="${claseTr}">`;
    tbodyHtml += `<td class="center"><strong>${item.iteracion}</strong></td>`;
    
    for (let j = 0; j < n; j++) {
      tbodyHtml += `<td>${formatearNumero(item.x[j])}</td>`;
    }

    tbodyHtml += `<td>${formatearError(item.error)}</td>`;
    tbodyHtml += '</tr>';
  });

  cuerpo.innerHTML = tbodyHtml;
}

function renderizarResumen(resultado, n) {
  const resEstado = document.getElementById('resEstado');
  const resIter = document.getElementById('resIteraciones');
  const resError = document.getElementById('resErrorFinal');
  const resNormaRes = document.getElementById('resNormaResiduo');
  const badgeIter = document.getElementById('cantIteracionesBadge');

  if (resultado.convergio) {
    resEstado.innerHTML = '<span class="badge badge-success">Convergencia Exitosa</span>';
  } else {
    resEstado.innerHTML = '<span class="badge badge-danger">Límite Alcanzado (No Convergió)</span>';
  }

  resIter.textContent = resultado.iteraciones;
  badgeIter.textContent = `(${resultado.historial.length} registros)`;
  resError.textContent = formatearError(resultado.errorFinal);
  resNormaRes.textContent = formatearError(resultado.normaResiduo);

  // Vector Solución en LaTeX
  let latexSol = '\\mathbf{x}^* = \\begin{bmatrix} ';
  latexSol += resultado.solucion.map(v => formatearNumero(v)).join(' \\\\ ');
  latexSol += ' \\end{bmatrix}';
  renderizarKaTeX(latexSol, 'latexSolucion');

  // Vector Residuo en LaTeX
  let latexRes = '\\mathbf{r} = \\begin{bmatrix} ';
  latexRes += resultado.residuo.map(v => formatearError(v)).join(' \\\\ ');
  latexRes += ' \\end{bmatrix}';
  renderizarKaTeX(latexRes, 'latexResiduo');
}

// ==========================================================================
// Flujo Principal de Resolución (Jacobi)
// ==========================================================================

function resolverSistema() {
  const n = parseInt(document.getElementById('selectDimension').value, 10);
  const datos = leerDatosDesdeDOM(n);

  if (!datos.esValido) {
    alert(datos.errorMensaje || 'Por favor revise los datos ingresados.');
    return;
  }

  const { A, b, x0, tolerancia, maxIteraciones } = datos;
  estado.A_actual = A;
  estado.b_actual = b;

  // 1. Validar que la diagonal no sea nula
  const diagCheck = validarDiagonalNoNula(A);
  const seccionAnalisis = document.getElementById('seccionAnalisis');
  const bannerDominancia = document.getElementById('bannerDominancia');
  const cuerpoTablaDominancia = document.getElementById('cuerpoTablaDominancia');
  const justificacion = document.getElementById('justificacionDominancia');

  seccionAnalisis.classList.remove('hidden');

  if (!diagCheck.valido) {
    bannerDominancia.className = 'banner banner-danger';
    bannerDominancia.innerHTML = `
      <strong>Bloqueo Estricto:</strong> El elemento diagonal en la fila ${diagCheck.filaInvalida} es cero (<i>a</i><sub>${diagCheck.filaInvalida},${diagCheck.filaInvalida}</sub> = 0).
      En el método de Jacobi se divide obligatoriamente por <i>a<sub>ii</sub></i> para despejar <i>x<sub>i</sub></i>. No es posible ejecutar el método.
    `;
    cuerpoTablaDominancia.innerHTML = '';
    justificacion.textContent = 'La presencia de ceros en la diagonal principal impide el despeje de incógnitas.';
    document.getElementById('seccionDespejes').classList.add('hidden');
    document.getElementById('seccionResultados').classList.add('hidden');
    return;
  }

  // 2. Verificar dominancia diagonal estricta
  const edd = verificarDominanciaDiagonal(A);

  let tbodyDom = '';
  edd.detalles.forEach(d => {
    const estadoBadge = d.cumple 
      ? '<span class="badge badge-success">Cumple</span>' 
      : '<span class="badge badge-danger">Falla</span>';
    tbodyDom += `
      <tr>
        <td class="center">Fila ${d.fila}</td>
        <td>|<i>a</i><sub>${d.fila},${d.fila}</sub>| = ${d.diagonal}</td>
        <td>${d.sumaFueraDiagonal}</td>
        <td class="center">${d.diagonal} &gt; ${d.sumaFueraDiagonal}</td>
        <td class="center">${estadoBadge}</td>
      </tr>
    `;
  });
  cuerpoTablaDominancia.innerHTML = tbodyDom;

  // 3. Regla de negocio acordada en grill-me: Bloqueo estricto si no es EDD
  if (!edd.esDominante) {
    bannerDominancia.className = 'banner banner-danger';
    bannerDominancia.innerHTML = `
      <strong>Bloqueo Estricto Activado:</strong> La matriz ingresada NO es estrictamente diagonal dominante por filas.
      Se detiene la ejecución del método de Jacobi para asegurar la garantía de convergencia teórica exigida por el curso.
    `;
    justificacion.innerHTML = 'Al no cumplirse la condición |<i>a<sub>ii</sub></i>| &gt; &Sigma;<sub><i>j</i> &ne; <i>i</i></sub> |<i>a<sub>ij</sub></i>| en una o más filas, la matriz no es estrictamente diagonal dominante y no se garantiza que el radio espectral de la matriz de iteración cumpla &rho;(<i>T<sub>J</sub></i>) &lt; 1.';
    document.getElementById('seccionDespejes').classList.add('hidden');
    document.getElementById('seccionResultados').classList.add('hidden');
    return;
  }

  // Si es EDD: Aprobado para ejecución
  bannerDominancia.className = 'banner banner-success';
  bannerDominancia.innerHTML = `
    <strong>Matriz Estrictamente Diagonal Dominante (EDD):</strong> Todas las filas cumplen la condición de dominancia diagonal estricta.
    Esta condición suficiente garantiza teóricamente la convergencia única del método de Jacobi hacia la solución del sistema.
  `;
  justificacion.innerHTML = 'Dado que la matriz es estrictamente diagonal dominante por filas (|<i>a<sub>ii</sub></i>| &gt; &Sigma;<sub><i>j</i> &ne; <i>i</i></sub> |<i>a<sub>ij</sub></i>|), el radio espectral de la matriz de iteración <i>T<sub>J</sub></i> = <i>D</i><sup>&minus;1</sup>(<i>L</i> + <i>U</i>) cumple &rho;(<i>T<sub>J</sub></i>) &lt; 1, garantizando teóricamente la convergencia para cualquier vector inicial <b>x</b><sup>(0)</sup>.';

  // 4. Renderizar Despejes KaTeX
  const seccionDespejes = document.getElementById('seccionDespejes');
  seccionDespejes.classList.remove('hidden');
  const latexDespejes = generarLatexDespejes(A, b);
  renderizarKaTeX(latexDespejes, 'contenedorLatexDespejes');

  // 5. Ejecutar Algoritmo de Jacobi
  const resultado = ejecutarJacobi(A, b, x0, tolerancia, maxIteraciones);
  estado.ultimoResultado = resultado;

  // 6. Mostrar Resultados y Tabla
  const seccionResultados = document.getElementById('seccionResultados');
  seccionResultados.classList.remove('hidden');

  renderizarResumen(resultado, n);
  renderizarTablaHistorial(resultado.historial, n);

  // Desplazamiento suave hacia los resultados
  seccionResultados.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// ==========================================================================
// Inicialización y Listeners de Eventos
// ==========================================================================

document.addEventListener('DOMContentLoaded', () => {
  const selectDim = document.getElementById('selectDimension');
  const btnPreset = document.getElementById('btnCargarPreset');
  const btnResolver = document.getElementById('btnResolver');
  const selectDec = document.getElementById('selectDecimales');

  // Cargar preset 4x4 por defecto al iniciar
  renderizarCuadricula(PRESET_EJERCICIO_4X4.n, PRESET_EJERCICIO_4X4);

  // Cambio de dimensión N
  selectDim.addEventListener('change', (e) => {
    const nuevaDim = parseInt(e.target.value, 10);
    if (nuevaDim === 4) {
      renderizarCuadricula(4, PRESET_EJERCICIO_4X4);
    } else {
      renderizarCuadricula(nuevaDim);
    }
  });

  // Botón Cargar Ejercicio 4x4
  btnPreset.addEventListener('click', () => {
    selectDim.value = '4';
    renderizarCuadricula(4, PRESET_EJERCICIO_4X4);
  });

  // Cambio de decimales visibles (re-renderiza sin recalcular)
  selectDec.addEventListener('change', (e) => {
    estado.decimales = parseInt(e.target.value, 10);
    if (estado.ultimoResultado) {
      renderizarResumen(estado.ultimoResultado, estado.n);
      renderizarTablaHistorial(estado.ultimoResultado.historial, estado.n);
    }
  });

  // Botón Resolver Sistema
  btnResolver.addEventListener('click', resolverSistema);
});
