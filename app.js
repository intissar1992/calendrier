// --- 1. ÉTAT DE L'APPLICATION ---
const PROJETS_INITIAUX = [
    { id: 'voyage', nom: 'Projet Voyage', icone: '✈️', objectif: 1500, actuel: 450, couleur: 'grad-blue' },
    { id: 'imprevus', nom: 'Fonds Imprévus', icone: '🚨', objectif: 1000, actuel: 300, couleur: 'grad-sunset' },
    { id: 'cagnotte', nom: 'Cagnotte Binôme', icone: '🐷', objectif: 800, actuel: 250, couleur: 'grad-purple' },
    { id: 'quotidien', nom: 'Le Reste & Quotidien', icone: '✨', objectif: 2000, actuel: 800, couleur: 'grad-emerald' }
];

let projets = JSON.parse(localStorage.getItem('bq_projets')) || PROJETS_INITIAUX;
let operations = JSON.parse(localStorage.getItem('bq_operations')) || [
    {
        id: 1,
        date: new Date().toISOString().split('T')[0],
        titre: 'Cagnotte départ Intissar & Moataza',
        montant: 1800,
        type: 'revenu',
        projetId: 'quotidien'
    }
];

// --- 2. INITIALISATION ---
document.addEventListener('DOMContentLoaded', () => {
    const savedTheme = localStorage.getItem('bq_theme') || 'ocean';
    document.documentElement.setAttribute('data-theme', savedTheme);

    const today = new Date().toISOString().split('T')[0];
    document.getElementById('date-operation').value = today;
    document.getElementById('date-verif').value = today;

    configurerNavigation();
    configurerEvenements();
    rafraichirTout();
});

// --- 3. NAVIGATION MULTI-PAGES (SPA) ---
function configurerNavigation() {
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            naviguerVers(btn.dataset.page);
        });
    });
}

function naviguerVers(pageId) {
    document.querySelectorAll('.page-view').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(b => {
        b.classList.toggle('active', b.dataset.page === pageId);
    });
    document.getElementById(pageId).classList.add('active');
}

function changerTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('bq_theme', theme);
    afficherToast(`🎨 Thème "${theme}" activé !`);
}

// --- 4. SAUVEGARDE & RENDU GLOBAL ---
function rafraichirTout() {
    localStorage.setItem('bq_projets', JSON.stringify(projets));
    localStorage.setItem('bq_operations', JSON.stringify(operations));

    calculerKPI();
    rendreProjets();
    rendreDashboardPreview();
    rendreSelects();
    rendreHistorique();
    rendreBadges();
}

function calculerKPI() {
    let revenus = 0, depenses = 0, epargne = 0;
    operations.forEach(op => {
        if (op.type === 'revenu') revenus += op.montant;
        if (op.type === 'depense') depenses += op.montant;
        if (op.type === 'epargne') epargne += op.montant;
    });

    const totalCagnottes = projets
        .filter(p => p.id !== 'quotidien')
        .reduce((sum, p) => sum + p.actuel, 0);

    const reste = revenus - depenses - epargne;

    document.getElementById('kpi-revenus').textContent = euro(revenus);
    document.getElementById('kpi-depenses').textContent = euro(depenses);
    document.getElementById('kpi-epargne').textContent = euro(totalCagnottes);
    document.getElementById('kpi-reste').textContent = euro(reste);
}

