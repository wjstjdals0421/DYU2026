// 과거 전시 기록(Archive) 카드 슬라이더 모듈
document.addEventListener('DOMContentLoaded', () => {
    // 2025년부터 2019년까지의 과거 전시 링크 데이터
    const archiveData = [
        { year: '2025', url: 'http://gsdd.org/2025/' },
        { year: '2024', url: 'http://gsdd.org/2024/' },
        { year: '2023', url: 'http://gsdd.org/2023/' },
        { year: '2022', url: 'http://gsdd.org/2022/' },
        { year: '2021', url: 'http://gsdd.org/2021/' },
        { year: '2020', url: 'http://gsdd.org/2020/' },
        { year: '2019', url: 'http://gsdd.org/2019/' }
    ];

    const track = document.getElementById('archive-track');
    const dotsContainer = document.getElementById('archive-dots');
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
                const shiftX = -50 + (offset * 80); // 우측 간격 오프셋
                const scaleVal = Math.max(0.65, 1 - (offset * 0.16));
                const opacityVal = Math.max(0, 1 - (offset * 0.4));
                card.style.transform = `translateX(${shiftX}%) translateY(-50%) scale(${scaleVal})`;
                card.style.opacity = opacityVal.toString();
                card.style.zIndex = (10 - offset).toString();
                card.classList.remove('focused');
            } else {
                // 좌측으로 배치되는 카드들
                const shiftX = -50 + (offset * 80); // 좌측 간격 오프셋
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

    // 마우스 휠 전환 이벤트 (페이지 수직 스크롤은 막고 카드 넘기기만 작동)
    let isWheelThrottled = false;
    window.addEventListener('wheel', (e) => {
        if (!document.getElementById('archive-container')) return;
        
        // 페이지 기본 상하 스크롤 막기
        e.preventDefault();

        if (isWheelThrottled) return;
        
        if (Math.abs(e.deltaY) > 10 || Math.abs(e.deltaX) > 10) {
            isWheelThrottled = true;
            if (e.deltaY > 0 || e.deltaX > 0) {
                goToCard(currentIndex + 1);
            } else {
                goToCard(currentIndex - 1);
            }
            setTimeout(() => { isWheelThrottled = false; }, 350);
        }
    }, { passive: false });

    // 키보드 방향키 제어
    window.addEventListener('keydown', (e) => {
        if (!document.getElementById('archive-container')) return;
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
            goToCard(currentIndex + 1);
        } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
            goToCard(currentIndex - 1);
        }
    });

    // 터치 스와이프 제어
    const container = document.getElementById('archive-container');
    if (container) {
        container.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
        }, { passive: true });

        container.addEventListener('touchend', (e) => {
            const endX = e.changedTouches[0].clientX;
            const diff = startX - endX;
            if (Math.abs(diff) > 40) {
                if (diff > 0) goToCard(currentIndex + 1);
                else goToCard(currentIndex - 1);
            }
        }, { passive: true });
    }

    // 슬라이더 초기 렌더링
    updateSlider();
});
