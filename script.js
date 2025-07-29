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
        const documentList = document.querySelector('#document-list ul');
        const iframe = document.getElementById('document-iframe');
        const openTabButton = document.getElementById('open-tab-button');
        if (!documentList) {
            console.warn('No document-list ul element found on page');
            return;
        }
        if (!iframe || !openTabButton) {
            console.warn('Iframe or open-tab-button missing:', { iframe, openTabButton });
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
            documentList.innerHTML = '<li><p class="text-gray-700 text-center">No documents available.</p></li>';
            return;
        }
        console.log('Page info:', pageInfo);

        // Safely access documents
        const section = data.sections?.[pageInfo.section];
        if (!section) {
            console.warn(`Section "${pageInfo.section}" not found in docs.json`);
            documentList.innerHTML = '<li><p class="text-gray-700 text-center">No documents available.</p></li>';
            return;
        }

        const subsection = section.subsections?.[pageInfo.subsection];
        if (!subsection) {
            console.warn(`Subsection "${pageInfo.subsection}" not found in section "${pageInfo.section}"`);
            documentList.innerHTML = '<li><p class="text-gray-700 text-center">No documents available.</p></li>';
            return;
        }

        const documents = subsection.documents || [];
        console.log(`Documents found for ${pageInfo.section} > ${pageInfo.subsection}:`, documents);

        // Sort by updated_on (latest first)
        documents.sort((a, b) => new Date(b.updated_on) - new Date(a.updated_on));

        // Check for newly added documents (within last 7 days from July 29, 2025)
        const currentDate = new Date('2025-07-29T13:16:00+05:30'); // Current IST time
        const oneWeekAgo = new Date(currentDate);
        oneWeekAgo.setDate(currentDate.getDate() - 7); // July 22, 2025
        console.log('Current date:', currentDate, 'One week ago:', oneWeekAgo);

        // Render document titles with iframe support and "Newly Added" tag
        documentList.innerHTML = documents.length > 0
            ? documents.map(doc => {
                const fullPath = `${baseUrl}${doc.path}`;
                let isNew = false;
                try {
                    const updatedDate = new Date(doc.updated_on);
                    isNew = updatedDate >= oneWeekAgo && updatedDate <= currentDate;
                } catch (e) {
                    console.warn(`Invalid updated_on for ${doc.title}: ${doc.updated_on}`, e);
                }
                console.log('Rendering document:', doc.title, 'with path:', fullPath, 'isNew:', isNew, 'updated_on:', doc.updated_on);
                return `
                    <li>
                        <a href="#" class="document-link flex items-center text-sm font-semibold text-navy-700 hover:text-gold-600 hover:bg-gray-200 p-3 rounded-lg transition-all duration-200 bg-white shadow-sm hover:shadow-md" data-url="${fullPath}">
                            ${isNew ? '<span class="newly-added inline-block px-2 py-1 mr-2 text-xs font-bold text-white bg-red-600 rounded">Newly Added</span>' : ''}
                            <svg class="w-5 h-5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                            </svg>
                            <span class="truncate">${doc.title}</span>
                        </a>
                    </li>
                `;
            }).join('')
            : '<li><p class="text-gray-700 text-center">No documents available.</p></li>';

        // Add click event listeners for iframe loading
        if (iframe && openTabButton) {
            const links = documentList.querySelectorAll('.document-link');
            links.forEach(link => {
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    const url = link.getAttribute('data-url');
                    console.log('Loading URL in iframe:', url);
                    iframe.src = url;
                    openTabButton.href = url;
                });
            });

            // Load first document in iframe by default (if any)
            if (documents.length > 0) {
                const firstUrl = `${baseUrl}${documents[0].path}`;
                console.log('Setting default iframe URL:', firstUrl);
                iframe.src = firstUrl;
                openTabButton.href = firstUrl;
            }
        }

        // Handle iframe resizing
        const resizeHandle = document.querySelector('.resize-handle-vertical');
        const documentListContainer = document.getElementById('document-list');
        const iframeContainer = document.getElementById('iframe-container');
        const contentContainer = document.getElementById('content-container');
        if (resizeHandle && documentListContainer && iframeContainer && contentContainer) {
            console.log('Resize elements found, attaching events');
            let isResizing = false;
            let startX, startListWidth;

            resizeHandle.addEventListener('mousedown', (e) => {
                isResizing = true;
                startX = e.clientX;
                startListWidth = documentListContainer.getBoundingClientRect().width;
                document.body.style.cursor = 'col-resize';
                console.log('Resize started:', { startX, startListWidth });
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
                    iframeContainer.style.width = `calc(100% - ${newListWidth + 8}px)`; // Adjust for handle
                    console.log('Resizing:', { newListWidth });
                }
            });

            document.addEventListener('mouseup', () => {
                if (isResizing) {
                    isResizing = false;
                    document.body.style.cursor = 'default';
                    console.log('Resize stopped');
                }
            });

            // Prevent text selection during resize
            document.addEventListener('selectstart', (e) => {
                if (isResizing) e.preventDefault();
            });
        } else {
            console.warn('Resize elements missing:', { resizeHandle, documentListContainer, iframeContainer, contentContainer });
        }

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
    }).catch(err => {
        console.error('Error rendering documents:', err);
        const documentList = document.querySelector('#document-list ul');
        if (documentList) {
            documentList.innerHTML = '<li><p class="text-gray-700 text-center">Error loading documents.</p></li>';
        }
    });
});