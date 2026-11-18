import axios from 'axios';

// 1. Récupère tous les jours fériés de l'année donnée (ex: 2026)
export async function getJoursFeries(annee) {
    try {
        const url = `https://calendrier.api.gouv.fr/jours-feries/metropole/${annee}.json`;
        const response = await axios.get(url, { timeout: 5000 });
        return response.data; // Ex: { "2026-01-01": "1er janvier", ... }
    } catch (error) {
        return {}; // En cas d'erreur réseau, on renvoie un objet vide sans bloquer l'app
    }
}

// 2. Vérifie si une date (format YYYY-MM-DD) tombe pendant les vacances scolaires (Zone C par défaut)
export async function verifierVacancesScolaires(dateISO, zone = 'Zone C') {
    try {
        const url = 'https://data.education.gouv.fr/api/explore/v2.1/catalog/datasets/fr-en-calendrier-scolaire/records';
        const response = await axios.get(url, {
            params: {
                where: `zones="${zone}" AND start_date<="${dateISO}" AND end_date>="${dateISO}"`,
                limit: 1
            },
            timeout: 5000
        });

        const records = response.data.results;
        if (records && records.length > 0) {
            return records[0].description; // Ex: "Vacances de Noël"
        }
        return null;
    } catch (error) {
        return null;
    }
}