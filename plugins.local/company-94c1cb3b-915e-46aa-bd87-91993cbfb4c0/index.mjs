// Deliberately fail closed until a supported public job response is verified.
export default {
  provider: {
    id: 'company-94c1cb3b-915e-46aa-bd87-91993cbfb4c0',
    'fetch': async (entry, ctx) => {
      throw new Error('金山办公 HTTP adapter blocked: observed Moka response has non-JSON data; no verified job parser. See BLOCKED.md.');
    },
  },
};
