import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Env from '@ioc:Adonis/Core/Env'
import GitHubService from 'App/Services/GitHubService'

export default class GithubController {
  public async privateRepositories({ response }: HttpContextContract) {
    try {
      const githubService = new GitHubService(Env.get('GITHUB_APP_ID'), 'github-private-key.pem')
      const accessToken = await githubService.getAccessToken()
      console.log(accessToken)
      const repositories = await githubService.getRepositories(accessToken)
      console.log(repositories)
      return response.json(repositories)
    } catch (error) {
      return response.status(500).json({ error: error.message })
    }
  }
}
