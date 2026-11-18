import fs from 'fs';
import { select, input, confirm } from '@inquirer/prompts';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat.js';
import chalk from 'chalk';
import { getJoursFeries, verifierVacancesScolaires } from './api.js';

dayjs.extend(customParseFormat);

const FICHIER_DONNEES = './budget.json';

function chargerOperations() {
    if (!fs.existsSync(FICHIER_DONNEES)) {
        return [];
    }
    const contenu = fs.readFileSync(FICHIER_DONNEES, 'utf-8');
    return JSON.parse(contenu);
}

function sauvegarderOperations(operations) {
    fs.writeFileSync(FICHIER_DONNEES, JSON.stringify(operations, null, 2), 'utf-8');
}

async function ajouterOperation(operations) {
    console.log(chalk.cyan.bold('\n--- Nouvelle opération budgétaire ---'));

    const type = await select({
        message: 'Type d’opération :',
        choices: [
            { name: 'Revenu (+)', value: 'Revenu' },
            { name: 'Dépense (-)', value: 'Dépense' }
        ]
    });

    const categorie = await select({
        message: 'Catégorie :',
        choices: type === 'Revenu'
            ? [
                { name: 'Salaire / Prime', value: 'Salaire' },
                { name: 'Aides / Allocations', value: 'Aides' },
                { name: 'Autre revenu', value: 'Autre' }
            ]
            : [
                { name: 'Logement / Loyer', value: 'Logement' },
                { name: 'Alimentation / Courses', value: 'Alimentation' },
                { name: 'Transport', value: 'Transport' },
                { name: 'Factures / Abonnements', value: 'Factures' },
                { name: 'Loisirs / Famille', value: 'Loisirs' }
            ]
    });

    const libelle = await input({
        message: 'Description (ex: Loyer novembre, Courses...) :',
        validate: (val) => val.trim() !== '' || 'La description est obligatoire.'
    });

    const montantStr = await input({
        message: 'Montant en euros (€) :',
        validate: (val) => {
            const nb = parseFloat(val.replace(',', '.'));
            return (!isNaN(nb) && nb > 0) || 'Veuillez entrer un montant valide supérieur à 0.';
        }
    });

    const dateSaisie = await input({
        message: 'Date (format JJ/MM/AAAA) :',
        default: dayjs().format('DD/MM/YYYY'),
        validate: (val) => {
            return dayjs(val, 'DD/MM/YYYY', true).isValid() || 'Date invalide ! Utilisez le format JJ/MM/AAAA (ex: 19/11/2026).';
        }
    });

    const dateISO = dayjs(dateSaisie, 'DD/MM/YYYY').format('YYYY-MM-DD');
    const annee = dayjs(dateSaisie, 'DD/MM/YYYY').year();

    // Appels aux API externes (Jours fériés + Vacances scolaires Zone C)
    console.log(chalk.gray('⏳ Vérification du calendrier officiel (jours fériés & vacances scolaires)...'));
    const [joursFeries, nomVacances] = await Promise.all([
        getJoursFeries(annee),
        verifierVacancesScolaires(dateISO, 'Zone C')
    ]);

    const nomJourFerie = joursFeries[dateISO] || null;

    // Alertes contextuelles lors de la saisie
    if (nomJourFerie) {
        console.log(chalk.magenta(`🎉 Info : Le ${dateSaisie} est un jour férié (${nomJourFerie}).`));
        if (type === 'Revenu') {
            console.log(chalk.yellow(`⚠️  Attention : Votre virement bancaire risque d'être décalé au jour ouvré suivant.`));
        }
    }

    if (nomVacances) {
        console.log(chalk.cyan(`🏖️  Info : Cette date tombe pendant les ${nomVacances}.`));
    }

    operations.push({
        date: dateISO,
        type,
        categorie,
        libelle: libelle.trim(),
        montant: parseFloat(montantStr.replace(',', '.')),
        jourFerie: nomJourFerie,
        vacances: nomVacances
    });

    sauvegarderOperations(operations);
    console.log(chalk.green.bold('\n✔ Opération enregistrée dans le calendrier !\n'));
}

