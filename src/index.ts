import { initFBApi, initGoogleApi } from './utils'
import ThauError from './ThauError'

declare const FB: any
declare const gapi: any

export type FetchOptions = Omit<RequestInit, 'body' | 'method'>
export type BroadcastChannel = 'http' | 'kafka'
export type Strategy = 'facebook' | 'google' | 'password'
export type ThauConfigurations = {
  environment: string
  appName: string
  passwordStrategyConfiguration: {
    requireEmailVerification: boolean
  }
  googleStrategyConfiguration: {
    clientId: string
  }
  facebookStrategyConfiguration: {
    clientId: string
    graphVersion: string
  }
  availableStrategies: Strategy[]
  broadcastChannels: BroadcastChannel[]
  corsenabled: boolean
  jwtconfiguration: {
    encryptionAlgorithm: string
  }
}
export type User = {
  id?: number
  email: string
  username?: string
  firstName?: string
  lastName?: string
  dateOfBirth?: Date | string
  gender?: string
  picture?: string
}
export type Session = {
  id: number
  strategy: Strategy
  user: User
}
export type TokenDTO = {
  token: string
}

export class ThauJS {
  private url: string
  private fetchOptions?: FetchOptions
  private token?: string
  public configurations: ThauConfigurations

  private constructor(url: string, fetchOptions?: FetchOptions) {
    this.url = url
    this.fetchOptions = fetchOptions
    this.token = this.getToken()
  }

  private async init(): Promise<void> {
    this.configurations = await this.get('/configs')
    if (this.configurations.availableStrategies.indexOf('facebook') !== -1) {
      initFBApi(
        this.configurations.facebookStrategyConfiguration.clientId,
        this.configurations.facebookStrategyConfiguration.graphVersion
      )
    }

    if (this.configurations.availableStrategies.indexOf('google') !== -1) {
      initGoogleApi(this.configurations.googleStrategyConfiguration.clientId)
    }
  }

  public async getCurrentSession(): Promise<Session> {
    const session: Session = await this.get('/session')
    session.user.dateOfBirth = new Date(session.user.dateOfBirth)
    return session
  }

  public async loginWithFacebook(): Promise<Session> {
    if (this.configurations.availableStrategies.indexOf('facebook') === -1) {
      throw new ThauError('Facebook login strategy is not supported!', 400)
    }

    let fbUser: any = await new Promise((resolve, reject) => {
      FB.getLoginStatus((status: any) => {
        if (status.status === 'connected') {
          return resolve(status.authResponse)
        }

        resolve()
      })
    })

    if (!fbUser) {
      fbUser = await new Promise((resolve, reject) => {
        FB.login((response: any) => {
          if (response.authResponse) {
            return resolve(response.authResponse)
          }
          return resolve()
        })
      })
    }

    if (!fbUser) {
      throw new ThauError('Unauthorized', 401)
    }

    const data = {
      accessToken: fbUser.accessToken,
      userID: fbUser.userID,
    }

    await this.loginWith('facebook', data)
    const session = await this.getCurrentSession()
    return session
  }

  public async loginWithGoogle(): Promise<Session> {
    if (this.configurations.availableStrategies.indexOf('google') === -1) {
      throw new ThauError('Google login strategy is not supported!', 400)
    }

    if (!gapi.auth2) {
      await new Promise((resolve, reject) => {
        gapi.load('auth2', {
          callback: () => {
            gapi.auth2
              .init({
                client_id: this.configurations.googleStrategyConfiguration
                  .clientId,
              })
              .then(() => resolve())
              .catch((e: any) => {
                return reject(new ThauError(e.details))
              })
          },
          onerror: (e: any) => {
            return reject(new ThauError(e.details))
          },
        })
      })
    }

    const googleUser: any = await new Promise((resolve, reject) => {
      const authInstance = gapi.auth2.getAuthInstance()
      authInstance.isSignedIn.listen((success: any) => {
        if (success) {
          const user = authInstance.currentUser.get()
          return resolve(user)
        }
      })
      authInstance.signIn()
    })

    const data = {
      id_token: googleUser.getAuthResponse().id_token,
    }

    await this.loginWith('google', data)
    const session = await this.getCurrentSession()
    return session
  }

  public async loginWithPassword(
    email: string,
    password: string
  ): Promise<Session> {
    if (this.configurations.availableStrategies.indexOf('password') === -1) {
      throw new ThauError('Password login strategy is not supported!', 400)
    }

    await this.loginWith('password', { email, password })
    const session = await this.getCurrentSession()
    return session
  }

  public async getUserById(id: number): Promise<User> {
    return await this.get(`/users/${id}`)
  }

  public async verifyUserEmail(verificationCode: string): Promise<void> {
    return this.get(`/users/verification?code=${verificationCode}`)
  }

  public async createUser(user: User, password: string): Promise<Session> {
    const tokenDto = await this.post(`/users`, { user, password })
    this.setToken(tokenDto.token)
    return await this.getCurrentSession()
  }

  public async updateUser(user: User): Promise<User> {
    const updatedUser = await this.put(`/users/${user.id}`, user)
    return updatedUser
  }

  public async logout(): Promise<void> {
    this.setToken(undefined)
  }

  private async loginWith(strategy: Strategy, data: any): Promise<TokenDTO> {
    const tokenDto: TokenDTO = await this.post(`/session/${strategy}`, data)
    this.setToken(tokenDto.token)
    return tokenDto
  }

  private getHeaders() {
    const userDefinedHeaders = { ...this.fetchOptions?.headers }
    return {
      ...userDefinedHeaders,
      'x-thau-jwt': this.token,
    }
  }

  private async get(path: string): Promise<any> {
    let response
    let body
    try {
      response = await fetch(`${this.url}${path}`, {
        ...this.fetchOptions,
        headers: this.getHeaders(),
      })
      body = await response.json()
    } catch (e) {
      throw new ThauError(e.message)
    }
    await this.handleResponseError(response, body)
    return body
  }

  private async post(path: string, data: any): Promise<any> {
    let response
    let body
    try {
      response = await fetch(`${this.url}${path}`, {
        method: 'POST',
        ...this.fetchOptions,
        headers: {
          accept: 'application/json',
          'Content-Type': 'application/json',
          ...this.getHeaders(),
        },
        body: JSON.stringify(data),
      })

      body = await response.json()
    } catch (e) {
      throw new ThauError(e.message)
    }
    await this.handleResponseError(response, body)
    return body
  }

  private async put(path: string, data: any): Promise<any> {
    let response
    let body
    try {
      response = await fetch(`${this.url}${path}`, {
        method: 'PUT',
        ...this.fetchOptions,
        headers: {
          accept: 'application/json',
          'Content-Type': 'application/json',
          ...this.getHeaders(),
        },
        body: JSON.stringify(data),
      })

      body = await response.json()
    } catch (e) {
      throw new ThauError(e.message)
    }
    await this.handleResponseError(response, body)
    return body
  }

  private async handleResponseError(response: Response, body: any) {
    if (response.status !== 200) {
      let errorMessage: string = ''
      let errorStatus: number = 500

      if (body.status && body.message) {
        errorMessage = body.message
        errorStatus = body.status
      } else {
        errorMessage = response.statusText
        errorStatus = response.status
      }

      throw new ThauError(errorMessage, errorStatus)
    }
  }

  private getToken() {
    return localStorage.getItem('session_id')
  }

  private setToken(token: string) {
    this.token = token
    localStorage.setItem('session_id', token)
  }

  public static async createClient(url: string) {
    const client = new ThauJS(url)
    await client.init()
    return client
  }
}
