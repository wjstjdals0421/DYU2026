document.addEventListener('DOMContentLoaded', () => {
    const loadingScreen = document.getElementById('loading-screen');
    const mainContent = document.getElementById('main-content');

    // 1. Loading Animation (sessionStorage 활용)
    const hasLoaded = sessionStorage.getItem('gsdd_loaded');

    if (loadingScreen && !hasLoaded) {
        // 처음 접속 시: 2초 대기 후 페이드아웃
        setTimeout(() => {
            loadingScreen.classList.add('fade-out');
            
            setTimeout(() => {
                loadingScreen.classList.add('hidden');
                if (mainContent) {
                    mainContent.classList.remove('hidden');
                    setTimeout(() => {
                        mainContent.classList.add('visible');
                    }, 50);
                }
                // 세션 스토리지에 로드 완료 기록
                sessionStorage.setItem('gsdd_loaded', 'true');
            }, 1000); 
        }, 2000);
    } else {
        // 이미 접속했었거나 로딩 스크린이 없는 경우: 즉시 표시
        if (loadingScreen) loadingScreen.classList.add('hidden');
        if (mainContent) {
            mainContent.classList.remove('hidden');
            mainContent.classList.add('visible');
        }
    }

    // 2. Navigation Logic (Placeholder for internal section scrolling)
    const navLinks = document.querySelectorAll('.nav-links a');
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            const href = link.getAttribute('href');
            if (href.startsWith('#')) {
                e.preventDefault();
                const targetId = href.substring(1);
                const targetElement = document.getElementById(targetId);
                if (targetElement) {
                    window.scrollTo({
                        top: targetElement.offsetTop - 80, // Offset for header
                        behavior: 'smooth'
                    });
                }
            }
        });
    });

    // Logo Click to Top
    const logo = document.querySelector('.logo');
    if (logo) {
        logo.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    // 3. Scroll Reveal Logic (Improved)
    const observerOptions = {
        threshold: 0.15,
        rootMargin: '0px 0px -50px 0px'
    };

    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
                // 한번 나타나면 관찰 중단 (성능 최적화)
                // revealObserver.unobserve(entry.target); 
            } else {
                // 다시 스크롤 올렸을 때 애니메이션을 초기화하고 싶다면 아래 주석 해제
                // entry.target.classList.remove('active');
            }
        });
    }, observerOptions);

    // 관찰 대상 지정
    const applyReveal = () => {
        const revealElements = document.querySelectorAll('.reveal, .reveal-scale');
        revealElements.forEach(el => revealObserver.observe(el));
    };

    applyReveal();
});