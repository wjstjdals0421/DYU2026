// 1. 로딩 제거
window.addEventListener('load', () => {
    const loader = document.getElementById('loading');
    setTimeout(() => {
        loader.style.opacity = '0';
        setTimeout(() => loader.style.display = 'none', 800);
    }, 1500);
});

// 2. 더보기/접기 토글 
const toggleBtn = document.getElementById('toggle-btn');
const hiddenItems = document.querySelectorAll('.hidden-item');
let isExpanded = false;

toggleBtn.addEventListener('click', () => {
    isExpanded = !isExpanded;
    hiddenItems.forEach(item => {
        item.style.display = isExpanded ? 'block' : 'none';
    });
    toggleBtn.innerText = isExpanded ? '접기 ∧' : '더보기 ∨';
    
    // 접었을 때 화면이 튀지 않도록 프로젝트 섹션으로 다시 이동 (옵션)
    if(!isExpanded) {
        document.getElementById('project').scrollIntoView();
    }
});

// 4. 스크롤 위치에 따른 메뉴 색상 업데이트 
const fullpage = document.getElementById('fullpage');
const sections = document.querySelectorAll('.section');
const navLinks = document.querySelectorAll('.nav-link');

fullpage.addEventListener('scroll', () => {
    let currentSectionId = "";
    
    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        // 섹션의 절반 이상이 화면에 보일 때 해당 섹션을 활성 상태로 간주
        if (fullpage.scrollTop >= sectionTop - section.clientHeight / 2) {
            currentSectionId = section.getAttribute('id');
        }
    });

    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${currentSectionId}`) {
            link.classList.add('active');
        }
    });
});