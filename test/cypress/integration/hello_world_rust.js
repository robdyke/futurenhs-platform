describe("Hello World", () => {
  it("Makes request", () => {
    cy.request("http://bs-local.com:3030/hello/Cypress").then((res) => {
      expect(res.status).to.equal(200);
      expect(res.body).to.contain("Hello, Cypress");
    });
  });
});
