document.addEventListener('DOMContentLoaded', () => {
    // --- Referencias a Elementos del DOM ---
    const maturityDateInput = document.getElementById('maturityDate');
    const finalValueInput = document.getElementById('finalValue');
    const purchaseTableBody = document.getElementById('purchaseTableBody');
    const addPurchaseBtn = document.getElementById('addPurchaseBtn'); // Botón para agregar
    const purchaseRowTemplate = document.querySelector('.purchaseRowTemplate'); // Plantilla de fila
    const calculateBtn = document.getElementById('calculateBtn');
    const tnaResultSpan = document.getElementById('tnaResult');
    const teaResultSpan = document.getElementById('teaResult');
    const messageArea = document.getElementById('messageArea');

    // --- Comprobaciones iniciales (para depuración) ---
    if (!addPurchaseBtn) {
        console.error("Error: No se encontró el botón con id 'addPurchaseBtn'.");
        return; // Detener si el botón no existe
    }
    if (!purchaseRowTemplate) {
        console.error("Error: No se encontró la plantilla de fila con clase '.purchaseRowTemplate'.");
        return; // Detener si la plantilla no existe
    }
     if (!purchaseTableBody) {
        console.error("Error: No se encontró el cuerpo de la tabla con id 'purchaseTableBody'.");
        return; // Detener si el tbody no existe
    }


    // --- Funciones de Utilidad ---

    /**
     * Muestra un mensaje de error o éxito en el área designada.
     * @param {string} message - El mensaje a mostrar.
     * @param {boolean} isError - True si es un error, false si es éxito.
     */
    function displayMessage(message, isError = true) {
        messageArea.textContent = message;
        messageArea.className = isError? 'messageArea error' : 'messageArea success';
        if (isError) {
            tnaResultSpan.textContent = '--';
            teaResultSpan.textContent = '--';
        }
    }

    /**
     * Limpia el área de mensajes.
     */
    function clearMessage() {
        messageArea.textContent = '';
        messageArea.className = 'messageArea';
    }

    /**
     * Añade una nueva fila a la tabla de compras.
     */
    function addPurchaseRow() {
        // Asegurarse de que la plantilla todavía existe
        if (!purchaseRowTemplate) {
             console.error("Error en addPurchaseRow: La plantilla de fila no está disponible.");
             displayMessage("Error interno: No se puede agregar fila (plantilla no encontrada).");
             return;
        }
         // Asegurarse de que el cuerpo de la tabla todavía existe
        if (!purchaseTableBody) {
             console.error("Error en addPurchaseRow: El cuerpo de la tabla no está disponible.");
             displayMessage("Error interno: No se puede agregar fila (tabla no encontrada).");
             return;
        }

        const newRow = purchaseRowTemplate.cloneNode(true);
        newRow.classList.remove('purchaseRowTemplate');
        newRow.style.display = ''; // Hacer visible la fila clonada

        newRow.querySelectorAll('input').forEach(input => input.value = '');

        purchaseTableBody.appendChild(newRow);
        clearMessage(); // Limpiar mensajes al agregar fila exitosamente
    }

    /**
     * Elimina una fila de la tabla de compras.
     * @param {HTMLButtonElement} button - El botón "Eliminar" que fue presionado.
     */
    function removePurchaseRow(button) {
        const rowToRemove = button.closest('tr');
        if (purchaseTableBody.querySelectorAll('tr:not(.purchaseRowTemplate)').length > 1) {
             rowToRemove.remove();
             clearMessage();
        } else {
            displayMessage('Debe mantener al menos una fila de compra.');
        }
    }

    /**
     * Lee y valida las entradas del formulario.
     * @returns {object|null} Un objeto con los datos validados o null si hay error.
     */
    function readInputs() {
        clearMessage();
        const maturityDateStr = maturityDateInput.value;
        const finalValue = parseFloat(finalValueInput.value);
        const purchases =;
        let earliestPurchaseDateStr = null;

        const purchaseRows = purchaseTableBody.querySelectorAll('tr:not(.purchaseRowTemplate)');

        if (purchaseRows.length === 0) {
            displayMessage('Debe ingresar al menos una transacción de compra.');
            return null;
        }
        if (!maturityDateStr) {
            displayMessage('Por favor, ingrese la Fecha de Vencimiento.');
            maturityDateInput.focus();
            return null;
        }
         if (isNaN(finalValue) |
| finalValue <= 0) {
            displayMessage('Por favor, ingrese un Valor de Pago Unitario al Vencimiento válido y positivo.');
            finalValueInput.focus();
            return null;
        }

        const maturityDateObj = new Date(maturityDateStr + 'T00:00:00');

        let isValid = true;
        purchaseRows.forEach((row, index) => {
            if (!isValid) return;

            const dateInput = row.querySelector('input[name="purchaseDate"]');
            const qtyInput = row.querySelector('input[name="purchaseQty"]');
            const priceInput = row.querySelector('input[name="purchasePrice"]');

            const dateStr = dateInput.value;
            const quantity = parseInt(qtyInput.value);
            const price = parseFloat(priceInput.value);

            if (!dateStr) {
                displayMessage(`Fila ${index + 1}: Ingrese la Fecha de Compra.`);
                dateInput.focus();
                isValid = false; return;
            }
            if (isNaN(quantity) |
| quantity <= 0) {
                displayMessage(`Fila ${index + 1}: Ingrese una Cantidad válida y positiva.`);
                qtyInput.focus();
                isValid = false; return;
            }
            if (isNaN(price) |
| price <= 0) {
                displayMessage(`Fila ${index + 1}: Ingrese un Precio Unitario válido y positivo.`);
                priceInput.focus();
                isValid = false; return;
            }

            const purchaseDateObj = new Date(dateStr + 'T00:00:00');

            if (purchaseDateObj >= maturityDateObj) {
                 displayMessage(`Fila ${index + 1}: La Fecha de Compra debe ser anterior a la Fecha de Vencimiento.`);
                 dateInput.focus();
                 isValid = false; return;
            }

            purchases.push({ date: dateStr, quantity, price });

            if (!earliestPurchaseDateStr |
| purchaseDateObj < new Date(earliestPurchaseDateStr + 'T00:00:00')) {
                earliestPurchaseDateStr = dateStr;
            }
        });

        if (!isValid) return null;

        return {
            maturityDate: maturityDateStr,
            finalValue,
            purchases,
            earliestPurchaseDate: earliestPurchaseDateStr
        };
    }

    /**
     * Muestra los resultados calculados en la interfaz.
     * @param {number} tna - Tasa Nominal Anual.
     * @param {number} tea - Tasa Efectiva Anual.
     */
    function displayResults(tna, tea) {
        tnaResultSpan.textContent = (tna * 100).toFixed(2);
        teaResultSpan.textContent = (tea * 100).toFixed(2);
    }

    // --- Lógica de Cálculo Financiero ---

    /**
     * Calcula días entre fechas (YYYY-MM-DD). Usa UTC. 
     * @param {string} startDateString
     * @param {string} endDateString
     * @returns {number}
     */
    function getDaysBetween(startDateString, endDateString) {
        const start = new Date(startDateString);
        const end = new Date(endDateString);
        const startUTC = Date.UTC(start.getFullYear(), start.getMonth(), start.getDate());
        const endUTC = Date.UTC(end.getFullYear(), end.getMonth(), end.getDate());
        const oneDayMs = 1000 * 60 * 60 * 24;
        return Math.round((endUTC - startUTC) / oneDayMs);
    }

    /**
     * Calcula precio promedio ponderado.
     * @param {Array<object>} purchases - Array de {quantity, price}.
     * @returns {number}
     */
    function getWeightedAveragePrice(purchases) {
        let totalCost = 0;
        let totalQuantity = 0;
        purchases.forEach(p => {
            totalCost += p.quantity * p.price;
            totalQuantity += p.quantity;
        });
        return totalQuantity > 0? totalCost / totalQuantity : 0;
    }

    /**
     * Calcula rendimiento del período.
     * @param {number} weightedAvgPrice
     * @param {number} finalValue
     * @returns {number}
     */
    function calculatePeriodReturn(weightedAvgPrice, finalValue) {
         if (weightedAvgPrice <= 0) throw new Error("El precio promedio ponderado no puede ser cero o negativo.");
         return (finalValue / weightedAvgPrice) - 1;
    }

    /**
     * Calcula TNA (anualización simple). [1, 2, 3, 4, 5]
     * @param {number} periodReturn
     * @param {number} daysHeld
     * @returns {number}
     */
    function calculateTNA(periodReturn, daysHeld) {
        if (daysHeld <= 0) throw new Error("El período de tenencia debe ser mayor a cero días.");
        return periodReturn * (365 / daysHeld);
    }

    /**
     * Calcula TEA (anualización compuesta). [1, 2, 6, 3, 7, 8, 9]
     * @param {number} periodReturn
     * @param {number} daysHeld
     * @returns {number}
     */
    function calculateTEA(periodReturn, daysHeld) {
         if (daysHeld <= 0) throw new Error("El período de tenencia debe ser mayor a cero días.");
         const base = 1 + periodReturn;
         if (base < 0) {
            console.warn("Base negativa para cálculo de TEA.");
            return NaN;
         }
         if (base === 0) return -1; // -100% TEA
         const exponent = 365 / daysHeld;
         return Math.pow(base, exponent) - 1;
    }

    /**
     * Orquesta los cálculos.
     * @param {object} inputs
     * @returns {object} {tna, tea}
     */
    function calculateYields(inputs) {
        const { maturityDate, finalValue, purchases, earliestPurchaseDate } = inputs;
        const weightedAvgPrice = getWeightedAveragePrice(purchases);
        const daysHeld = getDaysBetween(earliestPurchaseDate, maturityDate);
        const periodReturn = calculatePeriodReturn(weightedAvgPrice, finalValue);
        const tna = calculateTNA(periodReturn, daysHeld);
        const tea = calculateTEA(periodReturn, daysHeld);
        if (isNaN(tea)) throw new Error("No se pudo calcular la TEA. Verifique los datos.");
        return { tna, tea };
    }

    // --- Manejador Principal del Cálculo ---
    function handleCalculation() {
        const inputs = readInputs();
        if (!inputs) return;

        try {
            const results = calculateYields(inputs);
            displayResults(results.tna, results.tea);
            displayMessage('Cálculo completado.', false);
        } catch (error) {
            console.error("Error en el cálculo:", error);
            displayMessage(`Error en el cálculo: ${error.message}`);
        }
    }

    // --- Event Listeners ---

    // Calcular al hacer clic
    calculateBtn.addEventListener('click', handleCalculation);

    // *** Event Listener para el botón Añadir Compra ***
    addPurchaseBtn.addEventListener('click', addPurchaseRow);

    // Eliminar fila (delegación de eventos)
    purchaseTableBody.addEventListener('click', (event) => {
        // Verificar si el clic fue en un botón con la clase 'removePurchaseBtn'
        if (event.target.classList.contains('removePurchaseBtn')) {
            removePurchaseRow(event.target);
        }
    });

    // --- Inicialización ---
    addPurchaseRow(); // Añadir la primera fila al cargar
    clearMessage();

}); // Fin de DOMContentLoaded