// Variables globales
let lastChecked = null;

// Manejar selección de botones radio
function handleRadioDeselection() {
    const radios = document.querySelectorAll('input[type="radio"][name="time-period"]');
    const customDates = document.getElementById("custom-dates");

    radios.forEach((radio) => {
        radio.addEventListener("click", () => {
            if (radio.value === "custom-period") {
                customDates.style.display = "flex";
            } else {
                customDates.style.display = "none";
            }
        });
    });
}

// Calcular fechas según el período seleccionado
function calculateDates() {
    const selectedPeriod = document.querySelector('input[name="time-period"]:checked')?.value;
    const today = new Date();
    let startDate = null, endDate = null;

    switch (selectedPeriod) {
        case "last-month":
            startDate = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());
            endDate = today;
            break;
        case "last-7-days":
            startDate = new Date(today);
            startDate.setDate(today.getDate() - 7);
            endDate = today;
            break;
        case "last-15-days":
            startDate = new Date(today);
            startDate.setDate(today.getDate() - 15);
            endDate = today;
            break;
        case "custom-period":
            startDate = new Date(document.getElementById('start-date').value);
            endDate = new Date(document.getElementById('end-date').value);
            if (isNaN(startDate) || isNaN(endDate) || startDate > endDate) {
                alert("Por favor, selecciona un rango de fechas válido.");
                return null;
            }
            break;
        default:
            alert("Por favor, selecciona un período.");
            return null;
    }
    return { startDate, endDate };
}

async function submitForm(event) {
    event.preventDefault();
    const patientId = document.getElementById('patient-id').value.trim();
    if (!patientId) {
        alert("Por favor, introduce el ID del paciente.");
        return;
    }

    const dates = calculateDates();
    if (!dates) return;

    const { startDate, endDate } = dates;
    const formData = {
        patientId,
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
    };

    localStorage.setItem('reportData', JSON.stringify(formData));

    const data = await fetchPatientData(patientId, startDate, endDate);
    if (data) {
        localStorage.setItem('reportData', JSON.stringify(data));
        window.location.href = "../../screens/report.html";
    } else {
        alert("No se pudo completar la consulta. Inténtelo nuevamente.");
    }
}


// Función para realizar las llamadas a la API y filtrar los datos
async function fetchPatientData(patientId, startDate, endDate) {
    try {
        // Obtener paciente
        const patientResponse = await fetch(`http://localhost:8000/patients/${patientId}`);
        if (!patientResponse.ok) {
            alert("Error al obtener los datos del paciente. Verifique el ID.");
            return null;
        }
        const patient = await patientResponse.json();

        // Obtener medicamentos
        const medicationsResponse = await fetch(`http://localhost:8000/patients/${patientId}/medications`);
        if (!medicationsResponse.ok) {
            alert("Error al obtener las medicinas del paciente.");
            return null;
        }
        const medications = await medicationsResponse.json();

        const filteredMedications = [];
        for (const medication of medications) {
            // Obtener intakes
            const intakesResponse = await fetch(
                `http://localhost:8000/patients/${patientId}/medications/${medication.id}/intakes`
            );
            if (!intakesResponse.ok) {
                alert(`Error al obtener los registros de tomas para la medicina: ${medication.name}`);
                return null;
            }
            const intakes = await intakesResponse.json();

            // Filtrar intakes por período
            const filteredIntakes = intakes.filter((intake) => {
                const intakeDate = new Date(intake.date);
                return (
                    (!startDate || intakeDate >= new Date(startDate)) &&
                    (!endDate || intakeDate <= new Date(endDate))
                );
            });

            if (filteredIntakes.length > 0) {
                medication.intakes = filteredIntakes;
                filteredMedications.push(medication);
            }
        }
        // Guardar datos filtrados en localStorage
        return { patient, medications: filteredMedications };
    } catch (error) {
        console.error("Error fetching patient data:", error);
        alert("Hubo un error inesperado al obtener los datos del paciente.");
        return null;
    }
}

// Mostrar transición de entrada al cargar
function showTransition() {
    const main = document.querySelector("main");
    main.style.animation = "fadeIn 1s ease-in-out";
}

// Inicializar aplicación
function initializeApp() {
    handleRadioDeselection();
    document.getElementById('report-form').addEventListener('submit', submitForm);
    showTransition();
}

// Ejecución al cargar el DOM
document.addEventListener("DOMContentLoaded", initializeApp);
