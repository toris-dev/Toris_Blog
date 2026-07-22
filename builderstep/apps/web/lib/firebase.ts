import { getApps, initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

/**
 * BuilderStep Firebase 프로젝트(builderstep-toris)의 웹 SDK 설정.
 * apiKey는 서버 비밀이 아니라 공개 식별자다 — 보안은 승인된 도메인과
 * ID 토큰 검증(API 워커)이 담당한다.
 */
const firebaseConfig = {
  apiKey: "AIzaSyCOurvIEc4I8RqM6XcrX9fG5r5rTV5hYxw",
  authDomain: "builderstep-toris.firebaseapp.com",
  projectId: "builderstep-toris",
  appId: "1:753374525052:web:ba728468fb412c41423bf9",
};

export const app = getApps()[0] ?? initializeApp(firebaseConfig);
export const auth = getAuth(app);

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });
