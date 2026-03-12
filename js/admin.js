document.addEventListener('DOMContentLoaded', () => {

    // --- AUTHENTICATION SYSTEM (Temp PIN) ---
    const authOverlay = document.getElementById('authOverlay');
    const pinCodeInput = document.getElementById('pinCode');
    const loginBtn = document.getElementById('loginBtn');
    const authError = document.getElementById('authError');
    const logoutBtn = document.getElementById('logoutBtn');

    // Check if unlocked
    if (localStorage.getItem('apex_admin_unlocked') === 'true') {
        authOverlay.style.display = 'none';
        initDashboard();
    }

    loginBtn.addEventListener('click', () => {
        if (pinCodeInput.value === '1234') {
            localStorage.setItem('apex_admin_unlocked', 'true');
            authOverlay.style.display = 'none';
            initDashboard();
        } else {
            authError.style.display = 'block';
            pinCodeInput.value = '';
            pinCodeInput.focus();
        }
    });

    pinCodeInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') loginBtn.click();
    });

    logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('apex_admin_unlocked');
        window.location.reload();
    });


    // --- CORE DASHBOARD LOGIC ---
    function initDashboard() {
        const tabBtns = document.querySelectorAll('.tab-btn');
        const tabContents = document.querySelectorAll('.tab-content');
        const addCarBtn = document.getElementById('addCarBtn');

        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                tabBtns.forEach(b => b.classList.remove('active'));
                tabContents.forEach(c => c.classList.remove('active'));

                btn.classList.add('active');
                const targetId = btn.getAttribute('data-target');
                document.getElementById(targetId).classList.add('active');

                if (targetId === 'inventory') {
                    addCarBtn.classList.remove('d-none');
                } else {
                    addCarBtn.classList.add('d-none');
                }
            });
        });

        const formatCurrency = (amount) => amount ? new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(amount) : '-';
        const formatDate = (dateStr) => new Date(dateStr).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' });

        // LEADS Management
        async function loadLeads() {
            const tbody = document.getElementById('leadsBody');
            try {
                const leads = await window.DB.getLeads();

                tbody.innerHTML = '';
                if (leads.length === 0) {
                    tbody.innerHTML = '<tr><td colspan="4" class="text-center">Aucun lead pour le moment.</td></tr>';
                    return;
                }

                leads.forEach(lead => {
                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td>${formatDate(lead.created_at)}</td>
                        <td>
                            <strong>${lead.customer_name}</strong><br>
                            <a href="tel:${lead.phone}" style="color:var(--accent)">${lead.phone}</a><br>
                            ${lead.email ? `<a href="mailto:${lead.email}" style="color:var(--text-secondary)">${lead.email}</a>` : ''}
                        </td>
                        <td><a href="./detail.html?id=${lead.car_id}" target="_blank" style="text-decoration: underline;">${lead.make || 'Inconnu'} ${lead.model || ''} (${lead.year || '-'})</a></td>
                        <td style="max-width:300px; white-space:pre-wrap;">${lead.message || 'Aucun message'}</td>
                    `;
                    tbody.appendChild(tr);
                });
            } catch (error) {
                console.error('Error fetching leads:', error);
                tbody.innerHTML = '<tr><td colspan="4" class="text-center" style="color:var(--error)">Erreur lors du chargement des leads.</td></tr>';
            }
        }

        // INVENTORY Management
        async function loadInventory() {
            const tbody = document.getElementById('inventoryBody');
            try {
                const cars = await window.DB.getCars();

                tbody.innerHTML = '';
                if (cars.length === 0) {
                    tbody.innerHTML = '<tr><td colspan="7" class="text-center">Aucun véhicule dans l\'inventaire.</td></tr>';
                    return;
                }

                cars.forEach(car => {
                    const isFeatured = car.featured ? '<span style="color:gold; font-size:1.2rem;">★</span>' : '';
                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td>#${car.id}</td>
                        <td><strong>${car.make} ${car.model}</strong> ${car.finition ? `<br><small style="color:var(--text-secondary)">${car.finition}</small>` : ''}</td>
                        <td>${car.year}</td>
                        <td>${formatCurrency(car.price)}</td>
                        <td>${car.mileage ? car.mileage.toLocaleString() : '-'} km</td>
                        <td>${isFeatured} ${car.availability || 'Disponible'}</td>
                        <td class="action-btns">
                            <button class="btn btn-secondary btn-small" onclick="editCar(${car.id})">Éditer</button>
                            <button class="btn btn-danger btn-small" onclick="deleteCar(${car.id})">Supprimer</button>
                        </td>
                    `;
                    tbody.appendChild(tr);
                });
            } catch (error) {
                console.error('Error fetching inventory:', error);
                tbody.innerHTML = '<tr><td colspan="7" class="text-center" style="color:var(--error)">Erreur lors du chargement de l\'inventaire.</td></tr>';
            }
        }

        // Modal Logic V2
        const modal = document.getElementById('carModal');
        const closeBtn = document.getElementById('closeModalBtn');
        const carForm = document.getElementById('carForm');

        addCarBtn.addEventListener('click', () => {
            carForm.reset();
            document.getElementById('carId').value = '';
            document.getElementById('modalTitle').textContent = 'Ajouter un véhicule';
            document.getElementById('carFeatured').checked = false;
            modal.classList.add('active');
        });

        closeBtn.addEventListener('click', () => {
            modal.classList.remove('active');
        });

        window.addEventListener('click', (e) => {
            if (e.target === modal) modal.classList.remove('active');
        });

        // Form Submission
        carForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const submitBtn = carForm.querySelector('button[type="submit"]');
            submitBtn.disabled = true;
            submitBtn.textContent = 'Enregistrement...';

            const carId = document.getElementById('carId').value;
            const carData = {
                make: document.getElementById('carMake').value,
                model: document.getElementById('carModel').value,
                finition: document.getElementById('carFinition').value,
                year: parseInt(document.getElementById('carYear').value),
                price: parseFloat(document.getElementById('carPrice').value),
                mileage: parseInt(document.getElementById('carMileage').value),
                energy: document.getElementById('carEnergy').value,
                gearbox: document.getElementById('carGearbox').value,
                power_hp: document.getElementById('carPowerHp').value ? parseInt(document.getElementById('carPowerHp').value) : null,
                power_fiscal: document.getElementById('carPowerFiscal').value ? parseInt(document.getElementById('carPowerFiscal').value) : null,
                doors: document.getElementById('carDoors').value ? parseInt(document.getElementById('carDoors').value) : null,
                seats: document.getElementById('carSeats').value ? parseInt(document.getElementById('carSeats').value) : null,
                color: document.getElementById('carColor').value,
                type: document.getElementById('carType').value,
                equipment: document.getElementById('carEquipment').value,
                condition: document.getElementById('carCondition').value,
                availability: document.getElementById('carAvailability').value,
                warranty: document.getElementById('carWarranty').value,
                featured: document.getElementById('carFeatured').checked, // Returns boolean, handled by backend
                image_url: document.getElementById('carImage').value,
                description: document.getElementById('carDesc').value
            };

            const method = carId ? 'PUT' : 'POST';
            const url = carId ? `./api/cars/${carId}` : '/api/cars';

            try {
                await window.DB.saveCar(carData);
                modal.classList.remove('active');
                loadInventory();
            } catch (error) {
                console.error('Error saving car:', error);
                alert('Une erreur est survenue lors de l\'enregistrement : ' + error.message);
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Enregistrer le véhicule';
            }
        });

        // Delete Car
        window.deleteCar = async (id) => {
            if (!confirm('Êtes-vous sûr de vouloir supprimer ce véhicule ? Cette action est irréversible.')) return;

            try {
                await window.DB.deleteCar(id);
                loadInventory();
            } catch (error) {
                console.error('Error deleting car:', error);
                alert('Erreur lors de la suppression du véhicule.');
            }
        };

        // Edit Car
        window.editCar = async (id) => {
            try {
                const car = await window.DB.getCar(id);
                if (!car) throw new Error('Car not found');

                // Populate form fields
                document.getElementById('carId').value = car.id;
                document.getElementById('carMake').value = car.make || '';
                document.getElementById('carModel').value = car.model || '';
                document.getElementById('carFinition').value = car.finition || '';
                document.getElementById('carYear').value = car.year || '';
                document.getElementById('carPrice').value = car.price || '';
                document.getElementById('carMileage').value = car.mileage || '';

                // Map selects
                if (car.energy) document.getElementById('carEnergy').value = car.energy;
                if (car.gearbox) document.getElementById('carGearbox').value = car.gearbox;
                if (car.type) document.getElementById('carType').value = car.type;

                document.getElementById('carPowerHp').value = car.power_hp || '';
                document.getElementById('carPowerFiscal').value = car.power_fiscal || '';
                document.getElementById('carDoors').value = car.doors || '';
                document.getElementById('carSeats').value = car.seats || '';
                document.getElementById('carColor').value = car.color || '';
                document.getElementById('carEquipment').value = car.equipment || '';
                document.getElementById('carCondition').value = car.condition || '';
                document.getElementById('carAvailability').value = car.availability || '';
                document.getElementById('carWarranty').value = car.warranty || '';

                // Boolean handling for sqlite (0 or 1)
                document.getElementById('carFeatured').checked = (car.featured === 1 || car.featured === true);

                document.getElementById('carImage').value = car.image_url || '';
                document.getElementById('carDesc').value = car.description || '';

                document.getElementById('modalTitle').textContent = 'Modifier le véhicule';
                modal.classList.add('active');
            } catch (error) {
                console.error('Error fetching car details:', error);
                alert('Erreur lors de la récupération des informations du véhicule.');
            }
        };

        // Initialize lists
        loadLeads();
        loadInventory();
    }
});
