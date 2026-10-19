/**
 * gauss-seidel.js
 * Algoritmo numérico iterativo de Gauss-Seidel para sistemas de ecuaciones lineales Ax = b.
 */

/**
 * Multiplica una matriz cuadrada A por un vector x.
 * @param {number[][]} A 
 * @param {number[]} x 
 * @returns {number[]}
 */
function multiplicarMatrizVectorGS(A, x) {
  return A.map(fila =>
    fila.reduce((suma, valor, j) => suma + valor * x[j], 0)
  );
}

/**
 * Calcula la norma infinito de un vector: max_i |v_i|
 * @param {number[]} vector 
 * @returns {number}
 */
function normaInfinitoGS(vector) {
  return Math.max(...vector.map(v => Math.abs(v)));
}

/**
 * Calcula el residuo r = b - Ax y su norma infinito.
 * @param {number[][]} A 
 * @param {number[]} b 
 * @param {number[]} x 
 * @returns {{residuo: number[], normaResiduo: number}}
 */
function calcularResiduoGS(A, b, x) {
  const Ax = multiplicarMatrizVectorGS(A, x);
  const residuo = b.map((val, i) => val - Ax[i]);
  const normaRes = normaInfinitoGS(residuo);
  return { residuo, normaResiduo: normaRes };
}

/**
 * Ejecuta el método iterativo de Gauss-Seidel.
 * En cada iteración k+1, cada incógnita x_i se calcula utilizando inmediatamente
 * los valores ya actualizados x_j^(k+1) para j < i, y los valores previos x_j^(k) para j > i.
 * 
 * @param {number[][]} A Matriz de coeficientes n x n
 * @param {number[]} b Vector de términos independientes
 * @param {number[]} xInicial Vector inicial x^(0)
 * @param {number} tolerancia Criterio de parada epsilon (ej. 1e-4)
 * @param {number} maxIteraciones Límite máximo de iteraciones
 * @returns {{
 *   convergio: boolean,
 *   iteraciones: number,
 *   solucion: number[],
 *   errorFinal: number,
 *   residuo: number[],
 *   normaResiduo: number,
 *   historial: Array<{iteracion: number, x: number[], errores: (number|null)[], error: number|null}>
 * }}
 */
function ejecutarGaussSeidel(A, b, xInicial, tolerancia = 1e-4, maxIteraciones = 1000) {
  const n = A.length;
  let xActual = [...xInicial];
  const historial = [];

  // Registrar iteración inicial k = 0
  historial.push({
    iteracion: 0,
    x: [...xActual],
    errores: new Array(n).fill(null),
    error: null
  });

  for (let k = 1; k <= maxIteraciones; k++) {
    // xNuevo comienza con los valores de la iteración anterior
    const xNuevo = [...xActual];

    for (let i = 0; i < n; i++) {
      let suma = 0;
      for (let j = 0; j < n; j++) {
        if (i !== j) {
          // Si j < i, xNuevo[j] ya contiene el valor recién calculado en esta misma iteración (k+1)
          // Si j > i, xNuevo[j] aún contiene el valor de la iteración previa (k)
          suma += A[i][j] * xNuevo[j];
        }
      }
      xNuevo[i] = (b[i] - suma) / A[i][i];
    }

    // Calcular errores relativos individuales: |x_i^(k+1) - x_i^(k)| / |x_i^(k+1)|
    const errores = [];
    for (let i = 0; i < n; i++) {
      const diff = Math.abs(xNuevo[i] - xActual[i]);
      const denom = Math.abs(xNuevo[i]);
      const err = (denom === 0 || denom < 1e-14) ? diff : diff / denom;
      errores.push(err);
    }

    const errorMaximo = Math.max(...errores);

    historial.push({
      iteracion: k,
      x: [...xNuevo],
      errores: [...errores],
      error: errorMaximo
    });

    if (errorMaximo < tolerancia) {
      const { residuo, normaResiduo } = calcularResiduoGS(A, b, xNuevo);
      return {
        convergio: true,
        iteraciones: k,
        solucion: xNuevo,
        errorFinal: errorMaximo,
        residuo,
        normaResiduo,
        historial
      };
    }

    xActual = [...xNuevo];
  }

  // Si se alcanza el límite sin converger
  const { residuo, normaResiduo } = calcularResiduoGS(A, b, xActual);
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

// Exportar para entorno Node.js si aplica (para tests)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    multiplicarMatrizVectorGS,
    normaInfinitoGS,
    calcularResiduoGS,
    ejecutarGaussSeidel
  };
}