// --- 5. PROJETS, CAGNOTTES & VERSEMENT RAPIDE ---
function rendreProjets() {
    const grille = document.getElementById('grille-projets');
    grille.innerHTML = '';

    projets.forEach(p => {
        const pct = Math.min(100, Math.round((p.actuel / p.objectif) * 100));
        const estFixe = ['voyage', 'imprevus', 'cagnotte', 'quotidien'].includes(p.id);

        const card = document.createElement('div');
        card.className = `projet-card ${p.couleur || 'grad-blue'}`;
        card.innerHTML = `
      <div class="projet-header">
        <span class="projet-title">${p.icone} ${p.nom}</span>
        ${!estFixe ? `<button class="btn-quick" style="flex:0; padding:0.2rem 0.5rem;" onclick="supprimerProjet('${p.id}')">✕</button>` : ''}
      </div>
      <div class="projet-stats">
        <strong>${euro(p.actuel)}</strong> épargnés sur ${euro(p.objectif)} (${pct}%)
      </div>
      <div class="progress-track">
        <div class="progress-fill" style="width: ${pct}%"></div>
      </div>
      <div class="quick-add-row">
        <button class="btn-quick" onclick="versementRapide('${p.id}', 10)">+10 €</button>
        <button class="btn-quick" onclick="versementRapide('${p.id}', 50)">+50 €</button>
        <button class="btn-quick" onclick="versementRapide('${p.id}', 100)">+100 €</button>
      </div>
    `;
        grille.appendChild(card);
    });
}

function versementRapide(projetId, montant) {
    const p = projets.find(item => item.id === projetId);
    if (!p) return;

    const avantPct = (p.actuel / p.objectif) * 100;
    p.actuel += montant;
    const apresPct = (p.actuel / p.objectif) * 100;

    operations.unshift({
        id: Date.now(),
        date: new Date().toISOString().split('T')[0],
        titre: `Boost rapide (${p.nom})`,
        montant,
        type: 'epargne',
        projetId: p.id
    });

    rafraichirTout();
    afficherToast(`🎉 +${montant} € ajoutés à "${p.nom}" !`);

    // Explosion de confettis si l'objectif est atteint à 100%
    if (avantPct < 100 && apresPct >= 100) {
        lancerConfettis();
        afficherToast(`🏆 BRAVO ! Objectif "${p.nom}" atteint à 100% !`);
    }
}

function rendreDashboardPreview() {
    const preview = document.getElementById('dashboard-projets-preview');
    preview.innerHTML = projets.map(p => {
        const pct = Math.min(100, Math.round((p.actuel / p.objectif) * 100));
        return `
      <div class="mini-projet-row">
        <span><strong>${p.icone} ${p.nom}</strong></span>
        <span>${euro(p.actuel)} / ${euro(p.objectif)} (<strong>${pct}%</strong>)</span>
      </div>
    `;
    }).join('');

    const chart = document.getElementById('chart-repartition');
    const totalGlobal = projets.reduce((s, p) => s + p.actuel, 0) || 1;
    chart.innerHTML = projets.map(p => {
        const part = Math.round((p.actuel / totalGlobal) * 100);
        return `
      <div class="chart-bar-item">
        <div class="chart-bar-label">
          <span>${p.icone} ${p.nom}</span>
          <span>${part}% (${euro(p.actuel)})</span>
        </div>
        <div class="chart-bar-bg">
          <div class="chart-bar-fill" style="width: ${part}%"></div>
        </div>
      </div>
    `;
    }).join('');
}

