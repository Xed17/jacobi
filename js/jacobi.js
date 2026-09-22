/**
 * jacobi.js
 * Algoritmo numérico iterativo de Jacobi para sistemas de ecuaciones lineales Ax = b.
 */

/**
 * Multiplica una matriz cuadrada A por un vector x.
 * @param {number[][]} A 
 * @param {number[]} x 
 * @returns {number[]}
 */
function multiplicarMatrizVector(A, x) {
  return A.map(fila =>
    fila.reduce((suma, valor, j) => suma + valor * x[j], 0)
  );
}

/**
 * Calcula la norma infinito de un vector: max_i |v_i|
 * @param {number[]} vector 
 * @returns {number}
 */
function normaInfinito(vector) {
  return Math.max(...vector.map(v => Math.abs(v)));
}

/**
 * Calcula el error relativo utilizando la norma infinito vectorial:
 * E^(k+1) = ||x^(k+1) - x^(k)||_inf / ||x^(k+1)||_inf
 * Con protección si ||x^(k+1)||_inf es 0 o cercano a cero.
 * 
 * @param {number[]} xNuevo Vector en la iteración k+1
 * @param {number[]} xAnterior Vector en la iteración k
 * @returns {number}
 */
function calcularErrorRelativoVectorial(xNuevo, xAnterior) {
  const diferencias = xNuevo.map((val, i) => Math.abs(val - xAnterior[i]));
  const normaDiff = Math.max(...diferencias);
  const normaNuevo = normaInfinito(xNuevo);

  // Protección contra división por cero
  if (normaNuevo === 0 || Math.abs(normaNuevo) < 1e-14) {
    return normaDiff;
  }

  return normaDiff / normaNuevo;
}

/**
 * Calcula el residuo r = b - Ax y su norma infinito.
 * @param {number[][]} A 
 * @param {number[]} b 
 * @param {number[]} x 
 * @returns {{residuo: number[], normaResiduo: number}}
 */
function calcularResiduo(A, b, x) {
  const Ax = multiplicarMatrizVector(A, x);
  const residuo = b.map((val, i) => val - Ax[i]);
  const normaRes = normaInfinito(residuo);
  return { residuo, normaResiduo: normaRes };
}

/**
 * Ejecuta el método de Jacobi.
 * Criterio de parada: error < tolerancia o k >= maxIteraciones.
 * 
 * @param {number[][]} A Matriz de coeficientes n x n
 * @param {number[]} b Vector de términos independientes
 * @param {number[]} xInicial Vector inicial x^(0)
 * @param {number} tolerancia Criterio de parada epsilon (ej. 1e-4)
 * @param {number} maxIteraciones Límite de seguridad
 * @returns {{
 *   convergio: boolean,
 *   iteraciones: number,
 *   solucion: number[],
 *   errorFinal: number,
 *   residuo: number[],
 *   normaResiduo: number,
 *   historial: Array<{iteracion: number, x: number[], error: number|null}>
 * }}
 */
function ejecutarJacobi(A, b, xInicial, tolerancia = 1e-4, maxIteraciones = 1000) {
  const n = A.length;
  let xActual = [...xInicial];
  const historial = [];

  // Registrar iteración inicial k = 0
  historial.push({
    iteracion: 0,
    x: [...xActual],
    error: null
  });

  for (let k = 1; k <= maxIteraciones; k++) {
    const xNuevo = new Array(n).fill(0);

    for (let i = 0; i < n; i++) {
      let suma = 0;
      for (let j = 0; j < n; j++) {
        if (i !== j) {
          suma += A[i][j] * xActual[j];
        }
      }
      xNuevo[i] = (b[i] - suma) / A[i][i];
    }

    const error = calcularErrorRelativoVectorial(xNuevo, xActual);

    historial.push({
      iteracion: k,
      x: [...xNuevo],
      error
    });

    if (error < tolerancia) {
      const { residuo, normaResiduo } = calcularResiduo(A, b, xNuevo);
      return {
        convergio: true,
        iteraciones: k,
        solucion: xNuevo,
        errorFinal: error,
        residuo,
        normaResiduo,
        historial
      };
    }

    xActual = xNuevo;
  }

  // Si llega al límite de iteraciones sin converger
  const { residuo, normaResiduo } = calcularResiduo(A, b, xActual);
  const ultimoError = historial[historial.length - 1].error;

  return {
    convergio: false,
    iteraciones: maxIteraciones,
    solucion: xActual,
    errorFinal: ultimoError,
    residuo,
    normaResiduo,
    historial
  };
}

// Exportar para entorno Node.js si aplica
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    multiplicarMatrizVector,
    normaInfinito,
    calcularErrorRelativoVectorial,
    calcularResiduo,
    ejecutarJacobi
  };
}
