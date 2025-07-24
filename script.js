document.addEventListener('DOMContentLoaded', () => {
    const sidebar = document.getElementById('sidebar');
    const toggleSidebarButton = document.getElementById('toggle-sidebar');
    const closeIcon = sidebar.querySelector('.sidebar-icon-close');
    const menuIcon = sidebar.querySelector('.sidebar-icon-menu');
    const resizeHandle = sidebar.querySelector('.resize-handle');

    let isResizing = false;

    // Toggle sidebar visibility
    toggleSidebarButton.addEventListener('click', () => {
        sidebar.classList.toggle('sidebar-collapsed');
        closeIcon.classList.toggle('hidden');
        menuIcon.classList.toggle('hidden');
    });

    // Sidebar resizing
    resizeHandle.addEventListener('mousedown', (e) => {
        isResizing = true;
        document.addEventListener('mousemove', resizeSidebar);
        document.addEventListener('mouseup', stopResizing);
    });

    function resizeSidebar(e) {
        if (isResizing) {
            let newWidth = e.clientX;
            if (newWidth >= 150 && newWidth <= 400) {
                sidebar.style.width = `${newWidth}px`;
            }
        }
    }

    function stopResizing() {
        isResizing = false;
        document.removeEventListener('mousemove', resizeSidebar);
        document.removeEventListener('mouseup', stopResizing);
    }

    // Search functionality (only on index.html)
    const searchBar = document.getElementById('search-bar');
    const searchResults = document.getElementById('search-results');
    if (searchBar && searchResults) {
        fetch('docs.json')
            .then(response => response.json())
            .then(data => {
                searchBar.addEventListener('input', () => {
                    const query = searchBar.value.toLowerCase();
                    searchResults.innerHTML = '';
                    if (query.length > 0) {
                        const filteredDocs = data.filter(doc =>
                            doc.title.toLowerCase().includes(query) ||
                            doc.description.toLowerCase().includes(query)
                        );
                        if (filteredDocs.length > 0) {
                            searchResults.classList.remove('hidden');
                            filteredDocs.forEach(doc => {
                                const resultItem = document.createElement('div');
                                resultItem.className = 'p-2 border-b border-gray-200 hover:bg-gray-100 cursor-pointer';
                                resultItem.innerHTML = `<a href="${doc.url}" class="text-navy-700 hover:text-gold-600">${doc.title}</a>`;
                                searchResults.appendChild(resultItem);
                            });
                        } else {
                            searchResults.classList.remove('hidden');
                            searchResults.innerHTML = '<div class="p-2 text-gray-500">No results found</div>';
                        }
                    } else {
                        searchResults.classList.add('hidden');
                    }
                });
            })
            .catch(error => console.error('Error loading docs.json:', error));
    }

    // Document list functionality (only on user-guides.html)
    const documentLinks = document.querySelectorAll('.document-link');
    const documentIframe = document.getElementById('document-iframe');
    const openTabButton = document.getElementById('open-tab-button');

    if (documentLinks.length > 0) {
        documentLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const url = link.getAttribute('data-url');
                documentIframe.src = url;
                openTabButton.href = url;
                openTabButton.classList.remove('disabled');
                openTabButton.removeAttribute('disabled');
            });
        });
    }
});