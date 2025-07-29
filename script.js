localStorage.removeItem("docs"); // REMOVE THIS AFTER DEBUGGING

document.addEventListener('DOMContentLoaded', () => {
    const baseUrl = 'https://ambernegi.github.io/FPGAHTML/';
    let cachedDocs = JSON.parse(localStorage.getItem('docs')) || null;

    const loadDocs = () => {
        if (cachedDocs) {
            console.log('Using cached docs.json:', cachedDocs);
            return Promise.resolve(cachedDocs);
        }

        return fetch('./docs.json')
            .then(res => {
                if (!res.ok) throw new Error(`Failed to fetch docs.json: ${res.status} ${res.statusText}`);
                return res.json();
            })
            .then(data => {
                console.log('docs.json loaded:', data);
                localStorage.setItem('docs', JSON.stringify(data));
                cachedDocs = data;
                return data;
            })
            .catch(err => {
                console.error('Error loading docs.json:', err);
                return { sections: {} };
            });
    };

    loadDocs().then(data => {
        const documentList = document.querySelector('#document-list ul');
        const iframe = document.getElementById('document-iframe');
        const openTabButton = document.getElementById('open-tab-button');

        if (!documentList || !iframe || !openTabButton) {
            console.warn('Required elements missing:', { documentList, iframe, openTabButton });
            return;
        }

        const currentPath = window.location.pathname.split('/').pop() || 'index.html';

        const pageMap = {
            'app-notes.html': { section: 'Hardware', subsection: 'Application Notes' },
            'user-guides.html': { section: 'Software', subsection: 'User Guides' },
            'hardware-docs.html': { section: 'Hardware', subsection: 'Hardware Documentation' },
            'silicon-guides.html': { section: 'Hardware', subsection: 'Silicon User Guides' },
            'whitepapers.html': { section: 'Hardware', subsection: 'Whitepapers' },
            'software-docs.html': { section: 'Software', subsection: 'Software Documentation' },
            'release-notes.html': { section: 'Software', subsection: 'Release Notes' },
            'ip-user-guides.html': { section: 'IP', subsection: 'IP User Guides' },
            'reference-guides.html': { section: 'IP', subsection: 'Reference Guides' }
        };

        const pageInfo = pageMap[currentPath];
        if (!pageInfo) {
            console.warn('No pageInfo found for', currentPath);
            documentList.innerHTML = '<li><p class="text-gray-700 text-center">No documents available.</p></li>';
            return;
        }

        const section = data.sections?.[pageInfo.section];
        const subsection = section?.subsections?.[pageInfo.subsection];
        const documents = subsection?.documents || [];

        if (!documents.length) {
            console.warn(`No documents found for ${pageInfo.section} > ${pageInfo.subsection}`);
            documentList.innerHTML = '<li><p class="text-gray-700 text-center">No documents available.</p></li>';
            return;
        }

        // Sort by latest update
        documents.sort((a, b) => new Date(b.updated_on) - new Date(a.updated_on));

        // New document logic
        const currentDate = new Date('2025-07-29T13:16:00+05:30');
        const oneWeekAgo = new Date(currentDate);
        oneWeekAgo.setDate(currentDate.getDate() - 7);

        documentList.innerHTML = '';

        documents.forEach((doc, i) => {
            const fullPath = `${baseUrl}${doc.path}`;
            let isNew = false;

            try {
                const updatedDate = new Date(doc.updated_on);
                isNew = updatedDate >= oneWeekAgo && updatedDate <= currentDate;
            } catch (e) {
                console.warn(`Invalid updated_on for ${doc.title}:`, doc.updated_on);
            }

            const li = document.createElement('li');
            li.className = 'flex flex-col items-start animate-fadeInUp';

            if (isNew) {
                const badge = document.createElement('span');
                badge.className = 'newly-added';
                badge.textContent = 'Newly Added';
                li.appendChild(badge);
            }

            const link = document.createElement('a');
            link.href = '#';
            link.className = 'document-link flex items-center text-sm font-semibold text-navy-700 hover:text-gold-600 hover:bg-gray-200 p-3 rounded-lg transition-all duration-200 bg-white shadow-sm hover:shadow-md';
            link.setAttribute('data-url', fullPath);

            const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            svg.setAttribute('class', 'w-5 h-5 mr-2 flex-shrink-0');
            svg.setAttribute('fill', 'none');
            svg.setAttribute('stroke', 'currentColor');
            svg.setAttribute('viewBox', '0 0 24 24');
            svg.innerHTML = `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 
                5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>`;

            const title = document.createElement('span');
            title.className = 'truncate';
            title.textContent = doc.title;

            link.appendChild(svg);
            link.appendChild(title);

            link.addEventListener('click', (e) => {
                e.preventDefault();
                iframe.src = fullPath;
                openTabButton.href = fullPath;
            });

            li.appendChild(link);
            documentList.appendChild(li);

            // Load first doc by default
            if (i === 0) {
                iframe.src = fullPath;
                openTabButton.href = fullPath;
            }
        });

        // Resize handling (only active if handle exists)
        const resizeHandle = document.querySelector('.resize-handle-vertical');
        const documentListContainer = document.getElementById('document-list');
        const iframeContainer = document.getElementById('iframe-container');
        const contentContainer = document.getElementById('content-container');

        if (resizeHandle && documentListContainer && iframeContainer && contentContainer) {
            let isResizing = false;
            let startX, startListWidth;

            resizeHandle.addEventListener('mousedown', (e) => {
                isResizing = true;
                startX = e.clientX;
                startListWidth = documentListContainer.getBoundingClientRect().width;
                document.body.style.cursor = 'col-resize';
            });

            document.addEventListener('mousemove', (e) => {
                if (!isResizing) return;
                const containerRect = contentContainer.getBoundingClientRect();
                const deltaX = e.clientX - startX;
                const newListWidth = startListWidth + deltaX;
                const minListWidth = 200;
                const maxListWidth = containerRect.width * 0.4;
                if (newListWidth >= minListWidth && newListWidth <= maxListWidth) {
                    documentListContainer.style.width = `${newListWidth}px`;
                    iframeContainer.style.width = `calc(100% - ${newListWidth + 8}px)`;
                }
            });

            document.addEventListener('mouseup', () => {
                if (isResizing) {
                    isResizing = false;
                    document.body.style.cursor = 'default';
                }
            });

            document.addEventListener('selectstart', (e) => {
                if (isResizing) e.preventDefault();
            });
        }

        // Sidebar toggle (if still in DOM)
        const sidebar = document.getElementById('sidebar');
        const toggleButton = document.getElementById('toggle-sidebar');
        const closeIcon = toggleButton?.querySelector('.sidebar-icon-close');
        const menuIcon = toggleButton?.querySelector('.sidebar-icon-menu');

        if (sidebar && toggleButton && closeIcon && menuIcon) {
            toggleButton.addEventListener('click', () => {
                sidebar.classList.toggle('sidebar-collapsed');
                closeIcon.classList.toggle('hidden');
                menuIcon.classList.toggle('hidden');
            });
        }
    }).catch(err => {
        console.error('Error rendering documents:', err);
        const documentList = document.querySelector('#document-list ul');
        if (documentList) {
            documentList.innerHTML = '<li><p class="text-gray-700 text-center">Error loading documents.</p></li>';
        }
    });
});
