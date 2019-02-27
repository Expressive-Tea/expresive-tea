async function appInitialize(server) {
  const ctx = require.context('../app/', true, /Module$/);
  ctx.keys().forEach(router => {
    const modules = ctx(router);
    for (const module in modules) {
      const modInstance = new modules[module]();
      modInstance.__register(server);
    }
  });
}

export default appInitialize;
