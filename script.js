/* -----------------------------------------------------------
   최초 진입 오프닝 영상 (최초 1회만 재생, 새로고침 시 스킵)
----------------------------------------------------------- */
document.addEventListener('DOMContentLoaded', () => {
    const introScreen = document.getElementById('intro-screen');
    const introVideo = document.getElementById('intro-video');

    if (sessionStorage.getItem('gsdd_intro_played')) {
        if (introScreen) {
            introScreen.style.display = 'none';
            introScreen.classList.add('hidden');
        }
        initMainApp();
    } else {
        if (introVideo) {
            introVideo.currentTime = 0; 
            introVideo.play().catch(error => {
                console.log("Intro video autoplay blocked:", error);
                hideIntro();
            });
            introVideo.onended = hideIntro;
            introVideo.onerror = hideIntro;
        } else {
            initMainApp();
        }
    }

    function hideIntro() {
        sessionStorage.setItem('gsdd_intro_played', 'true');
        if (introScreen) {
            introScreen.classList.add('hidden');
            setTimeout(() => introScreen.style.display = 'none', 500);
        }
        initMainApp(); 
    }
});

let isAppInitialized = false;
function initMainApp() {
    if (isAppInitialized) return;
    isAppInitialized = true;

    renderWorksGrid(worksDataset);
    initArchivePagination();
    updateArchiveView();
    initGuestbookControls();
    initPhysics();
    
    // 디자이너 페이지 렌더링 & 초기화
    renderDesignersList('All');
    
    // 처음 실행 시 메인으로 가며 로딩은 스킵 
    navigateToPage('main', true); 
}

/* -----------------------------------------------------------
   Works 렌더링 로직
----------------------------------------------------------- */
function renderWorksGrid(data) {
    const grid = document.getElementById('works-list-grid');
    grid.innerHTML = '';
    
    const sortedData = [...data].sort((a, b) => a.designer.localeCompare(b.designer));
    
    sortedData.forEach(work => {
        const workItem = document.createElement('li'); 
        workItem.className = `works-item category-${work.category.toLowerCase()}`;
        workItem.onclick = () => showWorkDetail(work.id);
        
        workItem.innerHTML = `
            <figure class="works-thumb">
                <img src="${work.thumbFile}" alt="${work.title}" onerror="this.style.display='none'" class="thumb-bg-img">
                <div class="works-hover-overlay">
                    <div class="works-hover-content">
                        <p class="works-hover-title">${work.title}</p>
                        <p class="works-hover-name">${work.designer}</p>
                    </div>
                    <p class="works-hover-category">${work.category.toUpperCase()}</p>
                </div>
            </figure>
        `;
        grid.appendChild(workItem);
    });
}