function afficherCalendrier(operations) {
    console.log(chalk.blue.bold('\n================ CALENDRIER BUDGÉTAIRE ================'));

    if (operations.length === 0) {
        console.log(chalk.yellow('Aucune opération enregistrée pour le moment.\n'));
        return;
    }

    const operationsTriees = [...operations].sort(
        (a, b) => dayjs(a.date).valueOf() - dayjs(b.date).valueOf()
    );

    let totalRevenus = 0;
    let totalDepenses = 0;
    let totalDepensesConges = 0;

    for (const op of operationsTriees) {
        const dateFormatee = dayjs(op.date).format('DD/MM/YYYY');
        const montantFormate = op.montant.toFixed(2) + ' €';

        // Construction des badges colorés si jour férié ou vacances
        let badges = '';
        if (op.jourFerie) {
            badges += chalk.magenta(` 🎉 Jour férié (${op.jourFerie})`);
        }
        if (op.vacances) {
            badges += chalk.cyan(` 🏖️ ${op.vacances}`);
        }

        if (op.type === 'Revenu') {
            totalRevenus += op.montant;
            console.log(
                `${chalk.gray(`[${dateFormatee}]`)} ${chalk.bold(op.categorie)} - ${op.libelle} : ${chalk.green(`+${montantFormate}`)}${badges}`
            );
        } else {
            totalDepenses += op.montant;
            if (op.jourFerie || op.vacances) {
                totalDepensesConges += op.montant;
            }
            console.log(
                `${chalk.gray(`[${dateFormatee}]`)} ${chalk.bold(op.categorie)} - ${op.libelle} : ${chalk.red(`-${montantFormate}`)}${badges}`
            );
        }
    }

    const solde = totalRevenus - totalDepenses;

    console.log(chalk.blue('-------------------------------------------------------'));
    console.log(`Total des revenus            : ${chalk.green('+' + totalRevenus.toFixed(2) + ' €')}`);
    console.log(`Total des dépenses           : ${chalk.red('-' + totalDepenses.toFixed(2) + ' €')}`);
    if (totalDepensesConges > 0) {
        console.log(`Dont vacances / jours fériés : ${chalk.yellow(totalDepensesConges.toFixed(2) + ' €')}`);
    }
    console.log(
        `Solde disponible             : ${solde >= 0
            ? chalk.bgGreen.black.bold(` +${solde.toFixed(2)} € `)
            : chalk.bgRed.white.bold(` ${solde.toFixed(2)} € `)
        }`
    );
    console.log(chalk.blue.bold('=======================================================\n'));
}

async function viderCalendrier() {
    const confirmation = await confirm({
        message: 'Voulez-vous vraiment supprimer toutes les opérations ?',
        default: false
    });

    if (confirmation) {
        sauvegarderOperations([]);
        console.log(chalk.yellow('\nToutes les opérations ont été effacées.\n'));
        return [];
    }
    return null;
}

async function main() {
    console.clear();
    console.log(chalk.magenta.bold('Bienvenue dans votre Gestionnaire de Calendrier Budget !'));

    let operations = chargerOperations();

    while (true) {
        const choix = await select({
            message: 'Que souhaitez-vous faire ?',
            choices: [
                { name: '1. Ajouter un revenu ou une dépense', value: 'ajouter' },
                { name: '2. Afficher le calendrier budget et le solde', value: 'afficher' },
                { name: '3. Réinitialiser le calendrier', value: 'vider' },
                { name: '4. Quitter', value: 'quitter' }
            ]
        });

        if (choix === 'ajouter') {
            await ajouterOperation(operations);
        } else if (choix === 'afficher') {
            afficherCalendrier(operations);
        } else if (choix === 'vider') {
            const reset = await viderCalendrier();
            if (reset !== null) operations = reset;
        } else if (choix === 'quitter') {
            console.log(chalk.cyan('\nÀ bientôt ! Vos données sont sauvegardées.\n'));
            break;
        }
    }
}

main();