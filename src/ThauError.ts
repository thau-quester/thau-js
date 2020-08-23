export default class ThauError {
  public message: string
  public status: number
  constructor(message: string, status: number = 500) {
    this.message = message
    this.status = status
  }
}
