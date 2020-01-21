var fetchMock = require('fetch-mock');

var {
  checkStatus,
  generateBodyForSecretPatching,
  get,
  getHeaders,
  getPatchHeaders,
  patchAddSecret,
  post,
  request
} = require('../../src/lib/common.js');

const uri = 'http://example.com';

describe('getHeaders', () => {
  it('returns default headers when called with no params', () => {
    expect(getHeaders()).not.toBeNull();
  });

  it('combines custom headers with the default', () => {
    const customHeaders = {
      'X-Foo': 'Bar'
    };
    const result = getHeaders(customHeaders);
    expect(result).toMatchObject(customHeaders);
    expect(result).toMatchObject(getHeaders());
  });
});

describe('getPatchHeaders', () => {
  it('returns default headers when called with no params', () => {
    expect(getPatchHeaders()).not.toBeNull();
  });

  it('combines custom headers with the default', () => {
    const customHeaders = {
      'X-Foo': 'Bar'
    };
    const result = getPatchHeaders(customHeaders);
    expect(result).toMatchObject(customHeaders);
    expect(result).toMatchObject(getPatchHeaders());
  });
});

describe('checkStatus', () => {
  it('returns json on success', () => {
    const data = 'fake data';
    const json = jest.fn(() => data);
    expect(
      checkStatus({
        ok: true,
        headers: { get: () => 'application/json' },
        json
      })
    ).toEqual(data);
  });

  it('return text on success', () => {
    const data = 'fake data';
    const text = jest.fn(() => data);
    expect(
      checkStatus({
        ok: true,
        headers: { get: () => 'text/plain' },
        text
      })
    ).toEqual(data);
  });

  it('returns headers on successful create', () => {
    const status = 201;
    const headers = { fake: 'headers' };
    expect(checkStatus({ ok: true, headers, status })).toEqual(headers);
  });

  it('throws an error on failure', () => {
    const status = 400;
    expect(() => checkStatus({ status })).toThrow();
  });

  it('throws an error on empty response', () => {
    expect(() => checkStatus()).toThrow();
  });
});

describe('request', () => {
  it('returns the response from the given uri', () => {
    const data = {
      fake: 'data'
    };

    fetchMock.mock(uri, data);
    return request(uri).then(response => {
      expect(response).toEqual(data);
      fetchMock.restore();
    });
  });

  it('throws on error', () => {
    fetchMock.mock(uri, 400);
    expect.assertions(1);
    return request(uri).catch(e => {
      expect(e).not.toBeNull();
      fetchMock.restore();
    });
  });
});

describe('get', () => {
  it('makes a get request with the default headers', () => {
    const data = {
      fake: 'data'
    };
    fetchMock.get(uri, data);
    return get(uri).then(response => {
      expect(response).toEqual(data);
      fetchMock.restore();
    });
  });
});

describe('post', () => {
  it('makes a post request with the default headers and provided body', () => {
    const data = {
      fake: 'data'
    };
    fetchMock.post(uri, data);
    return post(uri, data).then(() => {
      const options = fetchMock.lastOptions();
      expect(options.body).toEqual(JSON.stringify(data));
      fetchMock.restore();
    });
  });
});

describe('generateBodyForSecretPatching', () => {
  it('should return secretResponse with the name Groot', () => {
    const secretName = 'Groot';
    const secretResponse = [
      {
        op: 'add',
        path: 'serviceaccount/secrets/-',
        value: {
          name: secretName
        }
      }
    ];
    const result = generateBodyForSecretPatching(secretName);
    expect(result).toMatchObject(secretResponse);
    expect(result).toMatchObject(generateBodyForSecretPatching(secretName));
  });
});

describe('patchAddSecret', () => {
  it('should return correct data from patching', () => {
    const data = {
      fake: 'data'
    };
    fetchMock.mock(uri, data);
    return patchAddSecret(uri, data).then(response => {
      expect(response).toEqual(data);
      fetchMock.restore();
    });
  });
});