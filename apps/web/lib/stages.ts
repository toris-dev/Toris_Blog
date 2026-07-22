/** 사업화 8단계 콘텐츠 — shared stageEnum 순서와 동일한 도메인 계약 */
export interface StageInfo {
  key: string;
  n: number;
  name: string;
  en: string;
  question: string;
  description: string;
  help: string[];
}

export const STAGES: StageInfo[] = [
  { key: "idea", n: 1, name: "아이디어", en: "IDEA", question: "이 문제, 정말 풀 만한 문제인가?", description: "머릿속 아이디어를 문제·고객·해결 가설로 정리하는 단계.", help: ["문제 정의 템플릿", "타깃 고객 가설 세우기", "동료 빌더 피드백"] },
  { key: "validation", n: 2, name: "검증", en: "VALIDATION", question: "만들기 전에 팔릴지 확인했는가?", description: "랜딩·사전등록·인터뷰로 수요를 확인하는 단계.", help: ["검증 실험 설계", "사전등록 페이지 체크리스트", "인터뷰 질문 설계"] },
  { key: "mvp", n: 3, name: "MVP", en: "MVP", question: "핵심 가치만 담은 최소 제품은 무엇인가?", description: "몇 주 안에 만질 수 있는 최소 기능 제품을 만드는 단계.", help: ["범위 자르기 코칭", "스택 선택 가이드", "주간 진행 회고"] },
  { key: "launch", n: 4, name: "출시", en: "LAUNCH", question: "세상에 내놓을 준비가 되었는가?", description: "스토어·웹에 제품을 공개하고 첫 반응을 받는 단계.", help: ["출시 채널 체크리스트", "런칭 글 첨삭", "초기 지표 세팅"] },
  { key: "user_acquisition", n: 5, name: "사용자 확보", en: "ACQUISITION", question: "누가, 어디에서, 왜 오는가?", description: "반복 가능한 유입 채널을 찾는 단계.", help: ["채널 실험 로드맵", "SEO·콘텐츠 코칭", "지표 대시보드"] },
  { key: "first_revenue", n: 6, name: "첫 매출", en: "FIRST REVENUE", question: "누군가 지갑을 열 이유가 있는가?", description: "가격을 붙이고 첫 결제를 만드는 단계.", help: ["가격 정책 상담", "결제 도입 가이드", "전환 퍼널 점검"] },
  { key: "recurring_revenue", n: 7, name: "반복 매출", en: "RECURRING", question: "다음 달에도 결제가 이어지는가?", description: "구독·재구매로 매출을 반복 가능하게 만드는 단계.", help: ["구독 설계 상담", "이탈 방지 플레이북", "고객 인터뷰 지원"] },
  { key: "growth", n: 8, name: "사업 성장", en: "GROWTH", question: "혼자를 넘어 시스템으로 가는가?", description: "세무·법률·팀·투자 등 사업 확장을 준비하는 단계.", help: ["세무·법률 전문가 연결", "성장 전략 컨설팅", "빌더 네트워크"] },
];
