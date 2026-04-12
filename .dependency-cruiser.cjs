/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    // Enforce package boundaries from architecture §5.1.8:
    // @kendraw/scene → nothing (framework-agnostic core)
    {
      name: 'scene-must-not-depend-on-react',
      severity: 'error',
      from: { path: '^packages/scene/' },
      to: { path: 'node_modules/(react|react-dom|zustand|@tanstack)' },
    },
    {
      name: 'scene-must-not-depend-on-other-packages',
      severity: 'error',
      from: { path: '^packages/scene/' },
      to: { path: '^packages/(chem|renderer-|persistence|io|api-client|ui)/' },
    },
    // @kendraw/chem → only scene
    {
      name: 'chem-must-not-depend-on-ui-or-renderers',
      severity: 'error',
      from: { path: '^packages/chem/' },
      to: { path: '^packages/(renderer-|persistence|io|api-client|ui)/' },
    },
    // @kendraw/renderer-canvas → only scene
    {
      name: 'renderer-canvas-must-not-depend-on-ui',
      severity: 'error',
      from: { path: '^packages/renderer-canvas/' },
      to: { path: '^packages/(chem|renderer-svg|persistence|io|api-client|ui)/' },
    },
    // @kendraw/renderer-svg → only scene
    {
      name: 'renderer-svg-must-not-depend-on-ui',
      severity: 'error',
      from: { path: '^packages/renderer-svg/' },
      to: { path: '^packages/(chem|renderer-canvas|persistence|io|api-client|ui)/' },
    },
    // @kendraw/persistence → only scene
    {
      name: 'persistence-must-not-depend-on-ui',
      severity: 'error',
      from: { path: '^packages/persistence/' },
      to: { path: '^packages/(chem|renderer-|io|api-client|ui)/' },
    },
    // @kendraw/api-client → nothing (standalone)
    {
      name: 'api-client-must-not-depend-on-packages',
      severity: 'error',
      from: { path: '^packages/api-client/' },
      to: { path: '^packages/(scene|chem|renderer-|persistence|io|ui)/' },
    },
    // General: no circular dependencies
    {
      name: 'no-circular',
      severity: 'error',
      from: {},
      to: { circular: true },
    },
  ],
  options: {
    doNotFollow: {
      path: 'node_modules',
    },
    tsPreCompilationDeps: true,
    tsConfig: {
      fileName: 'tsconfig.base.json',
    },
    enhancedResolveOptions: {
      exportsFields: ['exports'],
      conditionNames: ['import', 'require', 'node', 'default'],
    },
  },
};
