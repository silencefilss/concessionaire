document.addEventListener('DOMContentLoaded', () => {
    const catalogGrid = document.getElementById('catalogGrid');
    const resultCount = document.getElementById('resultCount');
    let allCars = [];
    let filteredCars = [];

    // --- Filter Elements ---
    const searchInput = document.getElementById('searchInput');
    const filterMake = document.getElementById('filterMake');
    const minPrice = document.getElementById('minPrice');
    const maxPrice = document.getElementById('maxPrice');
    const minYear = document.getElementById('minYear');
    const maxYear = document.getElementById('maxYear');
    const maxMileage = document.getElementById('maxMileage');
    const filterType = document.getElementById('filterType');
    const filterEnergy = document.getElementById('filterEnergy');
    const filterGearbox = document.getElementById('filterGearbox');
    const sortSelect = document.getElementById('sortSelect');
    const resetBtn = document.getElementById('resetFilters');

    // Add event listeners to all filter inputs
    const filterInputs = [searchInput, filterMake, minPrice, maxPrice, minYear, maxYear, maxMileage, filterType, filterEnergy, filterGearbox, sortSelect];
    filterInputs.forEach(input => {
        input.addEventListener('input', applyFilters);
    });

    resetBtn.addEventListener('click', () => {
        filterInputs.forEach(input => {
            if (input.tagName === 'SELECT') input.selectedIndex = 0;
            else input.value = '';
        });
        applyFilters();
    });

    // Fetch cars from API or simulated DB
    async function fetchCars() {
        try {
            allCars = await window.DB.getCars();
            filteredCars = [...allCars];

            // Populate dynamic dropdowns (e.g., Makes)
            populateMakesDropdown();

            applyFilters(); // Initial render
        } catch (error) {
            console.error('Error fetching cars:', error);
            catalogGrid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; color: var(--error);">Erreur lors du chargement des véhicules.</div>';
        }
    }

    function populateMakesDropdown() {
        // Get unique makes
        const makes = [...new Set(allCars.map(c => c.make))].filter(Boolean).sort();
        makes.forEach(make => {
            const option = document.createElement('option');
            option.value = make;
            option.textContent = make;
            filterMake.appendChild(option);
        });
    }

    function applyFilters() {
        const searchTerm = searchInput.value.toLowerCase();
        const makeVal = filterMake.value;
        const pMin = parseFloat(minPrice.value);
        const pMax = parseFloat(maxPrice.value);
        const yMin = parseInt(minYear.value);
        const yMax = parseInt(maxYear.value);
        const mMax = parseInt(maxMileage.value);
        const typeVal = filterType.value;
        const energyVal = filterEnergy.value;
        const gearboxVal = filterGearbox.value;

        filteredCars = allCars.filter(car => {
            // Text Search
            const textMatch = !searchTerm ||
                (car.make && car.make.toLowerCase().includes(searchTerm)) ||
                (car.model && car.model.toLowerCase().includes(searchTerm)) ||
                (car.equipment && car.equipment.toLowerCase().includes(searchTerm)) ||
                (car.finition && car.finition.toLowerCase().includes(searchTerm));

            // Selects
            const makeMatch = !makeVal || car.make === makeVal;
            const typeMatch = !typeVal || car.type === typeVal;
            const energyMatch = !energyVal || car.energy === energyVal;
            const gearboxMatch = !gearboxVal || car.gearbox === gearboxVal;

            // Ranges
            const pMinMatch = isNaN(pMin) || car.price >= pMin;
            const pMaxMatch = isNaN(pMax) || car.price <= pMax;
            const yMinMatch = isNaN(yMin) || car.year >= yMin;
            const yMaxMatch = isNaN(yMax) || car.year <= yMax;
            const mMaxMatch = isNaN(mMax) || car.mileage <= mMax;

            return textMatch && makeMatch && typeMatch && energyMatch && gearboxMatch &&
                pMinMatch && pMaxMatch && yMinMatch && yMaxMatch && mMaxMatch;
        });

        // Apply Sorting
        const sortVal = sortSelect.value;
        filteredCars.sort((a, b) => {
            if (sortVal === 'priceAsc') return a.price - b.price;
            if (sortVal === 'priceDesc') return b.price - a.price;
            if (sortVal === 'yearDesc') return b.year - a.year;
            if (sortVal === 'mileageAsc') return a.mileage - b.mileage;
            // 'recent' fallback to database order (ID descending assumes newer insertions have higher IDs)
            return b.id - a.id;
        });

        renderCars(filteredCars);
    }

    // Format currency
    function formatPrice(price) {
        return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(price);
    }

    // Render cars to the grid
    function renderCars(cars) {
        resultCount.textContent = cars.length;
        catalogGrid.innerHTML = '';

        if (cars.length === 0) {
            catalogGrid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; color: var(--text-secondary); padding: 3rem 0;">Aucun véhicule ne correspond à vos critères de recherche.</div>';
            return;
        }

        cars.forEach(car => {
            const card = document.createElement('div');
            card.className = 'card fade-in';
            card.onclick = () => window.location.href = `./detail.html?id=${car.id}`;

            // Sub-badges
            const badges = [];
            if (car.energy) badges.push(car.energy);
            if (car.gearbox) badges.push(car.gearbox);

            card.innerHTML = `
                <div class="card-img-wrapper">
                    ${car.featured ? '<div style="position:absolute; top:1rem; right:1rem; z-index:10; background:var(--accent); color:white; padding:0.2rem 0.8rem; border-radius:4px; font-size:0.8rem; font-weight:bold; box-shadow:0 2px 10px rgba(0,0,0,0.5);">À La Une</div>' : ''}
                    <img src="${car.image_url || 'https://via.placeholder.com/600x400?text=No+Image'}" alt="${car.make} ${car.model}" class="card-img" onerror="this.src='https://via.placeholder.com/600x400?text=Image+Not+Found'">
                </div>
                <div class="card-body">
                    <div>
                        <div class="card-price">${formatPrice(car.price)}</div>
                        <div class="card-title" style="margin-bottom:0.5rem;"><strong>${car.make} ${car.model}</strong></div>
                        <div style="font-size:0.9rem; color:var(--text-secondary); margin-bottom:1rem;">${car.finition || ''}</div>
                        
                        <div style="display:flex; flex-wrap:wrap; gap:0.5rem; margin-bottom:1rem;">
                            ${badges.map(b => `<span style="background:rgba(255,255,255,0.05); padding:0.2rem 0.6rem; border-radius:4px; font-size:0.8rem; color:var(--text-secondary); border:1px solid var(--border)">${b}</span>`).join('')}
                        </div>
                    </div>
                    <div class="card-specs">
                        <span>Année ${car.year}</span>
                        <span>${car.mileage ? car.mileage.toLocaleString('fr-FR') : '0'} km</span>
                    </div>
                </div>
            `;
            catalogGrid.appendChild(card);
        });
    }

    // Init
    fetchCars();
});