// --- 6. FORMULAIRES & HISTORIQUE ---
function configurerEvenements() {
    document.getElementById('btn-show-new-projet').addEventListener('click', () => {
        document.getElementById('form-nouveau-projet').classList.toggle('hidden');
    });

    document.getElementById('form-nouveau-projet').addEventListener('submit', e => {
        e.preventDefault();
        projets.push({
            id: 'proj_' + Date.now(),
            nom: document.getElementById('nom-projet').value.trim(),
            icone: document.getElementById('icone-projet').value.trim() || '🎯',
            objectif: parseFloat(document.getElementById('objectif-projet').value),
            actuel: 0,
            couleur: document.getElementById('couleur-projet').value
        });
        e.target.reset();
        e.target.classList.add('hidden');
        rafraichirTout();
        lancerConfettis();
        afficherToast('✨ Nouveau projet créé avec succès !');
    });

    document.getElementById('form-budget').addEventListener('submit', e => {
        e.preventDefault();
        const type = document.querySelector('input[name="type-op"]:checked').value;
        const date = document.getElementById('date-operation').value;
        const montant = parseFloat(document.getElementById('montant-operation').value);
        const titre = document.getElementById('titre-operation').value.trim();
        const projetId = document.getElementById('categorie-projet').value;

        const p = projets.find(item => item.id === projetId);
        if (p) {
            if (type === 'depense') p.actuel = Math.max(0, p.actuel - montant);
            else p.actuel += montant;
        }

        operations.unshift({ id: Date.now(), date, titre, montant, type, projetId });
        document.getElementById('titre-operation').value = '';
        document.getElementById('montant-operation').value = '';
        rafraichirTout();
        afficherToast('✅ Opération enregistrée !');
    });

    document.getElementById('search-op').addEventListener('input', rendreHistorique);
    document.getElementById('filtre-projet').addEventListener('change', rendreHistorique);
    document.getElementById('filtre-type').addEventListener('change', rendreHistorique);
    document.getElementById('btn-verifier').addEventListener('click', verifierDateAPI);

    document.getElementById('btn-export').addEventListener('click', () => {
        const data = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({ projets, operations }, null, 2));
        const a = document.createElement('a');
        a.href = data;
        a.download = 'budgetquest-intissar-moataza.json';
        a.click();
    });

    document.getElementById('btn-reset').addEventListener('click', () => {
        if (confirm('Tout réinitialiser ?')) {
            localStorage.clear();
            location.reload();
        }
    });
}

function rendreSelects() {
    const cat = document.getElementById('categorie-projet');
    const fil = document.getElementById('filtre-projet');
    const prev = fil.value;
    cat.innerHTML = '';
    fil.innerHTML = '<option value="TOUS">Tous les projets</option>';
    projets.forEach(p => {
        cat.add(new Option(`${p.icone} ${p.nom}`, p.id));
        fil.add(new Option(`${p.icone} ${p.nom}`, p.id));
    });
    if (prev) fil.value = prev;
}

function rendreHistorique() {
    const feed = document.getElementById('liste-operations');
    const q = document.getElementById('search-op').value.toLowerCase();
    const fp = document.getElementById('filtre-projet').value;
    const ft = document.getElementById('filtre-type').value;

    const filtrees = operations.filter(op =>
        op.titre.toLowerCase().includes(q) &&
        (fp === 'TOUS' || op.projetId === fp) &&
        (ft === 'TOUS' || op.type === ft)
    );

    if (!filtrees.length) {
        feed.innerHTML = '<p class="muted" style="text-align:center; padding:1rem;">Aucune opération correspondante.</p>';
        return;
    }

    feed.innerHTML = filtrees.map(op => {
        const p = projets.find(x => x.id === op.projetId) || { icone: '📌', nom: 'Autre' };
        const color = op.type === 'depense' ? '#e11d48' : (op.type === 'revenu' ? '#059669' : '#7c3aed');
        const sign = op.type === 'depense' ? '-' : '+';
        return `
      <div class="op-item">
        <div>
          <strong>${op.titre}</strong>
          <div style="font-size:0.8rem; opacity:0.75;">${op.date} • ${p.icone} ${p.nom}</div>
        </div>
        <div style="display:flex; align-items:center; gap:0.75rem;">
          <strong style="color:${color}; font-size:1.05rem;">${sign}${euro(op.montant)}</strong>
          <button class="btn-danger" style="padding:0.25rem 0.55rem; border-radius:8px;" onclick="supprimerOp(${op.id})">✕</button>
        </div>
      </div>
    `;
    }).join('');
}

function supprimerOp(id) {
    operations = operations.filter(o => o.id !== id);
    rafraichirTout();
}

function supprimerProjet(id) {
    projets = projets.filter(p => p.id !== id);
    rafraichirTout();
}

