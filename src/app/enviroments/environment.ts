// export const environment = {
//   production: true,
//   server: 'https://api.bjjclutch.com.br',
//   face_api: 'https://face-recognition.bjjclutch.com.br',
//   keycloak: {
//     url: 'https://auth.bjjclutch.com.br',
//     realm: 'bjjclutch',
//     clientId: 'jiu-admin',
//   },
// };

export const environment = {
  production: false,
  server: 'http://localhost:9080',
  face_api: 'http://localhost:9080/api',
  keycloak: {
    url: 'http://localhost:8180',
    realm: 'bjjclutch',
    clientId: 'bjj-manager',
  },
}

