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

// Exportar para entorno Node.js si aplica (para tests)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    esMatrizCuadrada,
    validarDiagonalNoNula,
    verificarDominanciaDiagonal
  };
}
