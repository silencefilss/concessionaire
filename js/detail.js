document.addEventListener('DOMContentLoaded', () => {
    // Get car ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const carId = urlParams.get('id');

    if (!carId) {
        document.querySelector('.layout').innerHTML = '<h2 style="text-align:center;width:100%;">Véhicule introuvable dans notre base.</h2>';
        return;
    }

    // DOM Elements Map
    const els = {
        image: document.getElementById('carImage'),
        featuredBadge: document.getElementById('featuredBadge'),
        title: document.getElementById('carTitle'),
        finition: document.getElementById('carFinition'),
        price: document.getElementById('carPrice'),
        year: document.getElementById('carYear'),
        mileage: document.getElementById('carMileage'),
        energy: document.getElementById('carEnergy'),
        gearbox: document.getElementById('carGearbox'),
        power_hp: document.getElementById('carPowerHp'),
        type: document.getElementById('carType'),
        color: document.getElementById('carColor'),
        availability: document.getElementById('carAvailability'),
        equipment: document.getElementById('carEquipment'),
        description: document.getElementById('carDescription'),
        warranty: document.getElementById('carWarranty'),

        carIdField: document.getElementById('carIdField'),
        form: document.getElementById('leadForm'),
        successMsg: document.getElementById('successMessage'),
        messageOverlay: document.getElementById('message')
    };

    const formatPrice = (p) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(p);

    async function fetchCarDetails() {
        try {
            const car = await window.DB.getCar(carId);
            if (!car) throw new Error('Car not found');

            // Image & Hero
            els.image.src = car.image_url || 'https://via.placeholder.com/1200x800?text=Visuel+Indisponible';
            els.image.alt = `${car.make} ${car.model}`;
            if (car.featured) els.featuredBadge.style.display = 'inline-block';

            // Header
            els.title.textContent = `${car.make} ${car.model}`;
            els.finition.textContent = car.finition || '';
            els.price.textContent = formatPrice(car.price);

            // Specs
            els.year.textContent = car.year;
            els.mileage.textContent = car.mileage ? `${car.mileage.toLocaleString('fr-FR')} km` : '0 km';
            els.energy.textContent = car.energy || 'Non Renseigné';
            els.gearbox.textContent = car.gearbox || 'Non Renseigné';
            els.power_hp.textContent = car.power_hp ? `${car.power_hp} ch` : '-';
            els.type.textContent = car.type || 'Non Renseigné';
            els.color.textContent = car.color || 'Sur Demande';
            els.availability.textContent = car.availability || 'Sur Demande';

            // Equipment Tags processing
            if (car.equipment) {
                const tags = car.equipment.split(',').map(t => t.trim()).filter(t => t.length > 0);
                if (tags.length > 0) {
                    els.equipment.innerHTML = tags.map(t => `<span class="equip-tag">${t}</span>`).join('');
                } else {
                    els.equipment.innerHTML = '<span style="color:var(--text-secondary)">Non spécifiés.</span>';
                }
            } else {
                els.equipment.innerHTML = '<span style="color:var(--text-secondary)">Non spécifiés.</span>';
            }

            // Text blocks
            els.description.textContent = car.description || "Aucune description détaillée n'a été fournie par l'atelier pour ce modèle.";
            els.warranty.textContent = car.warranty || "Conditions de garantie à vérifier avec le conseiller (voir carnet d'entretien).";

            // Form setup
            els.carIdField.value = car.id;
            els.messageOverlay.value = `Bonjour, je souhaite être recontacté au sujet de la ${car.make} ${car.model} affichée à ${formatPrice(car.price)}.`;

        } catch (error) {
            console.error('Error fetching car:', error);
            document.querySelector('.layout').innerHTML = '<div style="text-align:center;grid-column:1/-1;"><h2 style="color:var(--error)">Erreur de chargement</h2><p>Le véhicule demandé est introuvable ou indisponible.</p></div>';
        }
    }

    // Handle form submission
    els.form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const submitBtn = els.form.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Transmission en cours...';

        const leadData = {
            car_id: els.carIdField.value,
            customer_name: document.getElementById('name').value,
            phone: document.getElementById('phone').value,
            email: document.getElementById('email').value,
            message: document.getElementById('message').value
        };

        try {
            await window.DB.saveLead(leadData);
            els.form.style.display = 'none';
            els.successMsg.style.display = 'block';
        } catch (error) {
            console.error('Error submitting lead:', error);
            alert("Une erreur technique s'est produite lors de la transmission. Veuillez réessayer.");
            submitBtn.disabled = false;
            submitBtn.textContent = 'Envoyer ma demande';
        }
    });

    // Init
    fetchCarDetails();
});
