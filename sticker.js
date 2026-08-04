/**
 * GSDD 2026 - 커스텀 스티커 방명록 생성기 (Sticker Creator Engine)
 * - face_1 ~ face_12 얼굴 템플릿 선택
 * - Emoji_1 ~ Emoji_5 이모지 요소 (최대 5개)
 * - 포토샵 Free Transform (Ctrl + T) 인터랙티브 핸들 (드래그, 회전, 크기조율, 삭제)
 * - 얼굴 베이스 및 개별 이모지 요소 독립 색상 필터링 (흑백/옐로우/레드/블루/그린/오리지널)
 * - 합성 후 Matter.js 2D 물리 엔진에 실시간 생성 및 localStorage 보관
 */

(function () {
    let currentFaceId = 1;          // 기본 face_1
    let baseFaceColorFilter = 'mono'; // 얼굴 베이스 색상 필터 (기본 흑백)
    let placedEmojis = [];           // { id, srcId, x, y, scale, rotation, colorFilter, el }
    let activeEmojiId = null;        // 현재 선택된 이모지 ID (null이면 얼굴 베이스가 색상 대상)
    let emojiIdCounter = 1;

    const filterCSSMap = {
        'mono': 'grayscale(100%) contrast(1.15)',
        'yellow': 'grayscale(100%) sepia(100%) hue-rotate(5deg) saturate(600%)',
        'red': 'grayscale(100%) sepia(100%) hue-rotate(310deg) saturate(700%)',
        'blue': 'grayscale(100%) sepia(100%) hue-rotate(170deg) saturate(600%)',
        'green': 'grayscale(100%) sepia(100%) hue-rotate(85deg) saturate(600%)',
        'original': 'none'
    };

    // DOM 요소 캐시
    let modalOverlay, createBtn, closeBtn, cancelBtn, addBtn;
    let facePickerGrid, emojiPickerGrid, emojiCountBadge;
    let baseFaceImg, emojiLayer, activeItemTools, activeItemName, colorTargetName;
    let scaleSlider, rotateSlider, deleteBtn, clearAllBtn, colorPalette;

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

        colorTargetName = document.getElementById('color-target-name');
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
        if (addBtn) addBtn.addEventListener('click', handleStickerSubmit);

        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) closeStickerModal();
        });

        // 1. 얼굴 피커 동적 생성 (face_1 ~ face_12)
        renderFacePicker();

        // 2. 이모지 피커 동적 생성 (Emoji_1 ~ Emoji_5, 6 제거)
        renderEmojiPicker();

        // 3. 색상 필터 스와치 바인딩 (개별 얼굴/이모지 독립 조절)
        colorPalette = document.getElementById('color-picker-palette');
        if (colorPalette) {
            colorPalette.querySelectorAll('.color-box-btn, .color-swatch-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const chosenColor = btn.dataset.color || 'mono';
                    applyColorToSelectedTarget(chosenColor);
                });
            });
        }

        // 초기 얼굴 베이스 흑백 적용
        updateTargetColorPaletteUI();

        // 4. 이모지 조작 컨트롤 바인딩
        if (scaleSlider) scaleSlider.addEventListener('input', updateActiveEmojiTransformFromSliders);
        if (rotateSlider) rotateSlider.addEventListener('input', updateActiveEmojiTransformFromSliders);
        if (deleteBtn) deleteBtn.addEventListener('click', deleteActiveEmoji);
        if (clearAllBtn) clearAllBtn.addEventListener('click', clearAllEmojis);

        // 6. 가로 피커 좌우 이동 슬라이더 동기화 바인딩 (요청사항)
        bindScrollSliderSync(facePickerGrid, document.getElementById('face-picker-scroll-range'));
        bindScrollSliderSync(emojiPickerGrid, document.getElementById('emoji-picker-scroll-range'));

        // 7. 개발자 전용 스티커 관리 모드 트리거 및 관리자 모달 바인딩 (요청사항)
        const manageStickersBtn = document.getElementById('manage-stickers-btn');
        const managerOverlay = document.getElementById('sticker-manager-overlay');
        const managerCloseBtn = document.getElementById('sticker-manager-close');
        const managerClearAllBtn = document.getElementById('manager-clear-all-btn');

        // 전역/콘솔 개발자 트리거 함수 (window.enableDevMode())
        window.enableDevMode = function () {
            if (manageStickersBtn) {
                manageStickersBtn.style.display = 'inline-flex';
                showToastNotification('개발자 관리 모드가 활성화되었습니다.');
            }
        };

        // 비밀 키워드 전용 연속 타이핑 트리거 ('dev' 타이핑만 허용) (요청사항)
        let keySequence = '';
        window.addEventListener('keydown', (e) => {
            const activeTag = document.activeElement ? document.activeElement.tagName.toLowerCase() : '';
            if (activeTag === 'input' || activeTag === 'textarea') return;

            keySequence += e.key.toLowerCase();
            if (keySequence.length > 5) keySequence = keySequence.slice(-5);
            if (keySequence.endsWith('dev')) {
                window.enableDevMode();
                keySequence = '';
            }
        });

        // 스티커 관리 모달 오픈/클로즈
        if (manageStickersBtn) {
            manageStickersBtn.addEventListener('click', () => {
                renderStickerManagerGrid();
                if (managerOverlay) managerOverlay.classList.add('active');
                document.body.style.overflow = 'hidden';
            });
        }

        if (managerCloseBtn) {
            managerCloseBtn.addEventListener('click', () => {
                if (managerOverlay) managerOverlay.classList.remove('active');
                document.body.style.overflow = 'auto';
            });
        }

        if (managerOverlay) {
            managerOverlay.addEventListener('click', (e) => {
                if (e.target === managerOverlay) {
                    managerOverlay.classList.remove('active');
                    document.body.style.overflow = 'auto';
                }
            });
        }

        if (managerClearAllBtn) {
            managerClearAllBtn.addEventListener('click', () => {
                if (confirm('메인 화면에 추가된 모든 커스텀 방명록 스티커를 전체 삭제하시겠습니까?')) {
                    if (window.removeAllCustomStickerBlocks) {
                        window.removeAllCustomStickerBlocks();
                    }
                    renderStickerManagerGrid();
                    showToastNotification('모든 스티커가 삭제되었습니다.');
                }
            });
        }

        // 스테이지 바탕 클릭 시 이모지 선택 해제 (얼굴 베이스 선택 상태로 전환)
        emojiLayer.addEventListener('click', (e) => {
            if (e.target === emojiLayer) {
                selectEmoji(null);
            }
        });

        // 얼굴 이미지 클릭 시 얼굴 베이스 선택
        baseFaceImg.addEventListener('click', () => {
            selectEmoji(null);
        });
    }

    function openStickerModal() {
        modalOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
        if (baseFaceImg) {
            baseFaceImg.style.filter = filterCSSMap[baseFaceColorFilter || 'mono'];
        }
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

    // 2. 이모지 선택 그리드 생성 (Emoji_6 제거 -> Emoji_1 ~ Emoji_5만 노출)
    function renderEmojiPicker() {
        if (!emojiPickerGrid) return;
        emojiPickerGrid.innerHTML = '';

        const emojiList = [1, 2, 3, 4, 5]; // Emoji_6 제거 (요청사항)

        emojiList.forEach(num => {
            const thumb = document.createElement('div');
            thumb.className = 'emoji-thumb-item';
            thumb.innerHTML = `<img src="./unit/face/Emoji_${num}.png" alt="Emoji_${num}" />`;
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

        const stageW = (emojiLayer && emojiLayer.offsetWidth) ? emojiLayer.offsetWidth : 340;
        const stageH = (emojiLayer && emojiLayer.offsetHeight) ? emojiLayer.offsetHeight : 340;

        const id = emojiIdCounter++;
        const emojiData = {
            id: id,
            srcId: emojiNum,
            src: `./unit/face/Emoji_${emojiNum}.png`,
            x: stageW / 2, // 미리보기 스테이지 100% 정확한 중앙 위치 (요청사항)
            y: stageH / 2,
            scale: 1.0,
            rotation: 0,
            colorFilter: 'mono' // 기본 흑백 (Monochrome)
        };

        // 프레임 구조 생성: 좌측상단 십자화살표(크기), 상단중앙 빨간X(삭제), 우측상단 파란(회전)
        const itemEl = document.createElement('div');
        itemEl.className = 'stage-emoji-item';
        itemEl.id = `stage-emoji-${id}`;
        itemEl.innerHTML = `
            <img src="${emojiData.src}" draggable="false" />
            <div class="ps-transform-frame">
                <!-- 좌측 상단: 십자가 화살표 크기 조율 (흰색 배경) -->
                <div class="ps-handle ps-handle-tl ps-scale-btn" title="드래그하여 크기 조율">
                    <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="#333" stroke-width="2.2" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/><polyline points="9,8 12,5 15,8"/><polyline points="9,16 12,19 15,16"/><polyline points="8,9 5,12 8,15"/><polyline points="16,9 19,12 16,15"/></svg>
                </div>
                <!-- 상단 중앙: 빨간 X 삭제 -->
                <div class="ps-handle ps-handle-tc ps-delete-btn" title="이모지 삭제">&times;</div>
                <!-- 우측 상단: 파란 회전 전용 -->
                <div class="ps-handle ps-handle-tr ps-rotate-btn" title="드래그하여 회전">
                    <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38"/></svg>
                </div>
            </div>
        `;

        emojiLayer.appendChild(itemEl);
        emojiData.el = itemEl;
        placedEmojis.push(emojiData);

        // 인터랙션 핸들 바인딩
        setupPhotoshopTransformHandles(emojiData);
        selectEmoji(id);
        updateEmojiCount();
    }

    // 이모지 선택 및 UI 상태 업데이트
    function selectEmoji(id) {
        activeEmojiId = id;
        document.querySelectorAll('.stage-emoji-item').forEach(el => el.classList.remove('active'));

        if (id === null) {
            // 얼굴 베이스 선택 상태
            if (activeItemTools) {
                activeItemTools.style.opacity = '0.5';
                activeItemTools.style.pointerEvents = 'none';
            }
            if (activeItemName) activeItemName.textContent = '얼굴 베이스';
            if (colorTargetName) colorTargetName.textContent = '얼굴 베이스';
            updateTargetColorPaletteUI();
            return;
        }

        const emoji = placedEmojis.find(item => item.id === id);
        if (!emoji) return;

        emoji.el.classList.add('active');
        if (activeItemTools) {
            activeItemTools.style.opacity = '1';
            activeItemTools.style.pointerEvents = 'auto';
        }
        if (activeItemName) activeItemName.textContent = `Emoji_${emoji.srcId} (#${emoji.id})`;
        if (colorTargetName) colorTargetName.textContent = `Emoji_${emoji.srcId}`;

        if (scaleSlider) scaleSlider.value = emoji.scale;
        if (rotateSlider) rotateSlider.value = emoji.rotation;

        updateTargetColorPaletteUI();
    }

    // 선택된 타겟(얼굴 베이스 또는 개별 이모지)에 색상 필터 적용
    function applyColorToSelectedTarget(chosenColor) {
        if (activeEmojiId === null) {
            // 1. 얼굴 베이스 색상 변경
            baseFaceColorFilter = chosenColor;
            baseFaceImg.style.filter = filterCSSMap[chosenColor] || 'none';
        } else {
            // 2. 선택된 이모지 색상 변경
            const emoji = placedEmojis.find(item => item.id === activeEmojiId);
            if (emoji) {
                emoji.colorFilter = chosenColor;
                applyEmojiStyle(emoji);
            }
        }
        updateTargetColorPaletteUI();
    }

    // 팔레트 버튼 UI의 selected 상태 업데이트
    function updateTargetColorPaletteUI() {
        if (!colorPalette) return;
        const currentSelectedColor = (activeEmojiId === null) ? baseFaceColorFilter : (placedEmojis.find(e => e.id === activeEmojiId)?.colorFilter || 'mono');

        colorPalette.querySelectorAll('.color-box-btn, .color-swatch-btn').forEach(btn => {
            if (btn.dataset.color === currentSelectedColor) {
                btn.classList.add('selected');
            } else {
                btn.classList.remove('selected');
            }
        });
    }

    function applyEmojiStyle(emoji) {
        emoji.el.style.left = `${emoji.x}px`;
        emoji.el.style.top = `${emoji.y}px`;
        emoji.el.style.transform = `translate(-50%, -50%) rotate(${emoji.rotation}deg) scale(${emoji.scale})`;

        const imgEl = emoji.el.querySelector('img');
        if (imgEl) {
            imgEl.style.filter = filterCSSMap[emoji.colorFilter || 'mono'];
        }
    }

    // 슬라이더 변경 시 조작
    function updateActiveEmojiTransformFromSliders() {
        if (!activeEmojiId) return;
        const emoji = placedEmojis.find(item => item.id === activeEmojiId);
        if (!emoji) return;

        emoji.scale = parseFloat(scaleSlider.value);
        emoji.rotation = parseInt(rotateSlider.value);

        applyEmojiStyle(emoji);
    }

    // 핸들 분리: 바디 드래그(이동), 좌상단(크기전용), 상중단(삭제), 우상단(회전전용)
    function setupPhotoshopTransformHandles(emoji) {
        const el = emoji.el;
        const deleteHandle = el.querySelector('.ps-delete-btn');
        const rotateHandle = el.querySelector('.ps-rotate-btn');
        const scaleHandle = el.querySelector('.ps-scale-btn');

        applyEmojiStyle(emoji);

        // 1. 바디 드래그 이동
        let isDragging = false;
        let startX, startY, initialX, initialY;

        function onBodyStart(e) {
            if (e.target.classList.contains('ps-handle')) return;
            e.stopPropagation();
            selectEmoji(emoji.id);
            isDragging = true;
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;
            startX = clientX; startY = clientY;
            initialX = emoji.x; initialY = emoji.y;
            window.addEventListener('mousemove', onBodyMove);
            window.addEventListener('mouseup', onBodyEnd);
            window.addEventListener('touchmove', onBodyMove, { passive: false });
            window.addEventListener('touchend', onBodyEnd);
        }
        function onBodyMove(e) {
            if (!isDragging) return;
            if (e.cancelable) e.preventDefault();
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;
            emoji.x = Math.max(10, Math.min(330, initialX + (clientX - startX)));
            emoji.y = Math.max(10, Math.min(330, initialY + (clientY - startY)));
            applyEmojiStyle(emoji);
        }
        function onBodyEnd() {
            isDragging = false;
            window.removeEventListener('mousemove', onBodyMove);
            window.removeEventListener('mouseup', onBodyEnd);
            window.removeEventListener('touchmove', onBodyMove);
            window.removeEventListener('touchend', onBodyEnd);
        }
        el.addEventListener('mousedown', onBodyStart);
        el.addEventListener('touchstart', onBodyStart, { passive: false });

        // 2. 상단 중앙 빨간 X — 삭제
        if (deleteHandle) {
            deleteHandle.addEventListener('click', (e) => {
                e.stopPropagation();
                selectEmoji(emoji.id);
                deleteActiveEmoji();
            });
        }

        // 3. 우측 상단 파란 — 회전 전용 드래그
        if (rotateHandle) {
            let isRotating = false;
            let startAngle, startRotation;
            function onRotateStart(e) {
                e.stopPropagation();
                selectEmoji(emoji.id);
                isRotating = true;
                const clientX = e.touches ? e.touches[0].clientX : e.clientX;
                const clientY = e.touches ? e.touches[0].clientY : e.clientY;
                const stageRect = emojiLayer.getBoundingClientRect();
                const cx = stageRect.left + emoji.x;
                const cy = stageRect.top + emoji.y;
                startAngle = Math.atan2(clientY - cy, clientX - cx) * (180 / Math.PI);
                startRotation = emoji.rotation;
                window.addEventListener('mousemove', onRotateMove);
                window.addEventListener('mouseup', onRotateEnd);
                window.addEventListener('touchmove', onRotateMove, { passive: false });
                window.addEventListener('touchend', onRotateEnd);
            }
            function onRotateMove(e) {
                if (!isRotating) return;
                if (e.cancelable) e.preventDefault();
                const clientX = e.touches ? e.touches[0].clientX : e.clientX;
                const clientY = e.touches ? e.touches[0].clientY : e.clientY;
                const stageRect = emojiLayer.getBoundingClientRect();
                const cx = stageRect.left + emoji.x;
                const cy = stageRect.top + emoji.y;
                const currentAngle = Math.atan2(clientY - cy, clientX - cx) * (180 / Math.PI);
                emoji.rotation = (startRotation + (currentAngle - startAngle) + 360) % 360;
                applyEmojiStyle(emoji);
            }
            function onRotateEnd() {
                isRotating = false;
                window.removeEventListener('mousemove', onRotateMove);
                window.removeEventListener('mouseup', onRotateEnd);
                window.removeEventListener('touchmove', onRotateMove);
                window.removeEventListener('touchend', onRotateEnd);
            }
            rotateHandle.addEventListener('mousedown', onRotateStart);
            rotateHandle.addEventListener('touchstart', onRotateStart, { passive: false });
        }

        // 4. 좌측 상단 흰색 십자 화살표 — 크기 전용 드래그
        if (scaleHandle) {
            let isScaling = false;
            let startDist, startScale;
            function onScaleStart(e) {
                e.stopPropagation();
                selectEmoji(emoji.id);
                isScaling = true;
                const clientX = e.touches ? e.touches[0].clientX : e.clientX;
                const clientY = e.touches ? e.touches[0].clientY : e.clientY;
                const stageRect = emojiLayer.getBoundingClientRect();
                const cx = stageRect.left + emoji.x;
                const cy = stageRect.top + emoji.y;
                startDist = Math.hypot(clientX - cx, clientY - cy);
                startScale = emoji.scale;
                window.addEventListener('mousemove', onScaleMove);
                window.addEventListener('mouseup', onScaleEnd);
                window.addEventListener('touchmove', onScaleMove, { passive: false });
                window.addEventListener('touchend', onScaleEnd);
            }
            function onScaleMove(e) {
                if (!isScaling) return;
                if (e.cancelable) e.preventDefault();
                const clientX = e.touches ? e.touches[0].clientX : e.clientX;
                const clientY = e.touches ? e.touches[0].clientY : e.clientY;
                const stageRect = emojiLayer.getBoundingClientRect();
                const cx = stageRect.left + emoji.x;
                const cy = stageRect.top + emoji.y;
                const dist = Math.hypot(clientX - cx, clientY - cy);
                emoji.scale = Math.max(0.3, Math.min(3.0, startScale * (dist / (startDist || 1))));
                applyEmojiStyle(emoji);
            }
            function onScaleEnd() {
                isScaling = false;
                window.removeEventListener('mousemove', onScaleMove);
                window.removeEventListener('mouseup', onScaleEnd);
                window.removeEventListener('touchmove', onScaleMove);
                window.removeEventListener('touchend', onScaleEnd);
            }
            scaleHandle.addEventListener('mousedown', onScaleStart);
            scaleHandle.addEventListener('touchstart', onScaleStart, { passive: false });
        }
    }

    // 선택된 이모지 삭제
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

    // 캔버스 이미지 aspect-ratio contain 그리기 헬퍼 (얼굴 찌그러짐 방지)
    function drawImageContain(ctx, img, targetX, targetY, targetWidth, targetHeight) {
        const imgRatio = img.width / img.height;
        const targetRatio = targetWidth / targetHeight;

        let drawW, drawH, drawX, drawY;

        if (imgRatio > targetRatio) {
            drawW = targetWidth;
            drawH = targetWidth / imgRatio;
            drawX = targetX;
            drawY = targetY + (targetHeight - drawH) / 2;
        } else {
            drawH = targetHeight;
            drawW = targetHeight * imgRatio;
            drawX = targetX + (targetWidth - drawW) / 2;
            drawY = targetY;
        }

        ctx.drawImage(img, drawX, drawY, drawW, drawH);
    }

    // 4. 스티커 제출 및 메인화면 물리 캔버스 연동
    function handleStickerSubmit() {
        const canvas = document.createElement('canvas');
        const size = 300;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');

        const baseImg = new Image();
        baseImg.src = `./unit/face/face_${currentFaceId}.png`;

        function drawAllAndExport() {
            try {
                // 1. 얼굴 베이스 aspect-ratio 유지 후 그리기 (찌그러짐 100% 방지)
                ctx.save();
                ctx.filter = filterCSSMap[baseFaceColorFilter] || 'none';
                drawImageContain(ctx, baseImg, 0, 0, size, size);
                ctx.restore();

                if (placedEmojis.length === 0) {
                    exportAndSpawnSticker(canvas);
                    return;
                }

                // 2. 이모지 레이어 합성 (비율 보존)
                let loadedCount = 0;
                placedEmojis.forEach(emoji => {
                    const img = new Image();
                    img.src = emoji.src;

                    function drawEmoji() {
                        try {
                            ctx.save();
                            const stageSize = (emojiLayer && emojiLayer.offsetWidth) ? emojiLayer.offsetWidth : 340;
                            const scaleFactor = size / stageSize;
                            const cx = emoji.x * scaleFactor;
                            const cy = emoji.y * scaleFactor;

                            ctx.translate(cx, cy);
                            ctx.rotate((emoji.rotation * Math.PI) / 180);

                            const baseEmojiSize = 65 * emoji.scale * scaleFactor;
                            const imgRatio = (img.width && img.height) ? (img.width / img.height) : 1;

                            let drawW = baseEmojiSize;
                            let drawH = baseEmojiSize;
                            if (imgRatio > 1) {
                                drawH = baseEmojiSize / imgRatio;
                            } else {
                                drawW = baseEmojiSize * imgRatio;
                            }

                            ctx.filter = filterCSSMap[emoji.colorFilter || 'mono'] || 'none';
                            ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
                            ctx.restore();
                        } catch (err) {
                            console.error(err);
                        }

                        loadedCount++;
                        if (loadedCount === placedEmojis.length) {
                            exportAndSpawnSticker(canvas);
                        }
                    }

                    if (img.complete) {
                        drawEmoji();
                    } else {
                        img.onload = drawEmoji;
                        img.onerror = drawEmoji;
                    }
                });
            } catch (err) {
                console.error(err);
                exportAndSpawnSticker(canvas);
            }
        }

        if (baseImg.complete) {
            drawAllAndExport();
        } else {
            baseImg.onload = drawAllAndExport;
            baseImg.onerror = drawAllAndExport;
        }
    }

    // 최종 스티커 DataURL 생성 후 저장 및 2D 물리 블록 떨어뜨리기
    function exportAndSpawnSticker(canvas) {
        const dataUrl = canvas.toDataURL('image/png');

        const savedStickers = JSON.parse(localStorage.getItem('gsdd_custom_stickers') || '[]');
        savedStickers.push(dataUrl);
        localStorage.setItem('gsdd_custom_stickers', JSON.stringify(savedStickers));

        if (window.spawnCustomStickerBlock) {
            window.spawnCustomStickerBlock(dataUrl);
        }

        closeStickerModal();
        clearAllEmojis();

        showToastNotification('나만의 스티커 방명록이 메인화면에 추가되었습니다.');
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

    // 가로 스크롤 슬라이더 바인딩 연동 함수 (요청사항)
    function bindScrollSliderSync(gridEl, sliderEl) {
        if (!gridEl || !sliderEl) return;

        sliderEl.addEventListener('input', () => {
            const maxScroll = gridEl.scrollWidth - gridEl.clientWidth;
            if (maxScroll > 0) {
                gridEl.scrollLeft = (sliderEl.value / 100) * maxScroll;
            }
        });

        gridEl.addEventListener('scroll', () => {
            const maxScroll = gridEl.scrollWidth - gridEl.clientWidth;
            if (maxScroll > 0) {
                sliderEl.value = Math.round((gridEl.scrollLeft / maxScroll) * 100);
            }
        });
    }

    // 개발자 스티커 목록 그리드 렌더링 (개별 삭제 기능 지원) (요청사항)
    function renderStickerManagerGrid() {
        const gridEl = document.getElementById('manager-sticker-grid');
        const countEl = document.getElementById('manager-sticker-count');
        if (!gridEl) return;

        const savedStickers = JSON.parse(localStorage.getItem('gsdd_custom_stickers') || '[]');
        if (countEl) countEl.textContent = `총 ${savedStickers.length}개의 스티커`;

        gridEl.innerHTML = '';
        if (savedStickers.length === 0) {
            gridEl.innerHTML = '<div class="manager-empty-state">현재 메인 화면에 생성된 방명록 스티커가 없습니다.</div>';
            return;
        }

        savedStickers.forEach((dataUrl, idx) => {
            const card = document.createElement('div');
            card.className = 'manager-sticker-card';
            card.innerHTML = `
                <div class="manager-card-thumb">
                    <img src="${dataUrl}" alt="Sticker #${idx + 1}" />
                </div>
                <div class="manager-card-info">
                    <span class="manager-card-num">스티커 #${idx + 1}</span>
                    <button type="button" class="manager-delete-single-btn" title="이 스티커만 삭제">삭제</button>
                </div>
            `;

            card.querySelector('.manager-delete-single-btn').addEventListener('click', () => {
                if (window.removeSingleCustomStickerBlock) {
                    window.removeSingleCustomStickerBlock(dataUrl);
                }
                renderStickerManagerGrid();
                showToastNotification(`스티커 #${idx + 1}이(가) 삭제되었습니다.`);
            });

            gridEl.appendChild(card);
        });
    }
})();
