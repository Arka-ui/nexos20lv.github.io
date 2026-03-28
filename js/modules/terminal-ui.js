/**
 * @module terminal-ui
 * @description Interactive terminal overlay with command history and navigation commands.
 */

/**
 * @param {{ openOverlay: Function, closeOverlay: Function, dot: HTMLElement, ring: HTMLElement, applyLanguage: Function }} options
 * @returns {{ toggleTerminal: Function, initTerminal: Function }}
 */
export function initTerminalUI({ openOverlay, closeOverlay, dot, ring, applyLanguage }) {
    const toggleTerminal = (show, triggerElement) => {
        const modal = document.getElementById('terminal-modal');
        const input = document.getElementById('terminal-input');
        if (!modal || !input) return;

        if (show) {
            if (dot && ring) {
                dot.style.display = 'none';
                ring.style.display = 'none';
            }
            openOverlay(modal, triggerElement, () => toggleTerminal(false));
            input.focus();
        } else {
            closeOverlay(modal);
            if (dot && ring) {
                dot.style.display = '';
                ring.style.display = '';
            }
        }
    };

    const initTerminal = () => {
        const input = document.getElementById('terminal-input');
        const content = document.getElementById('terminal-content');
        const modal = document.getElementById('terminal-modal');
        const closeBtn = modal?.querySelector('.close-terminal');

        if (!input || !content || !modal) return;

        const commands = {
            help: () => 'Available commands: about, projects, experience, contact, theme, fr, en, clear, exit, neofetch',
            about: () => 'Pierre Bouteman - Full-Stack Developer based in France. Currently in 1ere STI2D.',
            projects: () => 'Listing projects... Command "> projects" in Ctrl+K for a visual list.',
            experience: () => 'Experience: Personal projects (Nexaria, HA Desktop), STI2D Student, Internships at Declic Info & ASC Computer.',
            contact: () => 'Contact: pierre.bouteman@icloud.com | Discord: @nexos20lv',
            theme: () => {
                document.getElementById('perfToggle')?.click();
                return 'Toggled High Performance Mode.';
            },
            fr: () => {
                applyLanguage('fr');
                return 'Langue changee en Francais.';
            },
            en: () => {
                applyLanguage('en');
                return 'Language switched to English.';
            },
            neofetch: () => {
                const container = document.createElement('div');
                container.style.display = 'flex';
                container.style.gap = '2rem';

                const art = document.createElement('div');
                art.style.cssText = 'color:var(--primary); font-family:var(--font-mono); white-space:pre;';
                art.textContent = `
   #####
  #######
  ##O#O##
  #######
  #######
  #######`;

                const info = document.createElement('div');

                const userHost = document.createElement('b');
                userHost.style.color = 'var(--primary)';
                userHost.textContent = 'pierre@bouteman.dev';

                const separator = document.createElement('div');
                separator.textContent = '---------------------';

                const list = document.createElement('div');
                const fields = [
                    { label: 'OS', value: 'Portfolio OS V3' },
                    { label: 'Kernel', value: '2.1.0-stable' },
                    { label: 'Uptime', value: `${Math.round(performance.now() / 1000)}s` },
                    { label: 'Shell', value: 'pierre-sh 1.0' },
                    { label: 'Resolution', value: `${window.innerWidth}x${window.innerHeight}` },
                    { label: 'Stack', value: 'HTML, CSS, Vanilla JS' }
                ];

                fields.forEach((field) => {
                    const row = document.createElement('div');
                    const bold = document.createElement('b');
                    bold.textContent = `${field.label}: `;
                    row.appendChild(bold);
                    row.append(field.value);
                    list.appendChild(row);
                });

                info.append(userHost, separator, list);
                container.append(art, info);
                return container;
            },
            clear: () => {
                content.innerHTML = '';
                const welcome = document.createElement('div');
                welcome.className = 'terminal-welcome';
                welcome.textContent = "Type 'help' for available commands.";
                content.appendChild(welcome);
                return '';
            },
            exit: () => {
                toggleTerminal(false);
                return 'Exiting...';
            }
        };

        input.addEventListener('keydown', (e) => {
            if (e.key !== 'Enter') return;

            const rawValue = input.value.trim();
            const cmd = rawValue.toLowerCase();
            input.value = '';

            const cmdLine = document.createElement('div');
            cmdLine.className = 'terminal-line cmd';
            cmdLine.textContent = `> ${rawValue}`;
            content.appendChild(cmdLine);

            if (cmd) {
                const result = commands[cmd]
                    ? commands[cmd]()
                    : `Command not found: ${cmd}. Type 'help' for possible commands.`;

                if (result) {
                    const resLine = document.createElement('div');
                    resLine.className = 'terminal-line';
                    if (typeof result === 'string') {
                        resLine.textContent = result;
                    } else {
                        resLine.appendChild(result);
                    }
                    content.appendChild(resLine);
                }
            }
            content.scrollTop = content.scrollHeight;
        });

        closeBtn?.addEventListener('click', () => toggleTerminal(false));
        modal.addEventListener('click', (e) => {
            if (e.target === modal) toggleTerminal(false);
        });
    };

    return { toggleTerminal, initTerminal };
}
