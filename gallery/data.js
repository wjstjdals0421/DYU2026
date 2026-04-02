const galleryData = [
    {
        id: 1,
        name: "강민준",
        studentId: "20200001",
        major: "Visual",
        projectName: "도시의 조각들",
        projectDesc: "현대 도시 공간 속에 숨겨진 기하학적 파편들을 수집하여 새로운 시각적 질서를 부여한 그래픽 디자인 프로젝트입니다.",
        imagePath: "./img/project1.jpg"
    },
    {
        id: 2,
        name: "김서연",
        studentId: "20200002",
        major: "Space",
        projectName: "고요의 잔상",
        projectDesc: "소음으로 가득한 일상 속에서 발견한 찰나의 정적을 빛과 그림자의 대비를 통해 시각화한 사진 연작입니다.",
        imagePath: "./img/project2.jpg"
    },
    {
        id: 3,
        name: "이도윤",
        studentId: "20200003",
        major: "Visual",
        projectName: "디지털 유기체",
        projectDesc: "인공지능 알고리즘이 생성하는 유기적인 곡선과 인간의 감성이 결합된 미래 지향적 인터랙티브 설치 미술입니다.",
        imagePath: "./img/project3.jpg"
    },
    {
        id: 4,
        name: "박예준",
        studentId: "20200004",
        major: "Space",
        projectName: "시간의 매듭",
        projectDesc: "전통적인 매듭 공예를 현대적인 소재와 결합하여 과거와 현재의 연결 고리를 탐구한 공예 디자인입니다.",
        imagePath: "./img/project4.jpg"
    },
    {
        id: 5,
        name: "최하윤",
        studentId: "20200005",
        major: "Visual",
        projectName: "보이지 않는 경계",
        projectDesc: "심리적 거리감을 시각적인 레이어의 중첩을 통해 표현하며 관계의 모호함을 탐구한 미디어 아트입니다.",
        imagePath: "./img/project5.jpg"
    },
    {
        id: 6,
        name: "윤주원",
        studentId: "20200006",
        major: "Space",
        projectName: "기억의 퇴적",
        projectDesc: "어린 시절의 파편화된 기억들을 질감이 있는 캔버스 위에 층층이 쌓아 올린 추상 회화 작업입니다.",
        imagePath: "./img/project6.jpg"
    },
    {
        id: 7,
        name: "임지우",
        studentId: "20200007",
        major: "Visual",
        projectName: "유동적 공간",
        projectDesc: "고정된 건축적 틀을 벗어나 사용자의 움직임에 따라 유연하게 변화하는 모듈형 가구 디자인 프로젝트입니다.",
        imagePath: "./img/project7.jpg"
    },
    {
        id: 8,
        name: "한준서",
        studentId: "20200008",
        major: "Space",
        projectName: "자연의 코드",
        projectDesc: "식물의 성장 패턴을 수학적 수식으로 변환하여 생성한 알고리즘 기반의 패턴 디자인 연구입니다.",
        imagePath: "./img/project8.jpg"
    },
    {
        id: 9,
        name: "오수아",
        studentId: "20200009",
        major: "Visual",
        projectName: "감정의 온도",
        projectDesc: "색채의 심리학적 효과를 활용하여 인간의 미묘한 감정 변화를 시각적 그라데이션으로 표현했습니다.",
        imagePath: "./img/project9.jpg"
    },
    {
        id: 10,
        name: "서지호",
        studentId: "20200010",
        major: "Space",
        projectName: "도시의 리듬",
        projectDesc: "번잡한 도심의 소음을 타이포그래피의 율동감으로 변환하여 도시의 생동감을 담아낸 포스터 시리즈입니다.",
        imagePath: "./img/project10.jpg"
    },
    {
        id: 11,
        name: "권유나",
        studentId: "20200011",
        major: "Visual",
        projectName: "투명한 대화",
        projectDesc: "유리 소재의 투명성을 활용하여 빛의 굴절과 투과가 만들어내는 대화적 공간을 연출한 오브제입니다.",
        imagePath: "./img/project11.jpg"
    },
    {
        id: 12,
        name: "황민서",
        studentId: "20200012",
        major: "Space",
        projectName: "숨겨진 질서",
        projectDesc: "일상 사물들의 무질서한 나열 속에서 발견한 기하학적 규칙성을 사진적 시각으로 포착했습니다.",
        imagePath: "./img/project12.jpg"
    },
    {
        id: 13,
        name: "안건우",
        studentId: "20200013",
        major: "Visual",
        projectName: "미래의 고고학",
        projectDesc: "수백 년 후의 관점에서 현재의 디지털 기기들을 유물처럼 재해석한 실험적인 조형 작업입니다.",
        imagePath: "./img/project13.jpg"
    },
    {
        id: 14,
        name: "송채원",
        studentId: "20200014",
        major: "Space",
        projectName: "마음의 풍경",
        projectDesc: "내면의 평온을 찾기 위한 여정을 수묵화의 농담 조절을 통해 현대적으로 재구성한 회화입니다.",
        imagePath: "./img/project14.jpg"
    },
    {
        id: 15,
        name: "전현우",
        studentId: "20200015",
        major: "Visual",
        projectName: "연결된 파편",
        projectDesc: "개별적으로 존재하는 데이터 조각들이 네트워크를 통해 하나의 유기적인 흐름을 형성하는 과정을 보여줍니다.",
        imagePath: "./img/project15.jpg"
    },
    {
        id: 16,
        name: "홍지민",
        studentId: "20200016",
        major: "Space",
        projectName: "빛의 텍스처",
        projectDesc: "다양한 표면의 질감이 빛을 받았을 때 나타나는 미묘한 변화를 극대화하여 표현한 매크로 영상 작업입니다.",
        imagePath: "./img/project16.jpg"
    },
    {
        id: 17,
        name: "유진서",
        studentId: "20200017",
        major: "Visual",
        projectName: "도시의 숲",
        projectDesc: "차가운 빌딩 숲 사이에 자연의 생명력을 불어넣는 게릴라 가드닝과 연계된 공공 디자인 제안입니다.",
        imagePath: "./img/project17.jpg"
    },
    {
        id: 18,
        name: "양하준",
        studentId: "20200018",
        major: "Space",
        projectName: "무의식의 항해",
        projectDesc: "꿈속에서 겪은 초현실적인 경험들을 콜라주 기법을 통해 몽환적으로 재현한 디지털 아트입니다.",
        imagePath: "./img/project18.jpg"
    },
    {
        id: 19,
        name: "백서현",
        studentId: "20200019",
        major: "Visual",
        projectName: "언어의 온도",
        projectDesc: "단어가 가진 감성적 무게를 글자의 획과 여백의 조절을 통해 시각적으로 전달하는 타이포그래피입니다.",
        imagePath: "./img/project19.jpg"
    },
    {
        id: 20,
        name: "남승우",
        studentId: "20200020",
        major: "Space",
        projectName: "침묵의 소리",
        projectDesc: "텅 빈 공간이 주는 중압감과 그 속에서 느껴지는 기묘한 안정감을 미니멀한 조형물로 표현했습니다.",
        imagePath: "./img/project20.jpg"
    },
    {
        id: 21,
        name: "조예은",
        studentId: "20200021",
        major: "Visual",
        projectName: "감각의 전이",
        projectDesc: "청각적 자극을 촉각적 질감으로 변환하여 시각장애인도 예술을 경험할 수 있도록 설계된 배리어 프리 디자인입니다.",
        imagePath: "./img/project21.jpg"
    },
    {
        id: 22,
        name: "심우진",
        studentId: "20200022",
        major: "Space",
        projectName: "데이터의 흔적",
        projectDesc: "개인의 디지털 활동 로그를 예술적 데이터 시각화 기법으로 풀어낸 퍼스널 브랜딩 프로젝트입니다.",
        imagePath: "./img/project22.jpg"
    },
    {
        id: 23,
        name: "노다은",
        studentId: "20200023",
        major: "Visual",
        projectName: "비가시적 영역",
        projectDesc: "적외선 카메라를 통해 포착한 열에너지의 흐름을 예술적 이미지로 승화시킨 과학 예술 융합 작업입니다.",
        imagePath: "./img/project23.jpg"
    },
    {
        id: 24,
        name: "신지훈",
        studentId: "20200024",
        major: "Space",
        projectName: "구조적 균형",
        projectDesc: "중력과 균형의 아슬아슬한 접점을 탐구하여 구조적인 안정감과 긴장감을 동시에 주는 키네틱 아트입니다.",
        imagePath: "./img/project24.jpg"
    },
    {
        id: 25,
        name: "성소윤",
        studentId: "20200025",
        major: "Visual",
        projectName: "기억의 조각",
        projectDesc: "오래된 가구의 부품들을 조합하여 새로운 기능을 부여함으로써 과거의 기억을 보존하는 업사이클링 디자인입니다.",
        imagePath: "./img/project25.jpg"
    },
    {
        id: 26,
        name: "차민규",
        studentId: "20200026",
        major: "Space",
        projectName: "평행 우주",
        projectDesc: "거울의 반사 원리를 활용하여 현실 공간 속에 또 다른 차원의 공간을 만들어내는 설치 미술입니다.",
        imagePath: "./img/project26.jpg"
    },
    {
        id: 27,
        name: "민서영",
        studentId: "20200027",
        major: "Visual",
        projectName: "정서적 환기",
        projectDesc: "향기와 색채를 결합하여 공간의 분위기를 즉각적으로 변화시키는 스마트 디퓨저 및 앱 디자인입니다.",
        imagePath: "./img/project27.jpg"
    },
    {
        id: 28,
        name: "구준혁",
        studentId: "20200028",
        major: "Space",
        projectName: "픽셀의 확장",
        projectDesc: "초기 디지털 게임의 픽셀 아트를 현대적인 대형 조형물로 재구성한 뉴트로 감성의 설치 프로젝트입니다.",
        imagePath: "./img/project28.jpg"
    },
    {
        id: 29,
        name: "엄지수",
        studentId: "20200029",
        major: "Visual",
        projectName: "상생의 고리",
        projectDesc: "인간과 동물이 도심 속에서 공존할 수 있는 친환경적인 주거 생태계 모델을 제안하는 건축 디자인입니다.",
        imagePath: "./img/project29.jpg"
    },
    {
        id: 30,
        name: "지현준",
        studentId: "20200030",
        major: "Space",
        projectName: "시간의 단면",
        projectDesc: "나무의 나이테가 가진 시간의 기록을 3D 스캐닝 기술을 통해 디지털 조각으로 변환한 작업입니다.",
        imagePath: "./img/project30.jpg"
    },
    {
        id: 31,
        name: "정유진",
        studentId: "20200031",
        major: "Visual",
        projectName: "무지개의 근원",
        projectDesc: "프리즘을 통해 분해된 빛의 스펙트럼이 공간을 어떻게 채우는지 실험적으로 보여주는 광학 아트입니다.",
        imagePath: "./img/project31.jpg"
    },
    {
        id: 32,
        name: "곽도훈",
        studentId: "20200032",
        major: "Space",
        projectName: "구조의 변주",
        projectDesc: "종이 접기(Origami) 원리를 응용하여 강도와 유연성을 동시에 확보한 종이 구조체 연구입니다.",
        imagePath: "./img/project32.jpg"
    },
    {
        id: 33,
        name: "문서하",
        studentId: "20200033",
        major: "Visual",
        projectName: "흐르는 형태",
        projectDesc: "액체의 유동성을 3D 프린팅 기술로 고정하여 역동적인 순간을 포착한 가구 오브제입니다.",
        imagePath: "./img/project33.jpg"
    },
    {
        id: 34,
        name: "주성민",
        studentId: "20200034",
        major: "Space",
        projectName: "도시의 그림자",
        projectDesc: "밤의 가로등 아래 생겨나는 도시의 그림자들을 기록하고 이를 패턴화하여 디자인에 적용했습니다.",
        imagePath: "./img/project34.jpg"
    },
    {
        id: 35,
        name: "강나윤",
        studentId: "20200035",
        major: "Visual",
        projectName: "감각의 공진",
        projectDesc: "심장 박동 수에 반응하여 시각적 이미지가 실시간으로 변화하는 바이오 피드백 미디어 아트입니다.",
        imagePath: "./img/project35.jpg"
    },
    {
        id: 36,
        name: "신준호",
        studentId: "20200036",
        major: "Space",
        projectName: "기하학적 조화",
        projectDesc: "복잡한 기계 부품들을 분해하여 완벽한 황금비율에 맞춰 재배열한 인포그래픽 포스터입니다.",
        imagePath: "./img/project36.jpg"
    },
    {
        id: 37,
        name: "유서현",
        studentId: "20200037",
        major: "Visual",
        projectName: "사라지는 것들",
        projectDesc: "기후 변화로 인해 멸종 위기에 처한 생물들의 모습을 얼음 조각으로 형상화하여 소멸의 과정을 보여줍니다.",
        imagePath: "./img/project37.jpg"
    },
    {
        id: 38,
        name: "양도윤",
        studentId: "20200038",
        major: "Space",
        projectName: "디지털 휴식",
        projectDesc: "스마트폰 중독을 방지하고 명상을 돕는 아날로그적 감성의 앱 인터페이스 및 기기 디자인입니다.",
        imagePath: "./img/project38.jpg"
    },
    {
        id: 39,
        name: "최지아",
        studentId: "20200039",
        major: "Visual",
        projectName: "우연의 일치",
        projectDesc: "물감을 떨어뜨려 생성되는 우연한 무늬들 속에서 구체적인 형상을 찾아내어 보정하는 디지털 드로잉입니다.",
        imagePath: "./img/project39.jpg"
    },
    {
        id: 40,
        name: "윤민재",
        studentId: "20200040",
        major: "Space",
        projectName: "경계의 확장",
        projectDesc: "가상 현실(VR)과 실제 공간이 겹쳐지는 지점에서 발생하는 새로운 공간 지각 경험을 탐구합니다.",
        imagePath: "./img/project40.jpg"
    }
];

export default galleryData;