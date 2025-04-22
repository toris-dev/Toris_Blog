describe('검색 및 연락처 기능 테스트', () => {
  context('검색 기능 테스트', () => {
    beforeEach(() => {
      cy.visit('/search');
    });

    it('검색 페이지가 정상적으로 로드되어야 함', () => {
      cy.get('h1').contains('검색').should('exist');
      cy.get('input[type="search"]').should('exist');
    });

    it('검색어 입력 시 결과가 표시되어야 함', () => {
      // 검색어 입력
      cy.get('input[type="search"]').type('Next.js');

      // 디바운싱을 위한 대기
      cy.wait(500);

      // 검색 결과 확인
      cy.get('[data-cy="searchResults"]').should('exist');
    });

    it('검색 결과 클릭 시 해당 페이지로 이동해야 함', () => {
      // 검색어 입력
      cy.get('input[type="search"]').type('Next.js');

      // 디바운싱을 위한 대기
      cy.wait(500);

      // 검색 결과가 표시되면 첫 번째 결과 클릭
      cy.get('[data-cy="searchResults"] a').first().click();

      // URL에 posts/ 포함 확인
      cy.url().should('include', '/posts/');
    });

    it('검색 결과가 없을 때 "결과 없음" 메시지가 표시되어야 함', () => {
      // 존재하지 않을 검색어 입력
      cy.get('input[type="search"]').type('ThisQueryShouldNotExist12345');

      // 디바운싱을 위한 대기
      cy.wait(500);

      // "결과 없음" 메시지 확인
      cy.contains('검색 결과가 없습니다').should('exist');
    });
  });

  context('연락처 폼 테스트', () => {
    beforeEach(() => {
      cy.visit('/contact');
    });

    it('연락처 페이지가 정상적으로 로드되어야 함', () => {
      cy.get('h1').contains('연락처').should('exist');
    });

    it('폼 입력 필드가 모두 존재해야 함', () => {
      cy.get('input[name="name"]').should('exist');
      cy.get('input[name="email"]').should('exist');
      cy.get('select[name="subject"]').should('exist');
      cy.get('textarea[name="message"]').should('exist');
      cy.get('button[type="submit"]').should('exist');
    });

    it('폼 제출 테스트 (모의 제출)', () => {
      // 인터셉트 설정
      cy.intercept('POST', '/api/contact', {
        statusCode: 200,
        body: { success: true }
      }).as('formSubmit');

      // 폼 입력
      cy.get('input[name="name"]').type('Test User');
      cy.get('input[name="email"]').type('test@example.com');
      cy.get('select[name="subject"]').select('블로그 관련');
      cy.get('textarea[name="message"]').type(
        'This is a test message from Cypress'
      );

      // 폼 제출
      cy.get('button[type="submit"]').click();

      // 요청 확인
      cy.wait('@formSubmit');

      // 성공 메시지 확인
      cy.contains('메시지가 전송되었습니다').should('exist');
    });

    it('필수 필드 검증이 작동해야 함', () => {
      // 이름만 입력 (나머지는 비움)
      cy.get('input[name="name"]').type('Test User');

      // 제출 버튼 클릭
      cy.get('button[type="submit"]').click();

      // 폼이 제출되지 않고 페이지에 남아있어야 함
      cy.get('input[name="name"]').should('exist');

      // 이메일 필드에 유효하지 않은 포맷 입력
      cy.get('input[name="email"]').type('invalid-email');

      // 제출 버튼 클릭
      cy.get('button[type="submit"]').click();

      // 폼이 여전히 페이지에 남아있어야 함
      cy.get('input[name="name"]').should('exist');
    });
  });

  context('이용약관 페이지 테스트', () => {
    it('이용약관 페이지가 올바르게 로드되어야 함', () => {
      cy.visit('/terms');

      // 페이지 제목 확인
      cy.contains('이용약관').should('exist');

      // 각 섹션이 존재하는지 확인
      cy.contains('서문').should('exist');
      cy.contains('저작권 및 소유권').should('exist');
      cy.contains('콘텐츠 이용 조건').should('exist');
      cy.contains('블로그 포크 및 재사용 조건').should('exist');
      cy.contains('면책 조항').should('exist');
      cy.contains('연락처').should('exist');
    });
  });
});
