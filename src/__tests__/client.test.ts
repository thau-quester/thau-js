import { ThauJS } from '../index'

const globalAny: any = global
let client: ThauJS

jest.mock('../utils', () => ({
  initFBApi: () => { },
  initGoogleApi: () => { },
}))

it('Should fail if wrong URL is provided', async () => {
  globalAny.fetch = jest.fn().mockImplementation(async () => ({
    status: 400,
    json: async () => ({
      status: 400,
      message: 'Wrong API Url',
    }),
  }))
  try {
    await ThauJS.createClient('')
  } catch (e) {
    expect(e).toEqual({ message: 'Wrong API Url', status: 400 })
  }
})

it('Should create a client if valid URL is provided', async () => {
  globalAny.fetch = jest.fn().mockImplementation(async () => ({
    status: 200,
    json: async () =>
      ({
        availableStrategies: [],
      } as any),
  }))
  client = await ThauJS.createClient('')
  expect(client).toBeTruthy()
})

it('Should initialize needed SDKs for provided strategies', async () => {
  globalAny.fetch = jest.fn().mockImplementation(async () => ({
    status: 200,
    json: async () =>
      ({
        availableStrategies: ['facebook', 'password', 'google'],
        facebookStrategyConfiguration: {
          client_id: 1234,
          graphVersion: 'graph',
        },
        googleStrategyConfiguration: {
          client_id: 1234,
        },
      } as any),
  }))
  client = await ThauJS.createClient('')
  expect(globalAny.fetch).toBeCalledWith('/configs', {
    headers: { 'x-thau-jwt': null },
  })
  expect(client).toBeTruthy()
})

it('Should get the current session', async () => {
  globalAny.fetch = jest.fn().mockImplementation(async () => ({
    status: 200,
    json: async () =>
      ({
        id: 1,
        user: {
          dateOfBirth: '2020-02-02',
        },
        strategy: 'password',
      } as any),
  }))
  const session = await client.getCurrentSession()
  expect(globalAny.fetch).toBeCalledWith('/session', {
    headers: { 'x-thau-jwt': null },
  })
  expect(session.user.dateOfBirth).toEqual(new Date('2020-02-02'))
})

it('Should login using google', async () => {
  globalAny.fetch = jest.fn().mockImplementation(async (path, options) => {
    if (path === '/session/google') {
      return {
        status: 200,
        json: async () =>
          ({
            token: '1234',
          } as any),
      }
    }

    if (path === '/session') {
      return {
        status: 200,
        json: async () =>
          ({
            id: 1,
            user: {
              dateOfBirth: '2020-02-02',
            },
            strategy: 'google',
          } as any),
      }
    }
  })

  const mockAuthInstance = {
    grantOfflineAccess: jest.fn().mockImplementation(() =>
      Promise.resolve({
        code: 'code',
      })
    ),
  }
  globalAny.gapi = {
    auth2: {
      getAuthInstance: () => mockAuthInstance,
    },
  }

  const session = await client.loginWithGoogle()
  expect(mockAuthInstance.grantOfflineAccess).toBeCalled()
  expect(globalAny.fetch.mock.calls).toEqual([
    [
      '/session/google',
      {
        body: '{"code":"code","redirectURI":"http://localhost"}',
        headers: {
          'Content-Type': 'application/json',
          accept: 'application/json',
          'x-thau-jwt': null,
        },
        method: 'POST',
      },
    ],
    ['/session', { headers: { 'x-thau-jwt': '1234' } }],
  ])
  expect(session.id).toEqual(1)
})

it('Should login using facebook', async () => {
  globalAny.fetch = jest.fn().mockImplementation(async (path, options) => {
    if (path === '/session/facebook') {
      return {
        status: 200,
        json: async () =>
          ({
            token: '1234',
          } as any),
      }
    }

    if (path === '/session') {
      return {
        status: 200,
        json: async () =>
          ({
            id: 1,
            user: {
              dateOfBirth: '2020-02-02',
            },
            strategy: 'facebook',
          } as any),
      }
    }
  })
  globalAny.FB = {
    getLoginStatus: jest
      .fn()
      .mockImplementation((fn: any) => fn({ status: 'connected' })),
    login: jest
      .fn()
      .mockImplementation((fn: any) =>
        fn({ authResponse: { accessToken: 1234 } })
      ),
  }
  const session = await client.loginWithFacebook()
  expect(globalAny.FB.getLoginStatus).toBeCalled()
  expect(globalAny.FB.login).toBeCalled()
  expect(globalAny.fetch.mock.calls).toEqual([
    [
      '/session/facebook',
      {
        body: '{"accessToken":1234}',
        headers: {
          'Content-Type': 'application/json',
          accept: 'application/json',
          'x-thau-jwt': '1234',
        },
        method: 'POST',
      },
    ],
    ['/session', { headers: { 'x-thau-jwt': '1234' } }],
  ])
  expect(session.id).toEqual(1)
})

it('Should login with password', async () => {
  globalAny.fetch = jest.fn().mockImplementation(async (path, options) => {
    if (path === '/session/password') {
      return {
        status: 200,
        json: async () =>
          ({
            token: '1234',
          } as any),
      }
    }

    if (path === '/session') {
      return {
        status: 200,
        json: async () =>
          ({
            id: 1,
            user: {
              dateOfBirth: '2020-02-02',
            },
            strategy: 'password',
          } as any),
      }
    }
  })

  const session = await client.loginWithPassword('test', 'test')
  expect(globalAny.fetch.mock.calls).toEqual([
    [
      '/session/password',
      {
        body: '{"email":"test","password":"test"}',
        headers: {
          'Content-Type': 'application/json',
          accept: 'application/json',
          'x-thau-jwt': '1234',
        },
        method: 'POST',
      },
    ],
    ['/session', { headers: { 'x-thau-jwt': '1234' } }],
  ])
  expect(session.id).toEqual(1)
})

it('Should get a user by id', async () => {
  globalAny.fetch = jest.fn().mockImplementation(async (path, options) => {
    if (path === '/users/1') {
      return {
        status: 200,
        json: async () =>
          ({
            id: 1,
            dateOfBirth: '2020-02-02',
          } as any),
      }
    }
  })
  const user = await client.getUserById(1)
  expect(user.id).toEqual(1)
  expect(globalAny.fetch).toBeCalledWith('/users/1', {
    headers: { 'x-thau-jwt': '1234' },
  })
})

it('should create user', async () => {
  globalAny.fetch = jest.fn().mockImplementation(async (path, options) => {
    if (path === '/users') {
      return {
        status: 200,
        json: async () =>
          ({
            id: 1,
            email: 'test',
            dateOfBirth: '2020-02-02',
          } as any),
      }
    }

    if (path === '/session') {
      return {
        status: 200,
        json: async () =>
          ({
            id: 1,
            user: {
              id: 1,
              dateOfBirth: '2020-02-02',
            },
            strategy: 'password',
          } as any),
      }
    }
  })
  const session = await client.createUser(
    { email: 'test', dateOfBirth: '2020-02-02' },
    'password'
  )
  expect(session.id).toBe(1)
  expect(session.user.id).toBe(1)
  expect(globalAny.fetch.mock.calls).toEqual([
    [
      '/users',
      {
        body:
          '{"user":{"email":"test","dateOfBirth":"2020-02-02"},"password":"password"}',
        headers: {
          'Content-Type': 'application/json',
          accept: 'application/json',
          'x-thau-jwt': '1234',
        },
        method: 'POST',
      },
    ],
    [
      '/session',
      {
        headers: {
          'x-thau-jwt': undefined,
        },
      },
    ],
  ])
})
