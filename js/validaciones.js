/**
 * validaciones.js
 * Módulo de validaciones matemáticas para el sistema de ecuaciones lineales.
 */

/**
 * Valida si una matriz es cuadrada (n x n)
 * @param {number[][]} A 
 * @returns {boolean}
 */
function esMatrizCuadrada(A) {
  return Array.isArray(A) && A.length > 0 && A.every(fila => Array.isArray(fila) && fila.length === A.length);
}

/**
 * Valida que ningún elemento de la diagonal principal sea cero.
 * En Jacobi, la división por a_ii es obligatoria en cada despeje.
 * @param {number[][]} A 
 * @returns {{valido: boolean, filaInvalida: number|null}}
 */
function validarDiagonalNoNula(A) {
  for (let i = 0; i < A.length; i++) {
    if (Math.abs(A[i][i]) === 0) {
      return { valido: false, filaInvalida: i + 1 };
    }
  }
  return { valido: true, filaInvalida: null };
}

/**
 * Verifica si la matriz A es Estrictamente Diagonal Dominante (EDD) por filas.
 * Condición: |a_ii| > sum_{j != i} |a_ij| para todo i.
 * 
 * @param {number[][]} A 
 * @returns {{
 *   esDominante: boolean,
 *   detalles: Array<{fila: number, diagonal: number, sumaFueraDiagonal: number, cumple: boolean}>
 * }}
 */
function verificarDominanciaDiagonal(A) {
  const detalles = [];
  let esDominante = true;

  for (let i = 0; i < A.length; i++) {
    const diagonal = Math.abs(A[i][i]);
    let sumaFueraDiagonal = 0;

    for (let j = 0; j < A[i].length; j++) {
      if (i !== j) {
        sumaFueraDiagonal += Math.abs(A[i][j]);
      }
    }

    // Redondear a 10 decimales para evitar problemas de precisión en punto flotante
    const diagRounded = Math.round(diagonal * 1e10) / 1e10;
    const sumRounded = Math.round(sumaFueraDiagonal * 1e10) / 1e10;
    const cumple = diagRounded > sumRounded;

    detalles.push({
      fila: i + 1,
      diagonal,
      sumaFueraDiagonal,
      cumple
    });

    if (!cumple) {
      esDominante = false;
    }
  }

  return {
    esDominante,
    detalles
  };
}

/**
 * Verifica el Criterio de Convergencia de Sassenfeld para el método de Gauss-Seidel.
 * 
 * Para la primera fila (i = 0):
 *   beta_0 = ( sum_{j=1}^{n-1} |a_{0,j}| ) / |a_{0,0}|
 * 
 * Para las filas siguientes (i > 0):
 *   beta_i = ( sum_{j=0}^{i-1} |a_{i,j}| * beta_j + sum_{j=i+1}^{n-1} |a_{i,j}| ) / |a_{i,i}|
 * 
 * Condición de Sassenfeld:
 *   beta = max_i(beta_i) < 1 garantiza la convergencia de Gauss-Seidel.
 * 
 * @param {number[][]} A Matriz cuadrada
 * @returns {{
 *   cumple: boolean,
 *   betaMax: number,
 *   detalles: Array<{fila: number, beta: number, formulaTexto: string, cumpleFila: boolean}>
 * }}
 */
function verificarCriterioSassenfeld(A) {
  const n = A.length;
  const betas = [];
  const detalles = [];
  let cumple = true;

  for (let i = 0; i < n; i++) {
    const diag = Math.abs(A[i][i]);
    if (diag === 0) {
      return {
        cumple: false,
        betaMax: Infinity,
        detalles: [{ fila: i + 1, beta: Infinity, formulaTexto: 'División entre cero (diagonal nula)', cumpleFila: false }]
      };
    }

    let sumaAnteriores = 0;
    let sumaPosteriores = 0;
    const terminosTexto = [];

    // Términos previos ponderados por beta_j
    for (let j = 0; j < i; j++) {
      const coef = Math.abs(A[i][j]);
      sumaAnteriores += coef * betas[j];
      terminosTexto.push(`|${A[i][j]}|(${betas[j].toFixed(4)})`);
    }

    // Términos posteriores no ponderados
    for (let j = i + 1; j < n; j++) {
      const coef = Math.abs(A[i][j]);
      sumaPosteriores += coef;
      terminosTexto.push(`|${A[i][j]}|`);
    }

    const numerador = sumaAnteriores + sumaPosteriores;
    const beta_i = numerador / diag;
    betas.push(beta_i);

    const cumpleFila = beta_i < 1;
    if (!cumpleFila) {
      cumple = false;
    }

    const formulaTexto = `(${terminosTexto.join(' + ') || '0'}) / |${A[i][i]}|`;

    detalles.push({
      fila: i + 1,
      beta: beta_i,
      formulaTexto,
      cumpleFila
    });
  }

  const betaMax = Math.max(...betas);
  const betaMaxRounded = Math.round(betaMax * 1e10) / 1e10;
  cumple = betaMaxRounded < 1;

  return {
    cumple,
    betaMax,
    detalles
  };
}

// Exportar para entorno Node.js si aplica (para tests)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    esMatrizCuadrada,
    validarDiagonalNoNula,
    verificarDominanciaDiagonal,
    verificarCriterioSassenfeld
  };
}
