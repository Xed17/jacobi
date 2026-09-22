/**
 * datos.js
 * Definición del problema inicial de plan.md, presets y utilidades de lectura/escritura del estado.
 */

const PRESET_EJERCICIO_4X4 = {
  n: 4,
  A: [
    [10, -2, -1,  0],
    [-1,  8,  0, -2],
    [-2,  0, 12, -3],
    [0,  -1, -2,  9]
  ],
  b: [15, 18, 25, 20],
  x0: [0, 0, 0, 0],
  tolerancia: 0.0001,
  maxIteraciones: 1000
};

/**
 * Genera una matriz n x n inicializada en ceros.
 * @param {number} n 
 * @returns {number[][]}
 */
function crearMatrizCeros(n) {
  return Array.from({ length: n }, () => new Array(n).fill(0));
}

/**
 * Genera un vector de longitud n inicializado en ceros.
 * @param {number} n 
 * @returns {number[]}
 */
function crearVectorCeros(n) {
  return new Array(n).fill(0);
}

/**
 * Lee los valores de la matriz A, vector b y vector x0 desde el DOM.
 * @param {number} n Dimensión del sistema
 * @returns {{
 *   A: number[][],
 *   b: number[],
 *   x0: number[],
 *   tolerancia: number,
 *   maxIteraciones: number,
 *   esValido: boolean,
 *   errorMensaje?: string
 * }}
 */
function leerDatosDesdeDOM(n) {
  const A = [];
  const b = [];
  const x0 = [];

  for (let i = 0; i < n; i++) {
    const fila = [];
    for (let j = 0; j < n; j++) {
      const inputA = document.getElementById(`a_${i}_${j}`);
      if (!inputA || inputA.value.trim() === '') {
        return { esValido: false, errorMensaje: `Falta completar el coeficiente a_{${i+1},${j+1}}` };
      }
      const valA = parseFloat(inputA.value);
      if (isNaN(valA)) {
        return { esValido: false, errorMensaje: `El valor en a_{${i+1},${j+1}} no es un número válido.` };
      }
      fila.push(valA);
    }
    A.push(fila);

    const inputB = document.getElementById(`b_${i}`);
    if (!inputB || inputB.value.trim() === '') {
      return { esValido: false, errorMensaje: `Falta completar el término independiente b_{${i+1}}` };
    }
    const valB = parseFloat(inputB.value);
    if (isNaN(valB)) {
      return { esValido: false, errorMensaje: `El valor en b_{${i+1}} no es un número válido.` };
    }
    b.push(valB);

    const inputX0 = document.getElementById(`x0_${i}`);
    const valX0 = inputX0 && inputX0.value.trim() !== '' ? parseFloat(inputX0.value) : 0;
    if (isNaN(valX0)) {
      return { esValido: false, errorMensaje: `El valor inicial x0_{${i+1}} no es un número válido.` };
    }
    x0.push(valX0);
  }

  const inputTol = document.getElementById('inputTolerancia');
  const tolerancia = inputTol ? parseFloat(inputTol.value) : 1e-4;
  if (isNaN(tolerancia) || tolerancia <= 0) {
    return { esValido: false, errorMensaje: 'La tolerancia debe ser un número positivo mayor a 0 (ej. 1e-4 o 0.0001).' };
  }

  const inputMaxIter = document.getElementById('inputMaxIter');
  const maxIteraciones = inputMaxIter ? parseInt(inputMaxIter.value, 10) : 1000;
  if (isNaN(maxIteraciones) || maxIteraciones < 1) {
    return { esValido: false, errorMensaje: 'El número máximo de iteraciones debe ser un entero positivo (mínimo 1).' };
  }

  return {
    A,
    b,
    x0,
    tolerancia,
    maxIteraciones,
    esValido: true
  };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    PRESET_EJERCICIO_4X4,
    crearMatrizCeros,
    crearVectorCeros,
    leerDatosDesdeDOM
  };
}
