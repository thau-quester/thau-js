import { initFBApi, initGoogleApi } from './utils'
import ThauError from './ThauError'

declare const FB: any
declare const gapi: any
declare const IN: any

export { default as ThauError } from './ThauError'
export type FetchOptions = Omit<RequestInit, 'body' | 'method'>
export type BroadcastChannel = 'http' | 'kafka'
export type Strategy =
  | 'facebook'
  | 'google'
  | 'password'
  | 'github'
  | 'twitter'
  | 'linkedin'
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
  gitHubStrategyConfiguration: {
    clientId: string
  }
  linkedinStrategyConfiguration: {
    clientId: string
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
  open: boolean
  roles?: string[]
  hasRole: (role: string) => boolean
  hasAllRoles: (...roles: string[]) => boolean
  hasOneRoleOf: (...roles: string[]) => boolean
}
export type TokenDTO = {
  token: string
}
export type Provider = {
  id: number
  provider: Strategy
  provider_url?: string
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

  private async init(searchParams: URLSearchParams): Promise<void> {
    this.configurations = await this.get('/configs')

    if (this.isStrategySupported('facebook')) {
      try {
        console.log('Initializing Facebook SDK...')
        await initFBApi(
          this.configurations.facebookStrategyConfiguration.clientId,
          this.configurations.facebookStrategyConfiguration.graphVersion
        )
        console.log('Facebook SDK: done.')
      } catch (e) {
        console.log('Facebook SDK: FAILED.')
        this.configurations.availableStrategies.splice(
          this.configurations.availableStrategies.indexOf('facebook')
        )
        console.error(e)
      }
    }

    if (this.isStrategySupported('google')) {
      try {
        console.log('Initializing Google SDK...')
        await initGoogleApi(
          this.configurations.googleStrategyConfiguration.clientId
        )
        console.log('Google SDK: done.')
      } catch (e) {
        console.log('Google SDK: FAILED.')
        this.configurations.availableStrategies.splice(
          this.configurations.availableStrategies.indexOf('google')
        )
        console.error(e)
      }
    }

    try {
      await this.continueLoginFlow(searchParams)
    } catch (e) {
      console.error(e)
    }
  }

  private async continueLoginFlow(searchParams: URLSearchParams) {
    const currentLoginFlow = searchParams.get('strategy') as Strategy
    if (currentLoginFlow && this.isStrategySupported(currentLoginFlow)) {
      searchParams.delete('strategy')
      const data = {} as any
      searchParams.forEach((value, key) => {
        data[key] = value
      })
      const url = new URL(
        `${window.location.origin}${window.location.pathname}`
      )
      history.pushState(null, null, url.toString())

      if (currentLoginFlow === 'linkedin' && data.error) {
        throw new ThauError(data.error_description, 401)
      }

      if (currentLoginFlow === 'linkedin') {
        data.redirectURI = `${this.getRedirectURI()}?strategy=linkedin`
      }

      await this.loginWith(currentLoginFlow, data)
    }
  }

  public isStrategySupported(strategy: Strategy) {
    return this.configurations.availableStrategies.indexOf(strategy) !== -1
  }

  public async getCurrentSession(): Promise<Session> {
    const session: Session = await this.get('/session')
    session.user.dateOfBirth = new Date(session.user.dateOfBirth)
    session.hasRole = (role) => session.roles && session.roles.indexOf(role) !== -1
    session.hasAllRoles = (...roles) => session.roles && roles.every(session.hasRole)
    session.hasOneRoleOf = (...roles) => session.roles && roles.some(session.hasRole)
    return session
  }

  public async loginWithLinkedIn(): Promise<void> {
    if (!this.isStrategySupported('linkedin')) {
      throw new ThauError('LinkedIn login strategy is not supported!', 400)
    }

    let linkedinURI = `https://www.linkedin.com/oauth/v2/authorization?`
    linkedinURI += `response_type=code`
    linkedinURI += `&client_id=${this.configurations.linkedinStrategyConfiguration.clientId}`
    linkedinURI += `&redirect_uri=${this.getRedirectURI()}?strategy=linkedin`
    linkedinURI += `&state=${Math.random().toString(36).substring(7)}`
    linkedinURI += `&scope=r_emailaddress,r_liteprofile`

    window.location.href = linkedinURI
  }

  public async loginWithTwitter(): Promise<void> {
    try {
      await this.loginWith('twitter', {
        redirectURI: `${this.getRedirectURI()}?strategy=twitter`,
      })
    } catch (e) {
      if (e.status === 'FOUND') {
        window.location.href = e.message
      }
    }
  }

  public async loginWithGithub(): Promise<void> {
    if (!this.isStrategySupported('github')) {
      throw new ThauError('GitHub login strategy is not supported!', 400)
    }

    window.location.href = `https://github.com/login/oauth/authorize?scope=user:email&client_id=${this.configurations.gitHubStrategyConfiguration.clientId}`
  }

  public async loginWithFacebook(): Promise<Session> {
    if (!this.isStrategySupported('facebook')) {
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
    if (!this.isStrategySupported('google')) {
      throw new ThauError('Google login strategy is not supported!', 400)
    }

    const authInstance = gapi.auth2.getAuthInstance()
    const authResult = await authInstance.grantOfflineAccess()
    const redirectURI = this.getRedirectURI()
    if (authResult.code) {
      await this.loginWith('google', {
        code: authResult.code,
        redirectURI,
      })
    } else {
      throw new ThauError(authResult.error)
    }

    const session = await this.getCurrentSession()
    return session
  }

  public async loginWithPassword(
    email: string,
    password: string
  ): Promise<Session> {
    if (!this.isStrategySupported('password')) {
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

  public async logout(sessionId?: number): Promise<void> {
    try {
      await this.delete(`/session${sessionId ? `?sessionId=${sessionId}` : ''}`)
    } catch { }

    this.setToken(undefined)
  }

  public async listSessions(): Promise<Omit<Session, 'user'>[]> {
    return await this.get('/session/open')
  }

  public async getUserProviders(userId?: number): Promise<Provider[]> {
    return await this.get(`/providers${userId ? `?userId=${userId}` : ''}`)
  }

  public async authFetch(url: string, init?: RequestInit): Promise<Response> {
    return await fetch(url, {
      ...init,
      headers: {
        ...(init ? init.headers : {}),
        'x-thau-jwt': this.token,
      }
    })
  }

  private async loginWith(strategy: Strategy, data: any): Promise<TokenDTO> {
    const tokenDto: TokenDTO = await this.post(`/session/${strategy}`, data)
    this.setToken(tokenDto.token)
    return tokenDto
  }

  private getRedirectURI() {
    let redirectURI = window.location.origin + window.location.pathname
    if (redirectURI.charAt(redirectURI.length - 1) === '/') {
      redirectURI = redirectURI.slice(0, -1)
    }
    return redirectURI
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

  private async delete(path: string, data?: any): Promise<any> {
    let response
    let body
    try {
      response = await fetch(`${this.url}${path}`, {
        method: 'DELETE',
        ...this.fetchOptions,
        headers: {
          accept: 'application/json',
          'Content-Type': 'application/json',
          ...this.getHeaders(),
        },
        body: data ? JSON.stringify(data) : data,
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

  public static async createClient(url: string, fetchOptions?: FetchOptions) {
    const client = new ThauJS(url, fetchOptions)
    const urlSearchParams = new URLSearchParams(window.location.search)

    await client.init(urlSearchParams)
    return client
  }
}

// @ts-ignore
window.ThauJS = ThauJS
