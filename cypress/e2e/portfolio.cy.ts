describe('포트폴리오 페이지 테스트', () => {
  beforeEach(() => {
    cy.visit('/portfolio');
  });

  it('포트폴리오 페이지가 정상적으로 로드되어야 함', () => {
    // 페이지 제목 확인
    cy.get('h1').contains('포트폴리오').should('exist');

    // 주요 섹션이 존재하는지 확인
    cy.contains('프로젝트').should('exist');
    cy.contains('기술 스택').should('exist');
  });

  it('프로젝트 섹션 테스트', () => {
    // 프로젝트 카드 확인
    cy.get('[data-cy="projectCard"]').should('have.length.at.least', 1);

    // 첫 번째 프로젝트 카드 클릭
    cy.get('[data-cy="projectCard"]').first().click();

    // 프로젝트 세부 정보가 표시되는지 확인
    cy.get('[data-cy="projectDetail"]').should('be.visible');

    // 프로젝트 기술 스택 확인
    cy.get('[data-cy="projectTech"]').should('exist');

    // 닫기 버튼 클릭
    cy.get('[data-cy="closeDetail"]').click();
    cy.get('[data-cy="projectDetail"]').should('not.be.visible');
  });

  it('기술 스택 섹션 테스트', () => {
    // 기술 스택 아이템 확인
    cy.get('[data-cy="skillItem"]').should('have.length.at.least', 5);

    // 숙련도 바가 표시되는지 확인
    cy.get('[data-cy="skillBar"]').should('exist');
  });

  it('작업 이력 섹션 테스트', () => {
    // 작업 이력 섹션으로 스크롤
    cy.contains('작업 이력').scrollIntoView();

    // 작업 이력 아이템 확인
    cy.get('[data-cy="workHistoryItem"]').should('have.length.at.least', 1);

    // 날짜가 표시되는지 확인
    cy.get('[data-cy="workDate"]').should('exist');
  });

  it('연락 버튼 테스트', () => {
    // 연락하기 버튼 확인
    cy.get('[data-cy="contactButton"]').should('exist');

    // 버튼 클릭
    cy.get('[data-cy="contactButton"]').click();

    // 연락처 페이지로 이동 확인
    cy.url().should('include', '/contact');
  });

  it('애니메이션 효과 테스트', () => {
    // 포트폴리오 페이지 다시 방문
    cy.visit('/portfolio');

    // 스크롤 전에는 특정 요소가 보이지 않을 수 있음 (프레이머 모션 애니메이션)
    cy.get('[data-cy="animatedSection"]').should('exist');

    // 요소로 스크롤하면 보여야 함
    cy.get('[data-cy="animatedSection"]').scrollIntoView();
    cy.get('[data-cy="animatedSection"]').should('be.visible');
  });

  it('반응형 디자인 테스트', () => {
    // 모바일 뷰포트 설정
    cy.viewport('iphone-x');

    // 모바일에서는 그리드가 단일 컬럼으로 변경되어야 함
    cy.get('[data-cy="projectsGrid"]')
      .should('have.css', 'grid-template-columns')
      .and('match', /1fr/);

    // 태블릿 뷰포트 설정
    cy.viewport('ipad-2');

    // 태블릿에서는 그리드가 2열로 변경되어야 함
    cy.get('[data-cy="projectsGrid"]')
      .should('have.css', 'grid-template-columns')
      .and('match', /repeat\(2/);

    // 데스크톱 뷰포트 설정
    cy.viewport(1200, 800);

    // 데스크톱에서는 그리드가 3열로 변경되어야 함
    cy.get('[data-cy="projectsGrid"]')
      .should('have.css', 'grid-template-columns')
      .and('match', /repeat\(3/);
  });
});
