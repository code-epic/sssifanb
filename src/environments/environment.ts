// The file contents for the current environment will overwrite these during build.
// The build system defaults to the dev environment which uses `environment.ts`, but if you do
// `ng build --env=prod` then `environment.prod.ts` will be used instead.
// The list of which env maps to which file can be found in `.angular-cli.json`.
export const environment = {
  production: false,
  id : 'ID-001',
  url: 'http://localhost',
  api: '/v1/api/',
  // API: '/devel/api/',
  hash: ':6366af5d4c4d4674f9ce04652ad0206c.sse',
  path: 'crud',
  functions: {
    master: 'CCEC_CMaestro',
    content: 'CCEC_CContenido'
  },
  subPath: {
    login: 'wusuario/login'
  }
};