function filterWorksByCategory(category) {
    document.querySelectorAll('#section-works .works-filter-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`filter-${category.toLowerCase()}`).classList.add('active');
    
    const filteredData = category === 'All' ? worksDataset : worksDataset.filter(w => w.category === category);
    renderWorksGrid(filteredData);
}

function showWorkDetail(workId) {
    const work = worksDataset.find(w => w.id === workId);
    if (!work) return;

    // 상세페이지 들어갈 때 로딩 없이 바로 이동
    navigateToPage('detail', true);
    
    document.getElementById('detail-project-title').innerText = work.title;
    document.getElementById('detail-author-name').innerText = work.designer;
    
    const emailEl = document.getElementById('detail-author-email');
    const instaEl = document.getElementById('detail-author-insta');
    if (emailEl) emailEl.innerText = work.email || '';
    if (instaEl) instaEl.innerText = work.insta || '';
    
    document.getElementById('detail-description-text').innerHTML = (work.desc || '').replace(/\n/g, '<br>');
    
    const imagesList = document.getElementById('detail-images-list');
    imagesList.innerHTML = ''; 

    const imgBox = document.createElement('figure');
    imgBox.className = 'detail-img-placeholder';
    imgBox.innerHTML = `작품 이미지<br><br>Width: 588px<br>(${work.detailPrefix}.png)`;
    imagesList.appendChild(imgBox);
}

/* ===========================================================
   디자이너 페이지 데이터 연동 및 호버 인터랙션
=========================================================== */

function getDesignersData() {
    const dMap = {};
    worksDataset.forEach(w => {
        const key = w.category + '_' + w.designer; 
        if (!dMap[key]) {
            dMap[key] = {
                designer: w.designer,
                engName: w.engName, // 영문이름 추가
                category: w.category,
                works: []
            };
        }
        dMap[key].works.push(w);
    });
    return Object.values(dMap);
}

function renderDesignersList(category = 'All') {
    const grid = document.getElementById('designers-list-grid');
    if (!grid) return;
    grid.innerHTML = '';
    
    const allDesigners = getDesignersData();
    allDesigners.sort((a, b) => a.designer.localeCompare(b.designer));
    
    const filtered = category === 'All' ? allDesigners : allDesigners.filter(d => d.category === category);
    
    filtered.forEach(d => {
        const li = document.createElement('li');
        li.className = 'designer-item';
        
        const work1 = d.works[0];
        const work2 = d.works[1];

        let img1 = '', img2 = '';
        
        // engName 기반 이미지 생성
        const safeName = d.engName ? d.engName.toLowerCase() : d.designer.toLowerCase(); 
        if (d.category === 'Visual') {
            img1 = `dc_${safeName}_p1.png`;
            img2 = `dc_${safeName}_p2.png`;
        } else {
            img1 = `dc_${safeName}.png`;
            img2 = '';
        }

        const tagClass = d.category.toLowerCase();
        
        li.innerHTML = `
            <span class="tag ${tagClass}">${d.category}</span>
            <span class="name">${d.designer}</span>
            <span class="title designer-work-title" data-img="${img1}" data-workid="${work1 ? work1.id : ''}"><span class="title-text">${work1 ? work1.title : ''}</span></span>
            <span class="title designer-work-title" data-img="${img2}" data-workid="${work2 ? work2.id : ''}"><span class="title-text">${work2 ? work2.title : ''}</span></span>
        `;
        
        grid.appendChild(li);
    });

    initDesignersInteractions(); 
}

function filterDesignersByCategory(category) {
    document.querySelectorAll('#designers-filter-group .works-filter-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`d-filter-${category.toLowerCase()}`).classList.add('active');
    renderDesignersList(category);
}

function initDesignersInteractions() {
    const floatingPreview = document.getElementById('floating-preview');
    if (!floatingPreview) return;

    const titles = document.querySelectorAll('.designer-work-title');

    titles.forEach(title => {
        if (!title.innerText.trim()) return; 

        title.onclick = (e) => {
            e.stopPropagation();
            const workId = title.dataset.workid;
            if(workId) showWorkDetail(workId);
        };

        title.addEventListener('mouseenter', (e) => {
            const imgSrc = title.dataset.img;
            if (imgSrc && imgSrc.trim() !== '') {
                floatingPreview.src = imgSrc;
                floatingPreview.classList.add('visible');
            }
        });

        title.addEventListener('mousemove', (e) => {
            if (floatingPreview.classList.contains('visible')) {
                floatingPreview.style.left = `${e.clientX}px`;
                floatingPreview.style.top = `${e.clientY}px`;
            }
        });

        title.addEventListener('mouseleave', () => {
            floatingPreview.classList.remove('visible');
        });
    });
}

/* -----------------------------------------------------------
   Archive 렌더링 로직 
----------------------------------------------------------- */
let archiveIndex = 0;

function initArchivePagination() {
    const dotsContainer = document.getElementById('archive-dots-container');
    
    if (!dotsContainer) return;
    
    archiveDataset.forEach((data, index) => {
        const dot = document.createElement('div');
        dot.className = index === 0 ? 'archive-dot active' : 'archive-dot';
        dot.onclick = () => { archiveIndex = index; updateArchiveView(); };
        dotsContainer.appendChild(dot);
    });
}

function moveArchiveSlide(direction) {
    archiveIndex += direction; 
    if (archiveIndex < 0) archiveIndex = archiveDataset.length - 1;
    if (archiveIndex >= archiveDataset.length) archiveIndex = 0;
    updateArchiveView();
}

function updateArchiveView() {
    const data = archiveDataset[archiveIndex];
    if (!data) return;
    
    const displayYear = document.getElementById('archive-display-year');
    const titleText = document.getElementById('archive-title-text');
    const descText = document.getElementById('archive-description-text');
    const posterContainer = document.getElementById('archive-poster-container');
    
    if (displayYear) {
        displayYear.innerText = data.year;
        displayYear.style.backgroundColor = data.bgColor;
    }
    
    if (titleText) titleText.innerText = data.title;
    if (descText) descText.innerHTML = (data.desc || '').replace(/\n/g, '<br>');
    
    if (posterContainer) {
        posterContainer.innerHTML = `<img src="${data.year}gsdd.${data.format}" alt="${data.year} GSDD Poster">`;
    }

    const dots = document.querySelectorAll('#archive-dots-container .archive-dot');
    dots.forEach((dot, idx) => {
        if (idx === archiveIndex) dot.classList.add('active');
        else dot.classList.remove('active');
    });
}

function openArchiveExternalLink() {
    const data = archiveDataset[archiveIndex];
    if (data && data.link) {
        window.open(data.link, '_blank');
    }
}

/* -----------------------------------------------------------
   페이지 네비게이션 로직
----------------------------------------------------------- */
let isNavigating = false;

const loadingCombinations = [
    ['loding/ld-01.png', 'loding/ld-02.png', 'loding/ld-03.png'],
    ['loding/ld-04.png', 'loding/ld-05.png', 'loding/ld-06.png'],
    ['loding/ld-07.png', 'loding/ld-08.png', 'loding/ld-09.png'],
    ['loding/ld-10.png', 'loding/ld-11.png', 'loding/ld-12.png'] 
];

function navigateToPage(pageName, skipLoading = false) {
    const targetId = `section-${pageName}`;
    const targetSection = document.getElementById(targetId);
    
    if (targetSection && targetSection.classList.contains('active') && !skipLoading) return;
    if (isNavigating) return;

    const menuPages = ['about', 'works', 'designers', 'archive', 'guestbook'];
    if (!menuPages.includes(pageName)) skipLoading = true;
    if (pageName === 'main') skipLoading = true;

    const detailSection = document.getElementById('section-detail');
    if (detailSection && detailSection.classList.contains('active') && pageName === 'works') {
        skipLoading = true;
    }

    if (skipLoading) {
        completeNavigation(pageName);
        return;
    }

    isNavigating = true;
    
    const loadingScreen = document.getElementById('loading-screen');
    const charsWrap = document.getElementById('loading-chars');
    const finalImg = document.getElementById('loading-final-img');
    const loaderImg1 = document.getElementById('loader-img-1');
    const loaderImg2 = document.getElementById('loader-img-2');
    const loaderImg3 = document.getElementById('loader-img-3');
    
    if (loadingScreen && charsWrap && finalImg && loaderImg1 && loaderImg2 && loaderImg3) {
        const randomComboIndex = Math.floor(Math.random() * loadingCombinations.length);
        const selectedCombo = loadingCombinations[randomComboIndex];
        
        loaderImg1.src = selectedCombo[0];
        loaderImg2.src = selectedCombo[1];
        loaderImg3.src = selectedCombo[2];

        charsWrap.style.display = 'flex';
        finalImg.style.display = 'none';
        finalImg.style.opacity = '0';
        loadingScreen.classList.remove('hidden');
        
        // 애니메이션 타이밍 조정 (1.5초 후 캐릭터 사라짐 -> 1.0초 로고 유지 = 2.5초)
        setTimeout(() => {
            charsWrap.style.display = 'none';
            finalImg.style.display = 'block';
            
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    finalImg.style.opacity = '1';
                });
            });
            
            setTimeout(() => {
                completeNavigation(pageName);
            }, 1000);
            
        }, 1500);
    } else {
        completeNavigation(pageName);
    }
}

