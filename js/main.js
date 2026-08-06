// 메인 스크립트 모듈 (2D 물리엔진 중력 유닛 블록 낙하, 스크롤 리빌 애니메이션, 모바일 햄버거 메뉴 및 About 이동)
document.addEventListener('DOMContentLoaded', () => {

    // ========================================================
    // 0. 마우스 포인터 유닛 이미지 변경 & 클릭 시 1~12번 유닛 순차 변경 (요청사항)
    // ========================================================
    function initCustomUnitCursor() {
        // 모바일 기기(<= 768px 또는 터치 디바이스)에서는 커서 잔상 완전 비활성화 (요청사항)
        if (window.innerWidth <= 768 || ('ontouchstart' in window && window.navigator.maxTouchPoints > 0)) {
            const existingCursor = document.getElementById('custom-unit-cursor');
            if (existingCursor) existingCursor.style.display = 'none';
            return;
        }

        let cursor = document.getElementById('custom-unit-cursor');
        if (!cursor) {
            cursor = document.createElement('div');
            cursor.id = 'custom-unit-cursor';
            cursor.innerHTML = `<img id="custom-cursor-img" src="" alt="cursor" />`;
            document.body.appendChild(cursor);
        }

        const cursorImg = document.getElementById('custom-cursor-img');
        let currentUnit = 1;

        function getUnitPath(unitNum) {
            const isSubfolder = window.location.pathname.includes('/gallery/') || window.location.pathname.includes('/about/');
            return (isSubfolder ? '../unit/unit_' : './unit/unit_') + unitNum + '.png';
        }

        if (cursorImg) {
            cursorImg.src = getUnitPath(currentUnit);
        }

        window.addEventListener('mousemove', (e) => {
            cursor.style.left = `${e.clientX}px`;
            cursor.style.top = `${e.clientY}px`;
            
            // 영상 플레이어(유튜브 iframe) 영역 위에 커서가 올라간 경우 커스텀 커서를 숨기고 표준 포인터 허용
            const videoElem = document.querySelector('.main-video-section');
            if (videoElem) {
                const rect = videoElem.getBoundingClientRect();
                if (e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom) {
                    cursor.style.opacity = '0';
                    return;
                }
            }

            if (cursor.style.opacity !== '1') {
                cursor.style.opacity = '1';
            }
        });

        document.addEventListener('mouseleave', () => {
            cursor.style.opacity = '0';
        });

        window.addEventListener('click', () => {
            currentUnit = (currentUnit % 12) + 1; // 1 ~ 12 번 유닛 순환 (1 -> 2 -> ... -> 12 -> 1)
            if (cursorImg) {
                cursorImg.src = getUnitPath(currentUnit);
            }

            cursor.classList.add('cursor-click-pop');
            setTimeout(() => {
                cursor.classList.remove('cursor-click-pop');
            }, 150);
        });
    }

    initCustomUnitCursor();

    // ========================================================
    // 1. Matter.js 2D 물리 엔진 중력 블록 스태킹 (SNU Design Week 방식)
    // ========================================================
    function initPhysicsHero() {
        const canvas = document.getElementById('physics-canvas');
        const heroSection = document.getElementById('hero-section');

        // Matter.js 라이브러리 및 요소 존재 여부 검증
        if (!canvas || !heroSection || typeof Matter === 'undefined') return;

        const Engine = Matter.Engine,
              Render = Matter.Render,
              Runner = Matter.Runner,
              Bodies = Matter.Bodies,
              Composite = Matter.Composite,
              Mouse = Matter.Mouse,
              MouseConstraint = Matter.MouseConstraint;

        const width = heroSection.clientWidth || window.innerWidth;
        const height = heroSection.clientHeight || window.innerHeight;

        // 물리 엔진 인스턴스 생성 (중력 1.1)
        const engine = Engine.create({
            gravity: { x: 0, y: 1.1 }
        });

        // 캔버스 렌더러 설정 (High DPI pixelRatio 지원으로 화질 선명도 최적화)
        const render = Render.create({
            canvas: canvas,
            engine: engine,
            options: {
                width: width,
                height: height,
                pixelRatio: Math.min(window.devicePixelRatio || 1, 2),
                background: '#ffffff', // 흰색 빈 화면 바탕
                wireframes: false,
                showAngleIndicator: false
            }
        });

        Render.run(render);
        const runner = Runner.create();
        Runner.run(runner, engine);

        // 바닥 및 좌우 벽 무한 경계 생성 (투명 바운더리)
        const wallOptions = { isStatic: true, render: { visible: false } };
        const ground = Bodies.rectangle(width / 2, height + 40, width * 2, 80, wallOptions);
        const leftWall = Bodies.rectangle(-40, height / 2, 80, height * 2, wallOptions);
        const rightWall = Bodies.rectangle(width + 40, height / 2, 80, height * 2, wallOptions);

        Composite.add(engine.world, [ground, leftWall, rightWall]);

        // 우측 하단 방명록 스티커 만들기 버튼 고정 충돌 바운더리 바디 추가 (유닛이 부딪히도록 설정)
        const createStickerBtnEl = document.getElementById('create-sticker-btn');
        let stickerBtnBody = null;

        function updateStickerBtnPhysicsBody() {
            if (!createStickerBtnEl || !heroSection) return;
            const rect = createStickerBtnEl.getBoundingClientRect();
            const heroRect = heroSection.getBoundingClientRect();

            if (rect.width === 0 || rect.height === 0) return;

            const btnWidth = rect.width;
            const btnHeight = rect.height;
            const btnX = (rect.left - heroRect.left) + (btnWidth / 2);
            const btnY = (rect.top - heroRect.top) + (btnHeight / 2);

            if (!stickerBtnBody) {
                stickerBtnBody = Bodies.rectangle(btnX, btnY, btnWidth, btnHeight, {
                    isStatic: true,
                    render: { visible: false }
                });
                Composite.add(engine.world, stickerBtnBody);
            } else {
                Matter.Body.setPosition(stickerBtnBody, { x: btnX, y: btnY });
            }
        }

        setTimeout(updateStickerBtnPhysicsBody, 150);
        setTimeout(updateStickerBtnPhysicsBody, 600);

        // 마우스 드래그 / 던지기 인터랙션 추가 (stiffness 0.02 및 damping 부여로 충돌 시 튕김 완벽 완화)
        const mouse = Mouse.create(render.canvas);
        const mouseConstraint = MouseConstraint.create(engine, {
            mouse: mouse,
            constraint: {
                stiffness: 0.02,
                damping: 0.1,
                render: { visible: false }
            }
        });

        Composite.add(engine.world, mouseConstraint);
        render.mouse = mouse;

        // Matter.js 캔버스 휠 & 모바일 터치 스크롤 차단 해제 (요청사항)
        if (mouse.element) {
            mouse.element.removeEventListener('mousewheel', mouse.mousewheel);
            mouse.element.removeEventListener('DOMMouseScroll', mouse.mousewheel);
            mouse.element.removeEventListener('wheel', mouse.mousewheel);

            // 모바일 환경 유닛이 없는 빈 흰색 공간 터치 스크롤 100% 허용 (요청사항)
            let isHoldingBlock = false;

            mouse.element.removeEventListener('touchmove', mouse.touchmove);
            mouse.element.removeEventListener('touchstart', mouse.touchstart);
            mouse.element.removeEventListener('touchend', mouse.touchend);

            mouse.element.addEventListener('touchstart', (e) => {
                const touch = e.touches && e.touches[0];
                if (!touch) return;

                const rect = canvas.getBoundingClientRect();
                const touchPoint = { 
                    x: touch.clientX - rect.left, 
                    y: touch.clientY - rect.top 
                };

                const bodies = Composite.allBodies(engine.world).filter(b => !b.isStatic);
                const hitBody = Matter.Query.point(bodies, touchPoint)[0];

                if (hitBody) {
                    isHoldingBlock = true;
                    mouse.touchstart(e);
                } else {
                    isHoldingBlock = false;
                    mouseConstraint.constraint.body = null;
                }
            }, { passive: true });

            mouse.element.addEventListener('touchmove', (e) => {
                if (isHoldingBlock && mouseConstraint.body) {
                    mouse.touchmove(e);
                    if (e.cancelable) e.preventDefault();
                } else {
                    isHoldingBlock = false;
                    mouseConstraint.constraint.body = null;
                }
            }, { passive: true });

            mouse.element.addEventListener('touchend', (e) => {
                isHoldingBlock = false;
                mouse.touchend(e);
            }, { passive: true });
        }

        // 캔버스 영역 위에서 휠 조작 시 메인 페이지 스크롤이 자연스럽게 내려가도록 전달
        canvas.addEventListener('wheel', (e) => {
            window.scrollBy({
                top: e.deltaY,
                behavior: 'auto'
            });
        }, { passive: true });

        // unit_1.png ~ unit_18.png 로드
        const unitFiles = [];
        for (let i = 1; i <= 18; i++) {
            unitFiles.push(`./unit/unit_${i}.png`);
        }

        const loadedUnits = [];
        let loadedCount = 0;

        unitFiles.forEach((src, idx) => {
            const img = new Image();
            img.src = src;
            let isUnitsReady = false;
            let isDropTriggered = false;

            window.triggerDropSequence = function() {
                if (isDropTriggered) return;
                if (isUnitsReady) {
                    isDropTriggered = true;
                    startDroppingProcess();
                } else {
                    const checkInterval = setInterval(() => {
                        if (isUnitsReady) {
                            clearInterval(checkInterval);
                            if (!isDropTriggered) {
                                isDropTriggered = true;
                                startDroppingProcess();
                            }
                        }
                    }, 50);
                }
            };

            img.onload = () => {
                loadedUnits[idx] = {
                    src: src,
                    w: img.naturalWidth || 140,
                    h: img.naturalHeight || 140
                };
                loadedCount++;
                if (loadedCount === unitFiles.length) {
                    isUnitsReady = true;
                }
            };
            img.onerror = () => {
                loadedUnits[idx] = {
                    src: src,
                    w: 140,
                    h: 140
                };
                loadedCount++;
                if (loadedCount === unitFiles.length) {
                    isUnitsReady = true;
                }
            };
        });

        // 1번부터 18번까지 전체 18개 유닛이 각각 정확히 1개씩만 떨어지도록 셔플 큐 생성 함수
        function generateAllUnitsOnceQueue(totalUnitsCount) {
            const queue = [];
            for (let i = 0; i < totalUnitsCount; i++) {
                queue.push(i); // 0 ~ 17 (unit_1 ~ unit_18 각각 1회)
            }

            // 낙하 순서만 무작위 믹스 (Fisher-Yates Shuffle)
            for (let i = queue.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [queue[i], queue[j]] = [queue[j], queue[i]];
            }

            return queue;
        }

        // 지정된 유닛 인덱스로 블록 떨어뜨리는 함수 (50% ~ 100% 무작위 크기 랜덤성 유지)
        function spawnSingleBlock(unitIdx) {
            if (loadedUnits.length === 0) return;
            const unit = loadedUnits[unitIdx !== undefined ? unitIdx : Math.floor(Math.random() * loadedUnits.length)];
            if (!unit) return;

            // 50% ~ 100% 무작위 크기 스케일 비율 생성 (0.5 ~ 1.0)
            const randomScaleRatio = 0.5 + (Math.random() * 0.5);
            // 모바일 화면(<= 768px) 폭에 맞춘 최적 유닛 크기 조율 (0.32)
            const baseScale = (window.innerWidth <= 768) ? 0.32 : 0.65;
            
            // 유닛 1~12번 (인덱스 0~11) 크기 비율 +25% 확대 연동 (요청사항)
            const unitMultiplier = (unitIdx !== undefined && unitIdx < 12) ? 1.25 : 1.0;
            const finalSpriteScale = baseScale * randomScaleRatio * unitMultiplier;

            const bodyW = unit.w * finalSpriteScale;
            const bodyH = unit.h * finalSpriteScale;

            // 히트박스(충돌 박스) 크기 95% (0.95 비율) 적용
            const hitboxW = bodyW * 0.95;
            const hitboxH = bodyH * 0.95;

            // 화면 상단 15% ~ 85% 위치 시작점 (화면 맨 위 밖에서 자연스럽게 낙하)
            const minX = width * 0.15;
            const maxX = width * 0.85;
            const spawnX = minX + Math.random() * (maxX - minX);
            const spawnY = -120 - (Math.random() * 60);

            const block = Bodies.rectangle(spawnX, spawnY, hitboxW, hitboxH, {
                chamfer: { radius: Math.min(hitboxW, hitboxH) * 0.18 }, // 모서리 곡면화로 직사각형 공중 뜸 현상 방지
                restitution: 0.01, // 충돌 반발력 거의 0으로 낮추어 튕김 완벽 제거
                friction: 0.95,    // 묵직하고 안정감 있게 닿도록 마찰 상향
                frictionAir: 0.03, // 드래그/밀어낼 때 멀리 팍 튕겨나가지 않고 부드럽게 감속
                density: 0.003,
                angle: (Math.random() - 0.5) * 0.5,
                render: {
                    sprite: {
                        texture: unit.src,
                        xScale: finalSpriteScale,
                        yScale: finalSpriteScale
                    }
                }
            });

            // 살짝 기울어지며 회전하며 떨어지도록 초기 회전속도 부여
            Matter.Body.setAngularVelocity(block, (Math.random() - 0.5) * 0.06);
            Composite.add(engine.world, block);
        }

        // ========================================================
        // 스티커 방명록 생성기 커스텀 블록 투하 전역 함수 (요청사항)
        // ========================================================
        window.spawnCustomStickerBlock = function (imgDataUrl) {
            const baseScale = (window.innerWidth <= 768) ? 0.42 : 0.68;
            const size = 180 * baseScale;
            const spawnX = (width * 0.2) + Math.random() * (width * 0.6);
            const spawnY = -100 - Math.random() * 40;

            const block = Bodies.rectangle(spawnX, spawnY, size * 0.95, size * 0.95, {
                chamfer: { radius: size * 0.15 },
                restitution: 0.01,
                friction: 0.95,
                frictionAir: 0.03,
                density: 0.003,
                angle: (Math.random() - 0.5) * 0.6,
                render: {
                    sprite: {
                        texture: imgDataUrl,
                        xScale: size / 300,
                        yScale: size / 300
                    }
                }
            });

            block.isCustomSticker = true; // 사용자 방명록 커스텀 스티커 플래그
            block.customStickerDataUrl = imgDataUrl;

            Matter.Body.setAngularVelocity(block, (Math.random() - 0.5) * 0.08);
            Composite.add(engine.world, block);
        };

        // 메인 화면 개별 커스텀 스티커 삭제 전역 함수 (요청사항)
        window.removeSingleCustomStickerBlock = function (targetDataUrl) {
            const savedStickers = JSON.parse(localStorage.getItem('gsdd_custom_stickers') || '[]');
            const updatedStickers = savedStickers.filter(url => url !== targetDataUrl);
            localStorage.setItem('gsdd_custom_stickers', JSON.stringify(updatedStickers));

            const allBodies = Composite.allBodies(engine.world);
            const targetBody = allBodies.find(body => body.isCustomSticker && body.customStickerDataUrl === targetDataUrl);
            if (targetBody) {
                Composite.remove(engine.world, targetBody);
            }
        };

        // 메인 화면 커스텀 스티커 전체 삭제 및 초기화 전역 함수 (요청사항)
        window.removeAllCustomStickerBlocks = function () {
            localStorage.removeItem('gsdd_custom_stickers');
            const allBodies = Composite.allBodies(engine.world);
            allBodies.forEach(body => {
                if (body.isCustomSticker) {
                    Composite.remove(engine.world, body);
                }
            });
        };

        // 저장된 방문자 커스텀 스티커 불러오기 (무작위 랜덤 10개 선택해서 메인 화면에 투하)
        function loadSavedUserStickers() {
            try {
                const rawData = JSON.parse(localStorage.getItem('gsdd_custom_stickers') || '[]');
                if (!Array.isArray(rawData) || rawData.length === 0) return;

                // 스티커 객체 또는 DataUrl 추출
                const stickerUrls = rawData.map(item => (typeof item === 'object' && item !== null ? item.dataUrl : item)).filter(Boolean);

                // 무작위 셔플 (Fisher-Yates) 후 최대 10개 선택
                const shuffled = [...stickerUrls];
                for (let i = shuffled.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
                }
                const selected10Stickers = shuffled.slice(0, 10);

                selected10Stickers.forEach((dataUrl, idx) => {
                    setTimeout(() => {
                        window.spawnCustomStickerBlock(dataUrl);
                    }, 1200 + (idx * 280));
                });
            } catch (err) {
                console.error(err);
            }
        }

        // 이전 접속 기록 및 브라우저 뒤로가기(Back Button / BFCache) 검증 (요청사항)
        const isBackNavigation = sessionStorage.getItem('gsdd_hero_visited') === 'true';

        // 메인페이지 시작 및 메뉴바/구성 요소 표시 함수
        function revealMainPageContents() {
            document.body.classList.remove('loading-state');

            const fadeElements = document.querySelectorAll('.hero-fade-element');
            fadeElements.forEach(el => {
                el.classList.add('visible');
            });

            sessionStorage.setItem('gsdd_hero_visited', 'true');
        }

        // 뒤로가기로 방문한 경우 3초 대기 없이 즉시 메인 UI 노출
        if (isBackNavigation) {
            revealMainPageContents();
        }

        // BFCache (pageshow) 이벤트 바인딩으로 뒤로가기 시 딜레이 및 새로고침 완전 차단
        window.addEventListener('pageshow', (e) => {
            if (e.persisted || (window.performance && window.performance.getEntriesByType && window.performance.getEntriesByType('navigation')[0]?.type === 'back_forward')) {
                revealMainPageContents();
            }
        });

        // 블록 낙하 시퀀스 (160ms 간격으로 18개 유닛 각각 1개씩 순차 낙하)
        function startDroppingProcess() {
            const spawnQueue = generateAllUnitsOnceQueue(loadedUnits.length); // 18종 각각 1개씩
            let count = 0;

            const interval = setInterval(() => {
                if (count < spawnQueue.length) {
                    spawnSingleBlock(spawnQueue[count]);
                    count++;
                } else {
                    clearInterval(interval);
                }
            }, 160);

            // 18종 기본 유닛 낙하 후 저장된 사용자 방명록 스티커도 이어서 낙하
            setTimeout(() => {
                loadSavedUserStickers();
            }, 800);

            // 뒤로가기가 아닌 최초 접속 시에만 3초 후 페이드인 애니메이션 타이머 작동
            if (!isBackNavigation) {
                setTimeout(() => {
                    revealMainPageContents();
                }, 3000);
            }
        }

        // ========================================================
        // 창모드 브라우저 창 이동(Drag) 및 크기 조절(Resize) 시 관성 물리 반응 (요청사항)
        // ========================================================
        let lastScreenX = window.screenX || window.screenLeft || 0;
        let lastScreenY = window.screenY || window.screenTop || 0;
        let lastWidth = heroSection.clientWidth || window.innerWidth;
        let lastHeight = heroSection.clientHeight || window.innerHeight;

        // 매 프레임 창 모드 이동 및 흔들림 감지하여 관성 힘 및 중력 쏠림 연동
        function trackWindowMotion() {
            const currentScreenX = window.screenX || window.screenLeft || 0;
            const currentScreenY = window.screenY || window.screenTop || 0;

            const deltaX = currentScreenX - lastScreenX;
            const deltaY = currentScreenY - lastScreenY;

            // 창이 좌우/상하로 드래그되어 움직일 때 은은하고 부드러운 중간 물리 반응 (요청사항)
            if (Math.abs(deltaX) > 1 || Math.abs(deltaY) > 1) {
                // 1. 관성에 따른 중력 쏠림 은은한 중간값 (-3.5 ~ 3.5 범위)
                const tiltX = Math.max(-3.5, Math.min(3.5, -deltaX * 0.08));
                const tiltY = 1.1 + Math.max(-2.0, Math.min(2.0, -deltaY * 0.08));
                engine.gravity.x = tiltX;
                engine.gravity.y = tiltY;

                // 2. 월드 내 모든 쌓인 유닛 블록들에 은은하게 밀려나는 관성 힘 부여
                const allBodies = Composite.allBodies(engine.world);
                allBodies.forEach(body => {
                    if (!body.isStatic) {
                        Matter.Body.applyForce(body, body.position, {
                            x: -deltaX * 0.00028,
                            y: -deltaY * 0.00028
                        });
                        // 창을 빠르게 움직일 때 미세한 자연스러운 회전
                        if (Math.abs(deltaX) > 7) {
                            Matter.Body.setAngularVelocity(body, (Math.random() - 0.5) * 0.04);
                        }
                    }
                });
            } else {
                // 창이 정지했을 때 기본 중력(0, 1.1)으로 부드럽게 감쇄 복귀
                engine.gravity.x += (0 - engine.gravity.x) * 0.08;
                engine.gravity.y += (1.1 - engine.gravity.y) * 0.08;
            }

            lastScreenX = currentScreenX;
            lastScreenY = currentScreenY;

            requestAnimationFrame(trackWindowMotion);
        }

        requestAnimationFrame(trackWindowMotion);

        // 창 크기 변경(Resize) 시 유닛 이탈 방지, 위치 바운딩 자동 보정 & 동적 스케일링 (요청사항)
        window.addEventListener('resize', () => {
            const newW = heroSection.clientWidth || window.innerWidth;
            const newH = heroSection.clientHeight || window.innerHeight;

            if (newW <= 0 || newH <= 0) return;

            render.canvas.width = newW;
            render.canvas.height = newH;
            render.options.width = newW;
            render.options.height = newH;

            // 1. 바닥, 천장(헤더 아래) 및 좌우 벽 위치 재설정
            const currentHeaderHeight = (newW <= 768) ? 58 : 72;
            Matter.Body.setPosition(ground, { x: newW / 2, y: newH + 40 });
            Matter.Body.setPosition(leftWall, { x: -40, y: newH / 2 });
            Matter.Body.setPosition(rightWall, { x: newW + 40, y: newH / 2 });
            updateStickerBtnPhysicsBody();

            // 2. 창 크기 변경 시 모든 블록이 화면 밖으로 탈출하거나 사라지지 않도록 내부 바운딩 강제 조율
            const scaleRatio = lastWidth > 0 ? (newW / lastWidth) : 1;
            const shouldScale = Math.abs(scaleRatio - 1.0) > 0.04 && scaleRatio > 0.5 && scaleRatio < 1.8;

            const allBodies = Composite.allBodies(engine.world);
            allBodies.forEach(body => {
                if (!body.isStatic) {
                    // 화면 밖으로 이탈하지 않도록 x, y 좌표 바운딩 안전 보정
                    const margin = 50;
                    const targetX = (lastWidth > 0) ? (body.position.x * scaleRatio) : body.position.x;
                    const clampedX = Math.max(margin, Math.min(newW - margin, targetX));
                    const clampedY = Math.max(currentHeaderHeight + 35, Math.min(newH - 65, body.position.y));

                    Matter.Body.setPosition(body, { x: clampedX, y: clampedY });
                    Matter.Body.setVelocity(body, { x: body.velocity.x * 0.2, y: body.velocity.y * 0.2 });

                    // 창 크기가 급격히 변할 때 유닛 크기도 창 크기에 맞춰 동적 조율
                    if (shouldScale && body.render && body.render.sprite) {
                        const clampedScale = Math.max(0.7, Math.min(1.3, scaleRatio));
                        Matter.Body.scale(body, clampedScale, clampedScale);
                        body.render.sprite.xScale *= clampedScale;
                        body.render.sprite.yScale *= clampedScale;
                    }
                }
            });

            lastWidth = newW;
            lastHeight = newH;
        });

        // ========================================================
        // 모바일 기기 스마트폰 기울이기 & 흔들기 (DeviceMotion Accelerometer 연동) (요청사항)
        // ========================================================
        function initMobileMotionSensor() {
            let lastAccelX = 0;
            let lastAccelY = 0;

            function handleDeviceMotion(e) {
                const accel = e.accelerationIncludingGravity || e.acceleration;
                if (!accel) return;

                const x = accel.x || 0; // 스마트폰 좌우 기울임 (-10 ~ 10)
                const y = accel.y || 0; // 스마트폰 상하 기울임 (-10 ~ 10)

                const deltaAccelX = x - lastAccelX;
                const deltaAccelY = y - lastAccelY;

                // 스마트폰 기울기에 맞춘 실시간 2D 중력 쏠림 연동
                const tiltGravityX = Math.max(-2.8, Math.min(2.8, -x * 0.35));
                const tiltGravityY = Math.max(-0.5, Math.min(2.8, y * 0.35));

                engine.gravity.x = tiltGravityX;
                engine.gravity.y = tiltGravityY;

                // 스마트폰을 손으로 흔들었을 때 유닛 블록 충격파 적용
                if (Math.abs(deltaAccelX) > 3.5 || Math.abs(deltaAccelY) > 3.5) {
                    const allBodies = Composite.allBodies(engine.world);
                    allBodies.forEach(body => {
                        if (!body.isStatic) {
                            Matter.Body.applyForce(body, body.position, {
                                x: -deltaAccelX * 0.0003,
                                y: -deltaAccelY * 0.0003
                            });
                        }
                    });
                }

                lastAccelX = x;
                lastAccelY = y;
            }

            // iOS 13+ 권한 및 일반 스마트폰 브라우저 devicemotion 모션 센서 등록
            if (typeof DeviceMotionEvent !== 'undefined' && typeof DeviceMotionEvent.requestPermission === 'function') {
                window.addEventListener('click', function requestPermissionOnClick() {
                    DeviceMotionEvent.requestPermission().then(permissionState => {
                        if (permissionState === 'granted') {
                            window.addEventListener('devicemotion', handleDeviceMotion);
                        }
                    }).catch(console.error);
                    window.removeEventListener('click', requestPermissionOnClick);
                }, { once: true });
            } else {
                window.addEventListener('devicemotion', handleDeviceMotion);
            }
        }

        initMobileMotionSensor();
    }

    // 물리 엔진 초기화 실행
    initPhysicsHero();

    // ========================================================
    // 2. 스크롤 요소 순차 등장(Scroll Reveal) 인터섹션 옵저버
    // ========================================================
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

    // ========================================================
    // 3. 모바일 햄버거 메뉴 토글 로직 (상단 헤더 바로 아래 드롭다운)
    // ========================================================
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

    // ========================================================
    // 4. About 메뉴 클릭 시 메인페이지 부드러운 스크롤 이동 로직
    // ========================================================
    const scrollToAbout = () => {
        const heroSection = document.getElementById('hero-section');
        const aboutSection = document.querySelector('.about-section-block');
        
        if (heroSection) {
            const targetPos = heroSection.offsetHeight;
            window.scrollTo({ top: targetPos, behavior: 'smooth' });
        } else if (aboutSection) {
            window.scrollTo({ top: aboutSection.offsetTop, behavior: 'smooth' });
        }

        // 스크롤 안착 후 주소창의 #about 해시를 깨끗하게 제거 (이후 새로고침/로고 클릭 시 무조건 메인 y=0 시작)
        setTimeout(() => {
            if (window.location.hash === '#about' && history.replaceState) {
                history.replaceState('', document.title, window.location.pathname + window.location.search);
            }
        }, 600);
    };

    const aboutLinks = document.querySelectorAll('.nav-link-about');
    aboutLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            const aboutSection = document.querySelector('.about-section-block');
            if (aboutSection) {
                e.preventDefault();
                scrollToAbout();
            }
        });
    });

    // 로고 클릭 시 주소창의 #about 해시 완전 제거 및 메인 최상단(y=0)으로 스크롤 이동
    const logoLinks = document.querySelectorAll('.side-nav-logo');
    logoLinks.forEach(logo => {
        logo.addEventListener('click', (e) => {
            const heroSection = document.getElementById('hero-section');
            if (heroSection) {
                e.preventDefault();
                if (history.pushState) {
                    history.pushState('', document.title, window.location.pathname + window.location.search);
                }
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        });
    });

    // 스크롤 위치에 따른 About active 링크 동적 관리 (초기 메인 접속 시 About 선택 제거)
    const updateActiveNavOnScroll = () => {
        const aboutSection = document.querySelector('.about-section-block');
        const aboutLink = document.querySelector('.side-nav-link.nav-link-about');
        
        if (!aboutSection || !aboutLink) return;
        
        const scrollPos = window.pageYOffset || document.documentElement.scrollTop;
        const aboutTop = aboutSection.offsetTop - 150;
        
        if (scrollPos >= aboutTop) {
            aboutLink.classList.add('active');
        } else {
            aboutLink.classList.remove('active');
        }
    };

    window.addEventListener('scroll', updateActiveNavOnScroll);
    updateActiveNavOnScroll();

    // 브라우저 자동 스크롤 위치 복원 비활성화 & 새로고침/초기 접속 시 무조건 메인화면(y=0) 최상단 시작
    if ('scrollRestoration' in history) {
        history.scrollRestoration = 'manual';
    }

    if (window.location.hash === '#about') {
        setTimeout(scrollToAbout, 300);
    } else {
        window.scrollTo(0, 0);
    }

    window.addEventListener('load', () => {
        if (window.location.hash !== '#about') {
            window.scrollTo(0, 0);
        }
    });

    // ========================================================
    // 5. 메뉴바 링크 Hover 시 타겟 페이지 0ms 사전 로드 (Prefetching으로 이동 끊김 제거)
    // ========================================================
    const prefetchTargetPage = (url) => {
        if (!url || url.startsWith('#') || url.startsWith('javascript:')) return;
        if (document.querySelector(`link[rel="prefetch"][href="${url}"]`)) return;
        
        const link = document.createElement('link');
        link.rel = 'prefetch';
        link.href = url;
        document.head.appendChild(link);
    };

    const navItems = document.querySelectorAll('.side-nav-link, .nav-links li a, .mobile-nav-links li a');
    // ========================================================
    // 6. 첫 접속 / 새로고침 시 사이트 전체 자산 전역 사전 로드 (Initial Pre-cache Engine)
    //    (이동 간 끊김을 0ms로 없애기 위해 첫 로딩 시 서브페이지 & 핵심 자산 100% 캐싱)
    // ========================================================
    const preCacheGlobalAssets = () => {
        // 1. 서브페이지 HTML 구조 사전 페치 (Prefetch)
        const subPages = ['./guestbook.html', './archive.html', './gallery/gallery.html'];
        subPages.forEach(url => {
            if (!document.querySelector(`link[rel="prefetch"][href="${url}"]`)) {
                const link = document.createElement('link');
                link.rel = 'prefetch';
                link.href = url;
                document.head.appendChild(link);
            }
        });

        // 2. 아카이브 포스터 & 어바웃 핵심 이미지 사전 로딩 (Image Preload Cache)
        const imagesToCache = [
            './about/img/about_1.png',
            './about/img/about_2.png',
            './gallery/archive/2019gsdd.png',
            './gallery/archive/2020gsdd.png',
            './gallery/archive/2021gsdd.png',
            './gallery/archive/2022gsdd.jpeg',
            './gallery/archive/2023gsdd.png',
            './gallery/archive/2024gsdd.png',
            './gallery/archive/2025gsdd.png'
        ];

        imagesToCache.forEach(src => {
            const img = new Image();
            img.src = src;
        });
    };

    // 새로고침이나 첫 접속(Session 최초 진입) 시에만 로딩창 1회 띄우고, 이후 페이지 간 이동 시에는 100% 스킵!
    const isPreloadedInSession = sessionStorage.getItem('gsdd_preloaded') === 'true';
    const isMainHeroPage = document.getElementById('hero-section') !== null;

    if (isMainHeroPage && !isPreloadedInSession) {
        let loader = document.getElementById('global-page-loader');
        if (!loader) {
            loader = document.createElement('div');
            loader.id = 'global-page-loader';
            loader.innerHTML = `
                <div class="loader-spinner"></div>
                <span class="loader-text">Finding Balance In ___</span>
            `;
            document.body.prepend(loader);
        }

        // 로딩창 동안 전역 자산 pre-cache 수행
        preCacheGlobalAssets();
        sessionStorage.setItem('gsdd_preloaded', 'true');

        const hideGlobalLoader = () => {
            if (loader) {
                loader.classList.add('loaded');
            }
            // 로딩 화면 오버레이가 완전히 걷힌 직후 유닛 블록 낙하 시퀀스 시작
            setTimeout(() => {
                if (typeof window.triggerDropSequence === 'function') {
                    window.triggerDropSequence();
                }
            }, 250);
        };

        if (document.readyState === 'complete') {
            setTimeout(hideGlobalLoader, 250);
        } else {
            window.addEventListener('load', () => setTimeout(hideGlobalLoader, 250));
        }
    } else {
        // 내부 페이지 이동 시에는 로딩창 100% 비활성화 및 즉시 UI 노출
        const existingLoader = document.getElementById('global-page-loader');
        if (existingLoader) {
            existingLoader.remove();
        }
        document.body.classList.remove('loading-state');

        const fadeElements = document.querySelectorAll('.hero-fade-element');
        fadeElements.forEach(el => el.classList.add('visible'));

        if (typeof window.triggerDropSequence === 'function') {
            window.triggerDropSequence();
        }
    }

    // ========================================================
    // 7. 어바웃 동영상 영역 50% 이상 보일 때 유튜브 자동 재생 (IntersectionObserver)
    // ========================================================
    const videoSection = document.querySelector('.main-video-section');
    const youtubeIframe = document.getElementById('about-youtube-player');

    if (videoSection && youtubeIframe) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                // 비디오 영역이 화면에 50% (0.5) 이상 노출될 때 기본 음향 10% 세팅 후 자동 재생
                if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
                    youtubeIframe.contentWindow.postMessage(JSON.stringify({
                        event: 'command',
                        func: 'unMute',
                        args: []
                    }), '*');
                    youtubeIframe.contentWindow.postMessage(JSON.stringify({
                        event: 'command',
                        func: 'setVolume',
                        args: [10]
                    }), '*');
                    youtubeIframe.contentWindow.postMessage(JSON.stringify({
                        event: 'command',
                        func: 'playVideo',
                        args: []
                    }), '*');
                } else {
                    // 화면 밖으로 50% 미만 벗어나면 일시 정지
                    youtubeIframe.contentWindow.postMessage(JSON.stringify({
                        event: 'command',
                        func: 'pauseVideo',
                        args: []
                    }), '*');
                }
            });
        }, {
            threshold: [0, 0.5, 1.0]
        });

        observer.observe(videoSection);
    }
});
