# 진단 설문 저작 가이드

이 문서는 빌더스텝 "사업화 단계 진단" 설문의 **콘텐츠 저작자용 가이드**다.
코드(`packages/shared/src/domain.ts`)는 스키마와 구조만 정의하며, 문항 텍스트·배점·
단계 매핑 값은 창업자가 이 가이드에 따라 직접 채워 넣는다.

## 1. 설문 구성 원칙

- 총 문항 수: **10~12문항**. 너무 많으면 이탈이 늘고, 너무 적으면 단계 판별 정확도가 떨어진다.
- 각 문항은 프로젝트의 현재 상태를 객관적으로 확인할 수 있는 질문이어야 한다
  (예: "유료 결제를 받은 고객이 있습니까?" 와 같이 사실 확인형).
- 각 문항의 선택지(`options`)는 최소 2개 이상이며, 선택지마다 `score` 값을 가진다.
- 문항 순서(`order`)는 0부터 시작하는 정수이며, 설문 진행 순서를 결정한다.
- 문항 하나의 최고 배점 선택지 합이 전체 최고 점수 구간을 구성하므로, 문항 배점 합계가
  아래 8단계 매핑표의 최댓값과 일치하도록 설계한다.

## 2. 문항 스키마 (참고: `DiagnosisQuestion`, `DiagnosisSurvey`)

```json
{
  "id": "",
  "order": 0,
  "text": "",
  "options": [
    { "label": "", "score": 0 },
    { "label": "", "score": 0 }
  ]
}
```

설문 전체는 다음 형태로 문항 배열을 감싼다 (참고: `DiagnosisSurvey`).

```json
{
  "id": "",
  "version": 1,
  "questions": []
}
```

## 3. 8단계 매핑표 양식 (참고: `StageMapping`)

아래 표의 점수 구간(`minScore` ~ `maxScore`)은 **양 끝을 포함**한다(예: `minScore=11, maxScore=20`
이면 11점과 20점 모두 해당 단계). 구간은 서로 겹치지 않도록 설계하는 것이 원칙이나,
불가피하게 겹치는 경우 아래 4번 동점 규칙이 적용된다.

| 단계 (stage) | minScore | maxScore |
| --- | --- | --- |
| idea | | |
| validation | | |
| mvp | | |
| launch | | |
| user_acquisition | | |
| first_revenue | | |
| recurring_revenue | | |
| growth | | |

JSON 양식 (참고: `StageMapping`):

```json
{
  "version": 1,
  "tieRule": "lower-stage",
  "ranges": [
    { "stage": "idea", "minScore": 0, "maxScore": 0 },
    { "stage": "validation", "minScore": 0, "maxScore": 0 },
    { "stage": "mvp", "minScore": 0, "maxScore": 0 },
    { "stage": "launch", "minScore": 0, "maxScore": 0 },
    { "stage": "user_acquisition", "minScore": 0, "maxScore": 0 },
    { "stage": "first_revenue", "minScore": 0, "maxScore": 0 },
    { "stage": "recurring_revenue", "minScore": 0, "maxScore": 0 },
    { "stage": "growth", "minScore": 0, "maxScore": 0 }
  ]
}
```

## 4. 동점 규칙

- 총점이 여러 단계 구간에 동시에 해당하는 경우, 시스템은 `tieRule: "lower-stage"` 를
  적용하여 **더 낮은(이른) 단계**를 채택한다 (구현: `scoreToStage()`).
- 저작자는 원칙적으로 구간이 겹치지 않도록 설계해야 하며, 동점 규칙은 안전장치로만
  동작해야 한다.

## 5. 저작 체크리스트

- [ ] 문항 수가 10~12개인가?
- [ ] 모든 문항에 순서(`order`)가 0부터 중복 없이 부여되었는가?
- [ ] 모든 문항의 선택지가 2개 이상이고, 각 선택지에 배점이 있는가?
- [ ] 문항 배점의 최대 합계가 8단계 매핑표의 전체 점수 범위(0 ~ 최댓값)와 일치하는가?
- [ ] 8단계 매핑표의 8개 구간이 모두 채워졌는가?
- [ ] 매핑표 구간이 서로 겹치지 않는가? (겹치는 경우 의도된 것인지 재검토했는가?)
- [ ] 설문/매핑표에 `version` 번호가 부여되었는가? (재저작 시 버전을 올릴 것)
- [ ] 실제 1인 개발자 3인 이상을 대상으로 결과 단계가 체감과 일치하는지 검증했는가?
