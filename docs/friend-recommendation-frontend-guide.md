# 친구 추천(SAFE·MATCH) — 프론트엔드 연동 가이드

맞춤 친구 추천(`GET /recommendations`) 하나뿐인 기능이지만 제외 규칙과 실패 케이스가
많아 별도로 정리한다. `app/api/v1/recommendations.py`, `app/services/match.py` 라우터/서비스.
전체 API 스펙은 [api.md](api.md) 참고. 친구 요청/차단 자체의 연동은
[friend-frontend-guide.md](friend-frontend-guide.md) 참고.

공통: prefix `/api/v1` · 인증 `Authorization: Bearer <access_token>` · 에러
`{"detail": "..."}` · ID는 UUID. 로그인 필수(access_token 없으면 401).

## 1. 추천 목록 조회

```
GET /api/v1/recommendations
```

body/query 파라미터 없음 — 페이지네이션·limit 옵션이 없으므로 서버가 내려주는 리스트를
그대로 그리면 된다.

응답(`RecommendationListOut`, 200):

```json
{
  "items": [
    {
      "user_id": "uuid",
      "nickname": "닉네임",
      "bio": "자기소개 또는 null",
      "profile_image_url": "url 또는 null",
      "tags": ["TAG_CODE_1", "TAG_CODE_2"],
      "score": 0.87,
      "reasons": ["관심사가 비슷해요"]
    }
  ],
  "message": null
}
```

- `items`는 **이미 `score` 내림차순으로 정렬**돼서 온다 — FE에서 다시 정렬할 필요 없음.
  화면에 `score` 숫자를 그대로 노출할 필요는 없고(모델 내부 점수), 정렬 순서 자체가
  "얼마나 잘 맞는지"를 표현한다.
- `tags`는 관심사 태그의 **코드** 배열이다. 코드→표시 라벨 매핑은 다른 태그 관련 화면과
  동일한 마스터 데이터를 써야 하며, 이 엔드포인트가 라벨 문자열을 내려주지 않는다.
- `bio`, `profile_image_url`은 `null`일 수 있다.
- `reasons`는 모델이 만든 추천 사유 문장 배열이다. **서버가 장애/모드 관련 표현(예:
  "시각장애 모드가 같아요")을 필터링해서 제거**하므로(MATCH-04), 필터링 결과 `reasons`가
  빈 배열이어도 정상이다 — 카드 UI에서 사유가 없으면 그냥 안 보여주면 된다.

## 2. `message` — 빈 목록의 두 가지 의미

`items`가 비어 있을 때 `message`로 원인을 구분해서 내려준다. **둘 다 HTTP 200**이라
에러 처리가 아니라 `message` 값으로 분기해야 한다.

| `message` | 의미 | 권장 UI |
| --- | --- | --- |
| `"추천 정보가 부족합니다"` | 추천할 후보 자체가 없음(관심사 미설정, 이미 다 친구/차단/최근 거절, 같은 연령대 상대 없음 등) | 온보딩 유도(관심사 태그 등록 안내) 등 — 재시도 버튼보다는 "정보를 더 채워보라"는 안내 |
| `"지금은 추천을 만들 수 없어요. 잠시 후 다시 시도해 주세요"` | 매칭 모델 서버 장애/타임아웃(일시적) | 재시도 버튼 노출, 잠시 후 다시 당겨서 새로고침 유도 |
| `null` | `items`가 1개 이상 | 정상 표시 |

- 후보가 있었지만 모델 응답에서 해당 후보들이 다 걸러진 경우(예: 모델이 후보 풀에 없는
  user_id를 반환)도 `"추천 정보가 부족합니다"`로 통일된다.
- 이 엔드포인트는 실패해도 5xx를 던지지 않도록 설계돼 있다 — 네트워크 에러가 아닌 이상
  `catch`에서 별도 에러 토스트를 띄우지 말고 `message` 분기로 처리할 것.

## 3. 백엔드가 강제하는 제외 규칙 (FE는 신경 쓸 필요 없음)

아래는 서버가 항상 강제하는 규칙이라 FE에서 별도 필터링을 할 필요는 없지만, "왜 이
사람은 추천에 안 뜨지?" 문의 대응용으로 알아둘 것.

- 자기 자신
- 이미 친구인 상대
- 차단 관계(양방향 — 내가 차단했든 상대가 차단했든)
- **거절 후 30일 이내**인 상대(양방향) — [friend-frontend-guide.md §1-③](friend-frontend-guide.md)의
  `decline` 항목 참고
- **미성년(만 14~18세) ↔ 성인 상호 추천 제외**(§4.5) — 미성년 유저에게는 미성년만,
  성인 유저에게는 성인만 추천됨

## 4. 추천 카드에서 이어지는 액션

추천 카드 자체에는 액션 API가 없다. 카드에서 상대를 눌렀을 때 이어지는 동작은 기존
API를 그대로 쓰면 된다.

- 친구 요청: `POST /api/v1/friends/requests { "receiver_id": user_id }` —
  [friend-frontend-guide.md §1-①](friend-frontend-guide.md)
- 프로필 상세: `GET /users/{user_id}`
- 관심 없음/차단: `POST /api/v1/blocks { "user_id": user_id }` —
  [friend-frontend-guide.md §3](friend-frontend-guide.md)
- 친구 요청을 보낸 뒤 그 상대가 추천 목록에서 즉시 사라지지는 않는다(추천 리스트는 이
  호출 시점 스냅샷) — 요청 성공 시 FE에서 옵티미스틱하게 해당 카드를 숨기거나 버튼
  상태를 "요청됨"으로 바꾸는 걸 권장.

## 5. 에러 케이스 요약

| 상황 | 응답 | FE 처리 |
| --- | --- | --- |
| 로그인 안 함 | 401 | 로그인 화면으로 |
| 추천 후보 없음 | 200, `items: []`, `message: "추천 정보가 부족합니다"` | 온보딩/정보 보완 안내 |
| 모델 서버 장애 | 200, `items: []`, `message: "지금은 추천을 만들 수 없어요..."` | 재시도 유도 |

모든 에러는 `{ "detail": "<한국어 메시지>" }` 형식이며, `detail` 문자열이 아니라 HTTP
status + 엔드포인트 조합으로 분기하는 걸 권장한다.
