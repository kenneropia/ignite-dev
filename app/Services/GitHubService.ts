import axios from 'axios'
import * as fs from 'fs'
import * as jwt from 'jsonwebtoken'

class GitHubService {
  private appId: string
  private privateKey: string
  private accessToken: string | null = null
  private accessTokenExpiry: Date | null = null

  constructor(appId: string, privateKeyPath: string) {
    this.appId = appId
    this.privateKey = fs.readFileSync(privateKeyPath, 'utf-8')
  }

  public async getAccessToken(): Promise<string> {
    try {
      if (this.accessToken && this.accessTokenExpiry && this.accessTokenExpiry > new Date()) {
        // Use cached token if available and not expired
        return this.accessToken
      }

      const installationId = await this.getInstallationId()
      const response = await axios.post(
        `https://api.github.com/app/installations/${installationId}/access_tokens`,
        { permissions: { metadata: 'read' } },
        {
          headers: {
            Authorization: `Bearer ${this.generateJWT()}`,
            Accept: 'application/vnd.github.v3+json',
          },
        }
      )

      this.accessToken = response.data.token
      this.accessTokenExpiry = new Date(response.data.expires_at)

      return this.accessToken!
    } catch (err) {
      console.error(err)
      throw err
    }
  }

  public async getRepositories(accessToken: string): Promise<any> {
    try {
      const response = await axios.get('https://api.github.com/user/repos', {
        params: {
          visibility: 'public',
        },
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/vnd.github.v3+json',
        },
      })

      return response.data
    } catch (err) {
      console.error(err)
      throw err
    }
  }

  private generateJWT(): string {
    const expirationTimeInMinutes = 50
    const issuedAt = Math.floor(Date.now() / 1000) - 60

    const payload = {
      iat: issuedAt,
      exp: issuedAt + expirationTimeInMinutes * 10,
      iss: this.appId,
    }

    const token = jwt.sign(payload, this.privateKey, { algorithm: 'RS256' })
    return token
  }

  private async getInstallationId(): Promise<number | null> {
    try {
      const response = await axios.get('https://api.github.com/app/installations', {
        headers: {
          Authorization: `Bearer ${this.generateJWT()}`,
          Accept: 'application/vnd.github.v3+json',
        },
      })

      const installations = response.data
      if (installations.length > 0) {
        const installationId = installations[0].id // Use the first installation
        return installationId
      } else {
        console.error('No installations found for the GitHub App.')
        return null
      }
    } catch (error) {
      console.error('Error fetching installations:', error.message)
      return null
    }
  }
}

export default GitHubService
