// 메인 스크립트 모듈 (로딩 화면, 스크롤 리빌 애니메이션, 모바일 햄버거 메뉴 및 About 이동)
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

    // 3. 모바일 햄버거 메뉴 토글 로직 (상단 헤더 바로 아래 드롭다운)
    const hamburgerBtn = document.getElementById('hamburger-btn');
    const mobileMenuOverlay = document.getElementById('mobile-menu-overlay');

    if (hamburgerBtn && mobileMenuOverlay) {
        hamburgerBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            mobileMenuOverlay.classList.toggle('active');
        });

        // 모바일 메뉴 내 링크 클릭 시 메뉴 자동 닫기
        const mobileLinks = mobileMenuOverlay.querySelectorAll('a');
        mobileLinks.forEach(link => {
            link.addEventListener('click', () => {
                mobileMenuOverlay.classList.remove('active');
            });
        });

        // 메뉴 외부 영역 클릭 시 드롭다운 슬라이드 닫기
        document.addEventListener('click', (e) => {
            if (!mobileMenuOverlay.contains(e.target) && !hamburgerBtn.contains(e.target)) {
                mobileMenuOverlay.classList.remove('active');
            }
        });
    }

    // 4. About 메뉴 클릭 시 메인페이지 부드러운 스크롤 이동 로직
    const scrollToAbout = () => {
        const aboutSection = document.querySelector('.about-section-block');
        if (aboutSection) {
            const headerHeight = 80;
            const targetPos = aboutSection.getBoundingClientRect().top + window.pageYOffset - headerHeight;
            window.scrollTo({ top: targetPos, behavior: 'smooth' });
        }
    };

    const aboutLinks = document.querySelectorAll('.nav-link-about');
    aboutLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            const isIndex = window.location.pathname.endsWith('index.html') || window.location.pathname.endsWith('/') || window.location.pathname === '';
            if (isIndex && document.querySelector('.about-section-block')) {
                e.preventDefault();
                scrollToAbout();
            }
        });
    });

    // URL에 #about 파라미터가 포함되어 접속한 경우 자동 스크롤
    if (window.location.hash === '#about') {
        setTimeout(scrollToAbout, 300);
    }
});