function completeNavigation(pageName) {
    const loadingScreen = document.getElementById('loading-screen');
    if (loadingScreen) {
        loadingScreen.classList.add('hidden');
    }

    const sections = document.querySelectorAll('.page-section');
    sections.forEach(sec => sec.classList.remove('active'));
    
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => link.classList.remove('active'));

    const targetId = `section-${pageName}`;
    const targetSection = document.getElementById(targetId);
    if (targetSection) {
        targetSection.classList.add('active');
    }

    const targetNavId = `link-${pageName}`;
    const targetNavLink = document.getElementById(targetNavId);
    if (targetNavLink) {
        targetNavLink.classList.add('active');
    }

    if (pageName === 'detail' || pageName === 'works') {
        const worksLink = document.getElementById('link-works');
        if (worksLink) worksLink.classList.add('active');
    }

    document.body.classList.toggle('is-main-page', pageName === 'main');

    const mainStage = document.getElementById('physics-stage');
    const gbStage = document.getElementById('guestbook-physics-stage');
    if (mainStage) mainStage.style.pointerEvents = (pageName === 'main') ? 'auto' : 'none';
    if (gbStage) gbStage.style.pointerEvents = (pageName === 'guestbook') ? 'auto' : 'none';

    if (pageName === 'guestbook' && !window.__guestbookPhysicsInitialized) {
        requestAnimationFrame(() => {
            requestAnimationFrame(() => initGuestbookPhysics());
        });
    }
    
    if (pageName === 'archive') {
        archiveIndex = 0; 
        updateArchiveView();
    }
    
    const navMenu = document.getElementById('nav-menu');
    const hamburgerBtn = document.querySelector('.hamburger-btn');
    if (navMenu && navMenu.classList.contains('active')) {
        navMenu.classList.remove('active');
        if (hamburgerBtn) hamburgerBtn.innerText = '☰';
        document.body.style.overflow = 'auto';
    }

    window.scrollTo(0, 0);
    isNavigating = false;
}

function toggleMobileMenu() {
    const navMenu = document.getElementById('nav-menu');
    const hamburgerBtn = document.querySelector('.hamburger-btn');
    
    navMenu.classList.toggle('active');

    if (navMenu.classList.contains('active')) {
        hamburgerBtn.innerText = '✕';
        document.body.style.overflow = 'hidden'; 
    } else {
        hamburgerBtn.innerText = '☰';
        document.body.style.overflow = 'auto'; 
    }
}

function toggleAboutFilm(button) {
    const playing = button.dataset.playing === 'true';
    button.dataset.playing = String(!playing);
    button.textContent = playing ? '▶' : 'Ⅱ';
    button.setAttribute('aria-label', playing ? '소개 영상 재생' : '소개 영상 일시정지');
}

/* ===========================================================
   방명록 데이터 및 팝업 (새로고침 원상복구)
=========================================================== */
const guestbookStorageKey = 'gsdd-guestbook-entries';
const gbColors = ['#F6A700', '#E6E6E6', '#E72F4C', '#EA5703', '#FBEE00', '#F6C3D9', '#009DDA', '#6D7F88', '#14A146', '#AAA1CE', '#73BEA2', '#9A87BE', '#0068AD'];
const textBgColors = ['#F6A700', '#E6E6E6', '#E72F4C', '#EA5703', '#FBEE00', '#F6C3D9', '#009DDA', '#6D7F88', '#14A146', '#AAA1CE', '#73BEA2', '#9A87BE', '#0068AD'];

let gbDraft = { shapeColorIdx: 1, shapeIdx: null };
let gbFaces = []; 
let activeFaceId = null; 

const totalShapes = 12; 
const totalFaces = 11;  

function getGuestbookEntries() {
    try { return JSON.parse(localStorage.getItem(guestbookStorageKey)) || []; }
    catch { return []; }
}

function openGuestbookPopup() {
    const popup = document.getElementById('guestbook-popup');
    if (popup) {
        popup.classList.remove('hidden');
        document.body.style.overflow = 'hidden'; 
        
        gbDraft = { shapeColorIdx: 1, shapeIdx: null };
        gbFaces = [];
        activeFaceId = null;
        document.getElementById('gb-name').value = '';
        document.getElementById('gb-message').value = '';
        
        setGuestbookTab('shape'); 
        updateGuestbookPreview(); 
        renderFacesDOM(); 
    }
}

function closeGuestbookPopup() {
    const popup = document.getElementById('guestbook-popup');
    if (popup) {
        popup.classList.add('hidden');
        document.body.style.overflow = ''; 
    }
}

function setGuestbookTab(tabName) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.tab === tabName));
    document.querySelectorAll('.gb-tab-panel').forEach(panel => panel.classList.toggle('active', panel.id === `gb-panel-${tabName}`));
}

function initGuestbookControls() {
    const renderPalette = (containerId, type) => {
        const container = document.getElementById(containerId);
        if(!container) return;
        container.innerHTML = ''; 
        gbColors.forEach((color, idx) => {
            const btn = document.createElement('div');
            btn.className = 'color-swatch';
            btn.style.backgroundColor = color;
            btn.dataset.idx = idx + 1;
            btn.onclick = () => { 
                if(type === 'shape') {
                    gbDraft.shapeColorIdx = idx + 1;
                    updateGuestbookPreview(); 
                } else if(type === 'face' && activeFaceId !== null) {
                    const face = gbFaces.find(f => f.id === activeFaceId);
                    if (face) {
                        face.colorIdx = idx + 1;
                        const wrapper = document.getElementById(`face-wrapper-${activeFaceId}`);
                        if (wrapper) wrapper.querySelector('img').src = `guestbook/gb${face.colorIdx}-${face.faceIdx}.png`;
                    }
                }
                updatePaletteActiveStates(); 
            };
            container.appendChild(btn);
        });
    };
    
    renderPalette('gb-shape-colors', 'shape');
    renderPalette('gb-face-colors', 'face');

    const shapePicker = document.getElementById('gb-shape-picker');
    for (let i = 1; i <= totalShapes; i++) {
        const btn = document.createElement('button');
        btn.className = 'shape-choice';
        btn.innerHTML = `<img src="guestbook/pvf${i}.png" alt="형태${i}">`;
        btn.onclick = () => { gbDraft.shapeIdx = i; updateGuestbookPreview(); };
        shapePicker.appendChild(btn);
    }

    const facePicker = document.getElementById('gb-face-picker');
    for (let i = 1; i <= totalFaces; i++) {
        const btn = document.createElement('button');
        btn.className = 'face-choice';
        btn.innerHTML = `<img src="guestbook/pvc${i}.png" alt="표정${i}">`;
        btn.onclick = () => { 
            const newFace = {
                id: Date.now() + Math.random(),
                faceIdx: i, colorIdx: 1, 
                x: 0, y: 0, scale: 0.6, rotation: 0
            };
            gbFaces.push(newFace);
            activeFaceId = newFace.id; 
            renderFacesDOM();
            updatePaletteActiveStates();
        };
        facePicker.appendChild(btn);
    }
}

