// Simuler le backend avec localStorage et un fichier JSON initial
const DB = {
    async getCars() {
        let cars = JSON.parse(localStorage.getItem('apex_cars'));
        if (!cars) {
            try {
                // Charger depuis le fichier statique au premier lancement
                const res = await fetch('cars.json');
                if (res.ok) {
                    cars = await res.json();
                    localStorage.setItem('apex_cars', JSON.stringify(cars));
                } else {
                    cars = [];
                }
            } catch (e) {
                console.error("Could not load cars.json", e);
                cars = [];
            }
        }
        return cars;
    },
    async getCar(id) {
        const cars = await this.getCars();
        return cars.find(c => c.id == id);
    },
    async saveCar(car) {
        let cars = await this.getCars();
        if (car.id) {
            const index = cars.findIndex(c => c.id == car.id);
            if (index !== -1) {
                cars[index] = car;
            } else {
                cars.push(car);
            }
        } else {
            // Nouvel ID unique
            car.id = Date.now();
            cars.push(car);
        }
        localStorage.setItem('apex_cars', JSON.stringify(cars));
        return car;
    },
    async deleteCar(id) {
        let cars = await this.getCars();
        cars = cars.filter(c => c.id != id);
        localStorage.setItem('apex_cars', JSON.stringify(cars));
    },
    async getLeads() {
        return JSON.parse(localStorage.getItem('apex_leads')) || [];
    },
    async saveLead(lead) {
        let leads = await this.getLeads();
        lead.id = Date.now();
        lead.created_at = new Date().toISOString();
        leads.push(lead);
        localStorage.setItem('apex_leads', JSON.stringify(leads));
        return lead;
    }
};

window.DB = DB;
