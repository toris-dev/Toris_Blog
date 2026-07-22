/** 단계 진단 위저드 — 답변의 stage 하한 중 최댓값이 현재 단계가 된다 */
export interface DiagnosisOption {
  label: string;
  /** 이 답이 보장하는 최소 단계 */
  floor: number;
  /** 이 답을 고르면 진단 종료(아직 이전 단계라는 뜻) */
  stop?: boolean;
}

export interface DiagnosisQuestion {
  key: string;
  question: string;
  options: DiagnosisOption[];
}

export const DIAGNOSIS: DiagnosisQuestion[] = [
  {
    key: "product",
    question: "제품은 지금 어디까지 와 있나요?",
    options: [
      { label: "아이디어를 정리하는 중이다", floor: 1, stop: true },
      { label: "만들기 전에 수요를 확인하는 중이다", floor: 2, stop: true },
      { label: "MVP를 만드는 중이다", floor: 3, stop: true },
      { label: "이미 출시했다", floor: 4 },
    ],
  },
  {
    key: "users",
    question: "출시 후 사용자는 어떤가요?",
    options: [
      { label: "아직 사용자가 거의 없다", floor: 4, stop: true },
      { label: "초기 사용자가 조금씩 들어온다", floor: 5 },
      { label: "반복 가능한 유입 채널이 있다", floor: 5 },
    ],
  },
  {
    key: "revenue",
    question: "매출은 발생하고 있나요?",
    options: [
      { label: "아직 매출이 없다", floor: 5, stop: true },
      { label: "첫 결제가 나왔다", floor: 6 },
      { label: "구독·재구매로 매출이 반복된다", floor: 7 },
    ],
  },
  {
    key: "scale",
    question: "사업 확장은 어디까지 고민하나요?",
    options: [
      { label: "아직 제품과 매출에 집중한다", floor: 6 },
      { label: "세무·법률·팀·투자를 준비하기 시작했다", floor: 8 },
    ],
  },
];