function updatePaletteActiveStates() {
    const shapeColors = document.getElementById('gb-shape-colors');
    if(shapeColors) shapeColors.querySelectorAll('.color-swatch').forEach(el => el.classList.toggle('active', parseInt(el.dataset.idx) === gbDraft.shapeColorIdx));
    
    const activeFace = gbFaces.find(f => f.id === activeFaceId);
    const activeColorIdx = activeFace ? activeFace.colorIdx : 0;
    const faceColors = document.getElementById('gb-face-colors');
    if(faceColors) faceColors.querySelectorAll('.color-swatch').forEach(el => el.classList.toggle('active', parseInt(el.dataset.idx) === activeColorIdx));
    
    document.querySelectorAll('.shape-choice').forEach((el, idx) => el.classList.toggle('active', idx + 1 === gbDraft.shapeIdx));
}

function deselectFace(e) {
    if (e.target.id === 'gb-preview-area' || e.target.id === 'gb-preview-character' || e.target.id === 'gb-preview-shape' || e.target.id === 'gb-faces-container') {
        makeFaceActive(null);
    }
}

function makeFaceActive(id) {
    activeFaceId = id;
    document.querySelectorAll('.preview-face-controller').forEach(el => el.classList.remove('active'));
    if (id) {
        const activeEl = document.getElementById(`face-wrapper-${id}`);
        if (activeEl) activeEl.classList.add('active');
    }
    updatePaletteActiveStates();
}

function updateGuestbookPreview() {
    const shapeImg = document.getElementById('gb-preview-shape');
    if (!gbDraft.shapeIdx) {
        shapeImg.style.display = 'none';
    } else {
        shapeImg.style.display = 'block';
        shapeImg.src = `guestbook/guestbook${gbDraft.shapeColorIdx}-${gbDraft.shapeIdx}.png`;
    }
    updatePaletteActiveStates();
}

function renderFacesDOM() {
    const facesContainer = document.getElementById('gb-faces-container');
    facesContainer.innerHTML = '';
    
    gbFaces.forEach(face => {
        const wrapper = document.createElement('div');
        wrapper.id = `face-wrapper-${face.id}`;
        wrapper.className = `preview-face-controller ${face.id === activeFaceId ? 'active' : ''}`;
        wrapper.style.pointerEvents = 'auto';
        
        const baseSize = 190; 
        const currentSize = baseSize * face.scale;
        wrapper.style.width = `${currentSize}px`;
        wrapper.style.height = `${currentSize}px`;
        wrapper.style.left = `calc(50% + ${face.x}px)`;
        wrapper.style.top = `calc(50% + ${face.y}px)`;
        wrapper.style.transform = `translate(-50%, -50%) rotate(${face.rotation}deg)`;

        const img = document.createElement('img');
        img.src = `guestbook/gb${face.colorIdx}-${face.faceIdx}.png`;
        wrapper.appendChild(img);

        const moveHandle = document.createElement('div');
        moveHandle.className = 'move-handle';
        moveHandle.onmousedown = (e) => startDragFace(e, face.id);
        wrapper.appendChild(moveHandle);

        const delHandle = document.createElement('div');
        delHandle.className = 'face-handle face-handle-delete';
        delHandle.innerHTML = '✕';
        delHandle.onmousedown = (e) => { e.stopPropagation(); gbFaces = gbFaces.filter(f => f.id !== face.id); activeFaceId = null; renderFacesDOM(); updatePaletteActiveStates(); };
        wrapper.appendChild(delHandle);

        const resHandle = document.createElement('div');
        resHandle.className = 'face-handle face-handle-resize';
        resHandle.innerHTML = '↔';
        resHandle.onmousedown = (e) => startScaleFace(e, face.id);
        wrapper.appendChild(resHandle);

        const rotHandle = document.createElement('div');
        rotHandle.className = 'face-handle face-handle-rotate';
        rotHandle.innerHTML = '↻';
        rotHandle.onmousedown = (e) => startRotateFace(e, face.id);
        wrapper.appendChild(rotHandle);

        facesContainer.appendChild(wrapper);
    });
}

