/**
 * @module skills-modal
 * @description Opens a detail modal when a skill item in the marquee is clicked.
 * Modal content comes from i18n keys under skills.*.
 */

/**
 * @param {{ openOverlay: Function, closeOverlay: Function, dot: HTMLElement, ring: HTMLElement, t: Function, getCurrentLang: Function }} options
 * @returns {void}
 */
export function initSkillsModal({ openOverlay, closeOverlay, dot, ring, t, getCurrentLang }) {
    const skillModal = document.getElementById('skill-modal');
    const closeSkillModalBtn = document.getElementById('close-skill-modal');
    const skillModalTitle = document.getElementById('skill-modal-title');
    const skillModalDesc = document.getElementById('skill-modal-desc');
    const skillModalIcon = document.getElementById('skill-modal-icon');

    const skillDetails = {
        JavaScript: {
            icon: 'bi bi-filetype-js',
            fr: "J'utilise JavaScript depuis 2023 sur la majorite de mes projets. Exemples: Home Assistant Desktop, ce portfolio et des outils internes. Je m'en sers pour le front-end, la logique applicative et des integrations desktop.",
            en: 'I have been using JavaScript since 2023 on most of my projects. Examples include Home Assistant Desktop, this portfolio, and internal tools. I use it for frontend work, application logic, and desktop integrations.'
        },
        Electron: {
            icon: 'bi bi-window-stack',
            fr: "J'utilise Electron pour creer des applications desktop modernes basees sur des technologies web. Exemples: Nexaria Launcher et Home Assistant Desktop.",
            en: 'I use Electron to build modern desktop applications powered by web technologies, including Nexaria Launcher and Home Assistant Desktop.'
        },
        PHP: {
            icon: 'bi bi-filetype-php',
            fr: 'PHP est present dans mes projets web et dashboards, comme Conferences Orientation ou AzureLab Dashboard, avec APIs et logique serveur.',
            en: 'PHP powers several of my web apps and dashboards, including Orientation Conferences and AzureLab Dashboard, with backend logic and APIs.'
        },
        'UI Engineering': {
            icon: 'bi bi-layout-wtf',
            fr: "Je traite l'UI engineering comme un sujet technique: structure CSS, performance visuelle, interactions et adaptation multi-ecrans.",
            en: 'I approach UI engineering as a technical discipline: CSS architecture, visual performance, interactions, and multi-screen adaptability.'
        }
    };

    const hideSkillModal = () => {
        if (!skillModal) return;
        closeOverlay(skillModal);
        if (!document.getElementById('project-modal')?.classList.contains('open')) {
            document.body.classList.remove('modal-open');
            if (dot && ring) {
                dot.style.display = '';
                ring.style.display = '';
            }
        }
    };

    const openSkillModal = (skillName, triggerElement) => {
        if (!skillModal || !skillModalTitle || !skillModalDesc || !skillModalIcon) return;
        const details = skillDetails[skillName] || {
            icon: 'bi bi-code-square',
            fr: 'Competence utilisee dans plusieurs projets avec une approche orientee fiabilite et maintenabilite.',
            en: 'Skill used across multiple projects with a focus on reliability and maintainability.'
        };

        skillModalTitle.textContent = skillName;
        skillModalDesc.innerHTML = `<p>${getCurrentLang() === 'en' ? details.en : details.fr}</p>`;
        skillModalIcon.className = details.icon;

        document.body.classList.add('modal-open');
        if (dot && ring) {
            dot.style.display = 'none';
            ring.style.display = 'none';
        }

        openOverlay(skillModal, triggerElement, hideSkillModal);
    };

    document.querySelectorAll('.marquee .skill-item').forEach((item) => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const skillName = item.querySelector('.skill-name')?.textContent?.trim() || 'Competence';
            openSkillModal(skillName, item);
        });
    });

    closeSkillModalBtn?.addEventListener('click', (e) => {
        e.stopPropagation();
        hideSkillModal();
    });

    skillModal?.addEventListener('click', (e) => {
        if (e.target === skillModal) hideSkillModal();
    });

    return {
        refreshSkillModalLabel: () => {
            const statusNode = document.getElementById('discord-status-text');
            if (statusNode) {
                statusNode.textContent = t(statusNode.dataset.i18n || 'discord.initializing');
            }
        }
    };
}
