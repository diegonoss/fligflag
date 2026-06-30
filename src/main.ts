import './styles.css'
import { AppController } from './app/appController'

async function main(): Promise<void> {
  try {
    const app = new AppController()
    await app.init()
  } catch (error) {
    console.error('Failed to start app:', error)
    document.body.innerHTML = '<div style="color: red; padding: 20px;">Failed to start game. Please refresh the page.</div>'
  }
}

main()
