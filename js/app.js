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
// Generación de despejes algebraicos (Jacobi y Gauss-Seidel) en LaTeX
// ==========================================================================

function generarLatexDespejesJacobi(A, b) {
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

function generarLatexDespejesGaussSeidel(A, b) {
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
          // Si j < i se usa el valor recién calculado (k+1), si j > i se usa el previo (k)
          const superIndice = j < i ? '(k+1)' : '(k)';
          numerador += ` ${signo} ${factor} x_{${j + 1}}^{${superIndice}}`;
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

  // Cabecera dinámica agrupada:
  // k | x_1 ... x_n | e(x_1) ... e(x_n) | Error Máximo (E)
  let thHtml = '<tr><th class="center" style="width: 50px;">k</th>';
  
  // Columnas de variables
  for (let j = 0; j < n; j++) {
    thHtml += `<th>x<sub>${j + 1}</sub></th>`;
  }
  
  // Columnas de errores relativos individuales
  for (let j = 0; j < n; j++) {
    thHtml += `<th>e(x<sub>${j + 1}</sub>)</th>`;
  }
  
  // Columna de error máximo
  thHtml += '<th>Error Máximo (E)</th></tr>';
  cabecera.innerHTML = thHtml;

  // Filas del historial
  let tbodyHtml = '';
  historial.forEach((item, index) => {
    const esFinal = index === historial.length - 1 && item.iteracion > 0;
    const claseTr = esFinal ? 'highlight-final' : '';
    
    tbodyHtml += `<tr class="${claseTr}">`;
    tbodyHtml += `<td class="center"><strong>${item.iteracion}</strong></td>`;
    
    // Valores de variables
    for (let j = 0; j < n; j++) {
      tbodyHtml += `<td>${formatearNumero(item.x[j])}</td>`;
    }

    // Errores relativos individuales
    for (let j = 0; j < n; j++) {
      const errVal = item.errores ? item.errores[j] : null;
      tbodyHtml += `<td>${formatearError(errVal)}</td>`;
    }

    // Error máximo global
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
// Flujo Principal de Resolución (Jacobi o Gauss-Seidel)
// ==========================================================================

function resolverSistema() {
  const n = parseInt(document.getElementById('selectDimension').value, 10);
  const metodo = document.getElementById('selectMetodo').value;
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
  const cabeceraTablaDominancia = document.getElementById('cabeceraTablaDominancia');
  const cuerpoTablaDominancia = document.getElementById('cuerpoTablaDominancia');
  const justificacion = document.getElementById('justificacionDominancia');
  const tituloAnalisis = document.getElementById('tituloAnalisis');
  const tituloDespejes = document.getElementById('tituloDespejes');
  const descDespejes = document.getElementById('descDespejes');
  const tituloResultados = document.getElementById('tituloResultados');

  seccionAnalisis.classList.remove('hidden');

  if (!diagCheck.valido) {
    bannerDominancia.className = 'banner banner-danger';
    bannerDominancia.innerHTML = `
      <strong>Bloqueo Estricto:</strong> El elemento diagonal en la fila ${diagCheck.filaInvalida} es cero (<i>a</i><sub>${diagCheck.filaInvalida},${diagCheck.filaInvalida}</sub> = 0).
      En métodos iterativos con división por <i>a<sub>ii</sub></i> no es posible despejar <i>x<sub>i</sub></i>. No se puede ejecutar el método.
    `;
    cabeceraTablaDominancia.innerHTML = '';
    cuerpoTablaDominancia.innerHTML = '';
    justificacion.textContent = 'La presencia de ceros en la diagonal principal impide el despeje de incógnitas.';
    document.getElementById('seccionDespejes').classList.add('hidden');
    document.getElementById('seccionResultados').classList.add('hidden');
    return;
  }

  let esValidoParaCalcular = false;
  let latexDespejes = '';

  // ==========================================================================
  // Flujo Específico según el Método Elegido
  // ==========================================================================
  if (metodo === 'gauss-seidel') {
    tituloAnalisis.textContent = 'Análisis Preliminar: Criterio de Convergencia de Sassenfeld';
    tituloDespejes.textContent = 'Fórmulas Iterativas Despejadas (Gauss-Seidel)';
    descDespejes.innerHTML = 'En Gauss-Seidel, las incógnitas <i>x<sub>j</sub></i><sup>(<i>k</i>+1)</sup> con <i>j</i> &lt; <i>i</i> ya calculadas en la iteración actual se sustituyen de inmediato en las siguientes ecuaciones:';
    tituloResultados.textContent = 'Resultados del Método de Gauss-Seidel';

    // Cabecera Sassenfeld
    cabeceraTablaDominancia.innerHTML = `
      <tr>
        <th class="center">Fila <i>i</i></th>
        <th>Desglose de &beta;<sub><i>i</i></sub></th>
        <th>Valor &beta;<sub><i>i</i></sub></th>
        <th class="center">Condición &beta;<sub><i>i</i></sub> &lt; 1</th>
        <th class="center">Estado</th>
      </tr>
    `;

    const sassenfeld = verificarCriterioSassenfeld(A);

    let tbodyHtml = '';
    sassenfeld.detalles.forEach(d => {
      const badge = d.cumpleFila 
        ? '<span class="badge badge-success">Cumple</span>' 
        : '<span class="badge badge-danger">Falla</span>';
      tbodyHtml += `
        <tr>
          <td class="center">Fila ${d.fila}</td>
          <td style="font-family: monospace; font-size: 11.5px;">&beta;<sub>${d.fila}</sub> = ${d.formulaTexto}</td>
          <td>${formatearNumero(d.beta, 4)}</td>
          <td class="center">${formatearNumero(d.beta, 4)} &lt; 1</td>
          <td class="center">${badge}</td>
        </tr>
      `;
    });
    cuerpoTablaDominancia.innerHTML = tbodyHtml;

    if (!sassenfeld.cumple) {
      bannerDominancia.className = 'banner banner-danger';
      bannerDominancia.innerHTML = `
        <strong>Bloqueo Estricto Activado:</strong> La matriz ingresada NO satisface el criterio de Sassenfeld (&beta; = ${sassenfeld.betaMax.toFixed(4)} &ge; 1).
        Se detiene la ejecución para asegurar estabilidad matemática.
      `;
      justificacion.innerHTML = `Al ser &beta; = max(&beta;<sub>i</sub>) = ${sassenfeld.betaMax.toFixed(4)} &ge; 1, no se garantiza que la matriz de iteración de Gauss-Seidel sea contractiva ni que el método converja.`;
      document.getElementById('seccionDespejes').classList.add('hidden');
      document.getElementById('seccionResultados').classList.add('hidden');
      return;
    }

    // Sassenfeld Aprobado
    bannerDominancia.className = 'banner banner-success';
    bannerDominancia.innerHTML = `
      <strong>Criterio de Sassenfeld Cumplido:</strong> El coeficiente de Sassenfeld es &beta; = max(&beta;<sub><i>i</i></sub>) = ${sassenfeld.betaMax.toFixed(4)} &lt; 1.
      Esta condición suficiente garantiza teóricamente la convergencia del método de Gauss-Seidel.
    `;
    justificacion.innerHTML = `Dado que &beta; = ${sassenfeld.betaMax.toFixed(4)} &lt; 1, la norma de la matriz de iteración satisface ||<i>T<sub>GS</sub></i>||<sub>&infin;</sub> &le; &beta; &lt; 1, asegurando convergencia geométrica para cualquier vector inicial <b>x</b><sup>(0)</sup>.`;

    latexDespejes = generarLatexDespejesGaussSeidel(A, b);
    esValidoParaCalcular = true;

  } else {
    // Método Jacobi (EDD)
    tituloAnalisis.textContent = 'Análisis Preliminar: Dominancia Diagonal Estricta (EDD)';
    tituloDespejes.textContent = 'Fórmulas Iterativas Despejadas (Jacobi)';
    descDespejes.innerHTML = 'En Jacobi, cada componente <i>x<sub>i</sub></i><sup>(<i>k</i>+1)</sup> se calcula exclusivamente a partir del vector de la iteración previa <b>x</b><sup>(<i>k</i>)</sup>:';
    tituloResultados.textContent = 'Resultados del Método de Jacobi';

    // Cabecera EDD
    cabeceraTablaDominancia.innerHTML = `
      <tr>
        <th class="center">Fila <i>i</i></th>
        <th>Elemento Diagonal |<i>a<sub>ii</sub></i>|</th>
        <th>Suma fuera de diagonal &Sigma;<sub><i>j</i> &ne; <i>i</i></sub> |<i>a<sub>ij</sub></i>|</th>
        <th class="center">Condición |<i>a<sub>ii</sub></i>| &gt; &Sigma; |<i>a<sub>ij</sub></i>|</th>
        <th class="center">Estado</th>
      </tr>
    `;

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

    if (!edd.esDominante) {
      bannerDominancia.className = 'banner banner-danger';
      bannerDominancia.innerHTML = `
        <strong>Bloqueo Estricto Activado:</strong> La matriz ingresada NO es estrictamente diagonal dominante por filas.
        Se detiene la ejecución del método de Jacobi para asegurar la garantía de convergencia teórica exigida por el curso.
      `;
      justificacion.innerHTML = 'Al no cumplirse la condición |<i>a<sub>ii</sub></i>| &gt; &Sigma;<sub><i>j</i> &ne; <i>i</i></sub> |<i>a<sub>ij</sub></i>| en una o más filas, la matriz no es estrictamente diagonal dominante y no se garantiza que el radio espectral cumpla &rho;(<i>T<sub>J</sub></i>) &lt; 1.';
      document.getElementById('seccionDespejes').classList.add('hidden');
      document.getElementById('seccionResultados').classList.add('hidden');
      return;
    }

    // Jacobi Aprobado
    bannerDominancia.className = 'banner banner-success';
    bannerDominancia.innerHTML = `
      <strong>Matriz Estrictamente Diagonal Dominante (EDD):</strong> Todas las filas cumplen la condición de dominancia diagonal estricta.
      Esta condición suficiente garantiza teóricamente la convergencia única del método de Jacobi hacia la solución del sistema.
    `;
    justificacion.innerHTML = 'Dado que la matriz es estrictamente diagonal dominante por filas (|<i>a<sub>ii</sub></i>| &gt; &Sigma;<sub><i>j</i> &ne; <i>i</i></sub> |<i>a<sub>ij</sub></i>|), el radio espectral de la matriz de iteración <i>T<sub>J</sub></i> = <i>D</i><sup>&minus;1</sup>(<i>L</i> + <i>U</i>) cumple &rho;(<i>T<sub>J</sub></i>) &lt; 1, garantizando teóricamente la convergencia para cualquier vector inicial <b>x</b><sup>(0)</sup>.';

    latexDespejes = generarLatexDespejesJacobi(A, b);
    esValidoParaCalcular = true;
  }

  if (!esValidoParaCalcular) return;

  // 4. Renderizar Despejes KaTeX
  const seccionDespejes = document.getElementById('seccionDespejes');
  seccionDespejes.classList.remove('hidden');
  renderizarKaTeX(latexDespejes, 'contenedorLatexDespejes');

  // 5. Ejecutar Algoritmo Seleccionado
  const resultado = metodo === 'gauss-seidel'
    ? ejecutarGaussSeidel(A, b, x0, tolerancia, maxIteraciones)
    : ejecutarJacobi(A, b, x0, tolerancia, maxIteraciones);

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
  const selectMet = document.getElementById('selectMetodo');
  const btnPreset = document.getElementById('btnCargarPreset');
  const btnResolver = document.getElementById('btnResolver');
  const selectDec = document.getElementById('selectDecimales');

  // Cargar preset 4x4 por defecto al iniciar
  renderizarCuadricula(PRESET_EJERCICIO_4X4.n, PRESET_EJERCICIO_4X4);

  // Cambio de método (oculta resultados previos para forzar nuevo cálculo limpio)
  if (selectMet) {
    selectMet.addEventListener('change', () => {
      ocultarSeccionesResultados();
    });
  }

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
