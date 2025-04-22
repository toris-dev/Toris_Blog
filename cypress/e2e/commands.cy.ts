/*
 * 이 파일은 블로그 테스트에 사용되는 공통 명령어와 기능을 테스트합니다.
 * 또한 일반적인 Cypress 명령어 사용 예시를 제공합니다.
 */

describe('Cypress 테스트 명령어 예시', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('기본 명령어: 요소 선택 및 작업', () => {
    // 요소 선택 및 클릭
    cy.get('header a[href="/posts"]').click();

    // 텍스트가 포함된 요소 찾기
    cy.contains('블로그').should('exist');

    // 링크 찾기
    cy.get('a[href*="/posts/"]').should('have.length.at.least', 1);

    // 상위/하위 요소 탐색
    cy.get('footer').find('a').should('have.length.at.least', 1);

    // 특정 속성을 가진 요소 찾기
    cy.get('[data-cy="sidebarToggle"]').should('exist');
  });

  it('단언(assertion) 명령어', () => {
    // 존재 여부 확인
    cy.get('header').should('exist');

    // 텍스트 내용 확인
    cy.get('h1').should('contain', 'Next.js');

    // 가시성 확인
    cy.get('header').should('be.visible');

    // 클래스 확인
    cy.get('footer').should('have.class', 'border-t');

    // 속성 확인
    cy.get('a[href="/"]').should('have.attr', 'href', '/');

    // URL 확인
    cy.url().should('include', 'http');

    // 여러 단언 체이닝
    cy.get('header')
      .should('exist')
      .and('be.visible')
      .and('have.css', 'position', 'fixed');
  });

  it('사용자 동작 명령어', () => {
    // 클릭
    cy.get('a[href="/posts"]').click();

    // 입력
    cy.visit('/search');
    cy.get('input[type="search"]').type('Next.js');

    // 선택
    cy.visit('/contact');
    cy.get('select[name="subject"]').select('블로그 관련');

    // 체크박스
    cy.get('input[type="checkbox"]').check();

    // 입력 지우기
    cy.get('input[type="search"]').clear();

    // 포커스
    cy.get('input[type="search"]').focus();

    // 스크롤
    cy.get('footer').scrollIntoView();
  });

  it('탐색 및 API 요청 명령어', () => {
    // 페이지 방문
    cy.visit('/posts');

    // 뒤로 가기
    cy.go('back');

    // 앞으로 가기
    cy.go('forward');

    // 새로고침
    cy.reload();

    // API 요청 가로채기
    cy.intercept('GET', '/api/posts*', { fixture: 'posts.json' }).as(
      'getPosts'
    );
    cy.visit('/posts');
    cy.wait('@getPosts');

    // 요청 모의
    cy.intercept('POST', '/api/contact', {
      statusCode: 200,
      body: { success: true }
    }).as('contactForm');
  });

  it('기타 유용한 명령어', () => {
    // 로컬 스토리지 작업
    cy.window().then((win) => {
      win.localStorage.setItem('theme', 'dark');
    });

    // 쿠키 작업
    cy.setCookie('test-cookie', 'value');
    cy.getCookie('test-cookie').should('have.property', 'value', 'value');

    // 뷰포트 조정
    cy.viewport('iphone-x');
    cy.viewport(1280, 720);

    // 스크린샷 캡처
    cy.screenshot('home-page');

    // 커스텀 명령 사용 예시 (commands.ts에 정의해야 함)
    // cy.login('username', 'password');
  });
});
