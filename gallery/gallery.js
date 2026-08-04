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

let currentView = 'project';
let currentMajor = 'All';

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
    
    // 시각디자인 전공 2개 이미지 지원
    if (data.major === 'Visual' && data.images && data.images.length > 1) {
        document.getElementById('modal-images').innerHTML = data.images.map(img => `<img src="./${img}" onerror="this.style.display='none'">`).join('');
    } else {
        document.getElementById('modal-images').innerHTML = `<img src="./${data.imagePath}" onerror="this.style.display='none'">`;
    }

    // 상세페이지 방명록 (Guestbook) 로드 연동
    loadGuestbook(data.id);

    // 상세페이지 인스타그램 스타일 좋아요 시스템 연동
    loadLikeSystem(data.id);

    requestAnimationFrame(() => {
        modalOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    });
}

// 인스타그램 스타일 좋아요 시스템 (localStorage 연동 영구 유지)
function loadLikeSystem(projectId) {
    const likeBtn = document.getElementById('insta-like-btn');
    const likeCountEl = document.getElementById('modal-like-count');
    if (!likeBtn || !likeCountEl) return;

    const countKey = `gsdd_likes_${projectId}`;
    const userLikedKey = `gsdd_user_liked_${projectId}`;

    // 초기 난수 기반 좋아요 수 세팅 (12 ~ 46개)
    let currentLikes = parseInt(localStorage.getItem(countKey) || (14 + (projectId * 9) % 32));
    let isLiked = localStorage.getItem(userLikedKey) === 'true';

    localStorage.setItem(countKey, currentLikes);

    function updateLikeUI() {
        likeCountEl.textContent = currentLikes;
        if (isLiked) {
            likeBtn.classList.add('liked');
        } else {
            likeBtn.classList.remove('liked');
        }
    }

    updateLikeUI();

    likeBtn.onclick = function () {
        if (isLiked) {
            currentLikes--;
            isLiked = false;
        } else {
            currentLikes++;
            isLiked = true;
            likeBtn.classList.add('pop-anim');
            setTimeout(() => likeBtn.classList.remove('pop-anim'), 350);
        }

        localStorage.setItem(countKey, currentLikes);
        localStorage.setItem(userLikedKey, isLiked);
        updateLikeUI();
    };
}

// 방명록 (Guestbook) 로드 및 렌더링 함수 (localStorage 저장 영구 연동)
function loadGuestbook(projectId) {
    const listEl = document.getElementById('modal-guestbook-list');
    const formEl = document.getElementById('guestbook-form');
    if (!listEl || !formEl) return;

    const storageKey = `gsdd_guestbook_${projectId}`;
    let comments = JSON.parse(localStorage.getItem(storageKey) || '[]');

    // 초기 샘플 응원 방명록 메시지 세팅 (등록된 코멘트 없을 시)
    if (comments.length === 0) {
        comments = [
            { name: "동문 후배", msg: "졸업 전시 너무 축하드려요! 작품 컨셉과 디테일이 멋집니다 🎉", date: "2026.11.10" },
            { name: "관람객 A", msg: "표현력이 훌륭해서 한참 감상했네요 👏 고생 많으셨습니다!", date: "2026.11.11" }
        ];
        localStorage.setItem(storageKey, JSON.stringify(comments));
    }

    function renderComments() {
        if (comments.length === 0) {
            listEl.innerHTML = `<div class="guestbook-empty">첫 번째 응원 방명록을 남겨주세요!</div>`;
        } else {
            listEl.innerHTML = comments.map(c => `
                <div class="guestbook-item">
                    <div class="guestbook-item-header">
                        <span class="guestbook-author">${escapeHtml(c.name)}</span>
                        <span class="guestbook-date">${c.date}</span>
                    </div>
                    <div class="guestbook-item-body">${escapeHtml(c.msg)}</div>
                </div>
            `).join('');
        }
        listEl.scrollTop = listEl.scrollHeight;
    }

    renderComments();

    // 폼 제출 시 localStorage 연동 저장
    formEl.onsubmit = function (e) {
        e.preventDefault();
        const nameInput = document.getElementById('guestbook-name-input');
        const msgInput = document.getElementById('guestbook-msg-input');

        const name = nameInput.value.trim();
        const msg = msgInput.value.trim();

        if (!name || !msg) return;

        const now = new Date();
        const dateStr = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')}.${String(now.getDate()).padStart(2, '0')}`;

        comments.push({ name, msg, date: dateStr });
        localStorage.setItem(storageKey, JSON.stringify(comments));

        renderComments();

        nameInput.value = '';
        msgInput.value = '';
    };
}

