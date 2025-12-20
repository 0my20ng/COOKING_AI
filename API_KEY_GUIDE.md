# API Key 발급 및 설정 가이드

아래 3가지 키가 모두 필요합니다. 하나라도 없거나 틀리면 오류가 발생할 수 있습니다.

## 1. Google Gemini API Key (AI용)
- **사이트**: [Google AI Studio](https://aistudio.google.com/app/apikey)
- **방법**:
  1. 위 링크 접속 및 구글 로그인.
  2. **"Create API key"** 버튼 클릭.
  3. 생성된 키(예: `AIzaSy...`)를 복사.
- **.env.local 입력**: `GOOGLE_API_KEY=복사한키`

## 2. Google Custom Search API Key (검색용)
- **사이트**: [Google Cloud Console (Credentials)](https://console.cloud.google.com/apis/credentials)
- **방법**:
  1. 프로젝트 선택(없으면 생성).
  2. **"+ CREATE CREDENTIALS"** -> **"API Key"** 선택.
  3. 생성된 키(예: `AIzaSy...`)를 복사.
- **.env.local 입력**: `GOOGLE_SEARCH_API_KEY=복사한키`
- **주의**: "Custom Search API"가 해당 프로젝트에서 **Enable(사용 설정)** 되어 있어야 합니다. ([여기서 확인](https://console.cloud.google.com/apis/library/customsearch.googleapis.com))

## 3. Search Engine ID (CX) (검색 엔진 설정)
- **사이트**: [Programmable Search Engine](https://programmablesearchengine.google.com/controlpanel/all)
- **방법**:
  1. **"Add"** 버튼 클릭.
  2. **"Search the entire web"**을 켜거나, 특정 사이트(*.naver.com 등)를 추가.
  3. 검색 엔진 생성 후, **"Customize"** 메뉴에서 **"Search engine ID"** (예: `a1b2c3d4e5f6...`) 복사.
- **.env.local 입력**: `GOOGLE_SEARCH_CX=복사한ID`

---

### `.env.local` 파일 예시 (띄어쓰기 없이 붙여넣으세요)
```env
# AI
GOOGLE_API_KEY=AIzaSyDxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Search
GOOGLE_SEARCH_API_KEY=AIzaSyBxxxxxxxxxxxxxxxxxxxxxxxxxxxx
GOOGLE_SEARCH_CX=01234567890123:abcdefghi
```
