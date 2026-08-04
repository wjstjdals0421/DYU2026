/**
 * GSDD 2026 - 커스텀 스티커 방명록 생성기 (Sticker Creator Engine)
 * - face_1 ~ face_12 얼굴 템플릿 선택
 * - Emoji_1 ~ Emoji_6 이모지 요소 최대 5개 드래그, 회전, 크기 조절
 * - 합성 후 Matter.js 2D 물리 엔진에 실시간 생성 및 localStorage 보관
 */

(function () {
    let currentFaceId = 1; // 기본 face_1
    let placedEmojis = [];  // { id, srcId, x, y, scale, rotation, el }
    let activeEmojiId = null;
    let emojiIdCounter = 1;

    // DOM 요소 캐시
    let modalOverlay, createBtn, closeBtn, cancelBtn, addBtn;
    let facePickerGrid, emojiPickerGrid, emojiCountBadge;
    let baseFaceImg, emojiLayer, activeItemTools, activeItemName;
    let scaleSlider, rotateSlider, deleteBtn, clearAllBtn;

    document.addEventListener('DOMContentLoaded', initStickerCreator);

    function initStickerCreator() {
        modalOverlay = document.getElementById('sticker-modal-overlay');
        createBtn = document.getElementById('create-sticker-btn');
        closeBtn = document.getElementById('sticker-modal-close');
        cancelBtn = document.getElementById('sticker-cancel-btn');
        addBtn = document.getElementById('sticker-add-btn');

        facePickerGrid = document.getElementById('face-picker-grid');
        emojiPickerGrid = document.getElementById('emoji-picker-grid');
        emojiCountBadge = document.getElementById('emoji-count-badge');

        baseFaceImg = document.getElementById('sticker-base-face');
        emojiLayer = document.getElementById('sticker-emoji-layer');

        activeItemTools = document.getElementById('active-item-tools');
        activeItemName = document.getElementById('active-item-name');
        scaleSlider = document.getElementById('emoji-scale-slider');
        rotateSlider = document.getElementById('emoji-rotate-slider');
        deleteBtn = document.getElementById('emoji-delete-btn');
        clearAllBtn = document.getElementById('emoji-clear-all-btn');

        if (!createBtn || !modalOverlay) return;

        // 이벤트 리스너 바인딩
        createBtn.addEventListener('click', openStickerModal);
        if (closeBtn) closeBtn.addEventListener('click', closeStickerModal);
        if (cancelBtn) cancelBtn.addEventListener('click', closeStickerModal);

        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) closeStickerModal();
        });

        // 1. 얼굴 피커 동적 생성 (face_1 ~ face_12)
        renderFacePicker();

        // 2. 이모지 피커 동적 생성 (Emoji_1 ~ Emoji_6)
        renderEmojiPicker();

        // 3. 이모지 조작 컨트롤 바인딩
        scaleSlider.addEventListener('input', updateActiveEmojiTransform);
        rotateSlider.addEventListener('input', updateActiveEmojiTransform);
        deleteBtn.addEventListener('click', deleteActiveEmoji);
        clearAllBtn.addEventListener('click', clearAllEmojis);

        // 4. 스티커 생성 완료 버튼
        addBtn.addEventListener('click', handleStickerSubmit);

        // 스테이지 바깥 클릭 시 선택 해제
        emojiLayer.addEventListener('click', (e) => {
            if (e.target === emojiLayer) {
                selectEmoji(null);
            }
        });
    }

    function openStickerModal() {
        modalOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function closeStickerModal() {
        modalOverlay.classList.remove('active');
        document.body.style.overflow = 'auto';
    }

    // 1. 얼굴 템플릿 선택 그리드 생성
    function renderFacePicker() {
        if (!facePickerGrid) return;
        facePickerGrid.innerHTML = '';

        for (let i = 1; i <= 12; i++) {
            const thumb = document.createElement('div');
            thumb.className = `face-thumb-item ${i === currentFaceId ? 'selected' : ''}`;
            thumb.innerHTML = `<img src="./unit/face/face_${i}.png" alt="face_${i}" />`;
            thumb.addEventListener('click', () => {
                currentFaceId = i;
                baseFaceImg.src = `./unit/face/face_${i}.png`;
                document.querySelectorAll('.face-thumb-item').forEach(el => el.classList.remove('selected'));
                thumb.classList.add('selected');
            });
            facePickerGrid.appendChild(thumb);
        }
    }

    // 2. 이모지 선택 그리드 생성
    function renderEmojiPicker() {
        if (!emojiPickerGrid) return;
        emojiPickerGrid.innerHTML = '';

        // Emoji_1 ~ Emoji_6 (존재하는 이모지 리스트)
        const emojiList = [1, 2, 4, 5, 6]; 

        emojiList.forEach(num => {
            const thumb = document.createElement('div');
            thumb.className = 'emoji-thumb-item';
            thumb.innerHTML = `<img src="./unit/face/Emoji_${num}.png" alt="Emoji_${num}" onerror="this.parentElement.style.display='none'" />`;
            thumb.addEventListener('click', () => addEmojiToStage(num));
            emojiPickerGrid.appendChild(thumb);
        });
    }

    // 스테이지에 이모지 추가 (최대 5개 제한)
    function addEmojiToStage(emojiNum) {
        if (placedEmojis.length >= 5) {
            alert('이모지는 한 얼굴에 최대 5개까지 추가할 수 있습니다!');
            return;
        }

        const id = emojiIdCounter++;
        const emojiData = {
            id: id,
            srcId: emojiNum,
            src: `./unit/face/Emoji_${emojiNum}.png`,
            x: 120 + (placedEmojis.length * 12), // 스테이지 중앙 부근
            y: 120 + (placedEmojis.length * 12),
            scale: 1.0,
            rotation: 0
        };

        const itemEl = document.createElement('div');
        itemEl.className = 'stage-emoji-item';
        itemEl.id = `stage-emoji-${id}`;
        itemEl.innerHTML = `<img src="${emojiData.src}" draggable="false" />`;

        emojiLayer.appendChild(itemEl);
        emojiData.el = itemEl;
        placedEmojis.push(emojiData);

        // 드래그 및 선택 이벤트 연동
        makeEmojiDraggable(emojiData);
        selectEmoji(id);
        updateEmojiCount();
    }

    // 이모지 선택 및 조작 슬라이더 업데이트
    function selectEmoji(id) {
        activeEmojiId = id;
        document.querySelectorAll('.stage-emoji-item').forEach(el => el.classList.remove('active'));

        if (id === null) {
            activeItemTools.style.opacity = '0.5';
            activeItemTools.style.pointerEvents = 'none';
            activeItemName.textContent = '-';
            return;
        }

        const emoji = placedEmojis.find(item => item.id === id);
        if (!emoji) return;

        emoji.el.classList.add('active');
        activeItemTools.style.opacity = '1';
        activeItemTools.style.pointerEvents = 'auto';
        activeItemName.textContent = `Emoji_${emoji.srcId} (#${emoji.id})`;

        scaleSlider.value = emoji.scale;
        rotateSlider.value = emoji.rotation;
    }

    // 조작 슬라이더 입력 시 이모지 변환 반영
    function updateActiveEmojiTransform() {
        if (!activeEmojiId) return;
        const emoji = placedEmojis.find(item => item.id === activeEmojiId);
        if (!emoji) return;

        emoji.scale = parseFloat(scaleSlider.value);
        emoji.rotation = parseInt(rotateSlider.value);

        applyEmojiStyle(emoji);
    }

    function applyEmojiStyle(emoji) {
        emoji.el.style.left = `${emoji.x}px`;
        emoji.el.style.top = `${emoji.y}px`;
        emoji.el.style.transform = `translate(-50%, -50%) rotate(${emoji.rotation}deg) scale(${emoji.scale})`;
    }

    // 드래그 조작 (마우스 & 터치 연동)
    function makeEmojiDraggable(emoji) {
        const el = emoji.el;
        let isDragging = false;
        let startX, startY;
        let initialX, initialY;

        applyEmojiStyle(emoji);

        function onStart(e) {
            e.stopPropagation();
            selectEmoji(emoji.id);
            isDragging = true;

            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;

            startX = clientX;
            startY = clientY;
            initialX = emoji.x;
            initialY = emoji.y;

            window.addEventListener('mousemove', onMove);
            window.addEventListener('mouseup', onEnd);
            window.addEventListener('touchmove', onMove, { passive: false });
            window.addEventListener('touchend', onEnd);
        }

        function onMove(e) {
            if (!isDragging) return;
            if (e.cancelable) e.preventDefault();

            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;

            const dx = clientX - startX;
            const dy = clientY - startY;

            // 스테이지 경계 내 유효 영역 보정 (0 ~ 280px)
            emoji.x = Math.max(10, Math.min(270, initialX + dx));
            emoji.y = Math.max(10, Math.min(270, initialY + dy));

            applyEmojiStyle(emoji);
        }

        function onEnd() {
            isDragging = false;
            window.removeEventListener('mousemove', onMove);
            window.removeEventListener('mouseup', onEnd);
            window.removeEventListener('touchmove', onMove);
            window.removeEventListener('touchend', onEnd);
        }

        el.addEventListener('mousedown', onStart);
        el.addEventListener('touchstart', onStart, { passive: false });
    }

    // 현재 선택 이모지 삭제
    function deleteActiveEmoji() {
        if (!activeEmojiId) return;
        const idx = placedEmojis.findIndex(item => item.id === activeEmojiId);
        if (idx !== -1) {
            placedEmojis[idx].el.remove();
            placedEmojis.splice(idx, 1);
            selectEmoji(null);
            updateEmojiCount();
        }
    }

    // 이모지 전체 초기화
    function clearAllEmojis() {
        placedEmojis.forEach(item => item.el.remove());
        placedEmojis = [];
        selectEmoji(null);
        updateEmojiCount();
    }

    function updateEmojiCount() {
        if (emojiCountBadge) {
            emojiCountBadge.textContent = `${placedEmojis.length} / 5`;
        }
    }

    // 4. 스티커 제출 및 메인화면 물리 캔버스 연동
    function handleStickerSubmit() {
        // offscreen canvas에 baseFace + placedEmojis 합성
        const canvas = document.createElement('canvas');
        const size = 300;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');

        const baseImg = new Image();
        baseImg.crossOrigin = 'anonymous';
        baseImg.src = `./unit/face/face_${currentFaceId}.png`;

        baseImg.onload = function () {
            // 1. 얼굴 베이스 그리기
            ctx.drawImage(baseImg, 0, 0, size, size);

            // 2. 이모지 레이어 순차 그리기
            let loadedCount = 0;
            if (placedEmojis.length === 0) {
                exportAndSpawnSticker(canvas);
                return;
            }

            placedEmojis.forEach(emoji => {
                const img = new Image();
                img.crossOrigin = 'anonymous';
                img.src = emoji.src;
                img.onload = function () {
                    ctx.save();
                    // stage 280px -> canvas 300px 스케일비율 (300 / 280 = 1.071)
                    const scaleFactor = size / 280;
                    const cx = emoji.x * scaleFactor;
                    const cy = emoji.y * scaleFactor;

                    ctx.translate(cx, cy);
                    ctx.rotate((emoji.rotation * Math.PI) / 180);

                    // 이모지 기본 크기 ~65px
                    const emojiDrawW = 65 * emoji.scale * scaleFactor;
                    const emojiDrawH = 65 * emoji.scale * scaleFactor;

                    ctx.drawImage(img, -emojiDrawW / 2, -emojiDrawH / 2, emojiDrawW, emojiDrawH);
                    ctx.restore();

                    loadedCount++;
                    if (loadedCount === placedEmojis.length) {
                        exportAndSpawnSticker(canvas);
                    }
                };
                img.onerror = function () {
                    loadedCount++;
                    if (loadedCount === placedEmojis.length) {
                        exportAndSpawnSticker(canvas);
                    }
                };
            });
        };
    }

    // 최종 스티커 DataURL 생성 후 저장 및 2D 물리 블록 떨어뜨리기
    function exportAndSpawnSticker(canvas) {
        const dataUrl = canvas.toDataURL('image/png');

        // 1. localStorage에 커스텀 스티커 저장
        const savedStickers = JSON.parse(localStorage.getItem('gsdd_custom_stickers') || '[]');
        savedStickers.push(dataUrl);
        localStorage.setItem('gsdd_custom_stickers', JSON.stringify(savedStickers));

        // 2. 메인 물리 엔진(main.js)에 새 블록 투하 트리거
        if (window.spawnCustomStickerBlock) {
            window.spawnCustomStickerBlock(dataUrl);
        }

        // 3. 모달 닫기 & 축하 메시지
        closeStickerModal();

        // 4. 입력 폼 초기화
        clearAllEmojis();

        // 토스트 알림 생성
        showToastNotification('🎉 나만의 스티커 방명록이 메인화면에 추가되었습니다!');
    }

    function showToastNotification(msg) {
        const toast = document.createElement('div');
        toast.className = 'sticker-toast-notification';
        toast.textContent = msg;
        document.body.appendChild(toast);

        requestAnimationFrame(() => {
            toast.classList.add('show');
        });

        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 400);
        }, 3200);
    }
})();
