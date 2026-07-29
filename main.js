// 메인 스크립트 모듈 (로딩 화면 & 자연스러운 스크롤 리빌 애니메이션)
document.addEventListener('DOMContentLoaded', () => {
    const loadingScreen = document.getElementById('loading-screen');
    const mainContent = document.getElementById('main-content');

    // 1. 로딩 애니메이션 (sessionStorage 접속 기록 활용)
    const hasLoaded = sessionStorage.getItem('gsdd_loaded');

    if (loadingScreen && !hasLoaded) {
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
                sessionStorage.setItem('gsdd_loaded', 'true');
            }, 1000); 
        }, 1800);
    } else {
        if (loadingScreen) loadingScreen.classList.add('hidden');
        if (mainContent) {
            mainContent.classList.remove('hidden');
            mainContent.classList.add('visible');
        }
    }

    // 2. 스크롤 요소 순차 등장(Scroll Reveal) 인터섹션 옵저버
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -40px 0px'
    };

    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
            }
        });
    }, observerOptions);

    const applyReveal = () => {
        const revealElements = document.querySelectorAll('.reveal, .reveal-scale');
        revealElements.forEach(el => revealObserver.observe(el));
    };

    applyReveal();
});