function startDragFace(e, id) {
    e.preventDefault(); e.stopPropagation();
    makeFaceActive(id);

    const face = gbFaces.find(f => f.id === id);
    const wrapper = document.getElementById(`face-wrapper-${id}`);
    if (!wrapper) return;

    let startX = e.clientX; let startY = e.clientY;
    let initialX = face.x; let initialY = face.y;

    const onMouseMove = (event) => {
        face.x = initialX + (event.clientX - startX);
        face.y = initialY + (event.clientY - startY);
        wrapper.style.left = `calc(50% + ${face.x}px)`;
        wrapper.style.top = `calc(50% + ${face.y}px)`;
    };

    const onMouseUp = () => { 
        document.removeEventListener('mousemove', onMouseMove); 
        document.removeEventListener('mouseup', onMouseUp); 
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
}

function startScaleFace(e, id) {
    e.preventDefault(); e.stopPropagation();
    makeFaceActive(id);
    
    const face = gbFaces.find(f => f.id === id);
    const wrapper = document.getElementById(`face-wrapper-${id}`);
    if (!wrapper) return;
    
    const rect = wrapper.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    
    const startDist = Math.hypot(e.clientX - cx, e.clientY - cy);
    const startScale = face.scale;

    const onMouseMove = (event) => {
        const currentDist = Math.hypot(event.clientX - cx, event.clientY - cy);
        face.scale = Math.max(0.2, Math.min(3.0, startScale * (currentDist / startDist)));
        
        const baseSize = 190; 
        const currentSize = baseSize * face.scale;
        wrapper.style.width = `${currentSize}px`;
        wrapper.style.height = `${currentSize}px`;
    };

    const onMouseUp = () => { 
        document.removeEventListener('mousemove', onMouseMove); 
        document.removeEventListener('mouseup', onMouseUp); 
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
}

function startRotateFace(e, id) {
    e.preventDefault(); e.stopPropagation();
    makeFaceActive(id);
    
    const face = gbFaces.find(f => f.id === id);
    const wrapper = document.getElementById(`face-wrapper-${id}`);
    if (!wrapper) return;
    
    const rect = wrapper.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;

    const startAngle = Math.atan2(e.clientY - cy, e.clientX - cx) * (180 / Math.PI);
    const startRot = face.rotation;

    const onMouseMove = (event) => {
        const currentAngle = Math.atan2(event.clientY - cy, event.clientX - cx) * (180 / Math.PI);
        face.rotation = startRot + (currentAngle - startAngle);
        wrapper.style.transform = `translate(-50%, -50%) rotate(${face.rotation}deg)`;
    };

    const onMouseUp = () => { 
        document.removeEventListener('mousemove', onMouseMove); 
        document.removeEventListener('mouseup', onMouseUp); 
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
}

function saveGuestbookEntry() {
    const name = document.getElementById('gb-name').value.trim();
    const msg = document.getElementById('gb-message').value.trim();
    
    if (!gbDraft.shapeIdx) { alert("형태를 선택해주세요!"); return; }
    if (gbFaces.length === 0) { alert("최소 1개 이상의 표정을 넣어주세요!"); return; }
    if (!name || !msg) { alert("이름과 메시지를 입력해주세요."); setGuestbookTab('message'); return; }

    const entries = getGuestbookEntries();
    entries.unshift({ 
        shapeColorIdx: gbDraft.shapeColorIdx,
        shapeIdx: gbDraft.shapeIdx,
        faces: gbFaces, 
        name, message: msg,
        nameBg: textBgColors[Math.floor(Math.random() * textBgColors.length)],
        msgBg: textBgColors[Math.floor(Math.random() * textBgColors.length)]
    });
    
    localStorage.setItem(guestbookStorageKey, JSON.stringify(entries));
    closeGuestbookPopup(); 
    
    // 방명록 작성 후 전체 새로고침 (오프닝은 세션스토리지로 스킵됨)
    location.reload(); 
}

const customCursor = document.getElementById('custom-cursor');
if (customCursor) {
    document.addEventListener('mousemove', (e) => {
        customCursor.style.display = 'block';
        customCursor.style.left = `${e.clientX}px`;
        customCursor.style.top = `${e.clientY}px`;
    });

    document.addEventListener('mouseleave', () => {
        customCursor.style.display = 'none';
    });

    document.addEventListener('mousedown', () => {
        const randomNum = Math.floor(Math.random() * 13) + 1;
        customCursor.src = `mouse/mouse${randomNum}.png`;
    });
}

/* ===========================================================
   과제 1: 메인 화면 물리엔진
=========================================================== */
function initPhysics() {
    const Engine = Matter.Engine, Render = Matter.Render, Runner = Matter.Runner,
          Bodies = Matter.Bodies, Composite = Matter.Composite,
          Mouse = Matter.Mouse, MouseConstraint = Matter.MouseConstraint,
          Events = Matter.Events, Query = Matter.Query;

    const engine = Engine.create();
    const world = engine.world;
    
    engine.positionIterations = 20; 
    engine.velocityIterations = 20; 
    engine.world.gravity.y = 1.2; 
    
    const stage = document.getElementById('physics-stage');
    const gbStage = document.getElementById('main-guestbook-stage');
    if(!stage) return;

    if(gbStage) {
        gbStage.style.left = 'calc(50% - 50vw)';
        gbStage.style.width = '100vw';
        gbStage.style.height = 'calc(100vh - 80px)';
    }

    const randomXForWidth = (width) => {
        if (width >= stage.clientWidth) return stage.clientWidth / 2;
        return Math.random() * (stage.clientWidth - width) + (width / 2);
    };

    const render = Render.create({
        element: stage,
        engine: engine,
        options: {
            width: stage.clientWidth,
            height: stage.clientHeight,
            wireframes: false,
            background: 'transparent',
            pixelRatio: window.devicePixelRatio || 1
        }
    });

    Render.run(render);
    const runner = Runner.create();
    Runner.run(runner, engine);

    const wallOptions = { isStatic: true, restitution: 0.1, friction: 0.8, render: { visible: false } };
    
    const floorY = stage.clientHeight + 250; 
    const floor = Bodies.rectangle(stage.clientWidth / 2, floorY, stage.clientWidth * 2, 500, wallOptions);
    const leftWall = Bodies.rectangle(-250, stage.clientHeight / 2, 500, stage.clientHeight * 5, wallOptions);
    const rightWall = Bodies.rectangle(stage.clientWidth + 250, stage.clientHeight / 2, 500, stage.clientHeight * 5, wallOptions);
    
    Composite.add(world, [floor, leftWall, rightWall]);

    const recentGbEntries = getGuestbookEntries().slice(0, 10); 
    const domPhysicsItems = []; 

    if(gbStage) {
        gbStage.innerHTML = ''; 
        
        recentGbEntries.forEach((entry, idx) => {
            if (idx >= 10) return; 

            const visualSize = 200; 
            const hitBoxSize = 130; 
            
            const startX = randomXForWidth(hitBoxSize);
            const startY = -800 - (idx * 250); 

            const gbBody = Bodies.rectangle(startX, startY, hitBoxSize, hitBoxSize, { 
                restitution: 0.01, friction: 1, frictionStatic: 10, frictionAir: 0.02, density: 2.0, chamfer: { radius: 10 }, render: { visible: false } 
            });
            Composite.add(world, gbBody);

            const wrapper = document.createElement('div');
            wrapper.className = 'guestbook-stack-item';
            wrapper.style.position = 'absolute';
            wrapper.style.width = `${visualSize}px`;
            wrapper.style.height = `${visualSize}px`;
            wrapper.style.pointerEvents = 'none'; 
            
            const shapeImg = document.createElement('img');
            shapeImg.src = `guestbook/guestbook${entry.shapeColorIdx}-${entry.shapeIdx}.png`;
            shapeImg.style.position = 'absolute'; 
            shapeImg.style.width = '100%'; 
            shapeImg.style.height = '100%';
            shapeImg.style.objectFit = 'contain';
            wrapper.appendChild(shapeImg);
            
            const stageScale = visualSize / 450; 
            entry.faces.forEach(f => {
                const faceImg = document.createElement('img');
                faceImg.src = `guestbook/gb${f.colorIdx}-${f.faceIdx}.png`;
                faceImg.style.position = 'absolute'; 
                
                const faceWidth = 190 * f.scale * stageScale; 
                faceImg.style.width = `${faceWidth}px`; 
                faceImg.style.height = `${faceWidth}px`;
                faceImg.style.left = `calc(50% + ${f.x * stageScale}px)`;
                faceImg.style.top = `calc(50% + ${f.y * stageScale}px)`;
                faceImg.style.objectFit = 'contain';
                faceImg.style.transform = `translate(-50%, -50%) rotate(${f.rotation}deg)`; 
                wrapper.appendChild(faceImg);
            });

            gbStage.appendChild(wrapper);
            domPhysicsItems.push({ body: gbBody, el: wrapper, size: visualSize });
        });

        Events.on(engine, 'afterUpdate', function() {
            domPhysicsItems.forEach(item => {
                const pos = item.body.position;
                const angle = item.body.angle;
                item.el.style.transform = `translate(${pos.x - item.size/2}px, ${pos.y - item.size/2}px) rotate(${angle}rad)`;
            });
        });
    }

    const mainGraphics = [
        { src: 'maingraphic-01.png', width: 1063, height: 1063 },
        { src: 'maingraphic-02.png', width: 1075, height: 963 },
        { src: 'maingraphic-03.png', width: 746, height: 742 },
        { src: 'maingraphic-04.png', width: 746, height: 742 },
        { src: 'maingraphic-05.png', width: 1117, height: 1080 },
        { src: 'maingraphic-06.png', width: 896, height: 646 },
        { src: 'maingraphic-07.png', width: 880, height: 621 },
        { src: 'maingraphic-08.png', width: 909, height: 767 },
        { src: 'maingraphic-09.png', width: 621, height: 721 },
        { src: 'maingraphic-10.png', width: 1259, height: 330 },
        { src: 'maingraphic-11.png', width: 1125, height: 875 },
        { src: 'maingraphic-12.png', width: 1338, height: 759 },
        { src: 'maingraphic-13.png', width: 1000, height: 400 } 
    ];

    mainGraphics.forEach((image) => {
        const minScale = 0.25;
        const maxScale = 0.1;
        const randomScale = Math.random() * (maxScale - minScale) + minScale;

        const hitBoxWidth = image.width * randomScale;
        const hitBoxHeight = image.height * randomScale;
        const startX = randomXForWidth(hitBoxWidth);
        const startY = (Math.random() * -1500) - 200; 

        const graphic = Bodies.rectangle(startX, startY, hitBoxWidth, hitBoxHeight, {
            restitution: 0.01,    
            friction: 1,       
            frictionStatic: 10,
            frictionAir: 0.02,
            density: 2.0,
            chamfer: { radius: 4 }, 
            render: { sprite: { texture: image.src, xScale: randomScale, yScale: randomScale } }
        });
        Composite.add(world, graphic);
    });

    const typoScale = 0.3; 
    const typoGraphics = [
        { src: 'typo-1.png', width: 3132, height: 398, customScale: 0.15 },
        { src: 'typo-2.png', width: 925, height: 134 },
        { src: 'typo-3.png', width: 1242, height: 350, customScale: 0.15 },
        { src: 'typo-4.png', width: 884, height: 134 },
        { src: 'typo-5.png', width: 423, height: 134 }
    ];

    typoGraphics.forEach((typo, index) => {
        const scale = typo.customScale || typoScale;
        const hitBoxWidth = typo.width * scale;
        const hitBoxHeight = typo.height * scale;
        const startX = randomXForWidth(hitBoxWidth);
        const startY = -300 - (index * 300); 

        const typoBody = Bodies.rectangle(startX, startY, hitBoxWidth, hitBoxHeight, {
            restitution: 0.01, friction: 1, frictionStatic: 10, frictionAir: 0.02, density: 2.0, chamfer: { radius: 4 }, 
            render: { sprite: { texture: typo.src, xScale: scale, yScale: scale } }
        });
        Composite.add(world, typoBody);
    });

    const clickBody = Bodies.circle(stage.clientWidth / 2, -1200, 86, {
        label: 'clickBtn', restitution: 0.01, friction: 1, frictionStatic: 10, frictionAir: 0.02, density: 2.0,
        render: { sprite: { texture: 'Click1.png', xScale: 0.3, yScale: 0.3 } }
    });
    Composite.add(world, clickBody);

    const mouse = Mouse.create(render.canvas);
    const mouseConstraint = MouseConstraint.create(engine, {
        mouse: mouse, constraint: { stiffness: 0.2, render: { visible: false } }
    });
    Composite.add(world, mouseConstraint);
    render.mouse = mouse;
    
    Events.on(mouseConstraint, 'mousemove', function(event) {
        const foundPhysics = Query.point(engine.world.bodies, event.mouse.position);
        let isHoveringClick = false;

        if (foundPhysics.length > 0 && foundPhysics[0].label === 'clickBtn') {
            foundPhysics[0].render.sprite.texture = 'Click2.png';
            isHoveringClick = true;
        }
        if (!isHoveringClick && clickBody.render.sprite.texture !== 'Click1.png') {
            clickBody.render.sprite.texture = 'Click1.png';
        }
    });

    let clickStartX = null;
    let clickStartY = null;

    Events.on(mouseConstraint, 'mousedown', function(event) {
        const foundPhysics = Query.point(engine.world.bodies, event.mouse.position);
        if (foundPhysics.length > 0 && foundPhysics[0].label === 'clickBtn') {
            clickStartX = event.mouse.position.x;
            clickStartY = event.mouse.position.y;
        } else {
            clickStartX = null;
        }
    });

    Events.on(mouseConstraint, 'mouseup', function(event) {
        if (clickStartX !== null) {
            const dx = event.mouse.position.x - clickStartX;
            const dy = event.mouse.position.y - clickStartY;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < 5) {
                openGuestbookPopup(); 
                mouseConstraint.body = null;
            }
            clickStartX = null;
        }
    });

    Events.on(mouseConstraint, 'startdrag', () => {
        render.canvas.style.cursor = 'none';
    });
    Events.on(mouseConstraint, 'enddrag', () => {
        render.canvas.style.cursor = 'none';
    });

    window.addEventListener('resize', () => {
        if (stage.clientWidth === 0 || stage.clientHeight === 0) return; 

        render.canvas.width = stage.clientWidth;
        render.canvas.height = stage.clientHeight;
        Matter.Body.setPosition(floor, { x: stage.clientWidth / 2, y: stage.clientHeight + 250 });
        Matter.Body.setPosition(rightWall, { x: stage.clientWidth + 250, y: stage.clientHeight / 2 });
        Matter.Body.setPosition(leftWall, { x: -250, y: stage.clientHeight / 2 });
    });
}

/* ===========================================================
   과제 2: 방명록 화면 전용 물리엔진
=========================================================== */
function initGuestbookPhysics() {
    const Engine = Matter.Engine;
    const Render = Matter.Render;
    const Runner = Matter.Runner;
    const Bodies = Matter.Bodies;
    const Composite = Matter.Composite;
    const Mouse = Matter.Mouse;
    const MouseConstraint = Matter.MouseConstraint;
    const Events = Matter.Events;
    const Body = Matter.Body;

    const stage = document.getElementById('guestbook-physics-stage');
    const domStage = document.getElementById('guestbook-dom-stage');
    if (!stage || !domStage) return;

    if (window.__guestbookPhysicsInitialized) return;
    window.__guestbookPhysicsInitialized = true;

    stage.innerHTML = '';
    domStage.innerHTML = '';

    const entries = getGuestbookEntries();
    const CARD_W = 282;
    const CARD_H = 352;
    const GAP = 24;

    const getColumns = () => {
        if (window.innerWidth <= 768) return 2;
        if (window.innerWidth <= 1100) return 3;
        return 5;
    };

    const getTopMargin = () => window.innerWidth <= 768 ? 100 : 150; 

    const getLayout = () => {
        const currentWidth = stage.clientWidth || window.innerWidth;
        const columns = getColumns();
        const available = Math.max(160, currentWidth - (columns - 1) * GAP);
        const width = Math.min(CARD_W, available / columns);
        const scale = width / CARD_W;
        const height = CARD_H * scale;
        const totalWidth = columns * width + (columns - 1) * GAP;
        const left = Math.max(0, (currentWidth - totalWidth) / 2);
        return { columns, width, height, scale, left };
    };

    let layout = getLayout();
    const cardStates = [];

    const updateContainerHeight = () => {
        const currentLayout = getLayout();
        const totalItems = entries.length + 1;
        const totalRows = Math.ceil(totalItems / currentLayout.columns);
        const requiredHeight = getTopMargin() + totalRows * (currentLayout.height + GAP) + 150;
        
        const section = document.getElementById('section-guestbook');
        if (section) {
            section.style.height = `${Math.max(window.innerHeight - 80, requiredHeight)}px`;
        }

        const addBtn = document.querySelector('.guestbook-add-floating');
        if (addBtn) {
            addBtn.style.left = `${currentLayout.left}px`;
            addBtn.style.top = `${getTopMargin()}px`;
            addBtn.style.width = `${currentLayout.width}px`;
            addBtn.style.height = `${currentLayout.height}px`;
        }
    };

    updateContainerHeight();

    const createCard = (entry, idx) => {
        const slot = idx + 1; 
        const row = Math.floor(slot / layout.columns);
        const col = slot % layout.columns;

        const card = {
            x: layout.left + col * (layout.width + GAP),
            y: getTopMargin() + row * (layout.height + GAP), 
            w: layout.width,
            h: layout.height,
            scale: layout.scale
        };

        const frame = document.createElement('article');
        frame.className = 'gb-fixed-frame';
        frame.style.left = `${card.x}px`;
        frame.style.top = `${card.y}px`;
        frame.style.width = `${card.w}px`;
        frame.style.height = `${card.h}px`;
        frame.setAttribute('aria-label', `${entry.name}의 방명록`);

        const physicsHost = document.createElement('div');
        physicsHost.className = 'gb-card-physics-host';
        physicsHost.style.cssText = 'position:absolute; inset:0; z-index:2; pointer-events:auto;';

        const contentLayer = document.createElement('div');
        contentLayer.className = 'gb-frame-content-layer';
        contentLayer.style.zIndex = '20';
        contentLayer.style.pointerEvents = 'none';

        frame.appendChild(physicsHost);
        frame.appendChild(contentLayer);
        domStage.appendChild(frame);

        card.frame = frame;
        card.layer = contentLayer;
        card.physicsHost = physicsHost;

        const engine = Engine.create();
        engine.positionIterations = 12;
        engine.velocityIterations = 12;
        engine.constraintIterations = 6;
        engine.enableSleeping = true;
        engine.world.gravity.y = 0.9;

        const render = Render.create({
            element: physicsHost,
            engine,
            options: {
                width: card.w,
                height: card.h,
                wireframes: false,
                background: 'transparent',
                pixelRatio: window.devicePixelRatio || 1
            }
        });

        render.canvas.style.position = 'absolute';
        render.canvas.style.inset = '0';
        render.canvas.style.width = '100%';
        render.canvas.style.height = '100%';
        render.canvas.style.background = 'transparent';
        render.canvas.style.pointerEvents = 'auto';

        const wallThickness = 60; 
        const innerPadding = 16;  

        const wallOptions = {
            isStatic: true,
            restitution: 0,
            friction: 0.95,
            frictionStatic: 1,
            render: { visible: false }
        };

        const walls = [
            Bodies.rectangle(card.w / 2, card.h + wallThickness / 2 - innerPadding, card.w + wallThickness * 2, wallThickness, wallOptions),
            Bodies.rectangle(-wallThickness / 2 + innerPadding, card.h / 2, wallThickness, card.h + wallThickness * 2, wallOptions),
            Bodies.rectangle(card.w + wallThickness / 2 - innerPadding, card.h / 2, wallThickness, card.h + wallThickness * 2, wallOptions)
        ];

        Composite.add(engine.world, walls);

        const contentBodies = [];

        const makeContentBody = (x, y, w, h) => Bodies.rectangle(x, y, w, h, {
            restitution: 0,
            friction: 0.92,
            frictionStatic: 1,
            frictionAir: 0.045,
            density: 0.05,
            sleepThreshold: 45,
            chamfer: { radius: Math.min(8, Math.min(w, h) / 4) },
            render: { visible: false }
        });

        const registerContent = (body, element) => {
            body.plugin = {
                guestbookContent: true,
                element,
                width: body.bounds.max.x - body.bounds.min.x,
                height: body.bounds.max.y - body.bounds.min.y
            };
            contentBodies.push(body);
            Composite.add(engine.world, body);
        };

        // 1. 캐릭터
        const characterSize = 220 * card.scale;
        const character = document.createElement('div');
        character.className = 'gb-content-item gb-character-content';
        character.style.width = `${characterSize}px`;
        character.style.height = `${characterSize}px`;

        const shape = document.createElement('img');
        shape.className = 'gb-content-shape';
        shape.src = `guestbook/guestbook${entry.shapeColorIdx}-${entry.shapeIdx}.png`;
        shape.alt = '방명록 캐릭터';
        character.appendChild(shape);

        (entry.faces || []).forEach(face => {
            const img = document.createElement('img');
            img.className = 'gb-content-face';
            img.src = `guestbook/gb${face.colorIdx}-${face.faceIdx}.png`;
            img.alt = '';

            const faceScale = (characterSize / 850);
            const faceSize = 190 * (Number(face.scale) || 1) * faceScale; 

            img.style.width = `${faceSize}px`;
            img.style.height = `${faceSize}px`;
            img.style.left = `calc(50% + ${(Number(face.x) || 0) * faceScale}px)`;
            img.style.top = `calc(50% + ${(Number(face.y) || 0) * faceScale}px)`;
            img.style.transform = `translate(-50%, -50%) rotate(${Number(face.rotation) || 0}deg)`;

            character.appendChild(img);
        });

        contentLayer.appendChild(character);

        const characterBodyWidth = characterSize * 0.85; 
        const characterBodyHeight = characterSize * 0.5; 
        const characterBody = makeContentBody(
            card.w / 2 + (Math.random() - 0.5) * card.w * 0.16,
            60, 
            characterBodyWidth,
            characterBodyHeight
        );
        registerContent(characterBody, character);
        Body.setInertia(characterBody, Infinity);
        Body.setAngularVelocity(characterBody, 0);

        // 2. 이름
        const name = document.createElement('div');
        name.className = 'gb-content-item gb-content-name';
        name.textContent = entry.name || '';
        name.style.backgroundColor = entry.nameBg || '#ffcc00';
        name.style.fontSize = `${Math.max(12, 16 * card.scale)}px`;
        
        name.style.width = 'max-content';
        name.style.maxWidth = `${card.w * 0.8}px`; 
        contentLayer.appendChild(name);

        requestAnimationFrame(() => {
            let nameW = name.offsetWidth || 80;
            let nameH = name.offsetHeight || 30;

            const nameBody = makeContentBody(30 + nameW / 2, -20, nameW, nameH);
            Body.setAngle(nameBody, (Math.random() * 12 - 6) * Math.PI / 180);
            registerContent(nameBody, name);
        });

        // 3. 메시지
        const message = document.createElement('div');
        message.className = 'gb-content-item gb-content-message';
        message.textContent = entry.message || '';
        message.style.backgroundColor = entry.msgBg || '#00a8e8';
        message.style.fontSize = `${Math.max(12, 16 * card.scale)}px`;
        
        message.style.width = 'max-content';
        message.style.maxWidth = `${card.w - 30 * card.scale}px`;
        contentLayer.appendChild(message);

        requestAnimationFrame(() => {
            let messageW = message.offsetWidth || 130;
            let messageH = message.offsetHeight || 40;

            const messageBody = makeContentBody(card.w - 30 - messageW / 2, -80, messageW, messageH);
            Body.setAngle(messageBody, (Math.random() * 12 - 6) * Math.PI / 180);
            registerContent(messageBody, message);
        });

        Events.on(engine, 'afterUpdate', () => {
            contentBodies.forEach(body => {
                const meta = body.plugin;
                if (!meta || !meta.element) return;

                const el = meta.element;
                const w = meta.width;
                const h = meta.height;

                el.style.left = `${body.position.x - w / 2}px`;
                el.style.top = `${body.position.y - h / 2}px`;
                el.style.width = `${w}px`;
                el.style.height = `${h}px`;
                el.style.transform = `rotate(${body.angle}rad)`;
            });
        });

        const mouse = Mouse.create(render.canvas);
        mouse.pixelRatio = window.devicePixelRatio || 1;

        mouse.element.removeEventListener("mousewheel", mouse.mousewheel);
        mouse.element.removeEventListener("DOMMouseScroll", mouse.mousewheel);
        mouse.element.removeEventListener("wheel", mouse.mousewheel);

        const mouseConstraint = MouseConstraint.create(engine, {
            mouse,
            constraint: {
                stiffness: 0.24,
                damping: 0.08,
                render: { visible: false }
            }
        });

        Composite.add(engine.world, mouseConstraint);
        render.mouse = mouse;

        Events.on(mouseConstraint, 'mousemove', () => {
            render.canvas.style.cursor = 'none';
        });
        Events.on(mouseConstraint, 'startdrag', () => {
            render.canvas.style.cursor = 'none';
        });
        Events.on(mouseConstraint, 'enddrag', () => {
            render.canvas.style.cursor = 'none';
        });

        Events.on(engine, 'afterUpdate', () => {
            contentBodies.forEach(body => {
                const meta = body.plugin;
                if (!meta) return;

                const halfW = meta.width / 2;
                const halfH = meta.height / 2;
                const margin = 4; 

                const minX = halfW + margin;
                const maxX = card.w - halfW - margin;
                const minY = halfH + margin;
                const maxY = card.h - halfH - margin;

                let x = body.position.x;
                let y = body.position.y;
                let changed = false;

                if (x < minX) { x = minX; changed = true; }
                if (x > maxX) { x = maxX; changed = true; }
                if (y < minY) { y = minY; changed = true; }
                if (y > maxY) { y = maxY; changed = true; }

                if (changed) {
                    Body.setPosition(body, { x, y });
                    Body.setVelocity(body, {
                        x: body.velocity.x * 0.15,
                        y: body.velocity.y * 0.15
                    });
                    if (Math.abs(body.velocity.x) < 0.05 && Math.abs(body.velocity.y) < 0.05) {
                        Body.setVelocity(body, { x: 0, y: 0 });
                    }
                }
            });
        });

        Render.run(render);
        const runner = Runner.create();
        Runner.run(runner, engine);

        card.engine = engine;
        card.render = render;
        card.runner = runner;
        card.contentBodies = contentBodies;
        card.mouseConstraint = mouseConstraint;

        cardStates.push(card);
    };

    entries.forEach(createCard);

    window.addEventListener('resize', () => {
        layout = getLayout();
        const currentTop = getTopMargin(); 
        updateContainerHeight(); 

        cardStates.forEach((card, idx) => {
            const slot = idx + 1;
            const row = Math.floor(slot / layout.columns);
            const col = slot % layout.columns;

            card.x = layout.left + col * (layout.width + GAP);
            card.y = currentTop + row * (layout.height + GAP); 
            card.w = layout.width;
            card.h = layout.height;
            card.scale = layout.scale;

            card.frame.style.left = `${card.x}px`;
            card.frame.style.top = `${card.y}px`;
            card.frame.style.width = `${card.w}px`;
            card.frame.style.height = `${card.h}px`;

            card.render.canvas.width = card.w;
            card.render.canvas.height = card.h;
            card.render.options.width = card.w;
            card.render.options.height = card.h;

            card.contentBodies.forEach(body => {
                const meta = body.plugin;
                if (!meta) return;

                const halfW = meta.width / 2;
                const halfH = meta.height / 2;

                Body.setPosition(body, {
                    x: Math.max(halfW + 2, Math.min(card.w - halfW - 2, body.position.x)),
                    y: Math.max(halfH + 2, Math.min(card.h - halfH - 2, body.position.y))
                });
            });
        });
    });
}
