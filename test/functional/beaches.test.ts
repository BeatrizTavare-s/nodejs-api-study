describe('Beaches functional tests', () => {
  describe('When creating a beach', () => {
    it('should create a beach with sucess', async () => {
      const newBeach = {
        lat: -33.7927,
        lng: 151.2889,
        name: 'Manly',
        position: 'E',
      };
      const response = await (await global.testRequest.post('/beaches').send(newBeach));
      expect(response.status).toBe(201);
      expect(response.body).toEqual(expect.objectContaining(newBeach));
    });
  });
});