function escapeHtml(text) {
    return String(text).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

// 모달 팝업 닫기 함수
function closeProjectDetail() {
    modalOverlay.classList.remove('active');
    document.body.style.overflow = 'auto';
}

if (closeModal) closeModal.addEventListener('click', closeProjectDetail);
if (modalOverlay) modalOverlay.addEventListener('click', (e) => { if (e.target === modalOverlay) closeProjectDetail(); });

// 서브탭 활성화 상태 업데이트
function updateSubTabs(activeMajor) {
    currentMajor = activeMajor;
    subTabs.forEach(tab => tab.classList.toggle('active', tab.dataset.major === activeMajor));
}

// Works 뷰 (작품 그리드) 렌더링 함수 - 전공 필터링 지원 (All, Visual, Space)
function renderProjects(filterMajor = currentMajor) {
    currentView = 'project';
    updateSubTabs(filterMajor);

    if (navProject) navProject.classList.add('active');
    if (navDesigner) navDesigner.classList.remove('active');
    if (subTabContainer) subTabContainer.classList.add('visible');

    const filteredData = filterMajor === 'All' 
        ? galleryData 
        : galleryData.filter(item => item.major === filterMajor);

    let html = '<div id="project-grid">';
    filteredData.forEach((item, index) => {
        const delayClass = `delay-${(index % 4) + 1}`;
        html += `
            <div class="project-card reveal ${delayClass}" data-id="${item.id}">
                <div class="project-thumb">
                    <img src="./${item.imagePath}" alt="${item.projectName}" onerror="this.style.display='none'">
                </div>
                <div class="project-info">
                    <div class="author">${item.name} (${item.studentId})</div>
                    <h3>${item.projectName}</h3>
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

// Designers 뷰 (디자이너 리스트 & 호버 수직 2개 사각박스 프리뷰) 렌더링 함수
function renderDesigners(filterMajor = currentMajor) {
    currentView = 'designer';
    updateSubTabs(filterMajor);

    if (navDesigner) navDesigner.classList.add('active');
    if (navProject) navProject.classList.remove('active');
    if (subTabContainer) subTabContainer.classList.add('visible');

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
        
        // 작품이 2개인 시각디자인 전공은 두 줄로 표시
        let projectTitleHtml = '';
        if (item.major === 'Visual') {
            const title1 = item.projectName.split('/')[0] || item.projectName;
            const title2 = item.projectName.split('/')[1] || '디지털 유기체';
            projectTitleHtml = `
                <div class="project-title-group">
                    <span class="project-title line-clamp line-clamp-1">${title1}</span>
                    <span class="project-title line-clamp line-clamp-1">${title2}</span>
                </div>
            `;
        } else {
            projectTitleHtml = `
                <div class="project-title-group">
                    <span class="project-title line-clamp line-clamp-1">${item.projectName}</span>
                </div>
            `;
        }

        html += `
            <div class="designer-item reveal ${delayClass}" data-id="${item.id}" data-major="${item.major}">
                <span class="name">${item.name}</span>
                ${projectTitleHtml}
            </div>
        `;
    });

    html += `
                </div>
            </div>
            <div class="designer-preview-sticky" id="designer-preview-sticky">
                <div class="designer-preview-box" id="designer-preview-box">
                    <div class="designer-preview-placeholder">DESIGN PREVIEW</div>
                </div>
            </div>
        </div>
    `;

    contentDisplay.innerHTML = html;

    const previewSticky = document.getElementById('designer-preview-sticky');
    const designerListElem = document.getElementById('designer-list');

    // 프리뷰 영역 마우스 이탈 시 초기화
    if (designerListElem && previewSticky) {
        designerListElem.addEventListener('mouseleave', () => {
            previewSticky.innerHTML = `
                <div class="designer-preview-box">
                    <div class="designer-preview-placeholder">DESIGN PREVIEW</div>
                </div>
            `;
        });
    }

    // 각 디자이너 항목 마우스 호버 이벤트
    document.querySelectorAll('.designer-item').forEach(item => {
        item.addEventListener('mouseenter', () => {
            const dataId = item.dataset.id;
            const itemData = galleryData.find(d => d.id == dataId);

            if (previewSticky && itemData) {
                // 시각디자인(Visual) 전공의 경우 아래에 사각박스가 하나 더 있는 2개 수직 사각박스 노출
                if (itemData.major === 'Visual') {
                    const img1 = itemData.imagePath;
                    const img2 = (itemData.id % 2 === 0) ? 'img/project3.jpg' : 'img/project5.jpg';
                    previewSticky.innerHTML = `
                        <div class="designer-preview-box active">
                            <img src="./${img1}" alt="${itemData.name} 작품1" onerror="this.style.display='none'">
                        </div>
                        <div class="designer-preview-box active">
                            <img src="./${img2}" alt="${itemData.name} 작품2" onerror="this.style.display='none'">
                        </div>
                    `;
                } else {
                    // 공간디자인(Space) 전공의 경우 1개 사각박스 노출
                    previewSticky.innerHTML = `
                        <div class="designer-preview-box active">
                            <img src="./${itemData.imagePath}" alt="${itemData.projectName}" onerror="this.style.display='none'">
                        </div>
                    `;
                }
            }
        });

        item.addEventListener('click', () => openProjectDetail(item.dataset.id, item));
    });

    applyReveal();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// 상단 Works / Designers 메뉴 클릭 이벤트 핸들러
if (navProject) navProject.addEventListener('click', (e) => { 
    e.preventDefault(); 
    renderProjects(currentMajor); 
    window.history.pushState({view: 'project', major: currentMajor}, '', `./gallery.html?view=project&major=${currentMajor}`); 
});
if (navDesigner) navDesigner.addEventListener('click', (e) => { 
    e.preventDefault(); 
    renderDesigners(currentMajor); 
    window.history.pushState({view: 'designer', major: currentMajor}, '', `./gallery.html?view=designer&major=${currentMajor}`); 
});

// 서브 탭 (All, Visual, Space) 클릭 이벤트 핸들러 - Works & Designers 모두 동작
subTabs.forEach(tab => {
    tab.addEventListener('click', () => {
        const major = tab.dataset.major;
        if (currentView === 'designer') {
            renderDesigners(major);
            window.history.pushState({view: 'designer', major: major}, '', `./gallery.html?view=designer&major=${major}`);
        } else {
            renderProjects(major);
            window.history.pushState({view: 'project', major: major}, '', `./gallery.html?view=project&major=${major}`);
        }
    });
});

// URL 쿼리 파라미터 확인 및 초기화
const urlParams = new URLSearchParams(window.location.search);
const view = urlParams.get('view');
const major = urlParams.get('major') || 'All';
if (view === 'designer') renderDesigners(major);
else renderProjects(major);

// 브라우저 뒤로가기 / 앞으로가기 처리
window.addEventListener('popstate', (e) => {
    const state = e.state;
    if (state) {
        if (state.view === 'designer') renderDesigners(state.major || 'All');
        else renderProjects(state.major || 'All');
    } else {
        renderProjects('All');
    }
});
