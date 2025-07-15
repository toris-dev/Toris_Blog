// 검색 기능 테스트

describe('검색 기능', () => {
  beforeEach(() => {
    cy.visit('/posts'); // 검색 기능이 게시글 목록 페이지에 있다고 가정
  });

  it('검색 입력창이 보여야 한다', () => {
    cy.get('[data-cy="search-input"]').should('exist');
  });

  it('검색어 입력 시 게시글이 필터링되어야 한다', () => {
    cy.get('[data-cy="search-input"]').type('Next.js');
    cy.get('[data-cy="post-card"]', { timeout: 2000 }).should(
      'have.length.at.least',
      1
    );
    cy.get('[data-cy="post-card"]', { timeout: 2000 })
      .first()
      .should('contain', 'Next.js');
  });

  it('존재하지 않는 검색어 입력 시 결과 없음 메시지가 보여야 한다', () => {
    cy.get('[data-cy="search-input"]').type('asdfghjkl12345');
    cy.get('[data-cy="posts-list"]', { timeout: 2000 }).should('not.exist'); // 결과 리스트가 사라지거나 메시지 표시
    cy.get('[data-cy="no-results-message"]', { timeout: 2000 })
      .should('exist')
      .and('contain', 'No posts found');
  });
});
