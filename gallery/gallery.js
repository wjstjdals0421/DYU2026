// 갤러리 데이터 모듈 임포트
import galleryData from './data.js';

// DOM 요소 획득
const contentDisplay = document.getElementById('gallery-content');
const navProject = document.getElementById('nav-project');
const navDesigner = document.getElementById('nav-designer');
const subTabContainer = document.getElementById('designer-sub-tabs');
const subTabs = document.querySelectorAll('.sub-tab');
const modalOverlay = document.getElementById('modal-overlay');
const modalContent = document.getElementById('modal-content');
const closeModal = document.querySelector('.close-btn');

// 스크롤 리빌 애니메이션 인터섹션 옵저버 설정
const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('active');
        }
    });
}, { threshold: 0.1 });

// 스크롤 애니메이션 관찰 적용 함수
function applyReveal() {
    const elements = document.querySelectorAll('.reveal');
    elements.forEach(el => revealObserver.observe(el));
}

// 작품 상세정보 모달 팝업 열기 함수
function openProjectDetail(id, clickedElement) {
    const data = galleryData.find(item => item.id == id);
    if (!data) return;

    if (clickedElement) {
        const rect = clickedElement.getBoundingClientRect();
        const originX = ((rect.left + rect.width / 2) / window.innerWidth) * 100;
        const originY = ((rect.top + rect.height / 2) / window.innerHeight) * 100;
        modalContent.style.transformOrigin = `${originX}% ${originY}%`;
    } else {
        modalContent.style.transformOrigin = 'center center';
    }

    document.getElementById('modal-author-info').textContent = `${data.name} (${data.studentId}) | ${data.major}`;
    document.getElementById('modal-project-name').textContent = data.projectName;
    document.getElementById('modal-project-desc').textContent = data.projectDesc;
    document.getElementById('modal-images').innerHTML = `<img src="./${data.imagePath}" onerror="this.style.display='none'">`;

    requestAnimationFrame(() => {
        modalOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    });
}

// 모달 팝업 닫기 함수
function closeProjectDetail() {
    modalOverlay.classList.remove('active');
    document.body.style.overflow = 'auto';
}

closeModal.addEventListener('click', closeProjectDetail);
modalOverlay.addEventListener('click', (e) => { if (e.target === modalOverlay) closeProjectDetail(); });

