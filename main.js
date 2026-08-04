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

        // 캔버스 렌더러 설정
        const render = Render.create({
            canvas: canvas,
            engine: engine,
            options: {
                width: width,
                height: height,
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

        // 마우스 드래그 / 던지기 인터랙션 추가
        const mouse = Mouse.create(render.canvas);
        const mouseConstraint = MouseConstraint.create(engine, {
            mouse: mouse,
            constraint: {
                stiffness: 0.2,
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

        // F:\project\99. project\code\unit 폴더 내 unit_1.png ~ unit_18.png 로드
        const unitFiles = [];
        for (let i = 1; i <= 18; i++) {
            unitFiles.push(`./unit/unit_${i}.png`);
        }

        const loadedUnits = [];
        let loadedCount = 0;

        unitFiles.forEach((src, idx) => {
            const img = new Image();
            img.src = src;
            img.onload = () => {
                loadedUnits[idx] = {
                    src: src,
                    w: img.naturalWidth || 140,
                    h: img.naturalHeight || 140
                };
                loadedCount++;
                if (loadedCount === unitFiles.length) {
                    startDroppingProcess();
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
                    startDroppingProcess();
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
                restitution: 0.25, // 반발력 (통통 튀어 오르는 정도)
                friction: 0.85,    // 마찰력 (자연스럽게 쌓임)
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
                restitution: 0.3,
                friction: 0.8,
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

        // 저장된 방문자 커스텀 스티커 불러오기
        function loadSavedUserStickers() {
            try {
                const savedStickers = JSON.parse(localStorage.getItem('gsdd_custom_stickers') || '[]');
                savedStickers.forEach((dataUrl, idx) => {
                    setTimeout(() => {
                        window.spawnCustomStickerBlock(dataUrl);
                    }, 1200 + (idx * 250));
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
            if (topWallActive) {
                Matter.Body.setPosition(topWall, { x: newW / 2, y: currentHeaderHeight - 40 });
            }
            Matter.Body.setPosition(leftWall, { x: -40, y: newH / 2 });
            Matter.Body.setPosition(rightWall, { x: newW + 40, y: newH / 2 });

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

    // ========================================================
    // 5. 메뉴바 링크 클릭 시 진동(Vibration Shake) 애니메이션 연동 (요청사항)
    // ========================================================
    const navItems = document.querySelectorAll('.nav-links li a, .mobile-nav-links li a');
    navItems.forEach(item => {
        item.addEventListener('click', function () {
            this.classList.add('nav-vibrate-active');
            setTimeout(() => {
                this.classList.remove('nav-vibrate-active');
            }, 250);
        });
    });
});