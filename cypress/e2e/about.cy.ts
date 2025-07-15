// 소개(About) 페이지 테스트

describe('소개 페이지', () => {
  beforeEach(() => {
    cy.visit('/about');
  });

  it('소개 페이지의 제목과 본문이 보여야 한다', () => {
    cy.get('h1').should('contain', 'About Me');
    cy.get('p').should('exist');
  });
});
