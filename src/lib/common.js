
const defaultOptions = {
  method: 'get',
  credentials: 'same-origin'
};

function getHeaders(headers = {}) {
  return {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    ...headers
  };
}

function getPatchHeaders(headers = {}) {
  return {
    Accept: 'application/json-patch+json',
    'Content-Type': 'application/json-patch+json',
    ...headers
  };
}

function checkStatus(response = {}) {
  if (response.ok) {
    switch (response.status) {
      case 201:
        return response.headers;
      case 204:
        return {};
      default:
        if (response.headers.get('content-type') === 'text/plain') {
          return response.text();
        }
        return response.json();
    }
  }

  const error = new Error(response.statusText);
  error.response = response;
  throw error;
}

function request(uri, options = defaultOptions) {
  return fetch(uri, {
    ...defaultOptions,
    ...options
  }).then(checkStatus);
}

function get(uri, headers) {
  return request(uri, {
    method: 'get',
    headers: getHeaders(headers)
  });
}

function post(uri, body) {
  return request(uri, {
    method: 'post',
    headers: getHeaders(),
    body: JSON.stringify(body)
  });
}

function put(uri, body) {
  return request(uri, {
    method: 'put',
    headers: getHeaders(),
    body: JSON.stringify(body)
  });
}

function deleteRequest(uri) {
  return request(uri, {
    method: 'delete',
    headers: getHeaders()
  });
}

function generateBodyForSecretPatching(secretName) {
  const patchAddBody = [
    {
      op: 'add',
      path: 'serviceaccount/secrets/-',
      value: {
        name: secretName
      }
    }
  ];

  return patchAddBody;
}

 function generateBodyForSecretReplacing(remainingSecrets) {
  const replaceBody = [
    {
      op: 'replace',
      path: 'serviceaccount/secrets',
      value: remainingSecrets
    }
  ];
  return replaceBody;
}

async function patchAddSecret(uri, secretName) {
  const patchAddBody = await generateBodyForSecretPatching(secretName);
  return request(uri, {
    method: 'PATCH',
    headers: await getPatchHeaders(),
    body: JSON.stringify(patchAddBody)
  });
}

async function patchUpdateSecrets(uri, secrets) {
  const patchReplaceBody = await generateBodyForSecretReplacing(secrets);
  return request(uri, {
    method: 'PATCH',
    headers: await getPatchHeaders(),
    body: JSON.stringify(patchReplaceBody)
  });
}

module.exports = {
  getHeaders,
  getPatchHeaders,
  checkStatus,
  request,
  get,
  post,
  put,
  deleteRequest, 
  generateBodyForSecretPatching, 
  generateBodyForSecretReplacing, 
  patchAddSecret, 
  patchUpdateSecrets
};
