// 방명록 전용 페이지 렌더링 스크립트 (guestbook.js)
document.addEventListener('DOMContentLoaded', () => {
    const gridContainer = document.getElementById('guestbook-grid');
    const totalCountEl = document.getElementById('guestbook-total-count');
    const pageCreateBtn = document.getElementById('page-create-sticker-btn');

    if (pageCreateBtn) {
        pageCreateBtn.addEventListener('click', () => {
            const modalOverlay = document.getElementById('sticker-modal-overlay');
            if (modalOverlay) {
                modalOverlay.classList.add('active');
                document.body.style.overflow = 'hidden';
            }
        });
    }

    // 기본 샘플 방명록 데이터 (초기 방문 시 노출용)
    const defaultSampleGuestbook = [
        {
            author: "박연지 (졸준위원장)",
            message: "4년 동안 같이 고생해준 우리 팀원들 모두 너무 고맙고 사랑해요! 졸업전시 화이팅 🎉",
            date: "2026. 08. 01",
            likes: 24,
            unitFace: "./unit/face/face_1.png"
        },
        {
            author: "차무영",
            message: "Finding Balance In ___ 멋진 균형을 찾아낸 우리 모두 졸업 축하합니다!",
            date: "2026. 08. 02",
            likes: 18,
            unitFace: "./unit/face/face_3.png"
        },
        {
            author: "강선진",
            message: "졸업전시 웹사이트 오픈! 다들 수고 많으셨습니다 👏",
            date: "2026. 08. 03",
            likes: 32,
            unitFace: "./unit/face/face_5.png"
        },
        {
            author: "김소은",
            message: "아이덴티티 그래픽 유닛 너무 예뻐요! 끝까지 다들 파이팅!",
            date: "2026. 08. 04",
            likes: 15,
            unitFace: "./unit/face/face_8.png"
        }
    ];

    function renderGuestbookBoard() {
        if (!gridContainer) return;
        gridContainer.innerHTML = '';

        const rawData = localStorage.getItem('gsdd_custom_stickers');
        let userStickers = [];

        if (rawData) {
            try {
                const parsed = JSON.parse(rawData);
                userStickers = Array.isArray(parsed) ? parsed : [];
            } catch (e) {
                userStickers = [];
            }
        }

        // 전체 방명록 합치기 (사용자가 만든 스티커 + 기본 샘플)
        const allItems = [];

        // 1. 사용자 생성 스티커 (최신순)
        userStickers.reverse().forEach((item, idx) => {
            if (typeof item === 'string') {
                allItems.push({
                    dataUrl: item,
                    author: `방문자 ${idx + 1}`,
                    message: "졸업을 진심으로 축하합니다! 🎉",
                    date: "2026. 08. 06",
                    likes: Math.floor(Math.random() * 10) + 1
                });
            } else if (typeof item === 'object' && item !== null) {
                allItems.push({
                    dataUrl: item.dataUrl,
                    author: item.author || "익명 방문자",
                    message: item.message || "졸업 축하드립니다!",
                    date: item.date || "2026. 08. 06",
                    likes: item.likes || Math.floor(Math.random() * 10) + 1
                });
            }
        });

        // 2. 기본 샘플 추가
        defaultSampleGuestbook.forEach(sample => {
            allItems.push(sample);
        });

        if (totalCountEl) {
            totalCountEl.textContent = `총 ${allItems.length}개의 방명록 메시지`;
        }

        // 스티커 카드 렌더링
        allItems.forEach((item, index) => {
            const card = document.createElement('div');
            card.className = 'guestbook-card reveal active';
            card.style.animationDelay = `${(index % 6) * 0.08}s`;

            const imgSrc = item.dataUrl || item.unitFace || './unit/face/face_1.png';

            card.innerHTML = `
                <div class="guestbook-card-thumb">
                    <img src="${imgSrc}" alt="Guestbook Sticker" class="guestbook-sticker-img" />
                </div>
                <div class="guestbook-card-body">
                    <div class="guestbook-card-header">
                        <span class="guestbook-card-author">${escapeHTML(item.author)}</span>
                        <span class="guestbook-card-date">${escapeHTML(item.date)}</span>
                    </div>
                    <p class="guestbook-card-msg">${escapeHTML(item.message)}</p>
                    <div class="guestbook-card-footer">
                        <button class="guestbook-like-btn" onclick="toggleGuestbookLike(this)">
                            <svg class="heart-icon" viewBox="0 0 24 24">
                                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                            </svg>
                            <span class="like-count-num">${item.likes}</span>
                        </button>
                    </div>
                </div>
            `;
            gridContainer.appendChild(card);
        });
    }

    function escapeHTML(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    window.toggleGuestbookLike = function (btn) {
        const countSpan = btn.querySelector('.like-count-num');
        if (!countSpan) return;
        let currentLikes = parseInt(countSpan.textContent) || 0;

        if (btn.classList.contains('liked')) {
            btn.classList.remove('liked');
            countSpan.textContent = currentLikes - 1;
        } else {
            btn.classList.add('liked');
            btn.classList.add('pop-anim');
            countSpan.textContent = currentLikes + 1;
            setTimeout(() => btn.classList.remove('pop-anim'), 300);
        }
    };

    renderGuestbookBoard();

    // 스티커 등록 성공 후 보드 자동 갱신 리스너
    window.addEventListener('storage', renderGuestbookBoard);
    
    // 로컬 스티커 추가 이벤트 훅
    const originalSpawn = window.spawnCustomStickerBlock;
    window.spawnCustomStickerBlock = function (imgDataUrl, author, message) {
        if (originalSpawn) originalSpawn(imgDataUrl, author, message);
        setTimeout(renderGuestbookBoard, 400);
    };
});
