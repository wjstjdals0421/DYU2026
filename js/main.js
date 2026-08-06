// 메인 스크립트 모듈 (2D 물리엔진 중력 유닛 블록 낙하, 스크롤 리빌 애니메이션, 모바일 햄버거 메뉴 및 About 이동)
document.addEventListener('DOMContentLoaded', () => {

    // ========================================================
    // 0. 마우스 포인터 유닛 이미지 변경 & 클릭 시 1~12번 유닛 순차 변경 (요청사항)
    // ========================================================
    function initCustomUnitCursor() {
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

            const videoElem = document.querySelector('.main-video-section');
            if (videoElem) {
                const rect = videoElem.getBoundingClientRect();
                if (e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom) {
                    cursor.style.opacity = '0';
                    return;
                }
            }
            cursor.style.opacity = '1';
        });

        window.addEventListener('click', (e) => {
            const isClickable = e.target.closest('a, button, input, textarea, select, .nav-link, .interactive, iframe, canvas, label');
            if (isClickable) return;

            currentUnit = (currentUnit % 12) + 1;
            if (cursorImg) {
                cursorImg.src = getUnitPath(currentUnit);
            }
        });
    }

    initCustomUnitCursor();

    // ========================================================
    // 1. Matter.js 2D 물리 엔진 시스템 (유닛 18종 떨어지는 물리효과)
    // ========================================================
    function initPhysicsEngine() {
        const canvas = document.getElementById('physics-canvas');
        const heroSection = document.getElementById('hero-section');

        if (!canvas || !heroSection || typeof Matter === 'undefined') return;

        const Engine = Matter.Engine,
              Render = Matter.Render,
              Runner = Matter.Runner,
              Bodies = Matter.Bodies,
              Composite = Matter.Composite,
              Mouse = Matter.Mouse,
              MouseConstraint = Matter.MouseConstraint,
              Common = Matter.Common,
              Events = Matter.Events;

        // Matter.js fromVertices 전용 poly-decomp 무적 래퍼 (A.makeCCW TypeError 100% 완전 소멸)
        const origDecomp = window.decomp || (typeof decomp !== 'undefined' ? decomp : {});
        const safeDecomp = {
            decomp: (origDecomp.decomp || (origDecomp.Polygon ? origDecomp.Polygon.decomp : null) || function(poly) { return [poly]; }),
            quickDecomp: (origDecomp.quickDecomp || (origDecomp.Polygon ? origDecomp.Polygon.quickDecomp : null) || function(poly) { return [poly]; }),
            isDegen: (origDecomp.isDegen || (origDecomp.Polygon ? origDecomp.Polygon.isDegen : null) || function() { return false; }),
            makeCCW: (origDecomp.makeCCW || (origDecomp.Polygon ? origDecomp.Polygon.makeCCW : null) || function(poly) { return true; })
        };
        window.decomp = safeDecomp;
        if (Common && typeof Common.setDecomp === 'function') {
            Common.setDecomp(safeDecomp);
        }

        const width = heroSection.clientWidth || window.innerWidth;
        const height = heroSection.clientHeight || window.innerHeight;

        const engine = Engine.create({
            gravity: { x: 0, y: 1.1 }
        });

        const render = Render.create({
            canvas: canvas,
            engine: engine,
            options: {
                width: width,
                height: height,
                pixelRatio: Math.min(window.devicePixelRatio || 1, 2),
                background: '#ffffff',
                wireframes: false,
                showAngleIndicator: false
            }
        });

        Render.run(render);
        const runner = Runner.create();
        Runner.run(runner, engine);

        // 눈으로 직접 대조 디버깅 (H키 누르면 핫핑크 윤곽선 토글)
        let isHitboxVisible = false;

        Events.on(render, 'afterRender', () => {
            if (!isHitboxVisible) return;
            const ctx = render.context;
            if (!ctx) return;
            const bodies = Composite.allBodies(engine.world);

            ctx.save();
            bodies.forEach(body => {
                if (!body || body.isStatic) return;

                const drawPartVertices = (verts) => {
                    if (!verts || verts.length === 0) return;
                    ctx.beginPath();
                    ctx.moveTo(verts[0].x, verts[0].y);
                    for (let j = 1; j < verts.length; j++) {
                        ctx.lineTo(verts[j].x, verts[j].y);
                    }
                    ctx.closePath();
                    ctx.lineWidth = 2.2;
                    ctx.strokeStyle = '#ff0055';
                    ctx.stroke();
                };

                if (body.parts && body.parts.length > 1) {
                    for (let p = 1; p < body.parts.length; p++) {
                        drawPartVertices(body.parts[p].vertices);
                    }
                } else if (body.vertices && body.vertices.length > 0) {
                    drawPartVertices(body.vertices);
                }
            });
            ctx.restore();
        });

        window.addEventListener('keydown', (e) => {
            const activeEl = document.activeElement;
            if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA' || activeEl.isContentEditable)) {
                return;
            }
            if (e.key === 'h' || e.key === 'H' || e.code === 'KeyH') {
                isHitboxVisible = !isHitboxVisible;
                console.log('Hitbox Outline Toggled:', isHitboxVisible ? 'ON (핫핑크 윤곽선 노출)' : 'OFF (숨김)');
            }
        });

        const wallOptions = { isStatic: true, render: { visible: false } };
        const ground = Bodies.rectangle(width / 2, height + 40, width * 2, 80, wallOptions);
        const navOffset = (window.innerWidth > 768) ? 70 : 0;
        const leftWall = Bodies.rectangle(navOffset - 40, height / 2, 80, height * 2, wallOptions);
        const rightWall = Bodies.rectangle(width + 40, height / 2, 80, height * 2, wallOptions);

        Composite.add(engine.world, [ground, leftWall, rightWall]);

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

        if (mouse.element) {
            mouse.element.removeEventListener('mousewheel', mouse.mousewheel);
            mouse.element.removeEventListener('DOMMouseScroll', mouse.mousewheel);
            mouse.element.removeEventListener('wheel', mouse.mousewheel);

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

        canvas.addEventListener('wheel', (e) => {
            window.scrollBy({
                top: e.deltaY,
                behavior: 'auto'
            });
        }, { passive: true });

        // 18개 변환 SVG 파일 패스 데이터(d="M 500.61 250.5 L ... Z")에서 별/성게/구름 실물 뾰족 가시 정점 100% 정밀 파싱
        function extractSVGPathVertices(svgText) {
            if (!svgText) return null;
            try {
                const parser = new DOMParser();
                const xmlDoc = parser.parseFromString(svgText, "image/svg+xml");
                const pathEl = xmlDoc.querySelector('path');
                if (!pathEl) return null;

                const d = pathEl.getAttribute('d');
                if (!d) return null;

                const points = [];
                const commands = d.trim().split(/(?=[MmLlZz])/);
                
                commands.forEach(cmd => {
                    const trimmed = cmd.trim();
                    if (!trimmed) return;
                    const code = trimmed[0];
                    const numbers = trimmed.substring(1).trim().split(/[\s,]+/);
                    
                    if ((code === 'M' || code === 'm' || code === 'L' || code === 'l') && numbers.length >= 2) {
                        for (let i = 0; i < numbers.length - 1; i += 2) {
                            const nx = parseFloat(numbers[i]);
                            const ny = parseFloat(numbers[i + 1]);
                            if (!isNaN(nx) && !isNaN(ny)) {
                                points.push({ x: nx, y: ny });
                            }
                        }
                    }
                });

                if (points.length >= 6) {
                    Matter.Vertices.centre(points);
                    return points;
                }
            } catch (err) {
                console.warn('SVG path parsing error:', err);
            }
            return null;
        }

        // 유닛 이미지의 불투명 픽셀 알파 채널(Alpha Channel) 픽셀 정밀 추적 (보조 백업)
        function extractContourVerticesFromImage(img) {
            try {
                const w = img.naturalWidth || img.width || 200;
                const h = img.naturalHeight || img.height || 200;
                const canvas = document.createElement('canvas');
                canvas.width = w;
                canvas.height = h;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, w, h);

                const imgData = ctx.getImageData(0, 0, w, h);
                const data = imgData.data;

                const cx = w / 2;
                const cy = h / 2;
                const points = [];
                const numRays = 36;

                for (let i = 0; i < numRays; i++) {
                    const angle = (i * 2 * Math.PI) / numRays;
                    const cosA = Math.cos(angle);
                    const sinA = Math.sin(angle);

                    let maxR = 0;
                    const maxDist = Math.hypot(cx, cy);

                    for (let r = maxDist; r >= 0; r -= 1.5) {
                        const px = Math.round(cx + r * cosA);
                        const py = Math.round(cy + r * sinA);

                        if (px >= 0 && px < w && py >= 0 && py < h) {
                            const alphaIdx = (py * w + px) * 4 + 3;
                            if (data[alphaIdx] > 30) {
                                maxR = r;
                                break;
                            }
                        }
                    }

                    if (maxR > 0) {
                        points.push({
                            x: cx + maxR * cosA,
                            y: cy + maxR * sinA
                        });
                    }
                }

                if (points.length >= 6) {
                    Matter.Vertices.centre(points);
                    return points;
                }
            } catch (err) {
                console.warn('Contour tracing error:', err);
            }
            return null;
        }

        // unit_1.svg ~ unit_18.svg 18개 변환 SVG 전용 로드 맵
        const unitFiles = [];
        for (let i = 1; i <= 18; i++) {
            unitFiles.push(`./unit/unit_${i}.svg`);
        }

        const loadedUnits = [];
        let loadedCount = 0;
        let isUnitsReady = false;
        let isDropTriggered = false;

        function checkAndTriggerDrop() {
            loadedCount++;
            if (loadedCount === unitFiles.length) {
                isUnitsReady = true;
                setTimeout(() => {
                    if (typeof window.triggerDropSequence === 'function') {
                        window.triggerDropSequence();
                    }
                }, 100);
            }
        }

        window.triggerDropSequence = function () {
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

        unitFiles.forEach((src, idx) => {
            const img = new Image();
            img.onload = () => {
                fetch(src)
                    .then(res => res.text())
                    .then(svgText => {
                        let verts = extractSVGPathVertices(svgText);
                        if (!verts || verts.length < 6) {
                            verts = extractContourVerticesFromImage(img);
                        }
                        loadedUnits[idx] = {
                            src: src,
                            w: img.naturalWidth || 200,
                            h: img.naturalHeight || 200,
                            vertices: verts
                        };
                        checkAndTriggerDrop();
                    })
                    .catch(() => {
                        const verts = extractContourVerticesFromImage(img);
                        loadedUnits[idx] = {
                            src: src,
                            w: img.naturalWidth || 200,
                            h: img.naturalHeight || 200,
                            vertices: verts
                        };
                        checkAndTriggerDrop();
                    });
            };
            img.onerror = () => {
                loadedUnits[idx] = { src: src, w: 200, h: 200 };
                checkAndTriggerDrop();
            };
            img.src = src;
        });

        function generateAllUnitsOnceQueue(totalUnitsCount) {
            const queue = [];
            for (let i = 0; i < totalUnitsCount; i++) {
                queue.push(i);
            }
            for (let i = queue.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [queue[i], queue[j]] = [queue[j], queue[i]];
            }
            return queue;
        }

        function spawnSingleBlock(unitIdx) {
            if (loadedUnits.length === 0) return;
            const unit = loadedUnits[unitIdx !== undefined ? unitIdx : Math.floor(Math.random() * loadedUnits.length)];
            if (!unit) return;

            const randomScaleRatio = 0.5 + (Math.random() * 0.5);
            const baseScale = (window.innerWidth <= 768) ? 0.224 : 0.455;
            
            const unitSizeMultiplier = (unitIdx >= 12) ? 1.50 : 1.25;
            const finalSpriteScale = baseScale * randomScaleRatio * unitSizeMultiplier;

            const bodyW = unit.w * finalSpriteScale;
            const bodyH = unit.h * finalSpriteScale;

            const hitboxW = bodyW * 0.88;
            const hitboxH = bodyH * 0.88;

            const navOffset = (window.innerWidth > 768) ? 70 : 0;
            const availableW = width - navOffset;
            const minX = navOffset + (availableW * 0.05);
            const maxX = navOffset + (availableW * 0.95);
            const spawnX = minX + Math.random() * (maxX - minX);
            const spawnY = -120 - (Math.random() * 60);

            let block;
            if (unit && unit.vertices && unit.vertices.length >= 4) {
                try {
                    let cloned = unit.vertices.map(v => ({ x: v.x, y: v.y }));
                    if (Matter.Vertices && typeof Matter.Vertices.scale === 'function') {
                        Matter.Vertices.scale(cloned, finalSpriteScale, finalSpriteScale, { x: 0, y: 0 });
                    }
                    if (Matter.Vertices && typeof Matter.Vertices.centre === 'function') {
                        Matter.Vertices.centre(cloned);
                    }
                    if (Matter.Vertices && typeof Matter.Vertices.clockwise === 'function') {
                        if (!Matter.Vertices.clockwise(cloned)) {
                            cloned.reverse();
                        }
                    }

                    block = Bodies.fromVertices(spawnX, spawnY, [cloned], {
                        restitution: 0.005,
                        friction: 0.95,
                        frictionAir: 0.03,
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
                } catch (e) {
                    console.warn('fromVertices fallback to hull:', e);
                    const hullVerts = Matter.Vertices.hull(unit.vertices.map(v => ({ x: v.x, y: v.y })));
                    Matter.Vertices.scale(hullVerts, finalSpriteScale, finalSpriteScale, { x: 0, y: 0 });
                    Matter.Vertices.centre(hullVerts);

                    block = Bodies.fromVertices(spawnX, spawnY, [hullVerts], {
                        restitution: 0.005,
                        friction: 0.95,
                        frictionAir: 0.03,
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
                }
            } else {
                block = Bodies.rectangle(spawnX, spawnY, hitboxW, hitboxH, {
                    chamfer: { radius: Math.min(hitboxW, hitboxH) * 0.20 },
                    restitution: 0.005,
                    friction: 0.95,
                    frictionAir: 0.03,
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
            }

            Matter.Body.setAngularVelocity(block, (Math.random() - 0.5) * 0.06);
            Composite.add(engine.world, block);
        }

        window.spawnCustomStickerBlock = function (imgDataUrl) {
            if (!imgDataUrl) return;

            const tempImg = new Image();
            tempImg.onload = function () {
                const navOffset = (window.innerWidth > 768) ? 70 : 0;
                const availableW = width - navOffset;
                const minX = navOffset + (availableW * 0.10);
                const maxX = navOffset + (availableW * 0.90);
                const spawnX = minX + Math.random() * (maxX - minX);
                const spawnY = -140 - (Math.random() * 80);

                const baseScale = (window.innerWidth <= 768) ? 0.35 : 0.60;
                const randomScaleFactor = 0.70 + (Math.random() * 0.80);
                const stickerScale = baseScale * randomScaleFactor;

                const stickerW = (tempImg.naturalWidth || 250) * stickerScale;
                const stickerH = (tempImg.naturalHeight || 250) * stickerScale;

                const hitboxW = stickerW * 0.88;
                const hitboxH = stickerH * 0.88;

                const stickerBlock = Bodies.rectangle(spawnX, spawnY, hitboxW, hitboxH, {
                    chamfer: { radius: Math.min(hitboxW, hitboxH) * 0.20 },
                    restitution: 0.005,
                    friction: 0.95,
                    frictionAir: 0.03,
                    density: 0.0035,
                    angle: (Math.random() - 0.5) * 0.6,
                    render: {
                        sprite: {
                            texture: imgDataUrl,
                            xScale: stickerScale,
                            yScale: stickerScale
                        }
                    }
                });

                Matter.Body.setAngularVelocity(stickerBlock, (Math.random() - 0.5) * 0.08);
                Composite.add(engine.world, stickerBlock);
            };
            tempImg.src = imgDataUrl;
        };

        function startDroppingProcess() {
            let dropQueue = generateAllUnitsOnceQueue(loadedUnits.length);
            
            const dropInterval = setInterval(() => {
                if (dropQueue.length > 0) {
                    const nextUnitIdx = dropQueue.shift();
                    spawnSingleBlock(nextUnitIdx);
                } else {
                    clearInterval(dropInterval);
                }
            }, 300);
        }

        setTimeout(() => {
            if (window.triggerDropSequence) {
                window.triggerDropSequence();
            }
        }, 150);
    }

    initPhysicsEngine();

    // ========================================================
    // 2. 스크롤 애니메이션 리빌 (메인, 어바웃, 아카이브 3D 카드 100% 표시 보장)
    // ========================================================
    const revealElements = document.querySelectorAll('.reveal-on-scroll');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
            }
        });
    }, { threshold: 0.05 });

    revealElements.forEach(el => {
        observer.observe(el);
        // 화면 미출력 예방을 위한 100% 안전 표시 보장
        setTimeout(() => {
            el.classList.add('is-visible');
        }, 50);
    });

    // ========================================================
    // 3. About 클릭 시 스무스 스크롤 이동 100% 지원
    // ========================================================
    document.querySelectorAll('.nav-link-about, a[href*="#about"]').forEach(anchor => {
        anchor.addEventListener('click', (e) => {
            const targetEl = document.getElementById('about');
            if (targetEl) {
                const isHomePage = window.location.pathname.endsWith('index.html') || window.location.pathname.endsWith('/') || window.location.pathname.endsWith('/code/') || window.location.pathname.endsWith('code');
                if (isHomePage) {
                    e.preventDefault();
                    targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }
        });
    });
});
