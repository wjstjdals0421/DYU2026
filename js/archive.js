// 과거 전시 기록(Archive) 카드 슬라이더 모듈
document.addEventListener('DOMContentLoaded', () => {
    // 2019부터 2025년 오름차순 (최초 진입 시 2025년 선택, 왼쪽으로 2024, 2023... 낮은 연도 배치)
    const archiveData = [
        {
            year: '2019',
            title: '제 1회 동양대학교 디자인학부 졸업전시회',
            desc: '제 1회 동양대학교 디자인학부 졸업전시회',
            img: './gallery/archive/2019gsdd.png',
            url: 'http://gsdd.org/2019/'
        },
        {
            year: '2020',
            title: '2020 GSDD',
            desc: '지난 1월 유행하기 시작한 전염병 코로나로 인해 학교 출입 시, 마스크에 체온 확인 완료를 표시하기 위해 스티커를 붙여야만 했다. 둥근 모양의 형광 스티커는 매일 다른 색으로 교체되었고 버려지거나 핸드폰, 노트북, 방 거울 등에 쌓여갔다. 형형색색의 스티커는 곧 코로나로 인해 바뀌어버린 우리의 생활을 뜻하기도 하지만 둥글둥글 귀여운 모양으로 핸드폰 뒷면에 남아있기도 했다. 우리는 둥근 스티커로 졸업생 한 명 한 명의 개성을 표현하고자 했다.',
            img: './gallery/archive/2020gsdd.png',
            url: 'http://gsdd.org/2020/'
        },
        {
            year: '2021',
            title: '2021 GSDD',
            desc: '우리는 일상 속에서 디자인을 공부할 때 혹은 공책을 펴볼 때도 쉽게 행과 열을 찾아볼 수 있다. 각기 다른 행과 열이 뻗어 나가면 그 방향성이 모여 하나의 구조를 만들어내고 그 구조 안에는 다양한 가능성이 존재한다. 이는 우리와 닮아있다. 각자의 방식, 각자의 과정과 방법론이 모여 졸업전시회라는 구조를 만들어낸다.',
            img: './gallery/archive/2021gsdd.png',
            url: 'http://gsdd.org/2021/'
        },
        {
            year: '2022',
            title: 'NEXT LEVEL',
            desc: '대학교 4학년의 마지막을 장식하는 졸업전시회는 곧 우리가 사회에 한 걸음 내딛게 된다는 사실을 알려줍니다. 우리는 졸업이라는 과정을 거쳐 학생에서 사회인으로 발전하게 되고, 이렇게 사회 생활이라는 새로운 단계로 넘어가게 됩니다. 학생들은 개개인만의 개성과 능력으로 작품을 만들고, 주어진 다음 단계를 스스로 풀어나간다는 의미를 담았습니다.',
            img: './gallery/archive/2022gsdd.jpeg',
            url: 'http://gsdd.org/2022/'
        },
        {
            year: '2023',
            title: 'PROJECT: FUTUREFORMING',
            desc: '퓨처포밍 프로젝트는 학생들이 각자 광활한 우주로 나아가 별을 찾고, 미래에 정착할 수 있도록 포밍(forming) 시키는 프로젝트다. 졸업 전시를 통해 각자의 미래를 준비하고 모습을 만들어 가는 것을 원석을 깎아 별 조각으로 만드는 것으로 비유하였으며, 별 조각이 된 학생들의 작업물이 하나로 합쳐져 완전한 별 형태를 이룬다. 이는 우리의 미래 가능성을 보여주는 코어로 재현된다. 프로젝트의 성공은 전시장에 포밍 완료된 별 조각 샘플을 채취하여 전시하는 것으로 증명한다.',
            img: './gallery/archive/2023gsdd.png',
            url: 'http://gsdd.org/2023/'
        },
        {
            year: '2024',
            title: 'Get A Clue',
            desc: '대학에서의 4년간, 우리는 수많은 도전과 학습을 통해 많은 것을 배웠습니다. 이 과정에서 얻은 경험과 노력이 우리 미래에 대한 중요한 단서를 제공해 주었습니다. “GET A CLUE”는 이러한 경험을 바탕으로, 미래를 향한 방향성을 탐색하는 여정을 선보입니다.',
            img: './gallery/archive/2024gsdd.png',
            url: 'http://gsdd.org/2024/'
        },
        {
            year: '2025',
            title: 'CUT! LAYER! PASTE!',
            desc: '종이 조각을 자르고(Cut), 겹치고(Layer), 붙이는(Paste) 기본적인 행위에서 시작된 이 세 단어는 실제 졸업생들의 개별 캡션을 제작했던 감각과 과정의 의미를 반영했습니다. 이는 각 작품이 만들어지는 과정과 그 과정을 이루는 행위들, 그리고 이 모든 것이 모여 완성되는 하나의 전시를 상징합니다. 50명의 졸업생들의 고유함은 마치 흩어진 다양한 조각들과 같지만, 그 조각들이 서로 겹치고 연결되면서 하나의 흐름을 만들어냅니다. 우리는 이 과정을 함께 경험하고, 섬세하게 조율하며, 직접 손으로 구성해 나갔습니다. 그렇게 완성된 이번 전시는 각자의 독특한 개성과 시도가 층층이 쌓여 다채롭고 밀도 있는 하나의 장면으로 펼쳐집니다.',
            img: './gallery/archive/2025gsdd.png',
            url: 'http://gsdd.org/2025/'
        }
    ];

    const track = document.getElementById('archive-track');
    const dotsContainer = document.getElementById('archive-dots');
    const prevBtn = document.getElementById('archive-prev-btn');
    const nextBtn = document.getElementById('archive-next-btn');

    if (!track || !dotsContainer) return;

    // 최초 진입 시 2025년도가 중앙 포커스 카드로 등장
    let currentIndex = archiveData.findIndex(item => item.year === '2025');
    if (currentIndex === -1) currentIndex = archiveData.length - 1;
    let startX = 0;

    // 카드 슬라이드 엘리먼트 및 내비게이션 도트 생성
    archiveData.forEach((item, index) => {
        // 연도 카드 생성 (포스터 이미지 + 기본 연도 타이틀 + 마우스 호버 오버레이 설명)
        const card = document.createElement('div');
        card.className = 'archive-card';
        card.dataset.index = index;
        card.innerHTML = `
            <div class="archive-card-poster">
                <img src="${item.img}" alt="${item.year} 졸업전시 포스터" />
            </div>
            <div class="archive-card-base-info">
                <span class="archive-card-year">${item.year}</span>
                <span class="archive-card-theme-title">${item.title}</span>
            </div>
            <div class="archive-card-hover-desc">
                <div class="hover-desc-inner">
                    <span class="hover-year-tag">${item.year}</span>
                    <h4 class="hover-theme-title">${item.title}</h4>
                    <p class="hover-desc-text">${item.desc}</p>
                </div>
            </div>
        `;
        track.appendChild(card);

        // 하단 인디케이터 도트 생성
        const dot = document.createElement('div');
        dot.className = `archive-dot ${index === 0 ? 'active' : ''}`;
        dot.dataset.index = index;
        dotsContainer.appendChild(dot);
    });

    const cards = document.querySelectorAll('.archive-card');
    const dots = document.querySelectorAll('.archive-dot');

    // 3D 카드 슬라이더 변형 및 위치 업데이트 함수 (중앙 정렬 및 3D 원근 비율 유지)
    function updateSlider() {
        cards.forEach((card, index) => {
            const offset = index - currentIndex;
            const absOffset = Math.abs(offset);

            if (offset === 0) {
                // 현재 선택된 중앙 포커스 카드
                card.style.transform = `translate(-50%, -50%) translate3d(0, 0, 0) scale(1) rotateY(0deg)`;
                card.style.opacity = '1';
                card.style.zIndex = '30';
                card.classList.add('focused');
            } else {
                // 좌우로 원근 배치되는 3D 카드들
                const direction = offset > 0 ? 1 : -1;
                const shiftX = offset * 380; // 카드가 시원하게 확 넓어진 가로 간격 (380px)
                const rotateY = direction * -12; // 3D 회전각
                const scaleVal = Math.max(0.72, 1 - (absOffset * 0.1));
                const opacityVal = Math.max(0.2, 1 - (absOffset * 0.3));

                card.style.transform = `translate(-50%, -50%) translate3d(${shiftX}px, 0, ${-absOffset * 90}px) rotateY(${rotateY}deg) scale(${scaleVal})`;
                card.style.opacity = opacityVal.toString();
                card.style.zIndex = (20 - absOffset).toString();
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