// Works 뷰 (작품 그리드) 렌더링 함수
function renderProjects() {
    if (navProject) navProject.classList.add('active');
    if (navDesigner) navDesigner.classList.remove('active');
    if (subTabContainer) subTabContainer.classList.remove('visible');
    
    let html = '<div id="project-grid">';
    galleryData.forEach((item, index) => {
        const delayClass = `delay-${(index % 4) + 1}`;
        html += `
            <div class="project-card reveal ${delayClass}" data-id="${item.id}">
                <div class="project-thumb">
                    <img src="./${item.imagePath}" alt="${item.projectName}" onerror="this.style.display='none'">
                </div>
                <div class="project-info">
                    <div class="author">${item.name} (${item.studentId})</div>
                    <h3>${item.projectName}</h3>
                    <p class="desc line-clamp line-clamp-2">${item.projectDesc}</p>
                </div>
            </div>
        `;
    });
    html += '</div>';
    contentDisplay.innerHTML = html;

    document.querySelectorAll('.project-card').forEach(card => {
        card.addEventListener('click', () => openProjectDetail(card.dataset.id, card));
    });
    
    applyReveal();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Designers 뷰 (디자이너 리스트 & 호버 프리뷰) 렌더링 함수
function renderDesigners(filterMajor = 'All') {
    if (navDesigner) navDesigner.classList.add('active');
    if (navProject) navProject.classList.remove('active');
    if (subTabContainer) subTabContainer.classList.add('visible');

    subTabs.forEach(tab => tab.classList.toggle('active', tab.dataset.major === filterMajor));

    const filteredData = filterMajor === 'All' 
        ? galleryData 
        : galleryData.filter(item => item.major === filterMajor);

    let html = `
        <div class="designer-wrapper">
            <div class="designer-list-container">
                <div class="designer-list-header-line"></div>
                <div id="designer-list">
    `;

    filteredData.forEach((item, index) => {
        const delayClass = `delay-${(index % 5) + 1}`;
        html += `
            <div class="designer-item reveal ${delayClass}" data-id="${item.id}" data-img="${item.imagePath || ''}">
                <span class="name">${item.name}</span>
                <span class="project-title line-clamp line-clamp-1">${item.projectName}</span>
                <span class="project-desc line-clamp line-clamp-1">${item.projectDesc || '작품 설명'}</span>
            </div>
        `;
    });

    html += `
                </div>
            </div>
            <div class="designer-preview-sticky">
                <div class="designer-preview-box" id="designer-preview-box">
                    <div class="designer-preview-placeholder" id="designer-preview-placeholder"></div>
                    <img id="designer-preview-img" src="" alt="" style="display:none;">
                </div>
            </div>
        </div>
    `;

    contentDisplay.innerHTML = html;

    const previewBox = document.getElementById('designer-preview-box');
    const previewImg = document.getElementById('designer-preview-img');
    const previewPlaceholder = document.getElementById('designer-preview-placeholder');
    const designerListElem = document.getElementById('designer-list');

    // 오른쪽 프리뷰 이미지 업데이트 함수
    function updatePreview(imgPath, title) {
        if (!previewImg) return;
        if (imgPath) {
            const img = new Image();
            img.src = `./${imgPath}`;
            img.onload = () => {
                previewImg.src = `./${imgPath}`;
                previewImg.alt = title || '';
                previewImg.style.display = 'block';
                if (previewPlaceholder) previewPlaceholder.style.display = 'none';
            };
            img.onerror = () => {
                previewImg.style.display = 'none';
                if (previewPlaceholder) previewPlaceholder.style.display = 'flex';
            };
        } else {
            previewImg.style.display = 'none';
            if (previewPlaceholder) previewPlaceholder.style.display = 'flex';
        }
    }

    // 마우스가 리스트 영역 밖으로 나가면 프리뷰 박스 숨기기
    if (designerListElem && previewBox) {
        designerListElem.addEventListener('mouseleave', () => {
            previewBox.classList.remove('active');
        });
    }

    // 각 디자이너 항목 마우스 호버 이벤트 바인딩
    document.querySelectorAll('.designer-item').forEach(item => {
        item.addEventListener('mouseenter', () => {
            const imgPath = item.dataset.img;
            const dataId = item.dataset.id;
            const itemData = galleryData.find(d => d.id == dataId);
            updatePreview(imgPath, itemData ? itemData.projectName : '');
            
            // 호버 시 프리뷰 박스 활성화 (보이게 설정)
            if (previewBox) previewBox.classList.add('active');
        });

        item.addEventListener('click', () => openProjectDetail(item.dataset.id, item));
    });

    applyReveal();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// 상단 Works / Designers 메뉴 클릭 이벤트 핸들러
if (navProject) navProject.addEventListener('click', (e) => { e.preventDefault(); renderProjects(); window.history.pushState({view: 'project'}, '', './gallery.html?view=project'); });
if (navDesigner) navDesigner.addEventListener('click', (e) => { e.preventDefault(); renderDesigners(); window.history.pushState({view: 'designer', major: 'All'}, '', './gallery.html?view=designer'); });

// 서브 탭 (All, Visual, Space) 클릭 이벤트 핸들러
subTabs.forEach(tab => {
    tab.addEventListener('click', () => {
        const major = tab.dataset.major;
        renderDesigners(major);
        window.history.pushState({view: 'designer', major: major}, '', `./gallery.html?view=designer&major=${major}`);
    });
});

// URL 쿼리 파라미터 확인 및 초기화
const urlParams = new URLSearchParams(window.location.search);
const view = urlParams.get('view');
const major = urlParams.get('major') || 'All';
if (view === 'designer') renderDesigners(major);
else renderProjects();

// 브라우저 뒤로가기 / 앞으로가기 처리
window.addEventListener('popstate', (e) => {
    const state = e.state;
    if (state && state.view === 'designer') renderDesigners(state.major || 'All');
    else renderProjects();
});