// --- 7. BADGES LUDIQUES ---
function rendreBadges() {
    const totalEpargne = projets.filter(p => p.id !== 'quotidien').reduce((s, p) => s + p.actuel, 0);
    const unProjetFini = projets.some(p => p.actuel >= p.objectif);

    const badges = [
        { icone: '🤝', titre: 'Super Binôme', desc: 'Projet lancé entre Intissar & Moataza', ok: true },
        { icone: '🌱', titre: 'Premiers 500 €', desc: 'Atteindre 500 € dans vos cagnottes', ok: totalEpargne >= 500 },
        { icone: '✈️', titre: 'Prêtes au décollage', desc: 'Avoir plus de 400 € pour le Voyage', ok: (projets.find(p => p.id === 'voyage')?.actuel || 0) >= 400 },
        { icone: '🏆', titre: 'Objectif 100%', desc: 'Compléter une cagnotte à 100%', ok: unProjetFini }
    ];

    document.getElementById('badges-grid').innerHTML = badges.map(b => `
    <div class="badge-card ${b.ok ? 'unlocked' : 'locked'}">
      <div style="font-size:2.4rem; margin-bottom:0.4rem;">${b.icone}</div>
      <h4>${b.titre}</h4>
      <p style="font-size:0.82rem; margin-top:0.25rem;">${b.desc}</p>
      <span style="display:inline-block; margin-top:0.5rem; font-size:0.75rem; font-weight:800;">
        ${b.ok ? '✅ DÉBLOQUÉ' : '🔒 VERROUILLÉ'}
      </span>
    </div>
  `).join('');
}

// --- 8. API CALENDRIER GOUV (NATIF NAVIGATEUR FETCH) ---
async function verifierDateAPI() {
    const date = document.getElementById('date-verif').value;
    const zone = document.getElementById('zone-scolaire').value;
    const box = document.getElementById('resultat-api');
    if (!date) return;

    box.innerHTML = '⏳ Interrogation des serveurs de l’État en cours...';
    const annee = date.split('-')[0];

    try {
        const [resF, resV] = await Promise.all([
            fetch(`https://calendrier.api.gouv.fr/jours-feries/metropole/${annee}.json`),
            fetch(`https://data.education.gouv.fr/api/explore/v2.1/catalog/datasets/fr-en-calendrier-scolaire/records?where=zones%3D%22${encodeURIComponent(zone)}%22%20AND%20start_date%3C%3D%22${date}%22%20AND%20end_date%3E%3D%22${date}%22&limit=1`)
        ]);
        const feries = await resF.json();
        const vacances = await resV.json();

        const nomFerie = feries[date];
        const nomVac = vacances.results?.[0]?.description;

        box.innerHTML = `
      <h3>📅 Analyse du ${date} (${zone})</h3>
      <p class="mt-1">${nomFerie ? `🎉 <strong>Jour Férié :</strong> ${nomFerie}` : '• Jour ouvré classique (non férié)'}</p>
      <p class="mt-1">${nomVac ? `🏖️ <strong>Vacances Scolaires :</strong> ${nomVac}` : '• Période scolaire normale'}</p>
      ${(nomFerie || nomVac) ? `<p class="mt-1" style="color:var(--accent); font-weight:700;">💡 Idéal pour utiliser votre cagnotte "✈️ Projet Voyage" !</p>` : ''}
    `;
    } catch {
        box.innerHTML = '❌ Impossible de joindre les API gouvernementales.';
    }
}

// --- 9. UTILITAIRES, TOAST & CONFETTIS ---
function euro(n) {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n);
}

function afficherToast(msg) {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 3200);
}

function lancerConfettis() {
    const canvas = document.getElementById('confetti-canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const pieces = Array.from({ length: 90 }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height - canvas.height,
        r: Math.random() * 7 + 4,
        c: ['#f43f5e', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'][Math.floor(Math.random() * 5)],
        v: Math.random() * 4 + 2
    }));

    let frame = 0;
    function animer() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        pieces.forEach(p => {
            p.y += p.v;
            ctx.fillStyle = p.c;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.fill();
        });
        frame++;
        if (frame < 110) requestAnimationFrame(animer);
        else ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    animer();
}