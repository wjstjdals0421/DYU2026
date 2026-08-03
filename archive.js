// 과거 전시 기록(Archive) 카드 슬라이더 모듈
document.addEventListener('DOMContentLoaded', () => {
    // 2019년부터 2025년까지 오름차순 연도 데이터 (19부터 시작)
    const archiveData = [
        { year: '2019', url: 'http://gsdd.org/2019/' },
        { year: '2020', url: 'http://gsdd.org/2020/' },
        { year: '2021', url: 'http://gsdd.org/2021/' },
        { year: '2022', url: 'http://gsdd.org/2022/' },
        { year: '2023', url: 'http://gsdd.org/2023/' },
        { year: '2024', url: 'http://gsdd.org/2024/' },
        { year: '2025', url: 'http://gsdd.org/2025/' }
    ];

    const track = document.getElementById('archive-track');
    const dotsContainer = document.getElementById('archive-dots');
    const prevBtn = document.getElementById('archive-prev-btn');
    const nextBtn = document.getElementById('archive-next-btn');

    if (!track || !dotsContainer) return;

    let currentIndex = 0;
    let startX = 0;

    // 카드 슬라이드 엘리먼트 및 내비게이션 도트 생성
    archiveData.forEach((item, index) => {
        // 연도 카드 생성
        const card = document.createElement('div');
        card.className = 'archive-card';
        card.dataset.index = index;
        card.innerHTML = `<span class="archive-card-year">${item.year}</span>`;
        track.appendChild(card);

        // 하단 인디케이터 도트 생성
        const dot = document.createElement('div');
        dot.className = `archive-dot ${index === 0 ? 'active' : ''}`;
        dot.dataset.index = index;
        dotsContainer.appendChild(dot);
    });

    const cards = document.querySelectorAll('.archive-card');
    const dots = document.querySelectorAll('.archive-dot');

    // 3D 카드 슬라이더 변형 및 위치 업데이트 함수
    function updateSlider() {
        cards.forEach((card, index) => {
            const offset = index - currentIndex;

            if (offset === 0) {
                // 현재 선택된 중앙 포커스 카드
                card.style.transform = `translateX(-50%) translateY(-50%) scale(1)`;
                card.style.opacity = '1';
                card.style.zIndex = '10';
                card.classList.add('focused');
            } else if (offset > 0) {
                // 우측으로 배치되는 카드들
                const shiftX = -50 + (offset * 80);
                const scaleVal = Math.max(0.65, 1 - (offset * 0.16));
                const opacityVal = Math.max(0, 1 - (offset * 0.4));
                card.style.transform = `translateX(${shiftX}%) translateY(-50%) scale(${scaleVal})`;
                card.style.opacity = opacityVal.toString();
                card.style.zIndex = (10 - offset).toString();
                card.classList.remove('focused');
            } else {
                // 좌측으로 배치되는 카드들
                const shiftX = -50 + (offset * 80);
                const scaleVal = Math.max(0.65, 1 - (Math.abs(offset) * 0.16));
                const opacityVal = Math.max(0, 1 - (Math.abs(offset) * 0.4));
                card.style.transform = `translateX(${shiftX}%) translateY(-50%) scale(${scaleVal})`;
                card.style.opacity = opacityVal.toString();
                card.style.zIndex = (10 - Math.abs(offset)).toString();
                card.classList.remove('focused');
            }
        });

        // 하단 인디케이터 도트 상태 업데이트
        dots.forEach((dot, index) => {
            dot.classList.toggle('active', index === currentIndex);
        });
    }

    // 지정한 인덱스의 카드로 이동하는 함수
    function goToCard(index) {
        if (index < 0 || index >= archiveData.length) return;
        currentIndex = index;
        updateSlider();
    }

    // 좌우 화살표 버튼 이벤트 연동
    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            if (currentIndex > 0) goToCard(currentIndex - 1);
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            if (currentIndex < archiveData.length - 1) goToCard(currentIndex + 1);
        });
    }

    // 카드 클릭 이벤트 (포커스 카드 클릭 시 과거 전시 링크 이동)
    cards.forEach(card => {
        card.addEventListener('click', () => {
            const idx = parseInt(card.dataset.index);
            if (idx === currentIndex) {
                window.open(archiveData[idx].url, '_blank');
            } else {
                goToCard(idx);
            }
        });
    });

    // 하단 도트 클릭 이벤트
    dots.forEach(dot => {
        dot.addEventListener('click', () => {
            goToCard(parseInt(dot.dataset.index));
        });
    });

    // 키보드 좌우 방향키 탐색 지원
    window.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft') {
            goToCard(currentIndex - 1);
        } else if (e.key === 'ArrowRight') {
            goToCard(currentIndex + 1);
        }
    });

    // 마우스 휠 스크롤을 활용한 슬라이드 제어 및 기본 수직 스크롤 방지
    window.addEventListener('wheel', (e) => {
        if (window.innerWidth > 768) {
            e.preventDefault();
            if (e.deltaY > 0) {
                goToCard(currentIndex + 1);
            } else if (e.deltaY < 0) {
                goToCard(currentIndex - 1);
            }
        }
    }, { passive: false });

    // 모바일 터치 스와이프 인터랙션
    track.addEventListener('touchstart', (e) => {
        startX = e.touches[0].clientX;
    }, { passive: true });

    track.addEventListener('touchend', (e) => {
        const endX = e.changedTouches[0].clientX;
        const diffX = startX - endX;

        if (Math.abs(diffX) > 50) {
            if (diffX > 0) {
                goToCard(currentIndex + 1);
            } else {
                goToCard(currentIndex - 1);
            }
        }
    }, { passive: true });

    // 초기 슬라이더 위치 실행
    updateSlider();
});
