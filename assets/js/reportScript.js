document.addEventListener('DOMContentLoaded', () => {
    const reportData = JSON.parse(localStorage.getItem('reportData'));

    if (!reportData) {
        alert("No hay datos para mostrar.");
        window.location.href = "inicio.html";
        return;
    }

    const { patient, medications } = reportData;

    // Mostrar nombre del paciente en la cabecera
    const patientNameElement = document.getElementById('patient-name');
    patientNameElement.textContent = `${patient.name} ${patient.surname}`;

    // Mostrar lista de medicinas e intakes
    const reportSummary = document.getElementById('report-summary');

    const formatDateTime = (isoString) => {
        const date = new Date(isoString);
        const optionsDate = { year: 'numeric', month: 'long', day: 'numeric' };
        const optionsTime = { hour: '2-digit', minute: '2-digit' };
        return {
            date: new Intl.DateTimeFormat('es-ES', optionsDate).format(date),
            time: new Intl.DateTimeFormat('es-ES', optionsTime).format(date),
        };
    };

    medications.forEach((medication) => {
        const medicationDiv = document.createElement('div');
        medicationDiv.classList.add('medication-card');
        medicationDiv.innerHTML = `
            <h3>${medication.name}</h3>
            <p><strong>Dosificación:</strong> ${medication.dosage} mg</p>
            <h4>Registros de Tomas</h4>
        `;

        const intakeList = document.createElement('ul');
        intakeList.classList.add('intake-list');

        let onTimeCount = 0;
        let offTimeCount = 0;

        medication.intakes.forEach((intake) => {
            const { date, time } = formatDateTime(intake.date);

            const intakeItem = document.createElement('li');
            intakeItem.classList.add('intake-item');
            intakeItem.innerHTML = `
                <p><strong>Fecha:</strong> ${date}</p>
                <p><strong>Hora:</strong> ${time}</p>
                <p><strong>Estado:</strong> ${intake.isOnTime ? "En horario" : "Fuera de horario"}</p>
            `;

            if (!intake.isOnTime && intake.matchedPosology) {
                intakeItem.innerHTML += `
                    <p><strong>Posología teórica:</strong> ${intake.matchedPosology.hour}:${intake.matchedPosology.minute
                        .toString()
                        .padStart(2, "0")}</p>
                `;
            }

            intakeItem.style.color = intake.isOnTime ? "green" : "red";
            intakeList.appendChild(intakeItem);

            if (intake.isOnTime) {
                onTimeCount++;
            } else {
                offTimeCount++;
            }
        });

        medicationDiv.appendChild(intakeList);

        const countersDiv = document.createElement('div');
        countersDiv.classList.add('intake-counters');
        countersDiv.innerHTML = `
            <p><strong>Total en horario:</strong> ${onTimeCount}</p>
            <p><strong>Total fuera de horario:</strong> ${offTimeCount}</p>
        `;
        medicationDiv.appendChild(countersDiv);

        reportSummary.appendChild(medicationDiv);
    });

    if (medications.length === 0) {
        reportSummary.innerHTML = `<p>No se encontraron medicinas con registros de tomas en el período seleccionado.</p>`;
    }
});
