document.addEventListener('DOMContentLoaded', () => {
    const loadingScreen = document.getElementById('loading-screen');
    const mainContent = document.getElementById('main-content');
    const sections = document.querySelectorAll('.page-section');
    const projectLinks = document.querySelectorAll('.project-link');

    // 1. Loading Animation (Only on Home if present)
    if (loadingScreen) {
        setTimeout(() => {
            loadingScreen.style.transition = 'opacity 0.8s ease';
            loadingScreen.style.opacity = '0';

            setTimeout(() => {
                loadingScreen.classList.add('hidden');
                if (mainContent) mainContent.classList.remove('hidden');
                setTimeout(() => {
                    if (mainContent) mainContent.classList.add('visible');
                }, 50);
            }, 800);
        }, 1500);
    } else {
        // If no loading screen, just show content
        if (mainContent) {
            mainContent.classList.remove('hidden');
            mainContent.classList.add('visible');
        }
    }

    // 2. Navigation Logic
    // For wireframe, clicking project links toggles local section display
    function showSection(sectionId) {
        sections.forEach(section => {
            section.classList.remove('active');
            if (section.id === sectionId) {
                section.classList.add('active');
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        });
    }

    // Project Item Clicks (Single-file fallback for demo)
    projectLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            // If we're on index.html, we can show the detail section
            if (document.getElementById('project-detail-section')) {
                e.preventDefault();
                showSection('project-detail-section');
            }
        });
    });

    // Logo Click to Home
    const logo = document.querySelector('.logo');
    if (logo) {
        logo.addEventListener('click', () => {
            window.location.href = './index.html';
        });
    }

    // 3. Scroll Reveal (Always active)
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('.work-item, .archive-item, .about-content').forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'all 0.6s ease-out';
        observer.observe(el);
    });
});