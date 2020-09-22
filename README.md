# Thau-JS

JavaScript wrapper around Thau API.

# Installation
```
npm install thau-js
```

or

```
yarn add thau-js
```

# Usage

```typescript
import { ThauJS } from '@thau-quester/thau-js'

const createThauClient = async () => {
  const client = await ThauJS.createClient('http://localhost:9000/api/v1')
  return client
}
```

# Available methods

All method return promises that can throw a ThauError in case when the status from the API is not 200.

* `getCurrentSession(): Promise<Session>` - returns the current session.
* `loginWithFacebook(): Promise<Session>` - logs the user using facebook and returns the created session.
* `loginWithGoogle(): Promise<Session>` - logs the user using google and returns the created session.
* `loginWithGithub(): Promise<Session>` - logs the user using github and returns the created session.
* `loginWithTwitter(): Promise<Session>` - logs the user using twitter and returns the created session.
* `loginWithPassword(email: string, password: string): Promise<Session>` - logs the user using password and returns the created session.
* `getUserById(id: number): Promise<User>` - returns a user for a given ID.
* `createUser(user: User, password: string): Promise<Session>` - creates a new user using password ccredentials and returns created session.
* `updateUser(user: User): Promise<User>` - updates the user and returns the new version of the user.
* `logout(sessionId?: number): Promise<void>` - logs the user out from ccurrent session, or from some specificc session.
* `listSessions(): Prommise<Omit<Session, "user">>[]` - returns a list of open sessions for current  user.
* `verifyUserEmail(verificationCode: string): Promise<void>` - validates the Email of the user for a given verification code.s

# Types

```typescript
export type User = {
  id?: 0
  email: string
  username?: string
  firstName?: string
  lastName?: string
  dateOfBirth?: Date
  gender?: string
  picture?: string
}

export type Session = {
  id: number
  strategy: Strategy
  user: User
}
```