// 연락처 페이지 테스트

describe('연락처 페이지', () => {
  beforeEach(() => {
    cy.visit('/contact');
  });

  it('연락처 폼이 정상적으로 보여야 한다', () => {
    cy.get('form').should('exist');
    cy.get('input[name="name"]').should('exist');
    cy.get('input[name="email"]').should('exist');
    cy.get('textarea[name="message"]').should('exist');
    cy.get('button[type="submit"]').should('exist');
  });

  it('유효하지 않은 제출 시 에러 메시지가 보여야 한다', () => {
    cy.get('button[type="submit"]').click();
    cy.get('.text-red-500').should('have.length.at.least', 1);
  });

  // 실제 폼 제출 테스트는 API mocking이 필요합니다.
});
