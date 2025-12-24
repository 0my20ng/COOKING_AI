# Google Gemini & Search API 키 발급 가이드

이 가이드는 **Cooking AI** 프로젝트 구동에 필요한 Google Gemini API 키와 Google Custom Search API 키(`GOOGLE_SEARCH_API_KEY`, `GOOGLE_SEARCH_CX`)를 발급받고 설정하는 방법을 설명합니다.

---

## 1. Gemini API 키 발급 (AI 기능용)

1.  **Google AI Studio 접속**
    *   [Google AI Studio](https://aistudio.google.com/app/apikey)에 접속하여 로그인합니다.
2.  **API 키 생성**
    *   **"Create API key"** 버튼을 클릭하여 키를 생성합니다.
3.  **다중 키 발급 (권장)**
    *   무료 사용량 제한(Rate Limit)을 피하기 위해, 서로 다른 Google 계정 등을 사용하여 **2~3개의 키**를 준비하는 것이 좋습니다.

---

## 2. Google Custom Search API 설정 (검색 기능용)

검색 기능을 사용하려면 **API Key**와 **검색 엔진 ID (CX)** 두 가지가 필요합니다.

### A. Search API 키 발급 (`GOOGLE_SEARCH_API_KEY`)
1.  **Google Cloud Console 접속**
    *   [Google Cloud Console](https://console.cloud.google.com/apis/credentials)에 접속합니다.
2.  **새 프로젝트 생성**
    *   상단 프로젝트 선택 메뉴에서 "새 프로젝트"를 만들어 선택합니다.
3.  **API 활성화**
    *   좌측 메뉴 [라이브러리]로 이동 -> "Custom Search API" 검색 -> **사용(Enable)** 클릭.
4.  **사용자 인증 정보(Credential) 만들기**
    *   좌측 메뉴 [사용자 인증 정보] -> [사용자 인증 정보 만들기] -> **API 키** 선택.
    *   생성된 키를 복사합니다. (이것이 `GOOGLE_SEARCH_API_KEY` 입니다)

### B. 검색 엔진 ID 발급 (`GOOGLE_SEARCH_CX`)
1.  **Programmable Search Engine 접속**
    *   [Google Programmable Search Engine](https://programmablesearchengine.google.com/controlpanel/all)에 접속합니다.
2.  **검색 엔진 추가**
    *   [추가] 버튼 클릭.
    *   **검색할 사이트**: "전체 웹 검색" 선택 (또는 특정 사이트 입력 후 나중에 변경).
    *   **검색 엔진 이름**: 원하는 이름 입력 (예: CookingAI).
    *   [만들기] 클릭.
3.  **CX ID 확인**
    *   생성된 검색 엔진 상세 페이지 -> [기본] 탭.
    *   **"검색엔진 ID"** 항목의 값을 복사합니다. (이것이 `GOOGLE_SEARCH_CX` 입니다)

---

## 3. 프로젝트 환경 변수 설정

프로젝트 루트의 `.env.local` 파일을 열고 아래와 같이 값을 입력하세요.

```bash
# .env.local 예시

# ------------------------------
# 1. Gemini AI 설정 (다중 키 지원)
# ------------------------------
GOOGLE_API_KEY=AIzaSy_첫번째_Gemini_키
GOOGLE_API_KEY_1=AIzaSy_두번째_Gemini_키
GOOGLE_API_KEY_2=AIzaSy_세번째_Gemini_키

# ------------------------------
# 2. Google Search 설정
# ------------------------------
GOOGLE_SEARCH_API_KEY=AIzaSy_Cloud_Console에서_받은_Search_키
GOOGLE_SEARCH_CX=0123456789:abcdefghijk_검색엔진ID
```

> **주의**: API 키는 절대 깃허브(GitHub) 등의 공개 저장소에 올리지 마세요. `.gitignore` 파일에 `.env.local`이 포함되어 있는지 확인하세요.
