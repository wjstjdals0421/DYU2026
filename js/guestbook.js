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

        // 사용자가 직접 만든 스티커 목록 (최신순)
        const allItems = [];

        userStickers.reverse().forEach((item, idx) => {
            if (typeof item === 'string') {
                allItems.push({
                    dataUrl: item,
                    author: `방문자 ${idx + 1}`,
                    message: "졸업을 진심으로 축하합니다! 🎉",
                    date: new Date().toLocaleDateString()
                });
            } else if (typeof item === 'object' && item !== null) {
                allItems.push({
                    dataUrl: item.dataUrl,
                    author: item.author || "익명 방문자",
                    message: item.message || "졸업 축하드립니다!",
                    date: item.date || new Date().toLocaleDateString()
                });
            }
        });

        if (totalCountEl) {
            totalCountEl.textContent = `총 ${allItems.length}개의 방명록 메시지`;
        }

        // 0. 맨 첫 번째 칸: 방명록 스티커 추가 전용 (+) 카드 생성 및 맨 앞에 삽입
        const addCard = document.createElement('div');
        addCard.className = 'guestbook-card create-add-card reveal active';
        addCard.innerHTML = `
            <div class="create-card-inner">
                <div class="create-card-plus-box">
                    <svg class="plus-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                        <line x1="12" y1="5" x2="12" y2="19"></line>
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                </div>
                <span class="create-card-title">방명록 스티커 남기기</span>
                <span class="create-card-desc">나만의 캐릭터를 제작하고<br>응원의 메시지를 작성해보세요!</span>
            </div>
        `;
        addCard.addEventListener('click', () => {
            const createBtn = document.getElementById('create-sticker-btn');
            if (createBtn) {
                createBtn.click();
            } else {
                const modalOverlay = document.getElementById('sticker-modal-overlay');
                if (modalOverlay) {
                    modalOverlay.classList.add('active');
                    document.body.style.overflow = 'hidden';
                }
            }
        });
        gridContainer.appendChild(addCard);

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

    window.renderGuestbookBoard = renderGuestbookBoard;
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
