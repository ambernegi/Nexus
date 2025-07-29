document.addEventListener('DOMContentLoaded', () => {
    // Base URL for GitHub Pages
    const baseUrl = 'https://ambernegi.github.io/FPGAHTML/';

    // Cache docs.json to reduce fetches
    let cachedDocs = JSON.parse(localStorage.getItem('docs')) || null;
    const loadDocs = () => {
        if (cachedDocs) {
            console.log('Using cached docs.json:', cachedDocs);
            return Promise.resolve(cachedDocs);
        }
        console.log('Fetching docs.json from ./docs.json');
        return fetch('./docs.json')
            .then(res => {
                if (!res.ok) {
                    throw new Error(`Failed to fetch docs.json: ${res.status} ${res.statusText}`);
                }
                return res.json();
            })
            .then(data => {
                console.log('docs.json loaded successfully:', data);
                localStorage.setItem('docs', JSON.stringify(data));
                cachedDocs = data;
                return data;
            })
            .catch(err => {
                console.error('Error loading docs.json:', err);
                return { sections: {} }; // Fallback to empty object
            });
    };

    // Load documents for the current page
    loadDocs().then(data => {
        const documentList = document.getElementById('document-list');
        if (!documentList) {
            console.warn('No document-list element found on page');
            return;
        }

        // Get current page
        const currentPath = window.location.pathname.split('/').pop() || 'index.html';
        console.log('Current page:', currentPath);

        // Map page to section/subsection
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
            documentList.innerHTML = '<p class="text-gray-700 text-center">No documents available.</p>';
            return;
        }
        console.log('Page info:', pageInfo);

        // Safely access documents
        const section = data.sections?.[pageInfo.section];
        if (!section) {
            console.warn(`Section "${pageInfo.section}" not found in docs.json`);
            documentList.innerHTML = '<p class="text-gray-700 text-center">No documents available.</p>';
            return;
        }

        const subsection = section.subsections?.[pageInfo.subsection];
        if (!subsection) {
            console.warn(`Subsection "${pageInfo.subsection}" not found in section "${pageInfo.section}"`);
            documentList.innerHTML = '<p class="text-gray-700 text-center">No documents available.</p>';
            return;
        }

        const documents = subsection.documents || [];
        console.log(`Documents found for ${pageInfo.section} > ${pageInfo.subsection}:`, documents);

        // Sort by updated_on (latest first)
        documents.sort((a, b) => new Date(b.updated_on) - new Date(a.updated_on));

        // Render document titles with base URL prepended
        documentList.innerHTML = documents.length > 0
            ? documents.map(doc => {
                const fullPath = `${baseUrl}${doc.path}`;
                console.log('Rendering document:', doc.title, 'with path:', fullPath);
                return `
                    <a href="${fullPath}" class="block p-2 hover:bg-gray-100 rounded text-navy-700">
                        ${doc.title}
                    </a>
                `;
            }).join('')
            : '<p class="text-gray-700 text-center">No documents available.</p>';
    }).catch(err => {
        console.error('Error rendering documents:', err);
        const documentList = document.getElementById('document-list');
        if (documentList) {
            documentList.innerHTML = '<p class="text-gray-700 text-center">Error loading documents.</p>';
        }
    });

    // Sidebar toggle logic
    const sidebar = document.getElementById('sidebar');
    const toggleButton = document.getElementById('toggle-sidebar');
    const closeIcon = toggleButton?.querySelector('.sidebar-icon-close');
    const menuIcon = toggleButton?.querySelector('.sidebar-icon-menu');
    if (sidebar && toggleButton && closeIcon && menuIcon) {
        console.log('Sidebar elements found, attaching toggle event');
        toggleButton.addEventListener('click', () => {
            sidebar.classList.toggle('sidebar-collapsed');
            closeIcon.classList.toggle('hidden');
            menuIcon.classList.toggle('hidden');
        });
    } else {
        console.warn('Sidebar elements missing:', { sidebar, toggleButton, closeIcon, menuIcon });
    }
});